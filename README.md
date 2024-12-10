# GenwealthSuite

## Overview
This is a sophisticated Python-based system designed to verify tax calculations extracted from Excel templates. The system reads client data, validates tax-related values against predefined rules, and, if the calculations are accurate, generates AI-driven tax optimization strategies using GPT-4.

> [!IMPORTANT]
> ## Requirements
> Please ensure the following dependencies are installed: <br>
> -Python 3.9+ <br>
> -Pandas (for reading Excel files) <br>
> -OpenPYXL (for handling Excel I/O) <br>
> -OpenAI (for AI-driven strategy suggestions) <br>

## Workflow

### 1. Data Extraction
The system extracts client data from an Excel file, normalizing labels and mapping them to internal identifiers for accurate processing.

### 2. Data Verification
Once the data is extracted, it is validated against a set of predefined tax rules to ensure the accuracy and integrity of the calculations.

### 3. AI-Powered Strategy Generation
If the data verification is successful, the system utilizes GPT-4 to provide personalized tax optimization strategies tailored to the client's financial profile.
<br>
<br>
> [!CAUTION]
> ## Common Issues
> File Not Found or Invalid Format: Ensure that the Excel files are placed in the correct directory and are in a supported format. <br>
> Data Mismatches: Verify that the data labels in the Excel file match the expected format defined in the system to avoid extraction errors.
