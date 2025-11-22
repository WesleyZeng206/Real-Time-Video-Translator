// Simple script to create placeholder icons
// In production, you should create proper icon images

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create placeholder text files (replace with actual PNG images in production)
const sizes = [16, 48, 128];

sizes.forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  const message = `Placeholder for ${size}x${size} icon. Replace with actual PNG image.`;
  fs.writeFileSync(iconPath, message);
});

console.log('Placeholder icons created. Please replace with actual PNG images.');
