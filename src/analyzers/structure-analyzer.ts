import * as path from 'path';
import { FileInfo, StructureAnalysis, DirectoryNode } from '../types';

export class StructureAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];

  constructor(repoPath: string, fileData: FileInfo[]) {
    this.repoPath = repoPath;
    this.fileData = fileData;
  }

  public analyze(): StructureAnalysis {
    const directoryStructure = this.buildDirectoryTree();
    const filesByLanguage = this.groupFilesByLanguage();
    const totalFiles = this.fileData.length;
    const totalLines = this.calculateTotalLines();

    return {
      directoryStructure,
      filesByLanguage,
      totalFiles,
      totalLines
    };
  }

  private buildDirectoryTree(): DirectoryNode {
    const root: DirectoryNode = {
      name: path.basename(this.repoPath),
      type: 'directory',
      children: []
    };

    // Build tree structure
    for (const file of this.fileData) {
      this.addFileToTree(root, file);
    }

    // Sort children recursively
    this.sortTreeChildren(root);

    return root;
  }

  private addFileToTree(root: DirectoryNode, file: FileInfo): void {
    const pathParts = file.path.split(path.sep).filter(part => part.length > 0);
    let currentNode = root;

    // Navigate through directories
    for (let i = 0; i < pathParts.length - 1; i++) {
      const dirName = pathParts[i];
      let dirNode = currentNode.children?.find(child => 
        child.name === dirName && child.type === 'directory'
      );

      if (!dirNode) {
        dirNode = {
          name: dirName,
          type: 'directory',
          children: []
        };
        currentNode.children = currentNode.children || [];
        currentNode.children.push(dirNode);
      }

      currentNode = dirNode;
    }

    // Add the file
    const fileName = pathParts[pathParts.length - 1];
    const fileNode: DirectoryNode = {
      name: fileName,
      type: 'file',
      language: file.language,
      size: file.size
    };

    currentNode.children = currentNode.children || [];
    currentNode.children.push(fileNode);
  }

  private sortTreeChildren(node: DirectoryNode): void {
    if (!node.children) return;

    // Sort: directories first, then files, both alphabetically
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    for (const child of node.children) {
      this.sortTreeChildren(child);
    }
  }

  private groupFilesByLanguage(): Record<string, number> {
    const languageCounts: Record<string, number> = {};

    for (const file of this.fileData) {
      const language = file.language || 'unknown';
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    }

    // Sort by count descending
    const sortedEntries = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1]);

    const sortedLanguageCounts: Record<string, number> = {};
    for (const [language, count] of sortedEntries) {
      sortedLanguageCounts[language] = count;
    }

    return sortedLanguageCounts;
  }

  private calculateTotalLines(): number {
    // This is an estimation since we'd need to read all files
    // For now, we'll estimate based on file sizes
    let totalLines = 0;

    for (const file of this.fileData) {
      // Rough estimation: average 50 characters per line
      const estimatedLines = Math.ceil(file.size / 50);
      totalLines += estimatedLines;
    }

    return totalLines;
  }

  public getDirectoryStats(): Record<string, any> {
    const stats = {
      totalDirectories: 0,
      totalFiles: this.fileData.length,
      largestFile: { name: '', size: 0 },
      smallestFile: { name: '', size: Infinity },
      averageFileSize: 0,
      fileExtensions: new Set<string>()
    };

    let totalSize = 0;

    for (const file of this.fileData) {
      totalSize += file.size;

      if (file.size > stats.largestFile.size) {
        stats.largestFile = { name: file.path, size: file.size };
      }

      if (file.size < stats.smallestFile.size) {
        stats.smallestFile = { name: file.path, size: file.size };
      }

      if (file.extension) {
        stats.fileExtensions.add(file.extension);
      }
    }

    stats.averageFileSize = Math.round(totalSize / this.fileData.length);
    stats.totalDirectories = this.countDirectories();

    return {
      ...stats,
      fileExtensions: Array.from(stats.fileExtensions).sort()
    };
  }

  private countDirectories(): number {
    const directories = new Set<string>();

    for (const file of this.fileData) {
      const dir = path.dirname(file.path);
      if (dir !== '.') {
        directories.add(dir);
        
        // Add parent directories
        let parentDir = dir;
        while (parentDir !== '.' && parentDir !== '/') {
          parentDir = path.dirname(parentDir);
          if (parentDir !== '.') {
            directories.add(parentDir);
          }
        }
      }
    }

    return directories.size;
  }
}