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
          const fileContent = this.getFileContent(filePath);
          const codeSnippet = fileContent ? this.extractFunctionCode(func, fileContent) : undefined;
          const relationships = this.extractFunctionRelationships(func, fileContent || '', parseResult);
          
          publicFunctions.push({
            ...func,
            codeSnippet,
            calls: relationships.calls,
            calledBy: relationships.calledBy,
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
      const trimmedLine = line.trim();
      
      // Skip comments, imports, and empty lines
      if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*') || 
          trimmedLine.startsWith('*') || trimmedLine.startsWith('import') ||
          trimmedLine.startsWith('export') || trimmedLine.length === 0) {
        continue;
      }
      
      // More specific JWT patterns - look for actual usage, not just mentions
      const jwtPatterns = [
        /jwt\.sign\s*\(/i,
        /jwt\.verify\s*\(/i,
        /jwt\.decode\s*\(/i,
        /Bearer\s+[\w.-]+/i,
        /Authorization.*Bearer/i,
        /jsonwebtoken/i,
        /\.sign\s*\(\s*\{.*\}\s*,\s*['"`][\w.-]+['"`]/
      ];
      
      if (jwtPatterns.some(pattern => pattern.test(line))) {
        patterns.push({
          type: 'jwt',
          name: 'JWT Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `JWT authentication implementation: ${trimmedLine}`,
          pattern: 'Bearer token'
        });
      }

      // More specific OAuth patterns - look for actual OAuth flow implementation
      const oauthPatterns = [
        /client_id.*client_secret/i,
        /oauth2?\.authorize/i,
        /access_token.*refresh_token/i,
        /grant_type.*authorization_code/i,
        /scope.*openid/i
      ];
      
      if (oauthPatterns.some(pattern => pattern.test(line))) {
        patterns.push({
          type: 'oauth',
          name: 'OAuth Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `OAuth implementation: ${trimmedLine}`,
          pattern: 'OAuth 2.0'
        });
      }

      // More specific API Key patterns - look for header setting or validation
      const apiKeyPatterns = [
        /x-api-key.*headers/i,
        /api[_-]?key.*headers/i,
        /headers\[['"`]x-api-key['"`]\]/i,
        /req\.headers\[['"`]api[_-]?key['"`]\]/i,
        /\.setHeader\s*\(\s*['"`]x-api-key['"`]/i
      ];
      
      if (apiKeyPatterns.some(pattern => pattern.test(line))) {
        patterns.push({
          type: 'apiKey',
          name: 'API Key Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `API key implementation: ${trimmedLine}`,
          pattern: 'API Key'
        });
      }

      // More specific Session patterns - look for actual session usage
      const sessionPatterns = [
        /express-session/i,
        /session\.save\s*\(/i,
        /session\.destroy\s*\(/i,
        /req\.session\./i,
        /connect\.session/i,
        /cookie-session/i
      ];
      
      if (sessionPatterns.some(pattern => pattern.test(line))) {
        patterns.push({
          type: 'session',
          name: 'Session Authentication',
          file: filePath,
          lineStart: i + 1,
          description: `Session implementation: ${trimmedLine}`,
          pattern: 'Session/Cookie'
        });
      }
    }

    return patterns;
  }

  private isAuthFunction(name: string): boolean {
    const authFunctionPatterns = [
      /^(authenticate|authorize|login|logout|signin|signout|signup|register)$/i,
      /^(verify|validate|check).*?(token|auth|permission|access)$/i,
      /^(create|generate|issue).*?(token|jwt)$/i,
      /^(refresh|revoke|invalidate).*?(token|session)$/i,
      /^.*?(middleware|guard|auth)$/i
    ];
    
    return authFunctionPatterns.some(pattern => pattern.test(name));
  }

  private isAuthConstant(name: string): boolean {
    const authConstantPatterns = [
      /^(jwt|auth).*?(secret|key|token)$/i,
      /^(client|api).*?(id|key|secret)$/i,
      /^(access|refresh).*?token$/i,
      /^.*?(secret|key)$/i,
      /^(oauth|bearer|session).*?(config|settings)$/i
    ];
    
    return authConstantPatterns.some(pattern => pattern.test(name));
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

  private extractFunctionCode(func: FunctionInfo, content: string): string {
    const lines = content.split('\n');
    const startIndex = Math.max(0, func.lineStart - 1);
    const endIndex = Math.min(lines.length, func.lineEnd);
    
    // Get the function code with proper indentation
    const functionLines = lines.slice(startIndex, endIndex);
    
    // Remove common leading whitespace while preserving relative indentation
    const minIndent = functionLines
      .filter(line => line.trim().length > 0)
      .reduce((min, line) => {
        const indent = line.match(/^\s*/)?.[0].length || 0;
        return Math.min(min, indent);
      }, Infinity);
    
    const cleanedLines = functionLines.map(line => 
      line.length > minIndent ? line.substring(minIndent) : line
    );
    
    return cleanedLines.join('\n').trim();
  }

  private extractFunctionRelationships(func: FunctionInfo, content: string, parseResult: ParseResult): {calls: string[], calledBy: string[]} {
    const functionContent = this.extractFunctionContent(func, content);
    const calls: string[] = [];
    const calledBy: string[] = [];
    
    // Find functions this function calls
    for (const otherFunc of parseResult.functions) {
      if (otherFunc.name !== func.name) {
        // Check if this function calls the other function
        const callPattern = new RegExp(`\\b${otherFunc.name}\\s*\\(`, 'g');
        if (callPattern.test(functionContent)) {
          calls.push(otherFunc.name);
        }
        
        // Check if the other function calls this function
        const otherFuncContent = this.extractFunctionContent(otherFunc, content);
        const calledByPattern = new RegExp(`\\b${func.name}\\s*\\(`, 'g');
        if (calledByPattern.test(otherFuncContent)) {
          calledBy.push(otherFunc.name);
        }
      }
    }
    
    return { calls: [...new Set(calls)], calledBy: [...new Set(calledBy)] };
  }
}