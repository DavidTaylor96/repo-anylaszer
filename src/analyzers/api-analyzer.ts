import * as fs from 'fs';
import { 
  FileInfo, ParseResult, ApiAnalysis, FunctionInfo, ClassInfo, EndpointInfo, ApiSchemaInfo, 
  AuthenticationInfo, ErrorHandlerInfo, ServerFrameworkInfo, ApiArchitectureInfo, 
  SecurityAnalysisInfo, PerformancePatternInfo, InfrastructurePatternInfo,
  MiddlewareInfo, RouteInfo, DecoratorInfo, ConfigurationInfo, RestfulDesignInfo,
  ApiVersioningInfo, ApiDocumentationInfo, RateLimitingInfo, CachingInfo, CorsInfo,
  ContentNegotiationInfo, PaginationInfo, OutputSanitizationInfo,
  AuthorizationInfo, InputValidationInfo, VulnerabilityInfo
} from '../types';

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
    const serverFrameworks = this.extractServerFrameworks();
    const apiArchitecture = this.analyzeApiArchitecture(endpoints);
    const security = this.analyzeSecurityPatterns();
    const performance = this.analyzePerformancePatterns();
    const infrastructure = this.analyzeInfrastructurePatterns();

    return {
      publicFunctions,
      publicClasses,
      endpoints,
      schemas,
      authentication,
      errorHandlers,
      serverFrameworks,
      apiArchitecture,
      security,
      performance,
      infrastructure
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

  // Enhanced Backend API Analysis Methods

  private extractServerFrameworks(): ServerFrameworkInfo[] {
    const frameworks: ServerFrameworkInfo[] = [];
    const frameworkMap = new Map<string, any>();

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Express.js Detection
      const expressFramework = this.detectExpressFramework(filePath, fileContent, parseResult);
      if (expressFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'express', expressFramework);
      }

      // NestJS Detection
      const nestFramework = this.detectNestJSFramework(filePath, fileContent, parseResult);
      if (nestFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'nestjs', nestFramework);
      }

      // Fastify Detection
      const fastifyFramework = this.detectFastifyFramework(filePath, fileContent, parseResult);
      if (fastifyFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'fastify', fastifyFramework);
      }

      // Koa Detection
      const koaFramework = this.detectKoaFramework(filePath, fileContent, parseResult);
      if (koaFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'koa', koaFramework);
      }

      // GraphQL/Apollo Server Detection
      const graphqlFramework = this.detectGraphQLFramework(filePath, fileContent, parseResult);
      if (graphqlFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'apollo-server', graphqlFramework);
      }

      // Socket.io Detection
      const socketFramework = this.detectSocketIOFramework(filePath, fileContent, parseResult);
      if (socketFramework) {
        this.mergeFrameworkInfo(frameworkMap, 'socket.io', socketFramework);
      }
    }

    return Array.from(frameworkMap.values());
  }

  private detectExpressFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const expressPatterns = [
      /import.*express.*from.*['"`]express['"`]/,
      /require\(['"`]express['"`]\)/,
      /express\(\)/,
      /app\.use\(/,
      /app\.(get|post|put|delete|patch)\(/
    ];

    if (!expressPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const middleware = this.extractExpressMiddleware(content, filePath);
    const routes = this.extractExpressRoutes(content, filePath, parseResult);
    const configuration = this.extractExpressConfiguration(content, filePath);

    return {
      framework: 'express' as const,
      files: [filePath],
      middleware,
      routes,
      configuration
    };
  }

  private detectNestJSFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const nestPatterns = [
      /@nestjs\/common/,
      /@nestjs\/core/,
      /@Controller\(/,
      /@Injectable\(/,
      /@Module\(/,
      /NestFactory\.create/
    ];

    if (!nestPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const decorators = this.extractNestDecorators(content, filePath);
    const routes = this.extractNestRoutes(content, filePath, parseResult);
    const middleware = this.extractNestMiddleware(content, filePath);
    const configuration = this.extractNestConfiguration(content, filePath);

    return {
      framework: 'nestjs' as const,
      files: [filePath],
      decorators,
      routes,
      middleware,
      configuration
    };
  }

  private detectFastifyFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const fastifyPatterns = [
      /import.*fastify.*from.*['"`]fastify['"`]/,
      /require\(['"`]fastify['"`]\)/,
      /fastify\(\)/,
      /\.register\(/,
      /\.addHook\(/
    ];

    if (!fastifyPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const plugins = this.extractFastifyPlugins(content, filePath);
    const routes = this.extractFastifyRoutes(content, filePath, parseResult);
    const middleware = this.extractFastifyHooks(content, filePath);
    const configuration = this.extractFastifyConfiguration(content, filePath);

    return {
      framework: 'fastify' as const,
      files: [filePath],
      plugins,
      routes,
      middleware,
      configuration
    };
  }

  private detectKoaFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const koaPatterns = [
      /import.*Koa.*from.*['"`]koa['"`]/,
      /require\(['"`]koa['"`]\)/,
      /new Koa\(\)/,
      /\.use\(.*ctx.*next/,
      /ctx\.(request|response|body)/
    ];

    if (!koaPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const middleware = this.extractKoaMiddleware(content, filePath);
    const routes = this.extractKoaRoutes(content, filePath, parseResult);
    const configuration = this.extractKoaConfiguration(content, filePath);

    return {
      framework: 'koa' as const,
      files: [filePath],
      middleware,
      routes,
      configuration
    };
  }

  private detectGraphQLFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const graphqlPatterns = [
      /apollo-server/,
      /ApolloServer/,
      /buildSchema/,
      /GraphQLSchema/,
      /type Query/,
      /type Mutation/,
      /@resolver/i
    ];

    if (!graphqlPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const routes = this.extractGraphQLResolvers(content, filePath, parseResult);
    const configuration = this.extractGraphQLConfiguration(content, filePath);

    return {
      framework: 'apollo-server' as const,
      files: [filePath],
      routes,
      configuration
    };
  }

  private detectSocketIOFramework(filePath: string, content: string, parseResult: ParseResult): Partial<ServerFrameworkInfo> | null {
    const socketPatterns = [
      /socket\.io/,
      /io\.(on|emit)/,
      /socket\.(on|emit|broadcast)/,
      /Server.*socket\.io/,
      /socketio/
    ];

    if (!socketPatterns.some(pattern => pattern.test(content))) {
      return null;
    }

    const routes = this.extractSocketIOEvents(content, filePath, parseResult);
    const middleware = this.extractSocketIOMiddleware(content, filePath);
    const configuration = this.extractSocketIOConfiguration(content, filePath);

    return {
      framework: 'socket.io' as const,
      files: [filePath],
      routes,
      middleware,
      configuration
    };
  }

  private extractExpressMiddleware(content: string, filePath: string): MiddlewareInfo[] {
    const middleware: MiddlewareInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const middlewareMatch = line.match(/app\.use\(\s*([^)]+)\s*\)/);
      
      if (middlewareMatch) {
        const middlewareName = middlewareMatch[1].trim();
        let type: MiddlewareInfo['type'] = 'other';
        
        if (middlewareName.includes('cors')) type = 'cors';
        else if (middlewareName.includes('auth')) type = 'authentication';
        else if (middlewareName.includes('log')) type = 'logging';
        else if (middlewareName.includes('rate')) type = 'rate-limiting';
        else if (middlewareName.includes('valid')) type = 'validation';
        else if (middlewareName.includes('error')) type = 'error-handling';

        middleware.push({
          name: middlewareName,
          type,
          file: filePath,
          lineStart: i + 1,
          description: `Express middleware: ${middlewareName}`,
          global: true
        });
      }
    }

    return middleware;
  }

  private extractExpressRoutes(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const routeMatch = line.match(/app\.(get|post|put|delete|patch|use)\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*(.*)?\)/);
      
      if (routeMatch) {
        const method = routeMatch[1].toUpperCase();
        const path = routeMatch[2];
        const handler = routeMatch[3] || 'anonymous';
        
        routes.push({
          path,
          method,
          handler: handler.trim(),
          file: filePath,
          middleware: []
        });
      }
    }

    return routes;
  }

  private extractExpressConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    const config: ConfigurationInfo[] = [];
    const configPatterns = [
      { pattern: /app\.set\(['"`]([^'"`]+)['"`],\s*(.+)\)/, type: 'other' as const },
      { pattern: /app\.use\(cors\((.*)\)\)/, type: 'cors' as const },
      { pattern: /session\((.*)\)/, type: 'session' as const }
    ];

    for (const { pattern, type } of configPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        config.push({
          type,
          file: filePath,
          settings: { [matches[1] || 'configuration']: matches[2] || matches[1] },
          sensitive: type === 'session' || content.includes('secret')
        });
      }
    }

    return config;
  }

  private extractNestDecorators(content: string, filePath: string): DecoratorInfo[] {
    const decorators: DecoratorInfo[] = [];
    const decoratorPatterns = [
      { pattern: /@Controller\(([^)]*)\)/, type: 'controller' as const },
      { pattern: /@Injectable\(\)/, type: 'service' as const },
      { pattern: /@Guard\(([^)]*)\)/, type: 'guard' as const },
      { pattern: /@Interceptor\(([^)]*)\)/, type: 'interceptor' as const },
      { pattern: /@Pipe\(([^)]*)\)/, type: 'pipe' as const }
    ];

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, type } of decoratorPatterns) {
        const match = line.match(pattern);
        if (match) {
          // Find the class or method this decorator applies to
          let target = 'unknown';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            const classMatch = nextLine.match(/class\s+(\w+)/);
            const methodMatch = nextLine.match(/(\w+)\s*\(/);
            if (classMatch) {
              target = classMatch[1];
              break;
            } else if (methodMatch) {
              target = methodMatch[1];
              break;
            }
          }

          decorators.push({
            name: type,
            type,
            file: filePath,
            target,
            parameters: match[1] ? [match[1]] : undefined
          });
        }
      }
    }

    return decorators;
  }

  private extractNestRoutes(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const routeDecorators = [
        { pattern: /@Get\(['"`]?([^'"`)]*)['"`]?\)/, method: 'GET' },
        { pattern: /@Post\(['"`]?([^'"`)]*)['"`]?\)/, method: 'POST' },
        { pattern: /@Put\(['"`]?([^'"`)]*)['"`]?\)/, method: 'PUT' },
        { pattern: /@Delete\(['"`]?([^'"`)]*)['"`]?\)/, method: 'DELETE' },
        { pattern: /@Patch\(['"`]?([^'"`)]*)['"`]?\)/, method: 'PATCH' }
      ];

      for (const { pattern, method } of routeDecorators) {
        const match = line.match(pattern);
        if (match) {
          const path = match[1] || '';
          
          // Find the method name on the next few lines
          let handler = 'anonymous';
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const methodMatch = lines[j].match(/(\w+)\s*\(/);
            if (methodMatch) {
              handler = methodMatch[1];
              break;
            }
          }

          routes.push({
            path,
            method,
            handler,
            file: filePath,
            middleware: [],
            guards: this.extractNestGuards(lines, i)
          });
        }
      }
    }

    return routes;
  }

  private extractNestGuards(lines: string[], startIndex: number): string[] {
    const guards: string[] = [];
    for (let i = Math.max(0, startIndex - 3); i < Math.min(startIndex + 3, lines.length); i++) {
      const guardMatch = lines[i].match(/@UseGuards\(([^)]+)\)/);
      if (guardMatch) {
        guards.push(guardMatch[1]);
      }
    }
    return guards;
  }

  private extractNestMiddleware(content: string, filePath: string): MiddlewareInfo[] {
    const middleware: MiddlewareInfo[] = [];
    const middlewarePattern = /@UseInterceptors\(([^)]+)\)|@UseFilters\(([^)]+)\)|@UsePipes\(([^)]+)\)/g;
    
    let match;
    while ((match = middlewarePattern.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      let type: MiddlewareInfo['type'] = 'other';
      
      if (name.toLowerCase().includes('auth')) type = 'authentication';
      else if (name.toLowerCase().includes('valid')) type = 'validation';
      else if (name.toLowerCase().includes('log')) type = 'logging';
      else if (name.toLowerCase().includes('error')) type = 'error-handling';

      middleware.push({
        name,
        type,
        file: filePath,
        lineStart: content.substring(0, match.index).split('\n').length,
        description: `NestJS middleware: ${name}`,
        global: false
      });
    }

    return middleware;
  }

  private extractNestConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    const config: ConfigurationInfo[] = [];
    
    if (content.includes('@Module(')) {
      const moduleMatch = content.match(/@Module\(([\s\S]*?)\)/);
      if (moduleMatch) {
        config.push({
          type: 'other',
          file: filePath,
          settings: { moduleConfiguration: moduleMatch[1] },
          sensitive: false
        });
      }
    }

    return config;
  }

  private extractFastifyPlugins(content: string, filePath: string): any[] {
    const plugins: any[] = [];
    const pluginPattern = /\.register\(\s*([^,]+)/g;
    
    let match;
    while ((match = pluginPattern.exec(content)) !== null) {
      plugins.push({
        name: match[1].trim(),
        file: filePath,
        purpose: `Fastify plugin: ${match[1].trim()}`
      });
    }

    return plugins;
  }

  private extractFastifyRoutes(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const routePattern = /\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*(.*)?\)/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      routes.push({
        path: match[2],
        method: match[1].toUpperCase(),
        handler: match[3] || 'anonymous',
        file: filePath,
        middleware: []
      });
    }

    return routes;
  }

  private extractFastifyHooks(content: string, filePath: string): MiddlewareInfo[] {
    const hooks: MiddlewareInfo[] = [];
    const hookPattern = /\.addHook\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;
    
    let match;
    while ((match = hookPattern.exec(content)) !== null) {
      hooks.push({
        name: match[2].trim(),
        type: this.mapFastifyHookType(match[1]),
        file: filePath,
        lineStart: content.substring(0, match.index).split('\n').length,
        description: `Fastify hook: ${match[1]}`,
        global: true
      });
    }

    return hooks;
  }

  private mapFastifyHookType(hookName: string): MiddlewareInfo['type'] {
    const hookTypeMap: Record<string, MiddlewareInfo['type']> = {
      'onRequest': 'authentication',
      'onResponse': 'logging',
      'onError': 'error-handling',
      'preValidation': 'validation',
      'preHandler': 'authorization'
    };
    
    return hookTypeMap[hookName] || 'other';
  }

  private extractFastifyConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    const config: ConfigurationInfo[] = [];
    
    if (content.includes('fastify(')) {
      const configMatch = content.match(/fastify\(([\s\S]*?)\)/);
      if (configMatch) {
        config.push({
          type: 'other',
          file: filePath,
          settings: { fastifyOptions: configMatch[1] },
          sensitive: false
        });
      }
    }

    return config;
  }

  private extractKoaMiddleware(content: string, filePath: string): MiddlewareInfo[] {
    const middleware: MiddlewareInfo[] = [];
    const middlewarePattern = /\.use\(\s*([^)]+)\s*\)/g;
    
    let match;
    while ((match = middlewarePattern.exec(content)) !== null) {
      const name = match[1].trim();
      let type: MiddlewareInfo['type'] = 'other';
      
      if (name.includes('cors')) type = 'cors';
      else if (name.includes('auth')) type = 'authentication';
      else if (name.includes('log')) type = 'logging';
      else if (name.includes('error')) type = 'error-handling';

      middleware.push({
        name,
        type,
        file: filePath,
        lineStart: content.substring(0, match.index).split('\n').length,
        description: `Koa middleware: ${name}`,
        global: true
      });
    }

    return middleware;
  }

  private extractKoaRoutes(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const routes: RouteInfo[] = [];
    const routePattern = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,?\s*(.*)?\)/g;
    
    let match;
    while ((match = routePattern.exec(content)) !== null) {
      routes.push({
        path: match[2],
        method: match[1].toUpperCase(),
        handler: match[3] || 'anonymous',
        file: filePath,
        middleware: []
      });
    }

    return routes;
  }

  private extractKoaConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    return []; // Basic implementation - can be expanded
  }

  private extractGraphQLResolvers(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const resolvers: RouteInfo[] = [];
    
    // Extract Query and Mutation resolvers
    const resolverPattern = /(\w+)\s*:\s*(async\s+)?\([^)]*\)\s*=>/g;
    let match;
    
    while ((match = resolverPattern.exec(content)) !== null) {
      resolvers.push({
        path: `/graphql/${match[1]}`,
        method: 'POST', // GraphQL typically uses POST
        handler: match[1],
        file: filePath,
        middleware: []
      });
    }

    return resolvers;
  }

  private extractGraphQLConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    const config: ConfigurationInfo[] = [];
    
    if (content.includes('ApolloServer')) {
      const configMatch = content.match(/new ApolloServer\(([\s\S]*?)\)/);
      if (configMatch) {
        config.push({
          type: 'other',
          file: filePath,
          settings: { apolloServerConfig: configMatch[1] },
          sensitive: false
        });
      }
    }

    return config;
  }

  private extractSocketIOEvents(content: string, filePath: string, parseResult: ParseResult): RouteInfo[] {
    const events: RouteInfo[] = [];
    const eventPattern = /\.on\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*([^)]+)\)/g;
    
    let match;
    while ((match = eventPattern.exec(content)) !== null) {
      events.push({
        path: `/socket/${match[1]}`,
        method: 'SOCKET',
        handler: match[2].trim(),
        file: filePath,
        middleware: []
      });
    }

    return events;
  }

  private extractSocketIOMiddleware(content: string, filePath: string): MiddlewareInfo[] {
    const middleware: MiddlewareInfo[] = [];
    
    if (content.includes('.use(')) {
      const middlewarePattern = /\.use\s*\(\s*([^)]+)\s*\)/g;
      let match;
      
      while ((match = middlewarePattern.exec(content)) !== null) {
        middleware.push({
          name: match[1].trim(),
          type: 'other',
          file: filePath,
          lineStart: content.substring(0, match.index).split('\n').length,
          description: `Socket.IO middleware: ${match[1].trim()}`,
          global: true
        });
      }
    }

    return middleware;
  }

  private extractSocketIOConfiguration(content: string, filePath: string): ConfigurationInfo[] {
    return []; // Basic implementation - can be expanded
  }

  private mergeFrameworkInfo(map: Map<string, ServerFrameworkInfo>, framework: string, partial: Partial<ServerFrameworkInfo>): void {
    const existing = map.get(framework);
    if (existing) {
      existing.files.push(...(partial.files || []));
      existing.middleware.push(...(partial.middleware || []));
      existing.routes.push(...(partial.routes || []));
      if (partial.plugins) {
        existing.plugins = (existing.plugins || []).concat(partial.plugins);
      }
      if (partial.decorators) {
        existing.decorators = (existing.decorators || []).concat(partial.decorators);
      }
      existing.configuration.push(...(partial.configuration || []));
    } else {
      map.set(framework, {
        framework: framework as any,
        files: partial.files || [],
        middleware: partial.middleware || [],
        routes: partial.routes || [],
        plugins: partial.plugins,
        decorators: partial.decorators,
        configuration: partial.configuration || []
      });
    }
  }

  private analyzeApiArchitecture(endpoints: EndpointInfo[]): ApiArchitectureInfo {
    return {
      restfulDesign: this.analyzeRestfulDesign(endpoints),
      apiVersioning: this.analyzeApiVersioning(endpoints),
      documentation: this.analyzeApiDocumentation(),
      rateLimiting: this.analyzeRateLimiting(),
      caching: this.analyzeCaching(),
      cors: this.analyzeCors(),
      contentNegotiation: this.analyzeContentNegotiation(),
      pagination: this.analyzePagination(endpoints)
    };
  }

  private analyzeRestfulDesign(endpoints: EndpointInfo[]): RestfulDesignInfo {
    let totalScore = 0;
    const violations: Array<{endpoint: string; issue: string; suggestion: string}> = [];
    const resourceNaming: Array<{resource: string; endpoints: string[]; score: number}> = [];
    const httpMethodUsage: Record<string, {count: number; appropriate: boolean}> = {};

    // Analyze each endpoint for RESTful compliance
    for (const endpoint of endpoints) {
      let endpointScore = 0;
      const fullEndpoint = `${endpoint.method} ${endpoint.path}`;

      // Check HTTP method usage
      httpMethodUsage[endpoint.method] = httpMethodUsage[endpoint.method] || {count: 0, appropriate: true};
      httpMethodUsage[endpoint.method].count++;

      // Check for RESTful patterns
      if (this.isRestfulPath(endpoint.path)) endpointScore += 2;
      if (this.hasAppropriateMethod(endpoint.method, endpoint.path)) endpointScore += 2;
      else {
        violations.push({
          endpoint: fullEndpoint,
          issue: 'HTTP method not appropriate for endpoint',
          suggestion: this.suggestAppropriateMethod(endpoint.path)
        });
      }

      totalScore += endpointScore;
    }

    return {
      adherenceScore: endpoints.length > 0 ? Math.round((totalScore / (endpoints.length * 4)) * 100) : 0,
      violations,
      resourceNaming,
      httpMethodUsage
    };
  }

  private isRestfulPath(path: string): boolean {
    // RESTful paths should be noun-based, use plural forms, and follow /resource/{id}/subresource pattern
    const restfulPatterns = [
      /^\/[a-z]+s(\/\{[^}]+\})?(\/[a-z]+s?)?(\/\{[^}]+\})?$/i, // /users/{id}/posts/{postId}
      /^\/api\/v\d+\/[a-z]+s/i // /api/v1/users
    ];
    
    return restfulPatterns.some(pattern => pattern.test(path));
  }

  private hasAppropriateMethod(method: string, path: string): boolean {
    // Basic heuristics for method appropriateness
    if (method === 'GET' && !path.includes('create') && !path.includes('delete')) return true;
    if (method === 'POST' && (path.includes('create') || !path.includes('{') || path.endsWith('s'))) return true;
    if (method === 'PUT' && path.includes('{')) return true;
    if (method === 'DELETE' && path.includes('{')) return true;
    if (method === 'PATCH' && path.includes('{')) return true;
    
    return false;
  }

  private suggestAppropriateMethod(path: string): string {
    if (path.includes('{') && !path.includes('create')) return 'Consider GET, PUT, PATCH, or DELETE';
    if (path.endsWith('s') || path.includes('create')) return 'Consider POST for creation or GET for listing';
    return 'Review HTTP method selection';
  }

  private analyzeApiVersioning(endpoints: EndpointInfo[]): ApiVersioningInfo {
    const versions = new Set<string>();
    let strategy: ApiVersioningInfo['strategy'] = 'none';
    const implementation: Array<{version: string; files: string[]}> = [];

    for (const endpoint of endpoints) {
      // Check for URL path versioning
      const pathVersionMatch = endpoint.path.match(/\/v(\d+(?:\.\d+)?)\//);
      if (pathVersionMatch) {
        strategy = 'url-path';
        versions.add(pathVersionMatch[1]);
      }
    }

    return {
      strategy,
      versions: Array.from(versions),
      implementation,
      deprecations: []
    };
  }

  private analyzeApiDocumentation(): ApiDocumentationInfo {
    let type: ApiDocumentationInfo['type'] = 'none';
    const files: string[] = [];

    // Check for documentation files
    for (const [filePath] of Object.entries(this.parserResults)) {
      if (filePath.includes('swagger') || filePath.includes('openapi')) {
        type = 'openapi';
        files.push(filePath);
      }
    }

    return {
      type,
      files,
      coverage: 0, // Would need more analysis to calculate
      endpoints: [],
      schemas: []
    };
  }

  private analyzeRateLimiting(): RateLimitingInfo {
    let enabled = false;
    const files: string[] = [];
    let strategy = '';

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('rate-limit') || fileContent.includes('rateLimit') || 
          fileContent.includes('express-rate-limit')) {
        enabled = true;
        files.push(filePath);
        strategy = 'express-rate-limit';
      }
    }

    return {
      enabled,
      strategy,
      files,
      configuration: [],
      storage: enabled ? 'memory' : ''
    };
  }

  private analyzeCaching(): CachingInfo {
    const layers: any[] = [];
    const strategies: string[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('redis')) {
        layers.push({
          type: 'redis',
          implementation: 'Redis',
          files: [filePath],
          configuration: {}
        });
      }

      if (fileContent.includes('cache')) {
        strategies.push('caching');
      }
    }

    return {
      layers,
      strategies,
      invalidation: [],
      ttl: []
    };
  }

  private analyzeCors(): CorsInfo {
    let enabled = false;
    const files: string[] = [];
    const configuration = {
      origins: [] as string[],
      methods: [] as string[],
      headers: [] as string[],
      credentials: false
    };

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('cors')) {
        enabled = true;
        files.push(filePath);
      }
    }

    return {
      enabled,
      configuration,
      files
    };
  }

  private analyzeContentNegotiation(): ContentNegotiationInfo {
    return {
      supported: ['application/json'],
      defaultFormat: 'application/json',
      compression: false,
      serialization: ['JSON']
    };
  }

  private analyzePagination(endpoints: EndpointInfo[]): PaginationInfo {
    let strategy: PaginationInfo['strategy'] = 'none';
    const implementation: Array<{endpoint: string; method: string}> = [];

    for (const endpoint of endpoints) {
      if (endpoint.path.includes('page') || endpoint.path.includes('offset')) {
        strategy = endpoint.path.includes('page') ? 'page' : 'offset';
        implementation.push({
          endpoint: endpoint.path,
          method: strategy
        });
      }
    }

    return {
      strategy,
      implementation,
      metadata: false
    };
  }

  private analyzeSecurityPatterns(): SecurityAnalysisInfo {
    return {
      authentication: this.analyzeAuthenticationSecurity(),
      authorization: this.analyzeAuthorizationPatterns(),
      inputValidation: this.analyzeInputValidation(),
      outputSanitization: this.analyzeOutputSanitization(),
      secretManagement: this.analyzeSecretManagement(),
      securityHeaders: this.analyzeSecurityHeaders(),
      encryption: this.analyzeEncryption(),
      vulnerabilities: this.identifyVulnerabilities()
    };
  }

  private analyzeAuthenticationSecurity(): any {
    // Enhanced authentication analysis
    return {
      type: 'jwt',
      strength: 'moderate',
      tokenStorage: 'localStorage',
      sessionSecurity: {
        secure: false,
        httpOnly: false,
        sameSite: 'none',
        expiration: '24h',
        regeneration: false
      },
      multiFactorAuth: false
    };
  }

  private analyzeAuthorizationPatterns(): AuthorizationInfo {
    return {
      model: 'none',
      implementation: [],
      roles: [],
      permissions: [],
      enforcement: []
    };
  }

  private analyzeInputValidation(): InputValidationInfo {
    const frameworks: string[] = [];
    let coverage = 0;

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('joi')) frameworks.push('Joi');
      if (fileContent.includes('yup')) frameworks.push('Yup');
      if (fileContent.includes('zod')) frameworks.push('Zod');
      if (fileContent.includes('@IsString') || fileContent.includes('class-validator')) {
        frameworks.push('class-validator');
      }
    }

    return {
      frameworks: [...new Set(frameworks)],
      coverage,
      validatedEndpoints: [],
      vulnerabilities: []
    };
  }

  private analyzeOutputSanitization(): OutputSanitizationInfo {
    let enabled = false;
    const libraries: string[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('sanitize') || fileContent.includes('escape')) {
        enabled = true;
        libraries.push('sanitization');
      }
    }

    return {
      enabled,
      libraries,
      xssProtection: enabled,
      htmlEncoding: enabled,
      jsonSerialization: true
    };
  }

  private analyzeSecretManagement(): any {
    let strategy = 'env-vars';
    const files: string[] = [];
    const secrets: Array<{type: string; secure: boolean; location: string}> = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for hardcoded secrets (potential vulnerability)
      if (fileContent.includes('password') && fileContent.includes('=')) {
        secrets.push({
          type: 'password',
          secure: false,
          location: filePath
        });
      }

      if (fileContent.includes('process.env')) {
        files.push(filePath);
      }
    }

    return {
      strategy,
      files,
      secrets,
      rotation: false,
      encryption: false
    };
  }

  private analyzeSecurityHeaders(): any {
    return {
      implemented: [],
      missing: ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options'],
      configuration: {},
      score: 0
    };
  }

  private analyzeEncryption(): any {
    return {
      inTransit: {enabled: false, protocols: [], certificates: []},
      atRest: {enabled: false, algorithms: [], keyManagement: ''},
      application: {hashing: [], encryption: [], signing: []}
    };
  }

  private identifyVulnerabilities(): VulnerabilityInfo[] {
    const vulnerabilities: VulnerabilityInfo[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for common vulnerabilities
      if (fileContent.includes('eval(')) {
        vulnerabilities.push({
          type: 'Code Injection',
          description: 'Use of eval() function can lead to code injection',
          severity: 'high',
          affected: [filePath],
          remediation: 'Avoid using eval(), use safer alternatives like JSON.parse() for data parsing',
          cwe: 'CWE-94'
        });
      }

      if (fileContent.includes('innerHTML') && !fileContent.includes('sanitiz')) {
        vulnerabilities.push({
          type: 'XSS',
          description: 'innerHTML usage without sanitization',
          severity: 'medium',
          affected: [filePath],
          remediation: 'Sanitize user input before setting innerHTML or use textContent instead'
        });
      }
    }

    return vulnerabilities;
  }

  private analyzePerformancePatterns(): PerformancePatternInfo[] {
    const patterns: PerformancePatternInfo[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Async patterns
      if (fileContent.includes('async') && fileContent.includes('await')) {
        patterns.push({
          type: 'async-pattern',
          description: 'Async/await pattern for non-blocking operations',
          implementation: 'async/await',
          files: [filePath],
          benefits: ['Non-blocking operations', 'Better error handling', 'Improved readability']
        });
      }

      // Caching patterns
      if (fileContent.includes('cache') || fileContent.includes('redis')) {
        patterns.push({
          type: 'caching',
          description: 'Caching implementation for performance optimization',
          implementation: 'Redis/Memory cache',
          files: [filePath],
          benefits: ['Reduced database load', 'Faster response times', 'Better scalability']
        });
      }

      // Background job patterns
      if (fileContent.includes('queue') || fileContent.includes('job') || fileContent.includes('worker')) {
        patterns.push({
          type: 'background-job',
          description: 'Background job processing for long-running tasks',
          implementation: 'Job queue system',
          files: [filePath],
          benefits: ['Non-blocking user experience', 'Better resource utilization', 'Improved reliability']
        });
      }
    }

    return patterns;
  }

  private analyzeInfrastructurePatterns(): InfrastructurePatternInfo[] {
    const patterns: InfrastructurePatternInfo[] = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Docker containerization
      if (filePath.includes('Dockerfile') || filePath.includes('docker-compose')) {
        patterns.push({
          type: 'containerization',
          technology: 'Docker',
          files: [filePath],
          configuration: {},
          purpose: 'Application containerization for consistent deployment',
          scalability: 'high'
        });
      }

      // Kubernetes orchestration
      if (filePath.includes('k8s') || filePath.includes('kubernetes') || fileContent.includes('apiVersion: apps/v1')) {
        patterns.push({
          type: 'orchestration',
          technology: 'Kubernetes',
          files: [filePath],
          configuration: {},
          purpose: 'Container orchestration and scaling',
          scalability: 'high'
        });
      }

      // Logging patterns
      if (fileContent.includes('winston') || fileContent.includes('pino') || fileContent.includes('console.log')) {
        patterns.push({
          type: 'logging',
          technology: 'Application logging',
          files: [filePath],
          configuration: {},
          purpose: 'Application monitoring and debugging',
          scalability: 'medium'
        });
      }
    }

    return patterns;
  }
}