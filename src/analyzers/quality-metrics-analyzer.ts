import * as fs from 'fs';
import { 
  FileInfo, 
  ParseResult, 
  QualityMetricsAnalysis, 
  ComplexityMetrics, 
  TestCoverageInfo, 
  DocumentationMetrics, 
  TypeSafetyMetrics, 
  QualityHotspotInfo 
} from '../types';

export class QualityMetricsAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): QualityMetricsAnalysis {
    const codeComplexity = this.analyzeComplexity();
    const testCoverage = this.analyzeTestCoverage();
    const documentation = this.analyzeDocumentation();
    const typesSafety = this.analyzeTypeSafety();
    const hotspots = this.identifyQualityHotspots();
    const codeQualityScore = this.calculateOverallScore(codeComplexity, testCoverage, documentation, typesSafety);

    return {
      codeComplexity,
      testCoverage,
      documentation,
      typesSafety,
      codeQualityScore,
      hotspots
    };
  }

  private analyzeComplexity(): ComplexityMetrics {
    let totalComplexity = 0;
    let functionCount = 0;
    const highComplexityFunctions: Array<{name: string; file: string; complexity: number}> = [];
    const complexityDistribution: Record<string, number> = {};

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        const complexity = this.calculateFunctionComplexity(func, filePath);
        totalComplexity += complexity;
        functionCount++;

        if (complexity > 10) {
          highComplexityFunctions.push({
            name: func.name,
            file: filePath,
            complexity
          });
        }

        const range = this.getComplexityRange(complexity);
        complexityDistribution[range] = (complexityDistribution[range] || 0) + 1;
      }
    }

    return {
      averageComplexity: functionCount > 0 ? totalComplexity / functionCount : 0,
      highComplexityFunctions: highComplexityFunctions.sort((a, b) => b.complexity - a.complexity),
      complexityDistribution,
      cognitiveComplexity: this.calculateCognitiveComplexity()
    };
  }

  private analyzeTestCoverage(): TestCoverageInfo {
    const testFiles = this.fileData.filter(f => 
      f.path.includes('test') || f.path.includes('spec') || 
      f.path.endsWith('.test.js') || f.path.endsWith('.test.ts') ||
      f.path.endsWith('.spec.js') || f.path.endsWith('.spec.ts')
    );

    const allFunctions = this.getAllFunctions();
    const testedFunctions = this.getTestedFunctions(testFiles);
    const untestedFunctions = allFunctions.filter(f => !testedFunctions.includes(f));

    const coveragePercentage = allFunctions.length > 0 ? 
      (testedFunctions.length / allFunctions.length) * 100 : 0;

    return {
      testFiles: testFiles.map(f => f.path),
      coveragePercentage,
      testedFunctions,
      untestedFunctions,
      testPatterns: this.identifyTestPatterns(testFiles)
    };
  }

  private analyzeDocumentation(): DocumentationMetrics {
    let documentedFunctions = 0;
    let totalFunctions = 0;
    let jsdocCount = 0;

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        totalFunctions++;
        if (func.docstring || func.jsdoc) {
          documentedFunctions++;
        }
        if (func.jsdoc) {
          jsdocCount++;
        }
      }
    }

    const readmeFiles = this.fileData.filter(f => 
      f.path.toLowerCase().includes('readme') || 
      f.path.toLowerCase().includes('documentation') ||
      f.path.endsWith('.md')
    ).map(f => f.path);

    const jsdocCoverage = totalFunctions > 0 ? (jsdocCount / totalFunctions) * 100 : 0;
    
    let documentationQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (jsdocCoverage >= 80) documentationQuality = 'excellent';
    else if (jsdocCoverage >= 60) documentationQuality = 'good';
    else if (jsdocCoverage >= 30) documentationQuality = 'fair';
    else documentationQuality = 'poor';

    return {
      documentedFunctions,
      undocumentedFunctions: totalFunctions - documentedFunctions,
      jsdocCoverage,
      readmeFiles,
      documentationQuality
    };
  }

  private analyzeTypeSafety(): TypeSafetyMetrics {
    const tsFiles = this.fileData.filter(f => f.language === 'typescript');
    const totalFiles = this.fileData.filter(f => 
      f.language === 'typescript' || f.language === 'javascript'
    );

    const typescriptCoverage = totalFiles.length > 0 ? 
      (tsFiles.length / totalFiles.length) * 100 : 0;

    let anyTypes = 0;
    let strictModeFiles = 0;
    let typeDefinitions = 0;
    const typeErrors: Array<{file: string; error: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Count 'any' types
      const anyMatches = fileContent.match(/:\s*any\b/g);
      if (anyMatches) {
        anyTypes += anyMatches.length;
      }

      // Check for strict mode
      if (fileContent.includes('"use strict"') || fileContent.includes("'use strict'")) {
        strictModeFiles++;
      }

      // Count type definitions
      if (parseResult.interfaces) {
        typeDefinitions += parseResult.interfaces.length;
      }
      if (parseResult.typeAliases) {
        typeDefinitions += parseResult.typeAliases.length;
      }
    }

    return {
      typescriptCoverage,
      anyTypes,
      strictModeFiles,
      typeDefinitions,
      typeErrors
    };
  }

  private identifyQualityHotspots(): QualityHotspotInfo[] {
    const hotspots: QualityHotspotInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let severity: 'low' | 'medium' | 'high' = 'low';

      // Check for large functions
      const largeFunctions = parseResult.functions.filter(f => (f.lineEnd - f.lineStart) > 50);
      if (largeFunctions.length > 0) {
        issues.push(`${largeFunctions.length} large functions (>50 lines)`);
        suggestions.push('Break down large functions into smaller, focused functions');
        severity = 'medium';
      }

      // Check for complex functions
      const complexFunctions = parseResult.functions.filter(f => 
        this.calculateFunctionComplexity(f, filePath) > 10
      );
      if (complexFunctions.length > 0) {
        issues.push(`${complexFunctions.length} complex functions (complexity >10)`);
        suggestions.push('Reduce complexity by extracting logic into separate functions');
        severity = 'high';
      }

      // Check for large classes
      const largeClasses = parseResult.classes.filter(c => c.methods.length > 20);
      if (largeClasses.length > 0) {
        issues.push(`${largeClasses.length} large classes (>20 methods)`);
        suggestions.push('Consider breaking down large classes following Single Responsibility Principle');
        severity = 'medium';
      }

      // Check for undocumented functions
      const undocumentedFunctions = parseResult.functions.filter(f => !f.docstring && !f.jsdoc);
      if (undocumentedFunctions.length > parseResult.functions.length * 0.5) {
        issues.push(`${undocumentedFunctions.length} undocumented functions`);
        suggestions.push('Add documentation for public and complex functions');
      }

      if (issues.length > 0) {
        hotspots.push({
          file: filePath,
          issues,
          severity,
          suggestions,
          impact: this.calculateImpact(issues, severity)
        });
      }
    }

    return hotspots.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private calculateFunctionComplexity(func: any, filePath: string): number {
    const fileContent = this.getFileContent(filePath);
    if (!fileContent) {
      // Fallback: estimate complexity from parameters and line count
      return func.parameters.length + Math.floor((func.lineEnd - func.lineStart) / 10);
    }

    const lines = fileContent.split('\n');
    const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');

    let complexity = 1; // Base complexity

    // Count decision points
    const decisionPatterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /&&|\|\|/g,
      /\?\s*.*:/g // Ternary operators
    ];

    for (const pattern of decisionPatterns) {
      const matches = funcContent.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private getComplexityRange(complexity: number): string {
    if (complexity <= 5) return '1-5 (Low)';
    if (complexity <= 10) return '6-10 (Medium)';
    if (complexity <= 20) return '11-20 (High)';
    return '20+ (Very High)';
  }

  private calculateCognitiveComplexity(): number {
    let totalCognitive = 0;
    let fileCount = 0;

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      fileCount++;
      
      // Simple cognitive complexity estimation
      const nestingLevel = this.calculateMaxNesting(fileContent);
      const logicalOperators = (fileContent.match(/&&|\|\|/g) || []).length;
      const controlStructures = (fileContent.match(/if|while|for|switch/g) || []).length;
      
      totalCognitive += nestingLevel + logicalOperators + controlStructures;
    }

    return fileCount > 0 ? totalCognitive / fileCount : 0;
  }

  private calculateMaxNesting(content: string): number {
    let maxNesting = 0;
    let currentNesting = 0;
    
    for (const char of content) {
      if (char === '{') {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      } else if (char === '}') {
        currentNesting--;
      }
    }
    
    return maxNesting;
  }

  private getAllFunctions(): string[] {
    const functions: string[] = [];
    
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        functions.push(`${func.name}@${filePath}`);
      }
    }
    
    return functions;
  }

  private getTestedFunctions(testFiles: FileInfo[]): string[] {
    const testedFunctions: string[] = [];
    
    for (const testFile of testFiles) {
      const fileContent = this.getFileContent(testFile.path);
      if (!fileContent) continue;

      // Look for function names being tested
      const testPatterns = [
        /describe\(['"`]([^'"`]+)['"`]/g,
        /it\(['"`]([^'"`]+)['"`]/g,
        /test\(['"`]([^'"`]+)['"`]/g
      ];

      for (const pattern of testPatterns) {
        let match;
        while ((match = pattern.exec(fileContent)) !== null) {
          testedFunctions.push(match[1]);
        }
      }
    }
    
    return [...new Set(testedFunctions)];
  }

  private identifyTestPatterns(testFiles: FileInfo[]): string[] {
    const patterns = new Set<string>();
    
    for (const testFile of testFiles) {
      const fileContent = this.getFileContent(testFile.path);
      if (!fileContent) continue;

      if (fileContent.includes('jest')) patterns.add('Jest');
      if (fileContent.includes('mocha')) patterns.add('Mocha');
      if (fileContent.includes('chai')) patterns.add('Chai');
      if (fileContent.includes('sinon')) patterns.add('Sinon');
      if (fileContent.includes('enzyme')) patterns.add('Enzyme');
      if (fileContent.includes('@testing-library')) patterns.add('Testing Library');
      if (fileContent.includes('cypress')) patterns.add('Cypress');
      if (fileContent.includes('playwright')) patterns.add('Playwright');
    }
    
    return Array.from(patterns);
  }

  private calculateOverallScore(
    complexity: ComplexityMetrics,
    testCoverage: TestCoverageInfo,
    documentation: DocumentationMetrics,
    typeSafety: TypeSafetyMetrics
  ): number {
    // Weight factors for different metrics
    const weights = {
      complexity: 0.3,
      testCoverage: 0.3,
      documentation: 0.2,
      typeSafety: 0.2
    };

    // Normalize complexity score (lower is better)
    const complexityScore = Math.max(0, 100 - (complexity.averageComplexity * 10));
    
    // Test coverage score
    const testScore = testCoverage.coveragePercentage;
    
    // Documentation score
    const docScore = documentation.jsdocCoverage;
    
    // Type safety score
    const typeScore = typeSafety.typescriptCoverage;

    const weightedScore = 
      (complexityScore * weights.complexity) +
      (testScore * weights.testCoverage) +
      (docScore * weights.documentation) +
      (typeScore * weights.typeSafety);

    return Math.round(weightedScore);
  }

  private calculateImpact(issues: string[], severity: 'low' | 'medium' | 'high'): string {
    const impactMap = {
      high: 'Significantly impacts maintainability and development velocity',
      medium: 'Moderately impacts code quality and team productivity',
      low: 'Minor impact on code maintainability'
    };

    return impactMap[severity];
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