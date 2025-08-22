const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data from scans.json and priority data
let scansData = [];
let priorityData = {};

try {
  const scansJson = fs.readFileSync(path.join(__dirname, 'scans.json'), 'utf8');
  scansData = JSON.parse(scansJson);
  
  const priorityJson = fs.readFileSync(path.join(__dirname, 'priority-data.json'), 'utf8');
  priorityData = JSON.parse(priorityJson);
} catch (error) {
  console.error("Error reading or parsing JSON files:", error);
}

// AI Priority Calculation Function
function calculateAIPriority(scan) {
    const { description, bodyPart, scanType, findings } = scan;
    const searchText = `${description} ${bodyPart} ${scanType} ${findings}`.toLowerCase();
    
    let highestPriority = { priority: 'low', score: 0, reasoning: 'Routine study' };
    
    for (const rule of priorityData.priorityRules || []) {
        const matchCount = rule.keywords.filter(keyword => 
            searchText.includes(keyword.toLowerCase())
        ).length;
        
        if (matchCount > 0 && rule.score > highestPriority.score) {
            highestPriority = {
                priority: rule.priority,
                score: rule.score,
                reasoning: rule.reasoning
            };
        }
    }
    
    return highestPriority;
}

// Enrich scans with AI analysis if not already present
scansData = scansData.map(scan => {
    if (!scan.priority) {
        const aiPriority = calculateAIPriority(scan);
        const aiAnalysis = priorityData.aiAnalysis[scan.scanId] || {
            aiFindings: "AI analysis in progress...",
            confidence: 50,
            keyStructures: [],
            recommendations: "Clinical correlation recommended"
        };
        
        scan.priority = {
            level: aiPriority.priority,
            score: aiPriority.score,
            aiAnalysis: aiAnalysis.aiFindings,
            confidence: aiAnalysis.confidence,
            flags: ["automated_analysis"]
        };
    }
    return scan;
});


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all scans
app.get('/api/scans', (req, res) => {
  // Sort by priority first (urgent, high, medium, low), then by date
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  const sortedScans = scansData.sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority.level] - priorityOrder[a.priority.level];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, sort by score
    if (b.priority.score !== a.priority.score) {
      return b.priority.score - a.priority.score;
    }
    
    // If same priority and score, sort by date
    return new Date(b.scanDate) - new Date(a.scanDate);
  });
  res.json(sortedScans);
});

// Get a single scan by ID
app.get('/api/scans/:id', (req, res) => {
    const scan = scansData.find(s => s.scanId === req.params.id);
    if (scan) {
        res.json(scan);
    } else {
        res.status(404).json({ error: 'Scan not found' });
    }
});

// Update a scan status (example of interaction)
app.patch('/api/scans/:id', (req, res) => {
    const { status } = req.body;
    const scanIndex = scansData.findIndex(s => s.scanId === req.params.id);

    if (scanIndex === -1) {
        return res.status(404).json({ error: 'Scan not found' });
    }

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    scansData[scanIndex].status = status;
    scansData[scanIndex].reviewTimestamp = new Date();

    res.json(scansData[scanIndex]);
});


app.listen(PORT, () => {
  console.log(`🚀 AI-Assisted Orthopedic Imaging Dashboard running on http://localhost:${PORT}`);
});
