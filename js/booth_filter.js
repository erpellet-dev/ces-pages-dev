/**
 * Booth filtering functionality for CES exhibitor table.
 * 
 * Provides multi-select booth filtering similar to existing category filters,
 * with support for pipe-separated booth values and efficient filtering operations.
 */

class BoothFilter {
    constructor(tableId, filterContainerId) {
        this.tableId = tableId;
        this.filterContainerId = filterContainerId;
        this.selectedBooths = new Set();
        this.allBooths = new Set();
        this.init();
    }

    /**
     * Initialize the booth filter system
     */
    init() {
        this.extractAllBooths();
        this.renderFilterUI();
        this.attachEventListeners();
    }

    /**
     * Extract all unique booth values from table data
     */
    extractAllBooths() {
        const table = document.getElementById(this.tableId);
        if (!table) return;

        const boothCells = table.querySelectorAll('td[data-booths]');
        boothCells.forEach(cell => {
            const boothData = cell.getAttribute('data-booths');
            if (boothData && boothData.trim()) {
                // Split pipe-separated booth values
                const booths = boothData.split('|').map(booth => booth.trim()).filter(booth => booth);
                booths.forEach(booth => this.allBooths.add(booth));
            }
        });
    }

    /**
     * Render the filter UI with checkboxes for each booth
     */
    renderFilterUI() {
        const container = document.getElementById(this.filterContainerId);
        if (!container) return;

        const filterHtml = `
            <div class="filter-section" id="booth-filter">
                <h3>Booths</h3>
                <div class="filter-options">
                    ${Array.from(this.allBooths).sort().map(booth => `
                        <label class="filter-option">
                            <input type="checkbox" name="booth" value="${this.escapeHtml(booth)}">
                            ${this.escapeHtml(booth)}
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = filterHtml;
    }

    /**
     * Attach event listeners to filter checkboxes
     */
    attachEventListeners() {
        const container = document.getElementById(this.filterContainerId);
        if (!container) return;

        const checkboxes = container.querySelectorAll('input[type="checkbox"][name="booth"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const boothValue = event.target.value;
                if (event.target.checked) {
                    this.selectedBooths.add(boothValue);
                } else {
                    this.selectedBooths.delete(boothValue);
                }
                this.applyFilter();
            });
        });
    }

    /**
     * Apply booth filter to table rows
     * @returns {number} Number of visible rows after filtering
     */
    applyFilter() {
        const table = document.getElementById(this.tableId);
        if (!table) return 0;

        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;

        rows.forEach(row => {
            const boothCell = row.querySelector('td[data-booths]');
            if (!boothCell) {
                row.style.display = 'none';
                return;
            }

            const boothData = boothCell.getAttribute('data-booths');
            
            // If no booths selected, show all rows
            if (this.selectedBooths.size === 0) {
                row.style.display = '';
                visibleCount++;
                return;
            }

            // Check if row's booths match any selected booth
            if (boothData && boothData.trim()) {
                const rowBooths = boothData.split('|').map(booth => booth.trim());
                const hasMatch = rowBooths.some(booth => this.selectedBooths.has(booth));
                
                if (hasMatch) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            } else {
                // Row has no booth data
                row.style.display = 'none';
            }
        });

        // Update filter count if element exists
        this.updateFilterCount(visibleCount);
        
        return visibleCount;
    }

    /**
     * Update filter count display
     * @param {number} count - Number of visible exhibitors
     */
    updateFilterCount(count) {
        const countElement = document.getElementById('booth-filter-count');
        if (countElement) {
            countElement.textContent = `${count} exhibitors shown`;
        }
    }

    /**
     * Clear all booth filters
     */
    clearFilters() {
        this.selectedBooths.clear();
        
        const container = document.getElementById(this.filterContainerId);
        if (container) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"][name="booth"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
        
        this.applyFilter();
    }

    /**
     * Get currently selected booth filters
     * @returns {Array<string>} Array of selected booth values
     */
    getSelectedBooths() {
        return Array.from(this.selectedBooths);
    }

    /**
     * Set selected booth filters programmatically
     * @param {Array<string>} booths - Array of booth values to select
     */
    setSelectedBooths(booths) {
        this.selectedBooths.clear();
        booths.forEach(booth => this.selectedBooths.add(booth));
        
        // Update UI checkboxes
        const container = document.getElementById(this.filterContainerId);
        if (container) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"][name="booth"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.selectedBooths.has(checkbox.value);
            });
        }
        
        this.applyFilter();
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoothFilter;
}