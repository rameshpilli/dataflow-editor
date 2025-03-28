
# ADLS Manager Backend

This backend provides a REST API for connecting to Azure Data Lake Storage Gen2, browsing containers and folders, and managing datasets.

## Requirements

- Python 3.8+
- Azure Storage Account with Data Lake Storage Gen2 enabled
- Required Python packages (see requirements.txt)

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
- On Windows:
```bash
venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Documentation

Once the server is running, you can access the Swagger documentation at:
http://localhost:8000/docs

## Integration with Frontend

The frontend application connects to this backend API. Update the API base URL in the frontend code if needed.

## Authentication Methods

The API supports three authentication methods for Azure Data Lake Storage:

1. **Azure Managed Identity** - For Azure hosted applications
2. **Connection String** - Direct connection using a connection string
3. **Account Name and Key** - Using storage account credentials

## Features

- Connect to Azure Data Lake Storage accounts
- List containers with type detection (ingress, bronze, silver, gold)
- Browse folders within containers
- List datasets (Parquet and Delta files)
- Preview dataset content
- Save and commit changes to datasets
