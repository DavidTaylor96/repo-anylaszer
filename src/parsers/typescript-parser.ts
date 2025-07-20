import { BaseParser } from './base-parser';
import { ParseResult, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, ConstantInfo, InterfaceInfo, TypeAliasInfo, ComponentInfo, ComponentStylingInfo, ParameterInfo, JSDocInfo, PropertyInfo, ImportItem, DatabaseSchemaInfo, CodePatternInfo, VectorEmbeddingInfo } from '../types';

export class TypeScriptParser extends BaseParser {
  public parse(): ParseResult {
    return {
      functions: this.parseFunctions(),
      classes: this.parseClasses(),
      imports: this.parseImports(),
      exports: this.parseExports(),
      constants: this.parseConstants(),
      interfaces: this.parseInterfaces(),
      typeAliases: this.parseTypeAliases(),
      components: this.parseReactComponents(),
      databaseSchemas: this.parseDatabaseSchemas(),
      codePatterns: this.parseCodePatterns(),
      embeddingChunks: this.createEmbeddingChunks()
    };
  }

  private parseFunctions(): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    
    // Control flow keywords to filter out
    const controlFlowKeywords = new Set([
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'try', 'catch', 'finally',
      'return', 'break', 'continue', 'throw', 'typeof', 'instanceof', 'new', 'delete',
      'var', 'let', 'const', 'class', 'interface', 'type', 'enum', 'namespace',
      'import', 'export', 'default', 'extends', 'implements', 'static', 'public',
      'private', 'protected', 'abstract', 'readonly', 'async', 'await', 'yield'
    ]);
    
    // Event handler patterns to filter out
    const eventHandlerPattern = /^(on[A-Z]\w*|handle[A-Z]\w*)$/;
    
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
          
          // Filter out control flow keywords and common event handlers
          if (controlFlowKeywords.has(name) || eventHandlerPattern.test(name)) {
            continue;
          }
          
          // Skip if it's not a proper function name (contains special chars, starts with number, etc.)
          if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
            continue;
          }
          
          const params = this.parseParameters(match[2] || '');
          const returnType = match[3]?.trim();
          const isAsync = line.includes('async');
          const lineStart = i + 1;
          const lineEnd = this.findFunctionEnd(i);
          const docstring = this.extractDocstring(Math.max(0, i - 3), i);
          const jsdoc = this.parseJSDoc(Math.max(0, i - 10), i);
          const complexity = this.calculateComplexity(lineStart, lineEnd);
          const visibility = this.extractVisibility(line);

          functions.push({
            name,
            parameters: params,
            returnType,
            isAsync,
            lineStart,
            lineEnd,
            docstring,
            jsdoc,
            complexity,
            visibility,
            isStatic: line.includes('static')
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
        const properties = this.parseClassPropertiesEnhanced(lineStart, lineEnd);

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

    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const line = this.lines[lineIndex];
      for (const pattern of patterns) {
        const match = line.match(pattern);
        const isTypeOnly = line.includes('import type');
        if (match) {
          if (pattern.source.includes('require')) {
            // Handle require syntax
            const itemsString = match[1] || match[2];
            const items = itemsString ? this.parseImportItems(itemsString) : [{name: match[2] || ''}];
            const module = match[3];
            imports.push({
              module,
              items,
              isDefault: !match[1],
              isTypeOnly: false,
              lineNumber: lineIndex + 1
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
              items = this.parseImportItems(itemsString);
            } else if (!isTypeOnly) {
              items = [{name: match[1]}];
              isDefault = true;
            } else {
              items = this.parseImportItems(match[1]);
            }

            imports.push({
              module,
              items,
              isDefault,
              isTypeOnly,
              lineNumber: lineIndex + 1
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

  private parseParameters(paramString: string): ParameterInfo[] {
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      const paramInfo: ParameterInfo = {
        name: '',
        optional: false,
        destructured: false
      };
      
      // Handle destructuring
      if (param.includes('{') || param.includes('[')) {
        paramInfo.destructured = true;
        paramInfo.name = param.trim();
        return paramInfo;
      }
      
      // Split by type annotation
      const [nameWithDefault, typeAnnotation] = param.split(':').map(s => s.trim());
      
      // Handle default values
      if (nameWithDefault.includes('=')) {
        const [name, defaultValue] = nameWithDefault.split('=').map(s => s.trim());
        paramInfo.name = name.replace('?', '');
        paramInfo.defaultValue = defaultValue;
        paramInfo.optional = name.includes('?') || !!defaultValue;
      } else {
        paramInfo.name = nameWithDefault.replace('?', '');
        paramInfo.optional = nameWithDefault.includes('?');
      }
      
      if (typeAnnotation) {
        paramInfo.type = typeAnnotation;
      }
      
      return paramInfo;
    }).filter(param => param.name.length > 0);
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


  private parseClassPropertiesEnhanced(startLine: number, endLine: number): PropertyInfo[] {
    const properties: PropertyInfo[] = [];
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Enhanced property pattern
      const propertyPattern = /^\s*(?:(public|private|protected)\s+)?(?:(static)\s+)?(?:(readonly)\s+)?(\w+)(?:\s*:\s*([^=;]+))?(?:\s*=\s*([^;]+))?[;]?$/;
      const match = line.match(propertyPattern);
      
      if (match && !line.includes('(') && !line.includes('function')) {
        const jsdoc = this.parseJSDoc(Math.max(0, i - 3), i);
        properties.push({
          name: match[4],
          type: match[5]?.trim(),
          visibility: (match[1] as any) || 'public',
          isStatic: !!match[2],
          isReadonly: !!match[3],
          defaultValue: match[6]?.trim(),
          jsdoc
        });
      }
    }

    return properties;
  }

  private parseInterfaces(): InterfaceInfo[] {
    const interfaces: InterfaceInfo[] = [];
    
    const interfacePattern = /^\s*(?:export\s+)?interface\s+(\w+)(?:\s+extends\s+([^{]+))?\s*\{/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(interfacePattern);
      
      if (match) {
        const name = match[1];
        const extendsInterfaces = match[2]?.split(',').map(s => s.trim()) || [];
        const lineStart = i + 1;
        const lineEnd = this.findEndLine(lineStart, '{', '}');
        const docstring = this.extractDocstring(Math.max(0, i - 3), i);

        const properties = this.parseInterfaceProperties(lineStart, lineEnd);
        const methods = this.parseInterfaceMethods(lineStart, lineEnd);

        interfaces.push({
          name,
          properties,
          methods,
          extends: extendsInterfaces,
          lineStart,
          lineEnd,
          docstring
        });
      }
    }

    return interfaces;
  }

  private parseTypeAliases(): TypeAliasInfo[] {
    const typeAliases: TypeAliasInfo[] = [];
    
    const typePattern = /^\s*(?:export\s+)?type\s+(\w+)(?:<[^>]*>)?\s*=\s*(.+)/;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const match = line.match(typePattern);
      
      if (match) {
        const name = match[1];
        const definition = match[2].trim();
        const lineStart = i + 1;
        const docstring = this.extractDocstring(Math.max(0, i - 3), i);

        typeAliases.push({
          name,
          definition,
          lineStart,
          docstring
        });
      }
    }

    return typeAliases;
  }

  private parseReactComponents(): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    
    // Patterns for React components
    const patterns = [
      /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*:\s*React\.FC<([^>]*)>\s*=\s*/,
      /^\s*(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)(?:\s*:\s*[^=]+)?\s*=>\s*\{?/,
      /^\s*(?:export\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*[^{]+)?\s*\{/,
      /^\s*(?:export\s+default\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*[^{]+)?\s*\{/
    ];

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match && this.isReactComponent(i)) {
          const name = match[1];
          const propsParam = match[2] || '';
          const lineStart = i + 1;
          const lineEnd = this.findFunctionEnd(i);
          const docstring = this.extractDocstring(Math.max(0, i - 3), i);

          const props = this.extractComponentProps(propsParam, lineStart, lineEnd);
          const hooks = this.extractReactHooks(lineStart, lineEnd);
          const jsx = this.containsJSX(lineStart, lineEnd);
          const styling = this.extractComponentStyling(lineStart, lineEnd);

          components.push({
            name,
            props,
            hooks,
            hasJSX: jsx,
            lineStart,
            lineEnd,
            docstring,
            styling
          });
          break;
        }
      }
    }

    return components;
  }

  private parseInterfaceProperties(startLine: number, endLine: number): Array<{name: string, type: string, optional: boolean}> {
    const properties: Array<{name: string, type: string, optional: boolean}> = [];
    
    for (let i = startLine - 1; i < Math.min(endLine - 1, this.lines.length); i++) {
      const line = this.lines[i].trim();
      
      // Property pattern: name?: type;
      const propertyPattern = /^(\w+)(\?)?:\s*([^;,}]+)[;,]?$/;
      const match = line.match(propertyPattern);
      
      if (match) {
        properties.push({
          name: match[1],
          type: match[3].trim(),
          optional: !!match[2]
        });
      }
    }

    return properties;
  }

  private parseInterfaceMethods(startLine: number, endLine: number): Array<{name: string, parameters: string[], returnType?: string}> {
    const methods: Array<{name: string, parameters: string[], returnType?: string}> = [];
    
    for (let i = startLine - 1; i < Math.min(endLine - 1, this.lines.length); i++) {
      const line = this.lines[i].trim();
      
      // Method pattern: methodName(params): returnType;
      const methodPattern = /^(\w+)\s*\(([^)]*)\):\s*([^;,}]+)[;,]?$/;
      const match = line.match(methodPattern);
      
      if (match) {
        const name = match[1];
        const params = this.parseParameters(match[2] || '');
        const returnType = match[3].trim();

        methods.push({
          name,
          parameters: params.map(p => p.name),
          returnType
        });
      }
    }

    return methods;
  }

  private isReactComponent(lineIndex: number): boolean {
    const line = this.lines[lineIndex];
    const functionContent = this.getFunctionContent(lineIndex);
    
    // Get function name
    const functionNameMatch = line.match(/(?:function\s+|const\s+|let\s+|var\s+)(\w+)/);
    if (!functionNameMatch) return false;
    
    const functionName = functionNameMatch[1];
    
    // Component name should start with uppercase letter
    if (!/^[A-Z]/.test(functionName)) return false;
    
    // Should not be a common event handler pattern
    if (/^(handle|on)[A-Z]/.test(functionName)) return false;
    
    // Check if this looks like a React component by examining the content
    const hasReactImport = this.lines.some(line => 
      line.includes("import") && (line.includes("react") || line.includes("React"))
    );
    
    // Look for JSX patterns (actual JSX elements, not just any angle brackets)
    const hasJSXReturn = /<[A-Z][^>]*>/.test(functionContent) || // Component JSX
                        /return\s*\([\s\S]*</.test(functionContent) || // JSX in return
                        /return\s*</.test(functionContent); // Direct JSX return
    
    // Look for React-specific type annotations
    const hasReactTypes = /React\.FC|ReactNode|JSX\.Element|ComponentProps/.test(functionContent);
    
    return hasReactImport && (hasJSXReturn || hasReactTypes);
  }

  private extractComponentProps(propsParam: string, _startLine: number, _endLine: number): Array<{name: string, type?: string, optional: boolean}> {
    const props: Array<{name: string, type?: string, optional: boolean}> = [];
    
    // Parse destructured props from parameter
    if (propsParam.includes('{')) {
      const destructuredMatch = propsParam.match(/\{\s*([^}]+)\s*\}/);
      if (destructuredMatch) {
        const propNames = destructuredMatch[1].split(',').map(p => p.trim());
        propNames.forEach(prop => {
          const [name, type] = prop.split(':').map(p => p.trim());
          props.push({
            name: name.replace('?', ''),
            type,
            optional: name.includes('?')
          });
        });
      }
    }
    
    // Look for Props interface definition
    const propsTypeName = propsParam.split(':')[1]?.trim();
    if (propsTypeName) {
      const propsInterface = this.findInterfaceDefinition(propsTypeName);
      if (propsInterface) {
        props.push(...propsInterface);
      }
    }

    return props;
  }

  private extractReactHooks(startLine: number, endLine: number): string[] {
    const hooks: string[] = [];
    const detailedHooks = new Set<string>();
    
    // Enhanced hook patterns with more detailed extraction
    const hookPatterns = [
      // Built-in React hooks
      {
        pattern: /const\s+\[([^,\]]+)(?:,\s*([^,\]]+))?\]\s*=\s*useState\s*\(([^)]*)\)/g,
        type: 'useState',
        extract: (match: RegExpMatchArray) => `useState(${match[1]}${match[2] ? `, ${match[2]}` : ''})`
      },
      {
        pattern: /useEffect\s*\(\s*([^,)]+)(?:,\s*\[([^\]]*)\])?\s*\)/g,
        type: 'useEffect',
        extract: (match: RegExpMatchArray) => `useEffect(${match[2] ? `deps: [${match[2]}]` : 'no deps'})`
      },
      {
        pattern: /const\s+([^=\s]+)\s*=\s*useContext\s*\(\s*([^)]+)\s*\)/g,
        type: 'useContext',
        extract: (match: RegExpMatchArray) => `useContext(${match[1]} -> ${match[2]})`
      },
      {
        pattern: /const\s+\[([^,\]]+)(?:,\s*([^,\]]+))?\]\s*=\s*useReducer\s*\(\s*([^,)]+)(?:,\s*([^)]+))?\s*\)/g,
        type: 'useReducer',
        extract: (match: RegExpMatchArray) => `useReducer(${match[1]}, ${match[3]})`
      },
      {
        pattern: /const\s+([^=\s]+)\s*=\s*useCallback\s*\(/g,
        type: 'useCallback',
        extract: (match: RegExpMatchArray) => `useCallback(${match[1]})`
      },
      {
        pattern: /const\s+([^=\s]+)\s*=\s*useMemo\s*\(/g,
        type: 'useMemo',
        extract: (match: RegExpMatchArray) => `useMemo(${match[1]})`
      },
      {
        pattern: /const\s+([^=\s]+)\s*=\s*useRef\s*\(([^)]*)\)/g,
        type: 'useRef',
        extract: (match: RegExpMatchArray) => `useRef(${match[1]})`
      },
      // Custom hooks
      {
        pattern: /const\s+([^=\s]+)\s*=\s*(use[A-Z]\w*)\s*\(/g,
        type: 'custom',
        extract: (match: RegExpMatchArray) => `${match[2]}(${match[1]})`
      },
      // Other React hooks
      {
        pattern: /(use(?:ImperativeHandle|LayoutEffect|DebugValue|Transition|DeferredValue))\s*\(/g,
        type: 'other',
        extract: (match: RegExpMatchArray) => match[1]
      }
    ];

    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      hookPatterns.forEach(({ pattern, extract }) => {
        let match;
        // Reset the regex lastIndex to avoid issues with global flag
        pattern.lastIndex = 0;
        while ((match = pattern.exec(line)) !== null) {
          const hookDetail = extract(match);
          if (!detailedHooks.has(hookDetail)) {
            detailedHooks.add(hookDetail);
            hooks.push(hookDetail);
          }
        }
      });
    }

    return hooks;
  }

  private containsJSX(startLine: number, endLine: number): boolean {
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      if (/<[A-Z]/.test(line) || /<\//.test(line) || /jsx/.test(line)) {
        return true;
      }
    }
    return false;
  }

  private findInterfaceDefinition(interfaceName: string): Array<{name: string, type?: string, optional: boolean}> | null {
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const interfaceMatch = line.match(new RegExp(`interface\\s+${interfaceName}\\s*\\{`));
      
      if (interfaceMatch) {
        const endLine = this.findEndLine(i + 1, '{', '}');
        return this.parseInterfaceProperties(i + 1, endLine);
      }
    }
    return null;
  }

  private getFunctionContent(startLine: number): string {
    const endLine = this.findFunctionEnd(startLine);
    return this.lines.slice(startLine, endLine).join('\n');
  }

  private parseDatabaseSchemas(): DatabaseSchemaInfo[] {
    // Placeholder implementation - returns empty array for now
    // Real implementation would parse database schemas from the code
    return [];
  }

  private parseCodePatterns(): CodePatternInfo[] {
    // Placeholder implementation - returns empty array for now
    // Real implementation would detect code patterns
    return [];
  }

  private createEmbeddingChunks(): VectorEmbeddingInfo[] {
    // Placeholder implementation - returns empty array for now
    // Real implementation would create embedding chunks
    return [];
  }

  private parseImportItems(itemsString: string): ImportItem[] {
    if (!itemsString) return [];
    
    return itemsString.split(',').map(item => {
      item = item.trim();
      
      // Handle aliased imports: "name as alias" or "type name"
      const aliasMatch = item.match(/(type\s+)?(\w+)(?:\s+as\s+(\w+))?/);
      if (aliasMatch) {
        return {
          name: aliasMatch[2],
          alias: aliasMatch[3],
          isType: !!aliasMatch[1]
        };
      }
      
      return { name: item };
    }).filter(item => item.name.length > 0);
  }

  private parseJSDoc(startLine: number, endLine: number): JSDocInfo | undefined {
    const jsdocInfo: JSDocInfo = {};
    let inJSDoc = false;
    let description = '';
    
    for (let i = startLine; i < endLine; i++) {
      const line = this.lines[i];
      
      if (line.includes('/**')) {
        inJSDoc = true;
        continue;
      }
      
      if (line.includes('*/')) {
        inJSDoc = false;
        break;
      }
      
      if (inJSDoc) {
        const trimmed = line.replace(/^\s*\*\s?/, '');
        
        // Parse JSDoc tags
        if (trimmed.startsWith('@param')) {
          const paramMatch = trimmed.match(/@param\s+(?:\{([^}]+)\}\s+)?(\w+)\s+(.*)/);
          if (paramMatch) {
            if (!jsdocInfo.params) jsdocInfo.params = [];
            jsdocInfo.params.push({
              name: paramMatch[2],
              type: paramMatch[1],
              description: paramMatch[3]
            });
          }
        } else if (trimmed.startsWith('@returns') || trimmed.startsWith('@return')) {
          const returnMatch = trimmed.match(/@returns?\s+(?:\{([^}]+)\}\s+)?(.*)/);
          if (returnMatch) {
            jsdocInfo.returns = {
              type: returnMatch[1],
              description: returnMatch[2]
            };
          }
        } else if (trimmed.startsWith('@throws')) {
          if (!jsdocInfo.throws) jsdocInfo.throws = [];
          jsdocInfo.throws.push(trimmed.replace('@throws', '').trim());
        } else if (trimmed.startsWith('@example')) {
          if (!jsdocInfo.examples) jsdocInfo.examples = [];
          jsdocInfo.examples.push(trimmed.replace('@example', '').trim());
        } else if (trimmed.startsWith('@deprecated')) {
          jsdocInfo.deprecated = true;
        } else if (trimmed.startsWith('@since')) {
          jsdocInfo.since = trimmed.replace('@since', '').trim();
        } else if (trimmed.startsWith('@author')) {
          jsdocInfo.author = trimmed.replace('@author', '').trim();
        } else if (trimmed.startsWith('@')) {
          const tagMatch = trimmed.match(/@(\w+)\s*(.*)/);
          if (tagMatch) {
            if (!jsdocInfo.tags) jsdocInfo.tags = [];
            jsdocInfo.tags.push({
              tag: tagMatch[1],
              value: tagMatch[2]
            });
          }
        } else if (trimmed && !trimmed.startsWith('@')) {
          description += (description ? ' ' : '') + trimmed;
        }
      }
    }
    
    if (description) {
      jsdocInfo.description = description;
    }
    
    return Object.keys(jsdocInfo).length > 0 ? jsdocInfo : undefined;
  }

  private calculateComplexity(startLine: number, endLine: number): number {
    let complexity = 1; // Base complexity
    
    for (let i = startLine - 1; i < Math.min(endLine, this.lines.length); i++) {
      const line = this.lines[i];
      
      // Count decision points
      const decisions = [
        /\bif\b/g,
        /\belse\s+if\b/g,
        /\bwhile\b/g,
        /\bfor\b/g,
        /\bswitch\b/g,
        /\bcase\b/g,
        /\bcatch\b/g,
        /\?.*:/g, // ternary operator
        /&&|\|\|/g // logical operators
      ];
      
      for (const pattern of decisions) {
        const matches = line.match(pattern);
        if (matches) {
          complexity += matches.length;
        }
      }
    }
    
    return complexity;
  }

  private extractVisibility(line: string): 'public' | 'private' | 'protected' {
    if (line.includes('private')) return 'private';
    if (line.includes('protected')) return 'protected';
    return 'public';
  }

  private extractComponentStyling(startLine: number, endLine: number): ComponentStylingInfo {
    const styling: ComponentStylingInfo = {
      type: 'none',
      imports: [],
      classNames: [],
      styledComponents: [],
      inlineStyles: []
    };

    // Check for styling imports
    const allImports = this.parseImports();
    const stylingImports = allImports.filter(imp => 
      imp.module.includes('styled-components') ||
      imp.module.includes('@emotion') ||
      imp.module.includes('.module.css') ||
      imp.module.includes('.module.scss') ||
      imp.module.includes('.scss') ||
      imp.module.includes('.css')
    );

    styling.imports = stylingImports.map(imp => imp.module);

    // Get component content
    const componentContent = this.lines.slice(startLine - 1, endLine - 1).join('\n');

    // Detect styling type and extract relevant information
    if (stylingImports.some(imp => imp.module.includes('styled-components') || imp.module.includes('@emotion'))) {
      styling.type = 'styled-components';
      styling.styledComponents = this.extractStyledComponents(componentContent);
    } else if (stylingImports.some(imp => imp.module.includes('.module.'))) {
      styling.type = 'css-modules';
      styling.classNames = this.extractCSSModuleClasses(componentContent);
    } else if (this.containsTailwindClasses(componentContent)) {
      styling.type = 'tailwind';
      styling.classNames = this.extractTailwindClasses(componentContent);
    } else if (stylingImports.some(imp => imp.module.includes('.scss'))) {
      styling.type = 'scss';
      styling.classNames = this.extractRegularClasses(componentContent);
    } else if (this.containsCSSInJS(componentContent)) {
      styling.type = 'css-in-js';
      styling.classNames = this.extractCSSInJSClasses(componentContent);
    } else if (this.containsInlineStyles(componentContent)) {
      styling.type = 'inline-styles';
      styling.inlineStyles = this.extractInlineStyles(componentContent);
    } else if (styling.imports.length > 0) {
      styling.type = 'scss'; // Default fallback for CSS imports
      styling.classNames = this.extractRegularClasses(componentContent);
    }

    return styling;
  }

  private extractStyledComponents(content: string): string[] {
    const styledComponents: string[] = [];
    const patterns = [
      /const\s+(\w+)\s*=\s*styled\.[a-zA-Z]+`/g,
      /const\s+(\w+)\s*=\s*styled\([^)]+\)`/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        styledComponents.push(match[1]);
      }
    }

    return styledComponents;
  }

  private extractCSSModuleClasses(content: string): string[] {
    const classes: string[] = [];
    const pattern = /className\s*=\s*\{?([^}]+\.)?(\w+)\}?/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1]) { // CSS module style (styles.className)
        classes.push(match[2]);
      }
    }

    return [...new Set(classes)];
  }

  private containsTailwindClasses(content: string): boolean {
    const tailwindPattern = /className\s*=\s*["`'][^"`']*\b(bg-|text-|p-|m-|w-|h-|flex|grid|border-)[^"`']*["`']/;
    return tailwindPattern.test(content);
  }

  private extractTailwindClasses(content: string): string[] {
    const classes: string[] = [];
    const pattern = /className\s*=\s*["`']([^"`']*)["`']/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const classString = match[1];
      const tailwindClasses = classString.split(/\s+/).filter(cls => 
        /^(bg-|text-|p-|m-|w-|h-|flex|grid|border-|rounded|shadow|hover:|focus:|sm:|md:|lg:|xl:)/.test(cls)
      );
      classes.push(...tailwindClasses);
    }

    return [...new Set(classes)];
  }

  private extractRegularClasses(content: string): string[] {
    const classes: string[] = [];
    const pattern = /className\s*=\s*["`']([^"`']*)["`']/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const classNames = match[1].split(/\s+/).filter(cls => cls.trim());
      classes.push(...classNames);
    }

    return [...new Set(classes)];
  }

  private containsCSSInJS(content: string): boolean {
    return /css`|css\s*\(/.test(content);
  }

  private extractCSSInJSClasses(content: string): string[] {
    const classes: string[] = [];
    const patterns = [
      /css`([^`]*)`/g,
      /css\s*\(([^)]*)\)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Extract CSS property names from CSS-in-JS
        const cssContent = match[1];
        const properties = cssContent.match(/(\w+(?:-\w+)*)\s*:/g);
        if (properties) {
          classes.push(...properties.map(prop => prop.replace(':', '')));
        }
      }
    }

    return [...new Set(classes)];
  }

  private containsInlineStyles(content: string): boolean {
    return /style\s*=\s*\{/.test(content);
  }

  private extractInlineStyles(content: string): Array<{element: string, properties: string[]}> {
    const inlineStyles: Array<{element: string, properties: string[]}> = [];
    const pattern = /<(\w+)[^>]*style\s*=\s*\{([^}]+)\}/g;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const element = match[1];
      const styleContent = match[2];
      
      // Extract CSS properties from inline styles
      const properties = styleContent.match(/(\w+(?:-\w+)*)\s*:/g);
      if (properties) {
        inlineStyles.push({
          element,
          properties: properties.map(prop => prop.replace(':', ''))
        });
      }
    }

    return inlineStyles;
  }
}