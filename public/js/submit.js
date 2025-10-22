// Submit form JavaScript
class SubmitForm {
    constructor() {
        this.form = document.getElementById('submitForm');
        this.categorySelect = document.getElementById('category');
        this.baseUnitSelect = document.getElementById('baseUnit');
        this.init();
    }

    init() {
        if (!this.form) return;

        this.setupCategoryChange();
        this.setupFormSubmission();
    }

    setupCategoryChange() {
        if (!this.categorySelect || !this.baseUnitSelect) return;

        this.categorySelect.addEventListener('change', (e) => {
            this.updateBaseUnitOptions(e.target.value);
        });
    }

    updateBaseUnitOptions(category) {
        const baseUnits = {
            'Length': ['Meter', 'Foot', 'Inch'],
            'Mass': ['Gram', 'Kilogram', 'Pound'],
            'Volume': ['Liter', 'Gallon', 'Cubic Meter'],
            'Area': ['Square Meter', 'Acre', 'Hectare'],
            'Time': ['Second', 'Minute', 'Hour'],
            'Temperature': ['Celsius', 'Fahrenheit', 'Kelvin'],
            'Speed': ['Meter per Second', 'Kilometer per Hour'],
            'Counting': ['Unit', 'Piece'],
            'Currency (Historical)': ['Unit'],
            'Other': ['Unit']
        };

        const units = baseUnits[category] || ['Unit'];
        
        this.baseUnitSelect.innerHTML = '<option value="">Select base unit...</option>' +
            units.map(unit => `<option value="${unit}">${unit}</option>`).join('');
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitForm();
        });
    }

    async submitForm() {
        const submitBtn = document.getElementById('submitBtn');
        const successMessage = document.getElementById('successMessage');
        const errorMessage = document.getElementById('errorMessage');

        // Hide previous messages
        successMessage.style.display = 'none';
        errorMessage.style.display = 'none';

        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());

            // Parse aliases if provided
            if (data.name && data.name.includes(',')) {
                data.aliases = data.name.split(',').map(alias => alias.trim()).filter(alias => alias);
                data.name = data.aliases[0]; // First alias is the primary name
            }

            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Submission failed');
            }

            // Show success message
            this.form.style.display = 'none';
            successMessage.style.display = 'block';

            // Redirect to homepage after 3 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);

        } catch (error) {
            console.error('Submission error:', error);
            
            // Show error message
            document.getElementById('errorText').textContent = error.message;
            errorMessage.style.display = 'block';

        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Unit';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SubmitForm();
});
