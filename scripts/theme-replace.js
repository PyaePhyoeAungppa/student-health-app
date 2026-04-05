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

            // Replace gradient inline styles
            content = content.replace(/199,89%,48%/g, '150,60%,45%');
            content = content.replace(/262,83%,58%/g, '170,60%,45%');
            content = content.replace(/199, 89%, 60%/g, '150, 60%, 55%');
            content = content.replace(/262, 83%, 70%/g, '170, 60%, 55%');
            
            // Replace css variables
            content = content.replace(/--primary: 199 89% 48%;/g, '--primary: 150 60% 45%;');
            content = content.replace(/--accent: 262 83% 58%;/g, '--accent: 170 60% 45%;');
            content = content.replace(/--ring: 199 89% 48%;/g, '--ring: 150 60% 45%;');
            
            // Also adjust backgrounds to be a bit softer so it matches the green
            content = content.replace(/background: linear-gradient\(135deg, hsl\(222, 47%, 9%\) 0%, hsl\(240, 30%, 12%\) 100%\);/g, 'background: linear-gradient(135deg, hsl(160, 20%, 9%) 0%, hsl(150, 15%, 12%) 100%);');

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated colors in: ${fullPath}`);
            }
        }
    }
}

traverseAndReplace(srcDir);
console.log("Color replacement complete.");
