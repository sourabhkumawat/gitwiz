const fs = require('fs');
const path = require('path');
const os = require('os');

const tempDir = os.tmpdir();
const commitLogPath = path.join(tempDir, 'commit-log.json');
const featuresPath = path.join(tempDir, 'features.json');

// Initialize the commit log JSON file
const initializeCommitLog = () => {
  const initialData = {};
  fs.writeFileSync(commitLogPath, JSON.stringify(initialData, null, 2), 'utf8');
  console.log(`Initialized commit log at ${commitLogPath}`);
};

// Initialize the features JSON file
const initializeFeatures = () => {
  const featuresData = { features: [] };
  fs.writeFileSync(featuresPath, JSON.stringify(featuresData, null, 2), 'utf8');
  console.log(`Initialized features at ${featuresPath}`);
};

initializeCommitLog();
initializeFeatures();
