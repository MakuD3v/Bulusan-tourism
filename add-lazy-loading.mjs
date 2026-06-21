import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<img ') && !content.includes('loading="lazy"')) {
    const original = content;
    // Simple regex to add loading="lazy" if not present
    // It looks for <img followed by space, and we replace it with <img loading="lazy" 
    content = content.replace(/<img\s/g, '<img loading="lazy" ');
    if (original !== content) {
      fs.writeFileSync(file, content);
      changed++;
    }
  }
});

console.log(`Updated ${changed} files to add loading="lazy" to images.`);
