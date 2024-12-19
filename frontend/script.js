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
      resultsDiv.innerHTML = `
        <h2>Your Tax Results</h2>
        <p><strong>Taxable Income:</strong> $${resultData.taxableIncome.toFixed(2)}</p>
        <p><strong>Total Tax Owed:</strong> $${resultData.totalTax.toFixed(2)}</p>
        <p><strong>Refund or Amount Due:</strong> $${resultData.refundOrDue.toFixed(2)}</p>
      `;
    } catch (error) {
      resultsDiv.innerHTML = '<p>Error processing your data. Try again later.</p>';
    }
  });

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
      spouseSection.style.display = 'block';
      spouseSection.style.maxHeight = spouseSection.scrollHeight + 'px';
      spouseSection.style.transition = 'max-height 1s ease-in-out';
  } else {
      spouseSection.style.maxHeight = '0';
      spouseSection.style.transition = 'max-height 1s ease-in-out';
      setTimeout(() => {
          spouseSection.style.display = 'none';
          spouseSection.style.backgroundColor = ''; // Reset the background color
      }, 500); // Match the duration of the transition
  }
});
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
          const childGroup = document.createElement('div');
          childGroup.classList.add('form-group');

          const childLabel = document.createElement('label');
          childLabel.setAttribute('for', `child${i}Name`);
          childLabel.textContent = `Child ${i} Name:`;
          childGroup.appendChild(childLabel);

          const childInput = document.createElement('input');
          childInput.type = 'text';
          childInput.id = `child${i}Name`;
          childInput.name = `child${i}Name`;
          childInput.required = true; // You can decide if these are required
          childGroup.appendChild(childInput);

          // Add birthdate field
          const birthdateLabel = document.createElement('label');
          birthdateLabel.setAttribute('for', `child${i}Birthdate`);
          birthdateLabel.textContent = `Child ${i} Birthdate:`;
          birthdateLabel.style.marginTop = '12px'; // Add vertical spacing
          childGroup.appendChild(birthdateLabel);

          const birthdateInput = document.createElement('input');
          birthdateInput.type = 'date';
          birthdateInput.id = `child${i}Birthdate`;
          birthdateInput.name = `child${i}Birthdate`;
          birthdateInput.required = true;
          childGroup.appendChild(birthdateInput);

          // Add current age field
          const ageLabel = document.createElement('label');
          ageLabel.setAttribute('for', `child${i}Age`);
          ageLabel.textContent = `Child ${i} Current Age:`;
          ageLabel.style.marginTop = '12px'; // Add vertical spacing
          childGroup.appendChild(ageLabel);

          const ageInput = document.createElement('input');
          ageInput.type = 'number';
          ageInput.id = `child${i}Age`;
          ageInput.name = `child${i}Age`;
          ageInput.required = true;
          childGroup.appendChild(ageInput);

          // Add employment status field
          const employmentLabel = document.createElement('label');
          employmentLabel.setAttribute('for', `child${i}Employed`);
          employmentLabel.textContent = `Is Child ${i} Currently Employed:`;
          employmentLabel.style.marginTop = '12px'; // Add vertical spacing
          childGroup.appendChild(employmentLabel);

          const employmentSelect = document.createElement('select');
          employmentSelect.id = `child${i}Employed`;
          employmentSelect.name = `child${i}Employed`;
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

          childGroup.appendChild(employmentSelect);

          // Add event listener to calculate age based on birthdate
          birthdateInput.addEventListener('change', function() {
              const birthdate = new Date(this.value);
              const today = new Date();
              let age = today.getFullYear() - birthdate.getFullYear();
              const monthDifference = today.getMonth() - birthdate.getMonth();
              if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
                  age--;
              }
              ageInput.value = age;
          });

          // Allow manual input for current age with validation
          ageInput.addEventListener('input', function() {
              const age = parseInt(this.value, 10);
              const errorMessage = document.getElementById(`ageErrorMessage${i}`);
              if (!isNaN(age) && age >= 0 && age < 18) {
                  this.value = age;
                  if (errorMessage) errorMessage.textContent = ''; // Clear error message
              } else {
                  if (!errorMessage) {
                      const error = document.createElement('p');
                      error.id = `ageErrorMessage${i}`;
                      error.style.color = 'red';
                      error.textContent = 'Sorry, age must be between 0 and 17';
                      this.parentNode.appendChild(error);
                  } else {
                      errorMessage.textContent = 'Sorry, age must be between 0 and 17';
                  }
              }
          });

          childrenContainer.appendChild(childGroup);
      }
  }
});

document.getElementById('birthdate').addEventListener('change', function() {
  const birthdate = new Date(this.value);
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDifference = today.getMonth() - birthdate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  document.getElementById('currentAge').value = age;
});

// Allow manual input for current age
document.getElementById('currentAge').addEventListener('input', function() {
  const age = parseInt(this.value, 10);
  if (!isNaN(age) && age >= 0) {
    this.value = age;
  }
});