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

            if (fullPath.endsWith('globals.css')) {
                // Background & Foreground
                content = content.replace(/--background: [^;]+;/g, '--background: 0 0% 99%;');
                content = content.replace(/--foreground: [^;]+;/g, '--foreground: 222 47% 11%;');
                // Card
                content = content.replace(/--card: [^;]+;/g, '--card: 0 0% 100%;');
                content = content.replace(/--card-foreground: [^;]+;/g, '--card-foreground: 222 47% 11%;');
                // Popover
                content = content.replace(/--popover: [^;]+;/g, '--popover: 0 0% 100%;');
                content = content.replace(/--popover-foreground: [^;]+;/g, '--popover-foreground: 222 47% 11%;');
                // Secondary/Muted
                content = content.replace(/--secondary: [^;]+;/g, '--secondary: 210 40% 96%;');
                content = content.replace(/--secondary-foreground: [^;]+;/g, '--secondary-foreground: 222 47% 11%;');
                content = content.replace(/--muted: [^;]+;/g, '--muted: 210 40% 96%;');
                content = content.replace(/--muted-foreground: [^;]+;/g, '--muted-foreground: 215 16% 47%;');
                // Borders & Inputs
                content = content.replace(/--border: [^;]+;/g, '--border: 214 32% 91%;');
                content = content.replace(/--input: [^;]+;/g, '--input: 214 32% 91%;');
                
                // Body Background Linear Gradient
                content = content.replace(/background: linear-gradient\(135deg, hsl\(160, 20%, 9%\) 0%, hsl\(150, 15%, 12%\) 100%\);/g, 'background: linear-gradient(135deg, hsl(140, 20%, 97%) 0%, hsl(160, 25%, 98%) 100%);');
                // Previous body backgrounds just in case
                content = content.replace(/background: linear-gradient\(135deg, hsl\(222, 47%, 9%\) 0%, hsl\(240, 30%, 12%\) 100%\);/g, 'background: linear-gradient(135deg, hsl(140, 20%, 97%) 0%, hsl(160, 25%, 98%) 100%);');

                // Glass card styling
                content = content.replace(/@apply rounded-xl border border-white\/10;/g, '@apply rounded-xl border border-black/5 shadow-sm;');
                content = content.replace(/background: rgba\(255, 255, 255, 0.05\);/g, 'background: rgba(255, 255, 255, 0.7);');
                
                // Sidebar hover styling
                content = content.replace(/hover:bg-white\/5;/g, 'hover:bg-black/[0.03];');
                content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-black/[0.02]');
                
                // Scrollbar
                content = content.replace(/background: hsl\(var\(--background\)\);/g, 'background: transparent;');
                content = content.replace(/background: hsl\(var\(--border\)\);/g, 'background: hsl(0 0% 80%);');
                
                // Glow text
                content = content.replace(/text-shadow: 0 0 10px hsla\(var\(--primary\), 0\.5\);/g, 'text-shadow: none;');

            } else {
                // In TSX files
                content = content.replace(/bg-white\/5/g, 'bg-black/5');
                content = content.replace(/bg-white\/10/g, 'bg-black/10');
                content = content.replace(/border-white\/10/g, 'border-black/5');
                content = content.replace(/hover:bg-white\/10/g, 'hover:bg-black/10');
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated light mode in: ${fullPath}`);
            }
        }
    }
}

traverseAndReplace(srcDir);
console.log("Light mode switch complete.");
