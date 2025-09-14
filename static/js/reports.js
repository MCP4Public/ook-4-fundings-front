// Global state
let reports = [];

// Initialize the reports page
document.addEventListener('DOMContentLoaded', function() {
    loadReports();
    setupEventListeners();
});

// Load reports from API
async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        reports = await response.json();
        renderReports();
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    }
}

// Render reports in the table
function renderReports() {
    const tableBody = document.getElementById('reports-table-body');
    const emptyState = document.getElementById('empty-reports');
    const tableContainer = tableBody.parentElement.parentElement;
    
    if (reports.length === 0) {
        tableContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    tableContainer.classList.remove('hidden');
    
    tableBody.innerHTML = reports.map(report => createReportRow(report)).join('');
}

// Create a report table row
function createReportRow(report) {
    const generatedDate = new Date(report.generated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const fileSize = formatFileSize(report.file_size || 0);
    
    // Truncate description for table display
    const truncatedDescription = report.description ? 
        (report.description.length > 50 ? report.description.substring(0, 50) + '...' : report.description) : '';
    
    return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                        <i class="fas fa-file-pdf text-red-600"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="text-sm font-medium text-gray-900 truncate">${report.name}</div>
                        ${truncatedDescription ? `<div class="text-sm text-gray-500 truncate" title="${report.description}">${truncatedDescription}</div>` : ''}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}">
                    ${getReportTypeLabel(report.type)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${generatedDate}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${fileSize}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex space-x-2">
                    <a href="/api/reports/${report.id}/download" 
                       class="text-blue-600 hover:text-blue-900 transition duration-200"
                       download="${report.filename}"
                       target="_blank">
                        <i class="fas fa-download mr-1"></i>Download
                    </a>
                    <button onclick="deleteReport(${report.id})" class="text-red-600 hover:text-red-900 transition duration-200">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Get report type color
function getReportTypeColor(type) {
    switch (type) {
        case 'generated': return 'bg-green-100 text-green-800';
        case 'api': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get report type label
function getReportTypeLabel(type) {
    switch (type) {
        case 'generated': return 'Generated';
        case 'api': return 'API';
        default: return 'Unknown';
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Setup event listeners
function setupEventListeners() {
    // Generate report button
    document.getElementById('generate-report-btn').addEventListener('click', openGenerateReportModal);
    document.getElementById('generate-first-report-btn').addEventListener('click', openGenerateReportModal);
    
    // Report type change
    document.getElementById('report-type').addEventListener('change', function(e) {
        const apiDesc = document.getElementById('api-description');
        const infoText = document.getElementById('report-info-text');
        
        if (e.target.value === 'api') {
            apiDesc.classList.remove('hidden');
            infoText.textContent = 'Enter the report content that will be converted to PDF. This is useful for LLM-generated reports.';
        } else {
            apiDesc.classList.add('hidden');
            infoText.textContent = 'The report will be generated using your company profile and won grants data to create a professional document suitable for funding applications.';
        }
    });
    
    // Confirm generate button
    document.getElementById('confirm-generate-btn').addEventListener('click', generateReport);
    
    // Close modal on backdrop click
    document.getElementById('generate-report-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeGenerateReportModal();
        }
    });
}

// Open generate report modal
function openGenerateReportModal() {
    document.getElementById('generate-report-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close generate report modal
function closeGenerateReportModal() {
    document.getElementById('generate-report-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('report-type').value = 'generated';
    document.getElementById('api-description').classList.add('hidden');
    document.getElementById('api-report-content').value = '';
}

// Generate report
async function generateReport() {
    const reportType = document.getElementById('report-type').value;
    const apiContent = document.getElementById('api-report-content').value;
    
    if (reportType === 'api' && !apiContent.trim()) {
        showNotification('Please provide content for API reports', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: reportType,
                content: apiContent
            })
        });
        
        if (response.ok) {
            const newReport = await response.json();
            reports.unshift(newReport);
            renderReports();
            closeGenerateReportModal();
            showNotification('Report generated successfully!', 'success');
        } else {
            throw new Error('Failed to generate report');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    }
}

// Delete report
async function deleteReport(reportId) {
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            reports = reports.filter(report => report.id !== reportId);
            renderReports();
            showNotification('Report deleted successfully', 'success');
        } else {
            throw new Error('Failed to delete report');
        }
    } catch (error) {
        console.error('Error deleting report:', error);
        showNotification('Error deleting report', 'error');
    }
}

// Utility function for notifications
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 ${
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
