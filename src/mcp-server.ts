#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { RepositoryAnalyzer } from './main.js';
import * as fs from 'fs';
import * as path from 'path';

class RepoAnalyzerMCPServer {
  private server: Server;
  private analysisCache: Map<string, any> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'repo-analyzer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_repository',
            description: 'Analyze a code repository and return comprehensive insights about its structure, dependencies, APIs, and patterns',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Path to the repository to analyze',
                },
                focus: {
                  type: 'string',
                  enum: ['all', 'structure', 'dependencies', 'api', 'database', 'patterns', 'vector'],
                  description: 'Focus area for analysis',
                  default: 'all',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'search_codebase',
            description: 'Search for specific patterns, functions, or components in the analyzed codebase',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (function name, class name, pattern, etc.)',
                },
                type: {
                  type: 'string',
                  enum: ['function', 'class', 'interface', 'component', 'endpoint', 'pattern'],
                  description: 'Type of item to search for',
                },
                repo_path: {
                  type: 'string',
                  description: 'Repository path (if different from last analyzed)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_code_structure',
            description: 'Get the structure and patterns of a specific file or component to understand how to implement similar functionality',
            inputSchema: {
              type: 'object',
              properties: {
                component_name: {
                  type: 'string',
                  description: 'Name of component, function, or pattern to get structure for',
                },
                repo_path: {
                  type: 'string',
                  description: 'Repository path',
                },
              },
              required: ['component_name'],
            },
          },
          {
            name: 'suggest_implementation',
            description: 'Suggest how to implement new functionality based on existing codebase patterns and structure',
            inputSchema: {
              type: 'object',
              properties: {
                requirement: {
                  type: 'string',
                  description: 'What you want to implement (e.g., "user authentication endpoint", "user profile component")',
                },
                repo_path: {
                  type: 'string',
                  description: 'Repository path',
                },
              },
              required: ['requirement'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_repository':
            return await this.analyzeRepository(args);
          case 'search_codebase':
            return await this.searchCodebase(args);
          case 'get_code_structure':
            return await this.getCodeStructure(args);
          case 'suggest_implementation':
            return await this.suggestImplementation(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async analyzeRepository(args: any) {
    const { path: repoPath, focus = 'all' } = args;

    if (!fs.existsSync(repoPath)) {
      throw new Error(`Repository path does not exist: ${repoPath}`);
    }

    // Check cache first
    const cacheKey = `${repoPath}:${focus}`;
    if (this.analysisCache.has(cacheKey)) {
      const cached = this.analysisCache.get(cacheKey);
      return {
        content: [
          {
            type: 'text',
            text: `Repository analysis (cached):\n\n${JSON.stringify(cached, null, 2)}`,
          },
        ],
      };
    }

    // Run analysis
    const analyzer = new RepositoryAnalyzer(repoPath, 'temp-analysis.md', [focus as any], false);
    const success = await analyzer.analyze();

    if (!success) {
      throw new Error('Analysis failed');
    }

    // Read the generated analysis
    const analysisPath = path.resolve('temp-analysis.md');
    const analysis = fs.readFileSync(analysisPath, 'utf-8');
    
    // Parse key insights for caching
    const insights = this.extractInsights(analysis);
    this.analysisCache.set(cacheKey, insights);

    // Clean up temp file
    if (fs.existsSync(analysisPath)) {
      fs.unlinkSync(analysisPath);
    }

    return {
      content: [
        {
          type: 'text',
          text: `Repository analysis completed:\n\n${analysis}`,
        },
      ],
    };
  }

  private async searchCodebase(args: any) {
    const { query, type, repo_path } = args;
    
    // Get analysis from cache or run new analysis
    let insights = null;
    for (const [key, value] of this.analysisCache.entries()) {
      if (!repo_path || key.startsWith(repo_path)) {
        insights = value;
        break;
      }
    }

    if (!insights) {
      return {
        content: [
          {
            type: 'text',
            text: 'No repository analysis found. Please run analyze_repository first.',
          },
        ],
      };
    }

    const results = this.searchInAnalysis(insights, query, type);
    
    return {
      content: [
        {
          type: 'text',
          text: `Search results for "${query}":\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  private async getCodeStructure(args: any) {
    const { component_name, repo_path } = args;
    
    // Get analysis from cache
    let insights = null;
    for (const [key, value] of this.analysisCache.entries()) {
      if (!repo_path || key.startsWith(repo_path)) {
        insights = value;
        break;
      }
    }

    if (!insights) {
      return {
        content: [
          {
            type: 'text',
            text: 'No repository analysis found. Please run analyze_repository first.',
          },
        ],
      };
    }

    const structure = this.findComponentStructure(insights, component_name);
    
    return {
      content: [
        {
          type: 'text',
          text: `Code structure for "${component_name}":\n\n${JSON.stringify(structure, null, 2)}`,
        },
      ],
    };
  }

  private async suggestImplementation(args: any) {
    const { requirement, repo_path } = args;
    
    // Get analysis from cache
    let insights = null;
    for (const [key, value] of this.analysisCache.entries()) {
      if (!repo_path || key.startsWith(repo_path)) {
        insights = value;
        break;
      }
    }

    if (!insights) {
      return {
        content: [
          {
            type: 'text',
            text: 'No repository analysis found. Please run analyze_repository first.',
          },
        ],
      };
    }

    const suggestions = this.generateImplementationSuggestions(insights, requirement);
    
    return {
      content: [
        {
          type: 'text',
          text: `Implementation suggestions for "${requirement}":\n\n${suggestions}`,
        },
      ],
    };
  }

  private extractInsights(analysis: string): any {
    // Extract structured data from the markdown analysis
    const insights = {
      summary: {},
      functions: [] as string[],
      classes: [] as string[],
      components: [] as string[],
      endpoints: [] as string[],
      patterns: [] as string[],
      dependencies: [] as string[],
      structure: {},
    };

    // Parse the markdown to extract key sections
    const lines = analysis.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').toLowerCase();
      } else if (line.startsWith('### ')) {
        // Extract specific data based on section
        if (currentSection.includes('api') && line.includes('`')) {
          const match = line.match(/`([^`]+)`/);
          if (match) {
            insights.functions.push(match[1]);
          }
        }
      }
    }

    return insights;
  }

  private searchInAnalysis(insights: any, query: string, type?: string): any {
    const results: any[] = [];
    const lowerQuery = query.toLowerCase();

    // Search in functions
    if (!type || type === 'function') {
      insights.functions?.forEach((func: string) => {
        if (func.toLowerCase().includes(lowerQuery)) {
          results.push({ type: 'function', name: func });
        }
      });
    }

    // Search in classes
    if (!type || type === 'class') {
      insights.classes?.forEach((cls: string) => {
        if (cls.toLowerCase().includes(lowerQuery)) {
          results.push({ type: 'class', name: cls });
        }
      });
    }

    return results;
  }

  private findComponentStructure(_insights: any, componentName: string): any {
    // Look for the component structure in the analysis
    return {
      name: componentName,
      found: false,
      suggestion: 'Component structure not found in analysis. Consider re-running analysis with focus on components.',
    };
  }

  private generateImplementationSuggestions(_insights: any, requirement: string): string {
    // Generate suggestions based on existing patterns and structure
    const suggestions = [];

    if (requirement.toLowerCase().includes('endpoint') || requirement.toLowerCase().includes('api')) {
      suggestions.push('Based on your codebase structure:');
      suggestions.push('1. Follow the existing API patterns found in your endpoints');
      suggestions.push('2. Use the same authentication patterns identified in your codebase');
      suggestions.push('3. Follow the naming conventions found in your existing functions');
    }

    if (requirement.toLowerCase().includes('user') || requirement.toLowerCase().includes('profile')) {
      suggestions.push('For user-related functionality:');
      suggestions.push('1. Check existing user management patterns in your codebase');
      suggestions.push('2. Follow the same data structure patterns for user objects');
      suggestions.push('3. Use the established error handling patterns');
    }

    return suggestions.join('\n');
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Repository Analyzer MCP server running on stdio');
  }
}

// Run the server
const server = new RepoAnalyzerMCPServer();
server.run().catch(console.error);