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

// Dynamic display of spouse section based on Filing Status
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


document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('input', function () {
        // Get the current cursor position
        const cursorPosition = this.selectionStart;

        // Remove commas and format the number
        let num = this.value.replace(/,/g, ''); // Remove existing commas
        if (!isNaN(num) && num !== '') {
            const num2 = num.split(/(?=(?:\d{3})+$)/).join(","); // Add commas
            this.value = num2; // Update the field with formatted number

            // Restore the cursor position
            const diff = num2.length - num.length;
            this.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
    });

    // Ensure correct formatting when the input loses focus (optional, add decimals)
    input.addEventListener('blur', function () {
        let num = this.value.replace(/,/g, ''); // Remove commas
        if (!isNaN(num) && num !== '') {
            this.value = num.split(/(?=(?:\d{3})+$)/).join(","); // Add commas
        }
    });
});
