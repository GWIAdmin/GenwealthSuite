//-------------------------------//
// 1. SUBMIT HANDLER AND RESULTS //
//-------------------------------//

document.getElementById('taxForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    for (let key in data) {
        if (!isNaN(data[key]) && data[key].trim() !== '') {
            data[key] = parseFloat(data[key].replace(/[^0-9.-]/g, ''));
        }
    }
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

function displayResults(resultData) {
    const resultsDiv = document.getElementById('results');
    const truncatedTaxableIncome = parseInt(resultData.taxableIncome);
    const truncatedTotalTax = parseInt(resultData.totalTax);
    const truncatedRefundOrDue = parseInt(resultData.refundOrDue);
    resultsDiv.innerHTML = `
        <h2>Your Tax Results</h2>
        <p><strong>Taxable Income:</strong> $${truncatedTaxableIncome}</p>
        <p><strong>Total Tax Owed:</strong> $${truncatedTotalTax}</p>
        <p><strong>Refund or Amount Due:</strong> $${truncatedRefundOrDue}</p>
    `;
}

//-----------------------//
// 1.1. Global Variables //
//-----------------------//

let userManuallyChanged65Plus = false;
let dependentBizMap = {};
let dependentsStore = {};
let lastManualAdjustment = {};

window.blurredIncome = {};
window.blurredExpenses = {};

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

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    e.returnValue = '';
});

//-----------------------------//
// 3. SPOUSE SECTION ANIMATION //
//-----------------------------//

document.getElementById('filingStatus').addEventListener('change', function() {
    const spouseSection = document.getElementById('spouseSection');
    if (this.value === 'Married Filing Jointly' || this.value === 'Married Filing Separately') {
        showElement(spouseSection);
    } else {
        hideElement(spouseSection);
    }

    // Update the blind dropdown options based on the new filing status
    updateBlindOptions();

    // Also update the "How many 65 or older:" dropdown options
    updateOlderThan65Options();
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
        element.style.backgroundColor = '';
    }, 500);
}

//-----------------------//
// 3.1. HELPER FUNCTIONS //
//-----------------------//

function updateBlindOptions() {
    const filingStatus = document.getElementById('filingStatus').value;
    const blindSelect = document.getElementById('blind');
    
    // Clear all existing options
    blindSelect.innerHTML = '';

    // Create and append the "Please Select" option
    let option = document.createElement('option');
    option.value = 'please select';
    option.textContent = 'Please Select';
    blindSelect.appendChild(option);

    // Always add option for 0 (displayed as "0" with value "Zero")
    option = document.createElement('option');
    option.value = 'Zero';
    option.textContent = '0';
    blindSelect.appendChild(option);

    // Always add option for 1 (displayed as "1" with value "One")
    option = document.createElement('option');
    option.value = 'One';
    option.textContent = '1';
    blindSelect.appendChild(option);

    // If filing status is "Married Filing Jointly", add option for 2 (value "Two")
    if (filingStatus === 'Married Filing Jointly') {
        option = document.createElement('option');
        option.value = 'Two';
        option.textContent = '2';
        blindSelect.appendChild(option);
    }
}

function updateOlderThan65Options() {
    const filingStatus = document.getElementById('filingStatus').value;
    const olderSelect = document.getElementById('olderthan65');
    
    // Clear all existing options
    olderSelect.innerHTML = '';

    // Create and append the "Please Select" option
    let option = document.createElement('option');
    option.value = 'Please Select';
    option.textContent = 'Please Select';
    olderSelect.appendChild(option);

    // Always add option for 0
    option = document.createElement('option');
    option.value = '0';
    option.textContent = '0';
    olderSelect.appendChild(option);

    // Always add option for 1
    option = document.createElement('option');
    option.value = '1';
    option.textContent = '1';
    olderSelect.appendChild(option);

    // If filing status is "Married Filing Jointly", add option for 2
    if (filingStatus === 'Married Filing Jointly') {
        option = document.createElement('option');
        option.value = '2';
        option.textContent = '2';
        olderSelect.appendChild(option);
    }
}

//--------------------------------//
// 4. DYNAMIC DEPENDENTS CREATION //
//--------------------------------//

function saveDependentsData() {
    const dependentsContainer = document.getElementById('dependentsSection');
    if (!dependentsContainer) return;
    const inputs = dependentsContainer.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.id) {
            dependentsStore[input.id] = input.value;
        }
    });
}

function populateDependentsData() {
    for (let key in dependentsStore) {
        const el = document.getElementById(key);
        if (el) {
            el.value = dependentsStore[key];

            // Trigger any relevant "change" listeners if needed.
            if (el.tagName.toLowerCase() === 'select') {
                el.dispatchEvent(new Event('change'));
            }
        }
    }
}

document.getElementById('numberOfDependents').addEventListener('input', function() {
    // 1) Save existing data before we clear and rebuild
    saveDependentsData();

    const numDependents = parseInt(this.value, 10);
    const dependentsContainer = document.getElementById('dependentsSection');
    dependentsContainer.innerHTML = '';

    if (!isNaN(numDependents) && numDependents > 0) {
        const heading = document.createElement('h1');
        heading.textContent = 'Children / Dependents Details';
        dependentsContainer.appendChild(heading);
        for (let i = 1; i <= numDependents; i++) {
            createDependentFields(dependentsContainer, i);
        }
    }

    // 2) Now repopulate the newly created fields
    populateDependentsData();
});

function createDependentFields(container, index) {
    const dependentGroup = document.createElement('div');
    dependentGroup.classList.add('dependent-entry');

    createLabelAndInput(dependentGroup, `dependent${index}Name`, `Dependent ${index} Name:`, 'text');
    createLabelAndDropdown(dependentGroup, `dependent${index}DOBOrAge`, `Do You Know the Dependent's DOB or Current Age?`, ['Please Select', 'Yes', 'No']);

    const conditionalContainer = document.createElement('div');
    conditionalContainer.id = `conditionalContainer${index}`;
    dependentGroup.appendChild(conditionalContainer);

    createLabelAndDropdown(dependentGroup, `dependent${index}Employed`, `Is Dependent ${index} Currently Employed?`, ['Please Select', 'Yes', 'No']);
    const employmentConditionalContainer = document.createElement('div');
    employmentConditionalContainer.id = `employmentConditionalContainer${index}`;
    dependentGroup.appendChild(employmentConditionalContainer);

    container.appendChild(dependentGroup);

    const employedDropdown = document.getElementById(`dependent${index}Employed`);
    if (employedDropdown) {
        employedDropdown.addEventListener('change', function () {
            handleEmploymentStatusChange(index, this.value);
        });
    }

    createLabelAndDropdown(dependentGroup, `dependent${index}Credit`, 'Qualifies for Child/Dependent Credit?', ['Please Select', 'Yes', 'No']);
    const dobOrAgeDropdown = document.getElementById(`dependent${index}DOBOrAge`);
    if (dobOrAgeDropdown) {
        dobOrAgeDropdown.addEventListener('change', function () {
            handleDOBOrAgeChange(index, this.value);
        });
    }
}

function handleDOBOrAgeChange(index, value) {
    const container = document.getElementById(`conditionalContainer${index}`);
    container.innerHTML = '';

    if (value === 'Yes') {
        // Create the "Birthdate" field:
        createLabelAndInput(container, `dependent${index}Birthdate`, `Dependent ${index} Birthdate:`, 'date');

        // Create the "Age" field:
        createLabelAndInput(container, `dependent${index}Age`, `Dependent ${index} Current Age:`, 'number');

        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
        });

        document.getElementById(`dependent${index}Age`).addEventListener('input', function() {
            if (this.value.trim() !== '') {
                document.getElementById(`dependent${index}Birthdate`).value = '';
            }
        });
    }
    else if (value === 'No') {
        createLabelAndDropdown(container, `dependent${index}AgeRange`, `What is the Age Category of Child/Dependent ${index}?`, ['Please Select','17 or younger', '18 or older']);
    }
}

function handleEmploymentStatusChange(index, value) {
    const container = document.getElementById(`employmentConditionalContainer${index}`);
    container.innerHTML = '';

    if (value === 'Yes') {
        // For Dependent 1, enforce a minimum of $1
        if (index === 1) {
            createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`, 1);
        } else {
            createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`);
        }
        
        const incomeField = document.getElementById(`dependent${index}Income`);
        incomeField.addEventListener('blur', function() {
            updateDependentBizMap(index);
            const depData = dependentBizMap[index];
            if (depData && depData.businessIndex) {
                updateBusinessNet(depData.businessIndex);
                recalculateTotals();
            }
        });

        createLabelAndDropdown(container, `dependent${index}EmployedInBusiness`, `Is Dependent ${index} Employed in One of the Client's Businesses?`, ['Please Select', 'Yes', 'No']);

        document.getElementById(`dependent${index}EmployedInBusiness`).addEventListener('change', function() {
            if (this.value === 'Yes') {
                const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
                const businessNames = [];
                for (let i = 1; i <= numBusinesses; i++) {
                    const bName = document.getElementById(`business${i}Name`)?.value || `Business ${i}`;
                    businessNames.push(bName);
                }
                createLabelAndDropdown(container, `dependent${index}BusinessName`, `Which Business?`, ['Please Select', ...(businessNames.length > 0 ? businessNames : ['No businesses available'])]);

                const bizSelect = document.getElementById(`dependent${index}BusinessName`);
                bizSelect.addEventListener('change', function() {
                    updateDependentBizMap(index);
                    const depData = dependentBizMap[index];
                    if (depData && depData.businessIndex) {
                        updateBusinessNet(depData.businessIndex);
                        recalculateTotals();
                    }
                });
            } else {
                const existingBizDropdown = document.getElementById(`dependent${index}BusinessName`);
                if (existingBizDropdown) {
                    existingBizDropdown.parentNode.removeChild(existingBizDropdown.previousSibling);
                    existingBizDropdown.parentNode.removeChild(existingBizDropdown);
                }
                delete dependentBizMap[index];
                recalculateTotals();
            }
        });

    } else if (value === 'No') {
        createLabelAndDropdown(container, `dependent${index}WillingToHire`, `Is the Client Willing to Hire Dependent ${index}?`, ['Please Select', 'Yes', 'No']);
        const willingDropdown = document.getElementById(`dependent${index}WillingToHire`);
        if (willingDropdown) {
            willingDropdown.addEventListener('change', function() {
                if (this.value === 'Yes') {
                    let dependentAge = 0;
                    const ageField = document.getElementById(`dependent${index}Age`);
                    if (ageField) {
                        dependentAge = parseInt(ageField.value, 10) || 0;
                    } else {
                        const ageRangeField = document.getElementById(`dependent${index}AgeRange`);
                        if (ageRangeField && ageRangeField.value === '18 or older') {
                            dependentAge = 18;
                        }
                    }
                    if (dependentAge >= 18) {
                        showRedDisclaimer('Hiring 18 or older will trigger FICA Taxes', `employmentConditionalContainer${index}`);
                    }
                } else {
                    const existingDisclaimer = document.getElementById(`disclaimer-employmentConditionalContainer${index}`);
                    if (existingDisclaimer) existingDisclaimer.remove();
                }
            });
        }
        delete dependentBizMap[index];
        recalculateTotals();
    }
}

function updateDependentBizMap(dependentIndex) {
    const wageStr = document.getElementById(`dependent${dependentIndex}Income`)?.value || '0';
    const wageVal = unformatCurrency(wageStr);
    const employedVal = document.getElementById(`dependent${dependentIndex}EmployedInBusiness`)?.value || 'No';
    if (employedVal !== 'Yes') {
        delete dependentBizMap[dependentIndex];
        return;
    }
    const businessName = document.getElementById(`dependent${dependentIndex}BusinessName`)?.value || '';
    let matchedBusinessIndex = null;
    const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    for (let i = 1; i <= numBusinesses; i++) {
        const currentBizName = document.getElementById(`business${i}Name`)?.value || '';
        if (currentBizName === businessName) {
            matchedBusinessIndex = i;
            break;
        }
    }
    if (!matchedBusinessIndex) {
        delete dependentBizMap[dependentIndex];
        return;
    }
    dependentBizMap[dependentIndex] = {
        businessIndex: matchedBusinessIndex,
        wage: wageVal
    };
}

function createLabelAndDropdown(container, id, labelText, options) {
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = labelText;
    label.style.marginTop = '12px';
    container.appendChild(label);
    const select = document.createElement('select');
    select.id = id;
    select.name = id;
    select.required = true;
    options.forEach(optionText => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        select.appendChild(option);
    });
    container.appendChild(select);
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

//----------------------//
// 5. AGE CALCULATIONS  //
//----------------------//

function calculateAge(birthdateValue, ageInputId) {
    let errorMessageId;
    // Use common error message IDs for client and spouse.
    if (ageInputId === 'spouseCurrentAge') {
        errorMessageId = 'spouseErrorMessage';
    } else if (ageInputId === 'currentAge') {
        errorMessageId = 'clientErrorMessage';
    }
    // For dependents, if the field is named like "dependent1Age", "dependent2Age", etc.
    else if (/^dependent\d+Age$/.test(ageInputId)) {
        // Remove the trailing "Age" and append "ErrorMessage"
        errorMessageId = ageInputId.replace(/Age$/, '') + 'ErrorMessage';
    } else {
        errorMessageId = ageInputId + 'ErrorMessage';
    }

    let errorMessage = document.getElementById(errorMessageId);
    const birthdate = new Date(birthdateValue);
    const today = new Date();

    if (isNaN(birthdate.getTime())) {
        if (!errorMessage) {
            errorMessage = document.createElement('p');
            errorMessage.id = errorMessageId;
            errorMessage.style.color = 'red';
            errorMessage.textContent = 'Invalid date format. Please enter a valid date.';
            document.getElementById(ageInputId).parentNode.appendChild(errorMessage);
        }
        return;
    }

    const todayYear = today.getFullYear();
    const birthYear = birthdate.getFullYear();
    let age = todayYear - birthYear;
    const monthDifference = today.getMonth() - birthdate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }

    if (birthdate > today) {
        displayErrorMessage(errorMessageId, 'Birthdate cannot be in the future.', ageInputId);
        document.getElementById(ageInputId).value = '';
        return;
    }

    if (age > 100) {
        displayErrorMessage(errorMessageId, 'Birthdate indicates an age greater than 100 years. Please check.', ageInputId);
        document.getElementById(ageInputId).value = '';
        return;
    }

    if (errorMessage) {
        errorMessage.textContent = '';
    }
    document.getElementById(ageInputId).value = age;
}

function validateAgeInput(input, index) {
    let errorMessageId;
    // Use common error message IDs for client and spouse.
    if (index === 'spouse') {
        errorMessageId = 'spouseErrorMessage';
    } else if (index === 'current') {
        errorMessageId = 'clientErrorMessage';
    }
    // For dependents, if the index is passed as "dependent1", "dependent2", etc.
    else if (/^dependent\d+$/.test(index)) {
        errorMessageId = index + 'ErrorMessage';
    } else {
        errorMessageId = 'ageErrorMessage' + index;
    }
    
    let errorMessage = document.getElementById(errorMessageId);
    const age = parseInt(input.value, 10);

    if (isNaN(age) || age < 0) {
        displayErrorMessage(errorMessageId, 'Age cannot be less than 0.', input.id);
    } else if (age > 100) {
        displayErrorMessage(errorMessageId, 'Age cannot be greater than 100 years.', input.id);
    } else {
        if (errorMessage) errorMessage.textContent = '';
    }
}

function autoSet65Plus() {
    if (userManuallyChanged65Plus) return;

    const filingStatus = document.getElementById('filingStatus').value;

    const clientAgeVal = parseInt(document.getElementById('currentAge').value, 10);
    const spouseAgeVal = parseInt(document.getElementById('spouseCurrentAge').value, 10);

    let client65Plus = false;
    if (!isNaN(clientAgeVal) && clientAgeVal >= 65) client65Plus = true;

    let spouse65Plus = false;
    if ((filingStatus === 'Married Filing Jointly') &&
        !isNaN(spouseAgeVal) && spouseAgeVal >= 65) {
        spouse65Plus = true;
    }

    const count65Plus = (client65Plus ? 1 : 0) + (spouse65Plus ? 1 : 0);

    const clientAgeIsValid = !isNaN(clientAgeVal);
    if (clientAgeIsValid) {
        document.getElementById('olderthan65').value = count65Plus.toString();
    }
}

function displayErrorMessage(errorMessageId, message, inputId) {
    let errorMessage = document.getElementById(errorMessageId);
    if (!errorMessage) {
        errorMessage = document.createElement('p');
        errorMessage.id = errorMessageId;
        errorMessage.classList.add('red-disclaimer');
        document.getElementById(inputId).parentNode.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
}

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        document.getElementById('birthdate').value = '';
    }
    validateAgeInput(this, 'current'); 
    autoSet65Plus();
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    if (this.value.trim() !== '') {
        document.getElementById('spouseBirthdate').value = '';
    }
    validateAgeInput(this, 'spouse');
    autoSet65Plus();
});

document.getElementById('birthdate').addEventListener('change', autoSet65Plus);
document.getElementById('spouseBirthdate').addEventListener('change', autoSet65Plus);
document.getElementById('currentAge').addEventListener('input', autoSet65Plus);
document.getElementById('spouseCurrentAge').addEventListener('input', autoSet65Plus);
document.getElementById('olderthan65').addEventListener('change', function() {
    userManuallyChanged65Plus = true;
});

//----------------------------------------------//
// 6. AUTO-COPY LAST NAME TO SPOUSE'S LAST NAME //
//----------------------------------------------//

document.getElementById('lastName').addEventListener('input', function() {
    const spouseLast = document.getElementById('spouseLastName');
    spouseLast.value = this.value;
    spouseLast.classList.add('auto-copied');
    spouseLast.classList.remove('input-completed');
});

document.getElementById('spouseLastName').addEventListener('input', function() {
    if (this.classList.contains('auto-copied')) {
        this.classList.remove('auto-copied');
    }
});

document.getElementById('spouseLastName').addEventListener('blur', function() {
    if (this.value.trim() !== '') {
        this.classList.add('input-completed');
    } else {
        this.classList.remove('input-completed');
    }
});

//--------------------------------------//
// 7. DYNAMIC BUSINESS NAME CREATION    //
//--------------------------------------//

let businessNameStore = {};
let businessDetailStore = {};

document.getElementById('numOfBusinesses').addEventListener('input', function() {
    // 1. Save existing data
    saveBusinessNameData();
    saveBusinessDetailData();

    // 2. Clear + rebuild "Business Name" fields
    const newCount = parseInt(this.value, 10) || 0;
    const nameContainer = document.getElementById('numOfBusinessesContainer');
    nameContainer.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        createBusinessNameFields(nameContainer, i);
        populateBusinessNameFields(i);
    }

    // 3. Clear + rebuild "Business Detail" fields
    const mainBizContainer = document.getElementById('businessContainer');
    mainBizContainer.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        createBusinessFields(mainBizContainer, i);
        populateBusinessDetailFields(i);
    }

    // Finally, recalc
    recalculateTotals();
});

function createBusinessNameFields(container, index) {
    const businessNameDiv = document.createElement('div');
    businessNameDiv.classList.add('business-name-entry');

    createLabelAndInput(businessNameDiv, `business${index}Name`, `Business ${index} Name:`, 'text');
    
    const checkboxContainerReports = document.createElement('div');
    checkboxContainerReports.classList.add('checkbox-container');

    const checkboxLabelReports = document.createElement('label');
    checkboxLabelReports.setAttribute('for', `business${index}Reports`);
    checkboxLabelReports.textContent = 'Do you have the financial reports for this business?';

    const checkboxInputReports = document.createElement('input');
    checkboxInputReports.type = 'checkbox';
    checkboxInputReports.id = `business${index}Reports`;
    checkboxInputReports.name = `business${index}Reports`;
    checkboxContainerReports.appendChild(checkboxInputReports);
    checkboxContainerReports.appendChild(checkboxLabelReports);

    businessNameDiv.appendChild(checkboxContainerReports);

    const checkboxContainerMedical = document.createElement('div');
    checkboxContainerMedical.classList.add('checkbox-container');
 
    const checkboxLabelMedical = document.createElement('label');
    checkboxLabelMedical.setAttribute('for', `business${index}Medical`);
    checkboxLabelMedical.textContent = 'Is this a Medical/Professional Business?';

    const checkboxInputMedical = document.createElement('input');
    checkboxInputMedical.type = 'checkbox';
    checkboxInputMedical.id = `business${index}Medical`;
    checkboxInputMedical.name = `business${index}Medical`;
    checkboxContainerMedical.appendChild(checkboxInputMedical);
    checkboxContainerMedical.appendChild(checkboxLabelMedical);

    businessNameDiv.appendChild(checkboxContainerMedical);

    const checkboxContainerRealEstate = document.createElement('div');
    checkboxContainerRealEstate.classList.add('checkbox-container');

    const checkboxLabelRealEstate = document.createElement('label');
    checkboxLabelRealEstate.setAttribute('for', `business${index}RealEstate`);
    checkboxLabelRealEstate.textContent = 'Is this a Real Estate Business?';

    const checkboxInputRealEstate = document.createElement('input');
    checkboxInputRealEstate.type = 'checkbox';
    checkboxInputRealEstate.id = `business${index}RealEstate`;
    checkboxInputRealEstate.name = `business${index}RealEstate`;
    checkboxContainerRealEstate.appendChild(checkboxInputRealEstate);
    checkboxContainerRealEstate.appendChild(checkboxLabelRealEstate);

    businessNameDiv.appendChild(checkboxContainerRealEstate);

    container.appendChild(businessNameDiv);
}

function saveBusinessNameData() {
    const container = document.getElementById('numOfBusinessesContainer');
    if (!container) return;
    const inputs = container.querySelectorAll('input[type="text"], input[type="checkbox"]');
    inputs.forEach(input => {
        const fieldId = input.id;
        if (fieldId) {
            if (input.type === 'checkbox') {
                businessNameStore[fieldId] = input.checked;
            } else {
                businessNameStore[fieldId] = input.value;
            }
        }
    });
}

function populateBusinessNameFields(index) {
    const nameFieldId = `business${index}Name`;
    const medicalCheckboxId = `business${index}Medical`;
    const realEstateCheckboxId = `business${index}RealEstate`;
    const reportsCheckboxId = `business${index}Reports`;

    if (businessNameStore[nameFieldId]) {
        const nameField = document.getElementById(nameFieldId);
        if (nameField) {
            nameField.value = businessNameStore[nameFieldId];
        }
    }
    if (businessNameStore[medicalCheckboxId] !== undefined) {
        const medCheckbox = document.getElementById(medicalCheckboxId);
        if (medCheckbox) {
            medCheckbox.checked = businessNameStore[medicalCheckboxId];
        }
    }
    if (businessNameStore[realEstateCheckboxId] !== undefined) {
        const reCheckbox = document.getElementById(realEstateCheckboxId);
        if (reCheckbox) {
            reCheckbox.checked = businessNameStore[realEstateCheckboxId];
        }
    }
    if (businessNameStore[reportsCheckboxId] !== undefined) {
        const repCheckbox = document.getElementById(reportsCheckboxId);
        if (repCheckbox) {
            repCheckbox.checked = businessNameStore[reportsCheckboxId];
        }
    }
}

//-----------------------------------------------------//
// 8. HELPER FUNCTIONS FOR NUMBER FIELDS AND CURRENCY  //
//-----------------------------------------------------//

function getFieldValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    let val = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
    return isNaN(val) ? 0 : val;
}

function formatCurrency(value) {
    let numericValue = value.replace(/[^0-9.-]/g, '');
    if (numericValue === '') return '';
    let floatValue = parseFloat(numericValue);
    if (isNaN(floatValue)) return '';
    let truncatedValue = parseInt(floatValue);
    let absoluteVal = Math.abs(truncatedValue);
    let formattedVal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(absoluteVal);
    formattedVal = formattedVal.replace(/(\.00)$/, '');
    return (truncatedValue < 0)
        ? `(${formattedVal})`
        : formattedVal;
}

function unformatCurrency(value) {
    let trimmedValue = value.trim();
    // Check if the value is negative by either a leading '-' or by being enclosed in parentheses.
    let isNegative = trimmedValue.charAt(0) === '-' || 
                     (trimmedValue.charAt(0) === '(' && trimmedValue.charAt(trimmedValue.length - 1) === ')');
    // Remove any characters except digits and the decimal point.
    let numericValue = trimmedValue.replace(/[^0-9.]/g, '');
    let floatVal = parseFloat(numericValue);
    if (isNaN(floatVal)) {
        floatVal = 0;
    }
    return isNegative ? -floatVal : floatVal;
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

function createLabelAndCurrencyField(parent, id, labelText, minValue) {
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
    input.addEventListener('blur', function() {
        if (input.value.trim() !== "") {
            let num = unformatCurrency(input.value);
            if (minValue !== undefined && num < minValue) {
                num = minValue;
            }
            input.value = formatCurrency(String(num));
        }
    });
    return input;
}

//------------------------------------------------------------//
// 9. DYNAMIC GENERATION OF BUSINESS DETAIL FIELDS + NET CALC //
//------------------------------------------------------------//

const DISCLAIMER_MAP = {};
function renderDisclaimers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimerBox = document.getElementById(`disclaimerBox-${containerId}`);
    if (!disclaimerBox) {
        disclaimerBox = document.createElement('div');
        disclaimerBox.id = `disclaimerBox-${containerId}`;
        disclaimerBox.style.marginTop = '12px';
        container.appendChild(disclaimerBox);
    }
    disclaimerBox.innerHTML = '';
    const disclaimersForThis = DISCLAIMER_MAP[containerId] || {};
    const keys = Object.keys(disclaimersForThis);
    if (!keys.length) {
        disclaimerBox.remove();
        return;
    }
    const ul = document.createElement('ul');
    ul.classList.add('red-disclaimer');
    keys.forEach(errorKey => {
        const li = document.createElement('li');
        li.textContent = disclaimersForThis[errorKey];
        ul.appendChild(li);
    });
    disclaimerBox.appendChild(ul);
}

function addDisclaimer(containerId, errorKey, message) {
    if (!DISCLAIMER_MAP[containerId]) {
        DISCLAIMER_MAP[containerId] = {};
    }
    DISCLAIMER_MAP[containerId][errorKey] = message;
    renderDisclaimers(containerId);
}

function removeDisclaimer(containerId, errorKey) {
    if (DISCLAIMER_MAP[containerId] && DISCLAIMER_MAP[containerId][errorKey]) {
        delete DISCLAIMER_MAP[containerId][errorKey];
        renderDisclaimers(containerId);
    }
}

document.getElementById('numOfBusinesses').addEventListener('input', function() {
    saveBusinessDetailData();
    const container = document.getElementById('businessContainer');
    container.innerHTML = '';
    const newCount = parseInt(this.value, 10) || 0;
    for (let i = 1; i <= newCount; i++) {
        createBusinessFields(container, i);
        populateBusinessDetailFields(i);
    }
    recalculateTotals();
});

function createBusinessFields(container, index) {

    if (blurredIncome[index] === undefined) {
        blurredIncome[index] = false;
    }
    if (blurredExpenses[index] === undefined) {
        blurredExpenses[index] = false;
    }

    const businessDiv = document.createElement('div');
    businessDiv.classList.add('business-entry');
    businessDiv.id = `businessEntry${index}`;

    const heading = document.createElement('h3');
    heading.id = `businessNameHeading${index}`;
    heading.classList.add('dynamic-heading');
    const bNameInput = document.getElementById(`business${index}Name`);
    heading.textContent = bNameInput ? bNameInput.value : `Business ${index}`;
    if (bNameInput) {
        bNameInput.addEventListener('input', function() {
            heading.textContent = bNameInput.value;
        });
    }
    businessDiv.appendChild(heading);

    // Business type
    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
    typeLabel.setAttribute('for', `business${index}Type`);
    businessDiv.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.name = `business${index}Type`;
    typeSelect.id = `business${index}Type`;
    ["Please Select", "S-Corp", "Partnership", "C-Corp", "Schedule-C"].forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });
    businessDiv.appendChild(typeSelect);

    createLabelAndCurrencyField(businessDiv, `business${index}Income`, `Income:`);
    createLabelAndCurrencyField(businessDiv, `business${index}Expenses`, `Expenses:`);
    createLabelAndTextField(businessDiv, `business${index}Net`, `Net (Income - Expenses):`);

    const incomeField = businessDiv.querySelector(`#business${index}Income`);
    const expensesField = businessDiv.querySelector(`#business${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        blurredIncome[index] = true;
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });

    expensesField.addEventListener('blur', function() {
        blurredExpenses[index] = true;
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });

    const netField = businessDiv.querySelector(`#business${index}Net`);
    if (netField) {
        netField.readOnly = true;
    }

    const ownersContainer = document.createElement('div');
    ownersContainer.id = `ownersContainer${index}`;
    businessDiv.appendChild(ownersContainer);

    const numOwnersLabel = document.createElement('label');
    numOwnersLabel.textContent = `How many owners does Business ${index} have?`;
    numOwnersLabel.setAttribute('for', `numOwnersSelect${index}`);
    numOwnersLabel.style.marginTop = '12px';
    ownersContainer.appendChild(numOwnersLabel);

    const numOwnersSelect = document.createElement('select');
    numOwnersSelect.id = `numOwnersSelect${index}`;
    numOwnersSelect.name = `numOwnersSelect${index}`;
    ownersContainer.appendChild(numOwnersSelect);
    // We'll fill in the options once we know business type (below).

    const dynamicOwnerFieldsDiv = document.createElement('div');
    dynamicOwnerFieldsDiv.id = `dynamicOwnerFields${index}`;
    dynamicOwnerFieldsDiv.style.marginTop = '12px';
    ownersContainer.appendChild(dynamicOwnerFieldsDiv);

    const cCorpTaxDueDiv = document.createElement('div');
    cCorpTaxDueDiv.id = `cCorpTaxDueContainer${index}`;

    // We will style it similarly to the "apportionment" text:
    cCorpTaxDueDiv.style.marginTop = '16px';
    cCorpTaxDueDiv.style.fontWeight = 'bold';
    cCorpTaxDueDiv.style.display = 'none'; 
    businessDiv.appendChild(cCorpTaxDueDiv);

    typeSelect.addEventListener('change', function() {
        handleBusinessTypeChange(index, typeSelect.value);
    });

    numOwnersSelect.addEventListener('change', function(e) {
        saveBusinessDetailData();
        const selectedVal = parseInt(this.value, 10);
        createOwnerFields(index, selectedVal);
        populateBusinessDetailFields(index);
    });

    container.appendChild(businessDiv);
}

function populateNumOwnersOptionsForNonPartnership(selectEl, filingStatus) {
    selectEl.innerHTML = '';
    let possibleVals;
    if (filingStatus === 'Married Filing Jointly') {
        // For S-Corp & C-Corp with MFJ, typically we let them pick 1,2,3
        // but your existing code used [0,1,2,3]
        possibleVals = [0,1,2,3];
    } else {
        // For single (or other statuses), let's let them pick 1 or 2
        possibleVals = [0,1,2];
    }
    possibleVals.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v === 0 ? 'Please Select' : String(v);
        selectEl.appendChild(opt);
    });
}

function handleBusinessTypeChange(index, businessType) {
    const ownersContainer = document.getElementById('ownersContainer' + index);
    const numOwnersSelect = document.getElementById('numOwnersSelect' + index);
    const dynamicOwnerFieldsDiv = document.getElementById('dynamicOwnerFields' + index);
    // Remove any previously added Schedule-C question if present.
    removeScheduleCQuestion(index);

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';

    if (businessType === 'Schedule-C') {
        // For Schedule-C, do not display the owner's box.
        // Clear and hide any owner-related fields.
        ownersContainer.style.display = 'none';
        numOwnersSelect.innerHTML = '';
        dynamicOwnerFieldsDiv.innerHTML = '';

        // For MFJ, display the dedicated Schedule-C question.
        if (filingStatus === 'Married Filing Jointly') {
            addScheduleCQuestion(index);
        } else {
            // For non-MFJ, ensure no Schedule-C question is present.
            removeScheduleCQuestion(index);
        }
    } else if (businessType === 'Partnership') {
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';

        // If not MFJ, force 2 owners with predetermined values.
        if (filingStatus !== 'Married Filing Jointly') {
            numOwnersSelect.innerHTML = '';
            var opt2 = document.createElement('option');
            opt2.value = '2';
            opt2.textContent = '2';
            numOwnersSelect.appendChild(opt2);
            numOwnersSelect.value = '2';

            createOwnerFields(index, 2);

            var owner1Select = document.getElementById('business' + index + 'OwnerName1');
            var owner2Select = document.getElementById('business' + index + 'OwnerName2');
            if (owner1Select) {
                owner1Select.value = clientFirstName;
                owner1Select.disabled = true;
                owner1Select.style.backgroundColor = '#f0f0f0';
            }
            if (owner2Select) {
                owner2Select.value = 'Other';
                owner2Select.disabled = true;
                owner2Select.style.backgroundColor = '#f0f0f0';
            }

        } else if (businessType === 'C-Corp') {
            ownersContainer.style.display = 'block';
            dynamicOwnerFieldsDiv.innerHTML = '';
        
            // For a C-Corp, if the filing status is MFJ, allow up to 3 owners;
            // otherwise, only allow 1 or 2.
            if (filingStatus === 'Married Filing Jointly') {
                // We will allow user to pick 1, 2, or 3.
                numOwnersSelect.innerHTML = '';
                let optPlease = document.createElement('option');
                optPlease.value = '0';
                optPlease.textContent = 'Please Select';
                numOwnersSelect.appendChild(optPlease);
        
                let opt1 = document.createElement('option');
                opt1.value = '1';
                opt1.textContent = '1';
                numOwnersSelect.appendChild(opt1);
        
                let opt2 = document.createElement('option');
                opt2.value = '2';
                opt2.textContent = '2';
                numOwnersSelect.appendChild(opt2);
        
                let opt3 = document.createElement('option');
                opt3.value = '3';
                opt3.textContent = '3';
                numOwnersSelect.appendChild(opt3);
        
                numOwnersSelect.value = '0';
            } else {
                // Non-MFJ => only 1 or 2 owners
                numOwnersSelect.innerHTML = '';
                let optPlease = document.createElement('option');
                optPlease.value = '0';
                optPlease.textContent = 'Please Select';
                numOwnersSelect.appendChild(optPlease);
        
                let opt1 = document.createElement('option');
                opt1.value = '1';
                opt1.textContent = '1';
                numOwnersSelect.appendChild(opt1);
        
                let opt2 = document.createElement('option');
                opt2.value = '2';
                opt2.textContent = '2';
                numOwnersSelect.appendChild(opt2);
        
                numOwnersSelect.value = '0';
            }
        } else {
            // For MFJ, allow the user to pick 2 or 3 owners.
            numOwnersSelect.innerHTML = '';
            var pleaseOpt = document.createElement('option');
            pleaseOpt.value = '0';
            pleaseOpt.textContent = 'Please Select';
            numOwnersSelect.appendChild(pleaseOpt);

            var twoOpt = document.createElement('option');
            twoOpt.value = '2';
            twoOpt.textContent = '2';
            numOwnersSelect.appendChild(twoOpt);

            var threeOpt = document.createElement('option');
            threeOpt.value = '3';
            threeOpt.textContent = '3';
            numOwnersSelect.appendChild(threeOpt);

            numOwnersSelect.value = '0';
        }
    } else if (businessType === 'Please Select') {
        ownersContainer.style.display = 'none';
        numOwnersSelect.value = '0';
        dynamicOwnerFieldsDiv.innerHTML = '';
    } else {
        // For S-Corp or C-Corp fallback.
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';
        populateNumOwnersOptionsForNonPartnership(numOwnersSelect, filingStatus);
        numOwnersSelect.value = '0';
    }
}

function addScheduleCQuestion(businessIndex) {
    const businessDivs = document.querySelectorAll('.business-entry');
    const myDiv = businessDivs[businessIndex - 1];
    if (!myDiv) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirst = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirst = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    
    if (filingStatus === 'Married Filing Jointly') {
    const label = document.createElement('label');
    label.id = `scheduleCLabel${businessIndex}`;
    label.style.marginTop = '12px';
    label.textContent = 'Which client owns this Schedule C?';
    myDiv.appendChild(label);
}
    const scheduleCDropdown = document.createElement('select');
    scheduleCDropdown.id = `scheduleCOwner${businessIndex}`;
    scheduleCDropdown.name = `scheduleCOwner${businessIndex}`;
    myDiv.appendChild(scheduleCDropdown);
    
    let optionsArr = ['Please Select', clientFirst];
    if (filingStatus === 'Married Filing Jointly') {
        optionsArr.push(spouseFirst);
    }

    optionsArr.forEach(optLabel => {
        const opt = document.createElement('option');
        opt.value = optLabel;
        opt.textContent = optLabel;
        scheduleCDropdown.appendChild(opt);
    });

}

function removeScheduleCQuestion(businessIndex) {
    const label = document.getElementById(`scheduleCLabel${businessIndex}`);
    const dropdown = document.getElementById(`scheduleCOwner${businessIndex}`);
    if (label) label.remove();
    if (dropdown) dropdown.remove();
}

function createOwnerFields(businessIndex, numOwners) {
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${businessIndex}`);
    // Clear any previously rendered owner fields
    dynamicOwnerFieldsDiv.innerHTML = '';

    // If no valid number of owners, do nothing
    if (isNaN(numOwners) || numOwners < 1) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';

    // For each owner, create fields
    for (let i = 1; i <= numOwners; i++) {
        const ownerSection = document.createElement('section');
        ownerSection.classList.add('owner-entry');
        ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

        // 1) Create label/select for "Owner i (Select Who?)"
        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Owner ${i} (Select Who?):`;
        nameLabel.setAttribute('for', `business${businessIndex}OwnerName${i}`);
        ownerSection.appendChild(nameLabel);

        const nameSelect = document.createElement('select');
        nameSelect.id = `business${businessIndex}OwnerName${i}`;
        nameSelect.name = `business${businessIndex}OwnerName${i}`;
        ownerSection.appendChild(nameSelect);

        // If "Schedule-C," typically we skip multi-owner logic, but we handle minimal MFJ scenario
        if (businessTypeVal === 'Schedule-C') {
            let optionsArr;
            const isMFJ = (filingStatus === 'Married Filing Jointly');

            // Single or MFS => only client
            if (!isMFJ) {
                optionsArr = ['Please Select', clientFirstName];
            } else {
                // MFJ => can choose client or spouse
                optionsArr = ['Please Select', clientFirstName, spouseFirstName];
            }
            optionsArr.forEach(optLabel => {
                const opt = document.createElement('option');
                opt.value = optLabel;
                opt.textContent = optLabel;
                nameSelect.appendChild(opt);
            });
        }
        // Otherwise (Partnership, S-Corp, C-Corp), we do the standard pattern:
        else {
            // Always start with a "Please Select" choice
            const pleaseOpt = document.createElement('option');
            pleaseOpt.value = 'Please Select';
            pleaseOpt.textContent = 'Please Select';
            nameSelect.appendChild(pleaseOpt);

            let baseOptions = [];
            if (filingStatus === 'Married Filing Jointly') {
                // For MFJ => client name, spouse name, or "Other"
                baseOptions = [clientFirstName, spouseFirstName, 'Other'];
            } else {
                // Non-MFJ => only client or "Other"
                baseOptions = [clientFirstName, 'Other'];
            }
            baseOptions.forEach(bOpt => {
                const opt = document.createElement('option');
                opt.value = bOpt;
                opt.textContent = bOpt;
                nameSelect.appendChild(opt);
            });

            // If you disallow duplicate selections, you can update other dropdowns:
            nameSelect.addEventListener('change', function () {
                updateBusinessOwnerDropdowns(businessIndex);
            });
        }

        // 2) If S-Corp => add "Reasonable Compensation" field for each owner
        if (businessTypeVal === 'S-Corp') {
            const compInput = createLabelAndCurrencyField(
                ownerSection,
                `business${businessIndex}OwnerComp${i}`,
                `Reasonable Compensation ($) for Owner ${i}:`,
                0
            );
            compInput.addEventListener('blur', function () {
                checkSCorpReasonableComp(businessIndex);
                updateBusinessNet(businessIndex);
            });
        }

        // 3) Ownership percentage field
        const percentLabel = document.createElement('label');
        percentLabel.textContent = `Owner ${i} Ownership %:`;
        percentLabel.setAttribute('for', `business${businessIndex}OwnerPercent${i}`);
        ownerSection.appendChild(percentLabel);

        const percentInput = document.createElement('input');
        percentInput.type = 'number';
        percentInput.step = '0.0001';
        percentInput.min = '0.0001';
        percentInput.id = `business${businessIndex}OwnerPercent${i}`;
        percentInput.name = `business${businessIndex}OwnerPercent${i}`;
        ownerSection.appendChild(percentInput);

        // Special rules if only 1 owner => lock it to 100%
        if (numOwners === 1) {
            percentInput.value = '100.0000';
            percentInput.readOnly = true;
            percentInput.style.backgroundColor = '#f0f0f0';
        }
        else if (numOwners === 2) {
            // For 2 owners, let the user fill in one side,
            // then we auto-calc the other side in handleTwoOwnersInput
            let typingTimer;
            percentInput.addEventListener('input', () => {
                // remove overrides for this business
                for (let key in apportionmentOverrides) {
                    if (key.startsWith(`biz${businessIndex}-`)) {
                        delete apportionmentOverrides[key];
                    }
                }
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    handleTwoOwnersInput(businessIndex, i);
                    updateOwnerApportionment(businessIndex);
                }, 600);
            });
        }
        else if (numOwners === 3) {
            // For 3 owners, we auto-fill the 3rd after user enters #1 and #2
            if (i < 3) {
                let typingTimer;
                percentInput.addEventListener('input', () => {
                    for (let key in apportionmentOverrides) {
                        if (key.startsWith(`biz${businessIndex}-`)) {
                            delete apportionmentOverrides[key];
                        }
                    }
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(() => {
                        autoCalculateLastOwner(businessIndex, 3);
                        updateOwnerApportionment(businessIndex);
                    }, 600);
                });
            } else {
                // The 3rd input is auto-calculated => readOnly
                percentInput.value = '';
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }
        }

        // 4) Create a container where we display the "Apportionment" statements or up/down arrows
        const apportionmentContainer = document.createElement('div');
        apportionmentContainer.id = `business${businessIndex}OwnerPercent${i}-apportionmentContainer`;
        ownerSection.appendChild(apportionmentContainer);

        // Finally, append this entire "ownerSection" to the main DIV
        dynamicOwnerFieldsDiv.appendChild(ownerSection);
    }

    // --- Now do any "auto-fill" or "locking" logic, but ONLY as you desire --- //
    // In a C-Corp, for MFJ with 2 owners, we do NOT forcibly set #1=Client, #2=Spouse.
    // We'll ONLY set/lock for single-owner or 3-owner scenarios if you still want that.

    if (businessTypeVal === 'C-Corp') {
        if (filingStatus !== 'Married Filing Jointly') {
            // Non-MFJ => If 1 owner => that owner is client, locked
            //            If 2 owners => #1=client, #2=Other, locked
            if (numOwners === 1) {
                const ownerSelect = document.getElementById(`business${businessIndex}OwnerName1`);
                if (ownerSelect) {
                    ownerSelect.value = clientFirstName;
                    ownerSelect.disabled = true;
                    ownerSelect.style.backgroundColor = '#f0f0f0';
                }
            }
            else if (numOwners === 2) {
                const ownerSelect1 = document.getElementById(`business${businessIndex}OwnerName1`);
                const ownerSelect2 = document.getElementById(`business${businessIndex}OwnerName2`);
                if (ownerSelect1) {
                    ownerSelect1.value = clientFirstName;
                    ownerSelect1.disabled = true;
                    ownerSelect1.style.backgroundColor = '#f0f0f0';
                }
                if (ownerSelect2) {
                    ownerSelect2.value = 'Other';
                    ownerSelect2.disabled = true;
                    ownerSelect2.style.backgroundColor = '#f0f0f0';
                }
            }
        }
        else {
            // MFJ => we keep 1 owner auto-locked for the client, 3 owners => client/spouse/other
            // But 2 owners => do NOT auto-lock so the user can pick either spouse or "Other"
            if (numOwners === 1) {
                const ownerSelect = document.getElementById(`business${businessIndex}OwnerName1`);
                if (ownerSelect) {
                    ownerSelect.value = clientFirstName;
                    ownerSelect.disabled = true;
                    ownerSelect.style.backgroundColor = '#f0f0f0';
                }
            }
            else if (numOwners === 3) {
                // #1=client, #2=spouse, #3=Other
                const ownerSelect1 = document.getElementById(`business${businessIndex}OwnerName1`);
                const ownerSelect2 = document.getElementById(`business${businessIndex}OwnerName2`);
                const ownerSelect3 = document.getElementById(`business${businessIndex}OwnerName3`);
                if (ownerSelect1) {
                    ownerSelect1.value = clientFirstName;
                    ownerSelect1.disabled = true;
                    ownerSelect1.style.backgroundColor = '#f0f0f0';
                }
                if (ownerSelect2) {
                    ownerSelect2.value = spouseFirstName;
                    ownerSelect2.disabled = true;
                    ownerSelect2.style.backgroundColor = '#f0f0f0';
                }
                if (ownerSelect3) {
                    ownerSelect3.value = 'Other';
                    ownerSelect3.disabled = true;
                    ownerSelect3.style.backgroundColor = '#f0f0f0';
                }
            }
            // Note: if (numOwners === 2), we do NOT auto-lock in this block
        }
    }
    // Partnerships or S-Corp might have similar auto-fill code in your existing logic.

    // Validate total ownership and then recalc apportionments
    validateTotalOwnership(businessIndex, numOwners);
    updateOwnerApportionment(businessIndex);
}

function handleTwoOwnersInput(businessIndex, ownerIndex) {
    const owner1Input = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const owner2Input = document.getElementById(`business${businessIndex}OwnerPercent2`);
    if (!owner1Input || !owner2Input) return;

    const parsePct = (val) => {
        if (!val.trim()) return NaN;
        return parseFloat(val);
    };

    let val1 = parsePct(owner1Input.value);
    let val2 = parsePct(owner2Input.value);

    if (ownerIndex === 1) {
        if (isNaN(val1)) {
            owner2Input.value = '';
        } else {
            val1 = Math.min(Math.max(val1, 0), 100);
            owner1Input.value = val1.toFixed(4);
            owner2Input.value = (100 - val1).toFixed(4);
        }
    } else {
        if (isNaN(val2)) {
            owner1Input.value = '';
        } else {
            val2 = Math.min(Math.max(val2, 0), 100);
            owner2Input.value = val2.toFixed(4);
            owner1Input.value = (100 - val2).toFixed(4);
        }
    }
    validateTotalOwnership(businessIndex, 2);
}

function autoCalculateLastOwner(businessIndex, numOwners) {
    if (numOwners !== 3) return;
    const o1 = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const o2 = document.getElementById(`business${businessIndex}OwnerPercent2`);
    const o3 = document.getElementById(`business${businessIndex}OwnerPercent3`);
    if (!o1 || !o2 || !o3) return;

    const parsePct = (v) => (v.trim() ? parseFloat(v) : NaN);
    let val1 = parsePct(o1.value), val2 = parsePct(o2.value);

    if (isNaN(val1) && isNaN(val2)) {
        o3.value = '';
        validateTotalOwnership(businessIndex, 3);
        return;
    }
    if (isNaN(val1) || isNaN(val2)) {
        o3.value = '';
        validateTotalOwnership(businessIndex, 3);
        return;
    }
    val1 = Math.min(Math.max(val1, 0), 100);
    val2 = Math.min(Math.max(val2, 0), 100);
    o1.value = val1.toFixed(4);
    o2.value = val2.toFixed(4);

    let remain = 100 - (val1 + val2);
    if (remain < 0) remain = 0;
    if (remain > 100) remain = 100;
    o3.value = remain.toFixed(4);

    validateTotalOwnership(businessIndex, 3);
}

function validateTotalOwnership(businessIndex, numOwners) {
    let totalOwnership = 0;
    let anyValueEntered = false;

    for (let i = 1; i <= numOwners; i++) {
        const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerInput) continue;
        const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
        const errorKey = 'OWNERSHIP_SUM';
        removeDisclaimer(ownerContainerId, errorKey);
        ownerInput.classList.remove('input-error');
        
        const valStr = ownerInput.value.trim();
        const val = parseFloat(valStr);
        if (!isNaN(val) && val !== 0) anyValueEntered = true;
        totalOwnership += (isNaN(val) ? 0 : val);
    }

    if (!anyValueEntered) {
        return;
    }

    if (Math.abs(totalOwnership - 100) > 0.0001) {
        for (let i = 1; i <= numOwners; i++) {
            const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
            const errorKey = 'OWNERSHIP_SUM';
            addDisclaimer(
                ownerContainerId,
                errorKey,
                `Total ownership must equal 100%. Currently, it is ${totalOwnership.toFixed(4)}%.`
            );
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.add('input-error');
            }
        }
    } else {
        for (let i = 1; i <= numOwners; i++) {
            const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
            removeDisclaimer(ownerContainerId, 'OWNERSHIP_SUM');
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.remove('input-error');
            }
        }
    }
}

function updateBusinessNet(index) {
    // Always calculate the net amount from income and expenses
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`)?.value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`)?.value || '0');
    const netVal = incomeVal - expensesVal;
    const netField = document.getElementById(`business${index}Net`);
    if (netField) {
        netField.value = formatCurrency(String(netVal));
        netField.style.color = netVal < 0 ? 'red' : 'black';
    }
    
    // Clear any previously stored overrides so that fresh calculations are made
    for (let key in apportionmentOverrides) {
        delete apportionmentOverrides[key];
    }

    // Remove any dependent disclaimers before recalculating
    removeDisclaimer(`businessEntry${index}`, 'DEPENDENT_WAGE');
    removeDisclaimer(`dynamicOwnerFields${index}`, 'SCORP_COMP');
    
    // Refresh the owner apportionment with the current net value
    updateOwnerApportionment(index);

    // (Optional) Recalculate any dependent wages or related fields here…
    let totalDependentWages = 0;
    let dependentStrings = [];
    for (let depIndex in dependentBizMap) {
        if (dependentBizMap.hasOwnProperty(depIndex)) {
            const entry = dependentBizMap[depIndex];
            if (entry.businessIndex === index) {
                totalDependentWages += entry.wage;
                const depNameEl = document.getElementById(`dependent${depIndex}Name`);
                const depName = depNameEl ? depNameEl.value.trim() || `Dependent${depIndex}` : `Dependent${depIndex}`;
                dependentStrings.push(`${depName}'s wages (${formatCurrency(String(entry.wage))})`);
            }
        }
    }
    
    // (Optional) If you have additional logic (e.g., for S-Corp Reasonable Comp), include it here.
    // For example, calculate totalReasonableComp and check against expenses...
    let totalReasonableComp = 0;
    const businessTypeVal = document.getElementById(`business${index}Type`)?.value || '';
    if (businessTypeVal === 'S-Corp') {
        const numOwnersSelect = document.getElementById(`numOwnersSelect${index}`);
        if (numOwnersSelect) {
            const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
            for (let i = 1; i <= numOwners; i++) {
                const compStr = document.getElementById(`business${index}OwnerComp${i}`)?.value || '0';
                totalReasonableComp += unformatCurrency(compStr);
            }
        }
    }
    
    const anythingEntered = (incomeVal !== 0 || expensesVal !== 0 || totalReasonableComp !== 0);
    if (!anythingEntered) {
        // You might want to still update the apportionment even if nothing is entered.
        // For now, we continue.
    }

    if (businessTypeVal === 'C-Corp') {
        showCcorpTaxDue(index);
    }
    
    // **Always refresh the owner apportionment whenever net changes**
    updateOwnerApportionment(index);
}

const apportionmentOverrides = {};

function updateOwnerApportionment(businessIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 1) return;
    const portions = getCurrentPortions(businessIndex, netVal, numOwners);

    for (let i = 1; i <= numOwners; i++) {
        showApportionment(businessIndex, i, portions[i - 1]);
    }

    if (document.getElementById(`business${businessIndex}Type`)?.value === 'C-Corp') {
        showCcorpTaxDue(businessIndex);
    }
    
    checkSCorpReasonableComp(businessIndex);
    recalculateTotals();
}

function showApportionment(businessIndex, ownerIndex, portion) {
    const bizTypeSelect = document.getElementById(`business${businessIndex}Type`);
    if (!bizTypeSelect) return;
    const bizType = bizTypeSelect.value.trim();

    // For Schedule‑C, skip apportionment statements.
    if (bizType === 'Schedule-C' || bizType === 'C-Corp') {
        return;
    }

    // Retrieve the net value of the business.
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);

    // If the net amount is negative and the calculated portion is positive, force it negative.
    if (netVal < 0 && portion > 0) {
        portion = -portion;
    }
    
    const containerId = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    let apportionmentEl = document.getElementById(`apportionment-${containerId}`);
    if (!apportionmentEl) {
        apportionmentEl = document.createElement("div");
        apportionmentEl.id = `apportionment-${containerId}`;
        apportionmentEl.style.fontWeight = "bold";
        apportionmentEl.style.marginTop = "8px";
        const container = document.getElementById(containerId);
        if (container) container.appendChild(apportionmentEl);
    }
    apportionmentEl.innerHTML = "";

    if (portion === null) return;

    // Determine the prefix text based on business type.
    const businessTypeLower = (document.getElementById(`business${businessIndex}Type`)?.value || '').trim().toLowerCase();
    let prefixText = '';
    if (businessTypeLower === 'partnership') {
        prefixText = `Apportionment of Self-Employment for Owner ${ownerIndex} is `;
    } else {
        prefixText = `Apportionment of Owner ${ownerIndex} is `;
    }

    const prefixSpan = document.createElement("span");
    prefixSpan.textContent = prefixText;
    prefixSpan.classList.add("apportionment-text");
    apportionmentEl.appendChild(prefixSpan);

    const amountSpan = document.createElement("span");
    // Use formatCurrency to format the amount. Note that formatCurrency returns a parenthesized string for negatives.
    if (portion < 0) {
        amountSpan.textContent = `${formatCurrency(String(portion))} (Loss)`;
        amountSpan.style.color = "red";
    } else {
        amountSpan.textContent = `${formatCurrency(String(portion))} (Income)`;
        amountSpan.style.color = "green";
    }
    apportionmentEl.appendChild(amountSpan);

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    const numOwners = numOwnersSelect ? parseInt(numOwnersSelect.value, 10) : 0;
    if (numOwners > 1) {
        const upBtn = document.createElement("button");
        upBtn.textContent = "▲";
        upBtn.classList.add("arrow-btn");
        upBtn.addEventListener("click", (e) => {
            e.preventDefault();
            incrementApportionment(businessIndex, ownerIndex);
        });
        apportionmentEl.appendChild(upBtn);

        const downBtn = document.createElement("button");
        downBtn.textContent = "▼";
        downBtn.classList.add("arrow-btn");
        downBtn.addEventListener("click", (e) => {
            e.preventDefault();
            decrementApportionment(businessIndex, ownerIndex);
        });
        apportionmentEl.appendChild(downBtn);
    }
}

function incrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 2) return;

    let portions = getCurrentPortions(businessIndex, netVal, numOwners);
    portions[ownerIndex - 1] += 1;

    if (numOwners === 2) {
        const otherIdx = (ownerIndex === 1) ? 1 : 0;
        portions[otherIdx] = netVal - portions[ownerIndex - 1];
        if (netVal > 0 && portions[otherIdx] < 0) {
            portions[ownerIndex - 1] = netVal;
            portions[otherIdx] = 0;
        }
    } else if (numOwners === 3) {
        let sumNow = portions.reduce((a, b) => a + b, 0);
        let leftover = netVal - sumNow;
        let i = 0;
        while (leftover !== 0 && i < 3) {
            if (i !== (ownerIndex - 1)) {
                if (leftover > 0) {
                    portions[i] += 1;
                    leftover -= 1;
                } else {
                    if (portions[i] > 0) {
                        portions[i] -= 1;
                        leftover += 1;
                    }
                }
            }
            i++;
            if (i >= 3 && leftover !== 0) i = 0;
        }
    }

    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }
    updateOwnerApportionment(businessIndex);
}

function decrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 2) return;

    let portions = getCurrentPortions(businessIndex, netVal, numOwners);
    if (netVal > 0 && portions[ownerIndex - 1] > 0) {
        portions[ownerIndex - 1] -= 1;
    } else if (netVal <= 0) {
        portions[ownerIndex - 1] -= 1;
    }

    if (numOwners === 2) {
        const otherIdx = (ownerIndex === 1) ? 1 : 0;
        portions[otherIdx] = netVal - portions[ownerIndex - 1];
        if (netVal > 0 && portions[otherIdx] < 0) {
            portions[ownerIndex - 1] = netVal;
            portions[otherIdx] = 0;
        }
    } else if (numOwners === 3) {
        let sumNow = portions.reduce((a, b) => a + b, 0);
        let leftover = netVal - sumNow;
        let i = 0;
        while (leftover !== 0 && i < 3) {
            if (i !== (ownerIndex - 1)) {
                if (leftover > 0) {
                    portions[i] += 1;
                    leftover -= 1;
                } else {
                    if (portions[i] > 0) {
                        portions[i] -= 1;
                        leftover += 1;
                    }
                }
            }
            i++;
            if (i >= 3 && leftover !== 0) i = 0;
        }
    }

    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }
    updateOwnerApportionment(businessIndex);
}

function showCcorpTaxDue(businessIndex) {
    const container = document.getElementById(`cCorpTaxDueContainer${businessIndex}`);
    if (!container) return;

    const bizType = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (bizType !== 'C-Corp') {
        container.style.display = 'none';
        container.innerHTML = '';
        container.classList.remove('ccorp-tax-due');
        return;
    }

    // If ownership not complete, hide the box and exit
    if (!isCcorpOwnershipComplete(businessIndex)) {
        container.style.display = 'none';
        container.innerHTML = '';
        container.classList.remove('ccorp-tax-due');
        return;
    }

    // Show container for C-Corp
    container.style.display = 'block';
    container.classList.add('ccorp-tax-due');
    container.innerHTML = ''; // Clear previous content

    // 1. Get net value:
    const netVal = unformatCurrency(
        document.getElementById(`business${businessIndex}Net`)?.value || '0'
    );

    // 2. Calculate tax due based on client's ownership fraction
    let clientFractionOfNet = getClientOwnershipPortionForCcorp(businessIndex, netVal);
    if (netVal <= 0) {
        clientFractionOfNet = 0;
    }
    let rawTaxDue = Math.round(0.21 * clientFractionOfNet);
    const overrideKey = `ccorpTaxDue-biz${businessIndex}`;
    let finalTaxDue = (apportionmentOverrides[overrideKey] !== undefined)
        ? apportionmentOverrides[overrideKey]
        : rawTaxDue;

    // 5. Attach listeners to each owner field so that only Client 1 and Client 2 are included:
    if (bizType === 'C-Corp') {
        const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
        const numOwners = numOwnersSelect ? parseInt(numOwnersSelect.value, 10) || 0 : 0;

        // Define update function using getClientOwnershipPortionForCcorp:
        const updateCombinedClientAmount = () => {
            const netVal = unformatCurrency(
                document.getElementById(`business${businessIndex}Net`)?.value || '0'
            );
            const clientAmount = getClientOwnershipPortionForCcorp(businessIndex, netVal);
            showBlueDisclaimer(
                `Our client's apportionment of income: ${formatCurrency(clientAmount.toString())}`,
                `cCorpTaxDueContainer${businessIndex}`
            );
        };

        // Attach 'input' listeners to all owner percentage inputs and 'change' listeners to the owner name selects.
        for (let i = 1; i <= numOwners; i++) {
            const ownerPctInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            const ownerNameSelect = document.getElementById(`business${businessIndex}OwnerName${i}`);
            if (ownerPctInput) {
                ownerPctInput.addEventListener('input', updateCombinedClientAmount);
            }
            if (ownerNameSelect) {
                ownerNameSelect.addEventListener('change', updateCombinedClientAmount);
            }
        }
        // Call once immediately so the disclaimer shows up.
        updateCombinedClientAmount();
    }

    // 3. Display Tax Due information:
    const bizName = document.getElementById(`business${businessIndex}Name`)?.value || `Business ${businessIndex}`;
    const labelSpan = document.createElement('span');
    labelSpan.textContent = `Tax Due for ${bizName}: `;
    container.appendChild(labelSpan);

    const amountSpan = document.createElement('span');
    amountSpan.id = `ccorpTaxDueAmount-biz${businessIndex}`;
    amountSpan.textContent = formatCurrency(finalTaxDue.toString());
    amountSpan.style.color = '#ff0000';
    container.appendChild(amountSpan);

    // 4. Up/down arrow buttons:
    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';
    upBtn.classList.add('arrow-btn');
    upBtn.addEventListener('click', (e) => {
        e.preventDefault();
        incrementCcorpTaxDue(businessIndex);
    });
    container.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';
    downBtn.classList.add('arrow-btn');
    downBtn.addEventListener('click', (e) => {
        e.preventDefault();
        decrementCcorpTaxDue(businessIndex);
    });
    container.appendChild(downBtn);

}

function getClientOwnershipPortionForCcorp(businessIndex, netVal) {
    // netVal is the total net, but we only want the slice belonging to the couple.
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return 0;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    
    let totalClientOwnershipPercent = 0;

    // Loop through each owner, check if the "ownerName" is client or spouse (when MFJ).
    for (let i = 1; i <= numOwners; i++) {
        const ownerNameEl = document.getElementById(`business${businessIndex}OwnerName${i}`);
        const ownerPctEl = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerNameEl || !ownerPctEl) continue;

        const ownerNameVal = ownerNameEl.value.trim();
        const pctVal = parseFloat(ownerPctEl.value.trim() || '0');
        if (isNaN(pctVal)) continue;

        if (filingStatus === 'Married Filing Jointly') {
            // If ownerNameVal is either clientFirstName or spouseFirstName, add it in
            if (ownerNameVal === clientFirstName || ownerNameVal === spouseFirstName) {
                totalClientOwnershipPercent += pctVal;
            }
        } else {
            // Non-MFJ => only add if it's the main client’s name
            if (ownerNameVal === clientFirstName) {
                totalClientOwnershipPercent += pctVal;
            }
        }
    }

    // Convert percent to fraction of net
    let clientFractionOfNet = netVal * (totalClientOwnershipPercent / 100);
    if (clientFractionOfNet < 0) {
        // If net is negative, we ultimately set tax due to 0 anyway,
        // but let's keep the fraction as is if you need it.
    }
    return clientFractionOfNet;
}

function isCcorpOwnershipComplete(businessIndex) {
    const bizType = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (bizType !== 'C-Corp') return false;

    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return false;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 1) return false;

    let total = 0;
    for (let i = 1; i <= numOwners; i++) {
        const pctInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!pctInput) return false;
        const val = parseFloat(pctInput.value.trim()) || 0;
        total += val;
    }

    // We'll consider it "complete" only if total is 100.0 (within a small tolerance).
    if (Math.abs(total - 100) < 0.0001) {
        return true;
    }
    return false;
}

function getCurrentPortions(businessIndex, netVal, numOwners) {
    let percentages = [];
    let totalEntered = 0;
    let blankCount = 0;

    for (let i = 1; i <= numOwners; i++) {
        const input = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        const valStr = input ? input.value.trim() : "";
        if (valStr === "") {
            percentages.push(null);
            blankCount++;
        } else {
            const num = parseFloat(valStr);
            if (isNaN(num)) {
                percentages.push(null);
                blankCount++;
            } else {
                percentages.push(num);
                totalEntered += num;
            }
        }
    }

    if (blankCount === numOwners) {
        return new Array(numOwners).fill(0).map((_, i) => {
            const overrideKey = `biz${businessIndex}-owner${i+1}`;
            return apportionmentOverrides[overrideKey] ?? 0;
        });
    }

    const remaining = 100 - totalEntered;
    const equalShare = (blankCount > 0) ? remaining / blankCount : 0;
    for (let i = 0; i < numOwners; i++) {
        if (percentages[i] === null) {
            percentages[i] = equalShare;
        }
    }

    let basePortions = percentages.map(pct => Math.round(netVal * (pct / 100)));
    const allocated = basePortions.reduce((a, b) => a + b, 0);
    const diff = netVal - allocated;
    if (diff !== 0 && basePortions.length) {
        basePortions[0] += diff;
    }

    let finalPortions = [...basePortions];
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        if (overrideKey in apportionmentOverrides) {
            finalPortions[i - 1] = apportionmentOverrides[overrideKey];
        }
    }
    let finalSum = finalPortions.reduce((a, b) => a + b, 0);
    let leftover = netVal - finalSum;

    if (leftover !== 0) {
        let idxToFix = finalPortions.findIndex((amt, idx) => {
            const overrideKey = `biz${businessIndex}-owner${idx+1}`;
            return !(overrideKey in apportionmentOverrides);
        });
        if (idxToFix === -1) idxToFix = 0;
        finalPortions[idxToFix] += leftover;
    }
    return finalPortions;
}

function checkSCorpReasonableComp(businessIndex) {
    if (DISCLAIMER_MAP[`businessEntry${businessIndex}`] && DISCLAIMER_MAP[`businessEntry${businessIndex}`]['DEPENDENT_WAGE']) {
        return;
    }
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
    if (businessTypeVal !== 'S-Corp') return;

    const expensesVal = unformatCurrency(document.getElementById(`business${businessIndex}Expenses`)?.value || '0');
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;

    const numOwners = parseInt(numOwnersSelect.value, 10);
    if (isNaN(numOwners) || numOwners < 1) return;

    let totalComp = 0;
    let compFields = [];
    for (let i = 1; i <= numOwners; i++) {
        const compStr = document.getElementById(`business${businessIndex}OwnerComp${i}`)?.value || '0';
        const compVal = unformatCurrency(compStr);
        totalComp += compVal;
        const compEl = document.getElementById(`business${businessIndex}OwnerComp${i}`);
        if (compEl) compFields.push(compEl);
    }

    removeDisclaimer(`dynamicOwnerFields${businessIndex}`, 'SCORP_COMP');
    compFields.forEach(f => f.classList.remove('input-error'));

    if (totalComp > expensesVal) {
        addDisclaimer(
            `dynamicOwnerFields${businessIndex}`,
            'SCORP_COMP',
            `Total Owners' Reasonable Compensation (${formatCurrency(totalComp.toString())}) cannot exceed this S-Corp's Expenses (${formatCurrency(expensesVal.toString())}).`
        );
        compFields.forEach(f => f.classList.add('input-error'));
    }
}

function updateBusinessOwnerDropdowns(businessIndex) {
    const ownerSelects = document.querySelectorAll(
        `#dynamicOwnerFields${businessIndex} select[id^="business${businessIndex}OwnerName"]`
    );
    if (!ownerSelects) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    let baseOptions = [];
    if (filingStatus === 'Married Filing Jointly') {
        baseOptions = [clientFirstName, spouseFirstName, 'Other'];
    } else {
        baseOptions = [clientFirstName, 'Other'];
    }
    let selectedNames = [];
    ownerSelects.forEach(select => {
        const val = select.value;
        if (baseOptions.includes(val)) {
            selectedNames.push(val);
        }
    });

    ownerSelects.forEach(select => {
        const currentVal = select.value;
        select.innerHTML = '';

        const pleaseOption = document.createElement('option');
        pleaseOption.value = 'Please Select';
        pleaseOption.textContent = 'Please Select';
        select.appendChild(pleaseOption);

        baseOptions.forEach(name => {
            if (!selectedNames.includes(name) || currentVal === name) {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            }
        });

        if ([...select.options].some(opt => opt.value === currentVal)) {
            select.value = currentVal;
        } else {
            select.value = 'Please Select';
        }
    });
}

function incrementCcorpTaxDue(businessIndex) {
    const key = `ccorpTaxDue-biz${businessIndex}`;
    const baseAmount = getBaseCcorpTaxDue(businessIndex);
    
    // if no override yet, default to base
    let current = (apportionmentOverrides[key] !== undefined)
        ? apportionmentOverrides[key]
        : baseAmount;
    current += 1; // increment by 1
    apportionmentOverrides[key] = current;
    showCcorpTaxDue(businessIndex);
}

function decrementCcorpTaxDue(businessIndex) {
    const key = `ccorpTaxDue-biz${businessIndex}`;
    const baseAmount = getBaseCcorpTaxDue(businessIndex);

    let current = (apportionmentOverrides[key] !== undefined)
        ? apportionmentOverrides[key]
        : baseAmount;
    // If you want to allow it to go negative, you can do so, but presumably 0 is the floor:
    current -= 1;
    if (current < 0) {
        current = 0; // if you prefer no negative overrides for tax due
    }
    apportionmentOverrides[key] = current;
    showCcorpTaxDue(businessIndex);
}

function getBaseCcorpTaxDue(businessIndex) {
    const netVal = unformatCurrency(
        document.getElementById(`business${businessIndex}Net`)?.value || '0'
    );
    if (netVal <= 0) return 0;

    let clientFraction = getClientOwnershipPortionForCcorp(businessIndex, netVal);
    if (clientFraction < 0) clientFraction = 0;

    let rawTaxDue = 0.21 * clientFraction;
    return Math.round(rawTaxDue);
}

//---------------------------------------------------//
// 10. DYNAMIC GENERATION OF SCHEDULE E FIELDS + NET //
//---------------------------------------------------//

document.getElementById('numScheduleEs').addEventListener('input', function() {
    const eCount = parseInt(this.value, 10);
    const container = document.getElementById('scheduleEsContainer');
    container.innerHTML = '';
    if (!isNaN(eCount) && eCount > 0) {
        for (let i = 1; i <= eCount; i++) {
            createScheduleEFields(container, i);
        }
    }
});

function createScheduleEFields(container, index) {
    const scheduleEDiv = document.createElement('div');
    scheduleEDiv.classList.add('schedule-e-entry');

    const heading = document.createElement('h3');
    heading.textContent = `Schedule-E ${index}`;
    scheduleEDiv.appendChild(heading);

    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Income`, `Schedule E-${index} Income:`);
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Expenses`, `Schedule E-${index} Expenses:`);
    createLabelAndTextField(scheduleEDiv, `scheduleE${index}Net`, `Schedule E-${index} Net (Income - Expenses):`);

    container.appendChild(scheduleEDiv);

    const netField = document.getElementById(`scheduleE${index}Net`);
    netField.readOnly = true;

    const incomeField = document.getElementById(`scheduleE${index}Income`);
    const expensesField = document.getElementById(`scheduleE${index}Expenses`);

    incomeField.addEventListener('blur', function() {
        updateScheduleENet(index);
        recalculateTotals();
    });

    expensesField.addEventListener('blur', function() {
        updateScheduleENet(index);
        recalculateTotals();
    });
}

function updateScheduleENet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`scheduleE${index}Income`).value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`scheduleE${index}Expenses`).value || '0');
    const netVal = incomeVal - expensesVal;
    document.getElementById(`scheduleE${index}Net`).value = formatCurrency(netVal.toString());
}

//---------------------------------------------------//
// 11. REAL-TIME CALCULATIONS FOR INCOME/ADJUSTMENTS //
//---------------------------------------------------//

function recalculateTotals() {
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
    const otherIncome = getFieldValue('otherIncome');
    const interestPrivateBonds = getFieldValue('interestPrivateBonds');
    const passiveActivityLossAdjustments = getFieldValue('passiveActivityLossAdjustments');
    const qualifiedBusinessDeduction = getFieldValue('qualifiedBusinessDeduction');

    let businessesNetTotal = 0;
    const numBusinessesVal = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    for (let i = 1; i <= numBusinessesVal; i++) {
        const netValStr = document.getElementById(`business${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        businessesNetTotal += netVal;
    }

    let scheduleEsNetTotal = 0;
    const numScheduleEsVal = parseInt(document.getElementById('numScheduleEs')?.value || '0', 10);
    for (let i = 1; i <= numScheduleEsVal; i++) {
        const netValStr = document.getElementById(`scheduleE${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        scheduleEsNetTotal += netVal;
    }

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
        businessesNetTotal +
        scheduleEsNetTotal +
        otherIncome +
        interestPrivateBonds +
        passiveActivityLossAdjustments +
        qualifiedBusinessDeduction;

    document.getElementById('totalIncome').value = 
        isNaN(totalIncomeVal) 
            ? '' 
            : formatCurrency(String(parseInt(totalIncomeVal)));

    const halfSETax = getFieldValue('halfSETax');
    const retirementDeduction = getFieldValue('retirementDeduction');
    const medicalReimbursementPlan = getFieldValue('medicalReimbursementPlan');
    const SEHealthInsurance = getFieldValue('SEHealthInsurance');
    const alimonyPaid = getFieldValue('alimonyPaid');
    const otherAdjustments = getFieldValue('otherAdjustments');

    const totalAdjustedGrossIncomeVal =
        totalIncomeVal -
        halfSETax -
        retirementDeduction -
        medicalReimbursementPlan -
        SEHealthInsurance -
        alimonyPaid -
        otherAdjustments;

    document.getElementById('totalAdjustedGrossIncome').value = isNaN(totalAdjustedGrossIncomeVal)
        ? ''
        : parseInt(totalAdjustedGrossIncomeVal);

    updateTaxableIncome();
}

//-----------------------------------------------------//
// 12. REAL-TIME CALCULATIONS FOR DEDUCTIONS + TAXABLE //
//-----------------------------------------------------//

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

    document.getElementById('totalDeductions').value = isNaN(totalDeductionsVal) ? '' : parseInt(totalDeductionsVal);
    updateTaxableIncome();
}

function updateTaxableIncome() {
    const totalAdjustedGrossIncome = getFieldValue('totalAdjustedGrossIncome');
    const totalDeductions = getFieldValue('totalDeductions');
    const taxableIncome = totalAdjustedGrossIncome - totalDeductions;
    document.getElementById('taxableIncome').value = isNaN(taxableIncome) ? '' : parseInt(taxableIncome);
}

//-----------------------------------------------------------//
// 13. ATTACHING EVENT LISTENERS FOR REAL-TIME CALCULATIONS  //
//-----------------------------------------------------------//

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
    'otherIncome',
    'interestPrivateBonds',
    'passiveActivityLossAdjustments',
    'qualifiedBusinessDeduction',
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
// 14. TURNS INPUT FIELD BORDER COLOR GREEN TO CONFIRM INPUT //
//-----------------------------------------------------------//

document.addEventListener('blur', function(event) {
    if (event.target.matches('input, select')) {
        if (event.target.value.trim() !== '') {
            event.target.classList.add('input-completed');
        } else {
            event.target.classList.remove('input-completed');
        }
    }
}, true);

//------------------------------------------//
// 15. INITIALIZE CALCULATIONS ON PAGE LOAD //
//------------------------------------------//

document.addEventListener('DOMContentLoaded', function() {
    recalculateTotals();
    recalculateDeductions();
    updateBlindOptions();
    updateOlderThan65Options();
    undoStack.push(getFormSnapshot());

    const allCurrencyFields = document.querySelectorAll('.currency-field');
    allCurrencyFields.forEach((field) => {
        field.addEventListener('blur', () => {
            field.value = formatCurrency(field.value);
        });
    });
});

//--------------------------------------//
// 16. AUTO-COPY STATE TO "SELECTSTATE" //
//--------------------------------------//

document.getElementById('state').addEventListener('input', function() {
    const selectStateEl = document.getElementById('selectState');
    selectStateEl.value = this.value;
    selectStateEl.classList.add('auto-copied');
});

//-----------------------------//
// 17. HANDLE "ENTER" AS "TAB" //
//-----------------------------//

document.getElementById('taxForm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
  
      let allElements = Array.from(this.elements).filter(el =>
        el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
      );
      let visibleElements = allElements.filter(el => el.offsetParent !== null);
      let index = visibleElements.indexOf(document.activeElement);
  
      if (index > -1 && index < visibleElements.length - 1) {
        visibleElements[index + 1].focus();
      } else if (index === visibleElements.length - 1) {
        visibleElements[0].focus();
      }
    }
});

//--------------------------//
// 18. COLLAPSIBLE SECTIONS //
//--------------------------//

function toggleCollapsible(sectionId) {
    const section = document.getElementById(sectionId);
    section.classList.toggle('active');
}

//-------------------//
// 19. SHOW RED DISCLAIMER //
//-------------------//

function showRedDisclaimer(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimer = document.getElementById(`disclaimer-${containerId}`);
    if (!disclaimer) {
      disclaimer = document.createElement('div');
      disclaimer.id = `disclaimer-${containerId}`;
      disclaimer.classList.add('red-disclaimer');
      container.appendChild(disclaimer);
    }
    disclaimer.textContent = message;
}
  
function showBlueDisclaimer(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimer = document.getElementById(`blue-disclaimer-${containerId}`);
    if (!disclaimer) {
        disclaimer = document.createElement('div');
        disclaimer.id = `blue-disclaimer-${containerId}`;
        disclaimer.style.color = 'Black';
        disclaimer.style.fontWeight = 'bold';
        disclaimer.style.marginTop = '12px';
        container.appendChild(disclaimer);
    }
    disclaimer.textContent = message;
}

function removeBlueDisclaimer(containerId) {
    const disclaimer = document.getElementById(`blue-disclaimer-${containerId}`);
    if (disclaimer && disclaimer.parentNode) {
        disclaimer.parentNode.removeChild(disclaimer);
    }
}

//-------------------//
// 20. NOTES FEATURE //
//-------------------//

const notesButton = document.getElementById('notesButton');
const notesContainer = document.getElementById('notesContainer');
const notesEditor = document.getElementById('notesEditor');
const boldBtn = document.getElementById('notesBoldBtn');
const highlightBtn = document.getElementById('notesHighlightBtn');

notesButton.addEventListener('click', (e) => {
  e.stopPropagation();
  notesContainer.classList.toggle('hidden');
});

document.addEventListener('click', function(event) {
  if (!notesContainer.contains(event.target) && event.target !== notesButton) {
    if (!notesContainer.classList.contains('hidden')) {
      notesContainer.classList.add('hidden');
    }
  }
});

boldBtn.addEventListener('click', () => {
  document.execCommand('bold', false, null);
});

highlightBtn.addEventListener('click', () => {
    const currentSelection = window.getSelection();
    if (!currentSelection || currentSelection.isCollapsed) {
      return;
    }
    const highlightColor = document.body.classList.contains('dark-mode')
      ? 'fuchsia'
      : 'yellow';
    let isHighlighted = false;
    if (currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentNode;
      if (parent && parent.style && parent.style.backgroundColor === highlightColor) {
        isHighlighted = true;
      }
    }
    if (isHighlighted) {
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      document.execCommand('hiliteColor', false, highlightColor);
    }
});

//----------------------//
// 21. UNDO/REDO BUTTON //
//----------------------//

let undoStack = [];
let redoStack = [];

function getFormSnapshot() {
    const form = document.getElementById('taxForm');
    const formData = new FormData(form);
    const dataObj = Object.fromEntries(formData.entries());
    return JSON.stringify(dataObj);
}

// Given a JSON snapshot string, restore all fields
function restoreFormSnapshot(snapshot) {
    // (All your existing restore logic is unchanged)
    const dataObj = JSON.parse(snapshot);

    if (dataObj.filingStatus !== undefined) {
        const filingStatusEl = document.getElementById('filingStatus');
        filingStatusEl.value = dataObj.filingStatus;
        filingStatusEl.dispatchEvent(new Event('change'));
    }
    if (dataObj.numOfBusinesses !== undefined) {
        document.getElementById('numOfBusinesses').value = dataObj.numOfBusinesses;
    }
    if (dataObj.numScheduleEs !== undefined) {
        document.getElementById('numScheduleEs').value = dataObj.numScheduleEs;
    }
    if (dataObj.numberOfDependents !== undefined) {
        document.getElementById('numberOfDependents').value = dataObj.numberOfDependents;
    }

    // Rebuild dynamic sections
    // (businessContainer, scheduleEsContainer, dependentsContainer)
    // Then re-populate each field
    for (let key in dataObj) {
        const fields = document.getElementsByName(key);
        if (fields && fields.length > 0) {
            fields[0].value = dataObj[key];
        }
    }

    const numBiz = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    for (let i = 1; i <= numBiz; i++) {
        const ownersSelect = document.getElementById(`numOwnersSelect${i}`);
        if (ownersSelect) {
            ownersSelect.dispatchEvent(new Event('change'));
        }
    }

    for (let i = 1; i <= numBiz; i++) {
        updateBusinessNet(i);
        checkSCorpReasonableComp(i);
    }
    const eCount = parseInt(document.getElementById('numScheduleEs').value || '0', 10);
    for (let i = 1; i <= eCount; i++) {
        updateScheduleENet(i);
    }
    recalculateTotals();
    recalculateDeductions();
}

document.getElementById('undoButton').addEventListener('click', function() {
    if (undoStack.length > 1) {
        const current = undoStack.pop();
        redoStack.push(current);
        const previous = undoStack[undoStack.length - 1];
        restoreFormSnapshot(previous);
    }
});

document.getElementById('redoButton').addEventListener('click', function() {
    if (redoStack.length > 0) {
        const snapshot = redoStack.pop();
        undoStack.push(snapshot);
        restoreFormSnapshot(snapshot);
    }
});

(function() {
    document.getElementById('taxForm').addEventListener('change', function(e) {
        if (e.target.matches('select')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    });
    document.getElementById('taxForm').addEventListener('blur', function(e) {
        if (e.target.matches('input, textarea')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    }, true);
})();

document.addEventListener('DOMContentLoaded', function() {
    undoStack.push(getFormSnapshot());
});

//-----------------------------------------//
// 22. PLACEHOLDERS TO AVOID BREAKING CODE //
//-----------------------------------------//

function saveBusinessDetailData() {
    const container = document.getElementById('businessContainer');
    if (!container) return;
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
        const fieldId = input.id;
        if (fieldId) {
            businessDetailStore[fieldId] = input.value;
        }
    });
}

function populateBusinessDetailFields(index) {
    const fields = [
        `business${index}Type`,
        `business${index}Income`,
        `business${index}Expenses`,
        `business${index}Net`,
        `numOwnersSelect${index}`,
        `scheduleCLabel${index}`,
        `scheduleCOwner${index}`
    ];

    fields.forEach(f => {
        if (businessDetailStore[f] !== undefined) {
            const el = document.getElementById(f);
            if (el) {
                el.value = businessDetailStore[f];
                if (f === `business${index}Type`) {
                    el.dispatchEvent(new Event('change'));
                }
            }
        }
    });

    const numOwnersSelectEl = document.getElementById(`numOwnersSelect${index}`);
    if (numOwnersSelectEl) {
        if (businessDetailStore[`numOwnersSelect${index}`]) {
            numOwnersSelectEl.value = businessDetailStore[`numOwnersSelect${index}`];
        }
        const numOwners = parseInt(numOwnersSelectEl.value, 10) || 0;
        createOwnerFields(index, numOwners);

        for (let i = 1; i <= numOwners; i++) {
            const nameFieldId = `business${index}OwnerName${i}`;
            if (businessDetailStore[nameFieldId] !== undefined) {
                const nameFieldEl = document.getElementById(nameFieldId);
                if (nameFieldEl) {
                    nameFieldEl.value = businessDetailStore[nameFieldId];
                }
            }
            const pctFieldId = `business${index}OwnerPercent${i}`;
            if (businessDetailStore[pctFieldId] !== undefined) {
                const pctFieldEl = document.getElementById(pctFieldId);
                if (pctFieldEl) {
                    pctFieldEl.value = businessDetailStore[pctFieldId];
                }
            }
            const compFieldId = `business${index}OwnerComp${i}`;
            if (businessDetailStore[compFieldId] !== undefined) {
                const compFieldEl = document.getElementById(compFieldId);
                if (compFieldEl) {
                    compFieldEl.value = businessDetailStore[compFieldId];
                }
            }
        }
    }
    updateBusinessNet(index);
    checkSCorpReasonableComp(index);
    validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);
}

//----------------------//
// 23. DARK MODE TOGGLE //
//----------------------//

const darkModeCheckbox = document.getElementById('darkModeToggle');


document.addEventListener('DOMContentLoaded', () => {
  const userPrefersDark = localStorage.getItem('preferred-theme') === 'dark';
  if (userPrefersDark) {
    darkModeCheckbox.checked = true;
    document.body.classList.add('dark-mode');
  }
});

darkModeCheckbox.addEventListener('change', () => {
  if (darkModeCheckbox.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('preferred-theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('preferred-theme', 'light');
  }
});
