import * as path from 'path';
import { FileInfo, ParseResult, DependencyAnalysis, DependencyMap, ExternalDependency } from '../types';

export class DependencyAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): DependencyAnalysis {
    const internalDependencies = this.analyzeInternalDependencies();
    const externalDependencies = this.analyzeExternalDependencies();
    const dependencyGraph = this.buildDependencyGraph(internalDependencies);

    return {
      internalDependencies,
      externalDependencies,
      dependencyGraph
    };
  }

  private analyzeInternalDependencies(): DependencyMap {
    const dependencies: DependencyMap = {};

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      dependencies[filePath] = [];

      for (const importInfo of parseResult.imports) {
        const resolvedPath = this.resolveImportPath(filePath, importInfo.module);
        if (resolvedPath && this.isInternalFile(resolvedPath)) {
          dependencies[filePath].push(resolvedPath);
        }
      }
    }

    return dependencies;
  }

  private analyzeExternalDependencies(): ExternalDependency[] {
    const externalDeps = new Map<string, ExternalDependency>();

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const importInfo of parseResult.imports) {
        if (this.isExternalDependency(importInfo.module)) {
          const depName = this.extractPackageName(importInfo.module);
          const depType = this.getDependencyType(filePath);

          if (!externalDeps.has(depName)) {
            externalDeps.set(depName, {
              name: depName,
              files: [],
              type: depType
            });
          }

          const existingDep = externalDeps.get(depName)!;
          if (!existingDep.files.includes(filePath)) {
            existingDep.files.push(filePath);
          }
        }
      }
    }

    return Array.from(externalDeps.values()).sort((a, b) => b.files.length - a.files.length);
  }

  private buildDependencyGraph(internalDeps: DependencyMap): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    // Initialize all files in the graph
    for (const file of this.fileData) {
      graph[file.path] = [];
    }

    // Add dependencies
    for (const [file, deps] of Object.entries(internalDeps)) {
      graph[file] = deps;
    }

    return graph;
  }

  private resolveImportPath(currentFile: string, importPath: string): string | null {
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const currentDir = path.dirname(currentFile);
      const resolved = path.join(currentDir, importPath);
      return this.normalizeImportPath(resolved);
    }

    // Handle absolute imports (from project root)
    if (importPath.startsWith('/')) {
      return this.normalizeImportPath(importPath.slice(1));
    }

    // Handle module-style imports (could be internal or external)
    const possiblePaths = this.generatePossiblePaths(importPath);
    for (const possiblePath of possiblePaths) {
      if (this.isInternalFile(possiblePath)) {
        return possiblePath;
      }
    }

    return null;
  }

  private normalizeImportPath(importPath: string): string {
    // Remove leading './'
    if (importPath.startsWith('./')) {
      importPath = importPath.slice(2);
    }

    // Add common file extensions if missing
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py'];
    for (const ext of extensions) {
      const withExt = importPath + ext;
      if (this.isInternalFile(withExt)) {
        return withExt;
      }
    }

    // Check for index files
    const indexFiles = ['index.ts', 'index.js', '__init__.py'];
    for (const indexFile of indexFiles) {
      const indexPath = path.join(importPath, indexFile);
      if (this.isInternalFile(indexPath)) {
        return indexPath;
      }
    }

    return importPath;
  }

  private generatePossiblePaths(importPath: string): string[] {
    const paths: string[] = [];

    // Direct path
    paths.push(importPath);

    // With common extensions
    const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py'];
    for (const ext of extensions) {
      paths.push(importPath + ext);
    }

    // As directory with index file
    const indexFiles = ['index.ts', 'index.js', '__init__.py'];
    for (const indexFile of indexFiles) {
      paths.push(path.join(importPath, indexFile));
    }

    // In src directory
    for (const basePath of [importPath, ...paths]) {
      paths.push(path.join('src', basePath));
    }

    return paths;
  }

  private isInternalFile(filePath: string): boolean {
    return this.fileData.some(file => file.path === filePath);
  }

  private isExternalDependency(importPath: string): boolean {
    // Check if it's a relative or absolute path
    if (importPath.startsWith('./') || importPath.startsWith('../') || importPath.startsWith('/')) {
      return false;
    }

    // Check if it resolves to an internal file
    if (this.resolveImportPath('', importPath)) {
      return false;
    }

    // Check for common external package patterns
    const externalPatterns = [
      /^[a-z]/,  // Most npm packages start with lowercase
      /^@/,      // Scoped packages
      /^\w+$/    // Single word packages
    ];

    return externalPatterns.some(pattern => pattern.test(importPath));
  }

  private extractPackageName(importPath: string): string {
    // Handle scoped packages (@org/package)
    if (importPath.startsWith('@')) {
      const parts = importPath.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : importPath;
    }

    // Handle regular packages (package/submodule)
    const parts = importPath.split('/');
    return parts[0];
  }

  private getDependencyType(filePath: string): 'npm' | 'pip' | 'other' {
    const ext = path.extname(filePath);
    
    if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      return 'npm';
    }
    
    if (ext === '.py') {
      return 'pip';
    }
    
    return 'other';
  }

  public getDependencyStats(): Record<string, any> {
    const analysis = this.analyze();
    const stats = {
      totalInternalDependencies: 0,
      totalExternalDependencies: analysis.externalDependencies.length,
      mostDependentFile: { path: '', count: 0 },
      mostImportedFile: { path: '', count: 0 },
      circularDependencies: this.detectCircularDependencies(analysis.dependencyGraph)
    };

    // Calculate internal dependency stats
    for (const [file, deps] of Object.entries(analysis.internalDependencies)) {
      stats.totalInternalDependencies += deps.length;
      
      if (deps.length > stats.mostDependentFile.count) {
        stats.mostDependentFile = { path: file, count: deps.length };
      }
    }

    // Find most imported file
    const importCounts: Record<string, number> = {};
    for (const deps of Object.values(analysis.internalDependencies)) {
      for (const dep of deps) {
        importCounts[dep] = (importCounts[dep] || 0) + 1;
      }
    }

    for (const [file, count] of Object.entries(importCounts)) {
      if (count > stats.mostImportedFile.count) {
        stats.mostImportedFile = { path: file, count };
      }
    }

    return stats;
  }

  private detectCircularDependencies(graph: Record<string, string[]>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), node]);
        }
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      for (const neighbor of graph[node] || []) {
        dfs(neighbor, [...path, node]);
      }

      recursionStack.delete(node);
    };

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }
}