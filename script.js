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
let w2Counter = 0;

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

// window.addEventListener('beforeunload', function (e) {
//     e.preventDefault();
//     e.returnValue = '';
// });

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
    option.disabled = true;
    option.selected = true;
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
    option.disabled = true;
    option.selected = true;
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
    const employedEl = document.getElementById(`dependent${dependentIndex}EmployedInBusiness`);
    const employedVal = employedEl ? employedEl.value : 'No';
  
    if (employedVal !== 'Yes') {
      delete dependentBizMap[dependentIndex];
      return;
    }
  
    const businessNameEl = document.getElementById(`dependent${dependentIndex}BusinessName`);
    const businessName = businessNameEl ? businessNameEl.value : '';

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
    const clientAgeInput = document.getElementById('currentAge');
    const spouseAgeInput = document.getElementById('spouseCurrentAge');
    const olderThan65Select = document.getElementById('olderthan65');
    const olderThan65Hidden = document.getElementById('olderthan65_hidden');

    const clientAgeStr = clientAgeInput.value.trim();
    const spouseAgeStr = spouseAgeInput.value.trim();

    let count65Plus = 0;
    if (clientAgeStr !== "") {
        const clientAge = parseInt(clientAgeStr, 10);
        if (!isNaN(clientAge) && clientAge >= 65) {
            count65Plus++;
        }
    }

    if (filingStatus === 'Married Filing Jointly' && spouseAgeStr !== "") {
        const spouseAge = parseInt(spouseAgeStr, 10);
        if (!isNaN(spouseAge) && spouseAge >= 65) {
            count65Plus++;
        }
    }

    const countStr = count65Plus.toString();
    olderThan65Select.value = countStr;
    olderThan65Hidden.value = countStr;

    // For a select element, use "disabled" to prevent changes.
    if (filingStatus === 'Married Filing Jointly') {
        olderThan65Select.disabled = (clientAgeStr !== "" && spouseAgeStr !== "");
    } else {
        olderThan65Select.disabled = (clientAgeStr !== "");
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
            num = Math.abs(num);
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

    // Always clear out the dynamic area first
    dynamicOwnerFieldsDiv.innerHTML = '';

    // Remove any previously added Schedule-C question if present
    removeScheduleCQuestion(index);

    // Show/hide the ownersContainer as appropriate
    ownersContainer.style.display = 'block'; // we'll adjust below if it's hidden
    
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';

    // 1) Decide how to populate "numOwnersSelect" based on business type
    if (businessType === 'Please Select') {
        // Hide owners
        ownersContainer.style.display = 'none';
        numOwnersSelect.innerHTML = '';
        return;  // done
    }
    else if (businessType === 'Schedule-C') {
        // For Schedule-C, we usually say there's just 1 "owner" – or we skip owners entirely
        // Hide the owners container
        ownersContainer.style.display = 'none';
        numOwnersSelect.innerHTML = '';
        dynamicOwnerFieldsDiv.innerHTML = '';

        // But if MFJ, we ask "Which spouse owns this Schedule C?"
        if (filingStatus === 'Married Filing Jointly') {
            addScheduleCQuestion(index);
        }
        return; // done
    }
    else if (businessType === 'Partnership') {
        // Partnerships typically have at least 2 owners
        ownersContainer.style.display = 'block';
        numOwnersSelect.innerHTML = '';

        // If NOT MFJ, force 2 owners: (Client, “Other”)
        if (filingStatus !== 'Married Filing Jointly') {
            const opt2 = document.createElement('option');
            opt2.value = '2';
            opt2.textContent = '2';
            numOwnersSelect.appendChild(opt2);
            numOwnersSelect.value = '2';

            createOwnerFields(index, 2);

            // Force #1 = client, #2 = "Other"
            const owner1Select = document.getElementById(`business${index}OwnerName1`);
            const owner2Select = document.getElementById(`business${index}OwnerName2`);
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
        }
        else {
            // MFJ Partnerships can have 2 or 3 owners. Let's let user choose
            numOwnersSelect.innerHTML = '';
            let pleaseOpt = document.createElement('option');
            pleaseOpt.value = '0';
            pleaseOpt.textContent = 'Please Select';
            pleaseOpt.disabled = true;
            pleaseOpt.selected = true;
            numOwnersSelect.appendChild(pleaseOpt);

            let twoOpt = document.createElement('option');
            twoOpt.value = '2';
            twoOpt.textContent = '2';
            numOwnersSelect.appendChild(twoOpt);

            let threeOpt = document.createElement('option');
            threeOpt.value = '3';
            threeOpt.textContent = '3';
            numOwnersSelect.appendChild(threeOpt);

            numOwnersSelect.value = '0';
        }
    }
    else if (businessType === 'S-Corp') {
        // Let user pick 1,2,3 owners (or more, if you want)
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';
        populateNumOwnersOptionsForNonPartnership(numOwnersSelect, filingStatus);
        numOwnersSelect.value = '0';
    }
    else if (businessType === 'C-Corp') {
        // Similarly, let user pick 1,2,3 owners depending on MFJ vs not
        ownersContainer.style.display = 'block';
        dynamicOwnerFieldsDiv.innerHTML = '';

        if (filingStatus === 'Married Filing Jointly') {
            // 1,2,3 possible
            numOwnersSelect.innerHTML = '';
            let opt0 = document.createElement('option');
            opt0.value = '0';
            opt0.textContent = 'Please Select';
            opt0.disabled = true;
            opt0.selected = true;
            numOwnersSelect.appendChild(opt0);

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
        }
        else {
            // Non-MFJ => 1 or 2
            numOwnersSelect.innerHTML = '';
            let opt0 = document.createElement('option');
            opt0.value = '0';
            opt0.textContent = 'Please Select';
            opt0.disabled = true;
            opt0.selected = true;
            numOwnersSelect.appendChild(opt0);

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
    }

    // If we need special post-processing after we set numOwnersSelect
    // (like we do with Partnerships in your existing code),
    // you can do it here. E.g. createOwnerFields(index, parseInt(numOwnersSelect.value, 10))

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
    if (!dynamicOwnerFieldsDiv) return;

    // Clear any previously rendered owner fields
    dynamicOwnerFieldsDiv.innerHTML = '';

    // If no valid number of owners, do nothing
    if (isNaN(numOwners) || numOwners < 1) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    
    // (Optional) If your code still needs the business type:
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';

    // Decide how to handle auto-fill vs user choice:

    // --- Non-MFJ logic (Single, MFS, HOH, QW) ---
    if (filingStatus !== 'Married Filing Jointly') {
        // If user tries to set 3 owners in Non-MFJ, do nothing
        if (numOwners === 3) {
            console.warn("Three owners is not supported for Non-MFJ. Doing nothing...");
            return;
        }
        else if (numOwners === 1) {
            // Auto-fill with client’s name
            for (let i = 1; i <= numOwners; i++) {
                const ownerSection = document.createElement('section');
                ownerSection.classList.add('owner-entry');
                ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

                // Owner label
                const nameLabel = document.createElement('label');
                nameLabel.textContent = `Owner ${i} (Auto-Filled)`;
                ownerSection.appendChild(nameLabel);

                // Disabled select showing client’s name
                const nameSelect = document.createElement('select');
                nameSelect.id = `business${businessIndex}OwnerName${i}`;
                nameSelect.name = `business${businessIndex}OwnerName${i}`;
                ownerSection.appendChild(nameSelect);

                const opt = document.createElement('option');
                opt.value = clientFirstName;
                opt.textContent = clientFirstName;
                nameSelect.appendChild(opt);

                nameSelect.disabled = true;
                nameSelect.style.backgroundColor = '#f0f0f0';

                // If S-Corp => add compensation field
                if (businessTypeVal === 'S-Corp') {
                    const compInput = createLabelAndCurrencyField(
                        ownerSection,
                        `business${businessIndex}OwnerComp${i}`,
                        `Reasonable Compensation ($) for ${clientFirstName}:`,
                        0
                    );
                    compInput.addEventListener('blur', function () {
                        checkSCorpReasonableComp(businessIndex);
                        updateBusinessNet(businessIndex);
                    });
                }

                // Ownership % locked at 100 for single owner
                const pctLabel = document.createElement('label');
                pctLabel.textContent = 'Ownership %:';
                ownerSection.appendChild(pctLabel);

                const pctInput = document.createElement('input');
                pctInput.type = 'number';
                pctInput.value = '100.0000';
                pctInput.readOnly = true;
                pctInput.style.backgroundColor = '#f0f0f0';
                pctInput.id = `business${businessIndex}OwnerPercent${i}`;
                pctInput.name = `business${businessIndex}OwnerPercent${i}`;
                ownerSection.appendChild(pctInput);

                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
        else if (numOwners === 2) {
            // #1=client, #2="Other", both locked
            for (let i = 1; i <= 2; i++) {
                const ownerSection = document.createElement('section');
                ownerSection.classList.add('owner-entry');
                ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

                const nameLabel = document.createElement('label');
                nameLabel.textContent = `Owner ${i}`;
                ownerSection.appendChild(nameLabel);

                const nameSelect = document.createElement('select');
                nameSelect.id = `business${businessIndex}OwnerName${i}`;
                nameSelect.name = `business${businessIndex}OwnerName${i}`;
                ownerSection.appendChild(nameSelect);

                let fillName = (i === 1) ? clientFirstName : 'Other';
                const opt = document.createElement('option');
                opt.value = fillName;
                opt.textContent = fillName;
                nameSelect.appendChild(opt);

                nameSelect.disabled = true;
                nameSelect.style.backgroundColor = '#f0f0f0';

                // If S-Corp => add compensation
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

                // We can let them choose ownership % or auto-split 50/50:
                const pctLabel = document.createElement('label');
                pctLabel.textContent = 'Ownership %:';
                ownerSection.appendChild(pctLabel);

                const pctInput = document.createElement('input');
                pctInput.type = 'number';
                pctInput.id = `business${businessIndex}OwnerPercent${i}`;
                pctInput.name = `business${businessIndex}OwnerPercent${i}`;
                ownerSection.appendChild(pctInput);

                // If you want a strict 50/50, auto fill
                if (i === 1) {
                    pctInput.value = '50.0000';
                } else {
                    pctInput.value = '50.0000';
                }
                pctInput.readOnly = true;
                pctInput.style.backgroundColor = '#f0f0f0';

                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }

        // If the user typed any other # of owners, we do nothing
        return; // done
    }
    else {
        // --- MFJ logic (filingStatus === 'Married Filing Jointly') ---
        if (numOwners === 1) {
            // Let the user pick between client or spouse
            for (let i = 1; i <= 1; i++) {
                const ownerSection = document.createElement('section');
                ownerSection.classList.add('owner-entry');
                ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

                const nameLabel = document.createElement('label');
                nameLabel.textContent = `Owner ${i} (Pick who)`;
                ownerSection.appendChild(nameLabel);

                const nameSelect = document.createElement('select');
                nameSelect.id = `business${businessIndex}OwnerName${i}`;
                nameSelect.name = `business${businessIndex}OwnerName${i}`;

                // Add the 2 spouse options
                const pleaseOpt = document.createElement('option');
                pleaseOpt.value = 'Please Select';
                pleaseOpt.textContent = 'Please Select';
                pleaseOpt.disabled = true;
                pleaseOpt.selected = true;
                nameSelect.appendChild(pleaseOpt);

                const optClient = document.createElement('option');
                optClient.value = clientFirstName;
                optClient.textContent = clientFirstName;
                nameSelect.appendChild(optClient);

                const optSpouse = document.createElement('option');
                optSpouse.value = spouseFirstName;
                optSpouse.textContent = spouseFirstName;
                nameSelect.appendChild(optSpouse);

                ownerSection.appendChild(nameSelect);

                if (businessTypeVal === 'S-Corp') {
                    const compInput = createLabelAndCurrencyField(
                        ownerSection,
                        `business${businessIndex}OwnerComp${i}`,
                        `Reasonable Compensation ($)`,
                        0
                    );
                    compInput.addEventListener('blur', function () {
                        checkSCorpReasonableComp(businessIndex);
                        updateBusinessNet(businessIndex);
                    });
                }

                const pctLabel = document.createElement('label');
                pctLabel.textContent = 'Ownership %:';
                ownerSection.appendChild(pctLabel);

                const pctInput = document.createElement('input');
                pctInput.type = 'number';
                pctInput.value = '100.0000';
                pctInput.readOnly = true;
                pctInput.style.backgroundColor = '#f0f0f0';
                pctInput.id = `business${businessIndex}OwnerPercent${i}`;
                pctInput.name = `business${businessIndex}OwnerPercent${i}`;
                ownerSection.appendChild(pctInput);

                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
        else if (numOwners === 2) {
            // Let them pick for each of the 2 owners: client, spouse, or other
            for (let i = 1; i <= 2; i++) {
                const ownerSection = document.createElement('section');
                ownerSection.classList.add('owner-entry');
                ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

                const nameLabel = document.createElement('label');
                nameLabel.textContent = `Owner ${i} (Pick who)`;
                ownerSection.appendChild(nameLabel);

                const nameSelect = document.createElement('select');
                nameSelect.id = `business${businessIndex}OwnerName${i}`;
                nameSelect.name = `business${businessIndex}OwnerName${i}`;

                const pleaseOpt = document.createElement('option');
                pleaseOpt.value = 'Please Select';
                pleaseOpt.textContent = 'Please Select';
                pleaseOpt.disabled = true;
                pleaseOpt.selected = true;
                nameSelect.appendChild(pleaseOpt);

                [clientFirstName, spouseFirstName, 'Other'].forEach(name => {
                    const opt = document.createElement('option');
                    opt.value = name;
                    opt.textContent = name;
                    nameSelect.appendChild(opt);
                });
                ownerSection.appendChild(nameSelect);

                // If S-Corp => comp field
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

                // Ownership % let them fill or do a 50/50 auto suggestion
                const pctLabel = document.createElement('label');
                pctLabel.textContent = 'Ownership %:';
                ownerSection.appendChild(pctLabel);

                const pctInput = document.createElement('input');
                pctInput.type = 'number';
                pctInput.id = `business${businessIndex}OwnerPercent${i}`;
                pctInput.name = `business${businessIndex}OwnerPercent${i}`;
                pctInput.value = (i === 1) ? '50.0000' : '50.0000';
                ownerSection.appendChild(pctInput);

                // You can keep your existing two-owners logic if you want
                // handleTwoOwnersInput(...) for auto forcing sum=100 etc.

                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
        else if (numOwners === 3) {
            // Must auto-fill: #1=client, #2=spouse, #3=Other
            for (let i = 1; i <= 3; i++) {
                const ownerSection = document.createElement('section');
                ownerSection.classList.add('owner-entry');
                ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

                const nameLabel = document.createElement('label');
                nameLabel.textContent = `Owner ${i} (Auto-Filled)`;
                ownerSection.appendChild(nameLabel);

                const nameSelect = document.createElement('select');
                nameSelect.id = `business${businessIndex}OwnerName${i}`;
                nameSelect.name = `business${businessIndex}OwnerName${i}`;
                ownerSection.appendChild(nameSelect);

                let fillName;
                if (i === 1) fillName = clientFirstName;
                else if (i === 2) fillName = spouseFirstName;
                else fillName = 'Other';

                const opt = document.createElement('option');
                opt.value = fillName;
                opt.textContent = fillName;
                nameSelect.appendChild(opt);

                nameSelect.disabled = true;
                nameSelect.style.backgroundColor = '#f0f0f0';

                // If S-Corp => comp field
                if (businessTypeVal === 'S-Corp') {
                    const compInput = createLabelAndCurrencyField(
                        ownerSection,
                        `business${businessIndex}OwnerComp${i}`,
                        `Reasonable Compensation ($)`,
                        0
                    );
                    compInput.addEventListener('blur', function () {
                        checkSCorpReasonableComp(businessIndex);
                        updateBusinessNet(businessIndex);
                    });
                }

                const pctLabel = document.createElement('label');
                pctLabel.textContent = 'Ownership %:';
                ownerSection.appendChild(pctLabel);

                const pctInput = document.createElement('input');
                pctInput.type = 'number';
                pctInput.id = `business${businessIndex}OwnerPercent${i}`;
                pctInput.name = `business${businessIndex}OwnerPercent${i}`;
                ownerSection.appendChild(pctInput);

                // If you want to force an auto 34/33/33 or something, set them here
                if (i === 1) pctInput.value = '34.0000';
                if (i === 2) pctInput.value = '33.0000';
                if (i === 3) pctInput.value = '33.0000';

                pctInput.readOnly = true;
                pctInput.style.backgroundColor = '#f0f0f0';

                dynamicOwnerFieldsDiv.appendChild(ownerSection);
            }
        }
    }

    const ownerSelects = dynamicOwnerFieldsDiv.querySelectorAll(
        `select[id^="business${businessIndex}OwnerName"]`
    );
    ownerSelects.forEach(select => {
        // On "change", re-run the function that disallows duplicates:
        select.addEventListener('change', () => {
            updateBusinessOwnerDropdowns(businessIndex);
        });
    });

    // Then you might want to do an initial call once:
    updateBusinessOwnerDropdowns(businessIndex);

    // After creating, you may want to re-run your “validateTotalOwnership” or “updateOwnerApportionment”
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
    // 1. Calculate Net (Income - Expenses)
    const incomeField = document.getElementById(`business${index}Income`);
    const expensesField = document.getElementById(`business${index}Expenses`);
    const incomeVal = unformatCurrency(incomeField?.value || '0');
    const expensesVal = unformatCurrency(expensesField?.value || '0');
    const netVal = incomeVal - expensesVal;

    const netField = document.getElementById(`business${index}Net`);
    if (netField) {
        netField.value = formatCurrency(String(netVal));
        netField.style.color = (netVal < 0) ? 'red' : 'black';
    }

    // 2. Clear any "overrides" from apportionment/disclaimers
    for (let key in apportionmentOverrides) {
        delete apportionmentOverrides[key];
    }
    removeDisclaimer(`businessEntry${index}`, 'DEPENDENT_WAGE');
    removeDisclaimer(`businessEntry${index}`, 'SCORP_DEPENDENT_WAGE');
    
    // 3. Compute total dependent wages for this business
    let totalDependentWages = 0;
    for (let depIndex in dependentBizMap) {
        const entry = dependentBizMap[depIndex];
        if (entry && entry.businessIndex === index) {
            totalDependentWages += entry.wage;
        }
    }
    
    // Debug output:
    console.log(`Business ${index} -> Expenses: ${expensesVal}, Total Dependent Wages: ${totalDependentWages}`);

    // 4. For S‑Corp, compute total Reasonable Compensation
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

    // 5. If expenses field was blurred (and expenses > 0), check dependent wages vs. expenses
    if (blurredExpenses[index] && expensesVal > 0) {
        if (totalDependentWages > expensesVal) {
            addDisclaimer(
                `businessEntry${index}`,
                'DEPENDENT_WAGE',
                `Dependent Wages of (${formatCurrency(String(totalDependentWages))}) Exceeds Expenses`
            );
        }
    }

    // 6. For S‑Corp: if (dependent wages + owner comp) > expenses, show combined disclaimer
    if (businessTypeVal === 'S-Corp') {
        const combined = totalDependentWages + totalReasonableComp;
        if (totalReasonableComp > 0 && combined > expensesVal) {
            addDisclaimer(
                `businessEntry${index}`,
                'SCORP_DEPENDENT_WAGE',
                `Dependent Wages (${formatCurrency(String(totalDependentWages))}) + Reasonable Compensation (${formatCurrency(String(totalReasonableComp))}) exceeds this S-Corp's Expenses (${formatCurrency(String(expensesVal))}).`
            );
        }
    }

    // 7. Update apportionment and other totals
    updateOwnerApportionment(index);
    checkSCorpReasonableComp(index);
    if (businessTypeVal === 'C-Corp') {
        showCcorpTaxDue(index);
    }
    recalculateTotals();
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
    const netVal = unformatCurrency(netStr);  // Could be positive, zero, or negative
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    if (numOwners < 2) return;  // No increment if only 1 owner

    // 1) Get the current portion array (or generate from ownership % + overrides).
    let portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // 2) Increase the chosen owner's portion by 1
    portions[ownerIndex - 1] += 1;

    // 3) Now the sum may exceed (or be greater/less) the net. Let's fix leftover:
    let leftover = netVal - portions.reduce((a, b) => a + b, 0);

    // 4) Redistribute leftover among other owners
    //    - If leftover is positive, we add +1 to other owners until leftover = 0
    //    - If leftover is negative, we subtract -1 from other owners until leftover = 0
    //    (We do up to 100 passes to avoid infinite loops).
    let maxPasses = 100;
    outerLoop: while (leftover !== 0 && maxPasses > 0) {
        for (let i = 0; i < numOwners; i++) {
            if (i === (ownerIndex - 1)) continue; // skip the just-incremented owner
            if (leftover === 0) break outerLoop;

            if (leftover > 0) {
                portions[i] += 1;
                leftover--;
            } else {
                // leftover < 0
                portions[i] -= 1;
                leftover++;
            }
        }
        maxPasses--;
    }

    // 5) Store these portions as overrides (so they persist).
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }

    // 6) Now re-display with updated overrides
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

    // 1) Decrease the chosen owner's portion by 1
    portions[ownerIndex - 1] -= 1;

    // 2) Fix leftover
    let leftover = netVal - portions.reduce((a, b) => a + b, 0);

    // 3) Redistribute leftover among other owners
    let maxPasses = 100;
    outerLoop: while (leftover !== 0 && maxPasses > 0) {
        for (let i = 0; i < numOwners; i++) {
            if (i === (ownerIndex - 1)) continue;
            if (leftover === 0) break outerLoop;

            if (leftover > 0) {
                portions[i] += 1;
                leftover--;
            } else {
                portions[i] -= 1;
                leftover++;
            }
        }
        maxPasses--;
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
            showBlackDisclaimer(
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
    labelSpan.textContent = `Tax Due for Client's portion of ${bizName}: `;
    container.appendChild(labelSpan);

    const amountSpan = document.createElement('span');
    amountSpan.id = `ccorpTaxDueAmount-biz${businessIndex}`;
    amountSpan.textContent = formatCurrency(finalTaxDue.toString());
    amountSpan.style.color = '#ff4f4f';
    amountSpan.style.fontWeight = 'bold';
    amountSpan.style.fontSize = '21px';
    amountSpan.style.textDecoration = 'underline double';
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
    // Grab all the selects like "businessXOwnerName1", "businessXOwnerName2", ...
    const ownerSelects = document.querySelectorAll(
        `#dynamicOwnerFields${businessIndex} select[id^="business${businessIndex}OwnerName"]`
    );
    if (!ownerSelects.length) return;

    // Figure out which base options are valid (depends on filing status)
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';

    let baseOptions;
    if (filingStatus === 'Married Filing Jointly') {
        baseOptions = [clientFirstName, spouseFirstName, 'Other'];
    } else {
        baseOptions = [clientFirstName, 'Other'];
    }

    // 1) Gather "already chosen" names from all the selects:
    let selectedNames = [];
    ownerSelects.forEach(select => {
        if (select.value && baseOptions.includes(select.value)) {
            selectedNames.push(select.value);
        }
    });

    // 2) For each dropdown, rebuild the <option> list
    ownerSelects.forEach(select => {
        const currentVal = select.value; // e.g. "Client1"
        // We'll remove all old <option> elements
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }

        // Always add a "Please Select" top option
        const pleaseOpt = document.createElement('option');
        pleaseOpt.value = 'Please Select';
        pleaseOpt.textContent = 'Please Select';
        pleaseOpt.disabled = true;
        pleaseOpt.selected = true;
        select.appendChild(pleaseOpt);

        // Then add each name from baseOptions
        // *except* if it's already chosen by a different Owner
        baseOptions.forEach(name => {
            const isAlreadyChosen = selectedNames.includes(name);

            // If "isAlreadyChosen" is true, we normally skip it...
            // ...but if this select's "currentVal" is that same name,
            // we keep it so we don't forcibly reset them to something else.
            const keepThisName = (name === currentVal) || !isAlreadyChosen;

            if (keepThisName) {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            }
        });

        // Finally, if the select's "currentVal" was forcibly removed,
        // re-set it to "Please Select":
        if (![...select.options].some(opt => opt.value === currentVal)) {
            select.value = 'Please Select';
            select.disabled = true;
            select.selected = true;
        } else {
            select.value = currentVal;
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

    // Open the W-2 collapsible by adding the "active" class
    const w2Container = document.getElementById('w2sContainer');
    if (w2Container) {
      w2Container.classList.add('active');
    }

    document.getElementById('addW2Btn').addEventListener('click', addW2Block);

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
  
function showBlackDisclaimer(message, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let disclaimer = document.getElementById(`black-disclaimer-${containerId}`);
    if (!disclaimer) {
        disclaimer = document.createElement('div');
        disclaimer.id = `black-disclaimer-${containerId}`;
        disclaimer.classList.add('black-disclaimer');  // add our CSS class
        disclaimer.style.fontWeight = 'bold';
        disclaimer.style.marginTop = '0px';
        container.appendChild(disclaimer);
    }
    disclaimer.textContent = message;
}

function removeBlackDisclaimer(containerId) {
    const disclaimer = document.getElementById(`black-disclaimer-${containerId}`);
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

//-------------------//
// 24. W2 CODE BOXES //
//-------------------//

// Define the available IRS code options
const w2CodeOptions = [
    { value: "A", text: "A - Uncollected Social Security tax or Railroad Retirement Tax Act (RRTA) tax on tips" },
    { value: "B", text: "B - Uncollected Medicare tax on tips" },
    { value: "C", text: "C - Taxable costs of group-term life insurance over $50,000" },
    { value: "D", text: "D - Elective deferral under a Section 401(k) cash or arrangement plan" },
    { value: "E", text: "E - Elective deferral under a Section 403(b) salary reduction agreement" },
    { value: "F", text: "F - Elective deferral under a Section 408(k)(6) salary reduction SEP" },
    { value: "G", text: "G - Elective deferrals and employer contributions (including nonelective deferrals) to a Section 457(b) deferred compensation plan" },
    { value: "H", text: "H - Elective deferrals and employer contributions (including nonelective deferrals) to a Section 501(c)(18)(D) tax-exempt organization plan" },
    { value: "J", text: "J - Nontaxable sick pay" },
    { value: "K", text: "K - 20% excise tax on excess golden parachute payments" },
    { value: "L", text: "L - Substantiated employee business expense reimbursements" },
    { value: "M", text: "M - Uncollected Social Security or RRTA tax on taxable cost of group-term life insurance over $50,000 (former employees only)" },
    { value: "N", text: "N - Uncollected Medicare tax on taxable cost of group-term life insurance over $50,000 (former employees only)" },
    { value: "P", text: "P - Excludable moving expense reimbursements paid directly to a member of the U.S. Armed Forces" },
    { value: "Q", text: "Q - Nontaxable combat pay for military personnel" },
    { value: "R", text: "R - Employer contributions to an Archer medical savings account (MSA)" },
    { value: "S", text: "S - Employee salary reduction contributions under a Section 408(p) SIMPLE plan" },
    { value: "T", text: "T - Adoption benefits" },
    { value: "V", text: "V - Income from exercise of nonstatutory stock option(s)" },
    { value: "W", text: "W - Employer contributions (including amounts the employee elected to contribute using a Section 125 (cafeteria) plan) to an employee's health savings account (HSA)" },
    { value: "Y", text: "Y - Deferrals under a Section 409A nonqualified deferred compensation plan" },
    { value: "Z", text: "Z - Income under a nonqualified deferred compensation plan that fails to satisfy Section 409A" },
    { value: "AA", text: "AA - Designated Roth contributions under a Section 401(k) plan" },
    { value: "BB", text: "BB - Designated Roth contributions under a Section 403(b) plan" },
    { value: "DD", text: "DD - Cost of employer-sponsored health coverage" },
    { value: "EE", text: "EE - Designated Roth contributions under a governmental Section 457(b) plan" },
    { value: "FF", text: "FF - Permitted benefits under a qualified small employer health reimbursement arrangement" },
    { value: "GG", text: "GG - Income from qualified equity grants under Section 83(i)" },
    { value: "HH", text: "HH - Aggregate deferrals under Section 83(i) elections as of the close of the calendar year" },
    { value: "II", text: "II - Medicaid waiver payments excluded from gross income under Notice 2014-7" }
];

// Creates the dynamic code boxes inside the W2 container.
function createW2CodeBoxes(numCodes, container) {
    container.innerHTML = ""; // Clear any existing boxes in this container
    for (let i = 0; i < numCodes; i++) {
      // Create a wrapper div for each W-2 code box
      const boxDiv = document.createElement("div");
      boxDiv.classList.add("w2-code-box");
  
      // --- "Select Code" field group ---
      const selectGroup = document.createElement("div");
      selectGroup.classList.add("form-group");
  
      const codeLabel = document.createElement("label");
      // Use a unique id that combines the container id and code index
      codeLabel.setAttribute("for", "W2Code_" + container.id + "_" + (i + 1));
      codeLabel.textContent = "Please Select Code from Dropdown:";
      selectGroup.appendChild(codeLabel);
  
      const dropdown = document.createElement("select");
      dropdown.name = "W2Code_" + container.id + "_" + (i + 1);
      dropdown.id = "W2Code_" + container.id + "_" + (i + 1);
      dropdown.classList.add("w2-code-dropdown");
      populateW2Dropdown(dropdown);
      dropdown.addEventListener("change", updateW2CodeDropdowns);
      selectGroup.appendChild(dropdown);
      boxDiv.appendChild(selectGroup);
  
      // --- "Enter Dollar ($) Amount" field group ---
      const amountGroup = document.createElement("div");
      amountGroup.classList.add("form-group");
  
      const amountLabel = document.createElement("label");
      amountLabel.setAttribute("for", "W2CodeAmount_" + container.id + "_" + (i + 1));
      amountLabel.textContent = "Enter Dollar ($) Amount:";
      amountGroup.appendChild(amountLabel);
  
      const amountInput = document.createElement("input");
      amountInput.type = "text";
      amountInput.name = "W2CodeAmount_" + container.id + "_" + (i + 1);
      amountInput.id = "W2CodeAmount_" + container.id + "_" + (i + 1);
      amountInput.classList.add("w2-code-amount");
  
      // On blur, format the input and enforce a minimum value of 1
      amountInput.addEventListener("blur", function() {
        const rawValue = unformatCurrency(amountInput.value);
        if (rawValue < 1) {
          amountInput.value = formatCurrency("1");
        } else {
          amountInput.value = formatCurrency(String(rawValue));
        }
      });
      amountGroup.appendChild(amountInput);
      boxDiv.appendChild(amountGroup);
  
      container.appendChild(boxDiv);
    }
}

// Helper function to populate a given dropdown with the available IRS code options.
function populateW2Dropdown(dropdown) {
    dropdown.innerHTML = "";
  
    // Add a default "Please Select" option
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "Please Select";
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    dropdown.appendChild(defaultOpt);
  
    w2CodeOptions.forEach(function(option) {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.text;
      dropdown.appendChild(opt);
    });
}

// Update all dropdowns so that codes chosen in one are removed from the others.
function updateW2CodeDropdowns() {
    const dropdowns = document.querySelectorAll(".w2-code-dropdown");
    const selectedCodes = [];
  
    // Gather selected values from each dropdown
    dropdowns.forEach(function(dd) {
      if (dd.value) {
        selectedCodes.push(dd.value);
      }
    });
  
    // Update each dropdown's options based on other selections.
    dropdowns.forEach(function(dd) {
      const currentSelection = dd.value;
      dd.innerHTML = "";
  
      // Add the default option first.
      const defaultOpt = document.createElement("option");
      defaultOpt.value = "";
      defaultOpt.textContent = "Please Select";
      defaultOpt.disabled = true;
      defaultOpt.selected = (currentSelection === "");
      dd.appendChild(defaultOpt);
  
      w2CodeOptions.forEach(function(option) {
        // Skip this option if it's selected in another dropdown (unless it's the current selection)
        if (selectedCodes.indexOf(option.value) > -1 && option.value !== currentSelection) {
          return;
        }
  
        const opt = document.createElement("option");
        opt.value = option.value;
        opt.textContent = option.text;
        if (option.value === currentSelection) {
          opt.selected = true;
        }
        dd.appendChild(opt);
      });
    });
}

function addW2Block() {
    w2Counter++;
    // Create container for one W-2 block
    const w2Block = document.createElement('div');
    w2Block.classList.add('w2-block');
    w2Block.id = 'w2Block_' + w2Counter;    

    // Header for this W-2
    const header = document.createElement('h3');
    header.textContent = 'W-2 #' + w2Counter;
    w2Block.appendChild(header);    

    // --- W-2 Name ---
    const nameGroup = document.createElement('div');
    nameGroup.classList.add('form-group');
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', 'w2Name_' + w2Counter);
    nameLabel.textContent = 'W-2 Name:';
    nameGroup.appendChild(nameLabel);
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'w2Name_' + w2Counter;
    nameInput.name = 'w2Name_' + w2Counter;
    nameGroup.appendChild(nameInput);
    w2Block.appendChild(nameGroup); 

    // --- Wages, Salaries, Tips, and Other Compensation ---
    const wagesGroup = document.createElement('div');
    wagesGroup.classList.add('form-group');
    const wagesLabel = document.createElement('label');
    wagesLabel.setAttribute('for', 'w2Wages_' + w2Counter);
    wagesLabel.textContent = 'Wages, Salaries, Tips, and Other Compensation:';
    wagesGroup.appendChild(wagesLabel);
    const wagesInput = document.createElement('input');
    wagesInput.type = 'text';
    wagesInput.id = 'w2Wages_' + w2Counter;
    wagesInput.name = 'w2Wages_' + w2Counter;
    wagesInput.classList.add('currency-field');
    wagesGroup.appendChild(wagesInput);
    w2Block.appendChild(wagesGroup);    

    // --- Federal Income Tax Withheld ---
    const federalTaxGroup = document.createElement('div');
    federalTaxGroup.classList.add('form-group');
    const federalTaxLabel = document.createElement('label');
    federalTaxLabel.setAttribute('for', 'w2FederalTaxWithheld_' + w2Counter);
    federalTaxLabel.textContent = 'Federal Income Tax Withheld:';
    federalTaxGroup.appendChild(federalTaxLabel);
    const federalTaxInput = document.createElement('input');
    federalTaxInput.type = 'text';
    federalTaxInput.id = 'w2FederalTaxWithheld_' + w2Counter;
    federalTaxInput.name = 'w2FederalTaxWithheld_' + w2Counter;
    federalTaxInput.classList.add('currency-field');
    federalTaxGroup.appendChild(federalTaxInput);
    w2Block.appendChild(federalTaxGroup);   
    
    // --- Medicare Wages and Tips ---
    const medicareWagesGroup = document.createElement('div');
    medicareWagesGroup.classList.add('form-group');
    const medicareWagesLabel = document.createElement('label');
    medicareWagesLabel.setAttribute('for', 'w2MedicareWages_' + w2Counter);
    medicareWagesLabel.textContent = 'Medicare Wages and Tips:';
    medicareWagesGroup.appendChild(medicareWagesLabel);
    const medicareWagesInput = document.createElement('input');
    medicareWagesInput.type = 'text';
    medicareWagesInput.id = 'w2MedicareWages_' + w2Counter;
    medicareWagesInput.name = 'w2MedicareWages_' + w2Counter;
    medicareWagesInput.classList.add('currency-field');
    medicareWagesGroup.appendChild(medicareWagesInput);
    w2Block.appendChild(medicareWagesGroup);

    // --- Medicare Tax Withheld ---
    const medicareTaxGroup = document.createElement('div');
    medicareTaxGroup.classList.add('form-group');
    const medicareTaxLabel = document.createElement('label');
    medicareTaxLabel.setAttribute('for', 'w2MedicareTaxWithheld_' + w2Counter);
    medicareTaxLabel.textContent = 'Medicare Tax Withheld:';
    medicareTaxGroup.appendChild(medicareTaxLabel);
    const medicareTaxInput = document.createElement('input');
    medicareTaxInput.type = 'text';
    medicareTaxInput.id = 'w2MedicareTaxWithheld_' + w2Counter;
    medicareTaxInput.name = 'w2MedicareTaxWithheld_' + w2Counter;
    medicareTaxInput.classList.add('currency-field');
    medicareTaxGroup.appendChild(medicareTaxInput);
    w2Block.appendChild(medicareTaxGroup);  

    // --- State Wages, Tips, etc. ---
    const stateWagesGroup = document.createElement('div');
    stateWagesGroup.classList.add('form-group');
    const stateWagesLabel = document.createElement('label');
    stateWagesLabel.setAttribute('for', 'w2StateWages_' + w2Counter);
    stateWagesLabel.textContent = 'State Wages, Tips, etc:';
    stateWagesGroup.appendChild(stateWagesLabel);
    const stateWagesInput = document.createElement('input');
    stateWagesInput.type = 'text';
    stateWagesInput.id = 'w2StateWages_' + w2Counter;
    stateWagesInput.name = 'w2StateWages_' + w2Counter;
    stateWagesInput.classList.add('currency-field');
    stateWagesGroup.appendChild(stateWagesInput);
    w2Block.appendChild(stateWagesGroup);   
    
    // --- State Income Tax ---
    const stateTaxGroup = document.createElement('div');
    stateTaxGroup.classList.add('form-group');
    const stateTaxLabel = document.createElement('label');
    stateTaxLabel.setAttribute('for', 'w2StateTaxWithheld_' + w2Counter);
    stateTaxLabel.textContent = 'State Income Tax:';
    stateTaxGroup.appendChild(stateTaxLabel);
    const stateTaxInput = document.createElement('input');
    stateTaxInput.type = 'text';
    stateTaxInput.id = 'w2StateTaxWithheld_' + w2Counter;
    stateTaxInput.name = 'w2StateTaxWithheld_' + w2Counter;
    stateTaxInput.classList.add('currency-field');
    stateTaxGroup.appendChild(stateTaxInput);
    w2Block.appendChild(stateTaxGroup);

    // --- How many Codes are there in Box 12 of W-2? ---
    const codeNumGroup = document.createElement('div');
    codeNumGroup.classList.add('form-group');
    const codeNumLabel = document.createElement('label');
    codeNumLabel.setAttribute('for', 'W2CodeNum_' + w2Counter);
    codeNumLabel.textContent = 'How many Codes are there in Box 12 of W-2?:';
    codeNumGroup.appendChild(codeNumLabel);
    const codeNumInput = document.createElement('input');
    codeNumInput.type = 'number';
    codeNumInput.id = 'W2CodeNum_' + w2Counter;
    codeNumInput.name = 'W2CodeNum_' + w2Counter;
    codeNumInput.min = '0';
    codeNumInput.max = '30';
    codeNumGroup.appendChild(codeNumInput);
    w2Block.appendChild(codeNumGroup);  

    // --- Container for W-2 Code Boxes for this block ---
    const codeBoxesContainer = document.createElement('div');
    codeBoxesContainer.id = 'W2CodeBoxesContainer_' + w2Counter;
    w2Block.appendChild(codeBoxesContainer);  

    // When the code number input changes, generate the code boxes for this block.
    codeNumInput.addEventListener('input', function() {
      const num = parseInt(this.value, 10) || 0;
      createW2CodeBoxes(num, codeBoxesContainer);
    }); 

    // --- Remove this W-2? Button ---
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove this W-2?';
    removeBtn.classList.add('remove-w2-btn');
    removeBtn.addEventListener('click', function() {
      w2Block.remove();
    });
    w2Block.appendChild(removeBtn); 

    // Append the new W-2 block to the container
    document.getElementById('w2sContainer').appendChild(w2Block);   
    w2Block.querySelectorAll('.currency-field').forEach((field) => {
          field.addEventListener('blur', function() {
              this.value = formatCurrency(this.value);
          });
      });

}
