# Author: Asim Sheikh (Software Enigneer @ Genwealth 360 Inc.)

import pandas as pd
import json
import os
from tabulate import tabulate

def load_tax_rules(year):
    rules_file = "C:\\Users\\GenWealth360\\Downloads\\GenwealthSuite\\Excel-Script\\tax_rules_2024.json"
    with open(rules_file, 'r', encoding='utf-8-sig') as f:
        content = f.read()
        return json.loads(content)

label_map = {
    # Income Section
    "Wages, salaries, tips - ": "wages_1",
    "Wages, salaries, tips - ": "wages_2",
    "Reasonable Compensation - ": "reasonable_comp_1",
    "Reasonable Compensation - ": "reasonable_comp_2",
    "Tax-exempt interest": "exempt_interest",
    "Taxable interest": "taxable_interest",
    "Taxable IRA": "taxable_ira",
    "Taxable Ordinary Dividends": "ordinary_dividends",
    "Qualified Dividends": "qualified_dividends",
    "IRA distributions": "ira_distributions",
    "Taxable pensions and annuities ": "pensions_annuities",
    "Long Term Capital Gain or Loss": "ltcg",
    "Short Term Capital Gain or Loss": "stcg",
    "Business 1 Income - ": "business_1_income",
    #"business_1_expenses": "business_1_expenses",
    "Business 2 Income - ": "business_2_income",
    #"business_2_expenses": "business_2_expenses",
    "Schedule C-1 Income - ": "schedule_c1_income",
    #"schedule_c1_expenses": "schedule_c1_expenses",
    "Schedule C-2 Income - ": "schedule_c2_income",
    #"schedule_c2_expenses": "schedule_c2_expenses",
    "Schedule E-1 Income -": "schedule_e1_income",
    #"schedule_e1_expenses": "schedule_e1_expenses",
    "Schedule E-2 Income - ": "schedule_e2_income",
    #"schedule_e2_expenses": "schedule_e2_expenses",
    "Other Income (loss carryforward)": "other_income_loss",
    "Interest from Private Activity Bonds": "pab_interest",
    "Depreciation": "depreciation",
    "Passive Activity Loss Adjustments": "passive_loss",
    "Qualified Business Deduction": "qbi_deduction",
    "Total Income": "total_income",

    # Adjusted Gross Income
    "Adjusted Gross Income": "agi",
    "Half of self employment tax": "se_tax_half",
    "Retirement Deduction": "retirement_deduction",
    "Medical Reimbursement Plan": "medical_reimburse",
    "Self-Employed Health Insurance": "se_health_insurance",
    "Alimony Paid": "alimony_paid",
    "Other adjustments": "other_adjustments",
    "Total Adjusted Gross Income": "total_agi",

    # Deductions
    "Medical ": "medical_deduction",
    "State and local taxes": "salt_deduction",
    "Other taxes from Sch K-1": "k1_taxes",
    "Interest": "interest_deduction",
    "Contributions": "contributions",
    "Other Deductions": "other_deductions",
    "Carryover Loss": "carryover_loss",
    "Casualty and Theft Losses": "casualty_losses",
    "Miscellaneous Deductions": "misc_deductions",
    "Standard or Itemized Deduction": "standard_or_itemized_deduction",

    # Tax and Credits
    "Taxable Income": "taxable_income",
    "Tax": "tax",
    "Additional Medicare Tax": "medicare_tax",
    "Net Investment Tax": "niit",
    "Self-Employment Tax": "se_tax",
    "Other Taxes": "other_taxes",
    "Foreign Tax Credit": "foreign_tax_credit",
    "Credit for Prior Year Minimum Tax": "amt_credit",
    "Nonrefundable Personal Credits": "personal_credits",
    "General Business Credit": "business_credit",
    "Child Tax Credit": "child_tax_credit",
    "Other Credits": "other_credits",
    "Total Federal tax": "total_federal_tax",
  
    # Payments
    "Federal Withholdings": "withholdings",
    "Withholding on medicare wages": "medicare_withholding",
    "Estimated tax payments": "estimated_payments",
    "Other payments and credits": "other_payments",
    "Federal Penalty": "penalty",
    "Estimated Refund (Overpayment)": "refund",
    "Estimated Balance Due": "balance_due",

    # Employment Taxes
    "Employee Taxes": "employee_taxes",
    "Employer Taxes": "employer_taxes",

    # State Tax Items (for multiple states)
    "State Taxable Income": "state_taxable_income",
    "Local tax after credits": "state_local_tax",
    "Total Tax ": "state_total_tax",
    "State Withholdings": "state_withholdings",
    "Payments and credits": "state_payments",
    "Interest": "state_interest",
    "State Penalty": "state_penalty",
    "Estimated Refund (Overpayment)": "state_refund",
    "Estimated Balance Due": "state_balance_due",
    
    # Final Calculations
    "Total Tax": "total_tax",
    "Total Estimated Difference in Federal & State Taxes Saved:": "tax_savings"
}

def extract_values_from_excel(file_path: str, label_map: dict) -> dict:
    """
    Extract values from Excel file using label mapping.
    
    Args:
        file_path: Path to Excel file
        label_map: Dictionary mapping Excel labels to internal names
    
    Returns:
        Dictionary of extracted values
    
    Raises:
        FileNotFoundError: If Excel file doesn't exist
        ValueError: If file is empty or invalid
        TypeError: If input parameters are wrong type
    """
    # Input validation
    if not isinstance(file_path, str):
        raise TypeError("file_path must be a string")
    if not isinstance(label_map, dict):
        raise TypeError("label_map must be a dictionary")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    try:
        df = pd.read_excel(file_path, header=None)
        if df.empty:
            raise ValueError("Excel file is empty")
        
        df[0] = df[0].astype(str).str.strip()
        final_values = {}
        
        # Case-insensitive mapping
        lower_label_map = {}
        for key, value in label_map.items():
            lower_key = key.lower()
            if lower_key in lower_label_map:
                raise ValueError(f"Duplicate key after normalization: {key}")
            lower_label_map[lower_key] = value
            
        # Extract values
        for idx, row in df.iterrows():
            label = row[0].lower()
            if label in lower_label_map and not pd.isna(row[1]):
                final_values[lower_label_map[label]] = row[1]
                
        return final_values
        
    except pd.errors.EmptyDataError:
        raise ValueError("Excel file is empty")
    except pd.errors.ParserError:
        raise ValueError("Invalid Excel file format")
    except Exception as e:
        raise Exception(f"Unexpected error processing Excel file: {str(e)}")

def verify_total_income(final_values):
    computed = (final_values.get("wages_1", 0) + final_values.get("wages_2", 0)
                + final_values.get("taxable_interest", 0)
                + final_values.get("qualified_dividends", 0)
                + (final_values.get("schedule_c1_income", 0) + final_values.get("schedule_c2_income", 0)))
    return abs(final_values.get("total_income", 0) - computed) < 1e-2

def verify_standard_deduction(final_values, rules, filing_status):
    expected = rules["standard_deduction"][filing_status]
    actual = final_values.get("standard_or_itemized_deduction", 0)
    return abs(actual - expected) < 1e-2

def verify_child_tax_credit(final_values, rules, filing_status, num_children=0):
    max_credit_per_child = rules["child_tax_credit"]["max_credit_per_child"]
    expected_max = max_credit_per_child * num_children
    actual = final_values.get("child_tax_credit", 0)
    return actual <= expected_max + 1e-2

def verify_taxable_income(final_values):
    computed = (final_values.get("total_income", 0) 
                - final_values.get("standard_or_itemized_deduction", 0))
    return abs(final_values.get("taxable_income", 0) - computed) < 1e-2

def run_verifications(final_values, client_data, rules):
    all_passed = True

    if not verify_total_income(final_values):
        print("Verification failed for total_income")
        all_passed = False

    if not verify_taxable_income(final_values):
        print("Verification failed for taxable_income")
        all_passed = False

    filing_status = client_data.get("filing_status", "single")
    if not verify_standard_deduction(final_values, rules, filing_status):
        print("Verification failed for standard deduction")
        all_passed = False

    num_children = client_data.get("num_children", 0)
    if not verify_child_tax_credit(final_values, rules, filing_status, num_children=num_children):
        print("Verification failed for child tax credit")
        all_passed = False

    return all_passed

def main():
    client_data = {
        "year": 2024,
        "filing_status": "married_jointly",
        "num_children": 2
    }

    rules = load_tax_rules(client_data["year"])
    excel_file = "Excel-Script\Master_Template.xlsx"

    final_values = extract_values_from_excel(excel_file, label_map)
    print("\nExtracted final_values:")
    table = [[key, value] for key, value in final_values.items()]
    print(tabulate(table, headers=["Label", "Value"], tablefmt="grid"))

    if run_verifications(final_values, client_data, rules):
        print("All verifications passed.")
        # strategies = get_tax_strategy_suggestions(final_values, client_data)
        # print("Tax Optimization Strategies:")
        # print(strategies)
    else:
        print("Verification failed. Please review discrepancies.")

if __name__ == "__main__":
    main()

# def get_tax_strategy_suggestions(final_values, client_data):
#     # Optional: Only run if you have OpenAI access
#     import os
#     import openai

#     openai.api_key = os.getenv("OPENAI_API_KEY", "your-key-here")

#     prompt = f"""
#     You are a tax planning expert. Given the following verified tax data:
#     Filing Status: {client_data.get('filing_status', 'single')}
#     Total Income: {final_values.get('total_income', 0)}
#     Taxable Income: {final_values.get('taxable_income', 0)}
#     Deductions: {final_values.get('standard_or_itemized_deduction', 0)}
#     Child Tax Credit: {final_values.get('child_tax_credit', 0)}

#     The client wants to optimize their tax situation.
#     Provide a list of actionable tax optimization strategies.
#     """

#     response = openai.Completion.create(
#         engine="text-davinci-003",
#         prompt=prompt,
#         temperature=0.7,
#         max_tokens=700
#     )

#     return response.choices[0].text.strip()

# ----------------------------------------------------------------------------------------------------------
# import pandas as pd

# def calculate_se_tax(schedule_c_income, w2_income, year, partnership_income, filing_status):
#     """
#     Function to calculate the self-employment tax based on given income details.
#     """
#     # Constants for tax rates
#     SS_WAGE_BASE = {2022: 147000, 2023: 160200, 2024: 168600}[year]  # Social Security wage base
#     SOCIAL_SECURITY_RATE = 0.062  # Employee's portion for Social Security (6.2%)
#     MEDICARE_RATE = 0.029         # Total Medicare rate (2.9%)
#     SE_INCOME_FACTOR = 0.9235     # Adjustment factor for self-employment income
    
#     # Replace NaN with 0 for numeric inputs
#     schedule_c_income = schedule_c_income if pd.notnull(schedule_c_income) else 0
#     w2_income = w2_income if pd.notnull(w2_income) else 0
#     partnership_income = partnership_income if pd.notnull(partnership_income) else 0
    
#     # Adjust incomes for self-employment tax calculation
#     adjusted_schedule_c_income = schedule_c_income * SE_INCOME_FACTOR
#     adjusted_partnership_income = partnership_income * SE_INCOME_FACTOR if partnership_income else 0
#     total_adjusted_se_income = adjusted_schedule_c_income + adjusted_partnership_income

#     # Calculate Social Security Tax (for both W2 and self-employment)
#     total_ss_wages = min(w2_income, SS_WAGE_BASE)
#     ss_taxable_limit = SS_WAGE_BASE - total_ss_wages
#     ss_taxable_se_income = min(total_adjusted_se_income, ss_taxable_limit)
    
#     # Social Security tax for W2 (6.2% employee's portion)
#     social_security_tax_w2 = total_ss_wages * SOCIAL_SECURITY_RATE
#     # Social Security tax for self-employment income (6.2%)
#     social_security_tax_se = ss_taxable_se_income * SOCIAL_SECURITY_RATE

#     # Calculate Medicare Tax (for both W2 and self-employment - no wage base limit)
#     medicare_tax_w2 = w2_income * (MEDICARE_RATE / 2)  # 1.45% for W2
#     medicare_tax_se = total_adjusted_se_income * MEDICARE_RATE

#     # Total wages including W2 and Self-Employment for Additional Medicare Tax
#     total_medicare_wages = w2_income + total_adjusted_se_income

#     additional_medicare_income = 0
#     if filing_status == 'single' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000
#     elif filing_status == 'married_jointly' and total_medicare_wages > 250000:
#         additional_medicare_income = total_medicare_wages - 250000
#     elif filing_status == 'married_separately' and total_medicare_wages > 125000:
#         additional_medicare_income = total_medicare_wages - 125000
#     elif filing_status == 'head_of_household' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000
#     elif filing_status == 'qualifying_widow' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000

#     # Additional Medicare Tax
#     additional_medicare_tax = additional_medicare_income * 0.009

#     # Total Self-Employment Tax (including W2 and self-employment)
#     total_se_tax = social_security_tax_w2 + social_security_tax_se + medicare_tax_w2 + medicare_tax_se + additional_medicare_tax

#     # Return results without rounding intermediate steps
#     return {
#         'adjusted_schedule_c_income': adjusted_schedule_c_income,
#         'adjusted_partnership_income': adjusted_partnership_income,
#         'social_security_tax_w2': social_security_tax_w2,
#         'social_security_tax_se': social_security_tax_se,
#         'medicare_tax_w2': medicare_tax_w2,
#         'medicare_tax_se': medicare_tax_se,
#         'additional_medicare_tax': additional_medicare_tax,
#         'total_se_tax': round(total_se_tax, 2),  # Round only the final total SE tax
#         'total_adjusted_se_income': total_adjusted_se_income
#     }

# def process_excel(file_path):
#     import pandas as pd  # Ensure pandas is imported

#     # Read the Excel file into a DataFrame
#     df = pd.read_excel(file_path, header=None)

#     # Create a dictionary to store the extracted data
#     client_data = {}

#     # Loop through the rows to extract the necessary information
#     for index, row in df.iterrows():
#         label = row[0]  # Column A (label)
#         value = row[1]  # Column B (value)

#         # Normalize the label
#         normalized_label = str(label).strip().lower()

#         # Assign data to the dictionary based on labels, handling NaN values
#         if normalized_label == "client_id":
#             client_data["client_id"] = value
#         elif normalized_label == "client name":
#             client_data["client_name"] = value
#         elif normalized_label == "year":
#             client_data["year"] = int(value) if pd.notnull(value) else 2023
#         elif normalized_label == "schedule c income":
#             client_data["schedule_c_income"] = float(value) if pd.notnull(value) else 0
#         elif normalized_label == "w2 income":
#             client_data["w2_income"] = float(value) if pd.notnull(value) else 0
#         elif normalized_label == "partnership income":
#             client_data["partnership_income"] = float(value) if pd.notnull(value) else 0
#         elif normalized_label == "filing status":
#             client_data["filing_status"] = str(value).strip().lower() if pd.notnull(value) else 'single'

#     # Perform self-employment tax calculations using the provided function
#     results = calculate_se_tax(
#         client_data.get("schedule_c_income", 0),
#         client_data.get("w2_income", 0),
#         client_data.get("year", 2023),
#         client_data.get("partnership_income", 0),
#         client_data.get("filing_status", 'single')
#     )

#     # Ensure no NaN values in results
#     for key in results:
#         if pd.isnull(results[key]):
#             results[key] = 0

#     # Optional: Print results for debugging
#     print("Results:", results)

#     # Write the calculated results back to the Excel sheet in the appropriate rows
#     for index, row in df.iterrows():
#         label = row[0]  # Column A (label)
#         normalized_label = str(label).strip().lower()

#         # Update the correct row in Column B with the calculated values
#         if normalized_label == "adjusted schedule c income":
#             df.at[index, 1] = results["adjusted_schedule_c_income"]
#         elif normalized_label == "adjusted partnership income":
#             df.at[index, 1] = results["adjusted_partnership_income"]
#         elif normalized_label == "social security tax (w2)":
#             df.at[index, 1] = results["social_security_tax_w2"]
#         elif normalized_label == "social security tax (se)":
#             df.at[index, 1] = results["social_security_tax_se"]
#         elif normalized_label == "medicare tax (w2)":
#             df.at[index, 1] = results["medicare_tax_w2"]
#         elif normalized_label == "medicare tax (self-employment)":
#             df.at[index, 1] = results["medicare_tax_se"]
#         elif normalized_label == "additional medicare tax":
#             df.at[index, 1] = results["additional_medicare_tax"]
#         elif normalized_label == "total self-employment tax":
#             df.at[index, 1] = results["total_se_tax"]
#         elif normalized_label == "total adjusted se income":
#             df.at[index, 1] = results["total_adjusted_se_income"]

#     # Save the updated Excel file with results written
#     df.to_excel(file_path, index=False, header=False)

#     print("Calculations completed and written back to the Excel file.")


# def main():
#     # Specify the file path (update this to your actual file path)
#     file_path = 'Excel-Script\client_data.xlsx'  # Update this path

#     # Process the Excel file and write the results back to the Excel sheet
#     process_excel(file_path)

# if __name__ == "__main__":
#     main()

# ----------------------------------------------------------------------------------------------------------
# import pandas as pd
# from openpyxl import load_workbook

# # To Load in Excel Sheet
# # file_path = "template.xlsx"
# # file_path = "20241018 Master Template V 8.6.xlsx"
# # workbook = load_workbook(file_path)
# # sheet = workbook.active

# def calculate_se_tax(schedule_c_income, w2_income, year, partnership_income, filing_status):
#     SS_WAGE_BASE = {2022: 147000, 2023: 160200, 2024: 168600}[year]
#     SOCIAL_SECURITY_RATE = 0.124  # 12.4% total 
#     MEDICARE_RATE = 0.029         # 2.9% total
#     SE_INCOME_FACTOR = 0.9235     # Adjustment factor for self-employment income

#     # Adjust incomes
#     adjusted_schedule_c_income = schedule_c_income * SE_INCOME_FACTOR
#     adjusted_partnership_income = partnership_income * SE_INCOME_FACTOR
#     total_adjusted_se_income = adjusted_schedule_c_income + adjusted_partnership_income

#     # Calculate Social Security Tax (for both W2 and self-employment)
#     total_ss_wages = min(w2_income, SS_WAGE_BASE)
#     ss_taxable_limit = SS_WAGE_BASE - total_ss_wages
#     ss_taxable_se_income = min(total_adjusted_se_income, ss_taxable_limit)
    
#     # Social Security tax for W2 and self-employment income
#     social_security_tax_w2 = total_ss_wages * SOCIAL_SECURITY_RATE
#     social_security_tax_se = ss_taxable_se_income * SOCIAL_SECURITY_RATE

#     # Calculate Medicare Tax (for both W2 and self-employment - no wage base limit)
#     medicare_tax_w2 = w2_income * MEDICARE_RATE
#     medicare_tax_se = total_adjusted_se_income * MEDICARE_RATE

#     # Total wages including W2 and Self-Employment for Additional Medicare Tax
#     total_medicare_wages = w2_income + total_adjusted_se_income

#     # Additional Medicare Tax based on Filing Status
#     additional_medicare_income = 0
#     if filing_status == 'single' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000
#     elif filing_status == 'married_jointly' and total_medicare_wages > 250000:
#         additional_medicare_income = total_medicare_wages - 250000
#     elif filing_status == 'married_separately' and total_medicare_wages > 125000:
#         additional_medicare_income = total_medicare_wages - 125000
#     elif filing_status == 'head_of_household' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000
#     elif filing_status == 'qualifying_widow' and total_medicare_wages > 200000:
#         additional_medicare_income = total_medicare_wages - 200000

#     # Additional Medicare Tax
#     additional_medicare_tax = additional_medicare_income * 0.009

#     # Total Self-Employment Tax (including W2 and self-employment, plus the additional Medicare tax)
#     total_se_tax = social_security_tax_w2 + social_security_tax_se + medicare_tax_w2 + medicare_tax_se + additional_medicare_tax

#     return {
#         'adjusted_schedule_c_income': adjusted_schedule_c_income,
#         'adjusted_partnership_income': adjusted_partnership_income,
#         'social_security_tax_w2': social_security_tax_w2,
#         'social_security_tax_se': social_security_tax_se,
#         'medicare_tax_w2': medicare_tax_w2,
#         'medicare_tax_se': medicare_tax_se,
#         'additional_medicare_tax': additional_medicare_tax,
#         'total_se_tax': total_se_tax,
#         'total_adjusted_se_income': total_adjusted_se_income
#     }

# # Test Case:
# client_partnership_income = 0
# client_schedule_c_income = 650000
# client_w2_income = 0
# year = 2024
# filing_status = 'single'

# se_tax_details = calculate_se_tax(
#     client_schedule_c_income,
#     client_w2_income,
#     year,
#     partnership_income=client_partnership_income,
#     filing_status=filing_status
# )

# print(f"---------------------------------------") 
# print(f"Adjusted Schedule C Income: ${se_tax_details['adjusted_schedule_c_income']:,.2f}")
# print(f"Adjusted Partnership Income: ${se_tax_details['adjusted_partnership_income']:,.2f}")
# print(f"Social Security Tax (W2): ${se_tax_details['social_security_tax_w2']:,.2f}")
# print(f"Social Security Tax (Self-Employment): ${se_tax_details['social_security_tax_se']:,.2f}")
# print(f"Medicare Tax (W2): ${se_tax_details['medicare_tax_w2']:,.2f}")
# print(f"Medicare Tax (Self-Employment): ${se_tax_details['medicare_tax_se']:,.2f}")
# print(f"Additional Medicare Tax: ${se_tax_details['additional_medicare_tax']:,.2f}")
# print(f"Total Self-Employment Tax: ${se_tax_details['total_se_tax']:,.2f}")
# print(f"---------------------------------------")
