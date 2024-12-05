# Author: Asim Sheikh (Software Enigneer @ Genwealth 360 Inc.)

import pandas as pd

def calculate_se_tax(schedule_c_income, w2_income, year, partnership_income, filing_status):
    """
    Function to calculate the self-employment tax based on given income details.
    """
    # Constants for tax rates
    SS_WAGE_BASE = {2022: 147000, 2023: 160200, 2024: 168600}[year]  # Social Security wage base
    SOCIAL_SECURITY_RATE = 0.062  # Employee's portion for Social Security (6.2%)
    MEDICARE_RATE = 0.029         # Total Medicare rate (2.9%)
    SE_INCOME_FACTOR = 0.9235     # Adjustment factor for self-employment income
    
    # Replace NaN with 0 for numeric inputs
    schedule_c_income = schedule_c_income if pd.notnull(schedule_c_income) else 0
    w2_income = w2_income if pd.notnull(w2_income) else 0
    partnership_income = partnership_income if pd.notnull(partnership_income) else 0
    
    # Adjust incomes for self-employment tax calculation
    adjusted_schedule_c_income = schedule_c_income * SE_INCOME_FACTOR
    adjusted_partnership_income = partnership_income * SE_INCOME_FACTOR if partnership_income else 0
    total_adjusted_se_income = adjusted_schedule_c_income + adjusted_partnership_income

    # Calculate Social Security Tax (for both W2 and self-employment)
    total_ss_wages = min(w2_income, SS_WAGE_BASE)
    ss_taxable_limit = SS_WAGE_BASE - total_ss_wages
    ss_taxable_se_income = min(total_adjusted_se_income, ss_taxable_limit)
    
    # Social Security tax for W2 (6.2% employee's portion)
    social_security_tax_w2 = total_ss_wages * SOCIAL_SECURITY_RATE
    # Social Security tax for self-employment income (6.2%)
    social_security_tax_se = ss_taxable_se_income * SOCIAL_SECURITY_RATE

    # Calculate Medicare Tax (for both W2 and self-employment - no wage base limit)
    medicare_tax_w2 = w2_income * (MEDICARE_RATE / 2)  # 1.45% for W2
    medicare_tax_se = total_adjusted_se_income * MEDICARE_RATE

    # Total wages including W2 and Self-Employment for Additional Medicare Tax
    total_medicare_wages = w2_income + total_adjusted_se_income

    additional_medicare_income = 0
    if filing_status == 'single' and total_medicare_wages > 200000:
        additional_medicare_income = total_medicare_wages - 200000
    elif filing_status == 'married_jointly' and total_medicare_wages > 250000:
        additional_medicare_income = total_medicare_wages - 250000
    elif filing_status == 'married_separately' and total_medicare_wages > 125000:
        additional_medicare_income = total_medicare_wages - 125000
    elif filing_status == 'head_of_household' and total_medicare_wages > 200000:
        additional_medicare_income = total_medicare_wages - 200000
    elif filing_status == 'qualifying_widow' and total_medicare_wages > 200000:
        additional_medicare_income = total_medicare_wages - 200000

    # Additional Medicare Tax
    additional_medicare_tax = additional_medicare_income * 0.009

    # Total Self-Employment Tax (including W2 and self-employment)
    total_se_tax = social_security_tax_w2 + social_security_tax_se + medicare_tax_w2 + medicare_tax_se + additional_medicare_tax

    # Return results without rounding intermediate steps
    return {
        'adjusted_schedule_c_income': adjusted_schedule_c_income,
        'adjusted_partnership_income': adjusted_partnership_income,
        'social_security_tax_w2': social_security_tax_w2,
        'social_security_tax_se': social_security_tax_se,
        'medicare_tax_w2': medicare_tax_w2,
        'medicare_tax_se': medicare_tax_se,
        'additional_medicare_tax': additional_medicare_tax,
        'total_se_tax': round(total_se_tax, 2),  # Round only the final total SE tax
        'total_adjusted_se_income': total_adjusted_se_income
    }

def process_excel(file_path):
    import pandas as pd  # Ensure pandas is imported

    # Read the Excel file into a DataFrame
    df = pd.read_excel(file_path, header=None)

    # Create a dictionary to store the extracted data
    client_data = {}

    # Loop through the rows to extract the necessary information
    for index, row in df.iterrows():
        label = row[0]  # Column A (label)
        value = row[1]  # Column B (value)

        # Normalize the label
        normalized_label = str(label).strip().lower()

        # Assign data to the dictionary based on labels, handling NaN values
        if normalized_label == "client_id":
            client_data["client_id"] = value
        elif normalized_label == "client name":
            client_data["client_name"] = value
        elif normalized_label == "year":
            client_data["year"] = int(value) if pd.notnull(value) else 2023
        elif normalized_label == "schedule c income":
            client_data["schedule_c_income"] = float(value) if pd.notnull(value) else 0
        elif normalized_label == "w2 income":
            client_data["w2_income"] = float(value) if pd.notnull(value) else 0
        elif normalized_label == "partnership income":
            client_data["partnership_income"] = float(value) if pd.notnull(value) else 0
        elif normalized_label == "filing status":
            client_data["filing_status"] = str(value).strip().lower() if pd.notnull(value) else 'single'

    # Perform self-employment tax calculations using the provided function
    results = calculate_se_tax(
        client_data.get("schedule_c_income", 0),
        client_data.get("w2_income", 0),
        client_data.get("year", 2023),
        client_data.get("partnership_income", 0),
        client_data.get("filing_status", 'single')
    )

    # Ensure no NaN values in results
    for key in results:
        if pd.isnull(results[key]):
            results[key] = 0

    # Optional: Print results for debugging
    print("Results:", results)

    # Write the calculated results back to the Excel sheet in the appropriate rows
    for index, row in df.iterrows():
        label = row[0]  # Column A (label)
        normalized_label = str(label).strip().lower()

        # Update the correct row in Column B with the calculated values
        if normalized_label == "adjusted schedule c income":
            df.at[index, 1] = results["adjusted_schedule_c_income"]
        elif normalized_label == "adjusted partnership income":
            df.at[index, 1] = results["adjusted_partnership_income"]
        elif normalized_label == "social security tax (w2)":
            df.at[index, 1] = results["social_security_tax_w2"]
        elif normalized_label == "social security tax (se)":
            df.at[index, 1] = results["social_security_tax_se"]
        elif normalized_label == "medicare tax (w2)":
            df.at[index, 1] = results["medicare_tax_w2"]
        elif normalized_label == "medicare tax (self-employment)":
            df.at[index, 1] = results["medicare_tax_se"]
        elif normalized_label == "additional medicare tax":
            df.at[index, 1] = results["additional_medicare_tax"]
        elif normalized_label == "total self-employment tax":
            df.at[index, 1] = results["total_se_tax"]
        elif normalized_label == "total adjusted se income":
            df.at[index, 1] = results["total_adjusted_se_income"]

    # Save the updated Excel file with results written
    df.to_excel(file_path, index=False, header=False)

    print("Calculations completed and written back to the Excel file.")


def main():
    # Specify the file path (update this to your actual file path)
    file_path = 'Excel-Script\client_data.xlsx'  # Update this path

    # Process the Excel file and write the results back to the Excel sheet
    process_excel(file_path)

if __name__ == "__main__":
    main()


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

