import * as fs from 'fs';
import * as path from 'path';
import { AnalysisResults, DirectoryNode } from './types';

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

    // TypeScript Analysis
    sections.push(this.generateTypeScriptSection());

    // Component Analysis
    sections.push(this.generateComponentSection());

    // State Management Analysis
    if (this.analysisResults.stateAnalysis) {
      sections.push(this.generateStateManagementSection());
    }

    // Enhanced Analysis Sections
    if (this.analysisResults.semanticRelationships) {
      sections.push(this.generateSemanticRelationshipsSection());
    }

    if (this.analysisResults.implementationPatterns) {
      sections.push(this.generateImplementationPatternsSection());
    }

    if (this.analysisResults.businessLogicContext) {
      sections.push(this.generateBusinessLogicContextSection());
    }

    if (this.analysisResults.qualityMetrics) {
      sections.push(this.generateQualityMetricsSection());
    }

    // Implementation Guidance
    sections.push(this.generateImplementationGuidanceSection());

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

    toc.push('- [TypeScript Analysis](#typescript-analysis)');
    toc.push('- [Component Analysis](#component-analysis)');

    if (this.analysisResults.semanticRelationships) {
      toc.push('- [Semantic Relationships](#semantic-relationships)');
    }

    if (this.analysisResults.implementationPatterns) {
      toc.push('- [Implementation Patterns](#implementation-patterns)');
    }

    if (this.analysisResults.businessLogicContext) {
      toc.push('- [Business Logic Context](#business-logic-context)');
    }

    if (this.analysisResults.qualityMetrics) {
      toc.push('- [Quality Metrics](#quality-metrics)');
    }
    
    if (this.analysisResults.stateAnalysis) {
      toc.push('- [State Management](#state-management)');
    }

    toc.push('- [Implementation Guidance](#implementation-guidance)');
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

      if (this.analysisResults.apiAnalysis.schemas) {
        const schemas = this.analysisResults.apiAnalysis.schemas.length;
        summary.push(`- **${schemas}** API schemas found`);
      }

      if (this.analysisResults.apiAnalysis.authentication) {
        const authPatterns = this.analysisResults.apiAnalysis.authentication.length;
        summary.push(`- **${authPatterns}** authentication patterns identified`);
      }
    }

    // TypeScript and Component insights
    const allInterfaces = this.getAllInterfaces();
    const allComponents = this.getAllComponents();
    
    if (allInterfaces.length > 0) {
      summary.push(`- **${allInterfaces.length}** TypeScript interfaces defined`);
    }

    if (allComponents.length > 0) {
      summary.push(`- **${allComponents.length}** React components found`);
    }

    if (this.analysisResults.stateAnalysis) {
      const stores = this.analysisResults.stateAnalysis.stores.length;
      if (stores > 0) {
        summary.push(`- **${stores}** state stores detected (${this.analysisResults.stateAnalysis.stateManagementPattern})`);
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
          const paramStrings = func.parameters.map(param => {
            let paramStr = param.name;
            if (param.type) {
              paramStr += `: ${param.type}`;
            }
            if (param.optional) {
              paramStr += '?';
            }
            if (param.defaultValue) {
              paramStr += ` = ${param.defaultValue}`;
            }
            return paramStr;
          });
          sections.push(`**Parameters**: \`${paramStrings.join(', ')}\``);
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
        
        // Add code snippet if available
        if (func.codeSnippet) {
          sections.push(`**Implementation**:`);
          sections.push('```typescript');
          sections.push(func.codeSnippet);
          sections.push('```');
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
      sections.push('');
    }

    // API Schemas
    if (analysis.schemas && analysis.schemas.length > 0) {
      sections.push('### API Schemas');
      sections.push('');
      sections.push(`Found **${analysis.schemas.length}** API schemas:`);
      sections.push('');

      for (const schema of analysis.schemas.slice(0, 10)) {
        sections.push(`#### \`${schema.name}\` (${schema.type})`);
        sections.push('');
        sections.push(`**File**: \`${schema.file}\``);
        
        if (schema.description) {
          sections.push(`**Description**: ${schema.description}`);
        }

        if (schema.properties && schema.properties.length > 0) {
          sections.push('**Properties:**');
          for (const prop of schema.properties.slice(0, 5)) {
            const optional = prop.optional ? '?' : '';
            sections.push(`- \`${prop.name}${optional}: ${prop.type}\``);
          }
          if (schema.properties.length > 5) {
            sections.push(`- *... and ${schema.properties.length - 5} more properties*`);
          }
        }

        if (schema.definition) {
          sections.push(`**Definition**: \`${schema.definition.substring(0, 100)}${schema.definition.length > 100 ? '...' : ''}\``);
        }

        sections.push('');
      }

      if (analysis.schemas.length > 10) {
        sections.push(`*... and ${analysis.schemas.length - 10} more schemas*`);
        sections.push('');
      }
    }

    // Authentication Patterns
    if (analysis.authentication && analysis.authentication.length > 0) {
      sections.push('### Authentication Patterns');
      sections.push('');
      sections.push(`Found **${analysis.authentication.length}** authentication patterns:`);
      sections.push('');
      sections.push('| Type | Name | Pattern | File |');
      sections.push('|------|------|---------|------|');

      for (const auth of analysis.authentication) {
        sections.push(`| ${auth.type} | \`${auth.name}\` | ${auth.pattern} | \`${auth.file}\` |`);
      }
      sections.push('');
    }

    // Error Handlers
    if (analysis.errorHandlers && analysis.errorHandlers.length > 0) {
      sections.push('### Error Handling');
      sections.push('');
      sections.push(`Found **${analysis.errorHandlers.length}** error handlers:`);
      sections.push('');

      for (const handler of analysis.errorHandlers.slice(0, 10)) {
        sections.push(`#### \`${handler.name}\``);
        sections.push('');
        sections.push(`**File**: \`${handler.file}\` (Lines ${handler.lineStart}-${handler.lineEnd || 'end'})`);
        sections.push(`**Is Middleware**: ${handler.isMiddleware ? 'Yes' : 'No'}`);
        
        if (handler.errorTypes.length > 0) {
          sections.push(`**Error Types**: ${handler.errorTypes.join(', ')}`);
        }

        sections.push(`**Description**: ${handler.description}`);
        sections.push('');
      }

      if (analysis.errorHandlers.length > 10) {
        sections.push(`*... and ${analysis.errorHandlers.length - 10} more error handlers*`);
        sections.push('');
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

  private generateImplementationGuidanceSection(): string {
    const sections = [
      '## Implementation Guidance',
      '',
      'This section provides practical examples for extending this codebase.',
      ''
    ];

    // Detect the primary framework/patterns
    const hasReact = this.getAllComponents().length > 0;
    const hasZustand = this.analysisResults.stateAnalysis?.stores.some(s => s.type === 'zustand') || false;
    const hasAPI = (this.analysisResults.apiAnalysis?.endpoints.length || 0) > 0;

    if (hasReact) {
      sections.push('### Adding New React Components');
      sections.push('');
      sections.push('Follow the existing component patterns:');
      sections.push('');
      sections.push('```typescript');
      sections.push('// src/components/NewComponent.tsx');
      sections.push('import React from \'react\';');
      if (hasZustand) {
        sections.push('import useChatStore from \'../store/chatStore\';');
      }
      sections.push('');
      sections.push('interface NewComponentProps {');
      sections.push('  title: string;');
      sections.push('  onAction?: () => void;');
      sections.push('}');
      sections.push('');
      sections.push('const NewComponent: React.FC<NewComponentProps> = ({ title, onAction }) => {');
      if (hasZustand) {
        sections.push('  const { sessions, addMessage } = useChatStore();');
      }
      sections.push('  ');
      sections.push('  return (');
      sections.push('    <div className="new-component">');
      sections.push('      <h2>{title}</h2>');
      sections.push('      {/* Your component content */}');
      sections.push('    </div>');
      sections.push('  );');
      sections.push('};');
      sections.push('');
      sections.push('export default NewComponent;');
      sections.push('```');
      sections.push('');
    }

    if (hasZustand) {
      sections.push('### Extending State Management');
      sections.push('');
      sections.push('To add new state to the Zustand store:');
      sections.push('');
      sections.push('```typescript');
      sections.push('// Add to store interface');
      sections.push('type ChatStore = {');
      sections.push('  // ... existing state');
      sections.push('  newFeature: boolean;');
      sections.push('  ');
      sections.push('  // ... existing actions');
      sections.push('  toggleNewFeature: () => void;');
      sections.push('};');
      sections.push('');
      sections.push('// Add to store implementation');
      sections.push('const useChatStore = create<ChatStore>()(');
      sections.push('  persist(');
      sections.push('    (set, get) => ({');
      sections.push('      // ... existing state');
      sections.push('      newFeature: false,');
      sections.push('      ');
      sections.push('      // ... existing actions');
      sections.push('      toggleNewFeature: () => {');
      sections.push('        set((state) => ({ newFeature: !state.newFeature }));');
      sections.push('      },');
      sections.push('    }),');
      sections.push('    { name: \'Taylor-chat-storage\' }');
      sections.push('  )');
      sections.push(');');
      sections.push('```');
      sections.push('');
    }

    if (hasAPI) {
      sections.push('### Adding New API Functions');
      sections.push('');
      sections.push('Follow the existing API patterns:');
      sections.push('');
      sections.push('```typescript');
      sections.push('// src/services/api.ts');
      sections.push('export const newApiFunction = async (params: NewParams): Promise<NewResponse> => {');
      sections.push('  try {');
      sections.push('    const response = await fetch(\'/api/new-endpoint\', {');
      sections.push('      method: \'POST\',');
      sections.push('      headers: { \'Content-Type\': \'application/json\' },');
      sections.push('      body: JSON.stringify(params)');
      sections.push('    });');
      sections.push('    ');
      sections.push('    if (!response.ok) {');
      sections.push('      throw new Error(`API error: ${response.status}`);');
      sections.push('    }');
      sections.push('    ');
      sections.push('    return await response.json();');
      sections.push('  } catch (error) {');
      sections.push('    console.error(\'API call failed:\', error);');
      sections.push('    throw error;');
      sections.push('  }');
      sections.push('};');
      sections.push('```');
      sections.push('');
    }

    // Add general best practices
    sections.push('### Best Practices');
    sections.push('');
    sections.push('1. **File Organization**: Follow the existing directory structure');
    sections.push('2. **Type Safety**: Define TypeScript interfaces for all data structures');
    sections.push('3. **Error Handling**: Use consistent error patterns with try-catch blocks');
    sections.push('4. **Component Props**: Use interface definitions for component props');
    if (hasZustand) {
      sections.push('5. **State Management**: Use Zustand for global state, useState for local state');
    }
    sections.push('6. **Imports**: Use absolute imports from src/ when possible');
    sections.push('');

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

  private generateTypeScriptSection(): string {
    const sections = [
      '## TypeScript Analysis',
      ''
    ];

    const allInterfaces = this.getAllInterfaces();
    const allTypeAliases = this.getAllTypeAliases();

    // Interfaces
    sections.push('### Interfaces');
    sections.push('');

    if (allInterfaces.length === 0) {
      sections.push('No TypeScript interfaces found.');
    } else {
      sections.push(`Found **${allInterfaces.length}** TypeScript interfaces:`);
      sections.push('');

      for (const iface of allInterfaces.slice(0, 10)) {
        sections.push(`#### \`${iface.name}\``);
        sections.push('');
        
        if (iface.extends.length > 0) {
          sections.push(`**Extends**: \`${iface.extends.join(', ')}\``);
        }
        
        sections.push(`**Properties**: ${iface.properties.length}`);
        sections.push(`**Methods**: ${iface.methods.length}`);
        
        if (iface.docstring) {
          sections.push(`**Description**: ${iface.docstring}`);
        }
        
        sections.push(`**File**: \`${iface.file}\` (Line ${iface.lineStart})`);
        sections.push('');

        // Show properties
        if (iface.properties.length > 0) {
          sections.push('**Properties:**');
          for (const prop of iface.properties.slice(0, 5)) {
            const optional = prop.optional ? '?' : '';
            sections.push(`- \`${prop.name}${optional}: ${prop.type}\``);
          }
          if (iface.properties.length > 5) {
            sections.push(`- *... and ${iface.properties.length - 5} more properties*`);
          }
          sections.push('');
        }
      }

      if (allInterfaces.length > 10) {
        sections.push(`*... and ${allInterfaces.length - 10} more interfaces*`);
        sections.push('');
      }
    }

    // Type Aliases
    sections.push('### Type Aliases');
    sections.push('');

    if (allTypeAliases.length === 0) {
      sections.push('No type aliases found.');
    } else {
      sections.push(`Found **${allTypeAliases.length}** type aliases:`);
      sections.push('');

      for (const typeAlias of allTypeAliases.slice(0, 10)) {
        sections.push(`#### \`${typeAlias.name}\``);
        sections.push('');
        sections.push(`**Definition**: \`${typeAlias.definition}\``);
        sections.push(`**File**: \`${typeAlias.file}\` (Line ${typeAlias.lineStart})`);
        
        if (typeAlias.docstring) {
          sections.push(`**Description**: ${typeAlias.docstring}`);
        }
        
        sections.push('');
      }

      if (allTypeAliases.length > 10) {
        sections.push(`*... and ${allTypeAliases.length - 10} more type aliases*`);
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  private generateComponentSection(): string {
    const sections = [
      '## Component Analysis',
      ''
    ];

    const allComponents = this.getAllComponents();

    if (allComponents.length === 0) {
      sections.push('No React components found.');
      return sections.join('\n');
    }

    sections.push(`Found **${allComponents.length}** React components:`);
    sections.push('');

    // Component summary
    const componentsWithProps = allComponents.filter(c => c.props.length > 0);
    const componentsWithHooks = allComponents.filter(c => c.hooks.length > 0);
    const jsxComponents = allComponents.filter(c => c.hasJSX);

    sections.push('### Component Summary');
    sections.push('');
    sections.push(`- **${componentsWithProps.length}** components with props`);
    sections.push(`- **${componentsWithHooks.length}** components using hooks`);
    sections.push(`- **${jsxComponents.length}** components with JSX`);
    sections.push('');

    // Detailed component analysis
    sections.push('### Component Details');
    sections.push('');

    for (const component of allComponents.slice(0, 10)) {
      sections.push(`#### \`${component.name}\``);
      sections.push('');
      
      sections.push(`**File**: \`${component.file}\` (Lines ${component.lineStart}-${component.lineEnd})`);
      sections.push(`**Has JSX**: ${component.hasJSX ? 'Yes' : 'No'}`);
      
      if (component.props.length > 0) {
        sections.push('**Props:**');
        for (const prop of component.props) {
          const optional = prop.optional ? '?' : '';
          const type = prop.type ? `: ${prop.type}` : '';
          sections.push(`- \`${prop.name}${optional}${type}\``);
        }
      }

      if (component.hooks.length > 0) {
        sections.push(`**Hooks Used**: ${component.hooks.join(', ')}`);
      }

      if (component.docstring) {
        sections.push(`**Description**: ${component.docstring}`);
      }
      
      sections.push('');
    }

    if (allComponents.length > 10) {
      sections.push(`*... and ${allComponents.length - 10} more components*`);
      sections.push('');
    }

    return sections.join('\n');
  }

  private generateStateManagementSection(): string {
    const analysis = this.analysisResults.stateAnalysis!;
    const sections = [
      '## State Management',
      ''
    ];

    sections.push(`**Pattern Detected**: ${analysis.stateManagementPattern}`);
    sections.push(`**Summary**: ${analysis.summary}`);
    sections.push('');

    // State Stores
    sections.push('### State Stores');
    sections.push('');

    if (analysis.stores.length === 0) {
      sections.push('No state stores detected.');
    } else {
      sections.push(`Found **${analysis.stores.length}** state stores:`);
      sections.push('');

      for (const store of analysis.stores) {
        sections.push(`#### \`${store.name}\` (${store.type})`);
        sections.push('');
        sections.push(`**File**: \`${store.file}\` (Line ${store.lineStart})`);
        sections.push(`**Description**: ${store.description}`);

        if (store.state.length > 0) {
          sections.push(`**State Properties**: ${store.state.join(', ')}`);
        }

        if (store.actions.length > 0) {
          sections.push(`**Actions**: ${store.actions.join(', ')}`);
        }

        sections.push('');
      }
    }

    // Component Relationships
    sections.push('### Component Relationships');
    sections.push('');

    if (analysis.relationships.length === 0) {
      sections.push('No component relationships detected.');
    } else {
      sections.push(`Found **${analysis.relationships.length}** component relationships:`);
      sections.push('');
      sections.push('| Parent | Child | Type | Shared State |');
      sections.push('|--------|-------|------|--------------|');

      for (const rel of analysis.relationships.slice(0, 20)) {
        const sharedState = rel.sharedState.length > 0 ? rel.sharedState.join(', ') : 'None';
        sections.push(`| \`${rel.parent}\` | \`${rel.child}\` | ${rel.type} | ${sharedState} |`);
      }

      if (analysis.relationships.length > 20) {
        sections.push(`*... and ${analysis.relationships.length - 20} more relationships*`);
      }
    }

    // Data Flow
    sections.push('');
    sections.push('### Data Flow');
    sections.push('');

    if (analysis.dataFlow.length === 0) {
      sections.push('No data flow patterns detected.');
    } else {
      sections.push(`Found **${analysis.dataFlow.length}** data flow connections:`);
      sections.push('');
      sections.push('| From | To | Type | Data |');
      sections.push('|------|----|----- |------|');

      for (const flow of analysis.dataFlow.slice(0, 15)) {
        const data = flow.data.length > 0 ? flow.data.join(', ') : 'N/A';
        sections.push(`| \`${flow.from}\` | \`${flow.to}\` | ${flow.type} | ${data} |`);
      }

      if (analysis.dataFlow.length > 15) {
        sections.push(`*... and ${analysis.dataFlow.length - 15} more connections*`);
      }
    }

    return sections.join('\n');
  }

  private getAllInterfaces(): any[] {
    const interfaces: any[] = [];
    
    for (const [filePath, parseResult] of Object.entries(this.analysisResults.parserResults)) {
      if (parseResult.interfaces) {
        for (const iface of parseResult.interfaces) {
          interfaces.push({ ...iface, file: filePath });
        }
      }
    }

    return interfaces;
  }

  private getAllTypeAliases(): any[] {
    const typeAliases: any[] = [];
    
    for (const [filePath, parseResult] of Object.entries(this.analysisResults.parserResults)) {
      if (parseResult.typeAliases) {
        for (const typeAlias of parseResult.typeAliases) {
          typeAliases.push({ ...typeAlias, file: filePath });
        }
      }
    }

    return typeAliases;
  }

  private getAllComponents(): any[] {
    const components: any[] = [];
    
    for (const [filePath, parseResult] of Object.entries(this.analysisResults.parserResults)) {
      if (parseResult.components) {
        for (const component of parseResult.components) {
          components.push({ ...component, file: filePath });
        }
      }
    }

    return components;
  }

  private generateSemanticRelationshipsSection(): string {
    const analysis = this.analysisResults.semanticRelationships!;
    const sections: string[] = [];

    sections.push('## Semantic Relationships');
    sections.push('');
    sections.push('### Component Relationships');
    
    if (analysis.componentRelationships.length > 0) {
      for (const comp of analysis.componentRelationships.slice(0, 10)) {
        sections.push(`#### \`${comp.name}\``);
        sections.push(`**File**: \`${comp.file}\``);
        sections.push(`**Uses**: ${comp.uses.join(', ') || 'None'}`);
        sections.push(`**Used By**: ${comp.usedBy.join(', ') || 'None'}`);
        sections.push(`**Styling**: ${comp.styledWith}`);
        sections.push(`**State Management**: ${comp.stateManagement.join(', ') || 'None'}`);
        sections.push('');
      }
    } else {
      sections.push('No component relationships found.');
    }

    sections.push('### Function Relationships');
    
    if (analysis.functionRelationships.length > 0) {
      for (const func of analysis.functionRelationships.slice(0, 10)) {
        sections.push(`#### \`${func.name}\``);
        sections.push(`**File**: \`${func.file}\``);
        sections.push(`**Calls**: ${func.calls.join(', ') || 'None'}`);
        sections.push(`**Called By**: ${func.calledBy.join(', ') || 'None'}`);
        sections.push('');
      }
    } else {
      sections.push('No function relationships found.');
    }

    sections.push('### Relationship Patterns');
    
    if (analysis.patterns.length > 0) {
      for (const pattern of analysis.patterns) {
        sections.push(`- **${pattern.pattern}**: ${pattern.occurrences} occurrences - ${pattern.description}`);
      }
    } else {
      sections.push('No relationship patterns detected.');
    }

    return sections.join('\n');
  }

  private generateImplementationPatternsSection(): string {
    const analysis = this.analysisResults.implementationPatterns!;
    const sections: string[] = [];

    sections.push('## Implementation Patterns');
    sections.push('');
    
    if (analysis.patterns.length > 0) {
      sections.push('### Detected Patterns');
      
      for (const pattern of analysis.patterns) {
        sections.push(`#### ${pattern.name} (${pattern.type})`);
        sections.push(`**Description**: ${pattern.description}`);
        sections.push(`**Files**: ${pattern.files.length} files`);
        sections.push(`**Benefits**: ${pattern.benefits.join(', ')}`);
        sections.push(`**Implementation**: ${pattern.implementation}`);
        sections.push('');
      }
    }

    if (analysis.antiPatterns.length > 0) {
      sections.push('### Anti-Patterns Detected');
      
      for (const antiPattern of analysis.antiPatterns) {
        sections.push(`#### ${antiPattern.name} (${antiPattern.severity})`);
        sections.push(`**Description**: ${antiPattern.description}`);
        sections.push(`**Files**: ${antiPattern.files.length} files affected`);
        sections.push(`**Suggestion**: ${antiPattern.suggestion}`);
        sections.push('');
      }
    }

    if (analysis.bestPractices.length > 0) {
      sections.push('### Best Practices Analysis');
      
      for (const practice of analysis.bestPractices) {
        const adherencePercent = Math.round(practice.adherence * 100);
        sections.push(`- **${practice.practice}**: ${adherencePercent}% adherence (${practice.category})`);
      }
    }

    if (analysis.frameworkPatterns.length > 0) {
      sections.push('### Framework Patterns');
      
      for (const framework of analysis.frameworkPatterns) {
        sections.push(`#### ${framework.framework}`);
        sections.push(`**Patterns**: ${framework.patterns.join(', ')}`);
        sections.push(`**Conventions**: ${framework.conventions.join(', ')}`);
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  private generateBusinessLogicContextSection(): string {
    const analysis = this.analysisResults.businessLogicContext!;
    const sections: string[] = [];

    sections.push('## Business Logic Context');
    sections.push('');

    if (analysis.domains.length > 0) {
      sections.push('### Business Domains');
      
      for (const domain of analysis.domains) {
        sections.push(`#### ${domain.name}`);
        sections.push(`**Description**: ${domain.description}`);
        sections.push(`**Files**: ${domain.files.length} files`);
        sections.push(`**Entities**: ${domain.entities.join(', ') || 'None'}`);
        sections.push(`**Services**: ${domain.services.length} services`);
        sections.push('');
      }
    }

    if (analysis.workflows.length > 0) {
      sections.push('### Key Workflows');
      
      for (const workflow of analysis.workflows.slice(0, 5)) {
        sections.push(`#### ${workflow.name}`);
        sections.push(`**Entry Point**: ${workflow.entry}`);
        sections.push(`**Steps**: ${workflow.steps.length} steps`);
        sections.push(`**Data Flow**: ${workflow.dataFlow.join(' → ')}`);
        sections.push('');
      }
    }

    if (analysis.businessRules.length > 0) {
      sections.push('### Business Rules');
      
      const rulesByType = analysis.businessRules.reduce((acc, rule) => {
        if (!acc[rule.type]) acc[rule.type] = [];
        acc[rule.type].push(rule);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [type, rules] of Object.entries(rulesByType)) {
        sections.push(`#### ${type.charAt(0).toUpperCase() + type.slice(1)} Rules`);
        for (const rule of rules.slice(0, 3)) {
          sections.push(`- ${rule.rule} (${rule.location.file}:${rule.location.line})`);
        }
        if (rules.length > 3) {
          sections.push(`- *...and ${rules.length - 3} more ${type} rules*`);
        }
        sections.push('');
      }
    }

    if (analysis.integrations.length > 0) {
      sections.push('### External Integrations');
      
      for (const integration of analysis.integrations) {
        sections.push(`- **${integration.service}** (${integration.type}): ${integration.files.length} files`);
      }
    }

    return sections.join('\n');
  }

  private generateQualityMetricsSection(): string {
    const analysis = this.analysisResults.qualityMetrics!;
    const sections: string[] = [];

    sections.push('## Quality Metrics');
    sections.push('');
    sections.push(`### Overall Code Quality Score: ${analysis.codeQualityScore}/100`);
    sections.push('');

    // Complexity metrics
    sections.push('### Code Complexity');
    sections.push(`- **Average Complexity**: ${analysis.codeComplexity.averageComplexity.toFixed(2)}`);
    sections.push(`- **Cognitive Complexity**: ${analysis.codeComplexity.cognitiveComplexity.toFixed(2)}`);
    
    if (analysis.codeComplexity.highComplexityFunctions.length > 0) {
      sections.push('- **High Complexity Functions**:');
      for (const func of analysis.codeComplexity.highComplexityFunctions.slice(0, 5)) {
        sections.push(`  - \`${func.name}\` (${func.file}) - Complexity: ${func.complexity}`);
      }
    }
    sections.push('');

    // Test coverage
    sections.push('### Test Coverage');
    sections.push(`- **Coverage Percentage**: ${analysis.testCoverage.coveragePercentage.toFixed(1)}%`);
    sections.push(`- **Test Files**: ${analysis.testCoverage.testFiles.length}`);
    sections.push(`- **Tested Functions**: ${analysis.testCoverage.testedFunctions.length}`);
    sections.push(`- **Untested Functions**: ${analysis.testCoverage.untestedFunctions.length}`);
    if (analysis.testCoverage.testPatterns.length > 0) {
      sections.push(`- **Test Patterns**: ${analysis.testCoverage.testPatterns.join(', ')}`);
    }
    sections.push('');

    // Documentation
    sections.push('### Documentation');
    sections.push(`- **Documentation Quality**: ${analysis.documentation.documentationQuality}`);
    sections.push(`- **JSDoc Coverage**: ${analysis.documentation.jsdocCoverage.toFixed(1)}%`);
    sections.push(`- **Documented Functions**: ${analysis.documentation.documentedFunctions}`);
    sections.push(`- **Undocumented Functions**: ${analysis.documentation.undocumentedFunctions}`);
    sections.push('');

    // Type safety
    sections.push('### Type Safety');
    sections.push(`- **TypeScript Coverage**: ${analysis.typesSafety.typescriptCoverage.toFixed(1)}%`);
    sections.push(`- **Any Types Used**: ${analysis.typesSafety.anyTypes}`);
    sections.push(`- **Type Definitions**: ${analysis.typesSafety.typeDefinitions}`);
    sections.push('');

    // Quality hotspots
    if (analysis.hotspots.length > 0) {
      sections.push('### Quality Hotspots');
      
      for (const hotspot of analysis.hotspots.slice(0, 5)) {
        sections.push(`#### ${hotspot.file} (${hotspot.severity})`);
        sections.push(`**Issues**: ${hotspot.issues.join(', ')}`);
        sections.push(`**Impact**: ${hotspot.impact}`);
        sections.push(`**Suggestions**: ${hotspot.suggestions.join(', ')}`);
        sections.push('');
      }
    }

    return sections.join('\n');
  }
}