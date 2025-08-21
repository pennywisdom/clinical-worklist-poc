let scansData = [];
let currentSort = 'priority';
const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

// Initialize the app
async function init() {
    try {
        await loadScans();
        updateStats();
        updatePriorityDashboard();
        renderScans();
        renderCharts();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load scan data. Please refresh the page.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Trigger confetti effect on page load
    createConfetti();
    
    // Initialize the main app
    init();
});

// Create confetti effect
function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    if (!confettiContainer) return;
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#26de81', '#fc5c65', '#fd79a8', '#fdcb6e'];
    const confettiCount = 350; // Much more confetti for density!
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random positioning across the screen
        confetti.style.left = Math.random() * 100 + '%';
        
        // Different animation durations for variety
        confetti.style.animationDuration = (Math.random() * 1 + 2.5) + 's'; // 2.5-3.5 seconds (shorter)
        confetti.style.animationDelay = Math.random() * 1 + 's'; // Faster start
        
        // Random color
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.backgroundColor = randomColor;
        
        // Random size - bigger variety
        const size = Math.random() * 8 + 6; // 6px to 14px
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        
        // Add different shapes and slight horizontal drift
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '0'; // Square pieces
        }
        
        // Add some random horizontal drift
        const drift = (Math.random() - 0.5) * 200; // -100px to +100px drift
        confetti.style.setProperty('--drift', drift + 'px');
        
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation completes
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 5000); // Shorter cleanup time
}

// Initialize the application
async function init() {
    try {
        setupEventListeners();
        await loadScans();
        filterAndRenderScans();
    } catch (error) {
        console.error('Error initializing app:', error);
        showEmptyState('Failed to load scan data. Please refresh the page.');
    }
}

function setupEventListeners() {
    statusFilter.addEventListener('change', filterAndRenderScans);
    searchBox.addEventListener('input', debounce(filterAndRenderScans, 300));
    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });
}

// Update stats
function updateStats() {
    const totalScans = scansData.length;
    const pendingReview = scansData.filter(scan => scan.status === 'Pending Review').length;
    const urgentPriority = scansData.filter(scan => scan.priority?.level === 'urgent').length;
    
    document.getElementById('totalScans').textContent = totalScans;
    document.getElementById('pendingReview').textContent = pendingReview;
    document.getElementById('urgentPriority').textContent = urgentPriority;
}

// Apply filters and sorting
function applyFiltersAndSort() {
    let filteredScans = [...scansData];
    
    // Apply status filter
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter !== 'all') {
        filteredScans = filteredScans.filter(scan => scan.status === statusFilter);
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    if (searchTerm) {
        filteredScans = filteredScans.filter(scan => 
            (scan.patientId?.toLowerCase() || '').includes(searchTerm) ||
            (scan.patientName?.toLowerCase() || '').includes(searchTerm) ||
            (scan.bodyPart?.toLowerCase() || '').includes(searchTerm)
        );
    }
    
    // Apply sorting
    const sortBy = document.getElementById('priority-sort')?.value || currentSort;
    if (sortBy === 'priority') {
        filteredScans.sort((a, b) => {
            const aPriority = priorityOrder[a.priority?.level || 'low'];
            const bPriority = priorityOrder[b.priority?.level || 'low'];
            if (bPriority !== aPriority) return bPriority - aPriority;
            
            const aScore = a.priority?.score || 0;
            const bScore = b.priority?.score || 0;
            return bScore - aScore;
        });
    } else if (sortBy === 'date') {
        filteredScans.sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate));
    } else if (sortBy === 'patient') {
        filteredScans.sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''));
    }
    
    return filteredScans;
}

// Render scans
function renderScans() {
    const filteredScans = applyFiltersAndSort();
    const container = document.getElementById('scansList');
    
    if (!container) {
        console.error('Scans container not found');
        return;
    }
    
    if (filteredScans.length === 0) {
        container.innerHTML = '<div class="no-scans">No scans match your current filters.</div>';
        return;
    }
    
    const scansHTML = filteredScans.map(scan => {
        const priority = scan.priority || { level: 'low', score: 0, aiAnalysis: 'No analysis available', confidence: 0, flags: [] };
        
        return `
            <div class="scan-card ${priority.level}-priority" onclick="openScanDetails('${scan.scanId}')">
                <div class="scan-header">
                    <div class="scan-info">
                        <h3>${scan.patientName || 'Unknown Patient'}</h3>
                        <p class="patient-id">ID: ${scan.patientId}</p>
                        <p class="scan-meta">${scan.bodyPart} • ${scan.scanType} • ${formatDate(scan.scanDate)}</p>
                    </div>
                    <div class="scan-image">
                        <img src="${scan.image || 'images/placeholder.png'}" alt="${scan.bodyPart} scan" onerror="this.style.display='none'">
                    </div>
                    <div class="priority-info">
                        <span class="priority-badge priority-${priority.level}">
                            ${priority.level.toUpperCase()}
                        </span>
                        <span class="priority-score">Score: ${priority.score}</span>
                    </div>
                </div>
                
                <div class="scan-status">
                    <span class="status-badge status-${scan.status.toLowerCase().replace(/\s+/g, '-')}">
                        ${scan.status}
                    </span>
                    <span class="consultant">Consultant: ${scan.consultant}</span>
                </div>
                
                <div class="scan-findings">
                    <strong>Findings:</strong> ${scan.findings || 'No findings recorded'}
                </div>
                
                <div class="ai-analysis">
                    <h4>🤖 AI Analysis 
                        <span class="confidence-score">
                            ${priority.confidence}%
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${priority.confidence}%"></div>
                            </div>
                        </span>
                    </h4>
                    <p>${priority.aiAnalysis}</p>
                    <div class="priority-flags">
                        ${priority.flags.map(flag => 
                            `<span class="flag-tag">${flag.replace(/_/g, ' ')}</span>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="scan-actions">
                    ${scan.status === 'Completed' ? 
                        `<button class="action-btn disabled" disabled>
                            ✅ Review Completed
                        </button>` :
                        `<button class="action-btn primary" onclick="event.stopPropagation(); startReview('${scan.scanId}')">
                            ${scan.status === 'In Progress' ? '📝 Continue Review' : '🔍 Start Review'}
                        </button>`
                    }
                    ${scan.status !== 'Completed' ? 
                        `<button class="action-btn secondary" onclick="event.stopPropagation(); updateScanStatus('${scan.scanId}', 'Completed')">
                            Complete
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = scansHTML;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update scan status
async function updateScanStatus(scanId, newStatus) {
    try {
        const response = await fetch(`/api/scans/${scanId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            const updatedScan = await response.json();
            const scanIndex = scansData.findIndex(scan => scan.scanId === scanId);
            if (scanIndex !== -1) {
                scansData[scanIndex] = updatedScan;
                updateStats();
                updatePriorityDashboard();
                renderScans();
            }
        }
    } catch (error) {
        console.error('Error updating scan status:', error);
        showError('Failed to update scan status.');
    }
}

// Start review with form popup
function startReview(scanId) {
    const scan = scansData.find(s => s.scanId === scanId);
    if (!scan) return;
    
    const modalContent = `
        <div class="modal-content review-form">
            <h2>🔍 Start Radiological Review</h2>
            <div class="review-header">
                <div class="review-scan-info">
                    <img src="${scan.image || 'images/placeholder.png'}" alt="${scan.bodyPart} scan" class="review-image">
                    <div class="review-details">
                        <h3>${scan.patientName} (${scan.patientId})</h3>
                        <p><strong>Body Part:</strong> ${scan.bodyPart}</p>
                        <p><strong>Scan Type:</strong> ${scan.scanType}</p>
                        <p><strong>Date:</strong> ${formatDate(scan.scanDate)}</p>
                        <div class="ai-preliminary">
                            <strong>AI Preliminary Analysis:</strong>
                            <p>${scan.priority?.aiAnalysis || 'No AI analysis available'}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <form id="reviewForm" class="review-form-content">
                <div class="form-group">
                    <label for="reviewNotes">Initial Review Notes:</label>
                    <textarea id="reviewNotes" rows="4" placeholder="Enter your initial observations and findings..."></textarea>
                </div>
                
                <div class="form-group">
                    <label for="reviewPriority">Confirm/Update Priority:</label>
                    <select id="reviewPriority">
                        <option value="urgent" ${scan.priority?.level === 'urgent' ? 'selected' : ''}>🔴 Urgent - Immediate attention required</option>
                        <option value="high" ${scan.priority?.level === 'high' ? 'selected' : ''}>🟠 High - Prompt attention needed</option>
                        <option value="medium" ${scan.priority?.level === 'medium' ? 'selected' : ''}>🟡 Medium - Standard timeframe</option>
                        <option value="low" ${scan.priority?.level === 'low' ? 'selected' : ''}>🟢 Low - Routine review</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="nextAction">Next Action Required:</label>
                    <select id="nextAction">
                        <option value="">Select next action...</option>
                        <option value="additional_imaging">Additional imaging required</option>
                        <option value="specialist_referral">Specialist referral needed</option>
                        <option value="urgent_consultation">Urgent consultation required</option>
                        <option value="routine_followup">Routine follow-up</option>
                        <option value="patient_callback">Patient callback needed</option>
                        <option value="no_further_action">No further action required</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="estimatedTime">Estimated Review Time (minutes):</label>
                    <input type="number" id="estimatedTime" min="5" max="120" value="15" placeholder="15">
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="submitReview('${scanId}')" class="btn-primary">
                        📝 Start Review
                    </button>
                    <button type="button" onclick="closeModal()" class="btn-secondary">
                        ❌ Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    showModal(modalContent);
}

// Submit review form
async function submitReview(scanId) {
    const reviewNotes = document.getElementById('reviewNotes').value;
    const reviewPriority = document.getElementById('reviewPriority').value;
    const nextAction = document.getElementById('nextAction').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    
    // Here you could send this data to your server
    console.log('Review submitted:', {
        scanId,
        reviewNotes,
        reviewPriority,
        nextAction,
        estimatedTime
    });
    
    // For now, just update the status and show a confirmation
    await updateScanStatus(scanId, 'In Progress');
    
    // Show confirmation message
    showNotification('Review started successfully! The scan has been marked as "In Progress".', 'success');
    
    closeModal();
}

// Open scan details modal
function openScanDetails(scanId) {
    const scan = scansData.find(s => s.scanId === scanId);
    if (!scan) return;
    
    const priority = scan.priority || {};
    
    const modalContent = `
        <div class="modal-content">
            <h2>Scan Details</h2>
            <div class="modal-header">
                <div class="modal-scan-image">
                    <img src="${scan.image || 'images/placeholder.png'}" alt="${scan.bodyPart} scan" onerror="this.style.display='none'">
                </div>
                <div class="modal-priority-info">
                    <span class="priority-badge priority-${priority.level}">${priority.level?.toUpperCase()}</span>
                    <div class="priority-score-large">Priority Score: ${priority.score || 0}</div>
                    <div class="confidence-score">
                        AI Confidence: ${priority.confidence || 0}%
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${priority.confidence || 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Patient:</strong> ${scan.patientName || 'Unknown'} (${scan.patientId})
                </div>
                <div class="detail-item">
                    <strong>Age:</strong> ${scan.age || 'N/A'}
                </div>
                <div class="detail-item">
                    <strong>Body Part:</strong> ${scan.bodyPart}
                </div>
                <div class="detail-item">
                    <strong>Scan Type:</strong> ${scan.scanType}
                </div>
                <div class="detail-item">
                    <strong>Date:</strong> ${formatDate(scan.scanDate)}
                </div>
                <div class="detail-item">
                    <strong>Status:</strong> ${scan.status}
                </div>
                <div class="detail-item">
                    <strong>Priority:</strong> <span class="priority-badge priority-${priority.level}">${priority.level?.toUpperCase()}</span> (Score: ${priority.score || 0})
                </div>
                <div class="detail-item">
                    <strong>Consultant:</strong> ${scan.consultant}
                </div>
                <div class="detail-item full-width">
                    <strong>Description:</strong> ${scan.description || 'No description available'}
                </div>
                <div class="detail-item full-width">
                    <strong>Findings:</strong> ${scan.findings || 'No findings recorded'}
                </div>
                <div class="detail-item full-width">
                    <strong>AI Analysis:</strong> ${priority.aiAnalysis || 'No AI analysis available'}
                </div>
                <div class="detail-item full-width">
                    <strong>AI Confidence:</strong> ${priority.confidence || 0}%
                </div>
                <div class="detail-item full-width">
                    <strong>Flags:</strong> ${(priority.flags || []).join(', ') || 'None'}
                </div>
            </div>
            <button onclick="closeModal()" class="close-btn">Close</button>
        </div>
    `;
    
    showModal(modalContent);
}

// Modal functions
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = content;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.body.appendChild(modal);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

// Show error message
function showError(message) {
    const container = document.getElementById('scansList');
    if (container) {
        container.innerHTML = `<div class="error-message">${message}</div>`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        ${type === 'success' ? 'background: #059669;' : ''}
        ${type === 'error' ? 'background: #dc2626;' : ''}
        ${type === 'info' ? 'background: #2563eb;' : ''}
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const searchBox = document.getElementById('searchBox');
    const prioritySort = document.getElementById('priority-sort');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', renderScans);
    }
    
    if (searchBox) {
        searchBox.addEventListener('input', renderScans);
    }
    
    if (prioritySort) {
        prioritySort.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderScans();
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Chart rendering functions
function renderCharts() {
    renderScanTypeChart();
    renderConfidenceChart();
    renderPriorityChart();
    renderStatusChart();
    renderBodyPartsChart();
    renderDateChart();
}

// Scan Types Pie Chart
function renderScanTypeChart() {
    const scanTypes = {};
    scansData.forEach(scan => {
        scanTypes[scan.scanType] = (scanTypes[scan.scanType] || 0) + 1;
    });

    const ctx = document.getElementById('scanTypeChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(scanTypes),
            datasets: [{
                data: Object.values(scanTypes),
                backgroundColor: [
                    '#3b82f6', // Blue
                    '#10b981', // Green
                    '#f59e0b', // Amber
                    '#ef4444', // Red
                    '#8b5cf6', // Purple
                    '#06b6d4'  // Cyan
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// AI Confidence Distribution Bar Chart
function renderConfidenceChart() {
    const confidenceRanges = {
        '90-100%': 0,
        '80-89%': 0,
        '70-79%': 0,
        '60-69%': 0,
        '<60%': 0
    };

    scansData.forEach(scan => {
        const confidence = scan.priority?.confidence || 0;
        if (confidence >= 90) confidenceRanges['90-100%']++;
        else if (confidence >= 80) confidenceRanges['80-89%']++;
        else if (confidence >= 70) confidenceRanges['70-79%']++;
        else if (confidence >= 60) confidenceRanges['60-69%']++;
        else confidenceRanges['<60%']++;
    });

    const ctx = document.getElementById('confidenceChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(confidenceRanges),
            datasets: [{
                label: 'Number of Scans',
                data: Object.values(confidenceRanges),
                backgroundColor: [
                    '#10b981', // High confidence - Green
                    '#3b82f6', // Good confidence - Blue
                    '#f59e0b', // Medium confidence - Amber
                    '#f97316', // Low confidence - Orange
                    '#ef4444'  // Very low confidence - Red
                ],
                borderColor: [
                    '#059669',
                    '#2563eb',
                    '#d97706',
                    '#ea580c',
                    '#dc2626'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} scans with ${context.label} confidence`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Priority Levels Pie Chart
function renderPriorityChart() {
    const priorities = { urgent: 0, high: 0, medium: 0, low: 0 };
    scansData.forEach(scan => {
        const level = scan.priority?.level || 'low';
        if (priorities.hasOwnProperty(level)) {
            priorities[level]++;
        }
    });

    const ctx = document.getElementById('priorityChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [priorities.urgent, priorities.high, priorities.medium, priorities.low],
                backgroundColor: [
                    '#dc2626', // Urgent - Red
                    '#ea580c', // High - Orange
                    '#ca8a04', // Medium - Yellow
                    '#059669'  // Low - Green
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((context.raw / total) * 100);
                            return `${context.label}: ${context.raw} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Status Overview Bar Chart
function renderStatusChart() {
    const statuses = {};
    scansData.forEach(scan => {
        statuses[scan.status] = (statuses[scan.status] || 0) + 1;
    });

    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(statuses),
            datasets: [{
                label: 'Number of Scans',
                data: Object.values(statuses),
                backgroundColor: [
                    '#f59e0b', // Pending - Amber
                    '#3b82f6', // In Progress - Blue
                    '#10b981'  // Completed - Green
                ],
                borderColor: [
                    '#d97706',
                    '#2563eb',
                    '#059669'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Body Parts Horizontal Bar Chart
function renderBodyPartsChart() {
    const bodyParts = {};
    scansData.forEach(scan => {
        bodyParts[scan.bodyPart] = (bodyParts[scan.bodyPart] || 0) + 1;
    });

    const ctx = document.getElementById('bodyPartsChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bodyParts),
            datasets: [{
                label: 'Number of Scans',
                data: Object.values(bodyParts),
                backgroundColor: '#8b5cf6',
                borderColor: '#7c3aed',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Scans by Date Line Chart
function renderDateChart() {
    const dates = {};
    scansData.forEach(scan => {
        const date = new Date(scan.scanDate).toISOString().split('T')[0];
        dates[date] = (dates[date] || 0) + 1;
    });

    // Sort dates
    const sortedDates = Object.keys(dates).sort();
    const sortedCounts = sortedDates.map(date => dates[date]);

    const ctx = document.getElementById('dateChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedDates.map(date => new Date(date).toLocaleDateString()),
            datasets: [{
                label: 'Scans per Day',
                data: sortedCounts,
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}
