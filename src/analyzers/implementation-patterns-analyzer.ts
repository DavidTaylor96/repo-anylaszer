import * as fs from 'fs';
import { 
  FileInfo, 
  ParseResult, 
  ImplementationPatternsAnalysis, 
  DetectedPatternInfo, 
  AntiPatternInfo, 
  BestPracticeInfo, 
  FrameworkPatternInfo 
} from '../types';

export class ImplementationPatternsAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): ImplementationPatternsAnalysis {
    const patterns = this.detectImplementationPatterns();
    const antiPatterns = this.detectAntiPatterns();
    const patternFrequency = this.calculatePatternFrequency(patterns);
    const bestPractices = this.analyzeBestPractices();
    const frameworkPatterns = this.detectFrameworkPatterns();

    return {
      patterns,
      antiPatterns,
      patternFrequency,
      bestPractices,
      frameworkPatterns
    };
  }

  private detectImplementationPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // Design Patterns
    patterns.push(...this.detectDesignPatterns());
    
    // Architectural Patterns
    patterns.push(...this.detectArchitecturalPatterns());
    
    // Behavioral Patterns
    patterns.push(...this.detectBehavioralPatterns());
    
    // Creational Patterns
    patterns.push(...this.detectCreationalPatterns());
    
    // Structural Patterns
    patterns.push(...this.detectStructuralPatterns());

    return patterns;
  }

  private detectDesignPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // Singleton Pattern
    const singletonPattern = this.detectSingletonPattern();
    if (singletonPattern.files.length > 0) {
      patterns.push(singletonPattern);
    }

    // Factory Pattern
    const factoryPattern = this.detectFactoryPattern();
    if (factoryPattern.files.length > 0) {
      patterns.push(factoryPattern);
    }

    // Observer Pattern
    const observerPattern = this.detectObserverPattern();
    if (observerPattern.files.length > 0) {
      patterns.push(observerPattern);
    }

    // Strategy Pattern
    const strategyPattern = this.detectStrategyPattern();
    if (strategyPattern.files.length > 0) {
      patterns.push(strategyPattern);
    }

    // Decorator Pattern
    const decoratorPattern = this.detectDecoratorPattern();
    if (decoratorPattern.files.length > 0) {
      patterns.push(decoratorPattern);
    }

    return patterns;
  }

  private detectArchitecturalPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // MVC Pattern
    const mvcPattern = this.detectMVCPattern();
    if (mvcPattern.files.length > 0) {
      patterns.push(mvcPattern);
    }

    // Repository Pattern
    const repositoryPattern = this.detectRepositoryPattern();
    if (repositoryPattern.files.length > 0) {
      patterns.push(repositoryPattern);
    }

    // Service Layer Pattern
    const serviceLayerPattern = this.detectServiceLayerPattern();
    if (serviceLayerPattern.files.length > 0) {
      patterns.push(serviceLayerPattern);
    }

    // Dependency Injection Pattern
    const diPattern = this.detectDependencyInjectionPattern();
    if (diPattern.files.length > 0) {
      patterns.push(diPattern);
    }

    return patterns;
  }

  private detectBehavioralPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // Command Pattern
    const commandPattern = this.detectCommandPattern();
    if (commandPattern.files.length > 0) {
      patterns.push(commandPattern);
    }

    // State Pattern
    const statePattern = this.detectStatePattern();
    if (statePattern.files.length > 0) {
      patterns.push(statePattern);
    }

    // Chain of Responsibility
    const chainPattern = this.detectChainOfResponsibilityPattern();
    if (chainPattern.files.length > 0) {
      patterns.push(chainPattern);
    }

    return patterns;
  }

  private detectCreationalPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // Builder Pattern
    const builderPattern = this.detectBuilderPattern();
    if (builderPattern.files.length > 0) {
      patterns.push(builderPattern);
    }

    // Abstract Factory Pattern
    const abstractFactoryPattern = this.detectAbstractFactoryPattern();
    if (abstractFactoryPattern.files.length > 0) {
      patterns.push(abstractFactoryPattern);
    }

    return patterns;
  }

  private detectStructuralPatterns(): DetectedPatternInfo[] {
    const patterns: DetectedPatternInfo[] = [];

    // Adapter Pattern
    const adapterPattern = this.detectAdapterPattern();
    if (adapterPattern.files.length > 0) {
      patterns.push(adapterPattern);
    }

    // Facade Pattern
    const facadePattern = this.detectFacadePattern();
    if (facadePattern.files.length > 0) {
      patterns.push(facadePattern);
    }

    // Proxy Pattern
    const proxyPattern = this.detectProxyPattern();
    if (proxyPattern.files.length > 0) {
      patterns.push(proxyPattern);
    }

    return patterns;
  }

  private detectAntiPatterns(): AntiPatternInfo[] {
    const antiPatterns: AntiPatternInfo[] = [];

    // God Object
    const godObjectPattern = this.detectGodObject();
    if (godObjectPattern.files.length > 0) {
      antiPatterns.push(godObjectPattern);
    }

    // Spaghetti Code
    const spaghettiCode = this.detectSpaghettiCode();
    if (spaghettiCode.files.length > 0) {
      antiPatterns.push(spaghettiCode);
    }

    // Copy-Paste Programming
    const copyPastePattern = this.detectCopyPasteProgramming();
    if (copyPastePattern.files.length > 0) {
      antiPatterns.push(copyPastePattern);
    }

    // Dead Code
    const deadCode = this.detectDeadCode();
    if (deadCode.files.length > 0) {
      antiPatterns.push(deadCode);
    }

    // Magic Numbers
    const magicNumbers = this.detectMagicNumbers();
    if (magicNumbers.files.length > 0) {
      antiPatterns.push(magicNumbers);
    }

    return antiPatterns;
  }

  private analyzeBestPractices(): BestPracticeInfo[] {
    const bestPractices: BestPracticeInfo[] = [];

    // Documentation practices
    bestPractices.push(this.analyzeDocumentationPractices());

    // Testing practices
    bestPractices.push(this.analyzeTestingPractices());

    // Security practices
    bestPractices.push(this.analyzeSecurityPractices());

    // Performance practices
    bestPractices.push(this.analyzePerformancePractices());

    // Maintainability practices
    bestPractices.push(this.analyzeMaintainabilityPractices());

    return bestPractices;
  }

  private detectFrameworkPatterns(): FrameworkPatternInfo[] {
    const frameworks: FrameworkPatternInfo[] = [];

    // React patterns
    const reactPatterns = this.detectReactPatterns();
    if (reactPatterns.patterns.length > 0) {
      frameworks.push(reactPatterns);
    }

    // Vue patterns
    const vuePatterns = this.detectVuePatterns();
    if (vuePatterns.patterns.length > 0) {
      frameworks.push(vuePatterns);
    }

    // Angular patterns
    const angularPatterns = this.detectAngularPatterns();
    if (angularPatterns.patterns.length > 0) {
      frameworks.push(angularPatterns);
    }

    // Express patterns
    const expressPatterns = this.detectExpressPatterns();
    if (expressPatterns.patterns.length > 0) {
      frameworks.push(expressPatterns);
    }

    // Django patterns
    const djangoPatterns = this.detectDjangoPatterns();
    if (djangoPatterns.patterns.length > 0) {
      frameworks.push(djangoPatterns);
    }

    return frameworks;
  }

  // Pattern Detection Implementations

  private detectSingletonPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for singleton patterns
      const singletonPatterns = [
        /class\s+\w+\s*{[\s\S]*?private\s+static\s+instance/,
        /private\s+constructor\s*\(/,
        /static\s+getInstance\s*\(/,
        /let\s+instance\s*:\s*\w+\s*\|\s*null\s*=\s*null/
      ];

      for (const pattern of singletonPatterns) {
        if (pattern.test(fileContent)) {
          files.push(filePath);
          const lines = fileContent.split('\n');
          const match = fileContent.match(pattern);
          if (match) {
            const lineIndex = fileContent.substring(0, fileContent.indexOf(match[0])).split('\n').length;
            examples.push({
              file: filePath,
              line: lineIndex,
              code: match[0].substring(0, 100) + '...'
            });
          }
          break;
        }
      }
    }

    return {
      name: 'Singleton Pattern',
      type: 'creational',
      description: 'Ensures a class has only one instance and provides global access to it',
      files: [...new Set(files)],
      examples,
      benefits: ['Controlled access to sole instance', 'Reduced memory footprint', 'Global state management'],
      implementation: 'Private constructor with static getInstance method'
    };
  }

  private detectFactoryPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        if (func.name.toLowerCase().includes('factory') || 
            func.name.toLowerCase().includes('create') ||
            func.name.toLowerCase().includes('make')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: func.lineStart,
            code: `function ${func.name}(${func.parameters.map(p => p.name).join(', ')})`
          });
        }
      }

      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('factory')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Factory Pattern',
      type: 'creational',
      description: 'Creates objects without specifying their exact classes',
      files: [...new Set(files)],
      examples,
      benefits: ['Loose coupling', 'Code reusability', 'Easy to extend'],
      implementation: 'Factory methods or classes that create and return objects'
    };
  }

  private detectObserverPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for observer patterns
      const observerPatterns = [
        /addEventListener|removeEventListener/,
        /subscribe|unsubscribe/,
        /on\(/,
        /emit\(/,
        /EventEmitter/,
        /Subject|Observable/
      ];

      for (const pattern of observerPatterns) {
        if (pattern.test(fileContent)) {
          files.push(filePath);
          const match = fileContent.match(pattern);
          if (match) {
            examples.push({
              file: filePath,
              line: 1,
              code: match[0]
            });
          }
          break;
        }
      }
    }

    return {
      name: 'Observer Pattern',
      type: 'behavioral',
      description: 'Defines a one-to-many dependency between objects',
      files: [...new Set(files)],
      examples,
      benefits: ['Loose coupling', 'Dynamic relationships', 'Broadcast communication'],
      implementation: 'Event listeners, subscriptions, or reactive programming'
    };
  }

  private detectStrategyPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Look for strategy pattern indicators
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('strategy') ||
            cls.methods.some(m => m.name === 'execute' || m.name === 'apply')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }

      // Look for interfaces that might be strategies
      if (parseResult.interfaces) {
        for (const iface of parseResult.interfaces) {
          if (iface.name.toLowerCase().includes('strategy') ||
              iface.methods.some(m => m.name === 'execute' || m.name === 'apply')) {
            files.push(filePath);
            examples.push({
              file: filePath,
              line: iface.lineStart,
              code: `interface ${iface.name}`
            });
          }
        }
      }
    }

    return {
      name: 'Strategy Pattern',
      type: 'behavioral',
      description: 'Defines a family of algorithms and makes them interchangeable',
      files: [...new Set(files)],
      examples,
      benefits: ['Algorithm flexibility', 'Easy to extend', 'Eliminates conditionals'],
      implementation: 'Interface with multiple implementations that can be swapped'
    };
  }

  private detectDecoratorPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for decorator patterns
      const decoratorPatterns = [
        /@\w+/g, // TypeScript/JavaScript decorators
        /decorator/i,
        /wrap/i
      ];

      for (const pattern of decoratorPatterns) {
        const matches = fileContent.match(pattern);
        if (matches) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: 1,
            code: matches[0]
          });
          break;
        }
      }
    }

    return {
      name: 'Decorator Pattern',
      type: 'structural',
      description: 'Adds new functionality to objects dynamically without altering their structure',
      files: [...new Set(files)],
      examples,
      benefits: ['Flexible alternative to subclassing', 'Compose behaviors', 'Single responsibility'],
      implementation: 'Wrapper classes or decorator functions that enhance existing objects'
    };
  }

  private detectMVCPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    const controllerFiles = Object.keys(this.parserResults).filter(f => 
      f.toLowerCase().includes('controller') || f.toLowerCase().includes('ctrl')
    );
    const modelFiles = Object.keys(this.parserResults).filter(f => 
      f.toLowerCase().includes('model') || f.toLowerCase().includes('entity')
    );
    const viewFiles = Object.keys(this.parserResults).filter(f => 
      f.toLowerCase().includes('view') || f.toLowerCase().includes('component') || 
      f.toLowerCase().includes('template')
    );

    if (controllerFiles.length > 0 && modelFiles.length > 0 && viewFiles.length > 0) {
      files.push(...controllerFiles, ...modelFiles, ...viewFiles);
      examples.push(
        {file: controllerFiles[0], line: 1, code: 'Controller layer'},
        {file: modelFiles[0], line: 1, code: 'Model layer'},
        {file: viewFiles[0], line: 1, code: 'View layer'}
      );
    }

    return {
      name: 'MVC Pattern',
      type: 'architectural',
      description: 'Separates application logic into Model, View, and Controller',
      files: [...new Set(files)],
      examples,
      benefits: ['Separation of concerns', 'Maintainable code', 'Testable components'],
      implementation: 'Separate directories/files for models, views, and controllers'
    };
  }

  private detectRepositoryPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('repository') || 
            cls.name.toLowerCase().includes('dao')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }

      // Look for repository methods
      for (const func of parseResult.functions) {
        if (['findById', 'findAll', 'save', 'delete', 'create', 'update'].includes(func.name)) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: func.lineStart,
            code: `${func.name}(${func.parameters.map(p => p.name).join(', ')})`
          });
        }
      }
    }

    return {
      name: 'Repository Pattern',
      type: 'architectural',
      description: 'Encapsulates data access logic and provides a uniform interface',
      files: [...new Set(files)],
      examples,
      benefits: ['Data access abstraction', 'Testability', 'Centralized query logic'],
      implementation: 'Repository classes with CRUD operations'
    };
  }

  private detectServiceLayerPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    const serviceFiles = Object.keys(this.parserResults).filter(f => 
      f.toLowerCase().includes('service') || f.toLowerCase().includes('business')
    );

    for (const filePath of serviceFiles) {
      const parseResult = this.parserResults[filePath];
      files.push(filePath);
      
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('service')) {
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Service Layer Pattern',
      type: 'architectural',
      description: 'Defines application boundary and encapsulates business logic',
      files: [...new Set(files)],
      examples,
      benefits: ['Business logic encapsulation', 'Transaction management', 'API simplification'],
      implementation: 'Service classes that orchestrate business operations'
    };
  }

  private detectDependencyInjectionPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for DI patterns
      const diPatterns = [
        /@Injectable/,
        /@Component/,
        /@Service/,
        /constructor.*inject/i,
        /dependencies.*inject/i
      ];

      for (const pattern of diPatterns) {
        if (pattern.test(fileContent)) {
          files.push(filePath);
          const match = fileContent.match(pattern);
          if (match) {
            examples.push({
              file: filePath,
              line: 1,
              code: match[0]
            });
          }
          break;
        }
      }
    }

    return {
      name: 'Dependency Injection Pattern',
      type: 'architectural',
      description: 'Provides dependencies to objects rather than having them create dependencies',
      files: [...new Set(files)],
      examples,
      benefits: ['Loose coupling', 'Testability', 'Flexible configuration'],
      implementation: 'Constructor injection, property injection, or method injection'
    };
  }

  private detectCommandPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('command') ||
            cls.methods.some(m => m.name === 'execute' || m.name === 'undo')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Command Pattern',
      type: 'behavioral',
      description: 'Encapsulates requests as objects, allowing parameterization and queuing',
      files: [...new Set(files)],
      examples,
      benefits: ['Decoupled invocation', 'Undo operations', 'Macro commands'],
      implementation: 'Command objects with execute() method'
    };
  }

  private detectStatePattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for state machine patterns
      if (fileContent.includes('state') && 
          (fileContent.includes('transition') || fileContent.includes('switch'))) {
        files.push(filePath);
        examples.push({
          file: filePath,
          line: 1,
          code: 'State machine implementation'
        });
      }
    }

    return {
      name: 'State Pattern',
      type: 'behavioral',
      description: 'Allows an object to alter its behavior when its internal state changes',
      files: [...new Set(files)],
      examples,
      benefits: ['Localizes state behavior', 'Easy state transitions', 'Eliminates conditionals'],
      implementation: 'State objects with specific behaviors for each state'
    };
  }

  private detectChainOfResponsibilityPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for middleware or chain patterns
      if (fileContent.includes('middleware') || 
          fileContent.includes('next()') ||
          fileContent.includes('chain')) {
        files.push(filePath);
        examples.push({
          file: filePath,
          line: 1,
          code: 'Middleware/Chain implementation'
        });
      }
    }

    return {
      name: 'Chain of Responsibility Pattern',
      type: 'behavioral',
      description: 'Passes requests along a chain of handlers until one handles it',
      files: [...new Set(files)],
      examples,
      benefits: ['Decoupled sender/receiver', 'Flexible chains', 'Single responsibility'],
      implementation: 'Chain of handlers that can process or pass requests'
    };
  }

  private detectBuilderPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('builder') ||
            cls.methods.some(m => m.name === 'build' || m.name.startsWith('with'))) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Builder Pattern',
      type: 'creational',
      description: 'Constructs complex objects step by step',
      files: [...new Set(files)],
      examples,
      benefits: ['Complex object construction', 'Readable code', 'Immutable objects'],
      implementation: 'Builder class with fluent interface for object construction'
    };
  }

  private detectAbstractFactoryPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (parseResult.interfaces) {
        for (const iface of parseResult.interfaces) {
          if (iface.name.toLowerCase().includes('factory') &&
              iface.methods.length > 1) {
            files.push(filePath);
            examples.push({
              file: filePath,
              line: iface.lineStart,
              code: `interface ${iface.name}`
            });
          }
        }
      }
    }

    return {
      name: 'Abstract Factory Pattern',
      type: 'creational',
      description: 'Creates families of related objects without specifying their concrete classes',
      files: [...new Set(files)],
      examples,
      benefits: ['Product families', 'Consistency', 'Easy substitution'],
      implementation: 'Abstract factory interface with concrete factory implementations'
    };
  }

  private detectAdapterPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('adapter') ||
            cls.name.toLowerCase().includes('wrapper')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Adapter Pattern',
      type: 'structural',
      description: 'Allows incompatible interfaces to work together',
      files: [...new Set(files)],
      examples,
      benefits: ['Interface compatibility', 'Code reuse', 'Legacy integration'],
      implementation: 'Adapter class that translates one interface to another'
    };
  }

  private detectFacadePattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('facade') ||
            cls.name.toLowerCase().includes('api')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Facade Pattern',
      type: 'structural',
      description: 'Provides a simplified interface to a complex subsystem',
      files: [...new Set(files)],
      examples,
      benefits: ['Simplified interface', 'Loose coupling', 'Layer abstraction'],
      implementation: 'Facade class that delegates to subsystem classes'
    };
  }

  private detectProxyPattern(): DetectedPatternInfo {
    const files: string[] = [];
    const examples: Array<{file: string; line: number; code: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.toLowerCase().includes('proxy')) {
          files.push(filePath);
          examples.push({
            file: filePath,
            line: cls.lineStart,
            code: `class ${cls.name}`
          });
        }
      }
    }

    return {
      name: 'Proxy Pattern',
      type: 'structural',
      description: 'Provides a placeholder or surrogate for another object',
      files: [...new Set(files)],
      examples,
      benefits: ['Controlled access', 'Lazy loading', 'Caching'],
      implementation: 'Proxy class that controls access to the real object'
    };
  }

  // Anti-pattern detection methods

  private detectGodObject(): AntiPatternInfo {
    const files: string[] = [];
    const threshold = 20; // Methods threshold for god object

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.methods.length > threshold) {
          files.push(filePath);
        }
      }
    }

    return {
      name: 'God Object',
      description: 'Classes that know too much or do too much',
      files,
      severity: 'high',
      suggestion: 'Break down into smaller, focused classes with single responsibilities',
      impact: 'Reduces maintainability, testability, and understanding'
    };
  }

  private detectSpaghettiCode(): AntiPatternInfo {
    const files: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for excessive nesting, long functions, or complex control structures
      const lines = fileContent.split('\n');
      let maxNesting = 0;
      let currentNesting = 0;

      for (const line of lines) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        currentNesting += openBraces - closeBraces;
        maxNesting = Math.max(maxNesting, currentNesting);
      }

      if (maxNesting > 6) {
        files.push(filePath);
      }
    }

    return {
      name: 'Spaghetti Code',
      description: 'Unstructured and difficult-to-maintain code',
      files,
      severity: 'medium',
      suggestion: 'Refactor into smaller functions, reduce nesting, improve structure',
      impact: 'Difficult to understand, debug, and maintain'
    };
  }

  private detectCopyPasteProgramming(): AntiPatternInfo {
    const files: string[] = [];
    const duplicateThreshold = 10; // Lines of similar code

    // Simple duplication detection (would need more sophisticated analysis in practice)
    const codeBlocks: Record<string, string[]> = {};

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      const lines = fileContent.split('\n');
      for (let i = 0; i < lines.length - duplicateThreshold; i++) {
        const block = lines.slice(i, i + duplicateThreshold).join('\n').trim();
        if (block.length > 50) { // Minimum block size
          if (!codeBlocks[block]) {
            codeBlocks[block] = [];
          }
          codeBlocks[block].push(filePath);
        }
      }
    }

    // Find duplicated blocks
    for (const [block, locations] of Object.entries(codeBlocks)) {
      if (locations.length > 1) {
        files.push(...locations);
      }
    }

    return {
      name: 'Copy-Paste Programming',
      description: 'Duplicated code blocks across the codebase',
      files: [...new Set(files)],
      severity: 'medium',
      suggestion: 'Extract common code into reusable functions or modules',
      impact: 'Increased maintenance burden and potential for inconsistent bug fixes'
    };
  }

  private detectDeadCode(): AntiPatternInfo {
    const files: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Look for unused functions (simple heuristic)
      for (const func of parseResult.functions) {
        if (!parseResult.exports.some(exp => exp.name === func.name)) {
          // Function is not exported, might be dead code
          let isUsed = false;
          
          // Check if function is called anywhere in the file
          const fileContent = this.getFileContent(filePath);
          if (fileContent) {
            const callPattern = new RegExp(`\\b${func.name}\\s*\\(`, 'g');
            const matches = fileContent.match(callPattern);
            if (matches && matches.length > 1) { // More than just the definition
              isUsed = true;
            }
          }

          if (!isUsed) {
            files.push(filePath);
          }
        }
      }
    }

    return {
      name: 'Dead Code',
      description: 'Unused functions, variables, or code blocks',
      files: [...new Set(files)],
      severity: 'low',
      suggestion: 'Remove unused code to reduce codebase size and complexity',
      impact: 'Increased codebase size and potential confusion'
    };
  }

  private detectMagicNumbers(): AntiPatternInfo {
    const files: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for magic numbers (excluding common ones like 0, 1, -1)
      const magicNumberPattern = /\b(?!0|1|-1|\d{1,2}:\d{2})\d{2,}\b/g;
      const matches = fileContent.match(magicNumberPattern);
      
      if (matches && matches.length > 3) {
        files.push(filePath);
      }
    }

    return {
      name: 'Magic Numbers',
      description: 'Hard-coded numeric values without clear meaning',
      files,
      severity: 'low',
      suggestion: 'Replace magic numbers with named constants',
      impact: 'Reduced code readability and maintainability'
    };
  }

  // Best practices analysis methods

  private analyzeDocumentationPractices(): BestPracticeInfo {
    let documentedFunctions = 0;
    let totalFunctions = 0;
    const examples: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        totalFunctions++;
        if (func.docstring || func.jsdoc) {
          documentedFunctions++;
          if (examples.length < 3) {
            examples.push(`${func.name} in ${filePath}`);
          }
        }
      }
    }

    const adherence = totalFunctions > 0 ? documentedFunctions / totalFunctions : 0;

    return {
      practice: 'Documentation Coverage',
      category: 'documentation',
      adherence,
      examples,
      suggestions: adherence < 0.7 ? [
        'Add JSDoc comments to public functions',
        'Document complex algorithms and business logic',
        'Include parameter and return type descriptions'
      ] : ['Maintain current documentation standards']
    };
  }

  private analyzeTestingPractices(): BestPracticeInfo {
    const testFiles = this.fileData.filter(f => 
      f.path.includes('test') || f.path.includes('spec') || f.path.endsWith('.test.js') || f.path.endsWith('.spec.ts')
    );
    
    const codeFiles = this.fileData.filter(f => 
      !f.path.includes('test') && !f.path.includes('spec') && 
      (f.language === 'typescript' || f.language === 'javascript')
    );

    const adherence = codeFiles.length > 0 ? testFiles.length / codeFiles.length : 0;

    return {
      practice: 'Test Coverage',
      category: 'testing',
      adherence,
      examples: testFiles.slice(0, 3).map(f => f.path),
      suggestions: adherence < 0.5 ? [
        'Add unit tests for critical functions',
        'Implement integration tests for key workflows',
        'Set up automated testing in CI/CD pipeline'
      ] : ['Maintain current test coverage']
    };
  }

  private analyzeSecurityPractices(): BestPracticeInfo {
    let securityIssues = 0;
    let totalChecks = 0;
    const examples: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for common security issues
      const securityPatterns = [
        { pattern: /eval\s*\(/, issue: 'eval() usage' },
        { pattern: /innerHTML\s*=/, issue: 'innerHTML assignment' },
        { pattern: /document\.write/, issue: 'document.write usage' },
        { pattern: /\.password\s*=\s*['"]/, issue: 'hardcoded password' }
      ];

      for (const { pattern, issue } of securityPatterns) {
        totalChecks++;
        if (pattern.test(fileContent)) {
          securityIssues++;
          examples.push(`${issue} in ${filePath}`);
        }
      }
    }

    const adherence = totalChecks > 0 ? 1 - (securityIssues / totalChecks) : 1;

    return {
      practice: 'Security Practices',
      category: 'security',
      adherence,
      examples: examples.slice(0, 3),
      suggestions: securityIssues > 0 ? [
        'Avoid using eval() and similar dangerous functions',
        'Use secure methods for DOM manipulation',
        'Never hardcode passwords or secrets',
        'Implement input validation and sanitization'
      ] : ['Continue following security best practices']
    };
  }

  private analyzePerformancePractices(): BestPracticeInfo {
    let performanceIssues = 0;
    let totalChecks = 0;
    const examples: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for performance issues
      const performancePatterns = [
        { pattern: /for.*in.*length/, issue: 'inefficient loop' },
        { pattern: /querySelector.*loop/, issue: 'DOM query in loop' },
        { pattern: /new\s+RegExp.*loop/, issue: 'RegExp creation in loop' }
      ];

      for (const { pattern, issue } of performancePatterns) {
        totalChecks++;
        if (pattern.test(fileContent)) {
          performanceIssues++;
          examples.push(`${issue} in ${filePath}`);
        }
      }
    }

    const adherence = totalChecks > 0 ? 1 - (performanceIssues / totalChecks) : 1;

    return {
      practice: 'Performance Optimization',
      category: 'performance',
      adherence,
      examples: examples.slice(0, 3),
      suggestions: performanceIssues > 0 ? [
        'Cache DOM queries outside of loops',
        'Precompile regular expressions',
        'Use efficient data structures and algorithms',
        'Implement lazy loading where appropriate'
      ] : ['Continue following performance best practices']
    };
  }

  private analyzeMaintainabilityPractices(): BestPracticeInfo {
    let maintainabilityScore = 0;
    let totalFiles = 0;
    const examples: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      totalFiles++;
      let fileScore = 0;
      let fileChecks = 0;

      // Check for good practices
      fileChecks++;
      if (parseResult.functions.every(f => f.name.length > 2)) {
        fileScore++; // Descriptive function names
      }

      fileChecks++;
      if (parseResult.functions.every(f => (f.lineEnd - f.lineStart) < 50)) {
        fileScore++; // Short functions
        examples.push(`Concise functions in ${filePath}`);
      }

      fileChecks++;
      if (parseResult.classes.every(c => c.methods.length < 15)) {
        fileScore++; // Reasonable class size
      }

      maintainabilityScore += fileChecks > 0 ? fileScore / fileChecks : 0;
    }

    const adherence = totalFiles > 0 ? maintainabilityScore / totalFiles : 0;

    return {
      practice: 'Code Maintainability',
      category: 'maintainability',
      adherence,
      examples: examples.slice(0, 3),
      suggestions: adherence < 0.7 ? [
        'Use descriptive names for functions and variables',
        'Keep functions short and focused',
        'Limit class size and responsibilities',
        'Follow consistent coding conventions'
      ] : ['Maintain current code quality standards']
    };
  }

  // Framework pattern detection methods

  private detectReactPatterns(): FrameworkPatternInfo {
    const patterns: string[] = [];
    const configFiles: string[] = [];
    const conventions: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('react')) {
        // React patterns
        if (fileContent.includes('useState')) patterns.push('useState Hook');
        if (fileContent.includes('useEffect')) patterns.push('useEffect Hook');
        if (fileContent.includes('useContext')) patterns.push('useContext Hook');
        if (fileContent.includes('useMemo')) patterns.push('useMemo Hook');
        if (fileContent.includes('useCallback')) patterns.push('useCallback Hook');
        if (parseResult.components?.length) patterns.push('Functional Components');
        if (fileContent.includes('class') && fileContent.includes('Component')) patterns.push('Class Components');
        if (fileContent.includes('Higher-Order')) patterns.push('Higher-Order Components');
        if (fileContent.includes('render={')) patterns.push('Render Props');
      }

      // Config files
      if (filePath.includes('package.json') && fileContent.includes('react')) {
        configFiles.push(filePath);
      }
    }

    if (patterns.length > 0) {
      conventions.push('JSX for component rendering');
      conventions.push('Hooks for state management');
      conventions.push('Props for component communication');
    }

    return {
      framework: 'React',
      patterns: [...new Set(patterns)],
      configFiles,
      conventions
    };
  }

  private detectVuePatterns(): FrameworkPatternInfo {
    const patterns: string[] = [];
    const configFiles: string[] = [];
    const conventions: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('vue') || filePath.endsWith('.vue')) {
        patterns.push('Single File Components');
        if (fileContent.includes('v-if')) patterns.push('Conditional Rendering');
        if (fileContent.includes('v-for')) patterns.push('List Rendering');
        if (fileContent.includes('@click')) patterns.push('Event Handling');
        if (fileContent.includes('computed')) patterns.push('Computed Properties');
        if (fileContent.includes('watch')) patterns.push('Watchers');
      }
    }

    return {
      framework: 'Vue',
      patterns: [...new Set(patterns)],
      configFiles,
      conventions: patterns.length > 0 ? ['Template-based rendering', 'Reactive data binding'] : []
    };
  }

  private detectAngularPatterns(): FrameworkPatternInfo {
    const patterns: string[] = [];
    const configFiles: string[] = [];
    const conventions: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('@angular') || fileContent.includes('@Component')) {
        patterns.push('Component Architecture');
        if (fileContent.includes('@Injectable')) patterns.push('Dependency Injection');
        if (fileContent.includes('OnInit')) patterns.push('Lifecycle Hooks');
        if (fileContent.includes('FormBuilder')) patterns.push('Reactive Forms');
        if (fileContent.includes('HttpClient')) patterns.push('HTTP Client');
        if (fileContent.includes('Router')) patterns.push('Routing');
      }
    }

    return {
      framework: 'Angular',
      patterns: [...new Set(patterns)],
      configFiles,
      conventions: patterns.length > 0 ? ['TypeScript-first', 'Decorator-based', 'RxJS for async'] : []
    };
  }

  private detectExpressPatterns(): FrameworkPatternInfo {
    const patterns: string[] = [];
    const configFiles: string[] = [];
    const conventions: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('express')) {
        patterns.push('Express.js Framework');
        if (fileContent.includes('app.get')) patterns.push('Route Handlers');
        if (fileContent.includes('middleware')) patterns.push('Middleware');
        if (fileContent.includes('req, res, next')) patterns.push('Request/Response Pattern');
        if (fileContent.includes('app.use')) patterns.push('Application-level Middleware');
        if (fileContent.includes('router')) patterns.push('Router Module');
      }
    }

    return {
      framework: 'Express.js',
      patterns: [...new Set(patterns)],
      configFiles,
      conventions: patterns.length > 0 ? ['Middleware pattern', 'Route-based architecture'] : []
    };
  }

  private detectDjangoPatterns(): FrameworkPatternInfo {
    const patterns: string[] = [];
    const configFiles: string[] = [];
    const conventions: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('django')) {
        patterns.push('Django Framework');
        if (fileContent.includes('models.Model')) patterns.push('Model Classes');
        if (fileContent.includes('def get') || fileContent.includes('def post')) patterns.push('View Functions');
        if (fileContent.includes('class.*View')) patterns.push('Class-based Views');
        if (fileContent.includes('forms.Form')) patterns.push('Django Forms');
        if (fileContent.includes('admin.site')) patterns.push('Admin Interface');
      }
    }

    return {
      framework: 'Django',
      patterns: [...new Set(patterns)],
      configFiles,
      conventions: patterns.length > 0 ? ['MVC pattern', 'ORM-based', 'Convention over configuration'] : []
    };
  }

  private calculatePatternFrequency(patterns: DetectedPatternInfo[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    for (const pattern of patterns) {
      frequency[pattern.name] = pattern.files.length;
    }

    return frequency;
  }

  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = require('path').join(this.repoPath, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }
}