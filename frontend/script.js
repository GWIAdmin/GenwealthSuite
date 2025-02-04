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

            // Trigger any relevant "change" listeners if needed. For example, 
            // we need to re-show age fields if "Do You Know the DOB?" is "Yes," etc.
            // We'll manually dispatch change if the field is a <select>.
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

        // Existing listener to auto-calculate age from birthdate:
        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
        });

        // NEW: If the user types into the Age field, clear the birthdate:
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
        errorMessage.classList.add('red-disclaimer');
        document.getElementById(inputId).parentNode.appendChild(errorMessage);
    }
    errorMessage.textContent = message;
}

document.getElementById('birthdate').addEventListener('change', function() {
    calculateAge(this.value, 'currentAge');
});

document.getElementById('currentAge').addEventListener('input', function() {
    // If the user manually enters something into 'currentAge', clear the birthdate
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

    // NEW: give each business an id for disclaimers
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
    populateNumOwnersOptions(numOwnersSelect);

    const dynamicOwnerFieldsDiv = document.createElement('div');
    dynamicOwnerFieldsDiv.id = `dynamicOwnerFields${index}`;
    dynamicOwnerFieldsDiv.style.marginTop = '12px';
    ownersContainer.appendChild(dynamicOwnerFieldsDiv);

    typeSelect.addEventListener('change', function() {
        handleBusinessTypeChange(index, typeSelect.value);
    });

    numOwnersSelect.addEventListener('change', function(e) {
        saveBusinessDetailData();
        // Re-create owners
        const selectedVal = parseInt(this.value, 10);
        createOwnerFields(index, selectedVal);
        populateBusinessDetailFields(index);
    });

    container.appendChild(businessDiv);
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

function handleBusinessTypeChange(index, businessType) {
    const ownersContainer = document.getElementById(`ownersContainer${index}`);
    const numOwnersSelect = document.getElementById(`numOwnersSelect${index}`);
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${index}`);

    removeScheduleCQuestion(index);

    if (businessType === 'Schedule-C') {

        // 1) Check if Filing Status is "Married Filing Jointly"
        const isMFJ = (document.getElementById('filingStatus').value === 'Married Filing Jointly');

        if (isMFJ) {
            // Existing logic for MFJ — show "Which client owns this Schedule-C?" dropdown
            // so the user can choose between “Client1” or “Spouse.”
            ownersContainer.style.display = 'none';
            numOwnersSelect.value = '1';
            addScheduleCQuestion(index);

        } else {
            // NEW LOGIC for non-MFJ:
            //  -- We want exactly 1 owner, automatically "Client1."
            ownersContainer.style.display = 'block';
            numOwnersSelect.value = '1';

            // Clear out any existing dynamic owners and rebuild
            dynamicOwnerFieldsDiv.innerHTML = '';
            createOwnerFields(index, 1);

            // Force the single owner’s name to “Client1”
            const nameField = document.getElementById(`business${index}OwnerName1`);
            if (nameField) {
                nameField.value = 'Client1';
                nameField.readOnly = true;  // Make read-only to prevent user from overriding
                nameField.style.backgroundColor = '#f0f0f0'; // visually indicate read-only
            }
        }
    
    } else if (businessType === 'Please Select') {
        // Existing logic for "Please Select"
        ownersContainer.style.display = 'none';
        numOwnersSelect.value = '0';
        dynamicOwnerFieldsDiv.innerHTML = '';

    } else if (businessType === 'Partnership') {
        // NEW: Partnerships MUST have 2 or 3 owners. No single-owner.
        ownersContainer.style.display = 'block';

        // Rebuild the numOwnersSelect so that it ONLY offers:
        // "Please Select" (0), "2", "3"
        while (numOwnersSelect.firstChild) {
            numOwnersSelect.removeChild(numOwnersSelect.firstChild);
        }

        const pleaseOpt = document.createElement('option');
        pleaseOpt.value = 0;
        pleaseOpt.textContent = 'Please Select';
        numOwnersSelect.appendChild(pleaseOpt);

        const twoOpt = document.createElement('option');
        twoOpt.value = 2;
        twoOpt.textContent = '2';
        numOwnersSelect.appendChild(twoOpt);

        const threeOpt = document.createElement('option');
        threeOpt.value = 3;
        threeOpt.textContent = '3';
        numOwnersSelect.appendChild(threeOpt);

        // Force the selection to "0" so user *must* pick either 2 or 3
        numOwnersSelect.value = '0';

        // Clear out any existing dynamic owner fields
        dynamicOwnerFieldsDiv.innerHTML = '';

    } else {
        // For S-Corp, C-Corp, etc. - your existing logic
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
    dynamicOwnerFieldsDiv.innerHTML = ''; // Clear existing fields first

    // If user picks 0 or invalid, do nothing
    if (isNaN(numOwners) || numOwners < 1) return;

    // Gather context
    const filingStatus = document.getElementById('filingStatus').value;
    const clientFirstName = document.getElementById('firstName').value.trim() || 'Client1';
    const spouseFirstName = document.getElementById('spouseFirstName').value.trim() || 'Client2';
    const businessTypeVal = document.getElementById(`business${businessIndex}Type`)?.value || '';

    for (let i = 1; i <= numOwners; i++) {
        const ownerSection = document.createElement('section');
        ownerSection.classList.add('owner-entry');
        ownerSection.id = `ownerContainer-${businessIndex}-${i}`;

        // ----- Owner name select -----
        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Owner ${i} (Select Who?):`;
        nameLabel.setAttribute('for', `business${businessIndex}OwnerName${i}`);
        ownerSection.appendChild(nameLabel);

        const nameSelect = document.createElement('select');
        nameSelect.id = `business${businessIndex}OwnerName${i}`;
        nameSelect.name = `business${businessIndex}OwnerName${i}`;
        ownerSection.appendChild(nameSelect);

        // Build dropdown options for this business’s owners
        let optionsArr = [];
        if (filingStatus === 'Married Filing Jointly') {
            if (numOwners === 1) {
                optionsArr = [ 'Please Select', clientFirstName, spouseFirstName ];
            } else {
                // 2 or 3 owners
                optionsArr = [ 'Please Select', clientFirstName, spouseFirstName, 'Other' ];
            }
        } else {
            // Not MFJ
            if (numOwners === 1) {
                optionsArr = [ 'Please Select', clientFirstName ];
            } else {
                // 2 or 3 owners
                optionsArr = [ 'Please Select', clientFirstName, 'Other' ];
            }
        }
        optionsArr.forEach(optLabel => {
            const opt = document.createElement('option');
            opt.value = optLabel;
            opt.textContent = optLabel;
            nameSelect.appendChild(opt);
        });

        // ----- If S-Corp => Reasonable Comp field -----
        if (businessTypeVal === 'S-Corp') {
            const compLabel = document.createElement('label');
            compLabel.textContent = `Reasonable Compensation ($) for Owner ${i}:`;
            compLabel.setAttribute('for', `business${businessIndex}OwnerComp${i}`);
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

        // ----- Ownership % -----
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

        // For non-Schedule-C owners (and for non-single-owner situations) add a red border until a value is entered.
        if (businessTypeVal !== 'Schedule-C' && numOwners !== 1) {
            // Initially, if empty, mark the field red.
            if (percentInput.value.trim() === '') {
                percentInput.style.border = '2px solid red';
            }
            // Remove the red border as soon as the user types in a value.
            percentInput.addEventListener('input', function() {
                if (this.value.trim() === '') {
                    this.style.border = '2px solid red';
                } else {
                    this.style.border = '';
                }
            });
        }

        // Single‐owner => lock at 100% read‐only
        if (numOwners === 1) {
            percentInput.value = '100.0000';
            percentInput.readOnly = true;
            percentInput.style.backgroundColor = '#f0f0f0';

        // Two‐owner => attach an input listener that calls handleTwoOwnersInput
        } else if (numOwners === 2) {
            percentInput.value = '';
            percentInput.min = '0.0001';
            let typingTimer;
            percentInput.addEventListener('input', () => {
              clearTimeout(typingTimer);
              typingTimer = setTimeout(() => {
                // After the user stops typing for ~1000ms:
                handleTwoOwnersInput(businessIndex, i);
                updateOwnerApportionment(businessIndex);
              }, 1000);
            });

        // Three‐owner => the first two are free‐entry, the third is read‐only
        } else if (numOwners === 3) {
            // For the first two owners:
            if (i < 3) {
                percentInput.value = '';
                percentInput.min = '0.0001';
                let typingTimer;
                percentInput.addEventListener('input', () => {
                  clearTimeout(typingTimer);
                  typingTimer = setTimeout(() => {
                    // After the user stops typing for ~1000ms:
                    autoCalculateLastOwner(businessIndex, 3);
                    updateOwnerApportionment(businessIndex);
                  }, 1000);
                });

                // For the third owner, we keep it read‐only (auto‐calculated remainder)
            } else {
                percentInput.value = ''; // autoCalculateLastOwner sets real value
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }
        }

        // ----- Apportionment container (for Income or Loss) -----
        const apportionmentContainer = document.createElement('div');
        apportionmentContainer.id = `business${businessIndex}OwnerPercent${i}-apportionmentContainer`;
        ownerSection.appendChild(apportionmentContainer);

        dynamicOwnerFieldsDiv.appendChild(ownerSection);
    }

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
        // Clear disclaimers if total is 100
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
    // 1) If the user has not blurred both the Income AND the Expenses fields yet,
    //    we skip disclaimers entirely. But still set the "Net" field value.
    if (!blurredIncome[index] || !blurredExpenses[index]) {
        // Update the Net field even if disclaimers are skipped:
        const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`)?.value || '0');
        const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`)?.value || '0');
        const netVal = incomeVal - expensesVal;
        const netField = document.getElementById(`business${index}Net`);
        if (netField) {
            netField.value = formatCurrency(String(netVal));
            netField.style.color = netVal < 0 ? 'red' : 'black';
        }
        return;  // Stop here; no disclaimers yet
    }

    // 2) Clear disclaimers for this business
    removeDisclaimer(`businessEntry${index}`, 'DEPENDENT_WAGE');
    removeDisclaimer(`dynamicOwnerFields${index}`, 'SCORP_COMP');

    // 3) Grab the Income/Expenses
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`)?.value || '0');
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`)?.value || '0');

    // 4) Compute Net, update the Net field
    const netVal = incomeVal - expensesVal;
    const netField = document.getElementById(`business${index}Net`);
    if (netField) {
        netField.value = formatCurrency(String(netVal));
        netField.style.color = netVal < 0 ? 'red' : 'black';
    }

    // 5) Sum Dependent wages for this business
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

    // 6) For S-Corp, sum up Reasonable Compensation
    const businessTypeVal = document.getElementById(`business${index}Type`)?.value || '';
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

    // 7) If truly nothing is entered, skip disclaimers
    const anythingEntered = (incomeVal !== 0 || expensesVal !== 0 || totalReasonableComp !== 0);
    if (!anythingEntered) {
        return;
    }

    // 8) Check disclaimers for S-Corp vs. non-S-corp
    const sumDependentWagesPlusComp = totalDependentWages + totalReasonableComp;
    const wagesPlusCompString = [
        dependentStrings.length ? dependentStrings.join(" + ") : null,
        (businessTypeVal === 'S-Corp' && totalReasonableComp > 0)
            ? `Reasonable Compensation (${formatCurrency(String(totalReasonableComp))})`
            : null
    ].filter(Boolean).join(" + ");

    if (businessTypeVal === 'S-Corp') {
        if (sumDependentWagesPlusComp > expensesVal && wagesPlusCompString) {
            // Show the "bigger" combined disclaimer
            addDisclaimer(
                `businessEntry${index}`,
                'DEPENDENT_WAGE',
                `WARNING: ${wagesPlusCompString} exceed total Expenses (${formatCurrency(String(expensesVal))}).`
            );
        } else {
            // Otherwise check simpler S-Corp Reasonable Compensation
            checkSCorpReasonableComp(index);
        }
    } else {
        // Non-S-corp scenario
        if (totalDependentWages > expensesVal && dependentStrings.length > 0) {
            addDisclaimer(
                `businessEntry${index}`,
                'DEPENDENT_WAGE',
                `WARNING: ${dependentStrings.join(" + ")} exceed total Expenses (${formatCurrency(String(expensesVal))}).`
            );
        }
    }

    // 9) Update owner apportionment after net changes
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

    // We'll rely on getCurrentPortions() to figure out final amounts,
    // but it now merges overrides with the percent-based calculation.
    const portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // Render each owner's final portion
    for (let i = 1; i <= numOwners; i++) {
        showApportionment(businessIndex, i, portions[i - 1]);
    }

    // Check disclaimers again
    checkSCorpReasonableComp(businessIndex);
    recalculateTotals();
}
  
function showApportionment(businessIndex, ownerIndex, portion) {
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
    
    // If portion is null (i.e. no percentage entered yet), do not display any apportionment.
    if (portion === null) return;
    
    // Display the apportionment amount.
    const prefixSpan = document.createElement("span");
    prefixSpan.textContent = `Apportionment of Owner ${ownerIndex} is `;
    prefixSpan.classList.add("apportionment-text");
    apportionmentEl.appendChild(prefixSpan);
    
    const amountSpan = document.createElement("span");
    const absolutePortion = Math.abs(portion);
    if (portion < 0) {
      amountSpan.textContent = `${formatCurrency(String(absolutePortion))} (Loss)`;
      amountSpan.style.color = "red";
    } else {
      amountSpan.textContent = `${formatCurrency(String(absolutePortion))} (Income)`;
      amountSpan.style.color = "green";
    }
    apportionmentEl.appendChild(amountSpan);
    
    // Only add up/down arrow buttons if there is more than one owner.
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
    if (numOwners < 2) return; // If only 1 owner, no need to adjust

    // 1) Get the current portion array
    let portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // 2) Increase the chosen owner by $1
    portions[ownerIndex - 1] += 1;

    // 3) For a 2-owner situation, we simply recalc the other so sum = netVal
    if (numOwners === 2) {
        const otherIdx = (ownerIndex === 1) ? 1 : 0;
        portions[otherIdx] = netVal - portions[ownerIndex - 1];
        // Don’t let other become negative if netVal is positive
        if (netVal > 0 && portions[otherIdx] < 0) {
            portions[ownerIndex - 1] = netVal;
            portions[otherIdx] = 0;
        }
    }
    // For 3 owners, you could do partial distribution if you want:
    else if (numOwners === 3) {
        // Recompute leftover, then distribute among the other owners
        let sumNow = portions.reduce((a, b) => a + b, 0);
        let leftover = netVal - sumNow;
        // Go in a small loop adjusting the other owners if leftover != 0
        let i = 0;
        while (leftover !== 0 && i < 3) {
            if (i !== (ownerIndex - 1)) {
                // Each time, push or pull $1 to/from the other owners
                if (leftover > 0) {
                    portions[i] += 1;
                    leftover -= 1;
                } else {
                    // leftover < 0 => reduce that owner
                    if (portions[i] > 0) {
                        portions[i] -= 1;
                        leftover += 1;
                    }
                }
            }
            i++;
            if (i >= 3 && leftover !== 0) i = 0; // keep distributing if needed
        }
    }

    // 4) Save these overrides, then update
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
    if (numOwners < 2) return; // If only 1 owner, no need to adjust

    // 1) Get the current portion array
    let portions = getCurrentPortions(businessIndex, netVal, numOwners);

    // 2) Decrease the chosen owner by $1 (but not below 0 if netVal is positive)
    if (netVal > 0 && portions[ownerIndex - 1] > 0) {
        portions[ownerIndex - 1] -= 1;
    } else if (netVal <= 0) {
        // If netVal is zero/negative, you can decide to let them go negative or not.
        portions[ownerIndex - 1] -= 1;
    }

    // 3) For 2 owners, recalc the other so sum = netVal
    if (numOwners === 2) {
        const otherIdx = (ownerIndex === 1) ? 1 : 0;
        portions[otherIdx] = netVal - portions[ownerIndex - 1];
        // Don’t let other portion become negative if netVal is positive
        if (netVal > 0 && portions[otherIdx] < 0) {
            portions[ownerIndex - 1] = netVal;
            portions[otherIdx] = 0;
        }
    }
    // For 3 owners, do a small leftover distribution approach
    else if (numOwners === 3) {
        let sumNow = portions.reduce((a, b) => a + b, 0);
        let leftover = netVal - sumNow;
        let i = 0;
        while (leftover !== 0 && i < 3) {
            if (i !== (ownerIndex - 1)) {
                // Each time, push or pull $1 to/from the other owners
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

    // 4) Save these overrides, then update
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        apportionmentOverrides[overrideKey] = portions[i - 1];
    }
    updateOwnerApportionment(businessIndex);
}

function getCurrentPortions(businessIndex, netVal, numOwners) {
    // Step A: get the percent-based "default" portion
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

    // If no percentage is entered at all, your base portions = null
    if (blankCount === numOwners) {
        // Everyone's portion would be 0 by default
        return new Array(numOwners).fill(0).map((_, i) => {
            // But if there's an override for this owner, use it
            const overrideKey = `biz${businessIndex}-owner${i + 1}`;
            return apportionmentOverrides[overrideKey] ?? 0;
        });
    }

    // Step B: fill in blanks with an equal share of leftover
    const remaining = 100 - totalEntered;
    const equalShare = (blankCount > 0) ? remaining / blankCount : 0;
    for (let i = 0; i < numOwners; i++) {
        if (percentages[i] === null) {
            percentages[i] = equalShare;
        }
    }

    // Step C: turn % into portion of netVal, rounding to integer
    let basePortions = percentages.map(pct => Math.round(netVal * (pct / 100)));
    // fix rounding difference
    const allocated = basePortions.reduce((a, b) => a + b, 0);
    const diff = netVal - allocated;
    if (diff !== 0 && basePortions.length) {
        basePortions[0] += diff;
    }

    // Step D: merge with any manual overrides
    // If an overrideKey exists, we treat that as final for that owner
    // BUT we do not exceed netVal total. We'll handle any leftover or negative leftover
    // by adjusting the *first* non-override or the first we find.
    let finalPortions = [...basePortions];
    let totalManual = 0;
    for (let i = 1; i <= numOwners; i++) {
        const overrideKey = `biz${businessIndex}-owner${i}`;
        if (overrideKey in apportionmentOverrides) {
            finalPortions[i - 1] = apportionmentOverrides[overrideKey];
        }
    }
    // Now see if the sum of finalPortions > netVal or < netVal
    let finalSum = finalPortions.reduce((a, b) => a + b, 0);
    let leftover = netVal - finalSum;

    // If leftover != 0, push/pull it onto the first owner who doesn't have an override
    if (leftover !== 0) {
        // find the first index that is not in apportionmentOverrides
        // or if all are overridden, adjust the first one
        let idxToFix = finalPortions.findIndex((amt, idx) => {
            const overrideKey = `biz${businessIndex}-owner${idx + 1}`;
            return !(overrideKey in apportionmentOverrides);
        });
        if (idxToFix === -1) idxToFix = 0; // if all owners are overridden, pick 0
        finalPortions[idxToFix] += leftover;
    }

    return finalPortions;
}

function checkSCorpReasonableComp(businessIndex, depWages = 0) {
    // If "dependent wages + comp" disclaimers already triggered, we skip
    // We'll do that check by verifying disclaimers were not shown for 'DEPENDENT_WAGE'
    if (DISCLAIMER_MAP[`businessEntry${businessIndex}`] && DISCLAIMER_MAP[`businessEntry${businessIndex}`]['DEPENDENT_WAGE']) {
        // Means the bigger disclaimers has been triggered, so skip
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

    // If totalComp alone > expensesVal, disclaim
    // (Only if we didn't disclaim for "dep wages + comp" above)
    if (totalComp > expensesVal) {
        addDisclaimer(
            `dynamicOwnerFields${businessIndex}`,
            'SCORP_COMP',
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
  
      // Grab all inputs, selects, and textareas
      let allElements = Array.from(this.elements).filter(el =>
        el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
      );
  
      // Filter out the ones that are hidden (display:none or offsetParent = null)
      let visibleElements = allElements.filter(el => el.offsetParent !== null);
  
      let index = visibleElements.indexOf(document.activeElement);
  
      if (index > -1 && index < visibleElements.length - 1) {
        visibleElements[index + 1].focus();
      } else if (index === visibleElements.length - 1) {
        // If we're at the very last visible field, loop back around
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
      // Add the red-disclaimer class so CSS controls the color
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
  
    // Determine which highlight color to use based on dark mode
    const highlightColor = document.body.classList.contains('dark-mode')
      ? 'fuchsia'  // A soft blue for dark mode; change as desired
      : 'yellow';  // Default yellow for light mode
  
    let isHighlighted = false;
    if (currentSelection.rangeCount > 0) {
      const range = currentSelection.getRangeAt(0);
      const parent = range.commonAncestorContainer.parentNode;
      // Check if the current highlight matches our chosen color
      if (parent && parent.style && parent.style.backgroundColor === highlightColor) {
        isHighlighted = true;
      }
    }
  
    if (isHighlighted) {
      // Remove highlight
      document.execCommand('hiliteColor', false, 'transparent');
    } else {
      // Apply our chosen highlight color
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

    // 1) Re-apply the “controller” fields to re-generate dynamic sections
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

    // 2) Rebuild dynamic sections
    //    (businessContainer, scheduleEsContainer, dependentsContainer)
    //    ... (Your existing code that calls createBusinessNameFields(), createBusinessFields(), etc.)

    // 3) Now set the values of each field to match the snapshot
    for (let key in dataObj) {
        const fields = document.getElementsByName(key);
        if (fields && fields.length > 0) {
            fields[0].value = dataObj[key];
        }
    }

    // 4) Trigger "change" on owners’ <select> to ensure owners fields re-render
    const numBiz = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    for (let i = 1; i <= numBiz; i++) {
        const ownersSelect = document.getElementById(`numOwnersSelect${i}`);
        if (ownersSelect) {
            ownersSelect.dispatchEvent(new Event('change'));
        }
    }

    // 5) Recompute all net fields, disclaimers, etc.
    for (let i = 1; i <= numBiz; i++) {
        updateBusinessNet(i);
        checkSCorpReasonableComp(i);
    }
    const eCount = parseInt(document.getElementById('numScheduleEs').value || '0', 10);
    for (let i = 1; i <= eCount; i++) {
        updateScheduleENet(i);
    }

    // 6) Force final recalculations
    recalculateTotals();
    recalculateDeductions();
}

document.getElementById('undoButton').addEventListener('click', function() {
    if (undoStack.length > 1) {
        // Pop current off undo, push onto redo
        const current = undoStack.pop();
        redoStack.push(current);
        // The new top is the snapshot we want to revert to
        const previous = undoStack[undoStack.length - 1];
        restoreFormSnapshot(previous);
    }
});

document.getElementById('redoButton').addEventListener('click', function() {
    if (redoStack.length > 0) {
        // Pop from redo, push onto undo
        const snapshot = redoStack.pop();
        undoStack.push(snapshot);
        // Then restore that snapshot
        restoreFormSnapshot(snapshot);
    }
});

(function() {
    // For SELECT changes:
    document.getElementById('taxForm').addEventListener('change', function(e) {
        if (e.target.matches('select')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    });

    // For INPUT/TEXTAREA blurs:
    document.getElementById('taxForm').addEventListener('blur', function(e) {
        if (e.target.matches('input, textarea')) {
            undoStack.push(getFormSnapshot());
            redoStack = [];
        }
    }, true);
})();

// Push the initial empty-state snapshot, so user can “Undo” back to it if needed
document.addEventListener('DOMContentLoaded', function() {
    undoStack.push(getFormSnapshot());
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
            const el = document.getElementById(f);
            if (el) {
                el.value = businessDetailStore[f];

                if (f === `business${index}Type`) {
                    el.dispatchEvent(new Event('change'));
                }
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
    validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);

    // If owners exist, check that their total ownership = 100
    if (numOwnersSelectEl) {
        validateTotalOwnership(index, parseInt(numOwnersSelectEl.value, 10) || 0);
    }
}

//----------------------//
// 23. DARK MODE TOGGLE //
//----------------------//

const darkModeCheckbox = document.getElementById('darkModeToggle');

document.addEventListener('DOMContentLoaded', () => {
  // e.g. if localStorage says "dark" then set checkbox & add class
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
