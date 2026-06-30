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
  
  if (content.includes('"use client";') && !content.startsWith('"use client";')) {
      content = content.replace(/"use client";\r?\n?/g, '');
      content = '"use client";\n' + content;
      fs.writeFileSync(fullPath, content);
      console.log(`Fixed use client in ${relPath}`);
  }
});
