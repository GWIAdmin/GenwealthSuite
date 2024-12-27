// Load the tax form data from the server
document.getElementById('taxForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission
  
    // Gather form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
  
    // Convert numeric fields to numbers
    for (let key in data) {
        if (!isNaN(data[key]) && data[key].trim() !== '') {
            data[key] = parseFloat(data[key]);
        }
    }
  
    // Display loading message
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Processing your data...</p>';
    resultsDiv.classList.remove('hidden');
  
    try {
        const response = await fetch('http://127.0.0.1:5000/process-tax-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
  
        if (!response.ok) throw new Error('Failed to process the data.');
  
        const resultData = await response.json();
        displayResults(resultData);
    } catch (error) {
        resultsDiv.innerHTML = '<p>Error processing your data. Try again later.</p>';
    }
});

// Display results
function displayResults(resultData) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Your Tax Results</h2>
        <p><strong>Taxable Income:</strong> $${resultData.taxableIncome.toFixed(2)}</p>
        <p><strong>Total Tax Owed:</strong> $${resultData.totalTax.toFixed(2)}</p>
        <p><strong>Refund or Amount Due:</strong> $${resultData.refundOrDue.toFixed(2)}</p>
    `;
}

// Show or hide the "Back to Top" button based on scroll position
window.onscroll = function() {
    scrollFunction();
};

// Show the "Back to Top" button when the user scrolls down 20px from the top of the document
function scrollFunction() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

// Scroll to the top of the page when the button is clicked
document.getElementById('backToTopBtn').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth' // Smooth scroll
    });
});

// Add a "completed" class to form inputs when they lose focus
document.querySelectorAll('input, select').forEach((element) => {
  element.addEventListener('blur', function() {
    this.classList.add('input-completed');
  });
});

// Dynamic display of spouse section based on Filing Status
document.getElementById('filingStatus').addEventListener('change', function() {
    const spouseSection = document.getElementById('spouseSection');
    if (this.value === 'Married Filing Jointly') {
        showElement(spouseSection);
    } else {
        hideElement(spouseSection);
    }
});

// Helper functions to show elements with animation
function showElement(element) {
    element.style.display = 'block';
    element.style.maxHeight = element.scrollHeight + 'px';
    element.style.transition = 'max-height 1s ease-in-out';
}

// Helper functions to hide elements with animation
function hideElement(element) {
    element.style.maxHeight = '0';
    element.style.transition = 'max-height 1s ease-in-out';
    setTimeout(() => {
        element.style.display = 'none';
        element.style.backgroundColor = ''; // Reset the background color
    }, 500); // Match the duration of the transition
}

// Dynamic generation of children details fields
document.getElementById('children17AndUnder').addEventListener('input', function() {
    const numChildren = parseInt(this.value, 10);
    const childrenContainer = document.getElementById('children17AndUnderDetails');
    childrenContainer.innerHTML = ''; // Clear old fields

    if (!isNaN(numChildren) && numChildren > 0) {
        const heading = document.createElement('h2');
        heading.textContent = 'Children Details';
        childrenContainer.appendChild(heading);

        // Create input fields for each child
        for (let i = 1; i <= numChildren; i++) {
            createChildFields(childrenContainer, i);
        }
    }
});

// Helper function to create child fields
function createChildFields(container, index) {
    const childGroup = document.createElement('div');
    childGroup.classList.add('form-group');

    // Child Name
    createLabelAndInput(childGroup, `child${index}Name`, `Child ${index} Name:`, 'text');

    // Child Birthdate
    createLabelAndInput(childGroup, `child${index}Birthdate`, `Child ${index} Birthdate:`, 'date');

    // Child Current Age
    createLabelAndInput(childGroup, `child${index}Age`, `Child ${index} Current Age:`, 'number');

    // Employment Status
    createEmploymentStatusField(childGroup, index);

    container.appendChild(childGroup);

    // Add event listener to calculate age based on birthdate
    document.getElementById(`child${index}Birthdate`).addEventListener('change', function() {
        calculateAge(this.value, `child${index}Age`, true);
    });

    // Allow manual input for current age with validation
    document.getElementById(`child${index}Age`).addEventListener('input', function() {
        validateAgeInput(this, index, true);
    });
}

// Helper function to create a label and input field
function createLabelAndInput(container, id, labelText, type) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    label.style.marginTop = '12px'; // Add vertical spacing
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = true;
    container.appendChild(input);
}

// Helper function to create employment status field
function createEmploymentStatusField(container, index) {
    const employmentLabel = document.createElement('label');
    employmentLabel.setAttribute('for', `child${index}Employed`);
    employmentLabel.textContent = `Is Child ${index} Currently Employed:`;
    employmentLabel.style.marginTop = '12px'; // Add vertical spacing
    container.appendChild(employmentLabel);

    const employmentSelect = document.createElement('select');
    employmentSelect.id = `child${index}Employed`;
    employmentSelect.name = `child${index}Employed`;
    employmentSelect.required = true;

    const optionPleaseSelect = document.createElement('option');
    optionPleaseSelect.value = '';
    optionPleaseSelect.textContent = 'Please Select';
    employmentSelect.appendChild(optionPleaseSelect);
    
    const optionNo = document.createElement('option');
    optionNo.value = 'no';
    optionNo.textContent = 'No';
    employmentSelect.appendChild(optionNo);

    const optionYes = document.createElement('option');
    optionYes.value = 'yes';
    optionYes.textContent = 'Yes';
    employmentSelect.appendChild(optionYes);

    container.appendChild(employmentSelect);
}

// Helper function to calculate age based on birthdate
function calculateAge(birthdateValue, ageInputId, isChild = false) {
    const birthdate = new Date(birthdateValue);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    document.getElementById(ageInputId).value = age;

    // Validate age if it's for a child
    if (isChild) {
        validateAgeInput(document.getElementById(ageInputId), ageInputId.replace('child', '').replace('Age', ''), true);
    }
}

// Helper function to validate age input
function validateAgeInput(input, index, isChild = false) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);

    if (isChild) {
        if (!isNaN(age) && age >= 0 && age < 18) {
            input.value = age;
            if (errorMessage) errorMessage.textContent = ''; // Clear error message
        } else {
            if (!errorMessage) {
                errorMessage = document.createElement('p');
                errorMessage.id = errorMessageId;
                errorMessage.style.color = 'red';
                errorMessage.textContent = 'Sorry, age must be between 0 and 17';
                input.parentNode.appendChild(errorMessage);
            } else {
                errorMessage.textContent = 'Sorry, age must be between 0 and 17';
            }
        }
    } else {
        if (!isNaN(age) && age >= 0) {
            input.value = age;
            if (errorMessage) errorMessage.textContent = ''; // Clear error message
        } else {
            if (!errorMessage) {
                errorMessage = document.createElement('p');
                errorMessage.id = errorMessageId;
                errorMessage.style.color = 'red';
                errorMessage.textContent = 'Please enter a valid age';
                input.parentNode.appendChild(errorMessage);
            } else {
                errorMessage.textContent = 'Please enter a valid age';
            }
        }
    }
}

// Calculate age based on birthdate
document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

// Allow manual input for current age
document.getElementById('currentAge').addEventListener('input', function() {
    validateAgeInput(this, 'current', false);
});

// Calculate age based on spouse birthdate
document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

// Allow manual input for spouse current age
document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    validateAgeInput(this, 'spouse', false);
});

// Automatically copy last name to spouse's last name
document.getElementById('lastName').addEventListener('input', function() {
    document.getElementById('spouseLastName').value = this.value;
});

// A helper function to safely parse field values as numbers
function getFieldValue(id) {
    const val = parseFloat(document.getElementById(id).value);
    return isNaN(val) ? 0 : val;
}

// Recalculate totals for Total Income and AGI
function recalculateTotals() {
    // Income fields
    const wages = getFieldValue('wages');
    const reasonableCompensation = getFieldValue('reasonableCompensation');
    const taxExemptInterest = getFieldValue('taxExemptInterest');
    const taxableInterest = getFieldValue('taxableInterest');
    const taxableIRA = getFieldValue('taxableIRA');
    const taxableDividends = getFieldValue('taxableDividends');
    const qualifiedDividends = getFieldValue('qualifiedDividends');
    const iraDistributions = getFieldValue('iraDistributions');
    const pensions = getFieldValue('pensions');
    const longTermCapitalGains = getFieldValue('longTermCapitalGains');
    const shortTermCapitalGains = getFieldValue('shortTermCapitalGains');
    const business1Income = getFieldValue('business1Income');
    const business1Expenses = getFieldValue('business1Expenses');
    const business2Income = getFieldValue('business2Income');
    const business2Expenses = getFieldValue('business2Expenses');
    const scheduleC1Income = getFieldValue('scheduleC1Income');
    const scheduleC1Expenses = getFieldValue('scheduleC1Expenses');
    const scheduleC2Income = getFieldValue('scheduleC2Income');
    const scheduleC2Expenses = getFieldValue('scheduleC2Expenses');
    const scheduleE1Income = getFieldValue('scheduleE1Income');
    const scheduleE1Expenses = getFieldValue('scheduleE1Expenses');
    const scheduleE2Income = getFieldValue('scheduleE2Income');
    const scheduleE2Expenses = getFieldValue('scheduleE2Expenses');
    const otherIncome = getFieldValue('otherIncome');

    // Calculate Total Income
    const totalIncomeVal = 
        wages +
        reasonableCompensation +
        taxExemptInterest +
        taxableInterest +
        taxableIRA +
        taxableDividends +
        qualifiedDividends +
        iraDistributions +
        pensions +
        longTermCapitalGains +
        shortTermCapitalGains +
        (business1Income - business1Expenses) +
        (business2Income - business2Expenses) +
        (scheduleC1Income - scheduleC1Expenses) +
        (scheduleC2Income - scheduleC2Expenses) +
        (scheduleE1Income - scheduleE1Expenses) +
        (scheduleE2Income - scheduleE2Expenses) +
        otherIncome;

    // Adjustment fields
    const halfSETax = getFieldValue('halfSETax');
    const retirementDeduction = getFieldValue('retirementDeduction');
    const medicalReimbursementPlan = getFieldValue('medicalReimbursementPlan');
    const SEHealthInsurance = getFieldValue('SEHealthInsurance');
    const alimonyPaid = getFieldValue('alimonyPaid');
    const otherAdjustments = getFieldValue('otherAdjustments');

    // Calculate Adjusted Gross Income
    const totalAdjustedGrossIncomeVal = 
        totalIncomeVal -
        halfSETax -
        retirementDeduction -
        medicalReimbursementPlan -
        SEHealthInsurance -
        alimonyPaid -
        otherAdjustments;

    // Update fields
    document.getElementById('totalIncome').value = totalIncomeVal.toFixed(2);
    document.getElementById('totalAdjustedGrossIncome').value = totalAdjustedGrossIncomeVal.toFixed(2);
}

// Add event listeners to all relevant fields
// You can list all fields that affect income and AGI here:
const fieldsToWatch = [
    'wages',
    'reasonableCompensation',
    'taxExemptInterest',
    'taxableInterest',
    'taxableIRA',
    'taxableDividends',
    'qualifiedDividends',
    'iraDistributions',
    'pensions',
    'longTermCapitalGains',
    'shortTermCapitalGains',
    'business1Income',
    'business1Expenses',
    'business2Income',
    'business2Expenses',
    'scheduleC1Income',
    'scheduleC1Expenses',
    'scheduleC2Income',
    'scheduleC2Expenses',
    'scheduleE1Income',
    'scheduleE1Expenses',
    'scheduleE2Income',
    'scheduleE2Expenses',
    'otherIncome',
    'halfSETax',
    'retirementDeduction',
    'medicalReimbursementPlan',
    'SEHealthInsurance',
    'alimonyPaid',
    'otherAdjustments'
];

// Attach event listeners to trigger recalculation
fieldsToWatch.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateTotals);
        field.addEventListener('change', recalculateTotals);
    }
});

// Helper function to safely parse deduction fields
function getDeductionValue(id) {
    const val = parseFloat(document.getElementById(id).value);
    return isNaN(val) ? 0 : val;
}

// Recalculate total deductions
function recalculateDeductions() {
    const medical = getDeductionValue('medical');
    const stateAndLocalTaxes = getDeductionValue('stateAndLocalTaxes');
    const otherTaxesFromSchK1 = getDeductionValue('otherTaxesFromSchK-1'); // ID includes a hyphen and 'K-1'
    const interest = getDeductionValue('interest');
    const contributions = getDeductionValue('contributions');
    const otherDeductions = getDeductionValue('otherDeductions');
    const carryoverLoss = getDeductionValue('carryoverLoss');
    const casualtyAndTheftLosses = getDeductionValue('casualtyAndTheftLosses');
    const miscellaneousDeductions = getDeductionValue('miscellaneousDeductions');
    const standardOrItemizedDeduction = getDeductionValue('standardOrItemizedDeduction');

    // Sum all deductions
    const totalDeductionsVal = 
        medical +
        stateAndLocalTaxes +
        otherTaxesFromSchK1 +
        interest +
        contributions +
        otherDeductions +
        carryoverLoss +
        casualtyAndTheftLosses +
        miscellaneousDeductions +
        standardOrItemizedDeduction;

    // Update the totalDeductions field
    document.getElementById('totalDeductions').value = totalDeductionsVal.toFixed(2);
}

// List all deduction fields that affect the total deductions calculation
const deductionFields = [
    'medical',
    'stateAndLocalTaxes',
    'otherTaxesFromSchK-1',
    'interest',
    'contributions',
    'otherDeductions',
    'carryoverLoss',
    'casualtyAndTheftLosses',
    'miscellaneousDeductions',
    'standardOrItemizedDeduction'
];

// Attach event listeners to trigger recalculation
deductionFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateDeductions);
        field.addEventListener('change', recalculateDeductions);
    }
});

// Function to calculate and update Taxable Income
function updateTaxableIncome() {
    const totalAdjustedGrossIncome = getFieldValue('totalAdjustedGrossIncome');
    const totalDeductions = getFieldValue('totalDeductions');
    const taxableIncome = totalAdjustedGrossIncome - totalDeductions;

    document.getElementById('taxableIncome').value = taxableIncome.toFixed(2);
}

// Function to recalculate totals for Total Income and AGI
function recalculateTotals() {
    const wages = getFieldValue('wages');
    const taxableIRA = getFieldValue('taxableIRA');
    const longTermCapitalGains = getFieldValue('longTermCapitalGains');

    // Adjustments
    const halfSETax = getFieldValue('halfSETax');
    const otherAdjustments = getFieldValue('otherAdjustments');

    // Calculate Total Adjusted Gross Income
    const totalIncomeVal = wages + taxableIRA + longTermCapitalGains;
    const totalAdjustedGrossIncomeVal = totalIncomeVal - halfSETax - otherAdjustments;

    document.getElementById('totalIncome').value = totalIncomeVal.toFixed(2);
    document.getElementById('totalAdjustedGrossIncome').value = totalAdjustedGrossIncomeVal.toFixed(2);

    updateTaxableIncome();
}

// Function to recalculate total deductions
function recalculateDeductions() {
    const standardOrItemizedDeduction = getDeductionValue('standardOrItemizedDeduction');
    const miscellaneousDeductions = getDeductionValue('miscellaneousDeductions');

    // Calculate Total Deductions
    const totalDeductionsVal = standardOrItemizedDeduction + miscellaneousDeductions;

    document.getElementById('totalDeductions').value = totalDeductionsVal.toFixed(2);

    updateTaxableIncome();
}

// Ensure the DOM is fully loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Automatically copy the value from the 'state' field to the 'selectState' field
    const stateField = document.getElementById('state');
    const selectStateField = document.getElementById('selectState');
    if (stateField && selectStateField) {
        stateField.addEventListener('input', function() {
            selectStateField.value = this.value;
        });
    }

    // Add event listeners to relevant fields
    document.getElementById('wages').addEventListener('input', recalculateTotals);
    document.getElementById('wages').addEventListener('change', recalculateTotals);
    document.getElementById('standardOrItemizedDeduction').addEventListener('input', recalculateDeductions);
    document.getElementById('standardOrItemizedDeduction').addEventListener('change', recalculateDeductions);
    document.getElementById('totalAdjustedGrossIncome').addEventListener('input', updateTaxableIncome);
    document.getElementById('totalAdjustedGrossIncome').addEventListener('change', updateTaxableIncome);
    document.getElementById('totalDeductions').addEventListener('input', updateTaxableIncome);
    document.getElementById('totalDeductions').addEventListener('change', updateTaxableIncome);
});

// Utility function to format number as $X,XXX.XX
function formatCurrency(value) {
    // First, remove any existing commas or dollar signs
    let numericValue = value.replace(/[^0-9.-]/g, '');
    if (numericValue === '') return '';
    
    let floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return '';

    // Format using the Intl.NumberFormat API
    let formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });
    return formatter.format(floatValue);
}

// Attach 'blur' event to all currency fields
document.querySelectorAll('.currency-field').forEach((elem) => {
    elem.addEventListener('blur', function() {
        this.value = formatCurrency(this.value);
    });
});

// If you need to convert back to a pure number for calculations, define a helper:
function unformatCurrency(value) {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

// Dynamic generation of business fields
document.getElementById('numBusinesses').addEventListener('input', function() {
    const businessCount = parseInt(this.value, 10);
    const container = document.getElementById('businessContainer');
    container.innerHTML = ''; // Clear existing business fields

    if (!isNaN(businessCount) && businessCount > 0) {
        for (let i = 1; i <= businessCount; i++) {
            createBusinessFields(container, i);
        }
    }
});

// Helper: create business fields
function createBusinessFields(container, index) {
    const businessDiv = document.createElement('div');
    businessDiv.classList.add('business-entry');
    
    // Business Type
    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
    businessDiv.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.name = `business${index}Type`;
    typeSelect.id = `business${index}Type`;
    
    // Options
    const types = ["Please Select", "S-Corp", "Partnership", "C-Corp", "Schedule-C"];
    types.forEach(t => {
        let opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });
    businessDiv.appendChild(typeSelect);

    // Business Name
    createLabelAndTextField(businessDiv, `business${index}Name`, `Business ${index} Name:`);

    // Ownership Percentage
    createLabelAndNumberField(businessDiv, `business${index}Ownership`, `Ownership %:`, 0);

    // Income
    createLabelAndCurrencyField(businessDiv, `business${index}Income`, `Income:`);

    // Expenses
    createLabelAndCurrencyField(businessDiv, `business${index}Expenses`, `Expenses:`);

    // Net
    createLabelAndTextField(businessDiv, `business${index}Net`, `Net (Income - Expenses):`);
    // Make it read-only or computed in real-time

    // Append to container
    container.appendChild(businessDiv);

    // Add event listeners for Income & Expenses to compute Net
    document.getElementById(`business${index}Income`).addEventListener('blur', function() {
        updateBusinessNet(index);
    });
    document.getElementById(`business${index}Expenses`).addEventListener('blur', function() {
        updateBusinessNet(index);
    });

    // Add event listener to Ownership to see if < 100% => prompt spouse or other
    document.getElementById(`business${index}Ownership`).addEventListener('change', function() {
        checkOwnership(index, this.value);
    });
}

// Helper: create label + text input
function createLabelAndTextField(parent, id, labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px'; // Add vertical spacing
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    parent.appendChild(input);
}

// Helper: create label + number input
function createLabelAndNumberField(parent, id, labelText, minValue) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px'; // Add vertical spacing
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.name = id;
    input.min = minValue;
    parent.appendChild(input);
}

// Helper: create label + text (for currency). You can also attach the same blur formatting logic:
function createLabelAndCurrencyField(parent, id, labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px'; // Add vertical spacing
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.classList.add('currency-field');
    parent.appendChild(input);
}

// Calculate and update Net
function updateBusinessNet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;

    // Format the net value
    document.getElementById(`business${index}Net`).value = formatCurrency(netVal.toString());
}

// Check ownership; if < 100%, prompt spouse or other
function checkOwnership(index, ownershipValue) {
    const ownership = parseFloat(ownershipValue);
    const existingAdditionalOwnerDiv = document.getElementById(`additionalOwner${index}`);
    if (existingAdditionalOwnerDiv) {
        existingAdditionalOwnerDiv.remove();
    }
    if (ownership < 100) {
        // Create a new field for additional owner details
        const additionalOwnerDiv = document.createElement('div');
        additionalOwnerDiv.classList.add('form-group');
        additionalOwnerDiv.id = `additionalOwner${index}`;

        additionalOwnerDiv.style.marginTop = '12px';

        const additionalOwnerLabel = document.createElement('label');
        additionalOwnerLabel.textContent = `Who owns the remaining ${100 - ownership}% of this business?`;
        additionalOwnerDiv.appendChild(additionalOwnerLabel);

        const additionalOwnerSelect = document.createElement('select');
        additionalOwnerSelect.name = `additionalOwner${index}`;
        additionalOwnerSelect.id = `additionalOwner${index}`;

        const optionPleaseSelect = document.createElement('option');
        optionPleaseSelect.value = '';
        optionPleaseSelect.textContent = 'Please Select';
        additionalOwnerSelect.appendChild(optionPleaseSelect);

        const optionSpouse = document.createElement('option');
        optionSpouse.value = 'Spouse';
        optionSpouse.textContent = 'Spouse';
        additionalOwnerSelect.appendChild(optionSpouse);

        const optionOther = document.createElement('option');
        optionOther.value = 'Other';
        optionOther.textContent = 'Other';
        additionalOwnerSelect.appendChild(optionOther);

        additionalOwnerDiv.appendChild(additionalOwnerSelect);

        // Append the new field to the business entry
        document.getElementById(`business${index}Type`).parentNode.appendChild(additionalOwnerDiv);
    }
}
