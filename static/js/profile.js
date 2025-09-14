// Initialize the profile page
document.addEventListener('DOMContentLoaded', function() {
    loadCompanyProfile();
    setupEventListeners();
});

// Load company profile from API
async function loadCompanyProfile() {
    try {
        const response = await fetch('/api/company');
        const company = await response.json();
        
        if (company) {
            displayCompanyProfile(company);
        } else {
            displayEmptyProfile();
        }
    } catch (error) {
        console.error('Error loading company profile:', error);
        displayEmptyProfile();
    }
}

// Display company profile in card format
function displayCompanyProfile(company) {
    document.getElementById('display-company-name').textContent = company.name;
    document.getElementById('display-company-url').innerHTML = `<a href="${company.url}" target="_blank" class="text-blue-600 hover:text-blue-800 transition duration-200">${company.url} <i class="fas fa-external-link-alt ml-1 text-sm"></i></a>`;
    document.getElementById('display-company-scope').textContent = company.scope;
}

// Display empty profile state
function displayEmptyProfile() {
    document.getElementById('display-company-name').textContent = 'No company profile set';
    document.getElementById('display-company-url').textContent = '-';
    document.getElementById('display-company-scope').textContent = '-';
}

// Populate form with existing data
function populateForm(company) {
    document.getElementById('company-name').value = company.name || '';
    document.getElementById('company-url').value = company.url || '';
    document.getElementById('company-scope').value = company.scope || '';
}

// Setup event listeners
function setupEventListeners() {
    // Edit button click
    document.getElementById('edit-profile-btn').addEventListener('click', function() {
        showEditForm();
    });
    
    // Cancel edit button click
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        hideEditForm();
    });
    
    // PDF upload button click
    document.getElementById('upload-pdf-btn').addEventListener('click', function() {
        openPdfUploadModal();
    });
    
    // PDF upload form submission
    document.getElementById('pdf-upload-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await handlePdfUpload();
    });
    
    // File input change
    document.getElementById('pdf-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Update the label to show selected file
            const label = document.querySelector('label[for="pdf-file"]');
            const fileName = file.name;
            label.innerHTML = `
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                    <i class="fas fa-file-pdf text-4xl text-blue-500 mb-2"></i>
                    <p class="mb-2 text-sm text-gray-700 font-semibold">${fileName}</p>
                    <p class="text-xs text-gray-500">Click to change file</p>
                </div>
            `;
        }
    });
    
    // Company profile form submission
    document.getElementById('company-profile-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const companyData = {
            name: document.getElementById('company-name').value,
            url: document.getElementById('company-url').value,
            scope: document.getElementById('company-scope').value
        };
        
        try {
            const response = await fetch('/api/company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(companyData)
            });
            
            if (response.ok) {
                const updatedCompany = await response.json();
                displayCompanyProfile(updatedCompany);
                hideEditForm();
                showNotification('Company profile updated successfully', 'success');
            } else {
                throw new Error('Failed to update company profile');
            }
        } catch (error) {
            console.error('Error updating company profile:', error);
            showNotification('Error updating company profile', 'error');
        }
    });
}

// Show edit form
function showEditForm() {
    // Load current data into form
    loadCurrentDataIntoForm();
    
    // Show edit form, hide display
    document.getElementById('profile-display').classList.add('hidden');
    document.getElementById('profile-edit-form').classList.remove('hidden');
    document.getElementById('edit-profile-btn').classList.add('hidden');
}

// Hide edit form
function hideEditForm() {
    // Show display, hide edit form
    document.getElementById('profile-display').classList.remove('hidden');
    document.getElementById('profile-edit-form').classList.add('hidden');
    document.getElementById('edit-profile-btn').classList.remove('hidden');
}

// Load current company data into form
async function loadCurrentDataIntoForm() {
    try {
        const response = await fetch('/api/company');
        const company = await response.json();
        
        if (company) {
            populateForm(company);
        }
    } catch (error) {
        console.error('Error loading current data:', error);
    }
}

// Open PDF upload modal
function openPdfUploadModal() {
    document.getElementById('pdf-upload-modal').classList.remove('hidden');
    // Reset form
    document.getElementById('pdf-file').value = '';
    resetFileInputLabel();
}

// Close PDF upload modal
function closePdfUploadModal() {
    document.getElementById('pdf-upload-modal').classList.add('hidden');
    // Reset form
    document.getElementById('pdf-file').value = '';
    resetFileInputLabel();
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('pdf-upload-modal');
    if (event.target === modal) {
        closePdfUploadModal();
    }
});

// Handle PDF upload and analysis
async function handlePdfUpload() {
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];
    
    if (!file) {
        showNotification('Please select a PDF file', 'error');
        return;
    }
    
    if (file.type !== 'application/pdf') {
        showNotification('Please select a valid PDF file', 'error');
        return;
    }
    
    // Show progress indicator
    const uploadBtn = document.getElementById('upload-pdf-submit-btn');
    const uploadProgress = document.getElementById('upload-progress');
    
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    uploadProgress.classList.remove('hidden');
    
    try {
        const formData = new FormData();
        formData.append('pdf_file', file);
        
        const response = await fetch('/api/company/upload-pdf', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            const companyData = await response.json();
            displayCompanyProfile(companyData);
            showNotification('PDF analyzed successfully! Company information extracted.', 'success');
            
            // Close modal and reset form
            closePdfUploadModal();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to analyze PDF');
        }
    } catch (error) {
        console.error('Error uploading PDF:', error);
        showNotification(`Error analyzing PDF: ${error.message}`, 'error');
    } finally {
        // Reset UI
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Analyze PDF';
        uploadProgress.classList.add('hidden');
    }
}

// Reset file input label
function resetFileInputLabel() {
    const label = document.querySelector('label[for="pdf-file"]');
    label.innerHTML = `
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
            <i class="fas fa-file-pdf text-4xl text-gray-400 mb-2"></i>
            <p class="mb-2 text-sm text-gray-500">
                <span class="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p class="text-xs text-gray-500">PDF files only</p>
        </div>
    `;
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
