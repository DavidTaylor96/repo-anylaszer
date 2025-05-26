import * as fs from 'fs';
import * as path from 'path';
import { FileInfo, ParseResult, CodePatternsAnalysis, CodePatternInfo } from '../types';

export class CodePatternsAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): CodePatternsAnalysis {
    const patterns = this.detectPatterns();
    const metrics = this.calculateMetrics(patterns);
    const suggestions = this.generateSuggestions(patterns);

    return {
      patterns,
      metrics,
      suggestions
    };
  }

  private detectPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    patterns.push(...this.detectArchitecturalPatterns());
    patterns.push(...this.detectNamingPatterns());
    patterns.push(...this.detectDesignPatterns());
    patterns.push(...this.detectAntiPatterns());

    return patterns;
  }

  private detectArchitecturalPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect MVC pattern
    const mvcPattern = this.detectMVCPattern();
    if (mvcPattern) patterns.push(mvcPattern);

    // Detect layered architecture
    const layeredPattern = this.detectLayeredArchitecture();
    if (layeredPattern) patterns.push(layeredPattern);

    // Detect microservices patterns
    const microservicesPattern = this.detectMicroservicesPattern();
    if (microservicesPattern) patterns.push(microservicesPattern);

    return patterns;
  }

  private detectNamingPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Check for consistent naming conventions
    patterns.push(...this.checkCamelCaseConsistency());
    patterns.push(...this.checkFileNamingConsistency());
    patterns.push(...this.checkConstantNaming());

    return patterns;
  }

  private detectDesignPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect Singleton pattern
    patterns.push(...this.detectSingletonPattern());

    // Detect Factory pattern
    patterns.push(...this.detectFactoryPattern());

    // Detect Observer pattern
    patterns.push(...this.detectObserverPattern());

    // Detect Repository pattern
    patterns.push(...this.detectRepositoryPattern());

    return patterns;
  }

  private detectAntiPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect God class anti-pattern
    patterns.push(...this.detectGodClass());

    // Detect long parameter lists
    patterns.push(...this.detectLongParameterLists());

    // Detect deep nesting
    patterns.push(...this.detectDeepNesting());

    // Detect magic numbers
    patterns.push(...this.detectMagicNumbers());

    return patterns;
  }

  private detectMVCPattern(): CodePatternInfo | null {
    const hasControllers = this.fileData.some(file => 
      file.path.toLowerCase().includes('controller') ||
      file.path.toLowerCase().includes('ctrl')
    );

    const hasModels = this.fileData.some(file => 
      file.path.toLowerCase().includes('model') ||
      file.path.toLowerCase().includes('entity')
    );

    const hasViews = this.fileData.some(file => 
      file.path.toLowerCase().includes('view') ||
      file.path.toLowerCase().includes('component') ||
      file.extension === '.html' ||
      file.extension === '.jsx' ||
      file.extension === '.tsx'
    );

    if (hasControllers && hasModels && hasViews) {
      return {
        pattern: 'MVC Architecture',
        type: 'architectural',
        description: 'Model-View-Controller architectural pattern detected',
        files: this.fileData.filter(f => 
          f.path.toLowerCase().includes('controller') ||
          f.path.toLowerCase().includes('model') ||
          f.path.toLowerCase().includes('view')
        ).map(f => f.path),
        examples: []
      };
    }

    return null;
  }

  private detectLayeredArchitecture(): CodePatternInfo | null {
    const layers = ['controller', 'service', 'repository', 'model', 'dto'];
    const detectedLayers = layers.filter(layer => 
      this.fileData.some(file => file.path.toLowerCase().includes(layer))
    );

    if (detectedLayers.length >= 3) {
      return {
        pattern: 'Layered Architecture',
        type: 'architectural',
        description: `Layered architecture with ${detectedLayers.length} layers: ${detectedLayers.join(', ')}`,
        files: this.fileData.filter(f => 
          detectedLayers.some(layer => f.path.toLowerCase().includes(layer))
        ).map(f => f.path),
        examples: []
      };
    }

    return null;
  }

  private detectMicroservicesPattern(): CodePatternInfo | null {
    // Look for multiple package.json files or service directories
    const packageJsonFiles = this.fileData.filter(f => f.path.endsWith('package.json'));
    const serviceDirectories = new Set(
      this.fileData
        .filter(f => f.path.includes('service') || f.path.includes('microservice'))
        .map(f => f.path.split('/')[0])
    );

    if (packageJsonFiles.length > 1 || serviceDirectories.size > 1) {
      return {
        pattern: 'Microservices Architecture',
        type: 'architectural',
        description: 'Multiple services or packages detected, suggesting microservices architecture',
        files: Array.from(serviceDirectories),
        examples: []
      };
    }

    return null;
  }

  private checkCamelCaseConsistency(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const violations: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Check function names
      for (const func of parseResult.functions) {
        if (!this.isCamelCase(func.name) && !this.isConstructor(func.name)) {
          violations.push({
            file: filePath,
            line: func.lineStart,
            code: func.name
          });
        }
      }

      // Check variable names in constants
      for (const constant of parseResult.constants) {
        if (!this.isCamelCase(constant.name) && !this.isConstantCase(constant.name)) {
          violations.push({
            file: filePath,
            line: constant.lineNumber || 0,
            code: constant.name
          });
        }
      }
    }

    if (violations.length > 0) {
      patterns.push({
        pattern: 'camelCase Naming Convention',
        type: 'naming',
        description: `Found ${violations.length} naming violations of camelCase convention`,
        files: [...new Set(violations.map(v => v.file))],
        examples: violations.slice(0, 5),
        severity: 'warning',
        suggestion: 'Use camelCase for function and variable names'
      });
    }

    return patterns;
  }

  private checkFileNamingConsistency(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const kebabCaseFiles = this.fileData.filter(f => this.isKebabCase(path.basename(f.path, f.extension)));
    const camelCaseFiles = this.fileData.filter(f => this.isCamelCase(path.basename(f.path, f.extension)));
    const pascalCaseFiles = this.fileData.filter(f => this.isPascalCase(path.basename(f.path, f.extension)));

    const total = this.fileData.length;
    const kebabRatio = kebabCaseFiles.length / total;
    const camelRatio = camelCaseFiles.length / total;
    const pascalRatio = pascalCaseFiles.length / total;

    // If no single convention dominates (>60%), flag as inconsistent
    if (kebabRatio < 0.6 && camelRatio < 0.6 && pascalRatio < 0.6) {
      patterns.push({
        pattern: 'Inconsistent File Naming',
        type: 'naming',
        description: 'Mixed file naming conventions detected',
        files: this.fileData.map(f => f.path),
        examples: [],
        severity: 'info',
        suggestion: 'Choose a consistent file naming convention (kebab-case, camelCase, or PascalCase)'
      });
    }

    return patterns;
  }

  private checkConstantNaming(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const violations: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const constant of parseResult.constants) {
        // Constants should be UPPER_CASE or camelCase
        if (constant.value && this.isConstantValue(constant.value)) {
          if (!this.isConstantCase(constant.name) && !this.isCamelCase(constant.name)) {
            violations.push({
              file: filePath,
              line: constant.lineNumber || 0,
              code: constant.name
            });
          }
        }
      }
    }

    if (violations.length > 0) {
      patterns.push({
        pattern: 'CONSTANT_CASE Naming',
        type: 'naming',
        description: `Found ${violations.length} constants not following CONSTANT_CASE convention`,
        files: [...new Set(violations.map(v => v.file))],
        examples: violations.slice(0, 5),
        severity: 'info',
        suggestion: 'Use CONSTANT_CASE for constant values'
      });
    }

    return patterns;
  }

  private detectSingletonPattern(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const singletons: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        // Look for singleton indicators
        const hasPrivateConstructor = cls.methods.some(m => 
          m.name === 'constructor' && m.visibility === 'private'
        );
        const hasGetInstanceMethod = cls.methods.some(m => 
          m.name.toLowerCase().includes('instance')
        );

        if (hasPrivateConstructor || hasGetInstanceMethod) {
          singletons.push({
            file: filePath,
            line: cls.lineStart,
            code: cls.name
          });
        }
      }
    }

    if (singletons.length > 0) {
      patterns.push({
        pattern: 'Singleton Pattern',
        type: 'design',
        description: `Found ${singletons.length} potential singleton implementations`,
        files: [...new Set(singletons.map(s => s.file))],
        examples: singletons,
        severity: 'info'
      });
    }

    return patterns;
  }

  private detectFactoryPattern(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const factories: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Look for factory classes or functions
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('factory')) {
          factories.push({
            file: filePath,
            line: cls.lineStart,
            code: cls.name
          });
        }
      }

      for (const func of parseResult.functions) {
        if (func.name.toLowerCase().includes('factory') || 
            func.name.toLowerCase().startsWith('create')) {
          factories.push({
            file: filePath,
            line: func.lineStart,
            code: func.name
          });
        }
      }
    }

    if (factories.length > 0) {
      patterns.push({
        pattern: 'Factory Pattern',
        type: 'design',
        description: `Found ${factories.length} potential factory implementations`,
        files: [...new Set(factories.map(f => f.file))],
        examples: factories,
        severity: 'info'
      });
    }

    return patterns;
  }

  private detectObserverPattern(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const observers: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        const hasObserverMethods = cls.methods.some(m => 
          m.name.includes('subscribe') || 
          m.name.includes('unsubscribe') || 
          m.name.includes('notify') || 
          m.name.includes('emit')
        );

        if (hasObserverMethods) {
          observers.push({
            file: filePath,
            line: cls.lineStart,
            code: cls.name
          });
        }
      }
    }

    if (observers.length > 0) {
      patterns.push({
        pattern: 'Observer Pattern',
        type: 'design',
        description: `Found ${observers.length} potential observer implementations`,
        files: [...new Set(observers.map(o => o.file))],
        examples: observers,
        severity: 'info'
      });
    }

    return patterns;
  }

  private detectRepositoryPattern(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const repositories: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('repository')) {
          repositories.push({
            file: filePath,
            line: cls.lineStart,
            code: cls.name
          });
        }
      }
    }

    if (repositories.length > 0) {
      patterns.push({
        pattern: 'Repository Pattern',
        type: 'design',
        description: `Found ${repositories.length} repository implementations`,
        files: [...new Set(repositories.map(r => r.file))],
        examples: repositories,
        severity: 'info'
      });
    }

    return patterns;
  }

  private detectGodClass(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const godClasses: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        // A class with too many methods or properties might be a God class
        const totalMembers = cls.methods.length + cls.properties.length;
        if (totalMembers > 20) {
          godClasses.push({
            file: filePath,
            line: cls.lineStart,
            code: `${cls.name} (${totalMembers} members)`
          });
        }
      }
    }

    if (godClasses.length > 0) {
      patterns.push({
        pattern: 'God Class Anti-pattern',
        type: 'anti-pattern',
        description: `Found ${godClasses.length} classes with too many responsibilities`,
        files: [...new Set(godClasses.map(g => g.file))],
        examples: godClasses,
        severity: 'warning',
        suggestion: 'Consider breaking down large classes into smaller, focused classes'
      });
    }

    return patterns;
  }

  private detectLongParameterLists(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const longParameterFunctions: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        if (func.parameters.length > 5) {
          longParameterFunctions.push({
            file: filePath,
            line: func.lineStart,
            code: `${func.name} (${func.parameters.length} parameters)`
          });
        }
      }
    }

    if (longParameterFunctions.length > 0) {
      patterns.push({
        pattern: 'Long Parameter List Anti-pattern',
        type: 'anti-pattern',
        description: `Found ${longParameterFunctions.length} functions with too many parameters`,
        files: [...new Set(longParameterFunctions.map(f => f.file))],
        examples: longParameterFunctions,
        severity: 'warning',
        suggestion: 'Consider using objects or configuration patterns for functions with many parameters'
      });
    }

    return patterns;
  }

  private detectDeepNesting(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const deeplyNestedFunctions: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        // Use complexity as a proxy for deep nesting
        if (func.complexity && func.complexity > 15) {
          deeplyNestedFunctions.push({
            file: filePath,
            line: func.lineStart,
            code: `${func.name} (complexity: ${func.complexity})`
          });
        }
      }
    }

    if (deeplyNestedFunctions.length > 0) {
      patterns.push({
        pattern: 'Deep Nesting Anti-pattern',
        type: 'anti-pattern',
        description: `Found ${deeplyNestedFunctions.length} functions with high complexity`,
        files: [...new Set(deeplyNestedFunctions.map(f => f.file))],
        examples: deeplyNestedFunctions,
        severity: 'warning',
        suggestion: 'Consider refactoring complex functions into smaller, simpler functions'
      });
    }

    return patterns;
  }

  private detectMagicNumbers(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];
    const magicNumbers: Array<{file: string, line: number, code: string}> = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      try {
        const content = fs.readFileSync(path.join(this.repoPath, filePath), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          // Look for numeric literals that might be magic numbers
          const numberMatches = line.match(/\b(\d{2,})\b/g);
          if (numberMatches) {
            for (const num of numberMatches) {
              // Skip common non-magic numbers
              if (!['100', '200', '300', '400', '500', '1000', '0', '1', '2'].includes(num)) {
                magicNumbers.push({
                  file: filePath,
                  line: i + 1,
                  code: `Magic number: ${num}`
                });
              }
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    if (magicNumbers.length > 0) {
      patterns.push({
        pattern: 'Magic Numbers Anti-pattern',
        type: 'anti-pattern',
        description: `Found ${magicNumbers.length} potential magic numbers`,
        files: [...new Set(magicNumbers.map(m => m.file))],
        examples: magicNumbers.slice(0, 10),
        severity: 'info',
        suggestion: 'Replace magic numbers with named constants'
      });
    }

    return patterns;
  }

  private calculateMetrics(patterns: CodePatternInfo[]): any {
    const patternsByType = patterns.reduce((acc, pattern) => {
      acc[pattern.type] = (acc[pattern.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const filesCovered = new Set(patterns.flatMap(p => p.files)).size;
    
    // Calculate adherence score (higher is better)
    const antiPatterns = patterns.filter(p => p.type === 'anti-pattern').length;
    const designPatterns = patterns.filter(p => p.type === 'design').length;
    const architecturalPatterns = patterns.filter(p => p.type === 'architectural').length;
    
    const adherenceScore = Math.max(0, 100 - (antiPatterns * 10) + (designPatterns * 5) + (architecturalPatterns * 10));

    return {
      totalPatterns: patterns.length,
      patternsByType,
      filesCovered,
      adherenceScore: Math.min(100, adherenceScore)
    };
  }

  private generateSuggestions(patterns: CodePatternInfo[]): string[] {
    const suggestions: string[] = [];

    const antiPatterns = patterns.filter(p => p.type === 'anti-pattern');
    if (antiPatterns.length > 0) {
      suggestions.push(`Address ${antiPatterns.length} anti-patterns to improve code quality`);
    }

    const architecturalPatterns = patterns.filter(p => p.type === 'architectural');
    if (architecturalPatterns.length === 0) {
      suggestions.push('Consider implementing a clear architectural pattern (MVC, layered architecture, etc.)');
    }

    const namingIssues = patterns.filter(p => p.type === 'naming');
    if (namingIssues.length > 0) {
      suggestions.push('Establish and enforce consistent naming conventions across the codebase');
    }

    return suggestions;
  }

  // Helper methods for naming conventions
  private isCamelCase(str: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }

  private isPascalCase(str: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }

  private isKebabCase(str: string): boolean {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  }

  private isConstantCase(str: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(str);
  }

  private isConstructor(str: string): boolean {
    return str === 'constructor';
  }

  private isConstantValue(value: string): boolean {
    // Check if the value looks like a constant (string literal, number, etc.)
    return /^(['"`].*['"`]|\d+|true|false|null|undefined)/.test(value.trim());
  }
}