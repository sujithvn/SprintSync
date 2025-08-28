import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, '../dist');

function addJSExtensions(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      addJSExtensions(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Replace relative imports without .js extension
      // First, handle directory imports (like ./server -> ./server/index.js)
      content = content.replace(
        /from\s+['"](\.\S+)['"](?=\s*[;\n])/g,
        (match, importPath) => {
          // Skip if already has .js extension
          if (importPath.endsWith('.js')) {
            return match;
          }
          
          // Check if this import points to a directory that should have /index.js
          // Common directory patterns: ./controllers, ./middlewares, etc.
          if (importPath.match(/\.\/(controllers|middlewares|routes|utils|models)$/)) {
            return `from '${importPath}/index.js'`;
          }
          
          // Otherwise, add .js extension
          return `from '${importPath}.js'`;
        }
      );

      // Handle dynamic imports
      content = content.replace(
        /import\s*\(\s*['"](\.\S+)['"]\s*\)/g,
        (match, importPath) => {
          if (importPath.endsWith('.js')) {
            return match;
          }
          
          if (importPath.match(/\.\/(controllers|middlewares|routes|utils|models)$/)) {
            return `import('${importPath}/index.js')`;
          }
          
          return `import('${importPath}.js')`;
        }
      );

      fs.writeFileSync(filePath, content);
    }
  }
}

if (fs.existsSync(distDir)) {
  addJSExtensions(distDir);
  console.log('✅ Added .js extensions to compiled imports');
} else {
  console.log('❌ dist directory not found');
}
