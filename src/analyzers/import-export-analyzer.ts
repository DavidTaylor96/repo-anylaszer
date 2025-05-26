import * as path from 'path';
import { FileInfo, ParseResult, ImportExportGraph } from '../types';

export class ImportExportAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): ImportExportGraph {
    const nodes = this.buildNodes();
    const edges = this.buildEdges();
    const circularDependencies = this.detectCircularDependencies(edges);
    const orphanedFiles = this.findOrphanedFiles(nodes, edges);
    const entryPoints = this.findEntryPoints(nodes, edges);

    return {
      nodes,
      edges,
      circularDependencies,
      orphanedFiles,
      entryPoints
    };
  }

  private buildNodes(): Array<{id: string, label: string, type: 'file' | 'function' | 'class' | 'constant'}> {
    const nodes: Array<{id: string, label: string, type: 'file' | 'function' | 'class' | 'constant'}> = [];

    // Add file nodes
    for (const file of this.fileData) {
      if (file.language && ['typescript', 'javascript', 'python'].includes(file.language)) {
        nodes.push({
          id: file.path,
          label: path.basename(file.path),
          type: 'file'
        });
      }
    }

    // Add export nodes for each file
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Add exported functions
      for (const exportInfo of parseResult.exports) {
        if (exportInfo.type === 'function') {
          nodes.push({
            id: `${filePath}:function:${exportInfo.name}`,
            label: exportInfo.name,
            type: 'function'
          });
        } else if (exportInfo.type === 'class') {
          nodes.push({
            id: `${filePath}:class:${exportInfo.name}`,
            label: exportInfo.name,
            type: 'class'
          });
        } else if (exportInfo.type === 'constant') {
          nodes.push({
            id: `${filePath}:constant:${exportInfo.name}`,
            label: exportInfo.name,
            type: 'constant'
          });
        }
      }
    }

    return nodes;
  }

  private buildEdges(): Array<{from: string, to: string, type: 'imports' | 'exports' | 'extends' | 'implements'}> {
    const edges: Array<{from: string, to: string, type: 'imports' | 'exports' | 'extends' | 'implements'}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Import relationships
      for (const importInfo of parseResult.imports) {
        const resolvedModule = this.resolveModulePath(importInfo.module, filePath);
        
        if (resolvedModule && this.isInternalModule(resolvedModule)) {
          // File-to-file import
          edges.push({
            from: filePath,
            to: resolvedModule,
            type: 'imports'
          });

          // Specific imports
          if (Array.isArray(importInfo.items)) {
            for (const item of importInfo.items) {
              const itemName = typeof item === 'string' ? item : item.name;
              const targetNode = this.findExportNode(resolvedModule, itemName);
              if (targetNode) {
                edges.push({
                  from: filePath,
                  to: targetNode,
                  type: 'imports'
                });
              }
            }
          }
        }
      }

      // Export relationships
      for (const exportInfo of parseResult.exports) {
        const exportNodeId = `${filePath}:${exportInfo.type}:${exportInfo.name}`;
        edges.push({
          from: filePath,
          to: exportNodeId,
          type: 'exports'
        });
      }

      // Class inheritance relationships
      for (const classInfo of parseResult.classes) {
        if (classInfo.extends) {
          const extendedClass = this.findClassDefinition(classInfo.extends, filePath);
          if (extendedClass) {
            edges.push({
              from: `${filePath}:class:${classInfo.name}`,
              to: extendedClass,
              type: 'extends'
            });
          }
        }

        if (classInfo.implements) {
          for (const interfaceName of classInfo.implements) {
            const implementedInterface = this.findInterfaceDefinition(interfaceName, filePath);
            if (implementedInterface) {
              edges.push({
                from: `${filePath}:class:${classInfo.name}`,
                to: implementedInterface,
                type: 'implements'
              });
            }
          }
        }
      }
    }

    return edges;
  }

  private detectCircularDependencies(edges: Array<{from: string, to: string, type: string}>): string[][] {
    const circularDependencies: string[][] = [];
    const graph = this.buildAdjacencyList(edges);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart);
          cycle.push(node); // Complete the cycle
          circularDependencies.push(cycle);
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, [...path]);
      }

      recursionStack.delete(node);
    };

    // Only check file-level dependencies for circular detection
    const fileNodes = edges
      .filter(edge => edge.type === 'imports' && !edge.from.includes(':') && !edge.to.includes(':'))
      .map(edge => [edge.from, edge.to])
      .flat();

    const uniqueFiles = [...new Set(fileNodes)];

    for (const file of uniqueFiles) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return circularDependencies;
  }

  private findOrphanedFiles(nodes: any[], edges: any[]): string[] {
    const fileNodes = nodes.filter(node => node.type === 'file').map(node => node.id);
    const referencedFiles = new Set<string>();

    // Find all files that are imported or export something
    for (const edge of edges) {
      if (edge.type === 'imports' || edge.type === 'exports') {
        const fromFile = edge.from.split(':')[0];
        const toFile = edge.to.split(':')[0];
        referencedFiles.add(fromFile);
        referencedFiles.add(toFile);
      }
    }

    // Files that are neither imported nor export anything
    const orphaned = fileNodes.filter(file => !referencedFiles.has(file));

    return orphaned;
  }

  private findEntryPoints(nodes: any[], edges: any[]): string[] {
    const entryPoints: string[] = [];
    const fileNodes = nodes.filter(node => node.type === 'file').map(node => node.id);
    const importedFiles = new Set<string>();

    // Find files that are imported by others
    for (const edge of edges) {
      if (edge.type === 'imports' && !edge.to.includes(':')) {
        importedFiles.add(edge.to);
      }
    }

    // Entry points are files that export something but are not imported
    const exportingFiles = new Set<string>();
    for (const edge of edges) {
      if (edge.type === 'exports') {
        exportingFiles.add(edge.from);
      }
    }

    // Common entry point patterns
    const commonEntryPatterns = [
      'index',
      'main',
      'app',
      'server',
      'cli',
      'bin'
    ];

    for (const file of fileNodes) {
      const basename = path.basename(file, path.extname(file)).toLowerCase();
      
      // Files that export but aren't imported, or match common entry patterns
      if ((exportingFiles.has(file) && !importedFiles.has(file)) ||
          commonEntryPatterns.some(pattern => basename.includes(pattern))) {
        entryPoints.push(file);
      }
    }

    return [...new Set(entryPoints)];
  }

  private resolveModulePath(modulePath: string, currentFile: string): string | null {
    // Skip external modules (npm packages)
    if (!modulePath.startsWith('.') && !modulePath.startsWith('/')) {
      return null;
    }

    const currentDir = path.dirname(currentFile);
    let resolvedPath: string;

    if (modulePath.startsWith('/')) {
      resolvedPath = modulePath.slice(1); // Remove leading slash
    } else {
      resolvedPath = path.normalize(path.join(currentDir, modulePath));
    }

    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];
    
    // Check exact path first
    if (this.fileExists(resolvedPath)) {
      return resolvedPath;
    }

    // Try with extensions
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (this.fileExists(pathWithExt)) {
        return pathWithExt;
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (this.fileExists(indexPath)) {
        return indexPath;
      }
    }

    return null;
  }

  private isInternalModule(modulePath: string): boolean {
    return this.fileData.some(file => file.path === modulePath);
  }

  private fileExists(filePath: string): boolean {
    return this.fileData.some(file => file.path === filePath);
  }

  private findExportNode(filePath: string, exportName: string): string | null {
    const parseResult = this.parserResults[filePath];
    if (!parseResult) return null;

    for (const exportInfo of parseResult.exports) {
      if (exportInfo.name === exportName) {
        return `${filePath}:${exportInfo.type}:${exportName}`;
      }
    }

    return null;
  }

  private findClassDefinition(className: string, currentFile: string): string | null {
    // First check current file
    const currentParseResult = this.parserResults[currentFile];
    if (currentParseResult) {
      const localClass = currentParseResult.classes.find(cls => cls.name === className);
      if (localClass) {
        return `${currentFile}:class:${className}`;
      }
    }

    // Check imported files
    if (currentParseResult) {
      for (const importInfo of currentParseResult.imports) {
        const resolvedModule = this.resolveModulePath(importInfo.module, currentFile);
        if (resolvedModule && this.isInternalModule(resolvedModule)) {
          const moduleParseResult = this.parserResults[resolvedModule];
          if (moduleParseResult) {
            const exportedClass = moduleParseResult.classes.find(cls => cls.name === className);
            if (exportedClass) {
              return `${resolvedModule}:class:${className}`;
            }
          }
        }
      }
    }

    return null;
  }

  private findInterfaceDefinition(interfaceName: string, currentFile: string): string | null {
    // First check current file
    const currentParseResult = this.parserResults[currentFile];
    if (currentParseResult && currentParseResult.interfaces) {
      const localInterface = currentParseResult.interfaces.find(iface => iface.name === interfaceName);
      if (localInterface) {
        return `${currentFile}:interface:${interfaceName}`;
      }
    }

    // Check imported files
    if (currentParseResult) {
      for (const importInfo of currentParseResult.imports) {
        const resolvedModule = this.resolveModulePath(importInfo.module, currentFile);
        if (resolvedModule && this.isInternalModule(resolvedModule)) {
          const moduleParseResult = this.parserResults[resolvedModule];
          if (moduleParseResult && moduleParseResult.interfaces) {
            const exportedInterface = moduleParseResult.interfaces.find(iface => iface.name === interfaceName);
            if (exportedInterface) {
              return `${resolvedModule}:interface:${interfaceName}`;
            }
          }
        }
      }
    }

    return null;
  }

  private buildAdjacencyList(edges: Array<{from: string, to: string, type: string}>): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const edge of edges) {
      if (edge.type === 'imports' && !edge.from.includes(':') && !edge.to.includes(':')) {
        if (!graph.has(edge.from)) {
          graph.set(edge.from, []);
        }
        graph.get(edge.from)!.push(edge.to);
      }
    }

    return graph;
  }

  public generateDependencyStats(graph: ImportExportGraph): any {
    const stats = {
      totalFiles: graph.nodes.filter(n => n.type === 'file').length,
      totalExports: graph.nodes.filter(n => n.type !== 'file').length,
      totalImportRelationships: graph.edges.filter(e => e.type === 'imports').length,
      circularDependencies: graph.circularDependencies.length,
      orphanedFiles: graph.orphanedFiles.length,
      entryPoints: graph.entryPoints.length,
      mostImportedFiles: this.getMostImportedFiles(graph),
      fileWithMostExports: this.getFileWithMostExports(graph),
      dependencyDepth: this.calculateDependencyDepth(graph)
    };

    return stats;
  }

  private getMostImportedFiles(graph: ImportExportGraph): Array<{file: string, importCount: number}> {
    const importCounts = new Map<string, number>();

    for (const edge of graph.edges) {
      if (edge.type === 'imports' && !edge.to.includes(':')) {
        importCounts.set(edge.to, (importCounts.get(edge.to) || 0) + 1);
      }
    }

    return Array.from(importCounts.entries())
      .map(([file, count]) => ({ file, importCount: count }))
      .sort((a, b) => b.importCount - a.importCount)
      .slice(0, 10);
  }

  private getFileWithMostExports(graph: ImportExportGraph): Array<{file: string, exportCount: number}> {
    const exportCounts = new Map<string, number>();

    for (const edge of graph.edges) {
      if (edge.type === 'exports') {
        exportCounts.set(edge.from, (exportCounts.get(edge.from) || 0) + 1);
      }
    }

    return Array.from(exportCounts.entries())
      .map(([file, count]) => ({ file, exportCount: count }))
      .sort((a, b) => b.exportCount - a.exportCount)
      .slice(0, 10);
  }

  private calculateDependencyDepth(graph: ImportExportGraph): number {
    const fileNodes = graph.nodes.filter(n => n.type === 'file').map(n => n.id);
    const adjacencyList = this.buildAdjacencyList(graph.edges);
    
    let maxDepth = 0;

    const dfs = (node: string, depth: number, visited: Set<string>): void => {
      if (visited.has(node)) return;
      
      visited.add(node);
      maxDepth = Math.max(maxDepth, depth);
      
      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor, depth + 1, new Set(visited));
      }
    };

    for (const file of fileNodes) {
      dfs(file, 0, new Set());
    }

    return maxDepth;
  }
}