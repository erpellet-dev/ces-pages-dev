/**
 * CES Exhibitors Directory - Search Functionality
 * 
 * Provides client-side search functionality using the generated search index.
 * Features:
 * - Real-time search as user types
 * - Fuzzy matching with scoring
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Debounced input for performance
 */

(function() {
    'use strict';
    
    let searchIndex = null;
    let searchInput = null;
    let searchResults = null;
    let resultsList = null;
    let resultsCount = null;
    let selectedIndex = -1;
    let searchTimeout = null;
    
    /**
     * Initialize search functionality
     */
    function init() {
        searchInput = document.getElementById('search-input');
        searchResults = document.getElementById('search-results');
        resultsList = document.getElementById('results-list');
        resultsCount = document.getElementById('results-count');
        
        if (!searchInput || !searchResults) {
            return; // Search elements not on this page
        }
        
        // Load search index
        loadSearchIndex();
        
        // Event listeners
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keydown', handleKeyDown);
        searchInput.addEventListener('focus', handleFocus);
        document.addEventListener('click', handleClickOutside);
    }
    
    /**
     * Get base path for URLs (from global variable set in template)
     */
    function getBasePath() {
        return window.SITE_BASE_PATH || '';
    }
    
    /**
     * Load search index from JSON file
     */
    async function loadSearchIndex() {
        try {
            const basePath = getBasePath();
            const response = await fetch(`${basePath}/search-index.json`);
            if (!response.ok) {
                throw new Error('Failed to load search index');
            }
            searchIndex = await response.json();
            console.log('Search index loaded:', searchIndex.metadata);
        } catch (error) {
            console.error('Error loading search index:', error);
        }
    }
    
    /**
     * Handle search input with debouncing
     */
    function handleSearchInput(event) {
        const query = event.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search (300ms delay)
        searchTimeout = setTimeout(() => {
            if (query.length === 0) {
                hideResults();
            } else if (query.length >= 2) {
                performSearch(query);
            }
        }, 300);
    }
    
    /**
     * Handle keyboard navigation
     */
    function handleKeyDown(event) {
        if (!searchResults || searchResults.style.display === 'none') {
            return;
        }
        
        const items = resultsList.querySelectorAll('li');
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection(items);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(items);
                break;
                
            case 'Enter':
                event.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    const link = items[selectedIndex].querySelector('a');
                    if (link) {
                        window.location.href = link.href;
                    }
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                hideResults();
                searchInput.blur();
                break;
        }
    }
    
    /**
     * Handle focus event
     */
    function handleFocus() {
        const query = searchInput.value.trim();
        if (query.length >= 2 && resultsList.children.length > 0) {
            showResults();
        }
    }
    
    /**
     * Handle clicks outside search area
     */
    function handleClickOutside(event) {
        if (!searchResults || searchResults.style.display === 'none') {
            return;
        }
        
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(event.target)) {
            hideResults();
        }
    }
    
    /**
     * Perform search against index
     */
    function performSearch(query) {
        if (!searchIndex || !searchIndex.exhibitors) {
            return;
        }
        
        const normalizedQuery = query.toLowerCase();
        const queryTerms = normalizedQuery.split(/\s+/);
        
        // Search and score results
        const results = searchIndex.exhibitors
            .map(exhibitor => {
                const score = calculateScore(exhibitor, normalizedQuery, queryTerms);
                return { exhibitor, score };
            })
            .filter(result => result.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Top 10 results
        
        displayResults(results);
    }
    
    /**
     * Calculate relevance score for an exhibitor
     */
    function calculateScore(exhibitor, query, queryTerms) {
        let score = 0;
        const searchTerms = exhibitor.search_terms || '';
        const name = exhibitor.name.toLowerCase();
        
        // Exact name match (highest score)
        if (name === query) {
            score += 100;
        }
        
        // Name starts with query
        else if (name.startsWith(query)) {
            score += 75;
        }
        
        // Name contains query
        else if (name.includes(query)) {
            score += 50;
        }
        
        // Match in search terms
        if (searchTerms.includes(query)) {
            score += 30;
        }
        
        // Count matching query terms
        queryTerms.forEach(term => {
            if (term.length >= 2) {
                // Name contains term
                if (name.includes(term)) {
                    score += 10;
                }
                
                // Search terms contain term
                if (searchTerms.includes(term)) {
                    score += 5;
                }
            }
        });
        
        // Boost if categories match
        if (exhibitor.categories && exhibitor.categories.length > 0) {
            exhibitor.categories.forEach(category => {
                const catLower = category.toLowerCase();
                if (catLower.includes(query)) {
                    score += 20;
                } else {
                    queryTerms.forEach(term => {
                        if (term.length >= 2 && catLower.includes(term)) {
                            score += 3;
                        }
                    });
                }
            });
        }
        
        return score;
    }
    
    /**
     * Display search results
     */
    function displayResults(results) {
        resultsList.innerHTML = '';
        selectedIndex = -1;
        
        if (results.length === 0) {
            resultsCount.textContent = 'No results found';
            showResults();
            return;
        }
        
        resultsCount.textContent = `${results.length} result${results.length !== 1 ? 's' : ''}`;
        
        const basePath = getBasePath();
        results.forEach(({ exhibitor }) => {
            const li = document.createElement('li');
            const link = document.createElement('a');
            link.href = `${basePath}/exhibitors/${slugify(exhibitor.name)}.html`;
            
            // Build result HTML using Bulma classes
            const resultHTML = `
                <div class="has-text-weight-semibold mb-1">${exhibitor.name}</div>
                ${exhibitor.description ? `<div class="is-size-7 has-text-grey mb-2">${truncate(exhibitor.description, 100)}</div>` : ''}
                ${exhibitor.categories && exhibitor.categories.length > 0 ? `
                    <div class="tags">
                        ${exhibitor.categories.slice(0, 3).map(cat => 
                            `<span class="tag is-info is-light is-small">${cat}</span>`
                        ).join('')}
                        ${exhibitor.categories.length > 3 ? `<span class="tag is-light is-small">+${exhibitor.categories.length - 3} more</span>` : ''}
                    </div>
                ` : ''}
            `;
            
            link.innerHTML = resultHTML;
            li.appendChild(link);
            resultsList.appendChild(li);
        });
        
        showResults();
    }
    
    /**
     * Update selected item highlighting
     */
    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === selectedIndex) {
                item.classList.add('selected');
                item.querySelector('a').style.backgroundColor = 'var(--background-alt)';
                // Scroll into view if needed
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
                item.querySelector('a').style.backgroundColor = '';
            }
        });
    }
    
    /**
     * Show search results dropdown
     */
    function showResults() {
        if (searchResults) {
            searchResults.style.display = 'block';
        }
    }
    
    /**
     * Hide search results dropdown
     */
    function hideResults() {
        if (searchResults) {
            searchResults.style.display = 'none';
        }
        selectedIndex = -1;
    }
    
    /**
     * Convert string to URL-friendly slug
     */
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start
            .replace(/-+$/, '');            // Trim - from end
    }
    
    /**
     * Truncate text to specified length
     */
    function truncate(text, maxLength) {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength).trim() + '...';
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
