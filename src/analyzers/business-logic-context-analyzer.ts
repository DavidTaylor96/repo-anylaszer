import * as fs from 'fs';
import { 
  FileInfo, 
  ParseResult, 
  BusinessLogicContextAnalysis, 
  DomainInfo, 
  WorkflowInfo, 
  BusinessRuleInfo, 
  DataModelInfo, 
  IntegrationInfo,
  WorkflowStepInfo
} from '../types';

export class BusinessLogicContextAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): BusinessLogicContextAnalysis {
    const domains = this.identifyDomains();
    const workflows = this.analyzeWorkflows();
    const businessRules = this.extractBusinessRules();
    const dataModels = this.analyzeDataModels();
    const integrations = this.identifyIntegrations();

    return {
      domains,
      workflows,
      businessRules,
      dataModels,
      integrations
    };
  }

  private identifyDomains(): DomainInfo[] {
    const domains: DomainInfo[] = [];

    // Analyze directory structure for domain boundaries
    const domainPatterns = this.analyzeDomainPatterns();
    
    // Extract domains from file organization
    const fileBasedDomains = this.extractFileBasedDomains();
    
    // Merge and deduplicate
    const allDomains = [...domainPatterns, ...fileBasedDomains];
    
    return this.consolidateDomains(allDomains);
  }

  private analyzeWorkflows(): WorkflowInfo[] {
    const workflows: WorkflowInfo[] = [];

    // Identify workflows from function call chains
    const functionWorkflows = this.extractFunctionWorkflows();
    workflows.push(...functionWorkflows);

    // Identify workflows from API endpoints
    const apiWorkflows = this.extractApiWorkflows();
    workflows.push(...apiWorkflows);

    // Identify workflows from component interactions
    const componentWorkflows = this.extractComponentWorkflows();
    workflows.push(...componentWorkflows);

    return workflows;
  }

  private extractBusinessRules(): BusinessRuleInfo[] {
    const businessRules: BusinessRuleInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Extract validation rules
      const validationRules = this.extractValidationRules(filePath, fileContent);
      businessRules.push(...validationRules);

      // Extract calculation rules
      const calculationRules = this.extractCalculationRules(filePath, fileContent, parseResult);
      businessRules.push(...calculationRules);

      // Extract workflow rules
      const workflowRules = this.extractWorkflowRules(filePath, fileContent);
      businessRules.push(...workflowRules);

      // Extract authorization rules
      const authRules = this.extractAuthorizationRules(filePath, fileContent);
      businessRules.push(...authRules);
    }

    return businessRules;
  }

  private analyzeDataModels(): DataModelInfo[] {
    const dataModels: DataModelInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Extract from database schemas
      if (parseResult.databaseSchemas) {
        for (const schema of parseResult.databaseSchemas) {
          const model = this.convertSchemaToDataModel(schema, filePath);
          dataModels.push(model);
        }
      }

      // Extract from TypeScript interfaces
      if (parseResult.interfaces) {
        for (const iface of parseResult.interfaces) {
          if (this.isDataModel(iface.name)) {
            const model = this.convertInterfaceToDataModel(iface, filePath);
            dataModels.push(model);
          }
        }
      }

      // Extract from classes that represent data
      for (const cls of parseResult.classes) {
        if (this.isDataModelClass(cls.name)) {
          const model = this.convertClassToDataModel(cls, filePath);
          dataModels.push(model);
        }
      }
    }

    return dataModels;
  }

  private identifyIntegrations(): IntegrationInfo[] {
    const integrations: IntegrationInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // External API integrations
      const apiIntegrations = this.extractApiIntegrations(filePath, fileContent);
      integrations.push(...apiIntegrations);

      // Database integrations
      const dbIntegrations = this.extractDatabaseIntegrations(filePath, fileContent, parseResult);
      integrations.push(...dbIntegrations);

      // Message queue integrations
      const mqIntegrations = this.extractMessageQueueIntegrations(filePath, fileContent);
      integrations.push(...mqIntegrations);

      // File system integrations
      const fsIntegrations = this.extractFileSystemIntegrations(filePath, fileContent);
      integrations.push(...fsIntegrations);
    }

    return integrations;
  }

  private analyzeDomainPatterns(): DomainInfo[] {
    const domains: DomainInfo[] = [];
    const directoryStructure = this.analyzeDirectoryStructure();

    // Common domain indicators
    const domainKeywords = [
      'user', 'auth', 'payment', 'order', 'product', 'inventory', 
      'billing', 'customer', 'account', 'notification', 'report',
      'admin', 'dashboard', 'api', 'service', 'core', 'shared'
    ];

    for (const keyword of domainKeywords) {
      const domainFiles = this.fileData.filter(f => 
        f.path.toLowerCase().includes(keyword) ||
        f.path.toLowerCase().includes(`${keyword}s`) // plural form
      );

      if (domainFiles.length >= 2) { // Minimum threshold for a domain
        const entities = this.extractDomainEntities(domainFiles, keyword);
        const services = this.extractDomainServices(domainFiles, keyword);
        const boundaries = this.extractDomainBoundaries(domainFiles, keyword);

        domains.push({
          name: this.capitalizeDomain(keyword),
          description: this.generateDomainDescription(keyword, entities, services),
          files: domainFiles.map(f => f.path),
          entities,
          services,
          boundaries
        });
      }
    }

    return domains;
  }

  private extractFileBasedDomains(): DomainInfo[] {
    const domains: DomainInfo[] = [];
    const groupedFiles = this.groupFilesByDomain();

    for (const [domainName, files] of Object.entries(groupedFiles)) {
      if (files.length >= 3) { // Minimum threshold
        const entities = this.extractEntitiesFromFiles(files);
        const services = this.extractServicesFromFiles(files);
        const boundaries = this.extractBoundariesFromFiles(files);

        domains.push({
          name: domainName,
          description: `Domain identified from file organization: ${domainName}`,
          files: files.map(f => f.path),
          entities,
          services,
          boundaries
        });
      }
    }

    return domains;
  }

  private extractFunctionWorkflows(): WorkflowInfo[] {
    const workflows: WorkflowInfo[] = [];

    // Look for function chains that represent workflows
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        if (this.isWorkflowFunction(func.name)) {
          const workflow = this.analyzeWorkflowFunction(func, filePath, parseResult);
          if (workflow) {
            workflows.push(workflow);
          }
        }
      }
    }

    return workflows;
  }

  private extractApiWorkflows(): WorkflowInfo[] {
    const workflows: WorkflowInfo[] = [];

    // Analyze API endpoints to identify workflows
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      const apiEndpoints = this.extractApiEndpoints(fileContent);
      for (const endpoint of apiEndpoints) {
        const workflow = this.analyzeApiWorkflow(endpoint, filePath, fileContent);
        if (workflow) {
          workflows.push(workflow);
        }
      }
    }

    return workflows;
  }

  private extractComponentWorkflows(): WorkflowInfo[] {
    const workflows: WorkflowInfo[] = [];

    // Analyze React component interactions
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (parseResult.components) {
        for (const component of parseResult.components) {
          const workflow = this.analyzeComponentWorkflow(component, filePath);
          if (workflow) {
            workflows.push(workflow);
          }
        }
      }
    }

    return workflows;
  }

  private extractValidationRules(filePath: string, fileContent: string): BusinessRuleInfo[] {
    const rules: BusinessRuleInfo[] = [];
    const lines = fileContent.split('\n');

    // Look for validation patterns
    const validationPatterns = [
      { pattern: /required|mandatory/i, type: 'validation' as const },
      { pattern: /min|max|length/i, type: 'validation' as const },
      { pattern: /email|phone|url/i, type: 'validation' as const },
      { pattern: /validate|check|verify/i, type: 'validation' as const }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, type } of validationPatterns) {
        if (pattern.test(line)) {
          rules.push({
            rule: line.trim(),
            location: { file: filePath, line: i + 1 },
            type,
            impact: 'Ensures data integrity and user input validation'
          });
        }
      }
    }

    return rules;
  }

  private extractCalculationRules(filePath: string, fileContent: string, parseResult: ParseResult): BusinessRuleInfo[] {
    const rules: BusinessRuleInfo[] = [];

    // Look for calculation functions
    for (const func of parseResult.functions) {
      if (this.isCalculationFunction(func.name)) {
        const fileLines = fileContent.split('\n');
        const funcContent = fileLines.slice(func.lineStart - 1, func.lineEnd).join('\n');
        
        rules.push({
          rule: `Calculation: ${func.name}`,
          location: { file: filePath, line: func.lineStart },
          type: 'calculation',
          impact: `Performs business calculation: ${this.inferCalculationPurpose(func.name, funcContent)}`
        });
      }
    }

    return rules;
  }

  private extractWorkflowRules(filePath: string, fileContent: string): BusinessRuleInfo[] {
    const rules: BusinessRuleInfo[] = [];
    const lines = fileContent.split('\n');

    // Look for workflow control patterns
    const workflowPatterns = [
      { pattern: /if.*status|state/i, type: 'workflow' as const },
      { pattern: /switch.*case/i, type: 'workflow' as const },
      { pattern: /approve|reject|submit/i, type: 'workflow' as const },
      { pattern: /transition|flow|step/i, type: 'workflow' as const }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, type } of workflowPatterns) {
        if (pattern.test(line)) {
          rules.push({
            rule: line.trim(),
            location: { file: filePath, line: i + 1 },
            type,
            impact: 'Controls business process flow and state transitions'
          });
        }
      }
    }

    return rules;
  }

  private extractAuthorizationRules(filePath: string, fileContent: string): BusinessRuleInfo[] {
    const rules: BusinessRuleInfo[] = [];
    const lines = fileContent.split('\n');

    // Look for authorization patterns
    const authPatterns = [
      { pattern: /role|permission|access/i, type: 'authorization' as const },
      { pattern: /canAccess|isAuthorized|hasPermission/i, type: 'authorization' as const },
      { pattern: /admin|owner|user.*check/i, type: 'authorization' as const }
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { pattern, type } of authPatterns) {
        if (pattern.test(line)) {
          rules.push({
            rule: line.trim(),
            location: { file: filePath, line: i + 1 },
            type,
            impact: 'Controls access and permissions within the system'
          });
        }
      }
    }

    return rules;
  }

  private convertSchemaToDataModel(schema: any, filePath: string): DataModelInfo {
    return {
      entity: schema.name,
      fields: schema.fields.map((field: any) => ({
        name: field.name,
        type: field.type,
        constraints: field.constraints || []
      })),
      relationships: schema.relationships.map((rel: any) => ({
        type: rel.type,
        target: rel.target
      })),
      operations: this.inferOperationsFromSchema(schema)
    };
  }

  private convertInterfaceToDataModel(iface: any, filePath: string): DataModelInfo {
    return {
      entity: iface.name,
      fields: iface.properties.map((prop: any) => ({
        name: prop.name,
        type: prop.type,
        constraints: prop.optional ? [] : ['required']
      })),
      relationships: this.inferRelationshipsFromInterface(iface),
      operations: this.inferOperationsFromInterface(iface)
    };
  }

  private convertClassToDataModel(cls: any, filePath: string): DataModelInfo {
    return {
      entity: cls.name,
      fields: cls.properties.map((prop: any) => ({
        name: prop.name,
        type: prop.type || 'unknown',
        constraints: prop.isReadonly ? ['readonly'] : []
      })),
      relationships: this.inferRelationshipsFromClass(cls),
      operations: cls.methods.map((method: any) => method.name)
    };
  }

  private extractApiIntegrations(filePath: string, fileContent: string): IntegrationInfo[] {
    const integrations: IntegrationInfo[] = [];

    // Look for external API calls
    const apiPatterns = [
      /fetch\(['"`]https?:\/\/([^'"`\/]+)/g,
      /axios\.[get|post|put|delete]+\(['"`]https?:\/\/([^'"`\/]+)/g,
      /http\.[get|post|put|delete]+\(['"`]https?:\/\/([^'"`\/]+)/g
    ];

    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(fileContent)) !== null) {
        const serviceName = this.extractServiceName(match[1]);
        integrations.push({
          service: serviceName,
          type: 'external-api',
          files: [filePath],
          endpoints: [match[0]]
        });
      }
    }

    return integrations;
  }

  private extractDatabaseIntegrations(filePath: string, fileContent: string, parseResult: ParseResult): IntegrationInfo[] {
    const integrations: IntegrationInfo[] = [];

    // Look for database patterns
    const dbPatterns = [
      { pattern: /prisma|typeorm|sequelize|mongoose/i, name: 'ORM' },
      { pattern: /sql|query|database/i, name: 'Database' },
      { pattern: /connection|pool|client/i, name: 'Database Connection' }
    ];

    for (const { pattern, name } of dbPatterns) {
      if (pattern.test(fileContent)) {
        const schemas = parseResult.databaseSchemas?.map(s => s.name) || [];
        integrations.push({
          service: name,
          type: 'database',
          files: [filePath],
          schemas
        });
      }
    }

    return integrations;
  }

  private extractMessageQueueIntegrations(filePath: string, fileContent: string): IntegrationInfo[] {
    const integrations: IntegrationInfo[] = [];

    // Look for message queue patterns
    const mqPatterns = [
      { pattern: /kafka|rabbitmq|sqs|pubsub/i, name: 'Message Queue' },
      { pattern: /publish|subscribe|emit|listen/i, name: 'Event System' }
    ];

    for (const { pattern, name } of mqPatterns) {
      if (pattern.test(fileContent)) {
        integrations.push({
          service: name,
          type: 'message-queue',
          files: [filePath]
        });
      }
    }

    return integrations;
  }

  private extractFileSystemIntegrations(filePath: string, fileContent: string): IntegrationInfo[] {
    const integrations: IntegrationInfo[] = [];

    // Look for file system operations
    if (/fs\.|readFile|writeFile|mkdir|rmdir/i.test(fileContent)) {
      integrations.push({
        service: 'File System',
        type: 'file-system',
        files: [filePath]
      });
    }

    return integrations;
  }

  // Helper methods

  private analyzeDirectoryStructure(): Record<string, string[]> {
    const structure: Record<string, string[]> = {};
    
    for (const file of this.fileData) {
      const pathParts = file.path.split('/');
      const directory = pathParts.slice(0, -1).join('/');
      
      if (!structure[directory]) {
        structure[directory] = [];
      }
      structure[directory].push(file.path);
    }

    return structure;
  }

  private groupFilesByDomain(): Record<string, FileInfo[]> {
    const groups: Record<string, FileInfo[]> = {};

    for (const file of this.fileData) {
      const pathParts = file.path.split('/');
      
      // Look for domain indicators in path
      for (const part of pathParts) {
        if (this.isDomainDirectory(part)) {
          if (!groups[part]) {
            groups[part] = [];
          }
          groups[part].push(file);
          break;
        }
      }
    }

    return groups;
  }

  private isDomainDirectory(dirName: string): boolean {
    const domainIndicators = [
      'components', 'pages', 'services', 'models', 'controllers',
      'views', 'api', 'routes', 'handlers', 'utils', 'core'
    ];
    
    return domainIndicators.includes(dirName.toLowerCase()) ||
           dirName.length > 3 && !['src', 'lib', 'test', 'spec'].includes(dirName.toLowerCase());
  }

  private extractDomainEntities(files: FileInfo[], domain: string): string[] {
    const entities: string[] = [];

    for (const file of files) {
      const parseResult = this.parserResults[file.path];
      if (!parseResult) continue;

      // Extract entities from classes and interfaces
      entities.push(...parseResult.classes.map(c => c.name));
      if (parseResult.interfaces) {
        entities.push(...parseResult.interfaces.map(i => i.name));
      }
      if (parseResult.databaseSchemas) {
        entities.push(...parseResult.databaseSchemas.map(s => s.name));
      }
    }

    return [...new Set(entities)];
  }

  private extractDomainServices(files: FileInfo[], domain: string): string[] {
    const services: string[] = [];

    for (const file of files) {
      if (file.path.toLowerCase().includes('service') ||
          file.path.toLowerCase().includes('api') ||
          file.path.toLowerCase().includes('handler')) {
        services.push(file.path);
      }
    }

    return services;
  }

  private extractDomainBoundaries(files: FileInfo[], domain: string): string[] {
    const boundaries: string[] = [];

    // Domain boundaries are typically directories or modules
    const directories = new Set(files.map(f => {
      const parts = f.path.split('/');
      return parts.slice(0, -1).join('/');
    }));

    return Array.from(directories);
  }

  private consolidateDomains(domains: DomainInfo[]): DomainInfo[] {
    // Remove duplicates and merge similar domains
    const consolidated: Record<string, DomainInfo> = {};

    for (const domain of domains) {
      const key = domain.name.toLowerCase();
      if (consolidated[key]) {
        // Merge
        consolidated[key].files.push(...domain.files);
        consolidated[key].entities.push(...domain.entities);
        consolidated[key].services.push(...domain.services);
        consolidated[key].boundaries.push(...domain.boundaries);
      } else {
        consolidated[key] = domain;
      }
    }

    // Deduplicate arrays
    for (const domain of Object.values(consolidated)) {
      domain.files = [...new Set(domain.files)];
      domain.entities = [...new Set(domain.entities)];
      domain.services = [...new Set(domain.services)];
      domain.boundaries = [...new Set(domain.boundaries)];
    }

    return Object.values(consolidated);
  }

  private isWorkflowFunction(functionName: string): boolean {
    const workflowKeywords = [
      'process', 'handle', 'execute', 'run', 'perform', 'create', 'update',
      'submit', 'approve', 'reject', 'complete', 'finish', 'start', 'initialize'
    ];

    const lowerName = functionName.toLowerCase();
    return workflowKeywords.some(keyword => lowerName.includes(keyword));
  }

  private analyzeWorkflowFunction(func: any, filePath: string, parseResult: ParseResult): WorkflowInfo | null {
    const fileContent = this.getFileContent(filePath);
    if (!fileContent) return null;

    const lines = fileContent.split('\n');
    const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');

    // Extract workflow steps from function content
    const steps = this.extractWorkflowSteps(funcContent, filePath);
    if (steps.length === 0) return null;

    return {
      name: func.name,
      steps,
      entry: filePath,
      exit: [filePath], // Simple assumption
      dataFlow: this.extractDataFlow(funcContent),
      errorPaths: this.extractErrorPaths(funcContent)
    };
  }

  private extractWorkflowSteps(funcContent: string, filePath: string): WorkflowStepInfo[] {
    const steps: WorkflowStepInfo[] = [];
    const lines = funcContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for function calls that represent steps
      const functionCallPattern = /(\w+)\s*\(/;
      const match = line.match(functionCallPattern);
      
      if (match && this.isWorkflowStep(match[1])) {
        steps.push({
          step: match[1],
          component: match[1],
          file: filePath,
          dependencies: this.extractStepDependencies(line)
        });
      }
    }

    return steps;
  }

  private isWorkflowStep(functionName: string): boolean {
    const stepKeywords = [
      'validate', 'save', 'send', 'notify', 'calculate', 'transform',
      'create', 'update', 'delete', 'fetch', 'process', 'handle'
    ];

    const lowerName = functionName.toLowerCase();
    return stepKeywords.some(keyword => lowerName.includes(keyword));
  }

  private extractStepDependencies(line: string): string[] {
    const dependencies: string[] = [];
    
    // Extract variable references
    const varPattern = /\b(\w+)\./g;
    let match;
    while ((match = varPattern.exec(line)) !== null) {
      dependencies.push(match[1]);
    }

    return [...new Set(dependencies)];
  }

  private extractDataFlow(funcContent: string): string[] {
    const dataFlow: string[] = [];
    
    // Look for data passing patterns
    const dataPatterns = [
      /const\s+(\w+)\s*=.*\.(\w+)/g,
      /(\w+)\.(\w+)\s*\(/g,
      /return\s+(\w+)/g
    ];

    for (const pattern of dataPatterns) {
      let match;
      while ((match = pattern.exec(funcContent)) !== null) {
        dataFlow.push(match[1]);
      }
    }

    return [...new Set(dataFlow)];
  }

  private extractErrorPaths(funcContent: string): string[] {
    const errorPaths: string[] = [];
    
    // Look for error handling
    const errorPatterns = [
      /catch\s*\(\s*(\w+)/g,
      /throw\s+new\s+(\w+)/g,
      /if.*error/g
    ];

    for (const pattern of errorPatterns) {
      let match;
      while ((match = pattern.exec(funcContent)) !== null) {
        errorPaths.push(match[0]);
      }
    }

    return errorPaths;
  }

  private extractApiEndpoints(fileContent: string): Array<{method: string; path: string; handler: string}> {
    const endpoints: Array<{method: string; path: string; handler: string}> = [];
    
    // Express.js patterns
    const expressPattern = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)/g;
    let match;
    while ((match = expressPattern.exec(fileContent)) !== null) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        handler: match[3]
      });
    }

    return endpoints;
  }

  private analyzeApiWorkflow(endpoint: {method: string; path: string; handler: string}, filePath: string, fileContent: string): WorkflowInfo | null {
    // Create workflow from API endpoint
    return {
      name: `${endpoint.method} ${endpoint.path}`,
      steps: [{
        step: endpoint.handler,
        component: endpoint.handler,
        file: filePath,
        dependencies: []
      }],
      entry: `${endpoint.method} ${endpoint.path}`,
      exit: ['response'],
      dataFlow: ['request', 'response'],
      errorPaths: ['error handling']
    };
  }

  private analyzeComponentWorkflow(component: any, filePath: string): WorkflowInfo | null {
    if (!component.name) return null;

    return {
      name: `${component.name} Component Workflow`,
      steps: [{
        step: 'render',
        component: component.name,
        file: filePath,
        dependencies: component.props?.map((p: any) => p.name) || []
      }],
      entry: 'component mount',
      exit: ['component unmount'],
      dataFlow: component.props?.map((p: any) => p.name) || [],
      errorPaths: ['error boundary']
    };
  }

  private isDataModel(name: string): boolean {
    const modelKeywords = [
      'model', 'entity', 'schema', 'dto', 'data', 'type',
      'user', 'order', 'product', 'customer', 'account'
    ];

    const lowerName = name.toLowerCase();
    return modelKeywords.some(keyword => lowerName.includes(keyword));
  }

  private isDataModelClass(name: string): boolean {
    return this.isDataModel(name) || name.endsWith('Model') || name.endsWith('Entity');
  }

  private isCalculationFunction(name: string): boolean {
    const calculationKeywords = [
      'calculate', 'compute', 'sum', 'total', 'average', 'count',
      'tax', 'discount', 'price', 'cost', 'amount', 'fee'
    ];

    const lowerName = name.toLowerCase();
    return calculationKeywords.some(keyword => lowerName.includes(keyword));
  }

  private inferCalculationPurpose(name: string, content: string): string {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('tax')) return 'tax calculation';
    if (lowerName.includes('discount')) return 'discount calculation';
    if (lowerName.includes('total') || lowerName.includes('sum')) return 'total/sum calculation';
    if (lowerName.includes('price') || lowerName.includes('cost')) return 'pricing calculation';
    if (lowerName.includes('average')) return 'average calculation';
    
    return 'business calculation';
  }

  private inferOperationsFromSchema(schema: any): string[] {
    const operations = ['create', 'read', 'update', 'delete']; // Basic CRUD
    
    // Add specific operations based on schema
    if (schema.name.toLowerCase().includes('user')) {
      operations.push('authenticate', 'authorize');
    }
    if (schema.name.toLowerCase().includes('order')) {
      operations.push('process', 'fulfill', 'cancel');
    }
    
    return operations;
  }

  private inferRelationshipsFromInterface(iface: any): Array<{type: string; target: string}> {
    const relationships: Array<{type: string; target: string}> = [];
    
    for (const prop of iface.properties) {
      if (prop.type.endsWith('Id')) {
        relationships.push({
          type: 'belongsTo',
          target: prop.type.replace('Id', '')
        });
      }
      if (prop.type.endsWith('[]')) {
        relationships.push({
          type: 'hasMany',
          target: prop.type.replace('[]', '')
        });
      }
    }
    
    return relationships;
  }

  private inferOperationsFromInterface(iface: any): string[] {
    return iface.methods?.map((method: any) => method.name) || ['read'];
  }

  private inferRelationshipsFromClass(cls: any): Array<{type: string; target: string}> {
    const relationships: Array<{type: string; target: string}> = [];
    
    for (const prop of cls.properties) {
      if (prop.name.endsWith('Id')) {
        relationships.push({
          type: 'belongsTo',
          target: prop.name.replace('Id', '')
        });
      }
    }
    
    return relationships;
  }

  private extractServiceName(domain: string): string {
    // Extract service name from domain
    const parts = domain.split('.');
    return parts.length > 1 ? parts[0] : domain;
  }

  private capitalizeDomain(domain: string): string {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  private generateDomainDescription(keyword: string, entities: string[], services: string[]): string {
    return `${this.capitalizeDomain(keyword)} domain with ${entities.length} entities and ${services.length} services`;
  }

  private extractEntitiesFromFiles(files: FileInfo[]): string[] {
    const entities: string[] = [];
    
    for (const file of files) {
      const parseResult = this.parserResults[file.path];
      if (parseResult) {
        entities.push(...parseResult.classes.map(c => c.name));
        if (parseResult.interfaces) {
          entities.push(...parseResult.interfaces.map(i => i.name));
        }
      }
    }
    
    return [...new Set(entities)];
  }

  private extractServicesFromFiles(files: FileInfo[]): string[] {
    return files
      .filter(f => f.path.toLowerCase().includes('service'))
      .map(f => f.path);
  }

  private extractBoundariesFromFiles(files: FileInfo[]): string[] {
    const directories = new Set(files.map(f => {
      const parts = f.path.split('/');
      return parts.slice(0, -1).join('/');
    }));
    
    return Array.from(directories);
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