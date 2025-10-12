/**
 * Sort Module
 * Handles column sorting with 3-state toggle (none, asc, desc)
 */

/**
 * Sort exhibitors by column
 * @param {Array} exhibitors - Array of exhibitors to sort
 * @param {string} column - Column name to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} Sorted array (new array, original unchanged)
 */
function sortExhibitors(exhibitors, column, direction) {
    if (!column || !direction) {
        return [...exhibitors];
    }
    
    const sorted = [...exhibitors];
    
    sorted.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];
        
        // Handle array values - sort by first element or length
        if (Array.isArray(valueA)) {
            valueA = valueA.length > 0 ? valueA[0] : '';
        }
        if (Array.isArray(valueB)) {
            valueB = valueB.length > 0 ? valueB[0] : '';
        }
        
        // Handle null/undefined
        if (valueA == null) valueA = '';
        if (valueB == null) valueB = '';
        
        // String comparison (locale-aware)
        const comparison = String(valueA).localeCompare(String(valueB));
        
        return direction === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
}

/**
 * Initialize sort handlers on column headers
 * @param {Object} tableState - Current table state
 * @param {Function} onSortChange - Callback when sort changes
 */
function initializeSorting(tableState, onSortChange) {
    const headers = document.querySelectorAll('.exhibitors-table th[data-sortable="true"]');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-column');
        
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            // Cycle through sort states: null -> asc -> desc -> null
            if (tableState.sortColumn !== column) {
                // New column clicked
                tableState.sortColumn = column;
                tableState.sortDirection = 'asc';
            } else {
                // Same column clicked - cycle state
                if (tableState.sortDirection === 'asc') {
                    tableState.sortDirection = 'desc';
                } else if (tableState.sortDirection === 'desc') {
                    tableState.sortColumn = null;
                    tableState.sortDirection = null;
                } else {
                    tableState.sortDirection = 'asc';
                }
            }
            
            // Update UI indicators
            updateSortIndicators(tableState.sortColumn, tableState.sortDirection);
            
            // Apply sort
            if (tableState.sortColumn && tableState.sortDirection) {
                tableState.exhibitorsFiltered = sortExhibitors(
                    tableState.exhibitorsFiltered,
                    tableState.sortColumn,
                    tableState.sortDirection
                );
            }
            
            if (onSortChange) {
                onSortChange(tableState);
            }
        });
    });
}

/**
 * Update sort indicator icons
 * @param {string} activeColumn - Currently sorted column
 * @param {string} direction - Sort direction ('asc' or 'desc')
 */
function updateSortIndicators(activeColumn, direction) {
    const headers = document.querySelectorAll('.exhibitors-table th[data-sortable="true"]');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-column');
        const indicator = header.querySelector('.sort-indicator');
        
        if (!indicator) return;
        
        if (column === activeColumn && direction) {
            indicator.textContent = direction === 'asc' ? ' ↑' : ' ↓';
            indicator.style.visibility = 'visible';
        } else {
            indicator.textContent = '';
            indicator.style.visibility = 'hidden';
        }
    });
}
