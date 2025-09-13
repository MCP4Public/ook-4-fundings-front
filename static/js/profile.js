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
            populateForm(company);
            displayCurrentProfile(company);
        }
    } catch (error) {
        console.error('Error loading company profile:', error);
        showNotification('Error loading company profile', 'error');
    }
}

// Populate form with existing data
function populateForm(company) {
    document.getElementById('company-name').value = company.name || '';
    document.getElementById('company-url').value = company.url || '';
    document.getElementById('company-scope').value = company.scope || '';
}

// Display current profile
function displayCurrentProfile(company) {
    const currentProfileDiv = document.getElementById('current-profile');
    const profileContent = document.getElementById('profile-content');
    
    if (company) {
        profileContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-building text-gray-500"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900">Company Name</h4>
                        <p class="text-gray-600">${company.name}</p>
                    </div>
                </div>
                
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-globe text-gray-500"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900">Website</h4>
                        <a href="${company.url}" target="_blank" class="text-gray-600 hover:text-gray-900 transition duration-200 inline-flex items-center">
                            ${company.url}
                            <i class="fas fa-external-link-alt ml-2 text-sm"></i>
                        </a>
                    </div>
                </div>
                
                <div class="flex items-start space-x-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <i class="fas fa-bullseye text-gray-500"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-gray-900">Company Scope</h4>
                        <p class="text-gray-600 leading-relaxed">${company.scope}</p>
                    </div>
                </div>
            </div>
        `;
        currentProfileDiv.classList.remove('hidden');
    } else {
        currentProfileDiv.classList.add('hidden');
    }
}

// Setup event listeners
function setupEventListeners() {
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
                displayCurrentProfile(updatedCompany);
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
