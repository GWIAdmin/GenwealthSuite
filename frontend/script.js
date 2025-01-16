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
        element.style.backgroundColor = ''; // Reset styling
    }, 500);
}

//--------------------------------//
// 4. DYNAMIC DEPENDENTS CREATION //
//--------------------------------//

document.getElementById('numberOfDependents').addEventListener('input', function() {
    const numDependents = parseInt(this.value, 10);
    const dependentsContainer = document.getElementById('dependentsSection');
    dependentsContainer.innerHTML = ''; // Clear old fields

    if (!isNaN(numDependents) && numDependents > 0) {
        const heading = document.createElement('h1');
        heading.textContent = 'Children / Dependents Details';
        dependentsContainer.appendChild(heading);

        // Create input fields for each dependent
        for (let i = 1; i <= numDependents; i++) {
            createDependentFields(dependentsContainer, i);
        }
    }
});

function createDependentFields(container, index) {
    const dependentGroup = document.createElement('div');
    dependentGroup.classList.add('dependent-entry');

    // Dependent Name
    createLabelAndInput(dependentGroup, `dependent${index}Name`, `Dependent ${index} Name:`, 'text');

    // Dropdown for DOB or Age
    createLabelAndDropdown(dependentGroup, `dependent${index}DOBOrAge`, `Do You Know the Dependent's DOB or Current Age?`, ['Please Select', 'Yes', 'No']);

    // Container for conditional fields related to dependent's DOB or Age
    const conditionalContainer = document.createElement('div');
    conditionalContainer.id = `conditionalContainer${index}`;
    dependentGroup.appendChild(conditionalContainer);

    // Dropdown for Currently Employed
    createLabelAndDropdown(dependentGroup, `dependent${index}Employed`, `Is Dependent ${index} Currently Employed?`, ['Please Select', 'Yes', 'No']);

    // Container for conditionally added fields
    const employmentConditionalContainer = document.createElement('div');
    employmentConditionalContainer.id = `employmentConditionalContainer${index}`;
    dependentGroup.appendChild(employmentConditionalContainer);

    // Append the dependent group to the container first
    container.appendChild(dependentGroup);

    // Add event listener for employment status
    const employedDropdown = document.getElementById(`dependent${index}Employed`);
    if (employedDropdown) {
        employedDropdown.addEventListener('change', function () {
            handleEmploymentStatusChange(index, this.value);
        });
    }
    // Add "Qualifies for Child/Dependent Credit?" field
    createLabelAndDropdown(dependentGroup, `dependent${index}Credit`, 'Qualifies for Child/Dependent Credit?', ['Please Select', 'Yes', 'No']);

    // Event listener for DOB or Age dropdown
    const dobOrAgeDropdown = document.getElementById(`dependent${index}DOBOrAge`);
    if (dobOrAgeDropdown) {
        dobOrAgeDropdown.addEventListener('change', function () {
            handleDOBOrAgeChange(index, this.value);
        });
    }
}

function handleDOBOrAgeChange(index, value) {
    const container = document.getElementById(`conditionalContainer${index}`);
    container.innerHTML = ''; // Clear existing fields

    if (value === 'Yes') {
        // 1. Dependent Birthdate
        createLabelAndInput(container, `dependent${index}Birthdate`, `Dependent ${index} Birthdate:`, 'date');

        // 2. Dependent Current Age
        createLabelAndInput(container, `dependent${index}Age`, `Dependent ${index} Current Age:`, 'number');

        // Age from birthdate
        document.getElementById(`dependent${index}Birthdate`).addEventListener('change', function() {
            calculateAge(this.value, `dependent${index}Age`);
        });
    } else if (value === 'No') {
        // Dropdown for age range
        createLabelAndDropdown(container, `dependent${index}AgeRange`, `What is the Age Category of Child/Dependent ${index}?`, ['Please Select','17 or younger', '18 or older']);
    }
}

function handleEmploymentStatusChange(index, value) {
    // "index" = which dependent number (1,2,3,...)
    // "value" = "Yes" or "No" to "Is Dependent Currently Employed?"
    const container = document.getElementById(`employmentConditionalContainer${index}`);
    container.innerHTML = ''; // Clear any previous conditional fields

    if (value === 'Yes') {
        // 1) Create Income field
        createLabelAndCurrencyField(container, `dependent${index}Income`, `Dependent ${index} Income:`);

        // 2) Create "Is Dependent Employed in a Client's Business?" dropdown
        createLabelAndDropdown(container, `dependent${index}EmployedInBusiness`,
            `Is Dependent ${index} Employed in One of the Client's Businesses?`,
            ['Please Select', 'Yes', 'No']
        );

        // If user selects "Yes" to 'EmployedInBusiness', we do NOT show "WillingToHire"
        // because they're already employed. 
        // If "No", still do not show "WillingToHire" here — that question is only in the else-block below.

        document.getElementById(`dependent${index}EmployedInBusiness`).addEventListener('change', function() {
            if (this.value === 'Yes') {
                // (They’re already employed in a client business, so do nothing else.)
                // But do ask: "Which Business?"
                const numBusinesses = parseInt(document.getElementById('numOfBusinesses').value, 10) || 0;
                const businessNames = [];
                for (let i = 1; i <= numBusinesses; i++) {
                    const bName = document.getElementById(`business${i}Name`)?.value || `Business ${i}`;
                    businessNames.push(bName);
                }
                createLabelAndDropdown(container, `dependent${index}BusinessName`,
                    `Which Business?`,
                    ['Please Select', ...(businessNames.length > 0 ? businessNames : ['No businesses available'])]
                );
            } else if (this.value === 'No') {
                // Not employed in one of the client's businesses
                // Still do NOT show "WillingToHire" here, because user already answered "Yes" overall to 'Currently Employed?'
                // The "WillingToHire" question only appears when "Currently Employed?" is No.
            }
        });

    } else if (value === 'No') {
        // Dependent is NOT currently employed, so we ask: "Is the Client Willing to Hire Dependent?"
        createLabelAndDropdown(container, `dependent${index}WillingToHire`,
            `Is the Client Willing to Hire Dependent ${index}?`,
            ['Please Select', 'Yes', 'No']
        );

        // Attach an event listener to "WillingToHire"
        const willingDropdown = document.getElementById(`dependent${index}WillingToHire`);
        if (willingDropdown) {
            willingDropdown.addEventListener('change', function() {
                // 1) Check if user selected "Yes"
                if (this.value === 'Yes') {
                    // 2) Determine the dependent’s age:
                    let dependentAge = 0;
                    const ageField = document.getElementById(`dependent${index}Age`);
                    if (ageField) {
                        dependentAge = parseInt(ageField.value, 10) || 0;
                    } else {
                        // Possibly user selected an age range
                        const ageRangeField = document.getElementById(`dependent${index}AgeRange`);
                        if (ageRangeField && ageRangeField.value === '18 or older') {
                            dependentAge = 18;
                        }
                    }
                    // 3) If 18 or older, show the red disclaimer
                    if (dependentAge >= 18) {
                        showRedDisclaimer(
                            'Hiring 18 or older will trigger FICA Taxes',
                            `employmentConditionalContainer${index}`
                        );
                    }
                } else {
                    // If user changes from "Yes" to something else, remove any existing disclaimer
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
        // If invalid date, just return
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
    validateAgeInput(this, 'current', false);
});

document.getElementById('spouseBirthdate').addEventListener('change', function() {
    calculateAge(this.value, 'spouseCurrentAge');
});

document.getElementById('spouseCurrentAge').addEventListener('input', function() {
    validateAgeInput(this, 'spouse', false);
});

function validateAgeInput(input, index) {
    const age = parseInt(input.value, 10);
    const errorMessageId = `ageErrorMessage${index}`;
    let errorMessage = document.getElementById(errorMessageId);

    if (!isNaN(age) && age >= 0) {
        // Clear any error messages
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
    document.getElementById('spouseLastName').value = this.value;
});

//------------------------------------//
// 7. DYNAMIC BUSINESS NAME CREATION  //
//------------------------------------//

document.getElementById('numOfBusinesses').addEventListener('input', function() {
    const businessCount = parseInt(this.value, 10);
    const container = document.getElementById('numOfBusinessesContainer');
    container.innerHTML = ''; // Clear existing fields

    if (!isNaN(businessCount) && businessCount > 0) {
        for (let i = 1; i <= businessCount; i++) {
            createBusinessNameFields(container, i);
        }
    }
});

function createBusinessNameFields(container, index) {
    const businessNameDiv = document.createElement('div');
    businessNameDiv.classList.add('business-name-entry');

    createLabelAndInput(businessNameDiv, `business${index}Name`, `Business ${index} Name:`, 'text');

    // Add checkbox container for Medical/Professional Business
    const checkboxContainerMedical = document.createElement('div');
    checkboxContainerMedical.classList.add('checkbox-container');

    // Add label for Medical/Professional Business
    const checkboxLabelMedical = document.createElement('label');
    checkboxLabelMedical.setAttribute('for', `business${index}Medical`);
    checkboxLabelMedical.textContent = 'Is this a Medical/Professional Business?';

    // Add checkbox input for Medical/Professional Business
    const checkboxInputMedical = document.createElement('input');
    checkboxInputMedical.type = 'checkbox';
    checkboxInputMedical.id = `business${index}Medical`;
    checkboxInputMedical.name = `business${index}Medical`;

    // Append elements for Medical/Professional Business
    checkboxContainerMedical.appendChild(checkboxInputMedical);
    checkboxContainerMedical.appendChild(checkboxLabelMedical);
    businessNameDiv.appendChild(checkboxContainerMedical);

    // Add checkbox container for Real Estate Business
    const checkboxContainerRealEstate = document.createElement('div');
    checkboxContainerRealEstate.classList.add('checkbox-container');

    // Add label for Real Estate Business
    const checkboxLabelRealEstate = document.createElement('label');
    checkboxLabelRealEstate.setAttribute('for', `business${index}RealEstate`);
    checkboxLabelRealEstate.textContent = 'Is this a Real Estate Business?';

    // Add checkbox input for Real Estate Business
    const checkboxInputRealEstate = document.createElement('input');
    checkboxInputRealEstate.type = 'checkbox';
    checkboxInputRealEstate.id = `business${index}RealEstate`;
    checkboxInputRealEstate.name = `business${index}RealEstate`;

    // Append elements for Real Estate Business
    checkboxContainerRealEstate.appendChild(checkboxInputRealEstate);
    checkboxContainerRealEstate.appendChild(checkboxLabelRealEstate);
    businessNameDiv.appendChild(checkboxContainerRealEstate);

    container.appendChild(businessNameDiv);
}

//-----------------------------------------------------//
// 8. HELPER FUNCTIONS FOR NUMBER FIELDS AND CURRENCY  //
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

    // Format the value with parentheses for negative numbers
    let formattedValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
        .format(Math.abs(floatValue));
    return floatValue < 0 ? `(${formattedValue})` : formattedValue;
}

function unformatCurrency(value) {
    // Remove parentheses and any other non-numeric characters
    let numericValue = value.replace(/[^\d.-]/g, '');
    return parseFloat(numericValue) || 0;
}

//----------------------------------//
// 8.1 ADD MISSING HELPER FUNCTIONS //
//----------------------------------//

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

    // On blur, format as currency
    input.addEventListener('blur', function() {
        input.value = formatCurrency(input.value);
    });
}

//------------------------------------------------------------//
// 9. DYNAMIC GENERATION OF BUSINESS DETAIL FIELDS + NET CALC //
//------------------------------------------------------------//

document.getElementById('numOfBusinesses').addEventListener('input', function() {
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

    const heading = document.createElement('h3');
    const businessNameInput = document.getElementById(`business${index}Name`);
    heading.textContent = businessNameInput ? businessNameInput.value : `Business ${index}`;
    businessNameInput.addEventListener('input', function() {
        heading.textContent = businessNameInput.value;
    });
    businessDiv.appendChild(heading);

    // Business Type
    const typeLabel = document.createElement('label');
    typeLabel.textContent = `Business ${index} Type:`;
    businessDiv.appendChild(typeLabel);

    const typeSelect = document.createElement('select');
    typeSelect.name = `business${index}Type`;
    typeSelect.id = `business${index}Type`;

    const types = ["Please Select", "S-Corp", "Partnership", "C-Corp", "Schedule-C"];
    types.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });
    businessDiv.appendChild(typeSelect);

    // Owners Container
    const ownersContainer = document.createElement('div');
    ownersContainer.id = `ownersContainer${index}`;
    businessDiv.appendChild(ownersContainer);

    // Ask: "How many owners does this business have?"
    const numOwnersLabel = document.createElement('label');
    numOwnersLabel.textContent = `How many owners does Business ${index} have?`;
    ownersContainer.appendChild(numOwnersLabel);
    numOwnersLabel.style.marginTop = '12px';

    const numOwnersInput = document.createElement('input');
    numOwnersInput.type = 'number';
    numOwnersInput.id = `numOwners${index}`;
    numOwnersInput.name = `numOwners${index}`;
    numOwnersInput.min = '0';
    numOwnersInput.max = '3'; 
    ownersContainer.appendChild(numOwnersInput);

    // Container for the dynamic owner fields
    const dynamicOwnerFieldsDiv = document.createElement('div');
    dynamicOwnerFieldsDiv.id = `dynamicOwnerFields${index}`;
    ownersContainer.appendChild(dynamicOwnerFieldsDiv);
    dynamicOwnerFieldsDiv.style.marginTop = '12px';

    // Listen for changes on business type (so we can do something special for Schedule-C)
    typeSelect.addEventListener('change', function () {
        handleBusinessTypeChange(index, typeSelect.value);
    });

    // Listen for changes on "How many owners?"
    numOwnersInput.addEventListener('input', function () {
        createOwnerFields(index, parseInt(numOwnersInput.value, 10));
    });

    // Income
    createLabelAndCurrencyField(businessDiv, `business${index}Income`, `Income:`);

    // Expenses
    createLabelAndCurrencyField(businessDiv, `business${index}Expenses`, `Expenses:`);

    // Net (Income - Expenses)
    createLabelAndTextField(businessDiv, `business${index}Net`, `Net (Income - Expenses):`);
    container.appendChild(businessDiv);

    // Make the Net field read-only
    const netField = document.getElementById(`business${index}Net`);
    netField.readOnly = true;

    // Listen for Income & Expenses changes
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
}

function handleBusinessTypeChange(businessIndex, businessType) {
    const ownersContainer = document.getElementById(`ownersContainer${businessIndex}`);
    const numOwnersInput = document.getElementById(`numOwners${businessIndex}`);
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${businessIndex}`);

        // 1) Clear existing owner fields
        dynamicOwnerFieldsDiv.innerHTML = '';

        // 2) Find the outer .business-entry so we can attach/detach the Schedule-C question
        const businessDiv = document.querySelectorAll('.business-entry')[businessIndex - 1];

        // 3) First, REMOVE any previously-created Schedule-C elements, if they exist
        const oldLabel = businessDiv.querySelector(`#scheduleCLabel${businessIndex}`);
        if (oldLabel) oldLabel.remove();
        const oldDropdown = businessDiv.querySelector(`#scheduleCOwner${businessIndex}`);
        if (oldDropdown) oldDropdown.remove();

    if (businessType === "Schedule-C") {
        // Hide the "How many owners?" field and assume 1 owner
        ownersContainer.style.display = 'none';
        numOwnersInput.value = 1;

        // Create dropdown for "Which client is the Schedule C under?"
        const scheduleCDropdownLabel = document.createElement('label');
        scheduleCDropdownLabel.id = `scheduleCLabel${businessIndex}`;
        scheduleCDropdownLabel.textContent = 'Which client owns this Schedule C?';
        scheduleCDropdownLabel.style.marginTop = '12px';

        const scheduleCDropdown = document.createElement('select');
        scheduleCDropdown.id = `scheduleCOwner${businessIndex}`;
        scheduleCDropdown.name = `scheduleCOwner${businessIndex}`;

        ['Please Select', 'Client 1', 'Client 2'].forEach(clientOpt => {
            const opt = document.createElement('option');
            opt.value = clientOpt;
            opt.textContent = clientOpt;
            scheduleCDropdown.appendChild(opt);
        });

        // Append them to the "businessDiv"
        businessDiv.appendChild(scheduleCDropdownLabel);
        businessDiv.appendChild(scheduleCDropdown);

        // You could optionally create one owner field with 100% set automatically
    } else if (businessType === "Please Select") {
        // If not selected, hide or reset
        ownersContainer.style.display = 'none';
        numOwnersInput.value = '';
    } else {
        // Display multi-owner fields for S-Corp, Partnership, or C-Corp
        ownersContainer.style.display = 'block';
    }
}

function roundToHalf(value) {
    return Math.round(value * 2) / 2;
}

function createOwnerFields(businessIndex, numOwners) {
    const dynamicOwnerFieldsDiv = document.getElementById(`dynamicOwnerFields${businessIndex}`);
    dynamicOwnerFieldsDiv.innerHTML = ''; // Clear old fields

    if (isNaN(numOwners) || numOwners < 1) return; // No owners or invalid input
    if (numOwners > 3) numOwners = 3; // Limit to a maximum of 3 owners

    for (let i = 1; i <= numOwners; i++) {
        const ownerSection = document.createElement('section');
        ownerSection.classList.add('owner-entry');

        // Owner Name Field
        const nameLabel = document.createElement('label');
        nameLabel.textContent = `Owner ${i} (Select Who?):`;
        ownerSection.appendChild(nameLabel);

        const nameSelect = document.createElement('select');
        nameSelect.id = `business${businessIndex}OwnerName${i}`;
        nameSelect.name = `business${businessIndex}OwnerName${i}`;
        ['Please Select', 'Client 1', 'Client 2', 'Other'].forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            nameSelect.appendChild(opt);
        });
        ownerSection.appendChild(nameSelect);

        // Ownership Percentage Field
        const percentLabel = document.createElement('label');
        percentLabel.textContent = `Owner ${i} Ownership %:`;
        ownerSection.appendChild(percentLabel);

        const percentInput = document.createElement('input');
        percentInput.type = 'number';
        percentInput.step = '0.01';
        percentInput.min = '0';
        percentInput.id = `business${businessIndex}OwnerPercent${i}`;
        percentInput.name = `business${businessIndex}OwnerPercent${i}`;

        // Handle each scenario:
        if (numOwners === 1) {
            // 1 Owner => 100% read-only
            percentInput.value = '100';
            percentInput.readOnly = true;
            percentInput.style.backgroundColor = '#f0f0f0';

        } else if (numOwners === 2) {
            percentInput.addEventListener('blur', () => handleTwoOwnersInput(businessIndex));
            }

        else if (numOwners === 3) {
            // Three owners => first two are free (rounded), third is remainder
            if (i < 3) {
                percentInput.addEventListener('blur', () => autoCalculateLastOwner(businessIndex, numOwners));
            } else {
                // Third is read-only
                percentInput.readOnly = true;
                percentInput.style.backgroundColor = '#f0f0f0';
            }
        }

        ownerSection.appendChild(percentInput);
        dynamicOwnerFieldsDiv.appendChild(ownerSection);
    }

    // Validate once initially
    validateTotalOwnership(businessIndex, numOwners);
    // If 3 owners, auto-calculate Owner 3 once initially
    if (numOwners === 3) {
        autoCalculateLastOwner(businessIndex, numOwners);
    }
}

function handleTwoOwnersInput(businessIndex) {
    const owner1Input = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const owner2Input = document.getElementById(`business${businessIndex}OwnerPercent2`);
    if (!owner1Input || !owner2Input) return;

    const activeElement = document.activeElement;
    let val1 = parseFloat(owner1Input.value) || 0;
    let val2 = parseFloat(owner2Input.value) || 0;

    if (activeElement === owner1Input) {
        val1 = roundToHalf(val1);
        val1 = Math.min(Math.max(val1, 0), 100);
        owner1Input.value = val1.toFixed(2);

        val2 = roundToHalf(100 - val1);
        val2 = Math.min(Math.max(val2, 0), 100);
        owner2Input.value = val2.toFixed(2);
    } else if (activeElement === owner2Input) {
        val2 = roundToHalf(val2);
        val2 = Math.min(Math.max(val2, 0), 100);
        owner2Input.value = val2.toFixed(2);

        val1 = roundToHalf(100 - val2);
        val1 = Math.min(Math.max(val1, 0), 100);
        owner1Input.value = val1.toFixed(2);
    }

    validateTotalOwnership(businessIndex, 2);
}

function autoCalculateLastOwner(businessIndex, numOwners) {
    if (numOwners !== 3) return;

    const owner1Input = document.getElementById(`business${businessIndex}OwnerPercent1`);
    const owner2Input = document.getElementById(`business${businessIndex}OwnerPercent2`);
    const owner3Input = document.getElementById(`business${businessIndex}OwnerPercent3`);
    if (!owner1Input || !owner2Input || !owner3Input) return;

    let val1 = parseFloat(owner1Input.value) || 0;
    let val2 = parseFloat(owner2Input.value) || 0;

    val1 = roundToHalf(val1);
    val1 = Math.min(Math.max(val1, 0), 100);
    owner1Input.value = val1.toFixed(2);

    val2 = roundToHalf(val2);
    val2 = Math.min(Math.max(val2, 0), 100);
    owner2Input.value = val2.toFixed(2);

    let remaining = 100 - (val1 + val2);
    remaining = roundToHalf(remaining);
    remaining = Math.min(Math.max(remaining, 0), 100);
    owner3Input.value = remaining.toFixed(2);

    validateTotalOwnership(businessIndex, 3);
}

function validateTotalOwnership(businessIndex, numOwners) {
    let totalOwnership = 0;
    let anyValueEntered = false;

    for (let i = 1; i <= numOwners; i++) {
        const valStr = document.getElementById(`business${businessIndex}OwnerPercent${i}`)?.value || '';
        const val = parseFloat(valStr);
        if (!isNaN(val) && val !== 0) {
            anyValueEntered = true;
        }
        totalOwnership += (isNaN(val) ? 0 : val);
    }

    const containerId = `dynamicOwnerFields${businessIndex}`;

    // 1) If user hasn't typed any ownership at all, remove disclaimers and exit.
    if (!anyValueEntered) {
        const existingDisclaimer = document.getElementById(`disclaimer-${containerId}`);
        if (existingDisclaimer) {
            existingDisclaimer.remove();
        }
        return;
    }

    // 2) Otherwise, if total is not close to 100, show the disclaimer.
    if (Math.abs(totalOwnership - 100) > 0.01) {
        showRedDisclaimer(
            `Total ownership must equal 100%. Currently, it is ${totalOwnership.toFixed(2)}%.`, 
            containerId
        );
    } else {
        // 3) If total == ~100, remove disclaimers if any
        const existingDisclaimer = document.getElementById(`disclaimer-${containerId}`);
        if (existingDisclaimer) {
            existingDisclaimer.remove();
        }
    }
}

function updateBusinessNet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`business${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`business${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;
    document.getElementById(`business${index}Net`).value = formatCurrency(netVal.toString());
}

//--------------------------------------------------//
// 10. DYNAMIC GENERATION OF SCHEDULE E FIELDS + NET //
//--------------------------------------------------//

document.getElementById('numScheduleEs').addEventListener('input', function() {
    const eCount = parseInt(this.value, 10);
    const container = document.getElementById('scheduleEsContainer');
    container.innerHTML = ''; // Clear existing fields

    if (!isNaN(eCount) && eCount > 0) {
        for (let i = 1; i <= eCount; i++) {
            createScheduleEFields(container, i);
        }
    }
});

function createScheduleEFields(container, index) {
    const scheduleEDiv = document.createElement('div');
    scheduleEDiv.classList.add('schedule-e-entry');

    // Add a heading for visual clarity
    const heading = document.createElement('h3');
    heading.textContent = `Schedule-E ${index}`;
    scheduleEDiv.appendChild(heading);

    // Schedule E Income
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Income`, `Schedule E-${index} Income:`);

    // Schedule E Expenses
    createLabelAndCurrencyField(scheduleEDiv, `scheduleE${index}Expenses`, `Schedule E-${index} Expenses:`);

    // Net (Income - Expenses)
    createLabelAndTextField(scheduleEDiv, `scheduleE${index}Net`, `Schedule E-${index} Net (Income - Expenses):`);
    container.appendChild(scheduleEDiv);

    // The newly created Net field should be read-only:
    const netField = document.getElementById(`scheduleE${index}Net`);
    netField.readOnly = true;

    // Income + Expenses listeners
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

// Calculate net for each Schedule E
function updateScheduleENet(index) {
    const incomeVal = unformatCurrency(document.getElementById(`scheduleE${index}Income`).value);
    const expensesVal = unformatCurrency(document.getElementById(`scheduleE${index}Expenses`).value);
    const netVal = incomeVal - expensesVal;
    document.getElementById(`scheduleE${index}Net`).value = formatCurrency(netVal.toString());
}

//---------------------------------------------------//
// 11. REAL-TIME CALCULATIONS FOR INCOME/ADJUSTMENTS //
//---------------------------------------------------//

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
    const otherIncome = getFieldValue('otherIncome');
    const interestPrivateBonds = getFieldValue('interestPrivateBonds');
    const passiveActivityLossAdjustments = getFieldValue('passiveActivityLossAdjustments');
    const qualifiedBusinessDeduction = getFieldValue('qualifiedBusinessDeduction');

    // Combines net from dynamic businesses
    let businessesNetTotal = 0;
    const numBusinessesVal = parseInt(document.getElementById('numOfBusinesses').value || '0', 10);
    for (let i = 1; i <= numBusinessesVal; i++) {
        const netValStr = document.getElementById(`business${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        businessesNetTotal += netVal;
    }

    // Combines net from dynamic Schedule E
    let scheduleEsNetTotal = 0;
    const numScheduleEsVal = parseInt(document.getElementById('numScheduleEs')?.value || '0', 10);
    for (let i = 1; i <= numScheduleEsVal; i++) {
        const netValStr = document.getElementById(`scheduleE${i}Net`)?.value || '0';
        const netVal = unformatCurrency(netValStr);
        scheduleEsNetTotal += netVal;
    }

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
        businessesNetTotal +
        scheduleEsNetTotal +
        otherIncome +
        interestPrivateBonds +
        passiveActivityLossAdjustments +
        qualifiedBusinessDeduction;

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
// 13. ATTACHING EVENT LISTENERS FOR REAL-TIME CALCULATIONS  //
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
// 14. TURNS INPUT FIELD BORDER COLOR GREEN TO CONFIRM INPUT //
//-----------------------------------------------------------//

document.addEventListener('blur', function(event) {
    if (event.target.matches('input, select')) {
        // Check if the input or select has a value
        if (event.target.value.trim() !== '') {
            event.target.classList.add('input-completed');
        } else {
            event.target.classList.remove('input-completed'); // Remove if no value
        }
    }
}, true);
  
//------------------------------------------//
// 15. INITIALIZE CALCULATIONS ON PAGE LOAD //
//------------------------------------------//

document.addEventListener('DOMContentLoaded', function() {
    // Trigger initial calculations if default values exist:
    recalculateTotals();
    recalculateDeductions();
});

//--------------------------------------//
// 16. AUTO-COPY STATE TO "SELECTSTATE" //
//--------------------------------------//

document.getElementById('state').addEventListener('input', function() {
    document.getElementById('selectState').value = this.value;
});

//-----------------------------//
// 17. HANDLE "ENTER" AS "TAB" //
//-----------------------------//

document.getElementById('taxForm').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevent form submission on Enter key

        // Collect all focusable elements (inputs and selects)
        const focusable = Array.from(this.elements).filter(
            el => el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
        );

        // Find the index of the currently focused element
        const index = focusable.indexOf(document.activeElement);

        if (index > -1 && index < focusable.length - 1) {
            // Move to the next element
            focusable[index + 1].focus();
        } else if (index === focusable.length - 1) {
            // Loop back to the first element if on the last input
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

//-------------------------//
// 19. SHOW RED DISCLAIMER //
//-------------------------//

function showRedDisclaimer(message, containerId) {
    // Reference the container
    const container = document.getElementById(containerId);
    if (!container) return; // Exit if container doesn't exist

    // Check for an existing disclaimer
    let disclaimer = document.getElementById(`disclaimer-${containerId}`);
    if (!disclaimer) {
        // Create a new disclaimer if it doesn't exist
        disclaimer = document.createElement('div');
        disclaimer.id = `disclaimer-${containerId}`;
        disclaimer.style.color = 'red';
        disclaimer.style.fontWeight = 'bold';
        disclaimer.style.marginTop = '12px';
        container.appendChild(disclaimer);
    }

    // Update the disclaimer message
    disclaimer.textContent = message;

}

// --- NOTES FEATURE ---
const notesButton = document.getElementById('notesButton');
const notesContainer = document.getElementById('notesContainer');

// Show/hide notepad on button click
notesButton.addEventListener('click', (e) => {
  e.stopPropagation(); // Prevent the click from bubbling to document
  notesContainer.classList.toggle('hidden');
});

// Hide notepad if user clicks outside
document.addEventListener('click', function(event) {
  // If the user clicks outside the notes container and outside the button, close the notes
  if (!notesContainer.contains(event.target) && event.target !== notesButton) {
    if (!notesContainer.classList.contains('hidden')) {
      notesContainer.classList.add('hidden');
    }
  }
});