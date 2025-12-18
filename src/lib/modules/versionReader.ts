import fs from 'fs';
import path from 'path';

export interface VersionInfo {
  version: string;
  date: string;
  changes: string[];
}

/**
 * Reads and parses the version.txt file for a module
 * @param moduleSlug - The module slug (e.g., 'real-estate')
 * @returns Array of version information
 */
export async function readModuleVersionHistory(moduleSlug: string): Promise<VersionInfo[]> {
  try {
    const versionFilePath = path.join(
      process.cwd(),
      'src',
      'modules',
      moduleSlug,
      'version.txt'
    );

    // Check if file exists
    if (!fs.existsSync(versionFilePath)) {
      return [];
    }

    const content = fs.readFileSync(versionFilePath, 'utf-8');
    const versions: VersionInfo[] = [];

    // Parse the version.txt file
    const versionBlocks = content.split(/###\s+Version\s+/g).filter(Boolean);

    for (const block of versionBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length === 0) continue;

      // Parse version and date from first line (e.g., "1.0.0 (2025-01-28)")
      const firstLine = lines[0];
      if (!firstLine) continue;
      const headerMatch = firstLine.match(/^([\d.]+)\s+\(([^)]+)\)/);
      if (!headerMatch) continue;

      const [, version, date] = headerMatch;
      if (!version || !date) continue;
      
      const changes: string[] = [];

      // Parse changes (lines starting with -, ✅, ⚠️, etc.)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        if (line.startsWith('-') || line.startsWith('✅') || line.startsWith('⚠️')) {
          // Remove leading symbols and trim
          const change = line.replace(/^[-✅⚠️]\s*/, '').trim();
          if (change) {
            changes.push(change);
          }
        }
      }

      versions.push({
        version: version || '',
        date: date || '',
        changes,
      });
    }

    return versions;
  } catch (error) {
    return [];
  }
}

/**
 * Gets the latest version information for a module
 * @param moduleSlug - The module slug
 * @returns The latest version info or null
 */
export async function getLatestVersion(moduleSlug: string): Promise<VersionInfo | null> {
  const versions = await readModuleVersionHistory(moduleSlug);
  return versions.length > 0 ? versions[0] || null : null;
}

/**
 * Gets all versions as a formatted string
 * @param moduleSlug - The module slug
 * @returns Formatted version history string
 */
export async function getFormattedVersionHistory(moduleSlug: string): Promise<string> {
  const versions = await readModuleVersionHistory(moduleSlug);
  
  if (versions.length === 0) {
    return 'No version history available';
  }

  return versions
    .map((v) => {
      const changes = v.changes.map((c) => `  - ${c}`).join('\n');
      return `Version ${v.version} (${v.date})\n${changes}`;
    })
    .join('\n\n');
}



