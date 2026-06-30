const fs = require('fs');
const path = require('path');

const filesToFix = [
  'teacher/page.tsx',
  'principal/page.tsx',
  'student/page.tsx',
  'superadmin/page.tsx'
];

const basePath = path.join(__dirname, 'frontend', 'src', 'app');

filesToFix.forEach(relPath => {
  const fullPath = path.join(basePath, relPath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Find the export default function ...
  const match = content.match(/export default function ([A-Za-z0-9_]+)\s*\(/);
  if (match) {
    const originalName = match[1];
    const newName = originalName + 'Content';
    
    // Replace export default function with function
    content = content.replace(match[0], `function ${newName}(`);
    
    // Check if React, { Suspense } is imported, else add Suspense
    if (!content.includes('Suspense')) {
        content = content.replace(/import React(?:, \{[^}]*\})? from 'react';/, (m) => {
            if (m === "import React from 'react';") {
                return "import React, { Suspense } from 'react';";
            }
            return m.replace('}', ', Suspense }');
        });
        if (!content.includes('Suspense')) {
            // fallback if import React from 'react' is not found
            content = "import { Suspense } from 'react';\n" + content;
        }
    }

    // Append the wrapper
    const wrapper = `
export default function ${originalName}() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <${newName} />
    </Suspense>
  );
}
`;
    content += wrapper;
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed ${relPath}`);
  }
});
