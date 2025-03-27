
# Azure Data Lake Storage Explorer

A web-based tool for browsing and editing data in Azure Data Lake Storage (ADLS).

## Features

- Connect to Azure Data Lake Storage using connection strings or account keys
- Support for Azure Managed Identity authentication
- Browse storage containers (ingress, bronze, silver, gold, etc.)
- Navigate folders within containers
- View and edit tabular datasets
- Save changes to temporary storage
- Commit changes back to ADLS
- Modern, responsive UI with dark mode support

## Getting Started

### Prerequisites

- Node.js 16+ or Bun
- npm, yarn, or bun

### Installation

1. Clone the repository:
```bash
git clone https://your-repository-url/azure-datalake-explorer.git
cd azure-datalake-explorer
```

2. Install the dependencies:
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun
bun install
```

3. Start the development server:
```bash
# Using npm
npm run dev

# Using yarn
yarn dev

# Using bun
bun dev
```

4. Open your browser and navigate to http://localhost:5173

## Building for Production

To build the application for production:

```bash
# Using npm
npm run build

# Using yarn
yarn build

# Using bun
bun run build
```

The built files will be available in the `dist` directory. You can serve these files using any static file server.

For a simple way to preview the production build:

```bash
# Using npm
npm run preview

# Using yarn
yarn preview

# Using bun
bun run preview
```

## Integrating with a Python Backend (Optional)

If you want to integrate this frontend with a Python backend for real ADLS operations:

1. Create a Python API service using Flask, FastAPI, or Django Rest Framework
2. Implement the required endpoints to match the frontend's service calls
3. Configure CORS to allow requests from the frontend
4. Update the `adlsService.ts` file to point to your Python API endpoints

Example FastAPI backend structure:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from azure.storage.filedatalake import DataLakeServiceClient
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/connect")
async def connect(credentials: dict):
    # Implement connection to ADLS
    pass

@app.get("/api/containers")
async def list_containers(connection_id: str, filter: str = None):
    # Implement container listing
    pass

@app.get("/api/folders/{container_id}")
async def list_folders(container_id: str, connection_id: str):
    # Implement folder listing
    pass

@app.get("/api/datasets/{container_id}")
async def get_datasets_by_container(container_id: str, connection_id: str):
    # Implement dataset listing by container
    pass

# Add more endpoints as needed
```

Then update the frontend's service to call these endpoints.

## License

This project is licensed under the MIT License.
