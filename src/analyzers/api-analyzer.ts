import * as fs from 'fs';
import { FileInfo, ParseResult, ApiAnalysis, FunctionInfo, ClassInfo, EndpointInfo, ApiSchemaInfo, AuthenticationInfo, ErrorHandlerInfo } from '../types';

export class ApiAnalyzer {
  private repoPath: string;
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, _fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.parserResults = parserResults;
  }

  public analyze(): ApiAnalysis {
    const publicFunctions = this.extractPublicFunctions();
    const publicClasses = this.extractPublicClasses();
    const endpoints = this.extractApiEndpoints();
    const schemas = this.extractApiSchemas();
    const authentication = this.extractAuthenticationPatterns();
    const errorHandlers = this.extractErrorHandlers();

    return {
      publicFunctions,
      publicClasses,
      endpoints,
      schemas,
      authentication,
      errorHandlers
    };
  }

  private extractPublicFunctions(): FunctionInfo[] {
    const publicFunctions: FunctionInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Add exported functions
      const exportedFunctionNames = parseResult.exports
        .filter(exp => exp.type === 'function')
        .map(exp => exp.name);

      for (const func of parseResult.functions) {
        if (this.isPublicFunction(func, exportedFunctionNames, filePath)) {
          publicFunctions.push({
            ...func,
            // Add file context
            docstring: func.docstring ? `${func.docstring} (from ${filePath})` : `From ${filePath}`
          });
        }
      }
    }

    return publicFunctions.sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractPublicClasses(): ClassInfo[] {
    const publicClasses: ClassInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Add exported classes
      const exportedClassNames = parseResult.exports
        .filter(exp => exp.type === 'class')
        .map(exp => exp.name);

      for (const cls of parseResult.classes) {
        if (this.isPublicClass(cls, exportedClassNames, filePath)) {
          publicClasses.push({
            ...cls,
            // Add file context
            docstring: cls.docstring ? `${cls.docstring} (from ${filePath})` : `From ${filePath}`
          });
        }
      }
    }

    return publicClasses.sort((a, b) => a.name.localeCompare(b.name));
  }

  private extractApiEndpoints(): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Extract HTTP endpoints from different frameworks
      endpoints.push(...this.extractExpressEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractFastAPIEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractFlaskEndpoints(filePath, fileContent, parseResult));
      endpoints.push(...this.extractRestEndpoints(filePath, fileContent, parseResult));
    }

    return endpoints.sort((a, b) => a.path.localeCompare(b.path));
  }

  private isPublicFunction(func: FunctionInfo, exportedNames: string[], filePath: string): boolean {
    // Check if explicitly exported
    if (exportedNames.includes(func.name)) {
      return true;
    }

    // In Python, functions not starting with _ are considered public
    if (filePath.endsWith('.py') && !func.name.startsWith('_')) {
      return true;
    }

    // In JS/TS, check if it's in a file that's likely to be a public API
    if (this.isApiFile(filePath)) {
      return true;
    }

    return false;
  }

  private isPublicClass(cls: ClassInfo, exportedNames: string[], filePath: string): boolean {
    // Check if explicitly exported
    if (exportedNames.includes(cls.name)) {
      return true;
    }

    // In Python, classes not starting with _ are considered public
    if (filePath.endsWith('.py') && !cls.name.startsWith('_')) {
      return true;
    }

    // In JS/TS, check if it's in a file that's likely to be a public API
    if (this.isApiFile(filePath)) {
      return true;
    }

    return false;
  }

  private isApiFile(filePath: string): boolean {
    const apiIndicators = [
      'api',
      'routes',
      'endpoints',
      'controllers',
      'handlers',
      'public',
      'index',
      'main'
    ];

    const fileName = filePath.toLowerCase();
    return apiIndicators.some(indicator => fileName.includes(indicator));
  }

  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = require('path').join(this.repoPath, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  private extractExpressEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // Express.js patterns
    const expressPattern = /(?:app|router|express)\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = expressPattern.exec(line)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        
        // Try to find the associated function
        const functionName = this.findAssociatedFunction(lines, i, parseResult);
        const schemas = this.extractEndpointSchemas(lines, i, functionName || '');

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous',
          requestSchema: schemas.request,
          responseSchema: schemas.response
        });
      }
    }

    return endpoints;
  }

  private extractFastAPIEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // FastAPI patterns
    const fastApiPattern = /@app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = fastApiPattern.exec(line)) !== null) {
        const method = match[1].toUpperCase();
        const path = match[2];
        
        // The function should be on the next non-empty line
        const functionName = this.findNextFunction(lines, i, parseResult);
        const schemas = this.extractPydanticSchemas(lines, i, functionName || '');

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous',
          requestSchema: schemas.request,
          responseSchema: schemas.response
        });
      }
    }

    return endpoints;
  }

  private extractFlaskEndpoints(filePath: string, content: string, parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];
    const lines = content.split('\n');

    // Flask patterns
    const flaskPattern = /@app\.route\s*\(\s*['"`]([^'"`]+)['"`](?:.*?methods\s*=\s*\[['"`]([^'"`]+)['"`]\])?/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let match;

      while ((match = flaskPattern.exec(line)) !== null) {
        const path = match[1];
        const method = match[2] ? match[2].toUpperCase() : 'GET';
        
        // The function should be on the next non-empty line
        const functionName = this.findNextFunction(lines, i, parseResult);
        const schemas = this.extractEndpointSchemas(lines, i, functionName || '');

        endpoints.push({
          method,
          path,
          file: filePath,
          function: functionName || 'anonymous',
          requestSchema: schemas.request,
          responseSchema: schemas.response
        });
      }
    }

    return endpoints;
  }

  private extractRestEndpoints(filePath: string, content: string, _parseResult: ParseResult): EndpointInfo[] {
    const endpoints: EndpointInfo[] = [];

    // Generic REST patterns (looking for HTTP method comments or strings)
    const restPatterns = [
      /\/\*\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)\s*\*\//g,
      /\/\/\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)/g,
      /#\s*(GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}:]+)/g
    ];

    for (const pattern of restPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        endpoints.push({
          method: match[1],
          path: match[2],
          file: filePath,
          function: 'documented'
        });
      }
    }

    return endpoints;
  }

  private findAssociatedFunction(lines: string[], lineIndex: number, parseResult: ParseResult): string | null {
    // Look for function on the same line or nearby lines
    for (let i = lineIndex; i < Math.min(lineIndex + 3, lines.length); i++) {
      const line = lines[i];
      
      // Look for function calls or references
      for (const func of parseResult.functions) {
        if (line.includes(func.name) && !line.includes('function')) {
          return func.name;
        }
      }
    }

    return null;
  }

  private findNextFunction(lines: string[], lineIndex: number, parseResult: ParseResult): string | null {
    // Look for function definition in the next few lines
    for (let i = lineIndex + 1; i < Math.min(lineIndex + 5, lines.length); i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('#') || line.startsWith('//')) {
        continue;
      }

      // Check against parsed functions
      for (const func of parseResult.functions) {
        if (line.includes(`def ${func.name}`) || line.includes(`function ${func.name}`) || 
            line.includes(`${func.name}(`)) {
          return func.name;
        }
      }
    }

    return null;
  }

  public getApiStats(): Record<string, any> {
    const analysis = this.analyze();
    
    const stats = {
      totalPublicFunctions: analysis.publicFunctions.length,
      totalPublicClasses: analysis.publicClasses.length,
      totalEndpoints: analysis.endpoints.length,
      endpointsByMethod: this.groupEndpointsByMethod(analysis.endpoints),
      functionsWithDocumentation: analysis.publicFunctions.filter(f => f.docstring).length,
      classesWithDocumentation: analysis.publicClasses.filter(c => c.docstring).length,
      mostComplexFunction: this.findMostComplexFunction(analysis.publicFunctions),
      largestClass: this.findLargestClass(analysis.publicClasses)
    };

    return stats;
  }

  private groupEndpointsByMethod(endpoints: EndpointInfo[]): Record<string, number> {
    const methodCounts: Record<string, number> = {};
    
    for (const endpoint of endpoints) {
      methodCounts[endpoint.method] = (methodCounts[endpoint.method] || 0) + 1;
    }

    return methodCounts;
  }

  private findMostComplexFunction(functions: FunctionInfo[]): { name: string; complexity: number } {
    let mostComplex = { name: '', complexity: 0 };

    for (const func of functions) {
      // Simple complexity measure: number of parameters + estimated lines
      const complexity = func.parameters.length + (func.lineEnd - func.lineStart);
      
      if (complexity > mostComplex.complexity) {
        mostComplex = { name: func.name, complexity };
      }
    }

    return mostComplex;
  }

  private findLargestClass(classes: ClassInfo[]): { name: string; size: number } {
    let largest = { name: '', size: 0 };

    for (const cls of classes) {
      // Size measure: number of methods + properties + lines
      const size = cls.methods.length + cls.properties.length + (cls.lineEnd - cls.lineStart);
      
      if (size > largest.size) {
        largest = { name: cls.name, size };
      }
    }

    return largest;
  }

  private extractApiSchemas(): ApiSchemaInfo[] {
    const schemas: ApiSchemaInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Extract TypeScript interfaces that look like API schemas
      if (parseResult.interfaces) {
        for (const iface of parseResult.interfaces) {
          if (this.isApiSchema(iface.name, fileContent)) {
            schemas.push({
              name: iface.name,
              type: 'interface',
              properties: iface.properties,
              file: filePath,
              lineStart: iface.lineStart,
              description: iface.docstring
            });
          }
        }
      }

      // Extract type aliases that look like API types
      if (parseResult.typeAliases) {
        for (const typeAlias of parseResult.typeAliases) {
          if (this.isApiSchema(typeAlias.name, fileContent)) {
            schemas.push({
              name: typeAlias.name,
              type: 'typeAlias',
              definition: typeAlias.definition,
              file: filePath,
              lineStart: typeAlias.lineStart,
              description: typeAlias.docstring
            });
          }
        }
      }

      // Extract JSON schemas from constants
      for (const constant of parseResult.constants) {
        if (this.isJsonSchema(constant.name, constant.value || '')) {
          schemas.push({
            name: constant.name,
            type: 'jsonSchema',
            definition: constant.value,
            file: filePath,
            description: `JSON Schema constant`
          });
        }
      }
    }

    return schemas;
  }

  private extractAuthenticationPatterns(): AuthenticationInfo[] {
    const authPatterns: AuthenticationInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for authentication middleware and patterns
      const patterns = this.findAuthPatterns(fileContent, filePath);
      authPatterns.push(...patterns);

      // Check for authentication-related functions
      for (const func of parseResult.functions) {
        if (this.isAuthFunction(func.name)) {
          authPatterns.push({
            type: 'function',
            name: func.name,
            file: filePath,
            lineStart: func.lineStart,
            description: func.docstring || `Authentication function: ${func.name}`,
            pattern: this.extractAuthPattern(func.name)
          });
        }
      }

      // Check for authentication-related constants
      for (const constant of parseResult.constants) {
        if (this.isAuthConstant(constant.name)) {
          authPatterns.push({
            type: 'constant',
            name: constant.name,
            file: filePath,
            description: `Authentication constant: ${constant.name}`,
            pattern: this.extractAuthPatternFromConstant(constant.name, constant.value || '')
          });
        }
      }
    }

    return authPatterns;
  }

  private extractErrorHandlers(): ErrorHandlerInfo[] {
    const errorHandlers: ErrorHandlerInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for error handling patterns
      for (const func of parseResult.functions) {
        if (this.isErrorHandler(func.name, fileContent)) {
          const errorTypes = this.extractErrorTypes(func, fileContent);
          errorHandlers.push({
            name: func.name,
            file: filePath,
            lineStart: func.lineStart,
            lineEnd: func.lineEnd,
            errorTypes,
            isMiddleware: this.isMiddleware(func.name, fileContent),
            description: func.docstring || `Error handler: ${func.name}`
          });
        }
      }

      // Look for try-catch blocks
      const tryCatchBlocks = this.extractTryCatchBlocks(fileContent, filePath);
      errorHandlers.push(...tryCatchBlocks);
    }

    return errorHandlers;
  }

  private isApiSchema(name: string, content: string): boolean {
    const apiIndicators = [
      'request', 'response', 'dto', 'payload', 'schema', 'model', 'entity',
      'api', 'input', 'output', 'body', 'params', 'query', 'headers'
    ];
    
    const lowerName = name.toLowerCase();
    return apiIndicators.some(indicator => lowerName.includes(indicator)) ||
           content.includes(`@ApiProperty`) || // NestJS
           content.includes(`@JsonProperty`) || // Java
           content.includes(`Field(`) || // Python Pydantic
           content.includes(`z.object`) || // Zod schema
           content.includes(`Joi.object`); // Joi schema
  }

  private isJsonSchema(name: string, value: string): boolean {
    const lowerName = name.toLowerCase();
    return (lowerName.includes('schema') || lowerName.includes('validation')) &&
           (value.includes('"type"') || value.includes('"properties"') || value.includes('"required"'));
  }

  private findAuthPatterns(content: string, filePath: string): AuthenticationInfo[] {
    const patterns: AuthenticationInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // JWT patterns
      if (line.includes('jwt') || line.includes('JWT') || line.includes('Bearer')) {
        patterns.push({
          type: 'jwt',
          name: 'JWT Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `JWT authentication found: ${line.trim()}`,
          pattern: 'Bearer token'
        });
      }

      // OAuth patterns
      if (line.includes('oauth') || line.includes('OAuth') || line.includes('client_id')) {
        patterns.push({
          type: 'oauth',
          name: 'OAuth Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `OAuth pattern found: ${line.trim()}`,
          pattern: 'OAuth 2.0'
        });
      }

      // API Key patterns
      if (line.includes('api_key') || line.includes('apiKey') || line.includes('x-api-key')) {
        patterns.push({
          type: 'apiKey',
          name: 'API Key Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `API key pattern found: ${line.trim()}`,
          pattern: 'API Key'
        });
      }

      // Session patterns
      if (line.includes('session') || line.includes('cookie') || line.includes('express-session')) {
        patterns.push({
          type: 'session',
          name: 'Session Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `Session pattern found: ${line.trim()}`,
          pattern: 'Session/Cookie'
        });
      }
    }

    return patterns;
  }

  private isAuthFunction(name: string): boolean {
    const authIndicators = [
      'auth', 'login', 'logout', 'authenticate', 'authorize', 'verify',
      'token', 'jwt', 'session', 'permission', 'access', 'guard'
    ];
    
    const lowerName = name.toLowerCase();
    return authIndicators.some(indicator => lowerName.includes(indicator));
  }

  private isAuthConstant(name: string): boolean {
    const authIndicators = [
      'auth', 'jwt', 'token', 'secret', 'key', 'client_id', 'client_secret',
      'api_key', 'bearer', 'oauth', 'session'
    ];
    
    const lowerName = name.toLowerCase();
    return authIndicators.some(indicator => lowerName.includes(indicator));
  }

  private extractAuthPattern(funcName: string): string {
    const lowerName = funcName.toLowerCase();
    if (lowerName.includes('jwt')) return 'JWT';
    if (lowerName.includes('oauth')) return 'OAuth';
    if (lowerName.includes('session')) return 'Session';
    if (lowerName.includes('api') && lowerName.includes('key')) return 'API Key';
    if (lowerName.includes('bearer')) return 'Bearer Token';
    return 'Unknown';
  }

  private extractAuthPatternFromConstant(name: string, value: string): string {
    const lowerName = name.toLowerCase();
    const lowerValue = value.toLowerCase();
    
    if (lowerName.includes('jwt') || lowerValue.includes('jwt')) return 'JWT';
    if (lowerName.includes('oauth') || lowerValue.includes('oauth')) return 'OAuth';
    if (lowerName.includes('session') || lowerValue.includes('session')) return 'Session';
    if (lowerName.includes('key') || lowerValue.includes('key')) return 'API Key';
    return 'Configuration';
  }

  private isErrorHandler(funcName: string, content: string): boolean {
    const errorIndicators = ['error', 'exception', 'catch', 'handler', 'fail'];
    const lowerName = funcName.toLowerCase();
    
    return errorIndicators.some(indicator => lowerName.includes(indicator)) ||
           content.includes(`function ${funcName}`) && content.includes('error') ||
           content.includes(`const ${funcName}`) && content.includes('error');
  }

  private isMiddleware(funcName: string, content: string): boolean {
    return content.includes('middleware') ||
           content.includes('next()') ||
           content.includes('req, res, next') ||
           funcName.toLowerCase().includes('middleware');
  }

  private extractErrorTypes(func: FunctionInfo, content: string): string[] {
    const errorTypes: string[] = [];
    const funcContent = this.extractFunctionContent(func, content);
    
    // Common error patterns
    const patterns = [
      /throw new (\w+Error)/g,
      /catch\s*\(\s*(\w+)/g,
      /instanceof\s+(\w+Error)/g,
      /error\.name\s*===\s*['"`](\w+)['"`]/g,
      /HttpStatus\.(\w+)/g,
      /status\(\s*(\d{3})\s*\)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(funcContent)) !== null) {
        errorTypes.push(match[1]);
      }
    }

    return [...new Set(errorTypes)]; // Remove duplicates
  }

  private extractTryCatchBlocks(content: string, filePath: string): ErrorHandlerInfo[] {
    const blocks: ErrorHandlerInfo[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('try {') || line.includes('try{')) {
        const catchLine = this.findCatchBlock(lines, i);
        if (catchLine > i) {
          const errorTypes = this.extractErrorTypesFromBlock(lines.slice(i, catchLine + 1));
          blocks.push({
            name: 'try-catch block',
            file: filePath,
            lineStart: i + 1,
            lineEnd: catchLine + 1,
            errorTypes,
            isMiddleware: false,
            description: `Try-catch error handling block`
          });
        }
      }
    }

    return blocks;
  }

  private findCatchBlock(lines: string[], startLine: number): number {
    let braceCount = 0;
    let inTryBlock = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('try')) inTryBlock = true;
      if (inTryBlock) {
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (line.includes('catch') && braceCount <= 1) {
          return i;
        }
      }
    }
    
    return -1;
  }

  private extractErrorTypesFromBlock(blockLines: string[]): string[] {
    const errorTypes: string[] = [];
    const blockContent = blockLines.join('\n');
    
    const patterns = [
      /catch\s*\(\s*(\w+)/g,
      /instanceof\s+(\w+)/g,
      /throw\s+new\s+(\w+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(blockContent)) !== null) {
        errorTypes.push(match[1]);
      }
    }

    return [...new Set(errorTypes)];
  }

  private extractFunctionContent(func: FunctionInfo, content: string): string {
    const lines = content.split('\n');
    const startIndex = Math.max(0, func.lineStart - 1);
    const endIndex = Math.min(lines.length, func.lineEnd);
    
    return lines.slice(startIndex, endIndex).join('\n');
  }

  private extractEndpointSchemas(lines: string[], lineIndex: number, _functionName: string): {request?: string, response?: string} {
    const schemas: {request?: string, response?: string} = {};
    
    // Look for TypeScript/JavaScript schema patterns around the endpoint
    for (let i = Math.max(0, lineIndex - 5); i < Math.min(lines.length, lineIndex + 20); i++) {
      const line = lines[i];
      
      // Look for request body validation
      if (line.includes('body') || line.includes('req.body')) {
        const bodyTypeMatch = line.match(/:\s*(\w+(?:\[\])?)/);
        if (bodyTypeMatch) {
          schemas.request = bodyTypeMatch[1];
        }
      }
      
      // Look for response types
      if (line.includes('res.json') || line.includes('response') || line.includes('return')) {
        const responseTypeMatch = line.match(/:\s*(\w+(?:\[\])?)/);
        if (responseTypeMatch) {
          schemas.response = responseTypeMatch[1];
        }
      }
      
      // Look for Joi, Zod, or other validation schemas
      if (line.includes('Joi.') || line.includes('z.') || line.includes('yup.')) {
        const schemaNameMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=.*(?:Joi|z|yup)\./);
        if (schemaNameMatch) {
          if (line.includes('body') || line.includes('request')) {
            schemas.request = schemaNameMatch[1];
          } else {
            schemas.response = schemaNameMatch[1];
          }
        }
      }
    }
    
    return schemas;
  }

  private extractPydanticSchemas(lines: string[], lineIndex: number, _functionName: string): {request?: string, response?: string} {
    const schemas: {request?: string, response?: string} = {};
    
    // Look for Pydantic models in FastAPI endpoints
    for (let i = Math.max(0, lineIndex - 5); i < Math.min(lines.length, lineIndex + 20); i++) {
      const line = lines[i];
      
      // Function parameter types (request models)
      const paramMatch = line.match(/def\s+\w+.*:\s*(\w+Model)/);
      if (paramMatch) {
        schemas.request = paramMatch[1];
      }
      
      // Return type annotations (response models)  
      const returnMatch = line.match(/def\s+\w+.*->\s*(\w+(?:\[\w+\])?)/);
      if (returnMatch) {
        schemas.response = returnMatch[1];
      }
      
      // Response model in decorator
      const responseModelMatch = line.match(/response_model\s*=\s*(\w+)/);
      if (responseModelMatch) {
        schemas.response = responseModelMatch[1];
      }
    }
    
    return schemas;
  }
}