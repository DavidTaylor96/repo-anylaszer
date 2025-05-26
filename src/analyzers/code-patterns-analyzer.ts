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
    patterns.push(...this.detectStylingPatterns());
    patterns.push(...this.detectReactPatterns());
    patterns.push(...this.detectBuildToolPatterns());
    patterns.push(...this.detectKafkaPatterns());
    patterns.push(...this.detectAzurePatterns());
    patterns.push(...this.detectAWSPatterns());
    patterns.push(...this.detectDockerPatterns());
    patterns.push(...this.detectAuthPatterns());
    patterns.push(...this.detectConfigPatterns());

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

  private detectStylingPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect CSS Modules
    const cssModulesPattern = this.detectCSSModules();
    if (cssModulesPattern) patterns.push(cssModulesPattern);

    // Detect Styled Components
    const styledComponentsPattern = this.detectStyledComponents();
    if (styledComponentsPattern) patterns.push(styledComponentsPattern);

    // Detect Tailwind CSS
    const tailwindPattern = this.detectTailwindCSS();
    if (tailwindPattern) patterns.push(tailwindPattern);

    // Detect CSS-in-JS patterns
    const cssInJsPattern = this.detectCSSInJS();
    if (cssInJsPattern) patterns.push(cssInJsPattern);

    // Detect SCSS/SASS
    const scssPattern = this.detectSCSS();
    if (scssPattern) patterns.push(scssPattern);

    return patterns;
  }

  private detectReactPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect Next.js
    const nextjsPattern = this.detectNextJS();
    if (nextjsPattern) patterns.push(nextjsPattern);

    // Detect React Query/SWR
    const dataFetchingPattern = this.detectDataFetchingPatterns();
    if (dataFetchingPattern) patterns.push(dataFetchingPattern);

    // Detect React Router
    const routerPattern = this.detectReactRouter();
    if (routerPattern) patterns.push(routerPattern);

    // Detect React Testing patterns
    const testingPattern = this.detectReactTesting();
    if (testingPattern) patterns.push(testingPattern);

    // Detect Custom Hooks patterns
    const customHooksPattern = this.detectCustomHooks();
    if (customHooksPattern) patterns.push(customHooksPattern);

    return patterns;
  }

  private detectCSSModules(): CodePatternInfo | null {
    const cssModuleFiles = this.fileData.filter(f => 
      f.path.includes('.module.css') || 
      f.path.includes('.module.scss') ||
      f.path.includes('.module.sass')
    );

    const importPattern = /import\s+.*\s+from\s+['"]\.[^'"]*\.module\.(css|scss|sass)['"]/;
    const filesWithCSSModuleImports = this.getFilesWithPattern(importPattern);

    if (cssModuleFiles.length > 0 || filesWithCSSModuleImports.length > 0) {
      return {
        pattern: 'CSS Modules',
        type: 'styling',
        description: `CSS Modules pattern detected with ${cssModuleFiles.length} module files`,
        files: [...cssModuleFiles.map(f => f.path), ...filesWithCSSModuleImports],
        examples: cssModuleFiles.slice(0, 3).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectStyledComponents(): CodePatternInfo | null {
    const styledImportPattern = /import.*styled.*from\s+['"](styled-components|@emotion\/styled)['"]/;
    const styledUsagePattern = /styled\.[a-zA-Z]+`|styled\([^)]+\)`/;
    
    const filesWithStyledImports = this.getFilesWithPattern(styledImportPattern);
    const filesWithStyledUsage = this.getFilesWithPattern(styledUsagePattern);

    const allFiles = [...new Set([...filesWithStyledImports, ...filesWithStyledUsage])];

    if (allFiles.length > 0) {
      return {
        pattern: 'Styled Components',
        type: 'styling',
        description: `Styled Components/Emotion pattern detected in ${allFiles.length} files`,
        files: allFiles,
        examples: this.getPatternExamples(styledUsagePattern, allFiles.slice(0, 3))
      };
    }

    return null;
  }

  private detectTailwindCSS(): CodePatternInfo | null {
    const tailwindConfigFiles = this.fileData.filter(f => 
      f.path.includes('tailwind.config') || 
      f.path.includes('tailwind.config.js') ||
      f.path.includes('tailwind.config.ts')
    );

    const classNamePattern = /className\s*=\s*["`'][^"`']*\b(bg-|text-|p-|m-|w-|h-|flex|grid|border-)[^"`']*["`']/;
    const filesWithTailwindClasses = this.getFilesWithPattern(classNamePattern);

    if (tailwindConfigFiles.length > 0 || filesWithTailwindClasses.length > 0) {
      return {
        pattern: 'Tailwind CSS',
        type: 'styling',
        description: `Tailwind CSS utility-first framework detected`,
        files: [...tailwindConfigFiles.map(f => f.path), ...filesWithTailwindClasses],
        examples: this.getPatternExamples(classNamePattern, filesWithTailwindClasses.slice(0, 3))
      };
    }

    return null;
  }

  private detectCSSInJS(): CodePatternInfo | null {
    const cssInJsPatterns = [
      /import.*css.*from\s+['"](emotion|@emotion\/css|glamor)['"]/,
      /css`[^`]*`/,
      /css\s*\([^)]*\)/
    ];

    const allFiles: string[] = [];
    for (const pattern of cssInJsPatterns) {
      allFiles.push(...this.getFilesWithPattern(pattern));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'CSS-in-JS',
        type: 'styling',
        description: `CSS-in-JS pattern detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: this.getPatternExamples(cssInJsPatterns[1], uniqueFiles.slice(0, 3))
      };
    }

    return null;
  }

  private detectSCSS(): CodePatternInfo | null {
    const scssFiles = this.fileData.filter(f => 
      f.extension === '.scss' || f.extension === '.sass'
    );

    const importPattern = /import\s+['"]\.[^'"]*\.(scss|sass)['"]/;
    const filesWithScssImports = this.getFilesWithPattern(importPattern);

    if (scssFiles.length > 0 || filesWithScssImports.length > 0) {
      return {
        pattern: 'SCSS/SASS',
        type: 'styling',
        description: `SCSS/SASS preprocessor detected with ${scssFiles.length} files`,
        files: [...scssFiles.map(f => f.path), ...filesWithScssImports],
        examples: scssFiles.slice(0, 3).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectNextJS(): CodePatternInfo | null {
    const nextConfigFiles = this.fileData.filter(f => 
      f.path.includes('next.config') || f.path === 'pages' || f.path.includes('/pages/')
    );

    const nextImportPattern = /import.*from\s+['"]next\//;
    const filesWithNextImports = this.getFilesWithPattern(nextImportPattern);

    if (nextConfigFiles.length > 0 || filesWithNextImports.length > 0) {
      return {
        pattern: 'Next.js Framework',
        type: 'framework',
        description: `Next.js React framework detected`,
        files: [...nextConfigFiles.map(f => f.path), ...filesWithNextImports],
        examples: this.getPatternExamples(nextImportPattern, filesWithNextImports.slice(0, 3))
      };
    }

    return null;
  }

  private detectDataFetchingPatterns(): CodePatternInfo | null {
    const dataFetchingPatterns = [
      /import.*from\s+['"](react-query|@tanstack\/react-query|swr|apollo-client)['"]/,
      /(useQuery|useMutation|useSWR|useApolloClient)\s*\(/,
      /(QueryClient|SWRConfig|ApolloProvider)/
    ];

    const allFiles: string[] = [];
    const patternNames: string[] = [];

    for (const pattern of dataFetchingPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      
      if (matchedFiles.length > 0) {
        if (pattern.source.includes('react-query') || pattern.source.includes('tanstack')) {
          patternNames.push('React Query');
        } else if (pattern.source.includes('swr')) {
          patternNames.push('SWR');
        } else if (pattern.source.includes('apollo')) {
          patternNames.push('Apollo Client');
        }
      }
    }

    const uniqueFiles = [...new Set(allFiles)];
    const uniquePatterns = [...new Set(patternNames)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Data Fetching Libraries',
        type: 'data-fetching',
        description: `Data fetching patterns detected: ${uniquePatterns.join(', ')}`,
        files: uniqueFiles,
        examples: this.getPatternExamples(dataFetchingPatterns[1], uniqueFiles.slice(0, 3))
      };
    }

    return null;
  }

  private detectReactRouter(): CodePatternInfo | null {
    const routerPattern = /import.*from\s+['"](react-router|react-router-dom|@reach\/router)['"]/;
    const routeComponentPattern = /(Route|Router|Switch|Link|NavLink|Outlet)\s*[<(]/;
    
    const filesWithRouterImports = this.getFilesWithPattern(routerPattern);
    const filesWithRouteComponents = this.getFilesWithPattern(routeComponentPattern);

    const allFiles = [...new Set([...filesWithRouterImports, ...filesWithRouteComponents])];

    if (allFiles.length > 0) {
      return {
        pattern: 'React Router',
        type: 'routing',
        description: `React Router navigation pattern detected in ${allFiles.length} files`,
        files: allFiles,
        examples: this.getPatternExamples(routeComponentPattern, allFiles.slice(0, 3))
      };
    }

    return null;
  }

  private detectReactTesting(): CodePatternInfo | null {
    const testingPatterns = [
      /import.*from\s+['"](react-testing-library|@testing-library\/react|@testing-library\/jest-dom)['"]/,
      /(render|screen|fireEvent|waitFor)\s*\(/,
      /describe\s*\(\s*['"'][^'"]*['"]\s*,/
    ];

    const testFiles = this.fileData.filter(f => 
      f.path.includes('.test.') || 
      f.path.includes('.spec.') ||
      f.path.includes('__tests__')
    );

    const allFiles: string[] = testFiles.map(f => f.path);
    for (const pattern of testingPatterns) {
      allFiles.push(...this.getFilesWithPattern(pattern));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'React Testing Patterns',
        type: 'testing',
        description: `React testing setup detected with ${uniqueFiles.length} test files`,
        files: uniqueFiles,
        examples: this.getPatternExamples(testingPatterns[1], uniqueFiles.slice(0, 3))
      };
    }

    return null;
  }

  private detectCustomHooks(): CodePatternInfo | null {
    const customHookPattern = /^use[A-Z][a-zA-Z]*\s*[=:]/m;
    const filesWithCustomHooks = this.getFilesWithPattern(customHookPattern);

    // Also check for files in hooks directory
    const hookFiles = this.fileData.filter(f => 
      f.path.includes('/hooks/') || 
      f.path.includes('useHook') ||
      f.path.includes('hook')
    );

    const allFiles = [...new Set([...filesWithCustomHooks, ...hookFiles.map(f => f.path)])];

    if (allFiles.length > 0) {
      return {
        pattern: 'Custom React Hooks',
        type: 'react-pattern',
        description: `Custom React hooks pattern detected in ${allFiles.length} files`,
        files: allFiles,
        examples: this.getPatternExamples(customHookPattern, allFiles.slice(0, 3))
      };
    }

    return null;
  }

  private getFilesWithPattern(pattern: RegExp): string[] {
    const matchedFiles: string[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      try {
        const content = fs.readFileSync(path.join(this.repoPath, filePath), 'utf-8');
        if (pattern.test(content)) {
          matchedFiles.push(filePath);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return matchedFiles;
  }

  private getPatternExamples(pattern: RegExp, files: string[]): Array<{file: string, line: number, code: string}> {
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(path.join(this.repoPath, filePath), 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const match = line.match(pattern);
          if (match) {
            examples.push({
              file: filePath,
              line: i + 1,
              code: line.trim()
            });
            break; // Only first match per file
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return examples;
  }

  private detectBuildToolPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect Vite
    const vitePattern = this.detectVite();
    if (vitePattern) patterns.push(vitePattern);

    // Detect Webpack
    const webpackPattern = this.detectWebpack();
    if (webpackPattern) patterns.push(webpackPattern);

    // Detect Rollup
    const rollupPattern = this.detectRollup();
    if (rollupPattern) patterns.push(rollupPattern);

    // Detect ESBuild
    const esbuildPattern = this.detectESBuild();
    if (esbuildPattern) patterns.push(esbuildPattern);

    // Detect package.json scripts patterns
    const scriptsPattern = this.detectPackageJsonScripts();
    if (scriptsPattern) patterns.push(scriptsPattern);

    return patterns;
  }

  private detectVite(): CodePatternInfo | null {
    const viteConfigFiles = this.fileData.filter(f => 
      f.path.includes('vite.config') || 
      f.path.includes('vitest.config')
    );

    const viteInPackageJson = this.checkPackageJsonDependency('vite');

    if (viteConfigFiles.length > 0 || viteInPackageJson) {
      return {
        pattern: 'Vite Build Tool',
        type: 'build-tool',
        description: `Vite build tool detected`,
        files: viteConfigFiles.map(f => f.path),
        examples: viteConfigFiles.slice(0, 2).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectWebpack(): CodePatternInfo | null {
    const webpackConfigFiles = this.fileData.filter(f => 
      f.path.includes('webpack.config') ||
      f.path.includes('webpack.') ||
      f.path === 'webpack.config.js' ||
      f.path === 'webpack.config.ts'
    );

    const webpackInPackageJson = this.checkPackageJsonDependency('webpack');

    if (webpackConfigFiles.length > 0 || webpackInPackageJson) {
      return {
        pattern: 'Webpack Build Tool',
        type: 'build-tool',
        description: `Webpack build tool detected`,
        files: webpackConfigFiles.map(f => f.path),
        examples: webpackConfigFiles.slice(0, 2).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectRollup(): CodePatternInfo | null {
    const rollupConfigFiles = this.fileData.filter(f => 
      f.path.includes('rollup.config') ||
      f.path === 'rollup.config.js' ||
      f.path === 'rollup.config.ts'
    );

    const rollupInPackageJson = this.checkPackageJsonDependency('rollup');

    if (rollupConfigFiles.length > 0 || rollupInPackageJson) {
      return {
        pattern: 'Rollup Build Tool',
        type: 'build-tool',
        description: `Rollup build tool detected`,
        files: rollupConfigFiles.map(f => f.path),
        examples: rollupConfigFiles.slice(0, 2).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectESBuild(): CodePatternInfo | null {
    const esbuildConfigFiles = this.fileData.filter(f => 
      f.path.includes('esbuild') ||
      f.path.includes('.esbuild')
    );

    const esbuildInPackageJson = this.checkPackageJsonDependency('esbuild');

    if (esbuildConfigFiles.length > 0 || esbuildInPackageJson) {
      return {
        pattern: 'ESBuild Build Tool',
        type: 'build-tool',
        description: `ESBuild build tool detected`,
        files: esbuildConfigFiles.map(f => f.path),
        examples: esbuildConfigFiles.slice(0, 2).map(f => ({
          file: f.path,
          line: 1,
          code: f.path
        }))
      };
    }

    return null;
  }

  private detectPackageJsonScripts(): CodePatternInfo | null {
    const packageJsonFile = this.fileData.find(f => f.path === 'package.json');
    
    if (!packageJsonFile) return null;

    try {
      const content = fs.readFileSync(path.join(this.repoPath, packageJsonFile.path), 'utf-8');
      const packageJson = JSON.parse(content);
      
      if (packageJson.scripts && Object.keys(packageJson.scripts).length > 0) {
        const scripts = Object.keys(packageJson.scripts);
        const commonPatterns = this.analyzeScriptPatterns(packageJson.scripts);
        
        return {
          pattern: 'Package.json Scripts',
          type: 'build-tool',
          description: `Package.json scripts detected: ${scripts.join(', ')}`,
          files: [packageJsonFile.path],
          examples: commonPatterns.map(pattern => ({
            file: packageJsonFile.path,
            line: 1,
            code: `${pattern.name}: ${pattern.command}`
          }))
        };
      }
    } catch (error) {
      // Skip if can't parse package.json
    }

    return null;
  }

  private checkPackageJsonDependency(dependencyName: string): boolean {
    const packageJsonFile = this.fileData.find(f => f.path === 'package.json');
    
    if (!packageJsonFile) return false;

    try {
      const content = fs.readFileSync(path.join(this.repoPath, packageJsonFile.path), 'utf-8');
      const packageJson = JSON.parse(content);
      
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };
      
      return Object.keys(deps).some(dep => dep.includes(dependencyName));
    } catch (error) {
      return false;
    }
  }

  private analyzeScriptPatterns(scripts: Record<string, string>): Array<{name: string, command: string}> {
    const patterns: Array<{name: string, command: string}> = [];
    
    // Common script patterns to highlight
    const importantScripts = ['build', 'dev', 'start', 'test', 'lint', 'format'];
    
    for (const scriptName of importantScripts) {
      if (scripts[scriptName]) {
        patterns.push({
          name: scriptName,
          command: scripts[scriptName]
        });
      }
    }
    
    return patterns.slice(0, 5); // Limit to 5 most important
  }

  private detectKafkaPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect Kafka Producers
    const producerPattern = this.detectKafkaProducers();
    if (producerPattern) patterns.push(producerPattern);

    // Detect Kafka Consumers
    const consumerPattern = this.detectKafkaConsumers();
    if (consumerPattern) patterns.push(consumerPattern);

    // Detect Kafka Admin/Topic Management
    const adminPattern = this.detectKafkaAdmin();
    if (adminPattern) patterns.push(adminPattern);

    // Detect Kafka Configuration
    const configPattern = this.detectKafkaConfiguration();
    if (configPattern) patterns.push(configPattern);

    return patterns;
  }

  private detectKafkaProducers(): CodePatternInfo | null {
    const kafkaImportPattern = /import.*from\s+['"](kafkajs|kafka-node|node-rdkafka)['"]/;
    const producerPatterns = [
      /\.producer\s*\(/,
      /new\s+Producer\s*\(/,
      /createProducer\s*\(/,
      /\.send\s*\(\s*\{/,
      /\.produce\s*\(/
    ];

    const filesWithKafkaImports = this.getFilesWithPattern(kafkaImportPattern);
    const allProducerFiles: string[] = [];
    const producerExamples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of producerPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allProducerFiles.push(...matchedFiles);
      
      // Get examples for this pattern
      const examples = this.getPatternExamples(pattern, matchedFiles.slice(0, 2));
      producerExamples.push(...examples);
    }

    const uniqueFiles = [...new Set([...filesWithKafkaImports, ...allProducerFiles])];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Kafka Producers',
        type: 'messaging',
        description: `Kafka producer patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: producerExamples.slice(0, 5)
      };
    }

    return null;
  }

  private detectKafkaConsumers(): CodePatternInfo | null {
    const consumerPatterns = [
      /\.consumer\s*\(/,
      /new\s+Consumer\s*\(/,
      /createConsumer\s*\(/,
      /\.subscribe\s*\(\s*\{/,
      /\.run\s*\(\s*\{/,
      /eachMessage\s*:/,
      /eachBatch\s*:/,
      /\.consume\s*\(/
    ];

    const allConsumerFiles: string[] = [];
    const consumerExamples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of consumerPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allConsumerFiles.push(...matchedFiles);
      
      const examples = this.getPatternExamples(pattern, matchedFiles.slice(0, 2));
      consumerExamples.push(...examples);
    }

    const uniqueFiles = [...new Set(allConsumerFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Kafka Consumers',
        type: 'messaging',
        description: `Kafka consumer patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: consumerExamples.slice(0, 5)
      };
    }

    return null;
  }

  private detectKafkaAdmin(): CodePatternInfo | null {
    const adminPatterns = [
      /\.admin\s*\(/,
      /new\s+Admin\s*\(/,
      /createAdmin\s*\(/,
      /createTopics\s*\(/,
      /deleteTopics\s*\(/,
      /listTopics\s*\(/,
      /describeTopics\s*\(/,
      /createPartitions\s*\(/,
      /describeCluster\s*\(/
    ];

    const allAdminFiles: string[] = [];
    const adminExamples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of adminPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allAdminFiles.push(...matchedFiles);
      
      const examples = this.getPatternExamples(pattern, matchedFiles.slice(0, 2));
      adminExamples.push(...examples);
    }

    const uniqueFiles = [...new Set(allAdminFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Kafka Admin/Topic Management',
        type: 'messaging',
        description: `Kafka admin operations detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: adminExamples.slice(0, 5)
      };
    }

    return null;
  }

  private detectKafkaConfiguration(): CodePatternInfo | null {
    const configPatterns = [
      /brokers\s*:\s*\[/,
      /clientId\s*:/,
      /groupId\s*:/,
      /topics\s*:\s*\[/,
      /partitions\s*:/,
      /replicationFactor\s*:/,
      /acks\s*:/,
      /retries\s*:/,
      /sessionTimeout\s*:/,
      /heartbeatInterval\s*:/,
      /autoCommit\s*:/,
      /KAFKA_BROKERS/,
      /KAFKA_CLIENT_ID/,
      /KAFKA_GROUP_ID/
    ];

    const allConfigFiles: string[] = [];
    const configExamples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of configPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allConfigFiles.push(...matchedFiles);
      
      const examples = this.getPatternExamples(pattern, matchedFiles.slice(0, 2));
      configExamples.push(...examples);
    }

    // Also check for Kafka-specific environment files
    const kafkaConfigFiles = this.fileData.filter(f => 
      f.path.toLowerCase().includes('kafka') ||
      f.path.toLowerCase().includes('message') ||
      f.path.toLowerCase().includes('broker')
    );

    const uniqueFiles = [...new Set([...allConfigFiles, ...kafkaConfigFiles.map(f => f.path)])];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Kafka Configuration',
        type: 'messaging',
        description: `Kafka configuration patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: configExamples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzurePatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect Azure Service Bus
    const serviceBusPattern = this.detectAzureServiceBus();
    if (serviceBusPattern) patterns.push(serviceBusPattern);

    // Detect Azure Functions
    const functionsPattern = this.detectAzureFunctions();
    if (functionsPattern) patterns.push(functionsPattern);

    // Detect Azure Storage
    const storagePattern = this.detectAzureStorage();
    if (storagePattern) patterns.push(storagePattern);

    // Detect Azure Key Vault
    const keyVaultPattern = this.detectAzureKeyVault();
    if (keyVaultPattern) patterns.push(keyVaultPattern);

    // Detect Azure SQL/Cosmos DB
    const databasePattern = this.detectAzureDatabases();
    if (databasePattern) patterns.push(databasePattern);

    // Detect Azure Event Hubs
    const eventHubsPattern = this.detectAzureEventHubs();
    if (eventHubsPattern) patterns.push(eventHubsPattern);

    // Detect Azure Application Insights
    const appInsightsPattern = this.detectAzureAppInsights();
    if (appInsightsPattern) patterns.push(appInsightsPattern);

    return patterns;
  }

  private detectAzureServiceBus(): CodePatternInfo | null {
    const serviceBusPatterns = [
      /import.*from\s+['"]\@azure\/service-bus['"]/,
      /ServiceBusClient\s*\(/,
      /createSender\s*\(/,
      /createReceiver\s*\(/,
      /sendMessages\s*\(/,
      /receiveMessages\s*\(/,
      /completeMessage\s*\(/,
      /abandonMessage\s*\(/,
      /AZURE_SERVICE_BUS/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of serviceBusPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Service Bus',
        type: 'cloud-service',
        description: `Azure Service Bus messaging patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureFunctions(): CodePatternInfo | null {
    const functionsPatterns = [
      /import.*from\s+['"]\@azure\/functions['"]/,
      /module\.exports\s*=\s*async\s+function/,
      /context\.(log|res|req)/,
      /HttpRequest/,
      /HttpResponse/,
      /InvocationContext/,
      /FunctionInput/,
      /FunctionOutput/,
      /host\.json/,
      /function\.json/
    ];

    const functionFiles = this.fileData.filter(f => 
      f.path.includes('function.json') || 
      f.path.includes('host.json') ||
      f.path.includes('Functions/')
    );

    const allFiles: string[] = functionFiles.map(f => f.path);
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of functionsPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Functions',
        type: 'cloud-service',
        description: `Azure Functions serverless patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureStorage(): CodePatternInfo | null {
    const storagePatterns = [
      /import.*from\s+['"]\@azure\/storage-blob['"]/,
      /import.*from\s+['"]\@azure\/storage-queue['"]/,
      /import.*from\s+['"]\@azure\/storage-file-share['"]/,
      /BlobServiceClient/,
      /QueueServiceClient/,
      /ShareServiceClient/,
      /getContainerClient/,
      /uploadData\s*\(/,
      /downloadToBuffer\s*\(/,
      /sendMessage\s*\(/,
      /receiveMessages\s*\(/,
      /AZURE_STORAGE/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of storagePatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Storage',
        type: 'cloud-service',
        description: `Azure Storage (Blob/Queue/File) patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureKeyVault(): CodePatternInfo | null {
    const keyVaultPatterns = [
      /import.*from\s+['"]\@azure\/keyvault-secrets['"]/,
      /import.*from\s+['"]\@azure\/keyvault-keys['"]/,
      /SecretClient/,
      /KeyClient/,
      /getSecret\s*\(/,
      /setSecret\s*\(/,
      /getKey\s*\(/,
      /AZURE_KEY_VAULT/,
      /\.vault\.azure\.net/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of keyVaultPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Key Vault',
        type: 'cloud-service',
        description: `Azure Key Vault secrets management patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureDatabases(): CodePatternInfo | null {
    const databasePatterns = [
      /import.*from\s+['"]\@azure\/cosmos['"]/,
      /import.*from\s+['"]mssql['"]/,
      /CosmosClient/,
      /ConnectionPool/,
      /database\s*\.\s*container/,
      /createItem\s*\(/,
      /readItem\s*\(/,
      /query\s*\(/,
      /AZURE_COSMOS/,
      /AZURE_SQL/,
      /\.documents\.azure\.com/,
      /\.database\.windows\.net/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of databasePatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Databases',
        type: 'cloud-service',
        description: `Azure SQL/Cosmos DB patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureEventHubs(): CodePatternInfo | null {
    const eventHubsPatterns = [
      /import.*from\s+['"]\@azure\/event-hubs['"]/,
      /EventHubProducerClient/,
      /EventHubConsumerClient/,
      /createBatch\s*\(/,
      /sendBatch\s*\(/,
      /subscribe\s*\(/,
      /AZURE_EVENT_HUB/,
      /\.servicebus\.windows\.net/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of eventHubsPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Event Hubs',
        type: 'cloud-service',
        description: `Azure Event Hubs streaming patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAzureAppInsights(): CodePatternInfo | null {
    const appInsightsPatterns = [
      /import.*from\s+['"]applicationinsights['"]/,
      /TelemetryClient/,
      /trackEvent\s*\(/,
      /trackException\s*\(/,
      /trackMetric\s*\(/,
      /trackTrace\s*\(/,
      /trackDependency\s*\(/,
      /APPINSIGHTS_INSTRUMENTATIONKEY/,
      /AZURE_APPLICATION_INSIGHTS/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of appInsightsPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'Azure Application Insights',
        type: 'cloud-service',
        description: `Azure Application Insights monitoring patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAWSPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    // Detect AWS Lambda
    const lambdaPattern = this.detectAWSLambda();
    if (lambdaPattern) patterns.push(lambdaPattern);

    // Detect AWS S3
    const s3Pattern = this.detectAWSS3();
    if (s3Pattern) patterns.push(s3Pattern);

    // Detect AWS SQS
    const sqsPattern = this.detectAWSSQS();
    if (sqsPattern) patterns.push(sqsPattern);

    // Detect AWS DynamoDB
    const dynamoPattern = this.detectAWSDynamoDB();
    if (dynamoPattern) patterns.push(dynamoPattern);

    return patterns;
  }

  private detectAWSLambda(): CodePatternInfo | null {
    const lambdaPatterns = [
      /exports\.handler\s*=/,
      /exports\.lambdaHandler\s*=/,
      /event\s*,\s*context/,
      /callback\s*\(/,
      /context\.succeed/,
      /context\.fail/,
      /AWS_LAMBDA/,
      /serverless\.yml/,
      /sam-template/
    ];

    const lambdaFiles = this.fileData.filter(f => 
      f.path.includes('serverless.yml') || 
      f.path.includes('sam-template') ||
      f.path.includes('lambda')
    );

    const allFiles: string[] = lambdaFiles.map(f => f.path);
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of lambdaPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'AWS Lambda',
        type: 'cloud-service',
        description: `AWS Lambda serverless patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAWSS3(): CodePatternInfo | null {
    const s3Patterns = [
      /import.*from\s+['"]aws-sdk['"]/,
      /import.*from\s+['"]\@aws-sdk\/client-s3['"]/,
      /S3Client/,
      /PutObjectCommand/,
      /GetObjectCommand/,
      /DeleteObjectCommand/,
      /ListObjectsCommand/,
      /putObject\s*\(/,
      /getObject\s*\(/,
      /deleteObject\s*\(/,
      /AWS_S3/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of s3Patterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'AWS S3',
        type: 'cloud-service',
        description: `AWS S3 storage patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAWSSQS(): CodePatternInfo | null {
    const sqsPatterns = [
      /import.*from\s+['"]\@aws-sdk\/client-sqs['"]/,
      /SQSClient/,
      /SendMessageCommand/,
      /ReceiveMessageCommand/,
      /DeleteMessageCommand/,
      /sendMessage\s*\(/,
      /receiveMessage\s*\(/,
      /deleteMessage\s*\(/,
      /AWS_SQS/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of sqsPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'AWS SQS',
        type: 'cloud-service',
        description: `AWS SQS messaging patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectAWSDynamoDB(): CodePatternInfo | null {
    const dynamoPatterns = [
      /import.*from\s+['"]\@aws-sdk\/client-dynamodb['"]/,
      /import.*from\s+['"]\@aws-sdk\/lib-dynamodb['"]/,
      /DynamoDBClient/,
      /DynamoDBDocumentClient/,
      /PutCommand/,
      /GetCommand/,
      /UpdateCommand/,
      /DeleteCommand/,
      /QueryCommand/,
      /ScanCommand/,
      /putItem\s*\(/,
      /getItem\s*\(/,
      /AWS_DYNAMODB/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of dynamoPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      return {
        pattern: 'AWS DynamoDB',
        type: 'cloud-service',
        description: `AWS DynamoDB database patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      };
    }

    return null;
  }

  private detectDockerPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    const dockerfiles = this.fileData.filter(f => 
      f.path.toLowerCase().includes('dockerfile') ||
      f.path.includes('docker-compose') ||
      f.path.includes('.dockerignore')
    );

    const dockerConfigPatterns = [
      /FROM\s+/,
      /RUN\s+/,
      /COPY\s+/,
      /WORKDIR\s+/,
      /EXPOSE\s+/,
      /CMD\s+/,
      /ENTRYPOINT\s+/,
      /ENV\s+/
    ];

    if (dockerfiles.length > 0) {
      const examples: Array<{file: string, line: number, code: string}> = [];
      
      for (const pattern of dockerConfigPatterns) {
        examples.push(...this.getPatternExamples(pattern, dockerfiles.map(f => f.path).slice(0, 2)));
      }

      patterns.push({
        pattern: 'Docker Containerization',
        type: 'infrastructure',
        description: `Docker containerization detected with ${dockerfiles.length} configuration files`,
        files: dockerfiles.map(f => f.path),
        examples: examples.slice(0, 5)
      });
    }

    return patterns;
  }

  private detectAuthPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    const authPatterns = [
      /import.*from\s+['"]jsonwebtoken['"]/,
      /import.*from\s+['"]passport['"]/,
      /import.*from\s+['"]bcrypt['"]/,
      /jwt\.sign\s*\(/,
      /jwt\.verify\s*\(/,
      /bcrypt\.hash\s*\(/,
      /bcrypt\.compare\s*\(/,
      /passport\.authenticate/,
      /OAuth/,
      /SAML/,
      /authenticate\s*\(/,
      /authorize\s*\(/,
      /middleware.*auth/,
      /JWT_SECRET/,
      /OAUTH_/
    ];

    const allFiles: string[] = [];
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of authPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      patterns.push({
        pattern: 'Authentication & Authorization',
        type: 'security',
        description: `Authentication and authorization patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      });
    }

    return patterns;
  }

  private detectConfigPatterns(): CodePatternInfo[] {
    const patterns: CodePatternInfo[] = [];

    const configFiles = this.fileData.filter(f => 
      f.path.includes('.env') ||
      f.path.includes('config.') ||
      f.path.includes('settings.') ||
      f.path.includes('constants.')
    );

    const configPatterns = [
      /process\.env\./,
      /dotenv/,
      /config\./,
      /NODE_ENV/,
      /PORT/,
      /DATABASE_URL/,
      /API_KEY/,
      /SECRET/
    ];

    const allFiles: string[] = configFiles.map(f => f.path);
    const examples: Array<{file: string, line: number, code: string}> = [];

    for (const pattern of configPatterns) {
      const matchedFiles = this.getFilesWithPattern(pattern);
      allFiles.push(...matchedFiles);
      examples.push(...this.getPatternExamples(pattern, matchedFiles.slice(0, 2)));
    }

    const uniqueFiles = [...new Set(allFiles)];

    if (uniqueFiles.length > 0) {
      patterns.push({
        pattern: 'Environment Configuration',
        type: 'configuration',
        description: `Environment and configuration patterns detected in ${uniqueFiles.length} files`,
        files: uniqueFiles,
        examples: examples.slice(0, 5)
      });
    }

    return patterns;
  }
}