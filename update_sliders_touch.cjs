const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/components/physics/ContextPanel.vue',
  'src/components/physics/ShapeEditorModal.vue',
  'src/components/KinematicsSimulator.vue'
];

for (const file of filesToProcess) {
  const absolutePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) continue;
  
  let content = fs.readFileSync(absolutePath, 'utf8');
  
  // Add touch-none to type="range" if not present
  content = content.replace(/(<input[^>]*type="range"[^>]*class=")([^"]*)(")/g, (match, p1, p2, p3) => {
    if (!p2.includes('touch-none')) {
      return p1 + p2 + ' touch-none' + p3;
    }
    return match;
  });

  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
