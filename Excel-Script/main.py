import pandas as pd
from openpyxl import load_workbook

# To Load in Excel Sheet
file_path = "template.xlsx"
workbook = load_workbook(file_path)
sheet = workbook.active

# Extraction of Data
#  = sheet[""].value
year = sheet["B2"].value
state = sheet["B3"].value
residentInState = sheet["B4"]

additionalIncomeFromDiffState1 = sheet["B5"].value
residentInState1 = sheet["B6"].value

additionalIncomeFromDiffState2 = sheet["B7"].value
residentInState2 = sheet["B8"].value

additionalIncomeFromDiffState3 = sheet["B9"].value
residentInState3 = sheet["B10"].value

howMany65orOlder = sheet["B11"].value
howManyBlind  = sheet["B12"].value

HSA = sheet["B13"].value
businesses = sheet["B14"].value
children/Dependents = sheet["B15"].value
ownsHome = sheet["B16"].value
_401K/IRA = sheet["B17"].value

date = sheet["B19"].value

# Income Section
wagesSalariesTips = sheet["B26"].value
wagesSalariesTips1 = sheet["B27"].value
reasonableCompensation1 = sheet["B28"].value
reasonableCompensation2 = sheet["B29"].value
taxExemptInterest = sheet["B30"].value
taxableInterest = sheet["B31"].value
taxableIRA = sheet["B32"].value
taxableOrdinaryDividends = sheet["B33"].value
qualifiedDividends = sheet["B34"].value
iraDistributions = sheet["B35"].value
taxablePensionsAnnuities = sheet["B36"].value
longTermCapitalGainLoss = sheet["B37"].value
shortTermCapitalGainLoss = sheet["B38"].value
business1Income = sheet["B39"].value
business1Expenses = sheet["B40"].value
business2Income = sheet["B41"].value
business2Expenses = sheet["B42"].value
scheduleC1Income = sheet["B43"].value
scheduleC1Expenses = sheet["B44"].value
scheduleC2Income = sheet["B45"].value
scheduleC2Expenses = sheet["B46"].value
scheduleE1Income = sheet["B47"].value
scheduleE1Expenses = sheet["B48"].value
scheduleE2Income = sheet["B49"].value
scheduleE2Expenses = sheet["B50"].value
otherIncomeLossCarryforward = sheet["B51"].value
interestFromPrivateActivityBonds = sheet["B52"].value
depreciation = sheet["B53"].value
passiveActivityLossAdjustments = sheet["B54"].value
qualifiedBusinessDeduction = sheet["B55"].value
totalIncome = sheet["B56"].value

# Adjusted Gross Income Section
halfOfSelfEmploymentTax = sheet["B59"].value
retirementDeduction = sheet["B60"].value
medicalReimbursementPlan = sheet["B61"].value
selfEmployedHealthInsurance = sheet["B62"].value
alimonyPaid = sheet["B63"].value
otherAdjustments = sheet["B64"].value
totalAdjustedGrossIncome = sheet["B65"].value

# Deductions Section
medicalDeductions = sheet["B68"].value
stateLocalTaxes = sheet["B69"].value
otherTaxesFromSchK1 = sheet["B70"].value
interestDeductions = sheet["B71"].value
contributionsDeductions = sheet["B72"].value
otherDeductions = sheet["B73"].value
carryoverLoss = sheet["B74"].value
casualtyTheftLosses = sheet["B75"].value
miscellaneousDeductions = sheet["B76"].value

# Tax and Credits Section
tax = sheet["B81"].value
additionalMedicareTax = sheet["B82"].value
netInvestmentTax = sheet["B83"].value
selfEmploymentTax = sheet["B84"].value
otherTaxes = sheet["B85"].value
foreignTaxCredit = sheet["B86"].value
creditForPriorYearMinimumTax = sheet["B87"].value
nonrefundablePersonalCredits = sheet["B88"].value
generalBusinessCredit = sheet["B89"].value
childTaxCredit = sheet["B90"].value
otherCredits = sheet["B91"].value
totalFederalTax = sheet["B92"].value

# Payments Section
withholdings = sheet["B95"].value
withholdingOnMedicareWages = sheet["B96"].value
estimatedTaxPayments = sheet["B97"].value
otherPaymentsCredits = sheet["B98"].value
penalty = sheet["B99"].value
estimatedRefundOverpayment = sheet["B100"].value
estimatedBalanceDue = sheet["B101"].value

# Employee and Employer Taxes Section
employeeTaxes = sheet["B103"].value
employerTaxes = sheet["B104"].value

# State Tax Section
selectState = sheet["B107"].value
localTaxAfterCredits = sheet["B108"].value
totalTaxState = sheet["B109"].value
stateWithholdings = sheet["B110"].value
statePaymentsCredits = sheet["B111"].value
stateInterest = sheet["B112"].value
statePenalty = sheet["B113"].value
stateEstimatedRefundOverpayment = sheet["B114"].value
stateEstimatedBalanceDue = sheet["B115"].value

# Additional States (if applicable)
selectState1 = sheet["B117"].value
localTaxAfterCredits1 = sheet["B118"].value
totalTaxState1 = sheet["B119"].value
stateWithholdings1 = sheet["B120"].value
statePaymentsCredits1 = sheet["B121"].value
stateInterest1 = sheet["B122"].value
statePenalty1 = sheet["B123"].value
stateEstimatedRefundOverpayment1 = sheet["B124"].value
stateEstimatedBalanceDue1 = sheet["B125"].value

# Additional States (if applicable)
selectState2 = sheet["B127"].value
localTaxAfterCredits2 = sheet["B128"].value
totalTaxState2 = sheet["B129"].value
stateWithholdings2 = sheet["B130"].value
statePaymentsCredits2 = sheet["B131"].value
stateInterest2 = sheet["B132"].value
statePenalty2 = sheet["B133"].value
stateEstimatedRefundOverpayment2 = sheet["B134"].value
stateEstimatedBalanceDue2 = sheet["B135"].value

# Additional States (if applicable)
selectState3 = sheet["B137"].value
localTaxAfterCredits3 = sheet["B138"].value
totalTaxState3 = sheet["B139"].value
stateWithholdings3 = sheet["B140"].value
statePaymentsCredits3 = sheet["B141"].value
stateInterest3 = sheet["B142"].value
statePenalty3 = sheet["B143"].value
stateEstimatedRefundOverpayment3 = sheet["B144"].value
stateEstimatedBalanceDue3 = sheet["B145"].value

# Final Total Tax
totalTax = sheet["B146"].value
