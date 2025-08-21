const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data from scans.json
let scansData = [];
try {
  const scansJson = fs.readFileSync(path.join(__dirname, 'scans.json'), 'utf8');
  scansData = JSON.parse(scansJson);
} catch (error) {
  console.error("Error reading or parsing scans.json:", error);
}


// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all scans
app.get('/api/scans', (req, res) => {
  // Sort by scan date, newest first
  const sortedScans = scansData.sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate));
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
