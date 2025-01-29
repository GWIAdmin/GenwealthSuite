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

//--------------------------------//
// 4. DYNAMIC DEPENDENTS CREATION //
//--------------------------------//

document.getElementById('numberOfDependents').addEventListener('input', function() {
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
        createLabelAndInput(container, `dependent${index}Birthdate`, `Dependent ${index} Birthdate:`, 'date');
        createLabelAndInput(container, `dependent${index}Age`, `Dependent ${index} Current Age:`, 'number');
        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
        });
    } else if (value === 'No') {
        createLabelAndDropdown(container, `dependent${index}AgeRange`, `What is the Age Category of Child/Dependent ${index}?`, ['Please Select','17 or younger', '18 or older']);
    }
}

function handleEmploymentStatusChange(index, value) {
    const container = document.getElementById(`employmentConditionalContainer${index}`);
    container.innerHTML = '';

    if (value === 'Yes') {
        // Create the Income field for Dependent
        createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`);

        // Add an event so if user changes the wage, we update the mapping.
        const incomeField = document.getElementById(`dependent${index}Income`);
        incomeField.addEventListener('blur', function() {
            updateDependentBizMap(index);
            // If we know which business the dependent belongs to, recalc that business net
            const depData = dependentBizMap[index];
            if (depData && depData.businessIndex) {
                updateBusinessNet(depData.businessIndex);
                recalculateTotals();
            }
        });

        // Create the "Is Dependent Employed in One of the Client's Businesses?" dropdown
        createLabelAndDropdown(container, `dependent${index}EmployedInBusiness`, `Is Dependent ${index} Employed in One of the Client's Businesses?`, ['Please Select', 'Yes', 'No']);

        // Listen for user selecting "Yes" or "No"
        document.getElementById(`dependent${index}EmployedInBusiness`).addEventListener('change', function() {
            if (this.value === 'Yes') {
                const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
                const businessNames = [];
                for (let i = 1; i <= numBusinesses; i++) {
                    const bName = document.getElementById(`business${i}Name`)?.value || `Business ${i}`;
                    businessNames.push(bName);
                }
                createLabelAndDropdown(container, `dependent${index}BusinessName`, `Which Business?`, ['Please Select', ...(businessNames.length > 0 ? businessNames : ['No businesses available'])]);

                // Once "Which Business?" is created, attach a listener
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
                // "No" means not employed in a client business. Remove any prior mapping
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
        // If Dependent is not employed at all, show "Willing to Hire?" etc.
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
        // Also remove any prior business assignment
        delete dependentBizMap[index];
        recalculateTotals();
    }
}

function updateDependentBizMap(dependentIndex) {
    // 1) Read the dependent's wage
    const wageStr = document.getElementById(`dependent${dependentIndex}Income`)?.value || '0';
    const wageVal = unformatCurrency(wageStr);

    // 2) Check "Is Dependent Employed in One of the Client's Businesses?"
    const employedVal = document.getElementById(`dependent${dependentIndex}EmployedInBusiness`)?.value || 'No';
    if (employedVal !== 'Yes') {
        // Not employed in a business, remove from map
        delete dependentBizMap[dependentIndex];
        return;
    }

    // 3) Identify which business they picked
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

    // If user didn't select any real business, remove from map
    if (!matchedBusinessIndex) {
        delete dependentBizMap[dependentIndex];
        return;
    }

    // 4) Store the assignment
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
    const birthdate = new Date(birthdateValue);
    const errorMessageId = `${ageInputId}ErrorMessage`;
    let errorMessage = document.getElementById(errorMessageId);
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

    // Birthdate validation
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

    if (errorMessage) errorMessage.textContent = ''; // Clear error message if date is valid
    document.getElementById(ageInputId).value = age;
}

function validateAgeInput(input, index) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);

    // Age validations
    if (isNaN(age) || age < 0) {
        displayErrorMessage(errorMessageId, 'Age cannot be less than 0.', input.id);
    } else if (age > 100) {
        displayErrorMessage(errorMessageId, 'Age cannot be greater than 100 years.', input.id);
    } else {
        if (errorMessage) errorMessage.textContent = ''; // Clear error if age is valid
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
    // For Married Filing Jointly, the spouse's field is relevant
    if ((filingStatus === 'Married Filing Jointly') &&
        !isNaN(spouseAgeVal) && spouseAgeVal >= 65) {
        spouse65Plus = true;
    }

    // Count how many are 65+
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
        errorMessage.style.color = 'red';
        document.getElementById(inputId).parentNode.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
}

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    validateAgeInput(this, 'current');
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    validateAgeInput(this, 'spouse');
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
    spouseLast.classList.add('auto-copied'); // bright yellow border
    // Optionally remove green if it was previously set:
    spouseLast.classList.remove('input-completed');
});

document.getElementById('spouseLastName').addEventListener('input', function() {
    // If user typed anything at all, remove auto-copied
    if (this.classList.contains('auto-copied')) {
        this.classList.remove('auto-copied');
    }
    // We do NOT add green class yet; see onblur:
});

document.getElementById('spouseLastName').addEventListener('blur', function() {
    if (this.value.trim() !== '') {
        this.classList.add('input-completed'); // green border
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
        // 4. Now restore any data for that business
        populateBusinessDetailFields(i);
    }

    // Finally, recalc
    recalculateTotals();
});

function createBusinessNameFields(container, index) {
    const businessNameDiv = document.createElement('div');
    businessNameDiv.classList.add('business-name-entry');
    createLabelAndInput(businessNameDiv, `business${index}Name`, `Business ${index} Name:`, 'text');
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
    // Detect parentheses. If string is enclosed by (...) we treat it as negative.
    let isNegative = false;
    // e.g. "( $1,234 )"
    if (/\(.*\)/.test(value)) {
        isNegative = true;
    }

    // Strip out everything except digits and decimal point
    let numericValue = value.replace(/[^\d.]/g, '');
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
    input.addEventListener('blur', function() {
        input.value = formatCurrency(input.value);
    });
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
    ul.style.color = 'red';
    ul.style.fontWeight = 'bold';
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
    const businessDiv = document.createElement('div');
    businessDiv.classList.add('business-entry');

    // NEW: give each business an id for disclaimers
    businessDiv.id = `businessEntry${index}`;

    const heading = document.createElement('h3');
    heading.id = `businessNameHeading${index}`;
    const bNameInput = document.getElementById(`business${index}Name`);
    heading.textContent = bNameInput ? bNameInput.value : `Business ${index}`;
    if (bNameInput) {
        bNameInput.addEventListener('input', function() {
            heading.textContent = bNameInput.value;
        });
    }
    businessDiv.appendChild(heading);

    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
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

    const netField = businessDiv.querySelector(`#business${index}Net`);
    if (netField) {
        netField.readOnly = true;
    }

    const ownersContainer = document.createElement('div');
    ownersContainer.id = `ownersContainer${index}`;
    businessDiv.appendChild(ownersContainer);

    const numOwnersLabel = document.createElement('label');
    numOwnersLabel.textContent = `How many owners does Business ${index} have?`;
    numOwnersLabel.style.marginTop = '12px';
    ownersContainer.appendChild(numOwnersLabel);

    const numOwnersSelect = document.createElement('select');
    numOwnersSelect.id = `numOwnersSelect${index}`;
    numOwnersSelect.name = `numOwnersSelect${index}`;
    ownersContainer.appendChild(numOwnersSelect);
    populateNumOwnersOptions(numOwnersSelect);

    const dynamicOwnerFieldsDiv = document.createElement('div');
    dynamicOwnerFieldsDiv.id = `dynamicOwnerFields${index}`;
    dynamicOwnerFieldsDiv.style.marginTop = '12px';
    ownersContainer.appendChild(dynamicOwnerFieldsDiv);

    typeSelect.addEventListener('change', function() {
        handleBusinessTypeChange(index, typeSelect.value);
    });

    numOwnersSelect.addEventListener('change', function() {
        const selectedVal = parseInt(this.value, 10);
        createOwnerFields(index, selectedVal);
    });

    container.appendChild(businessDiv);

    const incomeField = document.getElementById(`business${index}Income`);
    const expensesField = document.getElementById(`business${index}Expenses`);
    incomeField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });
    expensesField.addEventListener('blur', function() {
        updateBusinessNet(index);
        recalculateTotals();
        checkSCorpReasonableComp(index);
    });
}

function populateNumOwnersOptions(selectEl) {
    const filingStatus = document.getElementById('filingStatus').value;
    selectEl.innerHTML = '';
    let possibleVals;
    if (filingStatus === 'Married Filing Jointly') {
        possibleVals = [0,1,2,3];
    } else {
        possibleVals = [0,1,2];
    }
    possibleVals.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        if (v === 0) {
            opt.textContent = 'Please Select';
        } else {
            opt.textContent = String(v);
        }
        selectEl.appendChild(opt);
    });
}

function handleBusinessTypeChange(businessIndex, businessType) {
    const ownersContainer = document.getElementById(`ownersContainer${businessIndex}`);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${businessIndex}`);
    removeScheduleCQuestion(businessIndex);

    if (businessType === 'Schedule-C') {
        ownersContainer.style.display = 'none';
        numOwnersSelect.value = '1';
        addScheduleCQuestion(businessIndex);

    } else if (businessType === 'Please Select') {
        ownersContainer.style.display = 'none';
        numOwnersSelect.value = '0';
        dynamicOwnerFieldsDiv.innerHTML = '';

    } else {
        ownersContainer.style.display = 'block';
    }
}

function addScheduleCQuestion(businessIndex) {
    const businessDivs = document.querySelectorAll('.business-entry');
    const myDiv = businessDivs[businessIndex - 1];
    if (!myDiv) return;
    const label = document.createElement('label');
    label.id = `scheduleCLabel${businessIndex}`;
    label.style.marginTop = '12px';
    label.textContent = 'Which client owns this Schedule C?';
    myDiv.appendChild(label);
    const scheduleCDropdown = document.createElement('select');
    scheduleCDropdown.id = `scheduleCOwner${businessIndex}`;
    scheduleCDropdown.name = `scheduleCOwner${businessIndex}`;
    myDiv.appendChild(scheduleCDropdown);
    const clientFirst = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirst = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    const filingStatus = document.getElementById('filingStatus').value;
    let optionsArr = [ 'Please Select', clientFirst ];
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
    dynamicOwnerFieldsDiv.innerHTML = '';
    if (isNaN(numOwners) || numOwners < 1) return;

    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';

    // NEW: If MFJ and user selects 3 owners, just create read-only fields
    if (filingStatus === 'Married Filing Jointly' && numOwners === 3) {
        const ownerNames = [clientFirstName, spouseFirstName, 'Other'];

        for (let i = 1; i <= 3; i++) {
            const ownerSection = document.createElement('section');
            ownerSection.classList.add('owner-entry');
            ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

            // Label + read-only text field
            const nameLabel = document.createElement('label');
            nameLabel.textContent = `Owner ${i} Name:`;
            ownerSection.appendChild(nameLabel);

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = `business${businessIndex}OwnerName${i}`;
            nameInput.name = `business${businessIndex}OwnerName${i}`;
            nameInput.value = ownerNames[i-1];
            nameInput.readOnly = true;
            nameInput.style.backgroundColor = '#f0f0f0';
            ownerSection.appendChild(nameInput);

            // If business type is S-Corp, add Reasonable Compensation input
            const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
            if (businessTypeVal === 'S-Corp') {
                const compLabel = document.createElement('label');
                compLabel.textContent = `Reasonable Compensation ($) for Owner ${i}:`;
                ownerSection.appendChild(compLabel);
                const compInput = document.createElement('input');
                compInput.type = 'text';
                compInput.id = `business${businessIndex}OwnerComp${i}`;
                compInput.name = `business${businessIndex}OwnerComp${i}`;
                compInput.classList.add('currency-field');
                compInput.addEventListener('blur', function() {
                    compInput.value = formatCurrency(compInput.value);
                    checkSCorpReasonableComp(businessIndex);
                    updateBusinessNet(businessIndex);
                });
                ownerSection.appendChild(compInput);
            }

            // Ownership %
            const percentLabel = document.createElement('label');
            percentLabel.textContent = `Owner ${i} Ownership %:`;
            ownerSection.appendChild(percentLabel);

            const percentInput = document.createElement('input');
            percentInput.type = 'number';
            percentInput.step = '0.0001';
            percentInput.min = '0';
            percentInput.id = `business${businessIndex}OwnerPercent${i}`;
            percentInput.name = `business${businessIndex}OwnerPercent${i}`;
            ownerSection.appendChild(percentInput);

            // For 3 owners, we handle the sum in autoCalculateLastOwner
            if (i < 3) {
                percentInput.addEventListener('blur', () => {
                    autoCalculateLastOwner(businessIndex, 3);
                    updateOwnerApportionment(businessIndex);
                });
            } else {
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }

            // Apportionment container
            const apportionmentContainer = document.createElement('div');
            apportionmentContainer.id = `business${businessIndex}OwnerPercent${i}-apportionmentContainer`;
            ownerSection.appendChild(apportionmentContainer);

            dynamicOwnerFieldsDiv.appendChild(ownerSection);
        }

        // Validate ownership sum
        validateTotalOwnership(businessIndex, numOwners);
        return; // End here - no dropdown logic
    }

    // EXISTING LOGIC FOR 1 or 2 owners or other filing statuses
    for (let i = 1; i <= numOwners; i++) {
        const ownerSection = document.createElement('section');
        ownerSection.classList.add('owner-entry');
        ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Owner ${i} (Select Who?):`;
        ownerSection.appendChild(nameLabel);

        const nameSelect = document.createElement('select');
        nameSelect.id = `business${businessIndex}OwnerName${i}`;
        nameSelect.name = `business${businessIndex}OwnerName${i}`;
        ownerSection.appendChild(nameSelect);

        let optionsArr = [];
        if (filingStatus === 'Married Filing Jointly') {
            if (numOwners === 1) {
                optionsArr = [ 'Please Select', clientFirstName, spouseFirstName ];
            } else if (numOwners === 2) {
                optionsArr = [ 'Please Select', clientFirstName, spouseFirstName, 'Other' ];
            }
        } else {
            if (numOwners === 1) {
                optionsArr = [ 'Please Select', clientFirstName ];
            } else if (numOwners === 2) {
                optionsArr = [ 'Please Select', clientFirstName, 'Other' ];
            }
        }
        if (!optionsArr.length) {
            optionsArr = [ 'Please Select', clientFirstName ];
        }
        optionsArr.forEach(optLabel => {
            const opt = document.createElement('option');
            opt.value = optLabel;
            opt.textContent = optLabel;
            nameSelect.appendChild(opt);
        });

        // If S-Corp, add Reasonable Compensation
        const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';
        if (businessTypeVal === 'S-Corp') {
            const compLabel = document.createElement('label');
            compLabel.textContent = `Reasonable Compensation ($) for Owner ${i}:`;
            ownerSection.appendChild(compLabel);
            const compInput = document.createElement('input');
            compInput.type = 'text';
            compInput.id = `business${businessIndex}OwnerComp${i}`;
            compInput.name = `business${businessIndex}OwnerComp${i}`;
            compInput.classList.add('currency-field');
            compInput.addEventListener('blur', function() {
                compInput.value = formatCurrency(compInput.value);
                checkSCorpReasonableComp(businessIndex);
                updateBusinessNet(businessIndex);
            });
            ownerSection.appendChild(compInput);
        }

        // Ownership %
        const percentLabel = document.createElement('label');
        percentLabel.textContent = `Owner ${i} Ownership %:`;
        ownerSection.appendChild(percentLabel);

        const percentInput = document.createElement('input');
        percentInput.type = 'number';
        percentInput.step = '0.0001';
        percentInput.min = '0';
        percentInput.id = `business${businessIndex}OwnerPercent${i}`;
        percentInput.name = `business${businessIndex}OwnerPercent${i}`;
        ownerSection.appendChild(percentInput);

        if (numOwners === 1) {
            percentInput.value = '100.0000';
            percentInput.readOnly = true;
            percentInput.style.backgroundColor = '#f0f0f0';
        } else if (numOwners === 2) {
            percentInput.addEventListener('blur', () => {
                handleTwoOwnersInput(businessIndex, i);
                updateOwnerApportionment(businessIndex);
            });
        } else if (numOwners === 3) {
            // This is the scenario for MFJ handled above, but if user tries 3 owners for other filing statuses
            // same approach
            if (i < 3) {
                percentInput.addEventListener('blur', () => {
                    autoCalculateLastOwner(businessIndex, 3);
                    updateOwnerApportionment(businessIndex);
                });
            } else {
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }
        }

        // Apportionment container
        const apportionmentContainer = document.createElement('div');
        apportionmentContainer.id = `business${businessIndex}OwnerPercent${i}-apportionmentContainer`;
        ownerSection.appendChild(apportionmentContainer);

        dynamicOwnerFieldsDiv.appendChild(ownerSection);
    }

    // Validate total ownership
    validateTotalOwnership(businessIndex, numOwners);
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

    // We'll check each owner's input
    for (let i = 1; i <= numOwners; i++) {
        const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerInput) continue;

        // Container ID for disclaimers under THIS owner
        const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
        const errorKey = 'OWNERSHIP_SUM';

        // Remove any old disclaimers about ownership sum specifically for this owner
        removeDisclaimer(ownerContainerId, errorKey);  // <-- ensures disclaimers accumulate properly

        ownerInput.classList.remove('input-error');
        const valStr = ownerInput.value.trim();
        const val = parseFloat(valStr);
        if (!isNaN(val) && val !== 0) anyValueEntered = true;
        totalOwnership += (isNaN(val) ? 0 : val);
    }

    // If user hasn't entered anything, do not show disclaimers
    if (!anyValueEntered) {
        return;
    }

    // If total ownership not equal to 100, add disclaimers to ALL owners
    if (Math.abs(totalOwnership - 100) > 0.0001) {
        for (let i = 1; i <= numOwners; i++) {
            const ownerContainerId = `ownerContainer-${businessIndex}-${i}`;
            const errorKey = 'OWNERSHIP_SUM';
            addDisclaimer(
                ownerContainerId,
                errorKey,
                `Total ownership must equal 100%. Currently, it is ${totalOwnership.toFixed(4)}%.`
            );
            // Mark the percentage input in red for each owner
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.add('input-error');
            }
        }
    } else {
        // If total is now 100, remove disclaimers for all owners
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
    // Grab the Income and Expenses fields
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`)?.value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`)?.value || '0');

    // Sum up total dependent wages assigned to this business (but DO NOT add to expenses!)
    let totalDependentWages = 0;
    for (let depIndex in dependentBizMap) {
        if (dependentBizMap.hasOwnProperty(depIndex)) {
            const entry = dependentBizMap[depIndex];
            if (entry.businessIndex === index) {
                totalDependentWages += entry.wage;
            }
        }
    }

    // Calculate the net (Income - Expenses) ONLY
    const netVal = incomeVal - expensesVal;
    const netField = document.getElementById(`business${index}Net`);
    if (netField) {
        netField.value = formatCurrency(String(netVal));
        netField.style.color = netVal < 0 ? 'red' : 'black';
    }

    updateOwnerApportionment(index);
    checkSCorpReasonableComp(index);

    // Show a red disclaimer if dependent wages exceed (for non-S-corp) OR
    // if dependent wages + total reasonable comp exceed (for S-corp) the business expenses.

    removeDisclaimer(`businessEntry${index}`, 'DEPENDENT_WAGE');

    const businessTypeVal = document.getElementById(`business${index}Type`)?.value || '';

    // Sum up Reasonable Compensation for all owners if this is an S-Corp
    let totalReasonableComp = 0;
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

        // For S-Corp: check if (dependentWages + totalReasonableComp) > expensesVal
        if (businessTypeVal === 'S-Corp') {
            if ((totalDependentWages + totalReasonableComp) > expensesVal) {
                addDisclaimer(
                    `businessEntry${index}`,
                    'DEPENDENT_WAGE',
                    `WARNING: Dependent wages + Reasonable Compensation (${
                        formatCurrency(String(totalDependentWages + totalReasonableComp))
                    }) exceed total Expenses (${formatCurrency(String(expensesVal))}).`
                );
            }
        }
        // For all other business types: check if dependentWages > expensesVal
        else {
            if (totalDependentWages > expensesVal) {
                addDisclaimer(
                    `businessEntry${index}`,
                    'DEPENDENT_WAGE',
                    `WARNING: Dependent wages (${
                        formatCurrency(String(totalDependentWages))
                    }) exceed total Expenses (${formatCurrency(String(expensesVal))}).`
                );
            }
        }
}

const apportionmentOverrides = {};

function updateOwnerApportionment(businessIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10) || 0;
    for (let i = 1; i <= numOwners; i++) {
        const pctStr = document.getElementById(`business${businessIndex}OwnerPercent${i}`)?.value || '0';
        const pct = parseFloat(pctStr) || 0;
        let defaultPortion = parseInt(netVal * (pct / 100));
        const overrideKey = `biz${businessIndex}-owner${i}`;
        let portionToDisplay = overrideKey in apportionmentOverrides ? apportionmentOverrides[overrideKey] : defaultPortion;
        showApportionment(businessIndex, i, portionToDisplay);
    }
}

function showApportionment(businessIndex, ownerIndex, portion) {
    const containerId = `business${businessIndex}OwnerPercent${ownerIndex}-apportionmentContainer`;
    let apportionmentEl = document.getElementById(`apportionment-${containerId}`);
    if (!apportionmentEl) {
        apportionmentEl = document.createElement('div');
        apportionmentEl.id = `apportionment-${containerId}`;
        apportionmentEl.style.fontWeight = 'bold';
        apportionmentEl.style.marginTop = '8px';
        document.getElementById(containerId)?.appendChild(apportionmentEl);
    }
    apportionmentEl.innerHTML = ''; 

    // Create the core text: "Apportionment of Owner X is "
    const prefixSpan = document.createElement('span');
    prefixSpan.textContent = `Apportionment of Owner ${ownerIndex} is `;
    prefixSpan.style.color = 'black';
    apportionmentEl.appendChild(prefixSpan);

    // Create the amount + label ("(Income)/(Loss)") with color
    const amountSpan = document.createElement('span');
    const absolutePortion = Math.abs(portion);
    if (portion < 0) {
        amountSpan.textContent = `$${absolutePortion} (Loss)`;
        amountSpan.style.color = 'red';
    } else {
        amountSpan.textContent = `$${absolutePortion} (Income)`;
        amountSpan.style.color = 'green';
    }
    apportionmentEl.appendChild(amountSpan);

    // Create up/down arrow buttons (unchanged from your existing code)
    const upBtn = document.createElement('button');
    upBtn.textContent = '▲';
    upBtn.classList.add('arrow-btn');
    upBtn.addEventListener('click', (e) => {
        e.preventDefault();
        incrementApportionment(businessIndex, ownerIndex);
    });
    apportionmentEl.appendChild(upBtn);

    const downBtn = document.createElement('button');
    downBtn.textContent = '▼';
    downBtn.classList.add('arrow-btn');
    downBtn.addEventListener('click', (e) => {
        e.preventDefault();
        decrementApportionment(businessIndex, ownerIndex);
    });
    apportionmentEl.appendChild(downBtn);
}

function incrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10);
    let portions = [];
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        if (overrideKey in apportionmentOverrides) {
            portions[i] = apportionmentOverrides[overrideKey];
        } else {
            const pctStr = document.getElementById(`business${businessIndex}OwnerPercent${i}`)?.value || '0';
            const pct = parseFloat(pctStr) || 0;
            portions[i] = parseInt(netVal * (pct / 100));
        }
    }
    portions[ownerIndex] = (portions[ownerIndex] || 0) + 1;
    if (numOwners === 2) {
        const other = (ownerIndex === 1) ? 2 : 1;
        portions[other] = netVal - portions[ownerIndex];
        if (portions[other] < 0) {
            portions[ownerIndex] = netVal;
            portions[other] = 0;
        }
    } else if (numOwners === 3) {
        let o1 = portions[1] || 0;
        let o2 = portions[2] || 0;
        let o3 = portions[3] || 0;
        if (ownerIndex === 1) {
            o3 = netVal - o1 - o2;
        } else if (ownerIndex === 2) {
            o3 = netVal - o1 - o2;
        } else {
            o1 = netVal - o2 - o3;
        }
        if (o1 < 0) o1 = 0;
        if (o2 < 0) o2 = 0;
        if (o3 < 0) o3 = 0;
        portions[1] = o1; portions[2] = o2; portions[3] = o3;
    }
    for (let i = 1; i <= numOwners; i++) {
        apportionmentOverrides[`biz${businessIndex}-owner${i}`] = portions[i];
    }
    updateOwnerApportionment(businessIndex);
}

function decrementApportionment(businessIndex, ownerIndex) {
    const netStr = document.getElementById(`business${businessIndex}Net`)?.value || '0';
    const netVal = unformatCurrency(netStr);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${businessIndex}`);
    if (!numOwnersSelect) return;
    const numOwners = parseInt(numOwnersSelect.value, 10);
    let portions = [];
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        if (overrideKey in apportionmentOverrides) {
            portions[i] = apportionmentOverrides[overrideKey];
        } else {
            const pctStr = document.getElementById(`business${businessIndex}OwnerPercent${i}`)?.value || '0';
            const pct = parseFloat(pctStr) || 0;
            portions[i] = parseInt(netVal * (pct / 100));
        }
    }
    portions[ownerIndex] = (portions[ownerIndex] || 0) - 1;
    if (portions[ownerIndex] < 0) {
        portions[ownerIndex] = 0;
    }
    if (numOwners === 2) {
        const other = (ownerIndex === 1) ? 2 : 1;
        portions[other] = netVal - portions[ownerIndex];
        if (portions[other] < 0) {
            portions[ownerIndex] = netVal;
            portions[other] = 0;
        }
    } else if (numOwners === 3) {
        let o1 = portions[1], o2 = portions[2], o3 = portions[3];
        if (ownerIndex === 1) {
            o3 = netVal - o1 - o2;
        } else if (ownerIndex === 2) {
            o3 = netVal - o1 - o2;
        } else {
            o1 = netVal - o2 - o3;
        }
        if (o1 < 0) o1 = 0;
        if (o2 < 0) o2 = 0;
        if (o3 < 0) o3 = 0;
        portions[1] = o1; portions[2] = o2; portions[3] = o3;
    }
    for (let i = 1; i <= numOwners; i++) {
        apportionmentOverrides[`biz${businessIndex}-owner${i}`] = portions[i];
    }
    updateOwnerApportionment(businessIndex);
}

function checkSCorpReasonableComp(businessIndex) {
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
    const containerId = `dynamicOwnerFields${businessIndex}`;
    const errorKey = 'SCORP_COMP';
    removeDisclaimer(containerId, errorKey);
    compFields.forEach(f => f.classList.remove('input-error'));
    if (totalComp > expensesVal) {
        addDisclaimer(
            containerId,
            errorKey,
            `Total Owners' Reasonable Compensation (${formatCurrency(totalComp.toString())}) cannot exceed this S-Corp's Expenses (${formatCurrency(expensesVal.toString())}).`
        );
        compFields.forEach(f => f.classList.add('input-error'));
    }
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
        const focusable = Array.from(this.elements).filter(
            el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        );
        const index = focusable.indexOf(document.activeElement);
        if (index > -1 && index < focusable.length - 1) {
            focusable[index + 1].focus();
        } else if (index === focusable.length - 1) {
            focusable[0].focus();
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
        disclaimer.style.color = 'red';
        disclaimer.style.fontWeight = 'bold';
        disclaimer.style.marginTop = '12px';
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
        disclaimer.style.color = 'blue';
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
      return; // No selection
    }
  
    // Check if selection's parent has background-color = 'yellow'
    let isHighlighted = false;
    if (currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentNode;
      if (parent && parent.style && parent.style.backgroundColor === 'yellow') {
        isHighlighted = true;
      }
    }
  
    if (isHighlighted) {
      // Remove highlight
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      // Apply highlight
      document.execCommand('hiliteColor', false, 'yellow');
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

function restoreFormSnapshot(snapshot) {
    // 1) Parse JSON
    const dataObj = JSON.parse(snapshot);

    // 2) Restore the "controller" fields for dynamic sections first
    //    so that we can rebuild them in the DOM
    if (dataObj.numOfBusinesses !== undefined) {
        const numOfBusinessesField = document.getElementById('numOfBusinesses');
        if (numOfBusinessesField) {
            numOfBusinessesField.value = dataObj.numOfBusinesses;
        }
    }
    if (dataObj.numScheduleEs !== undefined) {
        const numScheduleEsField = document.getElementById('numScheduleEs');
        if (numScheduleEsField) {
            numScheduleEsField.value = dataObj.numScheduleEs;
        }
    }
    if (dataObj.numberOfDependents !== undefined) {
        const depField = document.getElementById('numberOfDependents');
        if (depField) {
            depField.value = dataObj.numberOfDependents;
        }
    }

    // 3) Rebuild dynamic sections based on those "controller" values
    //    A) Re-create dynamic business fields
    const numBiz = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    const bizNameContainer = document.getElementById('numOfBusinessesContainer');
    if (bizNameContainer) {
        bizNameContainer.innerHTML = '';
        for (let i = 1; i <= numBiz; i++) {
            createBusinessNameFields(bizNameContainer, i);
        }
    }

    const bizContainer = document.getElementById('businessContainer');
    if (bizContainer) {
        bizContainer.innerHTML = '';
        for (let i = 1; i <= numBiz; i++) {
            createBusinessFields(bizContainer, i);
        }
    }

    //    B) Re-create dynamic Schedule E fields
    const seContainer = document.getElementById('scheduleEsContainer');
    if (seContainer) {
        seContainer.innerHTML = '';
        const eCount = parseInt(document.getElementById('numScheduleEs').value || '0', 10);
        for (let i = 1; i <= eCount; i++) {
            createScheduleEFields(seContainer, i);
        }
    }

    //    C) Re-create dependent fields
    const depCount = parseInt(document.getElementById('numberOfDependents').value || '0', 10);
    const depContainer = document.getElementById('dependentsContainer');
    if (depContainer) {
        depContainer.innerHTML = '';
        if (depCount > 0) {
            const heading = document.createElement('h1');
            heading.textContent = 'Children / Dependents Details';
            depContainer.appendChild(heading);
            for (let i = 1; i <= depCount; i++) {
                createDependentFields(depContainer, i);
            }
        }
    }

    // 4) Now that all fields exist in the DOM,
    //    set their values from dataObj
    for (let key in dataObj) {
        const fieldList = document.getElementsByName(key);
        if (fieldList && fieldList.length > 0) {
            // If there is exactly one element with this name, set its value
            const field = fieldList[0];
            if (field) {
                field.value = dataObj[key];
            }
        }
    }

    // 5) Trigger any needed finalization (e.g. the business net
    //    calculations, disclaimers, re-formatting, etc.)
    //    For instance, recompute net for each business:
    for (let i = 1; i <= numBiz; i++) {
        updateBusinessNet(i);
        checkSCorpReasonableComp(i);
    }
    // 6) And for each Schedule E
    const eCountFinal = parseInt(document.getElementById('numScheduleEs').value || '0', 10);
    for (let i = 1; i <= eCountFinal; i++) {
        updateScheduleENet(i);
    }

    // 7) Force business headings to match the name fields
    for (let i = 1; i <= numBiz; i++) {
        const nameField = document.getElementById(`business${i}Name`);
        const headingEl = document.getElementById(`businessNameHeading${i}`);
        if (nameField && headingEl) {
            headingEl.textContent = nameField.value || `Business ${i}`;
        }
    }

    // 8) Final real-time recalc across the entire form
    recalculateTotals();
    recalculateDeductions();
}

document.getElementById('taxForm').addEventListener('input', function(e) {
    undoStack.push(getFormSnapshot());
    redoStack = [];
});

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

//-----------------------------------------//
// 22. PLACEHOLDERS TO AVOID BREAKING CODE //
//-----------------------------------------//

function saveBusinessDetailData() {
    const container = document.getElementById('businessContainer');
    if (!container) return;

    // Collect ALL inputs/selects for each business
    const inputs = container.querySelectorAll('input, select');
    inputs.forEach(input => {
        const fieldId = input.id;
        if (fieldId) {
            businessDetailStore[fieldId] = input.value;
        }
    });
}

function populateBusinessDetailFields(index) {
    // Populate the standard fields for business #index
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
            let el = document.getElementById(f);
            if (el) {
                el.value = businessDetailStore[f];
            }
        }
    });

    // 1) Retrieve the number of owners from the stored data:
    const numOwnersSelectEl = document.getElementById(`numOwnersSelect${index}`);
    if (numOwnersSelectEl) {
        // If we have it in storage, this ensures the UI matches
        if (businessDetailStore[`numOwnersSelect${index}`]) {
            numOwnersSelectEl.value = businessDetailStore[`numOwnersSelect${index}`];
        }

        // 2) Now actually CREATE the owner fields in the DOM:
        const numOwners = parseInt(numOwnersSelectEl.value, 10) || 0;
        createOwnerFields(index, numOwners);

        // 3) Populate each new owner field with stored data:
        for (let i = 1; i <= numOwners; i++) {
            // For example: "business1OwnerName1", "business1OwnerPercent1", "business1OwnerComp1" etc.
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

    // After re-populating, recalc net, disclaimers, etc.
    updateBusinessNet(index);
    checkSCorpReasonableComp(index);

    // If owners exist, check that their total ownership = 100
    if (numOwnersSelectEl) {
        validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);
    }
}
