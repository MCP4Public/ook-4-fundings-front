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
