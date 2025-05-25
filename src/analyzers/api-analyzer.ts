import * as fs from 'fs';
import { FileInfo, ParseResult, ApiAnalysis, FunctionInfo, ClassInfo, EndpointInfo } from '../types';

export class ApiAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): ApiAnalysis {
    const publicFunctions = this.extractPublicFunctions();
    const publicClasses = this.extractPublicClasses();
    const endpoints = this.extractApiEndpoints();

    return {
      publicFunctions,
      publicClasses,
      endpoints
    };
  }

  private extractPublicFunctions(): FunctionInfo[] {
    const publicFunctions: FunctionInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Add exported functions
      const exportedFunctionNames = parseResult.exports
        .filter(exp => exp.type === 'function')
        .map(exp => exp.name);

      for (const func of parseResult.functions) {
        if (this.isPublicFunction(func, exportedFunctionNames, filePath)) {
          publicFunctions.push({
            ...func,
            // Add file context
            docstring: func.docstring ? `${func.docstring} (from ${filePath})` : `From ${filePath}`
          });
        }
      }
    }

    return publicFunctions.sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractPublicClasses(): ClassInfo[] {
    const publicClasses: ClassInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Add exported classes
      const exportedClassNames = parseResult.exports
        .filter(exp => exp.type === 'class')
        .map(exp => exp.name);

      for (const cls of parseResult.classes) {
        if (this.isPublicClass(cls, exportedClassNames, filePath)) {
          publicClasses.push({
            ...cls,
            // Add file context
            docstring: cls.docstring ? `${cls.docstring} (from ${filePath})` : `From ${filePath}`
          });
        }
      }
    }

    return publicClasses.sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractApiEndpoints(): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Extract HTTP endpoints from different frameworks
      endpoints.push(...this.extractExpressEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractFastAPIEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractFlaskEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractRestEndpoints(filePath, fileContent, parseResult));
    }

    return endpoints.sort((a, b) => a.path.localeCompare(b.path));
  }

  private isPublicFunction(func: FunctionInfo, exportedNames: string[], filePath: string): boolean {
    // Check if explicitly exported
    if (exportedNames.includes(func.name)) {
      return true;
    }

    // In Python, functions not starting with _ are considered public
    if (filePath.endsWith('.py') && !func.name.startsWith('_')) {
      return true;
    }

    // In JS/TS, check if it's in a file that's likely to be a public API
    if (this.isApiFile(filePath)) {
      return true;
    }

    return false;
  }

  private isPublicClass(cls: ClassInfo, exportedNames: string[], filePath: string): boolean {
    // Check if explicitly exported
    if (exportedNames.includes(cls.name)) {
      return true;
    }

    // In Python, classes not starting with _ are considered public
    if (filePath.endsWith('.py') && !cls.name.startsWith('_')) {
      return true;
    }

    // In JS/TS, check if it's in a file that's likely to be a public API
    if (this.isApiFile(filePath)) {
      return true;
    }

    return false;
  }

  private isApiFile(filePath: string): boolean {
    const apiIndicators = [
      'api',
      'routes',
      'endpoints',
      'controllers',
      'handlers',
      'public',
      'index',
      'main'
    ];

    const fileName = filePath.toLowerCase();
    return apiIndicators.some(indicator => fileName.includes(indicator));
  }

  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = require('path').join(this.repoPath, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  private extractExpressEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // Express.js patterns
    const expressPattern = /(?:app|router|express)\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = expressPattern.exec(line)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        
        // Try to find the associated function
        const functionName = this.findAssociatedFunction(lines, i, parseResult);

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous'
        });
      }
    }

    return endpoints;
  }

  private extractFastAPIEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // FastAPI patterns
    const fastApiPattern = /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = fastApiPattern.exec(line)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        
        // The function should be on the next non-empty line
        const functionName = this.findNextFunction(lines, i, parseResult);

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous'
        });
      }
    }

    return endpoints;
  }

  private extractFlaskEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // Flask patterns
    const flaskPattern = /@app\.route\s*\(\s*['"`]([^'"`]+)['"`](?:.*?methods\s*=\s*\[['"`]([^'"`]+)['"`]\])?/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = flaskPattern.exec(line)) !== null) {
        const path = match[1];
        const method = match[2] ? match[2].toUpperCase() : 'GET';
        
        // The function should be on the next non-empty line
        const functionName = this.findNextFunction(lines, i, parseResult);

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous'
        });
      }
    }

    return endpoints;
  }

  private extractRestEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];

    // Generic REST patterns (looking for HTTP method comments or strings)
    const restPatterns = [
      /\/\*\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)\s*\*\//g,
      /\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)/g,
      /#\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)/g
    ];

    for (const pattern of restPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1],
          path: match[2],
          file: filePath,
          function: 'documented'
        });
      }
    }

    return endpoints;
  }

  private findAssociatedFunction(lines: string[], lineIndex: number, parseResult: ParseResult): string | null {
    // Look for function on the same line or nearby lines
    for (let i = lineIndex; i < Math.min(lineIndex + 3, lines.length); i++) {
      const line = lines[i];
      
      // Look for function calls or references
      for (const func of parseResult.functions) {
        if (line.includes(func.name) && !line.includes('function')) {
          return func.name;
        }
      }
    }

    return null;
  }

  private findNextFunction(lines: string[], lineIndex: number, parseResult: ParseResult): string | null {
    // Look for function definition in the next few lines
    for (let i = lineIndex + 1; i < Math.min(lineIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // Check against parsed functions
      for (const func of parseResult.functions) {
        if (line.includes(`def ${func.name}`) || line.includes(`function ${func.name}`) || 
            line.includes(`${func.name}(`)) {
          return func.name;
        }
      }
    }

    return null;
  }

  public getApiStats(): Record<string, any> {
    const analysis = this.analyze();
    
    const stats = {
      totalPublicFunctions: analysis.publicFunctions.length,
      totalPublicClasses: analysis.publicClasses.length,
      totalEndpoints: analysis.endpoints.length,
      endpointsByMethod: this.groupEndpointsByMethod(analysis.endpoints),
      functionsWithDocumentation: analysis.publicFunctions.filter(f => f.docstring).length,
      classesWithDocumentation: analysis.publicClasses.filter(c => c.docstring).length,
      mostComplexFunction: this.findMostComplexFunction(analysis.publicFunctions),
      largestClass: this.findLargestClass(analysis.publicClasses)
    };

    return stats;
  }

  private groupEndpointsByMethod(endpoints: EndpointInfo[]): Record<string, number> {
    const methodCounts: Record<string, number> = {};
    
    for (const endpoint of endpoints) {
      methodCounts[endpoint.method] = (methodCounts[endpoint.method] || 0) + 1;
    }

    return methodCounts;
  }

  private findMostComplexFunction(functions: FunctionInfo[]): { name: string; complexity: number } {
    let mostComplex = { name: '', complexity: 0 };

    for (const func of functions) {
      // Simple complexity measure: number of parameters + estimated lines
      const complexity = func.parameters.length + (func.lineEnd - func.lineStart);
      
      if (complexity > mostComplex.complexity) {
        mostComplex = { name: func.name, complexity };
      }
    }

    return mostComplex;
  }

  private findLargestClass(classes: ClassInfo[]): { name: string; size: number } {
    let largest = { name: '', size: 0 };

    for (const cls of classes) {
      // Size measure: number of methods + properties + lines
      const size = cls.methods.length + cls.properties.length + (cls.lineEnd - cls.lineStart);
      
      if (size > largest.size) {
        largest = { name: cls.name, size };
      }
    }

    return largest;
  }
}