const fs = require('fs');
const path = 'app/ai-tools/resume-analyzer/ResumeAnalyzerClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix 1: Increase Recruiter Verdict card height from 34 to 42 and currentY increment from 38 to 48
content = content.replace(
  'doc.roundedRect(margin, currentY, contentW, 34, 5, 5, \'FD\')',
  'doc.roundedRect(margin, currentY, contentW, 42, 5, 5, \'FD\')'
);

content = content.replace(
  '                currentY += 38',
  '                currentY += 48'
);

// Fix 2: Add suggestedRewrites fallback alongside improvedBullets
content = content.replace(
  "const improvedBullets = exp.improvedBullets || []",
  "const improvedBullets = exp.improvedBullets || exp.suggestedRewrites || []"
);

// Fix 3: Increase Before/After card height from 10mm to 12mm per item
content = content.replace(
  "const baCardH = 16 + maxShow * 10",
  "const baCardH = 16 + maxShow * 12"
);

fs.writeFileSync(path, content, 'utf8');
console.log('All fixes applied successfully');
