// Single Page App for Unit Decoder
// Modern product-listing style implementation

class UnitDecoderApp {
    constructor() {
        this.pages = {
            home: document.getElementById('home-page'),
            unit: document.getElementById('unit-page'),
            submit: document.getElementById('submit-page'),
            pending: document.getElementById('pending-page')
        };

        this.cache = new Map();
        this.debounceTimer = null;
        this.debounceDelay = 300;
        this.currentSearchQuery = '';
        this.activeSearchController = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.route();
        this.loadTotalUnits();
    }

    setupEventListeners() {
        // Hash change for routing
        window.addEventListener('hashchange', () => this.route());

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Input validation - only allow letters
            searchInput.addEventListener('keypress', (e) => {
                const char = e.key;
                // Allow letters (a-z, A-Z) and some special keys
                if (!/^[a-zA-Z\s]$/.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                    e.preventDefault();
                    // Add visual feedback for invalid input
                    searchInput.style.borderColor = '#EF4444';
                    setTimeout(() => {
                        searchInput.style.borderColor = '';
                    }, 200);
                }
            });
            
            // Additional input validation to catch all input methods
            searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                // Remove any non-letter characters
                const filtered = value.replace(/[^a-zA-Z\s]/g, '');
                if (value !== filtered) {
                    e.target.value = filtered;
                    // Add visual feedback for invalid input
                    searchInput.style.borderColor = '#EF4444';
                    setTimeout(() => {
                        searchInput.style.borderColor = '';
                    }, 200);
                }
                // Call the original search handler
                this.handleSearch(e);
            });
            // Handle paste events to filter content
            searchInput.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const filtered = paste.replace(/[^a-zA-Z\s]/g, '');
                if (filtered) {
                    searchInput.value = filtered;
                    this.handleSearch({ target: searchInput });
                }
            });
            // Close results on Escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    const resultsEl = document.getElementById('searchResults');
                    if (resultsEl) resultsEl.innerHTML = '';
                    e.target.blur();
                }
            });
        }

        // Navigation buttons
        document.querySelectorAll('[data-page]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                window.location.hash = `#/${page}`;
            });
        });


        // Close search results on outside click with small delay
        document.addEventListener('click', (e) => {
            const wrapper = document.querySelector('.search-wrapper');
            const resultsEl = document.getElementById('searchResults');
            if (wrapper && resultsEl && !wrapper.contains(e.target)) {
                // Small delay to allow clicking on results
                setTimeout(() => {
                    if (resultsEl && !wrapper.contains(document.activeElement)) {
                        resultsEl.innerHTML = '';
                    }
                }, 150);
            }
        });

        // Keep dropdown aligned on viewport changes
        window.addEventListener('resize', () => this.positionDropdown());
        window.addEventListener('scroll', () => this.positionDropdown(), { passive: true });
        
        // Conversion functionality
        this.setupConversion();

        // Submit form
        const submitForm = document.getElementById('submitForm');
        if (submitForm) {
            submitForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    route() {
        const hash = window.location.hash || '#/';
        const path = hash.substring(2);

        // Hide all pages
        Object.values(this.pages).forEach((page) => {
            if (page) page.classList.remove('active');
        });

        if (path === '' || path === '/') {
            this.showPage('home');
        } else if (path.startsWith('unit/')) {
            const id = path.split('/')[1];
            this.showPage('unit');
            this.loadUnitDetails(id);
        } else if (path === 'submit') {
            this.showPage('submit');
        } else if (path === 'pending') {
            this.showPage('pending');
            this.loadPendingSubmissions();
        } else {
            this.showPage('home');
        }

        // Scroll to top
        window.scrollTo(0, 0);
    }

    showPage(pageName) {
        if (this.pages[pageName]) {
            this.pages[pageName].classList.add('active');
        }
    }

    // Search functionality
    handleSearch(e) {
        const query = e.target.value.trim();
        const resultsEl = document.getElementById('searchResults');

        if (!query) {
            // Clear any pending/in-flight searches
            clearTimeout(this.debounceTimer);
            this.currentSearchQuery = '';
            if (this.activeSearchController) {
                try { this.activeSearchController.abort(); } catch (_) {}
            }
            resultsEl.innerHTML = '';
            return;
        }

        clearTimeout(this.debounceTimer);
        this.currentSearchQuery = query.toLowerCase();
        this.debounceTimer = setTimeout(() => {
            this.performSearch(this.currentSearchQuery);
        }, this.debounceDelay);
    }

    async performSearch(query) {
        const resultsEl = document.getElementById('searchResults');
        if (!resultsEl) return;

        const cacheKey = `search:${query.toLowerCase()}`;
        if (this.cache.has(cacheKey)) {
            // Render only if still current
            if (query === this.currentSearchQuery) {
                this.renderSearchResults(this.cache.get(cacheKey));
                this.positionDropdown();
            }
            return;
        }

        resultsEl.innerHTML = '<div class="loading small"><div class="spinner"></div> Searching...</div>';

        try {
            // Abort previous request if any
            if (this.activeSearchController) {
                try { this.activeSearchController.abort(); } catch (_) {}
            }
            this.activeSearchController = new AbortController();
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: this.activeSearchController.signal });
            const data = await response.json();
            
            // De-duplicate by id or name+category
            const seen = new Set();
            const unique = [];
            for (const unit of Array.isArray(data) ? data : []) {
                const key = unit.id ?? `${unit.name}|${unit.category}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(unit);
                }
            }

            this.cache.set(cacheKey, unique);
            if (query === this.currentSearchQuery) {
                this.renderSearchResults(unique);
                this.positionDropdown();
            }
        } catch (error) {
            console.error('Search error:', error);
            if (query === this.currentSearchQuery) {
                resultsEl.innerHTML = '<div class="error">Search failed. Please try again.</div>';
                this.positionDropdown();
            }
        }
    }

    positionDropdown() {
        const resultsEl = document.getElementById('searchResults');
        const searchInput = document.getElementById('searchInput');
        if (!resultsEl || !searchInput) return;

        const inputRect = searchInput.getBoundingClientRect();
        const wrapper = document.querySelector('.search-wrapper');
        const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : inputRect;

        // Position the dropdown directly under the input (fixed, viewport-based)
        resultsEl.style.position = 'fixed';
        resultsEl.style.top = `${inputRect.bottom + 4}px`;
        resultsEl.style.left = `${wrapperRect.left}px`;
        resultsEl.style.width = `${wrapperRect.width}px`;
        resultsEl.style.maxWidth = `${Math.min(wrapperRect.width, window.innerWidth - 16)}px`;
        resultsEl.style.right = 'auto';
        resultsEl.style.zIndex = '99999';
    }

    renderSearchResults(results) {
        const resultsEl = document.getElementById('searchResults');
        if (!resultsEl) return;

        if (!results || results.length === 0) {
            resultsEl.innerHTML = '<div class="empty">No results found</div>';
            this.positionDropdown();
            return;
        }

        // Additional client-side deduplication as safety net
        const seen = new Set();
        const uniqueResults = results.filter(unit => {
            const key = unit.id || `${unit.name}|${unit.category}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        resultsEl.innerHTML = uniqueResults.map((unit) => `
            <div class="result-item" data-unit-id="${unit.id}" onclick="app.showUnitDetail(${unit.id})">
                <div class="result-left">
                    <span class="badge">${this.escapeHtml(unit.category)}</span>
                </div>
                <div class="result-center">
                    <div class="result-title">${this.escapeHtml(unit.name)}</div>
                    ${unit.description ? `<div class="result-description">${this.escapeHtml(unit.description.substring(0, 50))}${unit.description.length > 50 ? '...' : ''}</div>` : ''}
                </div>
                <div class="result-right">
                    ${unit.region ? `<span class="muted">${this.escapeHtml(unit.region)}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        this.positionDropdown();
    }

    // Load total units count
    async loadTotalUnits() {
        try {
            const response = await fetch('/api/search?q=');
            const data = await response.json();
            
            const totalEl = document.getElementById('totalUnits');
            if (totalEl && data.length > 0) {
                totalEl.textContent = `${data.length}`;
            }
        } catch (error) {
            console.error('Error loading total units:', error);
        }
    }

    // Load unit details
    async loadUnitDetails(id) {
        const container = document.getElementById('unitContent');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading unit details...</div>';

        try {
            const response = await fetch(`/api/units/${encodeURIComponent(id)}`);
            if (!response.ok) {
                throw new Error('Unit not found');
            }

            const unit = await response.json();

            // Get related units for conversion
            const relatedUnits = await this.fetchRelatedUnits(unit.category, unit.id);

            container.innerHTML = `
                <div class="unit-header">
                    <h2>${this.escapeHtml(unit.name)}</h2>
                    <span class="badge">${this.escapeHtml(unit.category)}</span>
                </div>

                <div class="unit-info-compact">
                    <div class="unit-meta-grid">
                        ${unit.region ? `
                            <div class="meta-item">
                                <span class="meta-label">Region</span>
                                <span class="meta-value">${this.escapeHtml(unit.region)}</span>
                            </div>
                        ` : ''}
                        ${unit.era ? `
                            <div class="meta-item">
                                <span class="meta-label">Era</span>
                                <span class="meta-value">${this.escapeHtml(unit.era)}</span>
                            </div>
                        ` : ''}
                        <div class="meta-item">
                            <span class="meta-label">Base Unit</span>
                            <span class="meta-value">${this.escapeHtml(unit.base_unit)}</span>
                        </div>
                    </div>
                    
                    ${unit.description ? `
                        <div class="unit-description-compact">
                            <p>${this.escapeHtml(unit.description)}</p>
                            ${unit.source_url ? `
                                <a href="${this.escapeHtml(unit.source_url)}" target="_blank" rel="noopener" class="source-link">
                                    View source
                                </a>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>

                <div class="conversion">
                    <h3>Convert This Unit</h3>
                    <div class="converter">
                        <input type="number" id="convertValue" placeholder="Enter value" step="any">
                        <select id="targetUnit">
                            <option value="">Select target unit...</option>
                            ${relatedUnits.map((u) => `
                                <option value="${u.id}">${this.escapeHtml(u.name)}</option>
                            `).join('')}
                        </select>
                        <button class="btn btn-primary" id="convertBtn">Convert</button>
                    </div>
                    <div id="conversionResult" class="conversion-result" style="display: none;"></div>
                </div>
            `;

            // Setup conversion handler
            const convertBtn = document.getElementById('convertBtn');
            if (convertBtn) {
                convertBtn.addEventListener('click', () => this.handleConversion(unit));
            }
        } catch (error) {
            console.error('Error loading unit:', error);
            container.innerHTML = '<div class="error">Unit not found</div>';
        }
    }

    async fetchRelatedUnits(category, excludeId) {
        try {
            const response = await fetch(`/api/units/category/${encodeURIComponent(category)}`);
            if (!response.ok) return [];
            
            const units = await response.json();
            return units.filter((u) => u.id !== excludeId);
        } catch (error) {
            console.error('Error fetching related units:', error);
            return [];
        }
    }

    async handleConversion(fromUnit) {
        const valueInput = document.getElementById('convertValue');
        const targetSelect = document.getElementById('targetUnit');
        const resultDiv = document.getElementById('conversionResult');

        if (!valueInput || !targetSelect || !resultDiv) return;

        const value = parseFloat(valueInput.value);
        const targetId = parseInt(targetSelect.value);

        if (!value || !targetId) {
            resultDiv.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUnitId: fromUnit.id,
                    toUnitId: targetId,
                    value: value
                })
            });

            if (!response.ok) {
                throw new Error('Conversion failed');
            }

            const data = await response.json();
            const targetName = targetSelect.options[targetSelect.selectedIndex].text;

            resultDiv.textContent = `${value} ${fromUnit.name} = ${data.result} ${targetName}`;
            resultDiv.style.display = 'block';
        } catch (error) {
            console.error('Conversion error:', error);
            resultDiv.textContent = 'Conversion failed. Please try again.';
            resultDiv.style.display = 'block';
        }
    }

    // Handle submission
    async handleSubmit(e) {
        e.preventDefault();
        
        const statusEl = document.getElementById('submitStatus');
        if (statusEl) statusEl.textContent = '';

        const formData = {
            name: document.getElementById('unitName')?.value?.trim(),
            category: document.getElementById('unitCategory')?.value?.trim(),
            base_unit: document.getElementById('baseUnit')?.value?.trim(),
            conversion_factor: parseFloat(document.getElementById('conversionFactor')?.value),
            region: document.getElementById('region')?.value?.trim() || '',
            era: document.getElementById('era')?.value?.trim() || '',
            description: document.getElementById('description')?.value?.trim() || '',
            source_url: document.getElementById('sourceUrl')?.value?.trim() || ''
        };

        try {
            if (statusEl) {
                statusEl.textContent = 'Submitting...';
                statusEl.className = 'status-message';
            }

            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Submission failed');
            }

            if (statusEl) {
                statusEl.textContent = 'Unit submitted successfully! Awaiting community verification.';
                statusEl.className = 'status-message success';
            }

            document.getElementById('submitForm')?.reset();

            // Redirect to pending page after 2 seconds
            setTimeout(() => {
                window.location.hash = '#/pending';
            }, 2000);
        } catch (error) {
            console.error('Submission error:', error);
            if (statusEl) {
                statusEl.textContent = `Submission failed: ${error.message}`;
                statusEl.className = 'status-message error';
            }
        }
    }

    // Load pending submissions
    async loadPendingSubmissions() {
        const container = document.getElementById('pendingList');
        if (!container) return;

        container.innerHTML = '<div class="loading">Loading pending submissions...</div>';

        try {
            const response = await fetch('/api/submissions/pending');
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                container.innerHTML = '<div class="empty">No pending submissions</div>';
                return;
            }

            container.innerHTML = data.map((submission) => {
                const unitData = JSON.parse(submission.submitted_data || '{}');
                return `
                    <div class="pending-card">
                        <div class="pending-title">${this.escapeHtml(unitData.name || 'Untitled')}</div>
                        <div class="pending-meta">
                            <span class="badge">${this.escapeHtml(unitData.category || '-')}</span>
                            ${unitData.region ? `<span class="muted">${this.escapeHtml(unitData.region)}</span>` : ''}
                        </div>
                        ${unitData.description ? `
                            <p style="margin: 0.75rem 0; color: var(--text-medium);">${this.escapeHtml(unitData.description)}</p>
                        ` : ''}
                        <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-medium);">
                            <div><strong>Base:</strong> ${this.escapeHtml(unitData.base_unit || '-')}</div>
                        </div>
                        <div class="pending-actions">
                            <button class="btn" data-vote="yes" data-id="${submission.id}">
                                👍 Yes (${submission.yes_votes || 0})
                            </button>
                            <button class="btn" data-vote="no" data-id="${submission.id}">
                                👎 No (${submission.no_votes || 0})
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            // Setup vote handlers
            container.querySelectorAll('button[data-vote]').forEach((btn) => {
                btn.addEventListener('click', (e) => this.handleVote(e));
            });
        } catch (error) {
            console.error('Error loading pending submissions:', error);
            container.innerHTML = '<div class="error">Failed to load pending submissions</div>';
        }
    }

    async handleVote(e) {
        const btn = e.currentTarget;
        const submissionId = parseInt(btn.getAttribute('data-id'));
        const vote = btn.getAttribute('data-vote');

        btn.disabled = true;

        try {
            const response = await fetch('/api/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, vote })
            });

            if (!response.ok) {
                throw new Error('Vote failed');
            }

            // Reload pending submissions
            this.loadPendingSubmissions();
        } catch (error) {
            console.error('Vote error:', error);
            btn.disabled = false;
            alert('Failed to submit vote. Please try again.');
        }
    }


    // Show unit detail on homepage
    async showUnitDetail(unitId) {
        try {
            const response = await fetch(`/api/units/${unitId}`);
            if (!response.ok) throw new Error('Unit not found');
            
            const unit = await response.json();
            
            // Populate unit detail section
            document.getElementById('selected-unit-name').textContent = unit.name;
            document.getElementById('selected-unit-category').textContent = unit.category;
            document.getElementById('selected-unit-base').textContent = unit.base_unit;
            
            // Show/hide optional fields
            if (unit.region) {
                document.getElementById('selected-unit-region').textContent = unit.region;
                document.getElementById('region-meta').style.display = 'flex';
            } else {
                document.getElementById('region-meta').style.display = 'none';
            }
            
            if (unit.era) {
                document.getElementById('selected-unit-era').textContent = unit.era;
                document.getElementById('era-meta').style.display = 'flex';
            } else {
                document.getElementById('era-meta').style.display = 'none';
            }
            
            if (unit.description) {
                document.getElementById('selected-unit-description').textContent = unit.description;
                document.getElementById('unit-description-section').style.display = 'block';
            } else {
                document.getElementById('unit-description-section').style.display = 'none';
            }
            
            if (unit.source_url) {
                document.getElementById('selected-unit-source').href = unit.source_url;
                document.getElementById('selected-unit-source').style.display = 'inline';
            } else {
                document.getElementById('selected-unit-source').style.display = 'none';
            }
            
            // Show the unit detail section
            document.getElementById('unit-detail-section').style.display = 'block';
            
            // Close search dropdown and reset search input
            this.closeSearchAndReset();
            
            // Reset conversion section when unit changes
            this.resetConversionSection();
            
            // Load target units for conversion
            await this.loadTargetUnits(unitId);
            
            // Scroll to the unit detail section
            document.getElementById('unit-detail-section').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
        } catch (error) {
            console.error('Error loading unit details:', error);
            alert('Failed to load unit details. Please try again.');
        }
    }
    
    // Load target units for conversion
    async loadTargetUnits(currentUnitId) {
        try {
            const response = await fetch(`/api/units/category/${document.getElementById('selected-unit-category').textContent}`);
            if (!response.ok) throw new Error('Failed to load target units');
            
            const units = await response.json();
            const targetSelect = document.getElementById('targetUnit');
            
            // Clear existing options
            targetSelect.innerHTML = '<option value="">Select target unit...</option>';
            
            // Add units (excluding current unit)
            units.forEach(unit => {
                if (unit.id != currentUnitId) {
                    const option = document.createElement('option');
                    option.value = unit.id;
                    option.textContent = unit.name;
                    targetSelect.appendChild(option);
                }
            });
            
        } catch (error) {
            console.error('Error loading target units:', error);
        }
    }
    
    // Setup conversion functionality
    setupConversion() {
        const convertBtn = document.getElementById('convertBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.performConversion());
        }
        
        // Also convert on Enter key in input
        const convertValue = document.getElementById('convertValue');
        if (convertValue) {
            convertValue.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performConversion();
                }
            });
        }
    }
    
    // Perform unit conversion
    async performConversion() {
        const value = document.getElementById('convertValue').value;
        const targetUnitId = document.getElementById('targetUnit').value;
        const resultDiv = document.getElementById('conversionResult');
        
        if (!value || !targetUnitId) {
            alert('Please enter a value and select a target unit');
            return;
        }
        
        try {
            // Get the current unit ID from the selected unit
            const currentUnitName = document.getElementById('selected-unit-name').textContent;
            const currentUnitCategory = document.getElementById('selected-unit-category').textContent;
        
            // Find current unit ID by searching for it
            const currentUnitResponse = await fetch(`/api/search?q=${encodeURIComponent(currentUnitName)}`);
            const currentUnits = await currentUnitResponse.json();
            const currentUnit = currentUnits.find(u => u.name === currentUnitName && u.category === currentUnitCategory);
            
            if (!currentUnit) {
                throw new Error('Current unit not found');
            }
            
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromUnitId: currentUnit.id,
                    toUnitId: parseInt(targetUnitId),
                    value: parseFloat(value)
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Conversion failed');
            }
            
            const result = await response.json();
            resultDiv.innerHTML = `
                <strong>${value} ${currentUnitName} = ${result.result} ${result.toUnit.name}</strong>
                <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-medium);">
                    Formula: ${result.formula}
                </div>
            `;
            resultDiv.style.display = 'block';
            
        } catch (error) {
            console.error('Conversion error:', error);
            alert(`Conversion failed: ${error.message}`);
        }
    }
    
    // Close search dropdown and reset search input
    closeSearchAndReset() {
        // Clear search results
        const resultsEl = document.getElementById('searchResults');
        if (resultsEl) {
            resultsEl.innerHTML = '';
        }
        
        // Reset search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.blur(); // Remove focus from search input
        }
        
        // Clear current search query
        this.currentSearchQuery = '';
    }
    
    // Reset conversion section when unit changes
    resetConversionSection() {
        // Clear conversion input value
        const convertValue = document.getElementById('convertValue');
        if (convertValue) {
            convertValue.value = '';
        }
        
        // Reset target unit selection
        const targetUnit = document.getElementById('targetUnit');
        if (targetUnit) {
            targetUnit.innerHTML = '<option value="">Select target unit...</option>';
        }
        
        // Hide conversion result
        const conversionResult = document.getElementById('conversionResult');
        if (conversionResult) {
            conversionResult.style.display = 'none';
            conversionResult.innerHTML = '';
        }
    }

    // Utility function
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new UnitDecoderApp();
        window.app = app; // Make app globally accessible
    });
} else {
    app = new UnitDecoderApp();
    window.app = app; // Make app globally accessible
}
// Force deployment Wed Oct 22 19:05:13 IST 2025
// Cache bust 1761140269
// Force cache bust 1761140385 - 7CBE1613-1037-4C55-AC51-7CCCD806848E
