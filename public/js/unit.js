// Unit detail page JavaScript
class UnitDetailPage {
    constructor() {
        this.unitId = this.getUnitIdFromUrl();
        this.unit = null;
        this.init();
    }

    getUnitIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async init() {
        if (!this.unitId) {
            this.showError('No unit ID provided');
            return;
        }

        await this.loadUnit();
        if (this.unit) {
            this.populateUnitDetails();
            this.setupConversionCalculator();
        }
    }

    async loadUnit() {
        const loading = document.getElementById('loading');
        const unitDetails = document.getElementById('unitDetails');
        const error = document.getElementById('error');

        try {
            loading.style.display = 'block';
            unitDetails.style.display = 'none';
            error.style.display = 'none';

            const response = await fetch(`/api/units/${this.unitId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    this.showError('Unit not found');
                    return;
                }
                throw new Error(`Failed to load unit: ${response.status}`);
            }

            this.unit = await response.json();
            loading.style.display = 'none';
            unitDetails.style.display = 'block';

        } catch (error) {
            console.error('Error loading unit:', error);
            loading.style.display = 'none';
            this.showError('Failed to load unit details');
        }
    }

    populateUnitDetails() {
        if (!this.unit) return;

        // Update page title
        document.title = `${this.unit.name} - The Unit Decoder`;

        // Populate unit details
        document.getElementById('unitName').textContent = this.unit.name;
        document.getElementById('unitCategory').textContent = this.unit.category;
        document.getElementById('unitRegion').textContent = this.unit.region || 'Unknown';
        document.getElementById('unitEra').textContent = this.unit.era || 'Unknown';
        document.getElementById('unitConversion').textContent = `1 ${this.unit.name} = ${this.unit.conversion_factor} ${this.unit.base_unit}`;
        document.getElementById('unitDescription').textContent = this.unit.description || 'No description available';
        
        // Handle aliases
        const aliases = this.unit.aliases || [];
        const aliasesText = aliases.length > 0 ? aliases.join(', ') : 'None';
        document.getElementById('unitAliases').textContent = aliasesText;

        // Handle source URL
        const sourceLink = document.getElementById('unitSource');
        if (this.unit.source_url) {
            sourceLink.href = this.unit.source_url;
            sourceLink.textContent = 'View source';
        } else {
            sourceLink.style.display = 'none';
        }
    }

    async setupConversionCalculator() {
        const targetUnitSelect = document.getElementById('targetUnit');
        const convertBtn = document.getElementById('convertBtn');
        const convertValue = document.getElementById('convertValue');
        const resultDiv = document.getElementById('conversionResult');

        // Load other units in the same category
        try {
            const response = await fetch(`/api/units/category/${this.unit.category}`);
            if (response.ok) {
                const units = await response.json();
                const otherUnits = units.filter(unit => unit.id !== parseInt(this.unitId));
                
                targetUnitSelect.innerHTML = '<option value="">Select target unit...</option>' +
                    otherUnits.map(unit => `<option value="${unit.id}">${unit.name}</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading units for conversion:', error);
        }

        // Setup conversion
        convertBtn.addEventListener('click', async () => {
            await this.performConversion();
        });

        // Allow Enter key to trigger conversion
        convertValue.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performConversion();
            }
        });
    }

    async performConversion() {
        const convertValue = document.getElementById('convertValue');
        const targetUnitSelect = document.getElementById('targetUnit');
        const resultDiv = document.getElementById('conversionResult');

        const value = parseFloat(convertValue.value);
        const targetUnitId = targetUnitSelect.value;

        if (!value || !targetUnitId) {
            resultDiv.innerHTML = '<p style="color: #dc3545;">Please enter a value and select a target unit</p>';
            resultDiv.classList.add('show');
            return;
        }

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromUnitId: this.unitId,
                    toUnitId: targetUnitId,
                    value: value
                })
            });

            if (!response.ok) {
                throw new Error(`Conversion failed: ${response.status}`);
            }

            const result = await response.json();
            this.displayConversionResult(result);

        } catch (error) {
            console.error('Conversion error:', error);
            resultDiv.innerHTML = '<p style="color: #dc3545;">Conversion failed. Please try again.</p>';
            resultDiv.classList.add('show');
        }
    }

    displayConversionResult(result) {
        const resultDiv = document.getElementById('conversionResult');
        
        resultDiv.innerHTML = `
            <h4>Conversion Result</h4>
            <p><strong>${result.inputValue} ${result.fromUnit.name}</strong> = <strong>${result.result} ${result.toUnit.name}</strong></p>
            <p><small>Formula: ${result.formula}</small></p>
        `;
        resultDiv.classList.add('show');
    }

    showError(message) {
        const loading = document.getElementById('loading');
        const unitDetails = document.getElementById('unitDetails');
        const error = document.getElementById('error');

        loading.style.display = 'none';
        unitDetails.style.display = 'none';
        error.style.display = 'block';
        error.querySelector('p').textContent = message;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnitDetailPage();
});
