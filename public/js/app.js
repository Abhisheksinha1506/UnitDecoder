// Optimized application JavaScript with performance improvements
class UnitDecoder {
    constructor() {
        this.searchTimeout = null;
        this.searchCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.debounceDelay = 300;
        this.init();
    }

    init() {
        this.setupSearch();
        this.loadFeaturedUnits();
        this.setupServiceWorker();
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');

        if (!searchInput || !searchResults) return;

        // Use passive event listeners for better performance
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            if (query.length === 0) {
                searchResults.innerHTML = '';
                return;
            }

            // Check cache first
            const cachedResult = this.getCachedResult(query);
            if (cachedResult) {
                this.displaySearchResults(cachedResult, searchResults);
                return;
            }

            // Debounce search with optimized delay
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query, searchResults);
            }, this.debounceDelay);
        }, { passive: true });
    }

    getCachedResult(query) {
        const cacheKey = query.toLowerCase();
        const cached = this.searchCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        if (cached) {
            this.searchCache.delete(cacheKey);
        }
        
        return null;
    }

    setCachedResult(query, data) {
        const cacheKey = query.toLowerCase();
        this.searchCache.set(cacheKey, {
            data,
            timestamp: Date.now()
        });
        
        // Clean up old cache entries
        if (this.searchCache.size > 100) {
            const now = Date.now();
            for (const [key, value] of this.searchCache.entries()) {
                if (now - value.timestamp > this.cacheExpiry) {
                    this.searchCache.delete(key);
                }
            }
        }
    }

    async performSearch(query, resultsContainer) {
        try {
            // Show loading state with optimized spinner
            resultsContainer.innerHTML = this.createLoadingHTML();

            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'max-age=300' // 5 minutes cache
                }
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }

            const units = await response.json();
            
            // Cache the result
            this.setCachedResult(query, units);
            
            this.displaySearchResults(units, resultsContainer);

        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = this.createErrorHTML();
        }
    }

    createLoadingHTML() {
        return `
            <div class="loading">
                <div class="spinner"></div>
                <p>Searching...</p>
            </div>
        `;
    }

    createErrorHTML() {
        return `
            <div class="error">
                <p>Search failed. Please try again.</p>
            </div>
        `;
    }

    displaySearchResults(units, container) {
        if (units.length === 0) {
            container.innerHTML = this.createEmptyStateHTML();
            return;
        }

        // Use DocumentFragment for better performance
        const fragment = document.createDocumentFragment();
        
        units.forEach(unit => {
            const resultElement = this.createSearchResultElement(unit);
            fragment.appendChild(resultElement);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    createSearchResultElement(unit) {
        const div = document.createElement('div');
        div.className = 'search-result';
        div.onclick = () => window.location.href = `/unit?id=${unit.id}`;
        
        // Use template literals for better performance
        div.innerHTML = `
            <h3>${this.escapeHtml(unit.name)}</h3>
            <div class="category">${this.escapeHtml(unit.category)}</div>
            <div class="conversion">1 ${this.escapeHtml(unit.name)} = ${unit.conversion_factor} ${this.escapeHtml(unit.base_unit)}</div>
            ${unit.description ? `<p>${this.escapeHtml(unit.description.substring(0, 100))}${unit.description.length > 100 ? '...' : ''}</p>` : ''}
        `;
        
        return div;
    }

    createEmptyStateHTML() {
        const query = document.getElementById('searchInput').value;
        return `
            <div class="empty-state">
                <p>No units found for "${this.escapeHtml(query)}"</p>
                <p>Try a different search term or <a href="/submit">submit a new unit</a></p>
            </div>
        `;
    }

    async loadFeaturedUnits() {
        const container = document.getElementById('featuredUnits');
        if (!container) return;

        try {
            // Use Promise.all for parallel requests
            const categories = ['Mass', 'Length', 'Volume', 'Counting'];
            const requests = categories.map(category => 
                fetch(`/api/units/category/${category}`, {
                    headers: { 'Accept': 'application/json' }
                }).then(response => response.ok ? response.json() : [])
            );

            const results = await Promise.all(requests);
            const featuredUnits = results
                .flat()
                .slice(0, 4); // Limit to 4 units

            if (featuredUnits.length > 0) {
                container.innerHTML = this.createFeaturedUnitsHTML(featuredUnits);
            } else {
                container.innerHTML = '<p>No featured units available</p>';
            }

        } catch (error) {
            console.error('Error loading featured units:', error);
            container.innerHTML = '<p>Unable to load featured units</p>';
        }
    }

    createFeaturedUnitsHTML(units) {
        return units.map(unit => `
            <div class="unit-card" onclick="window.location.href='/unit?id=${unit.id}'">
                <h3>${this.escapeHtml(unit.name)}</h3>
                <div class="category">${this.escapeHtml(unit.category)}</div>
                <p>${this.escapeHtml(unit.description || 'Traditional unit of measurement')}</p>
            </div>
        `).join('');
    }

    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UnitDecoder();
});
