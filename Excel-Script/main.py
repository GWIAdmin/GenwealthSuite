# Hello World
import pandas as pd
from openpyxl import load_workbook

# To Load in Excel Sheet
file_path = "template.xlsx"
workbook = load_workbook(file_path)
sheet = workbook.active

# Extraction of Data
year = sheet["A2"].value
