const fs = require('fs');
const path = require('path');

const dirsToClean = [
  path.join(process.cwd(), '.next'),
  path.join(process.cwd(), 'node_modules', '.cache'),
  path.join(process.cwd(), '.next', 'cache'),
  // Note: node_modules/.prisma is NOT a cache - it's generated Prisma client, don't delete it
];

const filesToClean = [
  path.join(process.cwd(), 'tsconfig.tsbuildinfo'),
  path.join(process.cwd(), '.eslintcache'),
];

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    console.log(`Removing ${dir}...`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✓ Removed ${dir}`);
  } else {
    console.log(`✓ ${dir} does not exist, skipping...`);
  }
}

function removeFile(file) {
  if (fs.existsSync(file)) {
    console.log(`Removing ${file}...`);
    fs.unlinkSync(file);
    console.log(`✓ Removed ${file}`);
  } else {
    console.log(`✓ ${file} does not exist, skipping...`);
  }
}

console.log('Cleaning Next.js cache and build files...\n');

dirsToClean.forEach(removeDir);
filesToClean.forEach(removeFile);

console.log('\n✓ Cache cleaned successfully!');

