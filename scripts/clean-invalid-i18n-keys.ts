import * as fs from 'fs';
import * as path from 'path';

// Load JSON file safely
function loadJsonFile(filePath: string): any | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

// Save JSON file safely
function saveJsonFile(filePath: string, data: any): void {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
    throw error;
  }
}

// Check if a key is invalid
function isInvalidKey(key: string): boolean {
  // Invalid patterns
  if (key.length < 2) return true;
  if (/^[0-9]+$/.test(key)) return true;
  if (/^[^a-zA-Z]/.test(key)) return true;
  if (key.includes('/') && !key.startsWith('modules/')) return true;
  if (key.includes('@')) return true;
  if (key.includes('://')) return true;
  if (key.includes('\\')) return true;
  if (key.startsWith('.')) return true;
  if (key.includes(' ')) return true;
  if (key === 'DD' || key === 'MM' || key === 'YYYY' || key === 'HH' || key === 'mm') return true;
  if (key.match(/^[A-Z]{2,}-[A-Z]{2,}(-[A-Z]{2,})?$/)) return true; // Date formats like YYYY-MM-DD
  if (key.match(/^[A-Z]{2,}\.[A-Z]{2,}\.[A-Z]{2,}$/)) return true; // Date formats like DD.MM.YYYY
  if (key.match(/^[A-Z]{2,} [A-Z]{2,}$/)) return true; // Date formats like MMM YYYY
  if (key === 'csv' || key === 'excel' || key === 'pdf' || key === 'word' || key === 'html' || key === 'print') return true; // Export format keys (should be under export namespace)
  return false;
}

// Recursively clean object
function cleanObject(obj: any, path: string = ''): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const cleaned: any = {};
  let removedCount = 0;

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (isInvalidKey(key)) {
      console.log(`  Removing invalid key: ${fullPath}`);
      removedCount++;
      continue;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const cleanedValue = cleanObject(value, fullPath);
      if (Object.keys(cleanedValue).length > 0) {
        cleaned[key] = cleanedValue;
      } else {
        removedCount++;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

async function main() {
  const localesDir = path.join(process.cwd(), 'src', 'locales');
  
  // Find all tr.json files
  const files: string[] = [];
  
  function findJsonFiles(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        findJsonFiles(fullPath);
      } else if (entry.name === 'tr.json') {
        files.push(fullPath);
      }
    }
  }

  findJsonFiles(localesDir);

  console.log(`Cleaning ${files.length} JSON files...\n`);

  let totalRemoved = 0;
  for (const filePath of files) {
    const json = loadJsonFile(filePath);
    if (!json) continue;

    const originalSize = JSON.stringify(json).length;
    const cleaned = cleanObject(json);
    const newSize = JSON.stringify(cleaned).length;

    if (originalSize !== newSize) {
      saveJsonFile(filePath, cleaned);
      const removed = originalSize - newSize;
      totalRemoved += removed;
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`✓ Cleaned ${relativePath}`);
    }
  }

  console.log(`\n✓ Done! Total bytes removed: ${totalRemoved}`);
}

main().catch(console.error);

