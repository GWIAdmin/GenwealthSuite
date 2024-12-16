# GenwealthSuite

## Overview

GenwealthSuite is a Python-based system that combines Excel-based tax calculations with a straightforward web interface. The system enables a user to input client data through a webpage and pass these inputs to a server-side Python script, which integrates with an Excel file to process tax calculations and returns the results back to the user. After performing the computations, GenwealthSuite can use GPT-4 to provide AI-generated tax optimization insights.

## Key Features

- **Excel-Based Calculations:**  
  The system leverages existing Excel templates to perform tax-related calculations, minimizing the need to rewrite logic.
  
- **Server-Side Processing:**  
  A Python server (using frameworks such as Flask or FastAPI) handles incoming data, updates the Excel file, triggers recalculations, and extracts results programmatically.
  
- **Web Interface for Input:**  
  The interface is a static webpage where users enter client information. Input is sent to the server via a POST request, and the server returns calculated results as JSON.
  
- **AI-Generated Insights:**  
  Once calculations are complete, GPT-4 can be used to provide tax strategy suggestions based on the computed values.

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

1. **Data Input via Webpage:**  
   A user enters client data into a static webpage form.

2. **Server Request:**  
   On submission, the frontend sends the input data to the Python server.

3. **Excel Processing:**  
   The server updates the Excel file with the provided inputs and triggers recalculations using the existing formulas within the spreadsheet.

4. **Returning Results:**  
   The server returns the computed results as JSON, and the webpage displays the updated values.

5. **AI Insights (Optional):**  
   If enabled, the system uses GPT-4 to generate tax optimization insights based on the computed results.

> [!CAUTION]
> ## Common Issues
> 
> ### File Not Found or Invalid Format
> Check the file paths and ensure the Excel file is in a supported format. Update file references in the server code as necessary.
>
> ### Data Formatting
> Ensure that the Excel spreadsheet follows consistent naming conventions and structures so that data extraction and calculation run smoothly.
