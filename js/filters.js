/**
 * Filters Module
 * Handles text and array filtering logic
 */

/**
 * Apply text filter to a field
 * @param {string} fieldValue - Value to filter
 * @param {string} filterText - Filter text to search for
 * @returns {boolean} True if field matches filter
 */
function applyTextFilter(fieldValue, filterText) {
    if (!filterText || filterText.trim() === '') {
        return true;
    }
    
    const normalizedField = (fieldValue || '').toLowerCase();
    const normalizedFilter = filterText.toLowerCase().trim();
    
    return normalizedField.includes(normalizedFilter);
}

/**
 * Apply array filter to a field (ANY match)
 * @param {Array} fieldValues - Array of values to filter
 * @param {Array} selectedValues - Array of selected filter values
 * @returns {boolean} True if field contains any selected value
 */
function applyArrayFilter(fieldValues, selectedValues) {
    if (!selectedValues || selectedValues.length === 0) {
        return true;
    }
    
    if (!Array.isArray(fieldValues)) {
        return false;
    }
    
    return fieldValues.some(value => selectedValues.includes(value));
}

/**
 * Apply all filters to exhibitor data
 * @param {Array} exhibitors - Array of exhibitors to filter
 * @param {Object} textFilters - Object with text filter values
 * @param {Object} arrayFilters - Object with array filter values
 * @returns {Array} Filtered exhibitors
 */
function applyFilters(exhibitors, textFilters, arrayFilters) {
    return exhibitors.filter(exhibitor => {
        // Apply text filters (AND logic between filters)
        for (const [field, filterText] of Object.entries(textFilters)) {
            if (!applyTextFilter(exhibitor[field], filterText)) {
                return false;
            }
        }
        
        // Apply array filters (AND logic between filters, OR within each filter)
        for (const [field, selectedValues] of Object.entries(arrayFilters)) {
            if (!applyArrayFilter(exhibitor[field], selectedValues)) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Initialize filter controls
 * @param {Object} tableState - Current table state
 * @param {Function} onFilterChange - Callback when filters change
 */
function initializeFilters(tableState, onFilterChange) {
    // Text filters
    const textFilterInputs = document.querySelectorAll('.filter-input[data-filter-type="text"]');
    textFilterInputs.forEach(input => {
        const column = input.getAttribute('data-column');
        
        input.addEventListener('input', function() {
            tableState.textFilters[column] = this.value;
            
            // Apply filters and update display
            tableState.exhibitorsFiltered = applyFilters(
                tableState.exhibitorsOriginal,
                tableState.textFilters,
                tableState.arrayFilters
            );
            tableState.filteredCount = tableState.exhibitorsFiltered.length;
            
            // Re-apply sorting if active
            if (tableState.sortColumn) {
                tableState.exhibitorsFiltered = sortExhibitors(
                    tableState.exhibitorsFiltered,
                    tableState.sortColumn,
                    tableState.sortDirection
                );
            }
            
            if (onFilterChange) {
                onFilterChange(tableState);
            }
        });
    });
    
    // Custom dropdown filters
    const customDropdowns = document.querySelectorAll('.custom-dropdown[data-filter-type="array"]');
    customDropdowns.forEach(dropdown => {
        initializeCustomDropdown(dropdown, tableState, onFilterChange);
    });
    
    // Legacy array filters (multiselect) - keeping for backwards compatibility
    const arrayFilterSelects = document.querySelectorAll('.filter-input[data-filter-type="array"]');
    arrayFilterSelects.forEach(select => {
        const column = select.getAttribute('data-column');
        
        select.addEventListener('change', function() {
            // Get selected options
            const selectedOptions = Array.from(this.selectedOptions).map(opt => opt.value);
            tableState.arrayFilters[column] = selectedOptions.length > 0 ? selectedOptions : [];
            
            // Apply filters and update display
            tableState.exhibitorsFiltered = applyFilters(
                tableState.exhibitorsOriginal,
                tableState.textFilters,
                tableState.arrayFilters
            );
            tableState.filteredCount = tableState.exhibitorsFiltered.length;
            
            // Re-apply sorting if active
            if (tableState.sortColumn) {
                tableState.exhibitorsFiltered = sortExhibitors(
                    tableState.exhibitorsFiltered,
                    tableState.sortColumn,
                    tableState.sortDirection
                );
            }
            
            if (onFilterChange) {
                onFilterChange(tableState);
            }
        });
    });
}

/**
 * Initialize custom dropdown filter
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {Object} tableState - Current table state
 * @param {Function} onFilterChange - Callback when filters change
 */
function initializeCustomDropdown(dropdown, tableState, onFilterChange) {
    const column = dropdown.getAttribute('data-column');
    const toggleButton = dropdown.querySelector('.dropdown-toggle');
    const dropdownMenu = dropdown.querySelector('.dropdown-menu');
    const searchInput = dropdown.querySelector('.search-input');
    const selectAllCheckbox = dropdown.querySelector('.select-all-checkbox');
    const categoryCheckboxes = dropdown.querySelectorAll('.category-checkbox');
    const dropdownLabel = dropdown.querySelector('.dropdown-label');
    
    // Initialize with all categories selected
    const allCategories = Array.from(categoryCheckboxes).map(cb => cb.value);
    tableState.arrayFilters[column] = [];
    
    // Toggle dropdown visibility
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = dropdownMenu.style.display !== 'none';
        dropdownMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
    
    // Prevent dropdown from closing when clicking inside
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const optionList = dropdown.querySelector('.dropdown-option-list');
            const options = optionList.querySelectorAll('.dropdown-option');
            
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                option.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }
    
    // Select All functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            categoryCheckboxes.forEach(checkbox => {
                if (checkbox.parentElement.style.display !== 'none') {
                    checkbox.checked = isChecked;
                }
            });
            updateDropdownFilter(dropdown, tableState, onFilterChange);
        });
    }
    
    // Individual checkbox changes
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateDropdownFilter(dropdown, tableState, onFilterChange);
            
            // Update "Select All" checkbox state
            const allChecked = Array.from(categoryCheckboxes).every(cb => cb.checked);
            const anyChecked = Array.from(categoryCheckboxes).some(cb => cb.checked);
            
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = allChecked;
                selectAllCheckbox.indeterminate = anyChecked && !allChecked;
            }
        });
    });
}

/**
 * Update filter based on dropdown selections
 * @param {HTMLElement} dropdown - The dropdown element
 * @param {Object} tableState - Current table state
 * @param {Function} onFilterChange - Callback when filters change
 */
function updateDropdownFilter(dropdown, tableState, onFilterChange) {
    const column = dropdown.getAttribute('data-column');
    const categoryCheckboxes = dropdown.querySelectorAll('.category-checkbox');
    const dropdownLabel = dropdown.querySelector('.dropdown-label');
    
    // Get selected categories
    const selectedCategories = Array.from(categoryCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Update label
    const totalCount = categoryCheckboxes.length;
    const selectedCount = selectedCategories.length;
    
    if (selectedCount === 0) {
        dropdownLabel.textContent = 'No categories selected';
        tableState.arrayFilters[column] = [];
    } else if (selectedCount === totalCount) {
        dropdownLabel.textContent = 'All Categories';
        tableState.arrayFilters[column] = [];
    } else {
        dropdownLabel.textContent = `${selectedCount} selected`;
        tableState.arrayFilters[column] = selectedCategories;
    }
    
    // Apply filters and update display
    tableState.exhibitorsFiltered = applyFilters(
        tableState.exhibitorsOriginal,
        tableState.textFilters,
        tableState.arrayFilters
    );
    tableState.filteredCount = tableState.exhibitorsFiltered.length;
    
    // Re-apply sorting if active
    if (tableState.sortColumn) {
        tableState.exhibitorsFiltered = sortExhibitors(
            tableState.exhibitorsFiltered,
            tableState.sortColumn,
            tableState.sortDirection
        );
    }
    
    if (onFilterChange) {
        onFilterChange(tableState);
    }
}

/**
 * Clear all filters
 * @param {Object} tableState - Current table state
 * @param {Function} onFilterChange - Callback when filters change
 */
function clearAllFilters(tableState, onFilterChange) {
    // Reset filter state
    tableState.textFilters = {};
    tableState.arrayFilters = {};
    tableState.exhibitorsFiltered = [...tableState.exhibitorsOriginal];
    tableState.filteredCount = tableState.totalCount;
    
    // Clear UI - text inputs
    document.querySelectorAll('.filter-input[data-filter-type="text"]').forEach(input => {
        input.value = '';
    });
    
    // Clear UI - legacy multiselect
    document.querySelectorAll('.filter-input[data-filter-type="array"]').forEach(select => {
        select.selectedIndex = -1;
    });
    
    // Clear UI - custom dropdowns
    document.querySelectorAll('.custom-dropdown[data-filter-type="array"]').forEach(dropdown => {
        const selectAllCheckbox = dropdown.querySelector('.select-all-checkbox');
        const categoryCheckboxes = dropdown.querySelectorAll('.category-checkbox');
        const dropdownLabel = dropdown.querySelector('.dropdown-label');
        const searchInput = dropdown.querySelector('.search-input');
        
        // Check all checkboxes
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        }
        categoryCheckboxes.forEach(cb => {
            cb.checked = true;
        });
        
        // Reset label
        if (dropdownLabel) {
            dropdownLabel.textContent = 'All Categories';
        }
        
        // Clear search
        if (searchInput) {
            searchInput.value = '';
            // Show all options
            const optionList = dropdown.querySelector('.dropdown-option-list');
            if (optionList) {
                optionList.querySelectorAll('.dropdown-option').forEach(option => {
                    option.style.display = '';
                });
            }
        }
    });
    
    // Re-apply sorting if active
    if (tableState.sortColumn) {
        tableState.exhibitorsFiltered = sortExhibitors(
            tableState.exhibitorsFiltered,
            tableState.sortColumn,
            tableState.sortDirection
        );
    }
    
    if (onFilterChange) {
        onFilterChange(tableState);
    }
}

/**
 * Get unique values from an array column for filter options
 * @param {Array} exhibitors - Array of exhibitors
 * @param {string} columnName - Name of the array column
 * @returns {Array} Sorted array of unique values
 */
function getUniqueArrayValues(exhibitors, columnName) {
    const valuesSet = new Set();
    
    exhibitors.forEach(exhibitor => {
        const values = exhibitor[columnName];
        if (Array.isArray(values)) {
            values.forEach(value => valuesSet.add(value));
        }
    });
    
    return Array.from(valuesSet).sort();
}
