const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function traverseAndReplace(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseAndReplace(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace the secondary 'teal' color of the gradient with a complementary soft peach/coral
            content = content.replace(/170,\s*60%,\s*45%/g, '25, 85%, 55%');
            content = content.replace(/170,\s*60%,\s*55%/g, '25, 85%, 65%');
            
            // For CSS vars
            content = content.replace(/--accent:\s*170\s*60%\s*45%;/g, '--accent: 25 85% 55%;');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated complementary color in: ${fullPath}`);
            }
        }
    }
}

traverseAndReplace(srcDir);
console.log("Complementary color update complete.");
