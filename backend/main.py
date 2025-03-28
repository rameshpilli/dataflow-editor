
import os
import json
import uuid
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential
from azure.core.exceptions import ResourceNotFoundError, ClientAuthenticationError
import pandas as pd
import pyarrow.parquet as pq
import logging

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

class ConnectionRequest(BaseModel):
    credentials: ADLSCredentials
    name: str

class ConnectionResponse(BaseModel):
    id: str
    name: str
    credentials: ADLSCredentials
    isConnected: bool = True
    lastConnected: str = None

class Container(BaseModel):
    id: str
    name: str
    type: str
    lastModified: Optional[str] = None
    folderCount: Optional[int] = None
    blobCount: Optional[int] = None

class Folder(BaseModel):
    id: str
    name: str
    path: str
    containerId: str
    parentFolderId: Optional[str] = None
    lastModified: Optional[str] = None
    folderCount: Optional[int] = None
    blobCount: Optional[int] = None

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
            
            credential = DefaultAzureCredential()
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

# Routes
@app.get("/")
def read_root():
    return {"message": "ADLS Manager API is running"}

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
            "isConnected": True,
            "lastConnected": pd.Timestamp.now().isoformat()
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
            if container_filter and name not in container_filter:
                continue
                
            container_client = service_client.get_file_system_client(name)
            
            # Count paths (approximate count of files/folders)
            path_count = sum(1 for _ in container_client.get_paths(recursive=False))
            
            # Get folder count (top-level folders)
            folders = get_folders_from_paths(container_client)
            
            container_list.append({
                "id": str(uuid.uuid4()),
                "name": name,
                "type": detect_container_type(name),
                "lastModified": container.last_modified.isoformat() if hasattr(container, 'last_modified') else None,
                "folderCount": len(folders),
                "blobCount": path_count
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
            
            folders.append({
                "id": str(uuid.uuid4()),
                "name": folder_name,
                "path": f"{container_name}/{folder_name}",
                "containerId": container_id,
                "lastModified": None,  # Azure doesn't provide this for folders
                "folderCount": len(subfolder_names),
                "blobCount": path_count
            })
            
        return folders
    except Exception as e:
        logger.error(f"Error listing folders: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/datasets/{connection_id}", response_model=List[Dataset])
def list_datasets(connection_id: str):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        datasets = []
        
        # For each container
        for container in service_client.list_file_systems():
            container_client = service_client.get_file_system_client(container.name)
            
            # Look for parquet files
            for path in container_client.get_paths(recursive=True):
                if path.name.endswith('.parquet') or ('delta' in path.name.lower() and not path.is_directory):
                    # This is a dataset
                    file_format = 'delta' if 'delta' in path.name.lower() else 'parquet'
                    file_path = path.name
                    
                    # Extract dataset name from path
                    dataset_name = os.path.basename(file_path)
                    if dataset_name.endswith('.parquet'):
                        dataset_name = dataset_name[:-8]  # Remove .parquet extension
                    
                    # Create dataset entry
                    dataset = {
                        "id": str(uuid.uuid4()),
                        "name": dataset_name,
                        "path": f"{container.name}/{file_path}",
                        "format": file_format,
                        "columns": [],  # Would need to download file to infer schema
                        "rowCount": 0,  # Would need to read file for this
                        "lastModified": path.last_modified.isoformat() if hasattr(path, 'last_modified') else None
                    }
                    
                    datasets.append(dataset)
        
        return datasets
    except Exception as e:
        logger.error(f"Error listing datasets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/datasets/{connection_id}/container/{container_id}", response_model=List[Dataset])
def get_datasets_by_container(
    connection_id: str, 
    container_id: str,
    container_name: str = Query(...)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        datasets = []
        
        # Get the container client
        container_client = service_client.get_file_system_client(container_name)
        
        # Look for parquet and delta files in this container
        for path in container_client.get_paths(recursive=True):
            if path.name.endswith('.parquet') or ('delta' in path.name.lower() and not path.is_directory):
                # This is a dataset
                file_format = 'delta' if 'delta' in path.name.lower() else 'parquet'
                file_path = path.name
                
                # Extract dataset name from path
                dataset_name = os.path.basename(file_path)
                if dataset_name.endswith('.parquet'):
                    dataset_name = dataset_name[:-8]  # Remove .parquet extension
                
                # Create dataset entry with dummy columns
                dataset = {
                    "id": str(uuid.uuid4()),
                    "name": dataset_name,
                    "path": f"{container_name}/{file_path}",
                    "format": file_format,
                    "columns": [
                        {"name": "id", "type": "int64", "nullable": False},
                        {"name": "name", "type": "string", "nullable": True},
                        {"name": "value", "type": "double", "nullable": True}
                    ],
                    "rowCount": 100,  # Dummy value
                    "lastModified": path.last_modified.isoformat() if hasattr(path, 'last_modified') else None
                }
                
                datasets.append(dataset)
        
        return datasets
    except Exception as e:
        logger.error(f"Error getting datasets by container: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/datasets/{connection_id}/folder/{folder_id}", response_model=List[Dataset])
def get_datasets_by_folder(
    connection_id: str, 
    folder_id: str,
    container_name: str = Query(...),
    folder_path: str = Query(...)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        connection_info = connections[connection_id]
        service_client = get_datalake_service_client(ADLSCredentials(**connection_info["credentials"]))
        
        datasets = []
        
        # Get the container client
        container_client = service_client.get_file_system_client(container_name)
        
        # Look for parquet and delta files in this folder
        for path in container_client.get_paths(path=folder_path, recursive=True):
            if path.name.endswith('.parquet') or ('delta' in path.name.lower() and not path.is_directory):
                # This is a dataset
                file_format = 'delta' if 'delta' in path.name.lower() else 'parquet'
                file_path = path.name
                
                # Extract dataset name from path
                dataset_name = os.path.basename(file_path)
                if dataset_name.endswith('.parquet'):
                    dataset_name = dataset_name[:-8]  # Remove .parquet extension
                
                # Create dataset entry with dummy columns
                dataset = {
                    "id": str(uuid.uuid4()),
                    "name": dataset_name,
                    "path": f"{container_name}/{file_path}",
                    "format": file_format,
                    "columns": [
                        {"name": "id", "type": "int64", "nullable": False},
                        {"name": "name", "type": "string", "nullable": True},
                        {"name": "value", "type": "double", "nullable": True}
                    ],
                    "rowCount": 100,  # Dummy value
                    "lastModified": path.last_modified.isoformat() if hasattr(path, 'last_modified') else None
                }
                
                datasets.append(dataset)
        
        return datasets
    except Exception as e:
        logger.error(f"Error getting datasets by folder: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/preview/{connection_id}/{dataset_id}", response_model=DatasetPreview)
def get_dataset_preview(
    connection_id: str,
    dataset_id: str,
    path: str = Query(...),
    page: int = Query(1),
    page_size: int = Query(10)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        # For now, returning mock data
        # In a real implementation, you would:
        # 1. Parse the path to get container and file path
        # 2. Download the file (or part of it)
        # 3. Parse the file and return preview data
        
        # Mock columns
        columns = [
            {"name": "id", "type": "int64", "nullable": False},
            {"name": "name", "type": "string", "nullable": True},
            {"name": "value", "type": "double", "nullable": True},
            {"name": "date", "type": "timestamp", "nullable": True},
            {"name": "category", "type": "string", "nullable": True}
        ]
        
        # Mock rows
        rows = []
        for i in range((page-1)*page_size, page*page_size):
            rows.append({
                "__id": f"row-{i}",
                "id": i,
                "name": f"Item {i}",
                "value": i * 1.5,
                "date": pd.Timestamp.now().isoformat(),
                "category": ["A", "B", "C"][i % 3]
            })
        
        return {
            "columns": columns,
            "rows": rows,
            "totalRows": 100,  # Mock total
            "page": page,
            "pageSize": page_size,
            "totalPages": 10  # Mock total pages
        }
    except Exception as e:
        logger.error(f"Error getting dataset preview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-changes/{connection_id}/{dataset_id}")
def save_changes_to_temp(
    connection_id: str,
    dataset_id: str,
    modified_rows: List[Dict[str, Any]] = Body(...)
):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    try:
        # In a real implementation, you would store these changes in a temporary location
        # For this mock API, we'll just store them in memory
        
        if dataset_id not in temp_storage:
            temp_storage[dataset_id] = {
                "modified_rows": {},
                "total_row_count": 100,  # Mock value
                "repaired_count": 0,
                "last_saved": pd.Timestamp.now().isoformat()
            }
        
        # Update modified rows
        for row in modified_rows:
            row_id = row["__id"]
            temp_storage[dataset_id]["modified_rows"][row_id] = row
            
        # Update repair count
        temp_storage[dataset_id]["repaired_count"] = len(temp_storage[dataset_id]["modified_rows"])
        temp_storage[dataset_id]["last_saved"] = pd.Timestamp.now().isoformat()
        
        return {"message": "Changes saved to temporary storage"}
    except Exception as e:
        logger.error(f"Error saving changes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/commit-changes/{connection_id}/{dataset_id}")
def commit_changes_to_adls(connection_id: str, dataset_id: str):
    if connection_id not in connections:
        raise HTTPException(status_code=404, detail=f"Connection {connection_id} not found")
    
    if dataset_id not in temp_storage:
        raise HTTPException(status_code=404, detail=f"No changes found for dataset {dataset_id}")
    
    try:
        # In a real implementation, you would:
        # 1. Get the original dataset
        # 2. Apply the changes
        # 3. Write back to ADLS
        
        # For this mock API, we'll just clear the temp storage
        del temp_storage[dataset_id]
        
        return {"message": "Changes committed to ADLS"}
    except Exception as e:
        logger.error(f"Error committing changes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
