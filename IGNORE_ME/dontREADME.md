# GenwealthSuite

## Overview

GenwealthSuite is a Python-based web application that streamlines data entry and leverages an Excel spreadsheet for tax calculations. Advisors enter client information into a web form; the server then updates a master Excel workbook, triggers recalculations (using Excel’s formulas), and returns the results. Finally, GenwealthSuite can use GPT-4 to provide AI-generated insights for strategic tax planning.

## Key Features

- **Excel-Based Calculations:**  
   - A Python backend (Flask or FastAPI) updates the Excel file based on user input and retrieves updated results.  
   - Open to multiple Python libraries (`openpyxl`, `xlwings`, `win32com`) for reading/writing Excel cells and forcing recalculations.
  
- **Server-Side Processing:**  
  - A Python server (using frameworks such as Flask or FastAPI) handles incoming data, updates the Excel file, triggers recalculations, and extracts results programmatically.
  
- **Web Interface for Input:**  
  - A static webpage allows advisors to enter Form 1040 data.  
  - Data is sent to the backend via `fetch()`, and results are displayed without exposing users to the complexity of Excel.  
- **AI-Generated Insights:**  
   - Once calculations are complete, the system can send relevant data to GPT-4 (or another large language model) to generate strategic tax optimization ideas.

- `frontend/` – Contains the UI:
  - **index.html** – A static form for user data input (e.g., personal info, wages, deductions).
  - **script.js** – Frontend logic for dynamic fields, client-side calculations, and the POST request to the server.
  - **style.css** – Basic styling.

- `server/` – Contains the backend:
  - **app.py** – The Flask or FastAPI application, which defines endpoints for processing tax data.
  - **excel_processor.py** – Logic to read/write Excel cells and retrieve calculated tax results.

- `requirements.txt` – Lists Python dependencies.

## Requirements

- Python 3.9+  
- Pandas (for reading Excel files)  
- OpenPYXL (for Excel I/O)  
- Flask or FastAPI (for server-side API functionality)  
- OpenAI (for GPT-4 based strategy generation)

> [!IMPORTANT]
> ## Installation of required packages:
> - pip install -r requirements.txt

## Workflow

1. Fill Out the Tax Form:
  Enter personal info, wages, deductions, etc.
  Click Submit to send data to the Python server.

2. Server Processes Data:
  The server writes the form data into the Excel workbook, triggers a recalculation, and extracts results.

3. Results Displayed:
   The server returns a JSON response with the updated tax values.
   The client (in script.js) displays these calculations to the advisor.

4. (Optional) GPT-4 Insights:
   If GPT-4 integration is enabled, the server uses final tax data to generate strategic insights.
   Advisors see suggestions for tax optimizations or alternative planning approaches.

> [!CAUTION]
> ## Common Issues
> 
> ### File Not Found or Invalid Format
> Check the file paths and ensure the Excel file is in a supported format. Update file references in the server code as necessary.
>
> ### Data Formatting
> Ensure that the Excel spreadsheet follows consistent naming conventions and structures so that data extraction and calculation run smoothly.

## License
This software is proprietary to Genwealth 360 &copy;. All rights reserved.

