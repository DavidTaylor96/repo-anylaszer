import { BaseParser } from './base-parser';
import { ParseResult, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, ConstantInfo } from '../types';

export class PythonParser extends BaseParser {
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
    
    const functionPattern = /^\s*(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?\s*:/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(functionPattern);
      
      if (match) {
        const name = match[1];
        const params = this.parseParameters(match[2] || '');
        const returnType = match[3]?.trim();
        const isAsync = line.includes('async');
        const lineStart = i + 1;
        const lineEnd = this.findFunctionEnd(i);
        const docstring = this.extractDocstring(i + 1, i + 5);

        functions.push({
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

    return functions;
  }

  private parseClasses(): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    const classPattern = /^\s*class\s+(\w+)(?:\(([^)]*)\))?\s*:/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(classPattern);
      
      if (match) {
        const name = match[1];
        const inheritance = match[2]?.split(',').map(s => s.trim()) || [];
        const lineStart = i + 1;
        const lineEnd = this.findClassEnd(i);
        const docstring = this.extractDocstring(i + 1, i + 5);

        const methods = this.parseClassMethods(lineStart, lineEnd);
        const properties = this.parseClassProperties(lineStart, lineEnd);

        classes.push({
          name,
          methods,
          properties,
          extends: inheritance[0],
          implements: inheritance.slice(1),
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
      /^import\s+(\w+(?:\.\w+)*)/,  // import module
      /^from\s+(\w+(?:\.\w+)*)\s+import\s+(.+)/,  // from module import items
      /^import\s+(\w+(?:\.\w+)*)\s+as\s+(\w+)/  // import module as alias
    ];

    for (const line of this.lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (line.startsWith('from')) {
            // from module import items
            const module = match[1];
            const itemsStr = match[2];
            let items: string[] = [];
            
            if (itemsStr === '*') {
              items = ['*'];
            } else {
              items = itemsStr.split(',').map(item => item.trim());
            }
            
            imports.push({
              module,
              items,
              isDefault: false
            });
          } else if (line.includes(' as ')) {
            // import module as alias
            const module = match[1];
            const alias = match[2];
            imports.push({
              module,
              items: [module],
              isDefault: true,
              alias
            });
          } else {
            // import module
            const module = match[1];
            imports.push({
              module,
              items: [module],
              isDefault: true
            });
          }
          break;
        }
      }
    }

    return imports;
  }

  private parseExports(): ExportInfo[] {
    // Python doesn't have explicit exports like JS/TS
    // We'll identify public functions and classes (those not starting with _)
    const exports: ExportInfo[] = [];
    
    for (const line of this.lines) {
      // Public function
      const funcMatch = line.match(/^\s*def\s+([^_]\w*)\s*\(/);
      if (funcMatch) {
        exports.push({ name: funcMatch[1], type: 'function' });
      }
      
      // Public class
      const classMatch = line.match(/^\s*class\s+([^_]\w*)\s*[:(]/);
      if (classMatch) {
        exports.push({ name: classMatch[1], type: 'class' });
      }
      
      // Public constants (uppercase variables)
      const constMatch = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=/);
      if (constMatch) {
        exports.push({ name: constMatch[1], type: 'constant' });
      }
    }

    return exports;
  }

  private parseConstants(): ConstantInfo[] {
    const constants: ConstantInfo[] = [];
    
    // Look for module-level variable assignments
    const pattern = /^\s*([A-Z][A-Z0-9_]*|[a-z_]\w*)\s*(?::\s*([^=]+))?\s*=\s*(.+)/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(pattern);
      
      if (match) {
        // Skip if inside a function or class (check indentation)
        if (this.isInsideBlock(i)) {
          continue;
        }
        
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
      // Remove type hints and default values
      let cleanParam = param.split('=')[0].split(':')[0].trim();
      // Remove *args and **kwargs prefixes
      cleanParam = cleanParam.replace(/^\*+/, '');
      return cleanParam;
    }).filter(param => param.length > 0 && param !== 'self' && param !== 'cls');
  }

  private findFunctionEnd(startLine: number): number {
    const startIndent = this.getIndentation(this.lines[startLine]);
    
    for (let i = startLine + 1; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) {
        continue;
      }
      
      const currentIndent = this.getIndentation(line);
      
      // If we find a line with same or less indentation, function ends
      if (currentIndent <= startIndent) {
        return i;
      }
    }
    
    return this.lines.length;
  }

  private findClassEnd(startLine: number): number {
    return this.findFunctionEnd(startLine); // Same logic for Python
  }

  private parseClassMethods(startLine: number, endLine: number): FunctionInfo[] {
    const methods: FunctionInfo[] = [];
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      const methodPattern = /^\s+(?:async\s+)?def\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?\s*:/;
      const match = line.match(methodPattern);
      
      if (match) {
        const name = match[1];
        const params = this.parseParameters(match[2] || '');
        const returnType = match[3]?.trim();
        const isAsync = line.includes('async');
        const lineStart = i + 1;
        const lineEnd = this.findFunctionEnd(i);
        const docstring = this.extractDocstring(i + 1, i + 5);

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
      
      // Look for self.property assignments in __init__ or other methods
      const selfPattern = /^\s+self\.(\w+)\s*=/;
      const match = line.match(selfPattern);
      
      if (match) {
        const propName = match[1];
        if (!properties.includes(propName)) {
          properties.push(propName);
        }
      }
      
      // Look for class variables (defined at class level)
      const classVarPattern = /^\s{4}(\w+)\s*(?::\s*[^=]+)?\s*=/;
      const classVarMatch = line.match(classVarPattern);
      
      if (classVarMatch && !line.includes('def ')) {
        const propName = classVarMatch[1];
        if (!properties.includes(propName)) {
          properties.push(propName);
        }
      }
    }

    return properties;
  }

  private getIndentation(line: string): number {
    let indent = 0;
    for (const char of line) {
      if (char === ' ') {
        indent++;
      } else if (char === '\t') {
        indent += 4; // Treat tab as 4 spaces
      } else {
        break;
      }
    }
    return indent;
  }

  private isInsideBlock(lineIndex: number): boolean {
    // Check if the line is inside a function or class by looking at indentation
    const line = this.lines[lineIndex];
    const indent = this.getIndentation(line);
    
    // If indented, it's likely inside a block
    return indent > 0;
  }
}