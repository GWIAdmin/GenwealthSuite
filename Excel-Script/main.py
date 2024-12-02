# Author: Asim Sheikh (Software Enigneer @ Genwealth 360 Inc.)

import pandas as pd
from openpyxl import load_workbook

# To Load in Excel Sheet
# file_path = "template.xlsx"
# file_path = "20241018 Master Template V 8.6.xlsx"
# workbook = load_workbook(file_path)
# sheet = workbook.active

def calculate_se_tax(schedule_c_income, w2_income, year, partnership_income, filing_status):
    SS_WAGE_BASE = {2022: 147000, 2023: 160200, 2024: 168600}[year]
    SOCIAL_SECURITY_RATE = 0.124  # 12.4% total 
    MEDICARE_RATE = 0.029         # 2.9% total
    SE_INCOME_FACTOR = 0.9235     # Adjustment factor for self-employment income

    # Adjust incomes
    adjusted_schedule_c_income = schedule_c_income * SE_INCOME_FACTOR
    adjusted_partnership_income = partnership_income * SE_INCOME_FACTOR
    total_adjusted_se_income = adjusted_schedule_c_income + adjusted_partnership_income

    # Calculate Social Security Tax
    total_ss_wages = min(w2_income, SS_WAGE_BASE)
    ss_taxable_limit = SS_WAGE_BASE - total_ss_wages
    ss_taxable_se_income = min(total_adjusted_se_income, ss_taxable_limit)
    social_security_tax_se = ss_taxable_se_income * SOCIAL_SECURITY_RATE

    # Calculate Medicare Tax (no wage base limit)
    medicare_tax_se = total_adjusted_se_income * MEDICARE_RATE

    # Calculate Additional Medicare Tax
    total_medicare_wages = w2_income + total_adjusted_se_income
    additional_medicare_income = 0
    if filing_status == 'single' and total_medicare_wages > 200000:
        additional_medicare_income = total_medicare_wages - 200000
    elif filing_status == 'married_jointly' and total_medicare_wages > 250000:
        additional_medicare_income = total_medicare_wages - 250000

    # Total Self-Employment Tax
    total_se_tax = social_security_tax_se + medicare_tax_se

    return {
        'adjusted_schedule_c_income': adjusted_schedule_c_income,
        'adjusted_partnership_income': adjusted_partnership_income,
        'social_security_tax_se': social_security_tax_se,
        'medicare_tax_se': medicare_tax_se,
        'total_se_tax': total_se_tax,
        'total_adjusted_se_income': total_adjusted_se_income
    }

# Test Case:
client_partnership_income = 0
client_schedule_c_income = 1000000
client_w2_income = 0
year = 2024
filing_status = 'married_jointly'

se_tax_details = calculate_se_tax(
    client_schedule_c_income,
    client_w2_income,
    year,
    partnership_income=client_partnership_income,
    filing_status=filing_status
)

print(f"---------------------------------------") 
print(f"Adjusted Schedule C Income: ${se_tax_details['adjusted_schedule_c_income']:,.2f}")
print(f"Adjusted Partnership Income: ${se_tax_details['adjusted_partnership_income']:,.2f}")
print(f"Social Security Tax (Self-Employment): ${se_tax_details['social_security_tax_se']:,.2f}")
print(f"Medicare Tax (Self-Employment): ${se_tax_details['medicare_tax_se']:,.2f}")
print(f"Total Self-Employment Tax: ${se_tax_details['total_se_tax']:,.2f}")
print(f"---------------------------------------")
