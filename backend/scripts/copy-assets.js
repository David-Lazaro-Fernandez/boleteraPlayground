const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const files = fs.readdirSync(src);
  
  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

// Copiar templates
const templatesDir = path.join(__dirname, '..', 'src', 'templates');
const distTemplatesDir = path.join(__dirname, '..', 'dist', 'templates');

if (fs.existsSync(templatesDir)) {
  copyDir(templatesDir, distTemplatesDir);
  console.log('Templates copied successfully');
} else {
  console.log('Templates directory not found');
}

// Copiar configuración de assets
const assetsConfigPath = path.join(__dirname, '..', 'src', 'config', 'assets.json');
const distConfigDir = path.join(__dirname, '..', 'dist', 'config');
const distAssetsConfigPath = path.join(distConfigDir, 'assets.json');

if (fs.existsSync(assetsConfigPath)) {
  if (!fs.existsSync(distConfigDir)) {
    fs.mkdirSync(distConfigDir, { recursive: true });
  }
  fs.copyFileSync(assetsConfigPath, distAssetsConfigPath);
  console.log('Assets config copied successfully');
} else {
  console.log('Assets config not found - will use empty config');
} 