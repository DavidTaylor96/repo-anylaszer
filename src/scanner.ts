import * as fs from 'fs';
import * as path from 'path';
import { FileInfo } from './types';

export class RepoScanner {
  private repoPath: string;
  private ignorePatterns: string[] = [
    'node_modules',
    '.git',
    '.vscode',
    '.idea',
    '__pycache__',
    '*.pyc',
    '*.pyo',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '.env',
    'dist',
    'build',
    'coverage',
    '.nyc_output',
    '*.min.js',
    '*.map'
  ];

  private languageMap: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.fish': 'bash',
    '.ps1': 'powershell',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.cfg': 'ini',
    '.conf': 'config',
    '.md': 'markdown',
    '.rst': 'rst',
    '.txt': 'text'
  };

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
  }

  public scan(): FileInfo[] {
    const files: FileInfo[] = [];
    this.scanDirectory(this.repoPath, files);
    return files.sort((a, b) => a.path.localeCompare(b.path));
  }

  private scanDirectory(dirPath: string, files: FileInfo[]): void {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(this.repoPath, fullPath);

        if (this.shouldIgnore(entry.name, relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          this.scanDirectory(fullPath, files);
        } else if (entry.isFile()) {
          const fileInfo = this.createFileInfo(fullPath, relativePath);
          if (fileInfo) {
            files.push(fileInfo);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dirPath}: ${error}`);
    }
  }

  private createFileInfo(absolutePath: string, relativePath: string): FileInfo | null {
    try {
      const stats = fs.statSync(absolutePath);
      const extension = path.extname(relativePath).toLowerCase();
      const language = this.languageMap[extension];

      return {
        path: relativePath,
        absolutePath,
        language,
        size: stats.size,
        extension
      };
    } catch (error) {
      console.warn(`Warning: Could not get file info for ${absolutePath}: ${error}`);
      return null;
    }
  }

  private shouldIgnore(fileName: string, relativePath: string): boolean {
    for (const pattern of this.ignorePatterns) {
      if (pattern.includes('*')) {
        // Simple glob pattern matching
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(fileName) || regex.test(relativePath)) {
          return true;
        }
      } else {
        // Exact match or directory match
        if (fileName === pattern || relativePath.includes(pattern)) {
          return true;
        }
      }
    }

    // Check for hidden files/directories (starting with .)
    if (fileName.startsWith('.') && fileName !== '.gitignore' && fileName !== '.env.example') {
      return true;
    }

    return false;
  }

  public addIgnorePattern(pattern: string): void {
    this.ignorePatterns.push(pattern);
  }

  public removeIgnorePattern(pattern: string): void {
    const index = this.ignorePatterns.indexOf(pattern);
    if (index > -1) {
      this.ignorePatterns.splice(index, 1);
    }
  }

  public getIgnorePatterns(): string[] {
    return [...this.ignorePatterns];
  }
}