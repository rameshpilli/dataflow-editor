
#!/bin/bash
echo "Starting ADLS Manager Backend..."
echo ""
echo "Make sure you have Python 3.8+ installed and have run:"
echo "pip install -r requirements.txt"
echo ""
uvicorn main:app --reload
