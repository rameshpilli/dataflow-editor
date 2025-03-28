
import os
import json
import uuid
import base64
from typing import List, Optional, Dict, Any, Union
from fastapi import FastAPI, HTTPException, Depends, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential, ClientSecretCredential, ChainedTokenCredential
from azure.core.exceptions import ResourceNotFoundError, ClientAuthenticationError
import pandas as pd
import pyarrow.parquet as pq
import logging
import os
import platform

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="ADLS Manager API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ADLSCredentials(BaseModel):
    useManagedIdentity: bool = False
    connectionString: Optional[str] = None
    accountName: Optional[str] = None
    accountKey: Optional[str] = None
    containerFilter: Optional[List[str]] = None
    tenantId: Optional[str] = None
    clientId: Optional[str] = None
    useUserCredentials: Optional[bool] = False

class ConnectionRequest(BaseModel):
    credentials: ADLSCredentials
    name: str

class ConnectionResponse(BaseModel):
    id: str
    name: str
    credentials: ADLSCredentials
    status: str = "connected"
    createdAt: str

class Container(BaseModel):
    id: str
    name: str
    type: str
    path: str
    lastModified: Optional[str] = None
    folderCount: Optional[int] = None
    blobCount: Optional[int] = None
    hasDatasetFiles: Optional[bool] = None

class Folder(BaseModel):
    id: str
    name: str
    path: str
    containerName: str
    lastModified: Optional[str] = None
    folderCount: Optional[int] = None
    blobCount: Optional[int] = None
    hasDatasetFiles: Optional[bool] = None
    datasetFormats: Optional[List[str]] = None

class FolderTreeNode(BaseModel):
    id: str
    name: str
    type: str
    path: Optional[str] = None
    format: Optional[str] = None
    children: List['FolderTreeNode'] = []
    metadata: Optional[Dict[str, Any]] = None

class DatasetColumn(BaseModel):
    name: str
    type: str
    nullable: bool
    stats: Optional[Dict] = None
    validation: Optional[Dict] = None

class Dataset(BaseModel):
    id: str
    name: str
    path: str
    format: str
    columns: List[DatasetColumn]
    rowCount: Optional[int] = None
    repairedCount: Optional[int] = None
    lastModified: Optional[str] = None
    size: Optional[int] = None
    partitionColumns: Optional[List[str]] = None

class DataRow(BaseModel):
    __id: str
    __modified: Optional[bool] = None
    data: Dict[str, Any]

class DatasetPreview(BaseModel):
    columns: List[DatasetColumn]
    rows: List[Dict[str, Any]]
    totalRows: int
    page: int
    pageSize: int
    totalPages: int

class FileTypeResponse(BaseModel):
    hasDatasetFiles: bool
    formats: List[str]

class AuthMethodsResponse(BaseModel):
    supportsManagedIdentity: bool
    supportsConnectionString: bool
    supportsAccountKey: bool
    recommendedMethod: Optional[str] = None
    environmentInfo: Dict[str, bool]

# In-memory storage
connections = {}
temp_storage = {}

# Helper functions
def get_datalake_service_client(credentials: ADLSCredentials):
    try:
        if credentials.useManagedIdentity:
            # Use Managed Identity
            if not credentials.accountName:
                raise ValueError("Account name is required when using managed identity")
            
            if credentials.useUserCredentials:
                # Use current user identity (works in corporate environments with LDAP/AD)
                credential = DefaultAzureCredential(exclude_managed_identity_credential=True)
            elif credentials.clientId:
                # Use specific managed identity
                credential = ManagedIdentityCredential(client_id=credentials.clientId)
            else:
                # Use system-assigned managed identity
                credential = ManagedIdentityCredential()
                
            # If tenant ID is provided, use it
            if credentials.tenantId:
                # Chain credentials to try tenant-specific and default
                tenant_credential = ClientSecretCredential(
                    tenant_id=credentials.tenantId,
                    client_id=credentials.clientId or "",
                    client_secret=""  # Empty for managed identity
                )
                credential = ChainedTokenCredential(tenant_credential, credential)
                
            return DataLakeServiceClient(
                account_url=f"https://{credentials.accountName}.dfs.core.windows.net",
                credential=credential
            )
        elif credentials.connectionString:
            # Use connection string
            return DataLakeServiceClient.from_connection_string(credentials.connectionString)
        elif credentials.accountName and credentials.accountKey:
            # Use account key
            return DataLakeServiceClient(
                account_url=f"https://{credentials.accountName}.dfs.core.windows.net",
                credential=credentials.accountKey
            )
        else:
            raise ValueError("Invalid credentials. Provide either managed identity, connection string, or account name and key.")
    except ClientAuthenticationError as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating DataLake client: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create DataLake client: {str(e)}")

def detect_container_type(name: str) -> str:
    """Detect container type based on its name."""
    name_lower = name.lower()
    if "ingress" in name_lower:
        return "ingress"
    elif "bronze" in name_lower:
        return "bronze"  
    elif "silver" in name_lower:
        return "silver"
    elif "gold" in name_lower:
        return "gold"
    else:
        return "other"

def get_folders_from_paths(container_client, prefix=""):
    """Extract folders from paths in a container."""
    folders = set()
    paths = container_client.get_paths(path=prefix)
    
    for path in paths:
        path_name = path.name
        if prefix:
            # Remove the prefix from the path
            if path_name.startswith(prefix):
                path_name = path_name[len(prefix):]
                
        # Skip if this is the prefix itself
        if not path_name:
            continue
            
        # Extract the folder name (first segment after prefix)
        parts = path_name.split('/')
        if len(parts) > 0 and parts[0]:
            folders.add(parts[0])
    
    return list(folders)

def infer_schema_from_parquet(file_path):
    """Infer schema from a parquet file."""
    try:
        parquet_schema = pq.read_schema(file_path)
        columns = []
        
        for field in parquet_schema.names:
            field_type = parquet_schema.field(field).type
            columns.append({
                "name": field,
                "type": str(field_type),
                "nullable": not parquet_schema.field(field).nullable
            })
            
        return columns
    except Exception as e:
        logger.error(f"Error inferring schema: {str(e)}")
        return []

def check_for_dataset_files(container_client, folder_path):
    """Check if a folder contains delta or parquet files."""
    formats = set()
    has_dataset_files = False
    
    # Get all paths in the folder
    try:
        paths = list(container_client.get_paths(path=folder_path, recursive=True))
        
        for path in paths:
            path_name = path.name.lower()
            
            # Check if it's a delta or parquet file
            if path_name.endswith('.parquet'):
                formats.add('parquet')
                has_dataset_files = True
            elif '_delta_log' in path_name or (
                path_name.endswith('.json') and any(p in path_name for p in ['_commit', '_metadata'])
            ):
                formats.add('delta')
                has_dataset_files = True
                
        return has_dataset_files, list(formats)
    except Exception as e:
        logger.error(f"Error checking for dataset files: {str(e)}")
        return False, []

def build_folder_tree(connection_id, service_client, container_filter=None):
    """Build the full folder tree structure."""
    tree = {
        'id': 'root',
        'name': 'Root',
        'type': 'root',
        'children': []
    }
    
    # List all containers
    try:
        for container in service_client.list_file_systems():
            container_name = container.name
            
            # Apply filter if specified
            if container_filter and container_name.lower() not in [c.lower() for c in container_filter]:
                continue
                
            container_id = str(uuid.uuid4())
            container_node = {
                'id': container_id,
                'name': container_name,
                'type': 'container',
                'path': container_name,
                'children': [],
                'metadata': {
                    'lastModified': container.last_modified.isoformat() if hasattr(container, 'last_modified') else None
                }
            }
            
            # Get the container client
            container_client = service_client.get_file_system_client(container_name)
            
            # First level folders
            add_folders_to_tree(container_client, container_node, container_name, '')
            
            tree['children'].append(container_node)
            
        return tree
    except Exception as e:
        logger.error(f"Error building folder tree: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to build folder tree: {str(e)}")

def add_folders_to_tree(container_client, parent_node, container_name, prefix, max_depth=10, current_depth=0):
    """Recursively add folders to the tree."""
    if current_depth >= max_depth:
        return
        
    try:
        # Get paths at this level
        paths = container_client.get_paths(path=prefix, recursive=False)
        
        # Group paths by folder
        folders = {}
        for path in paths:
            path_name = path.name
            
            # Skip if path is empty or this is the prefix itself
            if not path_name or path_name == prefix:
                continue
                
            # Remove prefix from path if needed
            if prefix and path_name.startswith(prefix):
                if prefix.endswith('/'):
                    path_name = path_name[len(prefix):]
                else:
                    path_name = path_name[len(prefix) + 1:]
                    
            # Skip if path is empty after removing prefix
            if not path_name:
                continue
                
            # Get the folder name (first segment)
            parts = path_name.split('/')
            folder_name = parts[0]
            
            # This is a file at this level
            if len(parts) == 1 and not path.is_directory:
                file_type = 'unknown'
                file_path = f"{container_name}/{prefix}/{path_name}".replace('//', '/')
                
                # Check if it's a dataset file
                if path_name.endswith('.parquet'):
                    file_type = 'parquet'
                elif '_delta_log' in path_name:
                    file_type = 'delta'
                    
                if file_type in ['parquet', 'delta']:
                    # This is a dataset file
                    parent_node['metadata'] = parent_node.get('metadata', {})
                    parent_node['metadata']['hasDatasetFiles'] = True
                    
                    # Add dataset node to parent
                    dataset_id = str(uuid.uuid4())
                    dataset_name = os.path.basename(path_name)
                    if dataset_name.endswith('.parquet'):
                        dataset_name = dataset_name[:-8]  # Remove .parquet extension
                        
                    dataset_node = {
                        'id': dataset_id,
                        'name': dataset_name,
                        'type': 'dataset',
                        'format': file_type,
                        'path': file_path,
                        'children': []
                    }
                    
                    parent_node['children'].append(dataset_node)
            else:
                # This is a folder
                if folder_name not in folders:
                    folder_id = str(uuid.uuid4())
                    folder_path = f"{container_name}/{prefix}/{folder_name}".replace('//', '/')
                    
                    folder_node = {
                        'id': folder_id,
                        'name': folder_name,
                        'type': 'folder',
                        'path': folder_path,
                        'children': []
                    }
                    
                    # Check if this folder contains dataset files
                    has_dataset_files, formats = check_for_dataset_files(
                        container_client, 
                        f"{prefix}/{folder_name}".replace('//', '/')
                    )
                    
                    if has_dataset_files:
                        folder_node['metadata'] = {
                            'hasDatasetFiles': True,
                            'formats': formats
                        }
                    
                    folders[folder_name] = folder_node
        
        # Add folders to tree and process recursively
        for folder_name, folder_node in folders.items():
            parent_node['children'].append(folder_node)
            
            new_prefix = f"{prefix}/{folder_name}".replace('//', '/')
            add_folders_to_tree(
                container_client, 
                folder_node, 
                container_name, 
                new_prefix,
                max_depth,
                current_depth + 1
            )
    except Exception as e:
        logger.error(f"Error adding folders to tree: {str(e)}")
        # Don't raise exception, continue building the tree

def is_azure_environment():
    """Check if the application is running in an Azure environment."""
    # Check for common Azure environment variables
    azure_env_vars = [
        'AZURE_TENANT_ID', 
        'AZURE_CLIENT_ID', 
        'AZURE_SUBSCRIPTION_ID',
        'IDENTITY_ENDPOINT',
        'IDENTITY_HEADER',
        'MSI_ENDPOINT',
        'MSI_SECRET'
    ]
    
    for var in azure_env_vars:
        if os.environ.get(var):
            return True
            
    # Check if running on a Linux VM (common for Azure)
    if platform.system() == 'Linux':
        # Check for specific Azure VM identifiers
        try:
            with open('/sys/devices/virtual/dmi/id/product_name', 'r') as f:
                product_name = f.read().strip()
                if 'Azure' in product_name:
                    return True
        except:
            pass
            
    return False

# Routes
@app.get("/")
def read_root():
    return {"message": "ADLS Manager API is running"}

@app.get("/auth-methods", response_model=AuthMethodsResponse)
def get_auth_methods():
    """Get available authentication methods for the current environment."""
    is_azure_env = is_azure_environment()
    
    return {
        "supportsManagedIdentity": True,  # We support it, but might not be available
        "supportsConnectionString": True,
        "supportsAccountKey": True,
        "recommendedMethod": "managedIdentity" if is_azure_env else "connectionString",
        "environmentInfo": {
            "isAzureEnvironment": is_azure_env,
            "isDevEnvironment": not is_azure_env,
            "hasSystemManagedIdentity": is_azure_env,
            "hasUserManagedIdentity": is_azure_env
        }
    }

@app.post("/connect", response_model=ConnectionResponse)
def connect(request: ConnectionRequest):
    try:
        # Validate connection
        service_client = get_datalake_service_client(request.credentials)
        
        # If we reached here, connection is valid
        connection_id = str(uuid.uuid4())
        
        # Store connection info
        connections[connection_id] = {
            "id": connection_id,
            "name": request.name,
            "credentials": request.credentials.dict(),
            "service_client": service_client
        }
        
        # Return success response
        return {
            "id": connection_id,
            "name": request.name,
            "credentials": request.credentials,
            "status": "connected",
            "createdAt": pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Connection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/disconnect/{connection_id}")
def disconnect(connection_id: str):
    if connection_id in connections:
        del connections[connection_id]
        return {"message": "Disconnected successfully"}
    raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")

@app.get("/folder-tree/{connection_id}")
def get_folder_tree(connection_id: str):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        # Get container filter from connection info
        container_filter = connection_info["credentials"].get("containerFilter", [])
        
        # Build the folder tree
        tree = build_folder_tree(connection_id, service_client, container_filter)
        
        return tree
    except Exception as e:
        logger.error(f"Error getting folder tree: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/containers/{connection_id}", response_model=List[Container])
def list_containers(connection_id: str):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        container_list = []
        container_filter = connection_info["credentials"].get("containerFilter", [])
        
        # List all containers
        for container in service_client.list_file_systems():
            name = container.name
            
            # Apply filter if specified
            if container_filter and name.lower() not in [c.lower() for c in container_filter]:
                continue
                
            container_client = service_client.get_file_system_client(name)
            
            # Count paths (approximate count of files/folders)
            path_count = sum(1 for _ in container_client.get_paths(recursive=False))
            
            # Get folder count (top-level folders)
            folders = get_folders_from_paths(container_client)
            
            # Check if this container has dataset files
            has_dataset_files, _ = check_for_dataset_files(container_client, "")
            
            container_list.append({
                "id": str(uuid.uuid4()),
                "name": name,
                "path": name,
                "type": detect_container_type(name),
                "lastModified": container.last_modified.isoformat() if hasattr(container, 'last_modified') else None,
                "folderCount": len(folders),
                "blobCount": path_count,
                "hasDatasetFiles": has_dataset_files
            })
            
        return container_list
    except Exception as e:
        logger.error(f"Error listing containers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/folders/{connection_id}/{container_id}", response_model=List[Folder])
def list_folders(
    connection_id: str, 
    container_id: str,
    container_name: str = Query(...)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        container_client = service_client.get_file_system_client(container_name)
        
        # Get top-level folders
        folder_names = get_folders_from_paths(container_client)
        
        folders = []
        for folder_name in folder_names:
            # Get subfolders and file count for this folder
            path_client = container_client.get_directory_client(folder_name)
            
            # Get paths in this folder
            subfolder_names = get_folders_from_paths(container_client, folder_name)
            path_count = sum(1 for _ in container_client.get_paths(path=folder_name, recursive=False))
            
            # Check if this folder contains dataset files
            has_dataset_files, formats = check_for_dataset_files(container_client, folder_name)
            
            folders.append({
                "id": str(uuid.uuid4()),
                "name": folder_name,
                "path": f"{container_name}/{folder_name}",
                "containerName": container_name,
                "lastModified": None,  # Azure doesn't provide this for folders
                "folderCount": len(subfolder_names),
                "blobCount": path_count,
                "hasDatasetFiles": has_dataset_files,
                "datasetFormats": formats if has_dataset_files else []
            })
            
        return folders
    except Exception as e:
        logger.error(f"Error listing folders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/check-dataset-files/{connection_id}", response_model=FileTypeResponse)
def check_dataset_files(
    connection_id: str,
    container_name: str = Query(...),
    folder_path: str = Query(...)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        container_client = service_client.get_file_system_client(container_name)
        
        # Check if this folder contains dataset files
        has_dataset_files, formats = check_for_dataset_files(container_client, folder_path)
        
        return {
            "hasDatasetFiles": has_dataset_files,
            "formats": formats
        }
    except Exception as e:
        logger.error(f"Error checking dataset files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ... keep existing code for the rest of the routes (datasets, preview, saving changes, etc.)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

