//-------------------------------//
// 1. SUBMIT HANDLER AND RESULTS //
//-------------------------------//

document.getElementById('taxForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Prevent default form submission

    // Gather form data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields to numbers (strip currency formatting if present)
    for (let key in data) {
        if (!isNaN(data[key]) && data[key].trim() !== '') {
            data[key] = parseFloat(data[key].replace(/[^0-9.-]/g, ''));
        }
    }

    // Display loading message
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p>Processing your data...</p>';
    resultsDiv.classList.remove('hidden');

    try {
        // Example: POST to local Flask server. Adjust if needed:
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

// Display results from server
function displayResults(resultData) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <h2>Your Tax Results</h2>
        <p><strong>Taxable Income:</strong> $${resultData.taxableIncome.toFixed(2)}</p>
        <p><strong>Total Tax Owed:</strong> $${resultData.totalTax.toFixed(2)}</p>
        <p><strong>Refund or Amount Due:</strong> $${resultData.refundOrDue.toFixed(2)}</p>
    `;
}


//-------------------------------------------//
// 2. "BACK TO TOP" BUTTON AND WINDOW SCROLL //
//-------------------------------------------//

window.onscroll = function() {
    scrollFunction();
};

function scrollFunction() {
    const backToTopBtn = document.getElementById("backToTopBtn");
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

document.getElementById('backToTopBtn').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


//-----------------------------//
// 3. SPOUSE SECTION ANIMATION //
//-----------------------------//

document.getElementById('filingStatus').addEventListener('change', function() {
    const spouseSection = document.getElementById('spouseSection');
    if (this.value === 'Married Filing Jointly') {
        showElement(spouseSection);
    } else {
        hideElement(spouseSection);
    }
});

function showElement(element) {
    element.style.display = 'block';
    element.style.maxHeight = element.scrollHeight + 'px';
    element.style.transition = 'max-height 1s ease-in-out';
}

function hideElement(element) {
    element.style.maxHeight = '0';
    element.style.transition = 'max-height 1s ease-in-out';
    setTimeout(() => {
        element.style.display = 'none';
        element.style.backgroundColor = ''; // Reset styling
    }, 500);
}


//-------------------------------------//
// 4. CHILDREN DETAILS (DYNAMIC FIELDS) //
//-------------------------------------//

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

    // Age from birthdate
    document.getElementById(`child${index}Birthdate`).addEventListener('change', function() {
        calculateAge(this.value, `child${index}Age`, true);
    });

    // Validate age
    document.getElementById(`child${index}Age`).addEventListener('input', function() {
        validateAgeInput(this, index, true);
    });
}

function createLabelAndInput(container, id, labelText, type) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    label.style.marginTop = '12px';
    container.appendChild(label);

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.required = true;
    container.appendChild(input);
}

function createEmploymentStatusField(container, index) {
    const employmentLabel = document.createElement('label');
    employmentLabel.setAttribute('for', `child${index}Employed`);
    employmentLabel.textContent = `Is Child ${index} Currently Employed:`;
    employmentLabel.style.marginTop = '12px';
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


//----------------------//
// 5. AGE CALCULATIONS  //
//----------------------//

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    validateAgeInput(this, 'current', false);
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    validateAgeInput(this, 'spouse', false);
});

function calculateAge(birthdateValue, ageInputId, isChild = false) {
    const birthdate = new Date(birthdateValue);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    document.getElementById(ageInputId).value = age;

    // Validate if it is a child's age
    if (isChild) {
        validateAgeInput(document.getElementById(ageInputId), ageInputId.replace('child', '').replace('Age', ''), true);
    }
}

function validateAgeInput(input, index, isChild = false) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);

    if (isChild) {
        // child must be 0..17
        if (!isNaN(age) && age >= 0 && age < 18) {
            if (errorMessage) errorMessage.textContent = '';
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
        // adult can be any age >= 0
        if (!isNaN(age) && age >= 0) {
            if (errorMessage) errorMessage.textContent = '';
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


//-----------------------------------------------------//
// 6. AUTO-COPY LAST NAME TO SPOUSE'S LAST NAME        //
//-----------------------------------------------------//

document.getElementById('lastName').addEventListener('input', function() {
    document.getElementById('spouseLastName').value = this.value;
});


//-----------------------------------------------------//
// 7. HELPER FUNCTIONS FOR NUMBER FIELDS AND CURRENCY  //
//-----------------------------------------------------//

function getFieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    // strip currency formatting:
    let val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
    return isNaN(val) ? 0 : val;
}

function formatCurrency(value) {
    // remove any existing commas or dollar signs
    let numericValue = value.replace(/[^0-9.-]/g, '');
    if (numericValue === '') return '';
    let floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return '';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
        .format(floatValue);
}

function unformatCurrency(value) {
    return parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
}

// Automatically format any .currency-field on blur
document.querySelectorAll('.currency-field').forEach((elem) => {
    elem.addEventListener('blur', function() {
        this.value = formatCurrency(this.value);
    });
});


//-----------------------------------------------------------//
// 8. DYNAMIC GENERATION OF BUSINESS FIELDS + NET CALC       //
//-----------------------------------------------------------//

document.getElementById('numBusinesses').addEventListener('input', function() {
    const businessCount = parseInt(this.value, 10);
    const container = document.getElementById('businessContainer');
    container.innerHTML = ''; // Clear existing fields

    if (!isNaN(businessCount) && businessCount > 0) {
        for (let i = 1; i <= businessCount; i++) {
            createBusinessFields(container, i);
        }
    }
});

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

    // Ownership %
    createLabelAndNumberField(businessDiv, `business${index}Ownership`, `Ownership %:`, 0);

    // Income
    createLabelAndCurrencyField(businessDiv, `business${index}Income`, `Income:`);

    // Expenses
    createLabelAndCurrencyField(businessDiv, `business${index}Expenses`, `Expenses:`);

    // Net (Income - Expenses)
    createLabelAndTextField(businessDiv, `business${index}Net`, `Net (Income - Expenses):`);
    container.appendChild(businessDiv);

    // The newly created 'Net' field
    const netField = document.getElementById(`business${index}Net`);
    netField.readOnly = true;

    // Income + Expenses listeners
    const incomeField = document.getElementById(`business${index}Income`);
    const expensesField = document.getElementById(`business${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
    });
    expensesField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
    });

    // If Ownership < 100, show spouse/other
    const ownershipField = document.getElementById(`business${index}Ownership`);
    ownershipField.addEventListener('change', function() {
        checkOwnership(index, this.value);
    });
}

function createLabelAndTextField(parent, id, labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    parent.appendChild(input);
}

function createLabelAndNumberField(parent, id, labelText, minValue) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.name = id;
    input.min = minValue;
    parent.appendChild(input);
}

function createLabelAndCurrencyField(parent, id, labelText) {
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    label.style.marginTop = '12px';
    parent.appendChild(label);

    const input = document.createElement('input');
    input.type = 'text';
    input.id = id;
    input.name = id;
    input.classList.add('currency-field');
    parent.appendChild(input);

    // On blur, format as currency
    input.addEventListener('blur', function() {
        input.value = formatCurrency(input.value);
    });
}

function updateBusinessNet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;
    document.getElementById(`business${index}Net`).value = formatCurrency(netVal.toString());
}

function checkOwnership(index, ownershipValue) {
    const ownership = parseFloat(ownershipValue) || 0;
    const existingAdditionalOwnerDiv = document.getElementById(`additionalOwner${index}`);
    if (existingAdditionalOwnerDiv) {
        existingAdditionalOwnerDiv.remove();
    }
    if (ownership < 100) {
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

        // Insert under the same business block
        document.getElementById(`business${index}Type`).parentNode.appendChild(additionalOwnerDiv);
    }
}


//-----------------------------------------------------//
// 9. REAL-TIME CALCULATIONS FOR INCOME/ADJUSTMENTS     //
//-----------------------------------------------------//

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
    const scheduleE1Income = getFieldValue('scheduleE1Income');
    const scheduleE1Expenses = getFieldValue('scheduleE1Expenses');
    const scheduleE2Income = getFieldValue('scheduleE2Income');
    const scheduleE2Expenses = getFieldValue('scheduleE2Expenses');
    const otherIncome = getFieldValue('otherIncome');

    // Combine net from dynamic businesses
    let businessesNetTotal = 0;
    const numBusinessesVal = parseInt(document.getElementById('numBusinesses').value || '0', 10);
    for (let i = 1; i <= numBusinessesVal; i++) {
        const netValStr = document.getElementById(`business${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        businessesNetTotal += netVal;
    }

    // Schedule C incomes/expenses (if any)
    const scheduleC1Income = getFieldValue('scheduleC1Income');
    const scheduleC1Expenses = getFieldValue('scheduleC1Expenses');
    const scheduleC2Income = getFieldValue('scheduleC2Income');
    const scheduleC2Expenses = getFieldValue('scheduleC2Expenses');

    // Sum everything
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
        (scheduleE1Income - scheduleE1Expenses) +
        (scheduleE2Income - scheduleE2Expenses) +
        (scheduleC1Income - scheduleC1Expenses) +
        (scheduleC2Income - scheduleC2Expenses) +
        businessesNetTotal +
        otherIncome;

    // Adjustments
    const halfSETax = getFieldValue('halfSETax');
    const retirementDeduction = getFieldValue('retirementDeduction');
    const medicalReimbursementPlan = getFieldValue('medicalReimbursementPlan');
    const SEHealthInsurance = getFieldValue('SEHealthInsurance');
    const alimonyPaid = getFieldValue('alimonyPaid');
    const otherAdjustments = getFieldValue('otherAdjustments');

    // Adjusted Gross Income
    const totalAdjustedGrossIncomeVal =
        totalIncomeVal -
        halfSETax -
        retirementDeduction -
        medicalReimbursementPlan -
        SEHealthInsurance -
        alimonyPaid -
        otherAdjustments;

    // Update read-only fields
    document.getElementById('totalIncome').value = totalIncomeVal.toFixed(2);
    document.getElementById('totalAdjustedGrossIncome').value = totalAdjustedGrossIncomeVal.toFixed(2);

    // Also recalc taxable income
    updateTaxableIncome();
}


//--------------------------------------------------------//
// 10. REAL-TIME CALCULATIONS FOR DEDUCTIONS + TAXABLE    //
//--------------------------------------------------------//

function recalculateDeductions() {
    const medical = getFieldValue('medical');
    const stateAndLocalTaxes = getFieldValue('stateAndLocalTaxes');
    const otherTaxesFromSchK1 = getFieldValue('otherTaxesFromSchK-1');
    const interest = getFieldValue('interest');
    const contributions = getFieldValue('contributions');
    const otherDeductions = getFieldValue('otherDeductions');
    const carryoverLoss = getFieldValue('carryoverLoss');
    const casualtyAndTheftLosses = getFieldValue('casualtyAndTheftLosses');
    const miscellaneousDeductions = getFieldValue('miscellaneousDeductions');
    const standardOrItemizedDeduction = getFieldValue('standardOrItemizedDeduction');

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

    document.getElementById('totalDeductions').value = totalDeductionsVal.toFixed(2);

    // Then update Taxable Income
    updateTaxableIncome();
}

function updateTaxableIncome() {
    const totalAdjustedGrossIncome = getFieldValue('totalAdjustedGrossIncome');
    const totalDeductions = getFieldValue('totalDeductions');
    const taxableIncome = totalAdjustedGrossIncome - totalDeductions;
    document.getElementById('taxableIncome').value = taxableIncome.toFixed(2);
}


//-----------------------------------------------------------//
// 11. ATTACHING EVENT LISTENERS FOR REAL-TIME CALCULATIONS  //
//-----------------------------------------------------------//

// Fields that affect totalIncome and AGI:
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
    'scheduleE1Income',
    'scheduleE1Expenses',
    'scheduleE2Income',
    'scheduleE2Expenses',
    'otherIncome',
    'scheduleC1Income',
    'scheduleC1Expenses',
    'scheduleC2Income',
    'scheduleC2Expenses',
    'halfSETax',
    'retirementDeduction',
    'medicalReimbursementPlan',
    'SEHealthInsurance',
    'alimonyPaid',
    'otherAdjustments'
];

fieldsToWatch.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateTotals);
        field.addEventListener('change', recalculateTotals);
    }
});

// Fields that affect totalDeductions:
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

deductionFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
        field.addEventListener('input', recalculateDeductions);
        field.addEventListener('change', recalculateDeductions);
    }
});

//-----------------------------------------------------------//
// 12. TURNS INPUT FIELD BORDER COLOR GREEN TO COMFIRM INPUT //
//-----------------------------------------------------------//

document.querySelectorAll('input, select').forEach((element) => {
    element.addEventListener('blur', function() {
      this.classList.add('input-completed');
    });
  });

//------------------------------------------//
// 13. INITIALIZE CALCULATIONS ON PAGE LOAD //
//------------------------------------------//

document.addEventListener('DOMContentLoaded', function() {
    // Trigger initial calculations if default values exist:
    recalculateTotals();
    recalculateDeductions();
});
