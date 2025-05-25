import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResults, DirectoryNode, AnalysisFocus } from './types';

export class DocumentGenerator {
  private repoPath: string;
  private analysisResults: AnalysisResults;

  constructor(repoPath: string, analysisResults: AnalysisResults) {
    this.repoPath = repoPath;
    this.analysisResults = analysisResults;
  }

  public generate(outputPath: string): void {
    const markdown = this.generateMarkdown();
    fs.writeFileSync(outputPath, markdown, 'utf-8');
  }

  private generateMarkdown(): string {
    const repoName = path.basename(this.repoPath);
    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(repoName));

    // Table of Contents
    sections.push(this.generateTableOfContents());

    // Executive Summary
    sections.push(this.generateExecutiveSummary());

    // Repository Structure
    if (this.analysisResults.structureAnalysis) {
      sections.push(this.generateStructureSection());
    }

    // Dependencies
    if (this.analysisResults.dependencyAnalysis) {
      sections.push(this.generateDependencySection());
    }

    // API Analysis
    if (this.analysisResults.apiAnalysis) {
      sections.push(this.generateApiSection());
    }

    // File Details
    sections.push(this.generateFileDetailsSection());

    // Footer
    sections.push(this.generateFooter());

    return sections.join('\n\n');
  }

  private generateHeader(repoName: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    
    return `# Repository Analysis: ${repoName}

**Generated**: ${timestamp}  
**Repository Path**: \`${this.repoPath}\`  
**Total Files Analyzed**: ${this.analysisResults.fileData.length}

---`;
  }

  private generateTableOfContents(): string {
    const toc = [
      '## Table of Contents',
      '',
      '- [Executive Summary](#executive-summary)',
    ];

    if (this.analysisResults.structureAnalysis) {
      toc.push('- [Repository Structure](#repository-structure)');
    }

    if (this.analysisResults.dependencyAnalysis) {
      toc.push('- [Dependencies](#dependencies)');
    }

    if (this.analysisResults.apiAnalysis) {
      toc.push('- [API Analysis](#api-analysis)');
    }

    toc.push('- [File Details](#file-details)');

    return toc.join('\n');
  }

  private generateExecutiveSummary(): string {
    const filesByLanguage = this.analysisResults.structureAnalysis?.filesByLanguage || {};
    const totalFiles = this.analysisResults.fileData.length;
    const totalSize = this.analysisResults.fileData.reduce((sum, file) => sum + file.size, 0);

    const summary = [
      '## Executive Summary',
      '',
      `This repository contains **${totalFiles} files** across multiple programming languages.`,
      `Total repository size: **${this.formatBytes(totalSize)}**`,
      ''
    ];

    // Language breakdown
    if (Object.keys(filesByLanguage).length > 0) {
      summary.push('### Language Breakdown');
      summary.push('');
      
      for (const [language, count] of Object.entries(filesByLanguage)) {
        const percentage = ((count / totalFiles) * 100).toFixed(1);
        summary.push(`- **${language}**: ${count} files (${percentage}%)`);
      }
      summary.push('');
    }

    // Key insights
    summary.push('### Key Insights');
    summary.push('');

    if (this.analysisResults.dependencyAnalysis) {
      const extDeps = this.analysisResults.dependencyAnalysis.externalDependencies.length;
      summary.push(`- **${extDeps}** external dependencies identified`);
    }

    if (this.analysisResults.apiAnalysis) {
      const publicFuncs = this.analysisResults.apiAnalysis.publicFunctions.length;
      const publicClasses = this.analysisResults.apiAnalysis.publicClasses.length;
      const endpoints = this.analysisResults.apiAnalysis.endpoints.length;
      
      summary.push(`- **${publicFuncs}** public functions discovered`);
      summary.push(`- **${publicClasses}** public classes found`);
      
      if (endpoints > 0) {
        summary.push(`- **${endpoints}** API endpoints detected`);
      }
    }

    return summary.join('\n');
  }

  private generateStructureSection(): string {
    const analysis = this.analysisResults.structureAnalysis!;
    const sections = [
      '## Repository Structure',
      '',
      '### Directory Tree',
      '',
      '```',
      this.renderDirectoryTree(analysis.directoryStructure, 0),
      '```',
      '',
      '### File Statistics',
      '',
      `- **Total Files**: ${analysis.totalFiles}`,
      `- **Estimated Total Lines**: ${analysis.totalLines.toLocaleString()}`,
      ''
    ];

    // Language distribution
    sections.push('### Files by Language');
    sections.push('');
    sections.push('| Language | Count | Percentage |');
    sections.push('|----------|-------|------------|');

    for (const [language, count] of Object.entries(analysis.filesByLanguage)) {
      const percentage = ((count / analysis.totalFiles) * 100).toFixed(1);
      sections.push(`| ${language} | ${count} | ${percentage}% |`);
    }

    return sections.join('\n');
  }

  private generateDependencySection(): string {
    const analysis = this.analysisResults.dependencyAnalysis!;
    const sections = [
      '## Dependencies',
      '',
      '### External Dependencies',
      ''
    ];

    if (analysis.externalDependencies.length === 0) {
      sections.push('No external dependencies detected.');
    } else {
      sections.push('| Package | Type | Used in Files |');
      sections.push('|---------|------|---------------|');

      for (const dep of analysis.externalDependencies) {
        sections.push(`| \`${dep.name}\` | ${dep.type} | ${dep.files.length} |`);
      }
    }

    sections.push('');
    sections.push('### Internal Dependencies');
    sections.push('');

    const totalInternalDeps = Object.values(analysis.internalDependencies)
      .reduce((sum, deps) => sum + deps.length, 0);

    if (totalInternalDeps === 0) {
      sections.push('No internal dependencies detected.');
    } else {
      sections.push(`Total internal dependencies: **${totalInternalDeps}**`);
      sections.push('');

      // Show files with most dependencies
      const sortedFiles = Object.entries(analysis.internalDependencies)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10);

      if (sortedFiles.length > 0) {
        sections.push('#### Most Dependent Files');
        sections.push('');
        sections.push('| File | Dependencies |');
        sections.push('|------|--------------|');

        for (const [file, deps] of sortedFiles) {
          if (deps.length > 0) {
            sections.push(`| \`${file}\` | ${deps.length} |`);
          }
        }
      }
    }

    return sections.join('\n');
  }

  private generateApiSection(): string {
    const analysis = this.analysisResults.apiAnalysis!;
    const sections = [
      '## API Analysis',
      ''
    ];

    // Public Functions
    sections.push('### Public Functions');
    sections.push('');

    if (analysis.publicFunctions.length === 0) {
      sections.push('No public functions detected.');
    } else {
      sections.push(`Found **${analysis.publicFunctions.length}** public functions:`);
      sections.push('');

      for (const func of analysis.publicFunctions.slice(0, 20)) { // Limit to first 20
        sections.push(`#### \`${func.name}\``);
        sections.push('');
        
        if (func.parameters.length > 0) {
          sections.push(`**Parameters**: \`${func.parameters.join(', ')}\``);
        }
        
        if (func.returnType) {
          sections.push(`**Returns**: \`${func.returnType}\``);
        }
        
        if (func.isAsync) {
          sections.push('**Async**: Yes');
        }
        
        if (func.docstring) {
          sections.push(`**Description**: ${func.docstring}`);
        }
        
        sections.push(`**Location**: Lines ${func.lineStart}-${func.lineEnd}`);
        sections.push('');
      }

      if (analysis.publicFunctions.length > 20) {
        sections.push(`*... and ${analysis.publicFunctions.length - 20} more functions*`);
        sections.push('');
      }
    }

    // Public Classes
    sections.push('### Public Classes');
    sections.push('');

    if (analysis.publicClasses.length === 0) {
      sections.push('No public classes detected.');
    } else {
      sections.push(`Found **${analysis.publicClasses.length}** public classes:`);
      sections.push('');

      for (const cls of analysis.publicClasses.slice(0, 10)) { // Limit to first 10
        sections.push(`#### \`${cls.name}\``);
        sections.push('');
        
        if (cls.extends) {
          sections.push(`**Extends**: \`${cls.extends}\``);
        }
        
        if (cls.implements && cls.implements.length > 0) {
          sections.push(`**Implements**: \`${cls.implements.join(', ')}\``);
        }
        
        sections.push(`**Methods**: ${cls.methods.length}`);
        sections.push(`**Properties**: ${cls.properties.length}`);
        
        if (cls.docstring) {
          sections.push(`**Description**: ${cls.docstring}`);
        }
        
        sections.push(`**Location**: Lines ${cls.lineStart}-${cls.lineEnd}`);
        sections.push('');
      }

      if (analysis.publicClasses.length > 10) {
        sections.push(`*... and ${analysis.publicClasses.length - 10} more classes*`);
        sections.push('');
      }
    }

    // API Endpoints
    if (analysis.endpoints.length > 0) {
      sections.push('### API Endpoints');
      sections.push('');
      sections.push('| Method | Path | Handler | File |');
      sections.push('|--------|------|---------|------|');

      for (const endpoint of analysis.endpoints) {
        sections.push(`| ${endpoint.method} | \`${endpoint.path}\` | \`${endpoint.function}\` | \`${endpoint.file}\` |`);
      }
    }

    return sections.join('\n');
  }

  private generateFileDetailsSection(): string {
    const sections = [
      '## File Details',
      '',
      '### All Files',
      '',
      '| File | Language | Size | Functions | Classes |',
      '|------|----------|------|-----------|---------|'
    ];

    for (const file of this.analysisResults.fileData) {
      const parseResult = this.analysisResults.parserResults[file.path];
      const funcCount = parseResult?.functions.length || 0;
      const classCount = parseResult?.classes.length || 0;

      sections.push(
        `| \`${file.path}\` | ${file.language || 'unknown'} | ${this.formatBytes(file.size)} | ${funcCount} | ${classCount} |`
      );
    }

    return sections.join('\n');
  }

  private generateFooter(): string {
    return `---

*Analysis generated by Repository Analyzer*  
*Timestamp: ${new Date().toISOString()}*`;
  }

  private renderDirectoryTree(node: DirectoryNode, depth: number): string {
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '' : '├── ';
    let result = `${indent}${prefix}${node.name}`;

    if (node.type === 'file') {
      result += ` (${node.language || 'unknown'})`;
      if (node.size) {
        result += ` - ${this.formatBytes(node.size)}`;
      }
    }

    result += '\n';

    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        result += this.renderDirectoryTree(node.children[i], depth + 1);
      }
    }

    return result;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  public generateCompactMarkdown(): string {
    // Simplified version for smaller outputs
    const repoName = path.basename(this.repoPath);
    const sections: string[] = [];

    sections.push(`# ${repoName} - Quick Analysis`);
    sections.push('');

    // Summary stats
    const totalFiles = this.analysisResults.fileData.length;
    const filesByLanguage = this.analysisResults.structureAnalysis?.filesByLanguage || {};
    
    sections.push(`**Files**: ${totalFiles}`);
    sections.push(`**Languages**: ${Object.keys(filesByLanguage).join(', ')}`);

    if (this.analysisResults.dependencyAnalysis) {
      const extDeps = this.analysisResults.dependencyAnalysis.externalDependencies.length;
      sections.push(`**External Dependencies**: ${extDeps}`);
    }

    if (this.analysisResults.apiAnalysis) {
      const funcs = this.analysisResults.apiAnalysis.publicFunctions.length;
      const classes = this.analysisResults.apiAnalysis.publicClasses.length;
      sections.push(`**Public API**: ${funcs} functions, ${classes} classes`);
    }

    return sections.join('\n');
  }
}