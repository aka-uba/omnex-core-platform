import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface DirectoryNode {
  name: string;
  path: string;
  fullPath: string;
  hasPage: boolean;
  children: DirectoryNode[];
  level: number;
}

export async function GET(request: NextRequest) {
  try {
    const basePath = path.join(process.cwd(), 'src', 'app', '[locale]');
    
    const scanDirectory = async (
      dirPath: string,
      relativePath: string = '',
      level: number = 0
    ): Promise<DirectoryNode[]> => {
      const nodes: DirectoryNode[] = [];
      
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        // Sort entries: directories first, then files
        const sortedEntries = entries.sort((a, b) => {
          if (a.isDirectory() && !b.isDirectory()) return -1;
          if (!a.isDirectory() && b.isDirectory()) return 1;
          return a.name.localeCompare(b.name);
        });
        
        for (const entry of sortedEntries) {
          // Skip hidden files and special directories
          if (entry.name.startsWith('.') || 
              entry.name === 'node_modules' ||
              entry.name === 'components' ||
              entry.name === '__tests__' ||
              entry.name === 'yedek') {
            continue;
          }
          
          const fullPath = path.join(dirPath, entry.name);
          const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.isDirectory()) {
            // Check if directory has page.tsx
            const pagePath = path.join(fullPath, 'page.tsx');
            let hasPage = false;
            
            try {
              await fs.access(pagePath);
              hasPage = true;
            } catch {
              hasPage = false;
            }
            
            const node: DirectoryNode = {
              name: entry.name,
              path: newRelativePath,
              fullPath: fullPath,
              hasPage,
              children: [],
              level
            };
            
            // Recursively scan subdirectories
            const children = await scanDirectory(fullPath, newRelativePath, level + 1);
            node.children = children;
            
            nodes.push(node);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
      
      return nodes;
    };
    
    const structure = await scanDirectory(basePath);
    
    return NextResponse.json({
      success: true,
      data: structure,
      basePath: '/[locale]'
    });
  } catch (error) {
    console.error('Error building directory structure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to build directory structure' },
      { status: 500 }
    );
  }
}






