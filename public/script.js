// Medical Scanner Loading System
const loadingMessages = [
    'INITIALIZING MEDICAL SYSTEMS...',
    'LOADING AI TRIAGE PROTOCOLS...',
    'SYSTEM READY - WELCOME MEDICAL TEAM'
];

function typewriterEffect(element, text, speed = 50) {
    return new Promise((resolve) => {
        let i = 0;
        element.textContent = '';
        const timer = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(timer);
                resolve();
            }
        }, speed);
    });
}

async function runMedicalLoader() {
    const loaderElement = document.getElementById('medical-loader');
    const typewriterElement = document.getElementById('loading-typewriter');
    
    if (!loaderElement || !typewriterElement) {
        console.error('Medical loader elements not found');
        // Fallback: initialize app immediately
        init();
        return;
    }
    
    try {
        console.log('Starting medical loader...');
        
        // Run through all loading messages quickly
        for (let i = 0; i < loadingMessages.length; i++) {
            await typewriterEffect(typewriterElement, loadingMessages[i], 30);
            
            // Very short pause between messages
            if (i < loadingMessages.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        
        console.log('Loading messages complete, starting fade out...');
        
        // Very short final pause before fade out
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Quick fade out
        loaderElement.style.transition = 'opacity 0.5s ease-out';
        loaderElement.style.opacity = '0';
        
        // Remove from DOM after quick fade
        setTimeout(() => {
            if (loaderElement.parentNode) {
                loaderElement.remove();
            }
            console.log('Medical loader removed');
            // Initialize app first, then trigger banner animation
            init().then(() => {
                triggerBannerCelebration();
            });
        }, 500);
        
    } catch (error) {
        console.error('Error in medical loader:', error);
        // Fallback: remove loader immediately if there's an error
        if (loaderElement && loaderElement.parentNode) {
            loaderElement.remove();
        }
        init();
    }
}

// Start medical loader when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting medical loader...');
    runMedicalLoader();
});

// Main application variables
let scansData = [];
let currentSort = 'priority';
const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

// Initialize the app
async function init() {
    console.log('Initializing main app...');
    try {
        setupEventListeners();
        await loadData();
        filterAndRenderScans();
        renderCharts();
        console.log('App initialization complete');
        return Promise.resolve();
    } catch (error) {
        console.error('Error initializing app:', error);
        showEmptyState('Failed to load scan data. Please refresh the page.');
        return Promise.reject(error);
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
    
    renderScans(filteredScans);
    updateStats();
    updatePriorityDashboard();
}

// Render scans with enhanced AI triage highlighting and improved buttons
function renderScans(scans) {
    console.log('renderScans called with', scans.length, 'scans');
    const scansList = document.getElementById('scansList');
    
    if (!scansList) {
        console.error('scansList container not found');
        return;
    }
    
    if (scans.length === 0) {
        console.log('No scans to render, showing empty state');
        showEmptyState('No scans found matching the current filter.');
        return;
    }
    
    console.log('Rendering', scans.length, 'scans to container');
    
    scansList.innerHTML = scans.map(scan => {
        // Handle priority data structure - it's an object with level property
        const priorityLevel = scan.priority?.level || scan.priority || 'medium';
        const priorityScore = scan.priority?.score || 50;
        const confidence = scan.priority?.confidence || 85;
        
        return `
        <div class="scan-card ${priorityLevel}" data-scan-id="${scan.scanId}">
            <div class="scan-header">
                <div class="scan-meta">
                    <div class="scan-date">${new Date(scan.scanDate).toLocaleDateString()}</div>
                </div>
                <div class="scan-id">ID: ${scan.scanId}</div>
            </div>
            
            <!-- AI Triage Section - Highlighted with Priority -->
            <div class="ai-triage-section">
                <div class="ai-header">
                    <span class="ai-badge">🧠 AI TRIAGE</span>
                    <div class="priority-badge ${priorityLevel}">
                        <span class="priority-level">${priorityLevel.toUpperCase()}</span>
                        <span class="priority-score">${priorityScore}%</span>
                    </div>
                </div>
                <div class="ai-metrics">
                    <div class="confidence-indicator">Confidence: ${confidence}%</div>
                    <div class="ai-score">
                        <span class="score-label">Risk Assessment:</span>
                        <span class="score-value priority-${priorityLevel}">${priorityScore}/100</span>
                    </div>
                    <div class="ai-recommendation-preview">
                        ${scan.priority?.aiAnalysis ? scan.priority.aiAnalysis.substring(0, 80) + '...' : 'AI analysis available - click for details'}
                    </div>
                </div>
            </div>
            
            <div class="scan-body">
                <div class="patient-section">
                    <h4 class="patient-name">👤 ${scan.patientName}</h4>
                    <div class="patient-details">Age: ${scan.age}y</div>
                </div>
                
                <div class="scan-details">
                    <div class="detail-row">
                        <span class="label">🩻 Scan Type:</span>
                        <span class="value">${scan.scanType}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">🦴 Body Part:</span>
                        <span class="value">${scan.bodyPart}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">🔍 Findings:</span>
                        <span class="value">${scan.findings}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">👨‍⚕️ Consultant:</span>
                        <span class="value">${scan.consultant}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">📋 Status:</span>
                        <span class="value status-${scan.status.toLowerCase().replace(/\s+/g, '-')}">${scan.status}</span>
                    </div>
                </div>
            </div>
            
            <div class="scan-actions">
                <button class="btn btn-primary" onclick="viewScan('${scan.scanId}')">
                    <i class="icon">📋</i> View Details
                </button>
                <button class="btn btn-secondary" onclick="showAIAnalysis('${scan.scanId}')">
                    <i class="icon">🧠</i> AI Analysis
                </button>
                <button class="btn btn-accent" onclick="viewImage('${scan.scanId}')">
                    <i class="icon">🩻</i> View Scan
                </button>
            </div>
        </div>
        `;
    }).join('');
    
    console.log('Scans rendered successfully to DOM');
}

// Show empty state
function showEmptyState(message) {
    const scansList = document.getElementById('scansList');
    if (scansList) {
        scansList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No Scans Found</h3>
                <p>${message}</p>
            </div>
        `;
    }
}

// Update stats
function updateStats() {
    const totalScans = scansData.length;
    const pendingScans = scansData.filter(scan => scan.status === 'Pending Review').length;
    const urgentScans = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'urgent';
    }).length;
    const highPriorityScans = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'high';
    }).length;
    const mediumPriorityScans = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'medium';
    }).length;
    const lowPriorityScans = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'low';
    }).length;
    
    // Update main stats
    const totalScansElement = document.getElementById('totalScans');
    const pendingReviewElement = document.getElementById('pendingReview');
    const urgentPriorityElement = document.getElementById('urgentPriority');
    
    if (totalScansElement) totalScansElement.textContent = totalScans;
    if (pendingReviewElement) pendingReviewElement.textContent = pendingScans;
    if (urgentPriorityElement) urgentPriorityElement.textContent = urgentScans;
    
    // Update priority dashboard
    const urgentCountElement = document.getElementById('urgent-count');
    const highCountElement = document.getElementById('high-count');
    const mediumCountElement = document.getElementById('medium-count');
    const lowCountElement = document.getElementById('low-count');
    
    if (urgentCountElement) urgentCountElement.textContent = urgentScans;
    if (highCountElement) highCountElement.textContent = highPriorityScans;
    if (mediumCountElement) mediumCountElement.textContent = mediumPriorityScans;
    if (lowCountElement) lowCountElement.textContent = lowPriorityScans;
}

// Update priority dashboard
function updatePriorityDashboard() {
    const urgentCount = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'urgent';
    }).length;
    const highCount = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'high';
    }).length;
    const mediumCount = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'medium';
    }).length;
    const lowCount = scansData.filter(scan => {
        const priority = scan.priority?.level || scan.priority;
        return priority === 'low';
    }).length;
    
    const urgentElement = document.getElementById('urgent-count');
    const highElement = document.getElementById('high-count');
    const mediumElement = document.getElementById('medium-count');
    const lowElement = document.getElementById('low-count');
    
    if (urgentElement) urgentElement.textContent = urgentCount;
    if (highElement) highElement.textContent = highCount;
    if (mediumElement) mediumElement.textContent = mediumCount;
    if (lowElement) lowElement.textContent = lowCount;
}

// Enhanced View scan with full-width modal and AI dashboard
function viewScan(scanId) {
    const scan = scansData.find(s => s.scanId === scanId);
    if (!scan) return;
    
    const modal = document.getElementById('scanModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Use image path from scan data, or fallback to mapping
    const imagePath = scan.image || (() => {
        const imageMap = {
            'Left Ankle': 'images/left_ankle.png',
            'Left Shoulder': 'images/left_shoulder.png',
            'Right Foot': 'images/right_foot.png',
            'Right Knee': 'images/right_knee.png',
            'Right Wrist': 'images/right_wrist.png',
            'Left Hip': 'images/left_hip.png'
        };
        return imageMap[scan.bodyPart] || 'images/placeholder.png';
    })();

    modalContent.innerHTML = `
        <div class="modal-full-width-content">
            <div class="modal-header">
                <h2>📋 Scan Details - ${scan.patientName}</h2>
                <span class="close" onclick="closeModal('scanModal')">&times;</span>
            </div>
            
            <!-- Scan Image Section -->
            <div class="modal-section">
                <h3>🩻 Scan Image</h3>
                <div class="scan-image-container">
                    <div class="modal-scan-image">
                        <img src="${imagePath}" alt="${scan.bodyPart} X-Ray">
                    </div>
                    <div class="scan-image-info">
                        <p><strong>Body Part:</strong> ${scan.bodyPart}</p>
                        <p><strong>Scan Type:</strong> ${scan.scanType || 'X-Ray'}</p>
                        <p><strong>Date Taken:</strong> ${new Date(scan.scanDate).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
            
            <!-- AI Dashboard Section -->
            <div class="ai-dashboard">
                <h3>🧠 AI Triage Analysis</h3>
                <div class="ai-dashboard-content">
                    <div class="ai-metric-card">
                        <h4>Priority Assessment</h4>
                        <div class="priority-badge ${scan.priority?.level || 'medium'}">
                            ${(scan.priority?.level || 'medium').toUpperCase()} - ${scan.priority?.score || 50}%
                        </div>
                        <p>Confidence: ${scan.priority?.confidence || 85}%</p>
                    </div>
                    <div class="ai-metric-card">
                        <h4>Clinical Priority</h4>
                        <p>${(scan.priority?.level || 'medium').toUpperCase()}</p>
                    </div>
                    <div class="ai-metric-card">
                        <h4>Response Time</h4>
                        <p>${scan.priority?.level === 'urgent' ? 'Immediate' : scan.priority?.level === 'high' ? 'Same Day' : 'Standard'}</p>
                    </div>
                </div>
            </div>
            <!-- Patient & Scan Information -->
            <div class="modal-section">
                <h3>👤 Patient & Scan Details</h3>
                <div class="modal-content-grid">
                    <div class="detail-row">
                        <span class="label">Name:</span>
                        <span class="value">${scan.patientName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Age:</span>
                        <span class="value">${scan.age}y</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Body Part:</span>
                        <span class="value">${scan.bodyPart}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${new Date(scan.scanDate).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span>
                        <span class="value status-${scan.status.toLowerCase().replace(/\s+/g, '-')}">${scan.status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Consultant:</span>
                        <span class="value">${scan.consultant}</span>
                    </div>
                </div>
            </div>
            
            <!-- Findings -->
            <div class="modal-section">
                <h3>🔍 Clinical Findings</h3>
                <div class="findings-content">
                    <p>${scan.findings}</p>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="showAIAnalysis('${scan.scanId}')">
                    <i class="icon">🧠</i> View AI Analysis
                </button>
                <button class="btn btn-accent" onclick="viewImage('${scan.scanId}')">
                    <i class="icon">🩻</i> View Image
                </button>
                <button class="btn btn-secondary" onclick="closeModal('scanModal')">
                    <i class="icon">❌</i> Close
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Enhanced AI Analysis with full dashboard
function showAIAnalysis(scanId) {
    const scan = scansData.find(s => s.scanId === scanId);
    if (!scan) return;
    
    const modal = document.getElementById('aiModal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Generate mock AI analysis if not present
    const aiAnalysis = scan.priority?.aiAnalysis || 'Comprehensive AI analysis indicates standard orthopedic assessment required with attention to patient comfort and mobility.';
    const confidence = scan.priority?.confidence || 85;
    const priorityScore = scan.priority?.score || 50;
    
    modalContent.innerHTML = `
        <div class="modal-full-width-content">
            <div class="modal-header">
                <h2>🧠 AI Analysis - ${scan.patientName}</h2>
                <span class="close" onclick="closeModal('aiModal')">&times;</span>
            </div>
            
            <!-- AI Dashboard Section -->
            <div class="ai-dashboard">
                <h3>🧠 Complete AI Triage Assessment</h3>
                <div class="ai-dashboard-content">
                    <div class="ai-metric-card">
                        <h4>Overall Priority Score</h4>
                        <div class="score-display">
                            <div class="score-value priority-${scan.priority?.level || 'medium'}">${priorityScore}/100</div>
                            <div class="confidence-badge">Confidence: ${confidence}%</div>
                        </div>
                    </div>
                    <div class="ai-metric-card">
                        <h4>Risk Assessment</h4>
                        <div class="risk-indicators">
                            <div class="risk-item ${scan.priority?.level || 'medium'}">
                                <span>Clinical Priority:</span>
                                <span>${(scan.priority?.level || 'medium').toUpperCase()}</span>
                            </div>
                            <div class="risk-item">
                                <span>Response Required:</span>
                                <span>${scan.priority?.level === 'urgent' ? 'Immediate' : scan.priority?.level === 'high' ? 'Same Day' : 'Standard'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="ai-metric-card">
                        <h4>Treatment Pathway</h4>
                        <p>AI recommends standard clinical review protocol.</p>
                    </div>
                </div>
            </div>
            
            <!-- Clinical Flags -->
            <div class="clinical-flags">
                <h4>🚨 AI-Identified Clinical Flags</h4>
                <div class="flag-item">
                    <span>⚠️</span>
                    <span>Priority: ${(scan.priority?.level || 'medium').toUpperCase()}</span>
                </div>
                <div class="flag-item">
                    <span>🎯</span>
                    <span>Confidence: ${confidence}%</span>
                </div>
            </div>
            
            <!-- Detailed Analysis -->
            <div class="modal-section">
                <h3>📊 AI Analysis Summary</h3>
                <div class="analysis-content">
                    <div class="analysis-section">
                        <h4>Assessment</h4>
                        <p>${aiAnalysis}</p>
                    </div>
                    <div class="analysis-section">
                        <h4>Recommendations</h4>
                        <ul>
                            <li>Continue with ${scan.consultant} consultation</li>
                            <li>Follow standard ${scan.bodyPart.toLowerCase()} protocols</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Actions -->
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="viewScan('${scan.scanId}')">
                    <i class="icon">📋</i> View Full Scan Details
                </button>
                <button class="btn btn-accent" onclick="viewImage('${scan.scanId}')">
                    <i class="icon">🩻</i> View Image
                </button>
                <button class="btn btn-secondary" onclick="closeModal('aiModal')">
                    <i class="icon">❌</i> Close
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// View image
function viewImage(scanId) {
    const scan = scansData.find(s => s.scanId === scanId);
    if (!scan) return;
    
    const modal = document.getElementById('imageModal');
    if (!modal) return;
    
    const modalBody = document.getElementById('imageModalBody');
    if (!modalBody) return;
    
    // Use image path from scan data, or fallback to mapping
    const imagePath = scan.image || (() => {
        const imageMap = {
            'Left Ankle': 'images/left_ankle.png',
            'Left Shoulder': 'images/left_shoulder.png',
            'Right Foot': 'images/right_foot.png',
            'Right Knee': 'images/right_knee.png',
            'Right Wrist': 'images/right_wrist.png',
            'Left Hip': 'images/left_hip.png'
        };
        return imageMap[scan.bodyPart] || 'images/placeholder.png';
    })();
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>🩻 ${scan.bodyPart} - ${scan.patientName}</h2>
            <span class="close" onclick="closeModal('imageModal')">&times;</span>
        </div>
        <div class="image-container">
            <img src="${imagePath}" alt="${scan.bodyPart} X-Ray" class="scan-image">
            <div class="image-info">
                <p><strong>Patient:</strong> ${scan.patientName}</p>
                <p><strong>Body Part:</strong> ${scan.bodyPart}</p>
                <p><strong>Date:</strong> ${new Date(scan.scanDate).toLocaleDateString()}</p>
                <p><strong>Findings:</strong> ${scan.findings}</p>
            </div>
        </div>
        <div class="modal-actions">
            <button class="btn btn-primary" onclick="viewScan('${scan.scanId}')">
                <i class="icon">📋</i> View Details
            </button>
            <button class="btn btn-secondary" onclick="showAIAnalysis('${scan.scanId}')">
                <i class="icon">🧠</i> AI Analysis
            </button>
            <button class="btn btn-secondary" onclick="closeModal('imageModal')">
                <i class="icon">❌</i> Close
            </button>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Render charts
function renderCharts() {
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded, skipping chart rendering');
        return;
    }
    
    console.log('Rendering charts with', scansData.length, 'scans');
    renderPriorityChart();
    renderBodyPartsChart();
    renderConfidenceChart();
    renderStatusChart();
    renderScanTypeChart();
    renderDateChart();
}

// Chart rendering functions
function renderPriorityChart() {
    const ctx = document.getElementById('priorityChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const priorityCounts = {
        urgent: scansData.filter(scan => (scan.priority?.level || scan.priority) === 'urgent').length,
        high: scansData.filter(scan => (scan.priority?.level || scan.priority) === 'high').length,
        medium: scansData.filter(scan => (scan.priority?.level || scan.priority) === 'medium').length,
        low: scansData.filter(scan => (scan.priority?.level || scan.priority) === 'low').length
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Urgent', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [priorityCounts.urgent, priorityCounts.high, priorityCounts.medium, priorityCounts.low],
                backgroundColor: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Priority Distribution' }
            }
        }
    });
}

function renderBodyPartsChart() {
    const ctx = document.getElementById('bodyPartsChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const bodyPartCounts = scansData.reduce((acc, scan) => {
        acc[scan.bodyPart] = (acc[scan.bodyPart] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(bodyPartCounts),
            datasets: [{
                label: 'Number of Scans',
                data: Object.values(bodyPartCounts),
                backgroundColor: '#3b82f6',
                borderColor: '#1d4ed8',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Scans by Body Part' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderConfidenceChart() {
    const ctx = document.getElementById('confidenceChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const confidenceData = scansData.map(scan => scan.priority?.confidence || 85);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: scansData.map(scan => scan.scanId),
            datasets: [{
                label: 'AI Confidence %',
                data: confidenceData,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'AI Confidence Levels' }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
}

function renderDateChart() {
    const ctx = document.getElementById('dateChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const dateData = scansData.reduce((acc, scan) => {
        const date = new Date(scan.scanDate).toDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(dateData),
            datasets: [{
                label: 'Scans per Day',
                data: Object.values(dateData),
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Scan Timeline' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderStatusChart() {
    const ctx = document.getElementById('statusChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    const statusData = scansData.reduce((acc, scan) => {
        acc[scan.status] = (acc[scan.status] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusData),
            datasets: [{
                data: Object.values(statusData),
                backgroundColor: ['#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ef4444'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Status Overview' }
            }
        }
    });
}

function renderScanTypeChart() {
    const ctx = document.getElementById('scanTypeChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    // Simple categorization of scan types based on findings
    const scanTypes = scansData.reduce((acc, scan) => {
        const scanType = scan.scanType || 'X-Ray';
        acc[scanType] = (acc[scanType] || 0) + 1;
        return acc;
    }, {});
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(scanTypes),
            datasets: [{
                data: Object.values(scanTypes),
                backgroundColor: ['#dc2626', '#16a34a', '#f59e0b', '#6b7280'],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: 'Scan Types Distribution' }
            }
        }
    });
}
