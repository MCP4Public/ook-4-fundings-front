// Global state
let grants = [];
let expandedGrant = null;
let currentSort = 'affinity';
let sortOrder = 'desc'; // 'asc' or 'desc'

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadGrants();
    setupEventListeners();
});

// Load grants from API
async function loadGrants() {
    try {
        const response = await fetch('/api/grants');
        grants = await response.json();
        sortGrantsData();
        renderGrants();
    } catch (error) {
        console.error('Error loading grants:', error);
        showNotification('Error loading grants', 'error');
    }
}

// Render grants in the grid
function renderGrants() {
    const container = document.getElementById('grants-container');
    const emptyState = document.getElementById('empty-state');
    const gridContainer = container.parentElement;
    
    if (grants.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        gridContainer.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    gridContainer.classList.remove('hidden');
    
    container.innerHTML = grants.map((grant, index) => createGrantCard(grant, index)).join('');
}

// Create a grant card HTML
function createGrantCard(grant, index) {
    const isExpanded = expandedGrant === index;
    const affinityColor = getAffinityColor(grant.company_affinity);
    
    return `
        <div class="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div class="p-6">
                <!-- Header -->
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 line-clamp-2 pr-4">${grant.title}</h3>
                    <div class="flex space-x-2">
                        <button onclick="toggleGrant(${index})" class="text-gray-400 hover:text-gray-600 transition duration-200 p-1">
                            <i class="fas fa-${isExpanded ? 'chevron-up' : 'chevron-down'}"></i>
                        </button>
                        <button onclick="deleteGrant(${index})" class="text-gray-400 hover:text-red-600 transition duration-200 p-1">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Badges -->
                <div class="mb-4 flex flex-wrap gap-2">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${affinityColor}">
                        <div class="w-2 h-2 rounded-full mr-2 ${getAffinityDotColor(grant.company_affinity)}"></div>
                        ${grant.company_affinity}% Match
                    </span>
                    <button onclick="toggleWonStatus(${index})" class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition duration-200 ${grant.won ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}">
                        <i class="fas fa-trophy mr-1"></i>Won
                    </button>
                </div>
                
                <!-- Summary (always visible) -->
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${grant.summary}</p>
                
                <!-- Expanded Content -->
                <div class="transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}">
                    <div class="space-y-4 pt-4 border-t border-gray-200">
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-calendar-alt text-gray-500"></i>
                            </div>
                            <div>
                                <span class="font-medium text-gray-900">Deadline</span>
                                <p class="text-gray-600">${formatDate(grant.deadline)}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-tag text-gray-500"></i>
                            </div>
                            <div>
                                <span class="font-medium text-gray-900">Status</span>
                                <p class="text-gray-600">${grant.status}</p>
                            </div>
                        </div>
                        
                        <div class="flex items-center text-sm text-gray-600">
                            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fas fa-dollar-sign text-gray-500"></i>
                            </div>
                            <div>
                                <span class="font-medium text-gray-900">Budget</span>
                                <p class="text-gray-600">${grant.budget}</p>
                            </div>
                        </div>
                        
                        <div class="pt-2">
                            <a href="${grant.url}" target="_blank" class="inline-flex items-center text-gray-900 hover:text-gray-700 transition duration-200 font-medium">
                                <i class="fas fa-external-link-alt mr-2"></i>
                                View Full Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Toggle grant expansion
function toggleGrant(index) {
    expandedGrant = expandedGrant === index ? null : index;
    renderGrants();
}

// Delete a grant
async function deleteGrant(index) {
    if (!confirm('Are you sure you want to delete this grant?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/grants/${index}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            grants.splice(index, 1);
            if (expandedGrant === index) {
                expandedGrant = null;
            } else if (expandedGrant > index) {
                expandedGrant--;
            }
            renderGrants();
            showNotification('Grant deleted successfully', 'success');
        } else {
            throw new Error('Failed to delete grant');
        }
    } catch (error) {
        console.error('Error deleting grant:', error);
        showNotification('Error deleting grant', 'error');
    }
}

// Toggle won status of a grant
async function toggleWonStatus(index) {
    try {
        // Ensure the index is valid
        if (index < 0 || index >= grants.length) {
            throw new Error('Invalid grant index');
        }
        
        // Get the current grant from the frontend array
        const currentGrant = grants[index];
        
        // Find the corresponding grant in the backend by matching title and URL
        const response = await fetch('/api/grants');
        const backendGrants = await response.json();
        const backendIndex = backendGrants.findIndex(grant => 
            grant.title === currentGrant.title && grant.url === currentGrant.url
        );
        
        if (backendIndex === -1) {
            throw new Error('Grant not found in backend');
        }
        
        // Toggle the won status using the backend index
        const toggleResponse = await fetch(`/api/grants/${backendIndex}/won`, {
            method: 'PATCH'
        });
        
        if (toggleResponse.ok) {
            const updatedGrant = await toggleResponse.json();
            // Update the grant in the frontend array
            grants[index] = updatedGrant.grant;
            renderGrants();
        } else {
            throw new Error('Failed to update won status');
        }
    } catch (error) {
        console.error('Error toggling won status:', error);
        showNotification('Error updating won status', 'error');
    }
}

// Modal functions
function openAddGrantModal() {
    document.getElementById('add-grant-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAddGrantModal() {
    document.getElementById('add-grant-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('add-grant-form').reset();
}

// Setup event listeners
function setupEventListeners() {
    // Add grant form submission
    document.getElementById('add-grant-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const grantData = {
            title: document.getElementById('grant-title').value,
            url: document.getElementById('grant-url').value,
            summary: document.getElementById('grant-summary').value,
            deadline: document.getElementById('grant-deadline').value,
            status: document.getElementById('grant-status').value,
            budget: document.getElementById('grant-budget').value,
            company_affinity: parseFloat(document.getElementById('grant-affinity').value),
            won: false
        };
        
        try {
            const response = await fetch('/api/grants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(grantData)
            });
            
            if (response.ok) {
                const newGrant = await response.json();
                grants.push(newGrant);
                sortGrantsData();
                renderGrants();
                closeAddGrantModal();
                showNotification('Grant added successfully', 'success');
            } else {
                throw new Error('Failed to add grant');
            }
        } catch (error) {
            console.error('Error adding grant:', error);
            showNotification('Error adding grant', 'error');
        }
    });
    
    // Close modal on backdrop click
    document.getElementById('add-grant-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAddGrantModal();
        }
    });
    
    // Range slider for affinity
    document.getElementById('grant-affinity').addEventListener('input', function(e) {
        document.getElementById('affinity-value').textContent = e.target.value + '%';
    });
}

// Sorting functions
function sortGrants(sortBy) {
    currentSort = sortBy;
    sortGrantsData();
    renderGrants();
    updateSortButtons();
}

function sortGrantsData() {
    grants.sort((a, b) => {
        let comparison = 0;
        
        switch (currentSort) {
            case 'affinity':
                comparison = a.company_affinity - b.company_affinity;
                break;
            case 'deadline':
                comparison = new Date(a.deadline) - new Date(b.deadline);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            default:
                comparison = 0;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
    });
}

function toggleSortOrder() {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortGrantsData();
    renderGrants();
    updateSortButtons();
}

function updateSortButtons() {
    // Reset all sort buttons
    document.querySelectorAll('[id^="sort-"]').forEach(btn => {
        btn.classList.remove('bg-gray-900', 'text-white');
        btn.classList.add('text-gray-700', 'bg-white', 'border-gray-300');
    });
    
    // Highlight current sort button
    const currentSortBtn = document.getElementById(`sort-${currentSort}`);
    if (currentSortBtn) {
        currentSortBtn.classList.remove('text-gray-700', 'bg-white', 'border-gray-300');
        currentSortBtn.classList.add('bg-gray-900', 'text-white');
    }
    
    // Update sort order button
    const orderBtn = document.getElementById('sort-order');
    const orderIcon = orderBtn.querySelector('i');
    const orderText = orderBtn.querySelector('span') || orderBtn.childNodes[2];
    
    if (sortOrder === 'asc') {
        orderIcon.className = 'fas fa-sort-amount-up mr-2';
        orderBtn.innerHTML = '<i class="fas fa-sort-amount-up mr-2"></i>Ascending';
    } else {
        orderIcon.className = 'fas fa-sort-amount-down mr-2';
        orderBtn.innerHTML = '<i class="fas fa-sort-amount-down mr-2"></i>Descending';
    }
}

// Utility functions
function getAffinityColor(affinity) {
    if (affinity >= 80) return 'bg-green-50 text-green-700 border border-green-200';
    if (affinity >= 60) return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    if (affinity >= 40) return 'bg-orange-50 text-orange-700 border border-orange-200';
    return 'bg-red-50 text-red-700 border border-red-200';
}

function getAffinityDotColor(affinity) {
    if (affinity >= 80) return 'bg-green-500';
    if (affinity >= 60) return 'bg-yellow-500';
    if (affinity >= 40) return 'bg-orange-500';
    return 'bg-red-500';
}

function getStatusColor(status) {
    switch (status.toLowerCase()) {
        case 'open': return 'bg-green-100 text-green-800';
        case 'closed': return 'bg-red-100 text-red-800';
        case 'upcoming': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

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
