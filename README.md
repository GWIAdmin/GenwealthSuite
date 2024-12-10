# GenwealthSuite

## Overview
This system verifies tax calculations from an Excel template using Python. It reads client data, checks the accuracy of tax-related values against predefined rules, and provides AI-generated tax optimization strategies if the calculations are correct.

Project Structure
bash
Copy code
project/
   main.py               # Main script for processing and strategy generation
   tax_rules.json         # JSON file with tax rules for a specific year
   client_data.xlsx       # Excel file with client input data

## Requirements
Python 3.9+
pandas (for reading Excel files)
openpyxl (for handling Excel I/O)
openai (optional, for AI-driven strategy suggestions)
Key Functions
Loading Tax Rules
Load tax rules from a JSON file into the system to validate the calculations.

### Extracting Data
Extract data from an Excel sheet, normalizing labels and mapping them to internal keys.

### Verification
Check the extracted data against the tax rules to ensure accuracy.

### AI Strategy Generation
If verifications pass, use AI (GPT-4) to suggest personalized tax optimization strategies.

### Common Issues
File not found or invalid: Ensure files are in the correct directory.
Data mismatches: Verify that data labels in the Excel file match the expected format.
After Verification
Once data is validated, the system can generate AI-driven suggestions for tax optimization based on the verified data.

### Conclusion
This system streamlines tax verification and provides actionable tax strategies, improving efficiency and accuracy in tax filing.
