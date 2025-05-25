import { BaseParser } from './base-parser';
import { ParseResult, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, ConstantInfo } from '../types';

export class TypeScriptParser extends BaseParser {
  public parse(): ParseResult {
    return {
      functions: this.parseFunctions(),
      classes: this.parseClasses(),
      imports: this.parseImports(),
      exports: this.parseExports(),
      constants: this.parseConstants()
    };
  }

  private parseFunctions(): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Patterns for different function declarations
    const patterns = [
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/,
      /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/,
      /^\s*(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)(?:\s*:\s*([^=]+))?\s*=>/,
      /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/
    ];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const name = match[1];
          const params = this.parseParameters(match[2] || '');
          const returnType = match[3]?.trim();
          const isAsync = line.includes('async');
          const lineStart = i + 1;
          const lineEnd = this.findFunctionEnd(i);
          const docstring = this.extractDocstring(Math.max(0, i - 3), i);

          functions.push({
            name,
            parameters: params,
            returnType,
            isAsync,
            lineStart,
            lineEnd,
            docstring
          });
          break;
        }
      }
    }

    return functions;
  }

  private parseClasses(): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    const classPattern = /^\s*(?:export\s+)?(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(classPattern);
      
      if (match) {
        const name = match[1];
        const extendsClass = match[2];
        const implementsInterfaces = match[3]?.split(',').map(s => s.trim()) || [];
        const lineStart = i + 1;
        const lineEnd = this.findEndLine(lineStart, '{', '}');
        const docstring = this.extractDocstring(Math.max(0, i - 3), i);

        const methods = this.parseClassMethods(lineStart, lineEnd);
        const properties = this.parseClassProperties(lineStart, lineEnd);

        classes.push({
          name,
          methods,
          properties,
          extends: extendsClass,
          implements: implementsInterfaces,
          lineStart,
          lineEnd,
          docstring
        });
      }
    }

    return classes;
  }

  private parseImports(): ImportInfo[] {
    const imports: ImportInfo[] = [];
    
    const patterns = [
      /^import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,  // import default from 'module'
      /^import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/,  // import { named } from 'module'
      /^import\s+(\w+),\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/,  // import default, { named } from 'module'
      /^import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,  // import * as name from 'module'
      /^const\s+(?:\{\s*([^}]+)\s*\}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/  // require syntax
    ];

    for (const line of this.lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('require')) {
            // Handle require syntax
            const items = match[1] ? match[1].split(',').map(s => s.trim()) : [match[2]];
            const module = match[3];
            imports.push({
              module,
              items,
              isDefault: !match[1]
            });
          } else {
            // Handle import syntax
            let items: string[] = [];
            let isDefault = false;
            let module = match[2] || match[3];

            if (match[0].includes('* as')) {
              items = [match[1]];
            } else if (match[0].includes('{')) {
              items = (match[1] || match[2]).split(',').map(s => s.trim());
            } else {
              items = [match[1]];
              isDefault = true;
            }

            imports.push({
              module,
              items,
              isDefault
            });
          }
          break;
        }
      }
    }

    return imports;
  }

  private parseExports(): ExportInfo[] {
    const exports: ExportInfo[] = [];
    
    for (const line of this.lines) {
      // Export function
      if (line.match(/^\s*export\s+(?:async\s+)?function\s+(\w+)/)) {
        const match = line.match(/^\s*export\s+(?:async\s+)?function\s+(\w+)/);
        if (match) {
          exports.push({ name: match[1], type: 'function' });
        }
      }
      
      // Export class
      else if (line.match(/^\s*export\s+(?:abstract\s+)?class\s+(\w+)/)) {
        const match = line.match(/^\s*export\s+(?:abstract\s+)?class\s+(\w+)/);
        if (match) {
          exports.push({ name: match[1], type: 'class' });
        }
      }
      
      // Export const/let/var
      else if (line.match(/^\s*export\s+(?:const|let|var)\s+(\w+)/)) {
        const match = line.match(/^\s*export\s+(?:const|let|var)\s+(\w+)/);
        if (match) {
          exports.push({ name: match[1], type: 'constant' });
        }
      }
      
      // Export default
      else if (line.match(/^\s*export\s+default\s+/)) {
        const match = line.match(/^\s*export\s+default\s+(?:class\s+)?(\w+)/);
        exports.push({ 
          name: match ? match[1] : 'default', 
          type: 'default' 
        });
      }
      
      // Export { ... }
      else if (line.match(/^\s*export\s+\{([^}]+)\}/)) {
        const match = line.match(/^\s*export\s+\{([^}]+)\}/);
        if (match) {
          const items = match[1].split(',').map(s => s.trim());
          for (const item of items) {
            exports.push({ name: item, type: 'constant' });
          }
        }
      }
    }

    return exports;
  }

  private parseConstants(): ConstantInfo[] {
    const constants: ConstantInfo[] = [];
    
    const pattern = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)(?:\s*:\s*([^=]+))?\s*=\s*(.+)/;

    for (const line of this.lines) {
      const match = line.match(pattern);
      if (match) {
        constants.push({
          name: match[1],
          type: match[2]?.trim(),
          value: match[3]?.trim()
        });
      }
    }

    return constants;
  }

  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      // Remove default values and types for simplicity
      return param.split('=')[0].split(':')[0].trim();
    }).filter(param => param.length > 0);
  }

  private findFunctionEnd(startLine: number): number {
    // Look for arrow functions
    if (this.lines[startLine].includes('=>')) {
      // Single line arrow function
      if (!this.lines[startLine].includes('{')) {
        return startLine + 1;
      }
    }
    
    return this.findEndLine(startLine + 1, '{', '}');
  }

  private parseClassMethods(startLine: number, endLine: number): FunctionInfo[] {
    const methods: FunctionInfo[] = [];
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Method patterns
      const methodPattern = /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*\{/;
      const match = line.match(methodPattern);
      
      if (match) {
        const name = match[1];
        const params = this.parseParameters(match[2] || '');
        const returnType = match[3]?.trim();
        const isAsync = line.includes('async');
        const lineStart = i + 1;
        const lineEnd = this.findFunctionEnd(i);
        const docstring = this.extractDocstring(Math.max(0, i - 2), i);

        methods.push({
          name,
          parameters: params,
          returnType,
          isAsync,
          lineStart,
          lineEnd,
          docstring
        });
      }
    }

    return methods;
  }

  private parseClassProperties(startLine: number, endLine: number): string[] {
    const properties: string[] = [];
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Property patterns
      const propertyPattern = /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:readonly\s+)?(\w+)(?:\s*:\s*[^=;]+)?(?:\s*=.*)?[;]?$/;
      const match = line.match(propertyPattern);
      
      if (match && !line.includes('(') && !line.includes('function')) {
        properties.push(match[1]);
      }
    }

    return properties;
  }
}