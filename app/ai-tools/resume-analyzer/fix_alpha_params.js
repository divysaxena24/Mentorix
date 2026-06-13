const fs = require('fs');
const path = 'app/ai-tools/resume-analyzer/ResumeAnalyzerClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix: remove alpha parameter from setDrawColor calls (jsPDF doesn't accept 4th param)
content = content.replace(
  'doc.setDrawColor(34, 197, 94, 0.3)',
  'doc.setDrawColor(34, 197, 94)'
);

content = content.replace(
  'doc.setDrawColor(239, 68, 68, 0.3)',
  'doc.setDrawColor(239, 68, 68)'
);

content = content.replace(
  'doc.setDrawColor(34, 197, 94, 0.4)',
  'doc.setDrawColor(34, 197, 94)'
);

content = content.replace(
  'doc.setDrawColor(239, 68, 68, 0.4)',
  'doc.setDrawColor(239, 68, 68)'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Alpha fix applied successfully');
