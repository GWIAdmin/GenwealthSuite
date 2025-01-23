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
        createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`);
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
    }
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
    if (isNaN(birthdate.getTime())) {
        return;
    }
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDifference = today.getMonth() - birthdate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
        age--;
    }
    document.getElementById(ageInputId).value = age;
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

function validateAgeInput(input, index) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);
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

//----------------------------------------------//
// 6. AUTO-COPY LAST NAME TO SPOUSE'S LAST NAME //
//----------------------------------------------//

document.getElementById('lastName').addEventListener('input', function() {
    const spouseLast = document.getElementById('spouseLastName');
    spouseLast.value = this.value;
    spouseLast.classList.add('auto-copied');
});

document.getElementById('spouseLastName').addEventListener('input', function() {
    this.classList.remove('input-completed');
});

//--------------------------------------//
// 7. DYNAMIC BUSINESS NAME CREATION    //
//--------------------------------------//

let businessNameStore = {};
let businessDetailStore = {};

document.getElementById('numOfBusinesses').addEventListener('input', function() {
    const newCount = parseInt(this.value, 10) || 0;
    saveBusinessNameData();
    const container = document.getElementById('numOfBusinessesContainer');
    container.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        createBusinessNameFields(container, i);
        populateBusinessNameFields(i);
    }
    saveBusinessDetailData();
    const mainBizContainer = document.getElementById('businessContainer');
    mainBizContainer.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        createBusinessFields(mainBizContainer, i);
        populateBusinessDetailFields(i);
    }
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
    let numericValue = value.replace(/[^\d.-]/g, '');
    return parseFloat(numericValue) || 0;
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
    const heading = document.createElement('h3');
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
    typeSelect.addEventListener('change', function () {
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
    for (let i = 1; i <= numOwners; i++) {
        const ownerSection = document.createElement('section');
        ownerSection.classList.add('owner-entry');
        ownerSection.id = `ownerContainer-${businessIndex}-${i}`;
        if (filingStatus === 'Married Filing Jointly' && numOwners === 3) {
            const nameLabel = document.createElement('label');
            nameLabel.textContent = `Owner ${i} Name:`;
            ownerSection.appendChild(nameLabel);
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.id = `business${businessIndex}OwnerName${i}`;
            nameInput.name = `business${businessIndex}OwnerName${i}`;
            ownerSection.appendChild(nameInput);
        } else {
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
        }
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
            });
            ownerSection.appendChild(compInput);
        }
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
            if (i < 3) {
                percentInput.addEventListener('blur', () => {
                    autoCalculateLastOwner(businessIndex, numOwners);
                    updateOwnerApportionment(businessIndex);
                });
            } else {
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }
        }
        const apportionmentContainer = document.createElement('div');
        apportionmentContainer.id = `business${businessIndex}OwnerPercent${i}-apportionmentContainer`;
        ownerSection.appendChild(apportionmentContainer);
        dynamicOwnerFieldsDiv.appendChild(ownerSection);
    }
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
    const containerId = `dynamicOwnerFields${businessIndex}`;
    const errorKey = 'OWNERSHIP_SUM';
    removeDisclaimer(containerId, errorKey);
    for (let i = 1; i <= numOwners; i++) {
        const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
        if (!ownerInput) continue;
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
        addDisclaimer(
            containerId,
            errorKey,
            `Total ownership must equal 100%. Currently, it is ${totalOwnership.toFixed(4)}%.`
        );
        for (let i = 1; i <= numOwners; i++) {
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) {
                ownerInput.classList.add('input-error');
            }
        }
    } else {
        removeDisclaimer(containerId, errorKey);
        for (let i = 1; i <= numOwners; i++) {
            const ownerInput = document.getElementById(`business${businessIndex}OwnerPercent${i}`);
            if (ownerInput) ownerInput.classList.remove('input-error');
        }
    }
}

function updateBusinessNet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`).value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`).value || '0');
    const netVal = incomeVal - expensesVal;
    const netField = document.getElementById(`business${index}Net`);
    netField.value = formatCurrency(netVal.toString());
    netField.style.color = (netVal < 0) ? 'red' : 'green';
    updateOwnerApportionment(index);
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
        apportionmentEl.style.color = 'black';
        apportionmentEl.style.fontWeight = 'bold';
        apportionmentEl.style.marginTop = '8px';
        document.getElementById(containerId)?.appendChild(apportionmentEl);
    }
    apportionmentEl.innerHTML = '';
    const span = document.createElement('span');
    span.textContent = `Apportionment of Owner ${ownerIndex} is ${formatCurrency(String(portion))}`;
    apportionmentEl.appendChild(span);
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
    document.getElementById('totalIncome').value = isNaN(totalIncomeVal) ? '' : parseInt(totalIncomeVal);
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
  if (!currentSelection.isCollapsed) {
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
    const dataObj = JSON.parse(snapshot);
    for (let key in dataObj) {
        const field = document.getElementsByName(key)[0];
        if (field) {
            field.value = dataObj[key];
        }
    }
    recalculateTotals();
    recalculateDeductions();
    const numBiz = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    const bizContainer = document.getElementById('businessContainer');
    bizContainer.innerHTML = '';
    for (let i = 1; i <= numBiz; i++) {
        createBusinessFields(bizContainer, i);
        populateBusinessDetailFields(i);
    }
    const newCount = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
    const container = document.getElementById('numOfBusinessesContainer');
    container.innerHTML = '';
    for (let i = 1; i <= newCount; i++) {
        createBusinessNameFields(container, i);
        populateBusinessNameFields(i);
    }
    const eCount = parseInt(document.getElementById('numScheduleEs').value, 10) || 0;
    const seContainer = document.getElementById('scheduleEsContainer');
    seContainer.innerHTML = '';
    for (let i = 1; i <= eCount; i++) {
        createScheduleEFields(seContainer, i);
    }
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

function saveBusinessDetailData() {}
function populateBusinessDetailFields(index) {}
