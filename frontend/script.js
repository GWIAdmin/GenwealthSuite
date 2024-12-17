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