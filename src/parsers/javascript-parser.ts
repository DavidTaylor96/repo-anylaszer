import { BaseParser } from './base-parser';
import { ParseResult, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, ConstantInfo, ParameterInfo, PropertyInfo, ImportItem } from '../types';

export class JavaScriptParser extends BaseParser {
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
      /^\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{/,
      /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/,
      /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\s*\(([^)]*)\)\s*\{/,
      /^\s*(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)\s*=>/,
      /^\s*(\w+)\s*:\s*(?:async\s+)?function\s*\(([^)]*)\)\s*\{/
    ];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const name = match[1];
          const params = this.convertToParameterInfo(this.parseParameters(match[2] || ''));
          const isAsync = line.includes('async');
          const lineStart = i + 1;
          const lineEnd = this.findFunctionEnd(i);
          const docstring = this.extractDocstring(Math.max(0, i - 3), i);

          functions.push({
            name,
            parameters: params,
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
    
    const classPattern = /^\s*(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(classPattern);
      
      if (match) {
        const name = match[1];
        const extendsClass = match[2];
        const lineStart = i + 1;
        const lineEnd = this.findEndLine(lineStart, '{', '}');
        const docstring = this.extractDocstring(Math.max(0, i - 3), i);

        const methods = this.parseClassMethods(lineStart, lineEnd);
        const properties = this.convertToPropertyInfo(this.parseClassProperties(lineStart, lineEnd));

        classes.push({
          name,
          methods,
          properties,
          extends: extendsClass,
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
            const items = match[1] ? this.convertToImportItems(match[1].split(',').map(s => s.trim())) : [{name: match[2] || ''}];
            const module = match[3];
            imports.push({
              module,
              items,
              isDefault: !match[1]
            });
          } else {
            // Handle import syntax
            let items: ImportItem[] = [];
            let isDefault = false;
            let module = match[2] || match[3];

            if (match[0].includes('* as')) {
              items = [{name: match[1]}];
            } else if (match[0].includes('{')) {
              const itemsString = match[1] || match[2];
              items = this.convertToImportItems(itemsString.split(',').map(s => s.trim()));
            } else {
              items = [{name: match[1]}];
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
      else if (line.match(/^\s*export\s+class\s+(\w+)/)) {
        const match = line.match(/^\s*export\s+class\s+(\w+)/);
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

      // module.exports
      else if (line.match(/^\s*module\.exports\s*=\s*/)) {
        exports.push({ name: 'default', type: 'default' });
      }
      
      // exports.name
      else if (line.match(/^\s*exports\.(\w+)\s*=/)) {
        const match = line.match(/^\s*exports\.(\w+)\s*=/);
        if (match) {
          exports.push({ name: match[1], type: 'constant' });
        }
      }
    }

    return exports;
  }

  private parseConstants(): ConstantInfo[] {
    const constants: ConstantInfo[] = [];
    
    const pattern = /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(.+)/;

    for (const line of this.lines) {
      const match = line.match(pattern);
      if (match) {
        constants.push({
          name: match[1],
          value: match[2]?.trim()
        });
      }
    }

    return constants;
  }

  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      // Remove default values for simplicity
      return param.split('=')[0].trim();
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
      const patterns = [
        /^\s*(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*\{/,  // method() {}
        /^\s*(\w+)\s*:\s*(?:async\s+)?\(([^)]*)\)\s*=>/,  // method: () => {}
        /^\s*(\w+)\s*:\s*(?:async\s+)?function\s*\(([^)]*)\)\s*\{/  // method: function() {}
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const name = match[1];
          const params = this.convertToParameterInfo(this.parseParameters(match[2] || ''));
          const isAsync = line.includes('async');
          const lineStart = i + 1;
          const lineEnd = this.findFunctionEnd(i);
          const docstring = this.extractDocstring(Math.max(0, i - 2), i);

          methods.push({
            name,
            parameters: params,
            isAsync,
            lineStart,
            lineEnd,
            docstring
          });
          break;
        }
      }
    }

    return methods;
  }

  private parseClassProperties(startLine: number, endLine: number): string[] {
    const properties: string[] = [];
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Property patterns - simple assignment in constructor or class body
      const patterns = [
        /^\s*this\.(\w+)\s*=/,  // this.property = value
        /^\s*(\w+)\s*=\s*[^(]/   // property = value (not a method)
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && !line.includes('(')) {
          properties.push(match[1]);
          break;
        }
      }
    }

    return properties;
  }


  private convertToParameterInfo(params: string[]): ParameterInfo[] {
    return params.map(param => ({
      name: param,
      optional: false,
      destructured: false
    }));
  }

  private convertToPropertyInfo(props: string[]): PropertyInfo[] {
    return props.map(prop => ({
      name: prop,
      visibility: 'public' as const
    }));
  }

  private convertToImportItems(items: string[]): ImportItem[] {
    return items.map(item => ({
      name: item
    }));
  }
}