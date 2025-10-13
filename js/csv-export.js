/**
 * CSV Export Module
 * Handles RFC 4180 compliant CSV generation with pipe separator for arrays
 */

/**
 * Escape CSV field per RFC 4180
 * @param {string} value - Value to escape
 * @param {boolean} isDescription - Whether this is a description field (replaces newlines with spaces)
 * @returns {string} Escaped value
 */
function escapeCSVField(value, isDescription = false) {
    if (value == null) {
        return '""';
    }
    
    let strValue = String(value);
    
    // Replace newlines with spaces in description field
    if (isDescription) {
    // Normalize all newline sequences (\r\n, \r, \n) into a single space,
    // then collapse multiple spaces into one and trim edges.
    strValue = strValue
        .replace(/(?:\r\n|\r|\n)+/g, " ")
        .replace(/ {2,}/g, " ")
        .trim();
    }

    
    // Always wrap in quotes and escape internal quotes
    return '"' + strValue.replace(/"/g, '""') + '"';
}

/**
 * Convert array to pipe-separated string
 * @param {Array} array - Array to convert
 * @returns {string} Pipe-separated string
 */
function arrayToPipeSeparated(array) {
    if (!Array.isArray(array)) {
        return '';
    }
    
    // Escape pipe characters in array values
    const escapedValues = array.map(value => {
        const str = String(value || '');
        // Replace pipes with escaped pipes (or use double pipe)
        return str.replace(/\|/g, '\\|');
    });
    
    return escapedValues.join('|');
}

/**
 * Generate CSV content from exhibitors
 * @param {Array} exhibitors - Array of exhibitor objects
 * @param {Array} columns - Array of column definitions
 * @returns {string} CSV content
 */
function generateCSV(exhibitors, columns) {
    // Column definitions (can be customized)
    const defaultColumns = [
        { name: 'name', label: 'Exhibitor Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' },
        { name: 'categories', label: 'Categories', type: 'array' },
           { name: 'booths', label: 'Booth', type: 'array' },
           { name: 'website', label: 'Website', type: 'text' }
    ];
    
    const columnsToUse = columns || defaultColumns;
    
    // Generate header row
    const headers = columnsToUse.map(col => escapeCSVField(col.label));
    const rows = [headers.join(',')];
    
    // Generate data rows
    exhibitors.forEach(exhibitor => {
        const rowValues = columnsToUse.map(col => {
            const value = exhibitor[col.name];
            
            if (col.type === 'array') {
                // Convert array to pipe-separated string, then escape for CSV
                const pipeSeparated = arrayToPipeSeparated(value);
                return escapeCSVField(pipeSeparated, false);
            } else {
                // Replace newlines with spaces for description field
                const isDescription = col.name === 'description';
                return escapeCSVField(value, isDescription);
            }
        });
        
        rows.push(rowValues.join(','));
    });
    
    return rows.join('\n');
}

/**
 * Trigger browser download of CSV file
 * @param {string} csvContent - CSV content to download
 * @param {string} filename - Name of file to download
 */
function triggerDownload(csvContent, filename) {
    // Add UTF-8 BOM to ensure proper character encoding in Excel and other programs
    // The BOM (Byte Order Mark) tells the application that the file is UTF-8 encoded
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Export filtered exhibitors to CSV
 * @param {Object} tableState - Current table state
 */
function exportFiltered(tableState) {
    const csvContent = generateCSV(tableState.exhibitorsFiltered);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ces-exhibitors-filtered-${timestamp}.csv`;
    
    triggerDownload(csvContent, filename);
}

/**
 * Export all exhibitors to CSV
 * @param {Object} tableState - Current table state
 */
function exportAll(tableState) {
    const csvContent = generateCSV(tableState.exhibitorsOriginal);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `ces-exhibitors-all-${timestamp}.csv`;
    
    triggerDownload(csvContent, filename);
}

/**
 * Initialize export button handlers
 * @param {Object} tableState - Current table state
 */
function initializeExport(tableState) {
    const exportFilteredBtn = document.getElementById('export-filtered');
    const exportAllBtn = document.getElementById('export-all');
    
    if (exportFilteredBtn) {
        exportFilteredBtn.addEventListener('click', function() {
            exportFiltered(tableState);
        });
    }
    
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', function() {
            exportAll(tableState);
        });
    }
}
