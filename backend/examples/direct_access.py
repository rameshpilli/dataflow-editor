
"""
Example script showing how to directly access and manipulate ADLS data
without using the REST API.

This is useful for:
- Batch processing
- ETL workflows
- Data science tasks
- Integration with other Python-based systems
"""

import os
from azure.storage.filedatalake import DataLakeServiceClient
from azure.identity import DefaultAzureCredential
import pandas as pd

def connect_to_adls(connection_string=None, account_name=None, account_key=None, use_managed_identity=False):
    """
    Connect to Azure Data Lake Storage.
    """
    try:
        if use_managed_identity:
            # Use Managed Identity
            if not account_name:
                raise ValueError("Account name is required when using managed identity")
            
            credential = DefaultAzureCredential()
            return DataLakeServiceClient(
                account_url=f"https://{account_name}.dfs.core.windows.net",
                credential=credential
            )
        elif connection_string:
            # Use connection string
            return DataLakeServiceClient.from_connection_string(connection_string)
        elif account_name and account_key:
            # Use account key
            return DataLakeServiceClient(
                account_url=f"https://{account_name}.dfs.core.windows.net",
                credential=account_key
            )
        else:
            raise ValueError("Invalid credentials. Provide either managed identity, connection string, or account name and key.")
    except Exception as e:
        print(f"Error connecting to ADLS: {str(e)}")
        raise

def list_containers(service_client):
    """
    List all containers in the storage account.
    """
    containers = []
    for container in service_client.list_file_systems():
        containers.append({
            "name": container.name,
            "last_modified": container.last_modified
        })
    return containers

def list_folders(service_client, container_name, path=""):
    """
    List folders in a container.
    """
    container_client = service_client.get_file_system_client(container_name)
    folders = set()
    
    paths = container_client.get_paths(path=path)
    for path_item in paths:
        path_name = path_item.name
        if path:
            # Remove the prefix from the path
            if path_name.startswith(path):
                path_name = path_name[len(path):]
                
        # Skip if this is the prefix itself
        if not path_name:
            continue
            
        # Extract the folder name (first segment)
        parts = path_name.strip('/').split('/')
        if len(parts) > 0 and parts[0]:
            folders.add(parts[0])
    
    return list(folders)

def read_parquet_file(service_client, container_name, file_path):
    """
    Read a Parquet file from ADLS.
    """
    try:
        container_client = service_client.get_file_system_client(container_name)
        file_client = container_client.get_file_client(file_path)
        
        # Download to a temporary file
        download = file_client.download_file()
        downloaded_bytes = download.readall()
        
        # Save to a temporary file
        temp_file = "temp.parquet"
        with open(temp_file, "wb") as file:
            file.write(downloaded_bytes)
        
        # Read with pandas
        df = pd.read_parquet(temp_file)
        
        # Clean up
        os.remove(temp_file)
        
        return df
    except Exception as e:
        print(f"Error reading Parquet file: {str(e)}")
        raise

def write_parquet_file(service_client, container_name, file_path, dataframe):
    """
    Write a Parquet file to ADLS.
    """
    try:
        # Save to a temporary file
        temp_file = "temp.parquet"
        dataframe.to_parquet(temp_file, index=False)
        
        # Read the file content
        with open(temp_file, "rb") as file:
            file_content = file.read()
        
        # Upload to ADLS
        container_client = service_client.get_file_system_client(container_name)
        file_client = container_client.create_file(file_path)
        file_client.upload_data(file_content, overwrite=True)
        
        # Clean up
        os.remove(temp_file)
        
        print(f"File uploaded successfully to {container_name}/{file_path}")
    except Exception as e:
        print(f"Error writing Parquet file: {str(e)}")
        raise

if __name__ == "__main__":
    # Example usage
    
    # Connection options
    # Option 1: Connection string
    # CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=yourkey;EndpointSuffix=core.windows.net"
    # service_client = connect_to_adls(connection_string=CONNECTION_STRING)
    
    # Option 2: Account name and key
    ACCOUNT_NAME = "youraccount"
    ACCOUNT_KEY = "yourkey"
    service_client = connect_to_adls(account_name=ACCOUNT_NAME, account_key=ACCOUNT_KEY)
    
    # Option 3: Managed Identity (for Azure hosted applications)
    # service_client = connect_to_adls(account_name=ACCOUNT_NAME, use_managed_identity=True)
    
    # List containers
    containers = list_containers(service_client)
    print(f"Found {len(containers)} containers:")
    for container in containers:
        print(f"  - {container['name']}")
    
    # Select a container
    if containers:
        selected_container = containers[0]['name']
        
        # List folders
        folders = list_folders(service_client, selected_container)
        print(f"Found {len(folders)} folders in {selected_container}:")
        for folder in folders:
            print(f"  - {folder}")
        
        # Create a sample DataFrame
        data = {
            'id': range(1, 11),
            'name': [f'Item {i}' for i in range(1, 11)],
            'value': [i * 1.5 for i in range(1, 11)]
        }
        df = pd.DataFrame(data)
        
        # Write to ADLS
        write_parquet_file(
            service_client, 
            selected_container, 
            "sample/data.parquet", 
            df
        )
        
        # Read from ADLS
        read_df = read_parquet_file(
            service_client,
            selected_container,
            "sample/data.parquet"
        )
        
        print("\nRead data from ADLS:")
        print(read_df.head())
