const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/Users/USER/Desktop/wesbte/bulusan-tourism/src');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // CSS blocks
    content = content.replace(/background:\s*(?:white|#fff|#ffffff)(;| !important)/gi, 'background: var(--surface-bg)$1');
    content = content.replace(/background-color:\s*(?:white|#fff|#ffffff)(;| !important)/gi, 'background-color: var(--surface-bg)$1');
    
    // Inline styles (React)
    content = content.replace(/background:\s*['"](?:white|#fff|#ffffff)['"]/gi, "background: 'var(--surface-bg)'");
    content = content.replace(/backgroundColor:\s*['"](?:white|#fff|#ffffff)['"]/gi, "backgroundColor: 'var(--surface-bg)'");

    // Text colors CSS
    content = content.replace(/color:\s*#1e293b(;| !important)/gi, 'color: var(--text-dark)$1');
    content = content.replace(/color:\s*#0b2147(;| !important)/gi, 'color: var(--dark-blue)$1');
    content = content.replace(/color:\s*#64748b(;| !important)/gi, 'color: var(--text-light)$1');

    // Text colors inline
    content = content.replace(/color:\s*['"]#1e293b['"]/gi, "color: 'var(--text-dark)'");
    content = content.replace(/color:\s*['"]#0b2147['"]/gi, "color: 'var(--dark-blue)'");
    content = content.replace(/color:\s*['"]#64748b['"]/gi, "color: 'var(--text-light)'");

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
