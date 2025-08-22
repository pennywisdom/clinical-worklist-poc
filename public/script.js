// DOM Elements
const scanList = document.getElementById('scanList');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const totalScansEl = document.getElementById('totalScans');
const pendingReviewEl = document.getElementById('pendingReview');
const urgentPriorityEl = document.getElementById('urgentPriority');
const statusFilter = document.getElementById('statusFilter');
const searchBox = document.getElementById('searchBox');
const modal = document.getElementById('scanModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.querySelector('.close-button');

let allScans = [];
let scanTypeChart, confidenceChart;

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

async function loadScans() {
    showLoadingState();
    try {
        const response = await fetch('/api/scans');
        if (!response.ok) throw new Error('Failed to fetch scans');
        allScans = await response.json();
        
        renderDashboard(allScans);
    } catch (error) {
        console.error('Error loading scans:', error);
        showEmptyState('Failed to load data.');
    } finally {
        hideLoadingState();
    }
}

function filterAndRenderScans() {
    let filteredScans = [...allScans];

    // Status filter
    const status = statusFilter.value;
    if (status !== 'all') {
        filteredScans = filteredScans.filter(scan => scan.status === status);
    }

    // Search filter
    const searchTerm = searchBox.value.toLowerCase();
    if (searchTerm) {
        filteredScans = filteredScans.filter(scan => 
            scan.patientId.toLowerCase().includes(searchTerm) ||
            scan.bodyPart.toLowerCase().includes(searchTerm)
        );
    }

    renderScanList(filteredScans);
}

function renderDashboard(scans) {
    updateHeaderStats(scans);
    renderScanList(scans);
    renderCharts(scans);
}

function updateHeaderStats(scans) {
    totalScansEl.textContent = scans.length;
    pendingReviewEl.textContent = scans.filter(s => s.status === 'Pending Review').length;
    urgentPriorityEl.textContent = scans.filter(s => s.priority === 'Urgent').length;
}

function renderScanList(scans) {
    scanList.innerHTML = '';
    if (scans.length === 0) {
        showEmptyState();
        return;
    }
    hideEmptyState();

    scans.forEach(scan => {
        const card = createScanCard(scan);
        scanList.appendChild(card);
    });
}

function createScanCard(scan) {
    const card = document.createElement('div');
    card.className = 'scan-card';
    card.dataset.scanId = scan.scanId;
    card.addEventListener('click', () => openModal(scan.scanId));

    const priorityClass = `priority-${scan.priority.replace(/\s+/g, '-')}`;
    const statusClass = `status-${scan.status.replace(/\s+/g, '-')}`;

    card.innerHTML = `
        <div class="scan-card-header">
            <h3>${scan.bodyPart} (${scan.scanType})</h3>
            <span class="priority-badge ${priorityClass}">${scan.priority}</span>
        </div>
        <div class="scan-card-info">
            <p>Patient ID: ${scan.patientId}</p>
            <p>Scan Date: ${new Date(scan.scanDate).toLocaleDateString()}</p>
        </div>
        <div class="ai-diagnosis">
            <p><strong>AI Dx:</strong> ${scan.aiPreliminaryDiagnosis}</p>
            <div class="confidence-bar">
                <div class="confidence-level" style="width: ${scan.aiConfidenceScore * 100}%"></div>
            </div>
        </div>
        <div class="scan-card-footer">
            <span>Assigned: ${scan.assignedRadiologist}</span>
            <span class="status-badge ${statusClass}">${scan.status}</span>
        </div>
    `;
    return card;
}

function renderCharts(scans) {
    // Scan Type Chart
    const scanTypeCtx = document.getElementById('scanTypeChart').getContext('2d');
    const scanTypeCounts = scans.reduce((acc, scan) => {
        acc[scan.scanType] = (acc[scan.scanType] || 0) + 1;
        return acc;
    }, {});

    if (scanTypeChart) scanTypeChart.destroy();
    scanTypeChart = new Chart(scanTypeCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(scanTypeCounts),
            datasets: [{
                data: Object.values(scanTypeCounts),
                backgroundColor: ['#3b82f6', '#ef4444', '#8b5cf6'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Confidence Score Chart
    const confidenceCtx = document.getElementById('confidenceChart').getContext('2d');
    const confidenceScores = scans.map(s => s.aiConfidenceScore);
    
    if (confidenceChart) confidenceChart.destroy();
    confidenceChart = new Chart(confidenceCtx, {
        type: 'bar',
        data: {
            labels: scans.map(s => s.scanId.slice(-5)),
            datasets: [{
                label: 'AI Confidence Score',
                data: confidenceScores,
                backgroundColor: confidenceScores.map(score => score > 0.9 ? '#10b981' : score > 0.8 ? '#f59e0b' : '#ef4444'),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 1 } },
            plugins: { legend: { display: false } }
        }
    });
}

async function openModal(scanId) {
    try {
        const response = await fetch(`/api/scans/${scanId}`);
        if (!response.ok) throw new Error('Failed to fetch scan details');
        const scan = await response.json();

        modalBody.innerHTML = createModalContent(scan);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error opening modal:', error);
    }
}

function createModalContent(scan) {
    const statusClass = `status-${scan.status.replace(/\s+/g, '-')}`;
    return `
        <div class="modal-image-container">
            <img src="${scan.imageUrl}" alt="Scan of ${scan.bodyPart}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">
        </div>
        <div class="modal-details">
            <h2>${scan.bodyPart} - ${scan.scanType}</h2>
            <div class="info-grid">
                <div class="info-item"><h4>Patient ID</h4><p>${scan.patientId}</p></div>
                <div class="info-item"><h4>Scan Date</h4><p>${new Date(scan.scanDate).toLocaleString()}</p></div>
                <div class="info-item"><h4>Assigned Radiologist</h4><p>${scan.assignedRadiologist}</p></div>
                <div class="info-item"><h4>Status</h4><p><span class="status-badge ${statusClass}">${scan.status}</span></p></div>
            </div>
            <div class="ai-section">
                <h4>AI Preliminary Analysis</h4>
                <p>${scan.aiPreliminaryDiagnosis}</p>
                <div class="ai-confidence">
                    <p>Confidence:</p>
                    <div class="confidence-bar-modal">
                        <div class="confidence-level-modal" style="width: ${scan.aiConfidenceScore * 100}%"></div>
                    </div>
                    <span>${(scan.aiConfidenceScore * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div class="radiologist-notes">
                <h4>Radiologist Notes</h4>
                <textarea placeholder="Enter your notes here...">${scan.radiologistNotes || ''}</textarea>
            </div>
            <div class="modal-actions">
                <select class="action-status-select">
                    <option value="Pending Review" ${scan.status === 'Pending Review' ? 'selected' : ''}>Pending Review</option>
                    <option value="Reviewed" ${scan.status === 'Reviewed' ? 'selected' : ''}>Reviewed</option>
                    <option value="Requires Consultation" ${scan.status === 'Requires Consultation' ? 'selected' : ''}>Requires Consultation</option>
                </select>
                <button class="action-button save-button">Save & Close</button>
            </div>
        </div>
    `;
}

function closeModal() {
    modal.style.display = 'none';
    modalBody.innerHTML = '';
}

// UI State Functions
function showLoadingState() {
    loadingState.style.display = 'block';
    scanList.style.display = 'none';
    emptyState.style.display = 'none';
}

function hideLoadingState() {
    loadingState.style.display = 'none';
    scanList.style.display = 'grid';
}

function showEmptyState(message = 'No scans found for the selected criteria.') {
    emptyState.querySelector('p').textContent = message;
    emptyState.style.display = 'block';
    scanList.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

// Utility Functions
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

