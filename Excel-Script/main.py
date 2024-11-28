# Author: Asim Sheikh (Software Enigneer @ Genwealth 360 Inc.)

import pandas as pd
from openpyxl import load_workbook

# # To Load in Excel Sheet
# file_path = "template.xlsx"
# workbook = load_workbook(file_path)
# sheet = workbook.active

def calculate_se_tax(schedule_c_income, w2_income, year, partnership_income=0, filing_status='single'):
    SS_WAGE_BASE_2022 = 147000
    SS_WAGE_BASE_2023 = 160200
    SS_WAGE_BASE_2024 = 168600
    MEDICARE_RATE = 0.029
    SOCIAL_SECURITY_RATE = 0.124
    MAX_SS_WAGE_BASE = {2022: SS_WAGE_BASE_2022, 2023: SS_WAGE_BASE_2023, 2024: SS_WAGE_BASE_2024}
    
    adjusted_income = max(schedule_c_income * 0.9235, 0)
    
    medicare_tax = adjusted_income * MEDICARE_RATE
    
    ss_wage_base = MAX_SS_WAGE_BASE[year]
    social_security_tax = min(adjusted_income, ss_wage_base) * SOCIAL_SECURITY_RATE
    
    w2_ss_tax = min(w2_income, ss_wage_base) * SOCIAL_SECURITY_RATE
    w2_medicare_tax = w2_income * MEDICARE_RATE
    
    social_security_tax = max(social_security_tax - w2_ss_tax, 0)
    medicare_tax = max(medicare_tax - w2_medicare_tax, 0)

    total_se_tax = medicare_tax + social_security_tax
    
    return {
        'adjusted_income': adjusted_income,
        'medicare_tax': medicare_tax,
        'social_security_tax': social_security_tax,
        'w2_ss_tax': w2_ss_tax,
        'w2_medicare_tax': w2_medicare_tax,
        'total_se_tax': total_se_tax
    }

client_partnership_income = 0
client_schedule_c_income = 1000000 + client_partnership_income
client_w2_income = 50000
year = 2023
filing_status = 'married_jointly'

se_tax_details = calculate_se_tax(
    client_schedule_c_income,
    client_w2_income,
    year,
    partnership_income=client_partnership_income,
    filing_status=filing_status
)

print(f"---------------------------------------") 
print(f"Adjusted Income: ${se_tax_details['adjusted_income']:,.2f}")
print(f"Medicare Tax: ${se_tax_details['medicare_tax']:,.2f}")
print(f"Social Security Tax: ${se_tax_details['social_security_tax']:,.2f}")
print(f"W-2 Social Security Tax: ${se_tax_details['w2_ss_tax']:,.2f}")
print(f"W-2 Medicare Tax: ${se_tax_details['w2_medicare_tax']:,.2f}")
print(f"Total Self-Employment Tax: ${se_tax_details['total_se_tax']:,.2f}")
print(f"---------------------------------------")
