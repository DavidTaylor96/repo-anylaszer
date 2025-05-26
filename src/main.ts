#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { RepoScanner } from './scanner';
import { TypeScriptParser } from './parsers/typescript-parser';
import { JavaScriptParser } from './parsers/javascript-parser';
import { PythonParser } from './parsers/python-parser';
import { StructureAnalyzer } from './analyzers/structure-analyzer';
import { DependencyAnalyzer } from './analyzers/dependency-analyzer';
import { ApiAnalyzer } from './analyzers/api-analyzer';
import { StateAnalyzer } from './analyzers/state-analyzer';
import { DatabaseAnalyzer } from './analyzers/database-analyzer';
import { CodePatternsAnalyzer } from './analyzers/code-patterns-analyzer';
import { VectorAnalyzer } from './analyzers/vector-analyzer';
import { ImportExportAnalyzer } from './analyzers/import-export-analyzer';
import { DocumentGenerator } from './document-generator';
import { AnalysisResults, AnalysisFocus, ParseResult } from './types';

class RepositoryAnalyzer {
  private repoPath: string;
  private outputPath: string;
  private focus: AnalysisFocus[];
  private verbose: boolean;

  constructor(repoPath: string, outputPath: string, focus: AnalysisFocus[] = ['all'], verbose: boolean = false) {
    this.repoPath = path.resolve(repoPath);
    this.outputPath = outputPath;
    this.focus = focus;
    this.verbose = verbose;
  }

  public async analyze(): Promise<boolean> {
    try {
      this.log('🔍 Starting repository analysis...');

      // Scan repository
      this.log('📁 Scanning repository files...');
      const scanner = new RepoScanner(this.repoPath);
      const fileData = scanner.scan();
      this.log(`✅ Found ${fileData.length} files`);

      // Parse files
      this.log('📝 Parsing file contents...');
      const parserResults: Record<string, ParseResult> = {};
      
      for (const file of fileData) {
        try {
          let parser;
          
          switch (file.language) {
            case 'typescript':
              parser = new TypeScriptParser(file.absolutePath);
              break;
            case 'javascript':
              parser = new JavaScriptParser(file.absolutePath);
              break;
            case 'python':
              parser = new PythonParser(file.absolutePath);
              break;
            default:
              continue; // Skip unsupported languages
          }

          parserResults[file.path] = parser.parse();
        } catch (error) {
          this.log(`⚠️  Warning: Could not parse ${file.path}: ${error}`);
        }
      }

      this.log(`✅ Parsed ${Object.keys(parserResults).length} files`);

      // Initialize analysis results
      const analysisResults: AnalysisResults = {
        fileData,
        parserResults
      };

      // Run analyses based on focus
      if (this.shouldRunAnalysis('structure')) {
        this.log('🏗️  Analyzing repository structure...');
        const structureAnalyzer = new StructureAnalyzer(this.repoPath, fileData);
        analysisResults.structureAnalysis = structureAnalyzer.analyze();
        this.log('✅ Structure analysis complete');
      }

      if (this.shouldRunAnalysis('dependencies')) {
        this.log('🔗 Analyzing dependencies...');
        const dependencyAnalyzer = new DependencyAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.dependencyAnalysis = dependencyAnalyzer.analyze();
        this.log('✅ Dependency analysis complete');
      }

      if (this.shouldRunAnalysis('api')) {
        this.log('🌐 Analyzing APIs...');
        const apiAnalyzer = new ApiAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.apiAnalysis = apiAnalyzer.analyze();
        this.log('✅ API analysis complete');
      }

      // Always run state analysis for TypeScript/React projects
      const hasReactFiles = fileData.some(f => 
        f.language === 'typescript' || f.language === 'javascript'
      );
      
      if (hasReactFiles) {
        this.log('⚛️  Analyzing state management...');
        const stateAnalyzer = new StateAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.stateAnalysis = stateAnalyzer.analyze();
        this.log('✅ State analysis complete');
      }

      // Database analysis
      if (this.shouldRunAnalysis('database' as AnalysisFocus) || this.shouldRunAnalysis('all')) {
        this.log('🗄️  Analyzing database schemas...');
        const databaseAnalyzer = new DatabaseAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.databaseAnalysis = databaseAnalyzer.analyze();
        this.log('✅ Database analysis complete');
      }

      // Code patterns analysis
      if (this.shouldRunAnalysis('patterns' as AnalysisFocus) || this.shouldRunAnalysis('all')) {
        this.log('🔍 Analyzing code patterns...');
        const patternsAnalyzer = new CodePatternsAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.codePatterns = patternsAnalyzer.analyze();
        this.log('✅ Code patterns analysis complete');
      }

      // Import/Export analysis
      if (this.shouldRunAnalysis('dependencies') || this.shouldRunAnalysis('all')) {
        this.log('🔗 Analyzing import/export relationships...');
        const importExportAnalyzer = new ImportExportAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.importExportGraph = importExportAnalyzer.analyze();
        this.log('✅ Import/export analysis complete');
      }

      // Vector embeddings (optional)
      if (this.shouldRunAnalysis('vector' as AnalysisFocus) || this.shouldRunAnalysis('all')) {
        this.log('🧮 Creating vector embeddings...');
        const vectorAnalyzer = new VectorAnalyzer(this.repoPath, fileData, parserResults);
        analysisResults.vectorEmbeddings = await vectorAnalyzer.analyze();
        this.log('✅ Vector embeddings created');
      }

      // Generate documentation
      this.log('📄 Generating documentation...');
      const generator = new DocumentGenerator(this.repoPath, analysisResults);
      generator.generate(this.outputPath);
      
      const outputSize = fs.statSync(this.outputPath).size;
      this.log(`✅ Documentation generated: ${this.outputPath} (${this.formatBytes(outputSize)})`);

      this.log('🎉 Analysis complete!');
      return true;

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      return false;
    }
  }

  private shouldRunAnalysis(type: AnalysisFocus): boolean {
    return this.focus.includes('all') || this.focus.includes(type);
  }

  private log(message: string): void {
    if (this.verbose || !message.startsWith('⚠️')) {
      console.log(message);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

// CLI Interface
function printUsage(): void {
  console.log(`
Repository Analyzer - TypeScript Edition

USAGE:
  repo-analyzer scan <repository-path> [options]
  repo-analyzer compare <repo1> <repo2> [options]

COMMANDS:
  scan        Analyze a single repository
  compare     Compare two repositories (basic implementation)

OPTIONS:
  -o, --output <file>     Output file path (default: analysis.md)
  -f, --focus <type>      Focus analysis (structure|dependencies|api|database|patterns|vector|all)
  -v, --verbose          Enable verbose logging
  -h, --help             Show this help message

EXAMPLES:
  repo-analyzer scan ./my-project
  repo-analyzer scan ./my-project -o report.md -f api -v
  repo-analyzer scan ./my-project --focus dependencies --output deps.md

SUPPORTED LANGUAGES:
  - TypeScript (.ts, .tsx)
  - JavaScript (.js, .jsx)
  - Python (.py)
`);
}

function parseArgs(): any {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  
  if (!['scan', 'compare'].includes(command)) {
    console.error('❌ Invalid command. Use "scan" or "compare"');
    printUsage();
    process.exit(1);
  }

  const config: any = {
    command,
    output: 'analysis.md',
    focus: ['all'],
    verbose: false
  };

  // Parse repository path(s)
  if (command === 'scan') {
    if (args.length < 2) {
      console.error('❌ Repository path is required for scan command');
      process.exit(1);
    }
    config.repoPath = args[1];
  } else if (command === 'compare') {
    if (args.length < 3) {
      console.error('❌ Two repository paths are required for compare command');
      process.exit(1);
    }
    config.repoPath1 = args[1];
    config.repoPath2 = args[2];
  }

  // Parse options
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-o' || arg === '--output') {
      config.output = args[++i];
    } else if (arg === '-f' || arg === '--focus') {
      const focusType = args[++i] as AnalysisFocus;
      if (!['structure', 'dependencies', 'api', 'database', 'patterns', 'vector', 'all'].includes(focusType)) {
        console.error('❌ Invalid focus type. Use: structure, dependencies, api, database, patterns, vector, or all');
        process.exit(1);
      }
      config.focus = [focusType];
    } else if (arg === '-v' || arg === '--verbose') {
      config.verbose = true;
    }
  }

  return config;
}

async function main(): Promise<void> {
  const config = parseArgs();

  // Validate repository path(s)
  const validatePath = (repoPath: string) => {
    if (!fs.existsSync(repoPath)) {
      console.error(`❌ Repository path does not exist: ${repoPath}`);
      process.exit(1);
    }

    if (!fs.statSync(repoPath).isDirectory()) {
      console.error(`❌ Path is not a directory: ${repoPath}`);
      process.exit(1);
    }
  };

  if (config.command === 'scan') {
    validatePath(config.repoPath);
    
    const analyzer = new RepositoryAnalyzer(
      config.repoPath,
      config.output,
      config.focus,
      config.verbose
    );

    const success = await analyzer.analyze();
    process.exit(success ? 0 : 1);

  } else if (config.command === 'compare') {
    validatePath(config.repoPath1);
    validatePath(config.repoPath2);

    console.log('📊 Repository comparison feature coming soon!');
    console.log('For now, analyzing the first repository...');

    const analyzer = new RepositoryAnalyzer(
      config.repoPath1,
      config.output,
      config.focus,
      config.verbose
    );

    const success = await analyzer.analyze();
    process.exit(success ? 0 : 1);
  }
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled rejection:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export { RepositoryAnalyzer };