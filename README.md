
# ADLS Manager Web Application

This project provides a web application for managing Azure Data Lake Storage (ADLS) data. It includes a React frontend and a Python backend.

## Features

- Connect to ADLS accounts using connection string or managed identity
- Browse containers (ingress, bronze, silver, gold)
- Browse folders within containers 
- View and edit datasets (delta tables and Parquet files)
- Temporary storage for changes before committing
- Data validation and repair workflow

## Project Structure

- `/src` - React frontend
- `/backend` - Python FastAPI backend

## Prerequisites

- Node.js 16+
- Python 3.8+
- Azure Storage Account with Data Lake Storage Gen2 enabled

## Setup and Running

### Backend Setup

1. Navigate to the backend directory:
```
cd backend
```

2. Create a Python virtual environment:
```
python -m venv venv
```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
```
pip install -r requirements.txt
```

5. Start the backend:
```
uvicorn main:app --reload
```

The backend API will be available at http://localhost:8000

### Frontend Setup

1. In the root directory, install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

The frontend will be available at http://localhost:5173

## Usage

1. Open the application in your browser
2. Connect to your ADLS account using:
   - Connection string
   - Account name and key
   - Managed identity (in Azure environments)
3. Browse containers and folders
4. Select a dataset to view and edit
5. Make changes to data
6. Save changes temporarily or commit them back to ADLS

## Configuration

By default, the frontend connects to the backend at `http://localhost:8000`. If you need to change this, update the `API_BASE_URL` in `src/services/adlsService.ts`.

## Working with Python Backend

The Python backend provides a RESTful API for:
- Connecting to Azure Data Lake Storage
- Browsing containers and folders
- Listing and loading datasets
- Previewing data with pagination
- Saving and committing changes

The API documentation is available at http://localhost:8000/docs when the backend is running.

## Integration with Corporate Environments

This application can be integrated with corporate environments:
- Configure Azure AD authentication
- Use managed identity when deployed to Azure
- Connect to VNet-enabled storage accounts
- Implement custom authorization rules

## License

MIT
