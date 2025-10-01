#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create backup directory with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = `backup-${timestamp}`;

console.log('🔄 Creating project backup...');
console.log(`📁 Backup directory: ${backupDir}`);

// Create backup directory
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Files and directories to backup
const itemsToBackup = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'tsconfig.app.json', 
  'tsconfig.node.json',
  'vite.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'eslint.config.js',
  'index.html',
  'src/',
  'supabase/',
  '.env.example'
];

// Copy function
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Backup each item
let backedUpCount = 0;
let skippedCount = 0;

itemsToBackup.forEach(item => {
  const srcPath = path.join(process.cwd(), item);
  const destPath = path.join(backupDir, item);
  
  if (fs.existsSync(srcPath)) {
    try {
      copyRecursive(srcPath, destPath);
      console.log(`✅ Backed up: ${item}`);
      backedUpCount++;
    } catch (error) {
      console.log(`❌ Failed to backup ${item}:`, error.message);
    }
  } else {
    console.log(`⚠️  Skipped (not found): ${item}`);
    skippedCount++;
  }
});

// Create backup info file
const backupInfo = {
  timestamp: new Date().toISOString(),
  backed_up_files: backedUpCount,
  skipped_files: skippedCount,
  backup_directory: backupDir,
  project_name: 'Multi-Tenant Travel Website Builder',
  note: 'Backup created before .env configuration'
};

fs.writeFileSync(
  path.join(backupDir, 'backup-info.json'), 
  JSON.stringify(backupInfo, null, 2)
);

console.log('');
console.log('🎉 Backup completed!');
console.log(`📊 Files backed up: ${backedUpCount}`);
console.log(`⚠️  Files skipped: ${skippedCount}`);
console.log(`📁 Backup location: ./${backupDir}`);
console.log('');
console.log('💡 To restore this backup:');
console.log(`   cp -r ${backupDir}/* ./`);
console.log('');
console.log('✅ Safe to proceed with .env configuration!');