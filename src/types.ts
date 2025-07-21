export interface FileInfo {
  path: string;
  absolutePath: string;
  language?: string;
  size: number;
  extension: string;
}

export interface ParseResult {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: ImportInfo[];
  exports: ExportInfo[];
  constants: ConstantInfo[];
  interfaces?: InterfaceInfo[];
  typeAliases?: TypeAliasInfo[];
  components?: ComponentInfo[];
  databaseSchemas?: DatabaseSchemaInfo[];
  codePatterns?: CodePatternInfo[];
  embeddingChunks?: VectorEmbeddingInfo[];
}

export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
  isAsync: boolean;
  lineStart: number;
  lineEnd: number;
  docstring?: string;
  jsdoc?: JSDocInfo;
  complexity?: number;
  visibility?: 'public' | 'private' | 'protected';
  isStatic?: boolean;
  codeSnippet?: string;
  calledBy?: string[];
  calls?: string[];
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: PropertyInfo[];
  extends?: string;
  implements?: string[];
  lineStart: number;
  lineEnd: number;
  docstring?: string;
  jsdoc?: JSDocInfo;
  visibility?: 'public' | 'private' | 'protected';
  isAbstract?: boolean;
}

export interface ImportInfo {
  module: string;
  items: ImportItem[];
  isDefault: boolean;
  alias?: string;
  isTypeOnly?: boolean;
  lineNumber?: number;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'constant' | 'default';
}

export interface ConstantInfo {
  name: string;
  type?: string;
  value?: string;
  jsdoc?: JSDocInfo;
  isExported?: boolean;
  visibility?: 'public' | 'private' | 'protected';
  lineNumber?: number;
}

export interface StructureAnalysis {
  directoryStructure: DirectoryNode;
  filesByLanguage: Record<string, number>;
  totalFiles: number;
  totalLines: number;
}

export interface DirectoryNode {
  name: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  language?: string;
  size?: number;
}

export interface DependencyAnalysis {
  internalDependencies: DependencyMap;
  externalDependencies: ExternalDependency[];
  dependencyGraph: Record<string, string[]>;
}

export interface DependencyMap {
  [filePath: string]: string[];
}

export interface ExternalDependency {
  name: string;
  files: string[];
  type: 'npm' | 'pip' | 'other';
}

export interface ApiAnalysis {
  publicFunctions: FunctionInfo[];
  publicClasses: ClassInfo[];
  endpoints: EndpointInfo[];
  schemas?: ApiSchemaInfo[];
  authentication?: AuthenticationInfo[];
  errorHandlers?: ErrorHandlerInfo[];
  serverFrameworks?: ServerFrameworkInfo[];
  apiArchitecture?: ApiArchitectureInfo;
  security?: SecurityAnalysisInfo;
  performance?: PerformancePatternInfo[];
  infrastructure?: InfrastructurePatternInfo[];
}

export interface EndpointInfo {
  method: string;
  path: string;
  file: string;
  function: string;
  requestSchema?: string;
  responseSchema?: string;
}

export interface AnalysisResults {
  fileData: FileInfo[];
  parserResults: Record<string, ParseResult>;
  structureAnalysis?: StructureAnalysis;
  dependencyAnalysis?: DependencyAnalysis;
  apiAnalysis?: ApiAnalysis;
  stateAnalysis?: StateAnalysisInfo;
  databaseAnalysis?: DatabaseAnalysisInfo;
  codePatterns?: CodePatternsAnalysis;
  importExportGraph?: ImportExportGraph;
  vectorEmbeddings?: VectorEmbeddingInfo[];
  semanticRelationships?: SemanticRelationshipsAnalysis;
  implementationPatterns?: ImplementationPatternsAnalysis;
  businessLogicContext?: BusinessLogicContextAnalysis;
  qualityMetrics?: QualityMetricsAnalysis;
  developmentGuidance?: DevelopmentGuidanceAnalysis;
  architecturalInsights?: ArchitecturalInsightsAnalysis;
  technologyIntegration?: TechnologyIntegrationAnalysis;
  performanceAnalysis?: PerformanceAnalysisInfo;
  migrationPaths?: MigrationPathsAnalysis;
}

export interface DatabaseAnalysisInfo {
  schemas: DatabaseSchemaInfo[];
  migrations: MigrationInfo[];
  queries: QueryInfo[];
  ormFrameworks: string[];
  databaseConnections: ConnectionInfo[];
}

export interface MigrationInfo {
  name: string;
  file: string;
  timestamp?: string;
  operations: Array<{type: string, details: string}>;
}

export interface QueryInfo {
  content: string;
  type: 'select' | 'insert' | 'update' | 'delete' | 'raw';
  file: string;
  line: number;
  parameters?: string[];
}

export interface ConnectionInfo {
  type: string;
  host?: string;
  database?: string;
  file: string;
  isConfigFile?: boolean;
}

export interface CodePatternsAnalysis {
  patterns: CodePatternInfo[];
  metrics: {
    totalPatterns: number;
    patternsByType: Record<string, number>;
    filesCovered: number;
    adherenceScore: number;
  };
  suggestions: string[];
}

export type AnalysisFocus = 'all' | 'structure' | 'dependencies' | 'api' | 'database' | 'patterns' | 'vector';

export interface InterfaceInfo {
  name: string;
  properties: Array<{name: string, type: string, optional: boolean}>;
  methods: Array<{name: string, parameters: string[], returnType?: string}>;
  extends: string[];
  lineStart: number;
  lineEnd: number;
  docstring?: string;
}

export interface TypeAliasInfo {
  name: string;
  definition: string;
  lineStart: number;
  docstring?: string;
}

export interface ComponentInfo {
  name: string;
  props: Array<{name: string, type?: string, optional: boolean}>;
  hooks: string[];
  hasJSX: boolean;
  lineStart: number;
  lineEnd: number;
  docstring?: string;
  styling?: ComponentStylingInfo;
}

export interface ComponentStylingInfo {
  type: 'css-modules' | 'styled-components' | 'tailwind' | 'css-in-js' | 'scss' | 'inline-styles' | 'none';
  imports: string[];
  classNames: string[];
  styledComponents: string[];
  inlineStyles: Array<{element: string, properties: string[]}>;
}

export interface ApiSchemaInfo {
  name: string;
  type: 'interface' | 'typeAlias' | 'jsonSchema';
  properties?: Array<{name: string, type: string, optional: boolean}>;
  definition?: string;
  file: string;
  lineStart?: number;
  description?: string;
}

export interface AuthenticationInfo {
  type: 'jwt' | 'oauth' | 'apiKey' | 'session' | 'function' | 'constant';
  name: string;
  file: string;
  lineStart?: number;
  description: string;
  pattern: string;
}

export interface ErrorHandlerInfo {
  name: string;
  file: string;
  lineStart: number;
  lineEnd?: number;
  errorTypes: string[];
  isMiddleware: boolean;
  description: string;
}

export interface StateAnalysisInfo {
  stores: StateStoreInfo[];
  relationships: ComponentRelationship[];
  dataFlow: Array<{from: string, to: string, type: string, data: string[]}>;
  stateManagementPattern: string;
  summary: string;
}

export interface StateStoreInfo {
  name: string;
  type: 'zustand' | 'redux' | 'redux-slice' | 'context' | 'mobx' | 'recoil-atom' | 'recoil-selector';
  file: string;
  lineStart: number;
  state: string[];
  actions: string[];
  description: string;
}

export interface ComponentRelationship {
  type: 'parent-child' | 'sibling' | 'provider-consumer';
  parent: string;
  child: string;
  parentFile: string;
  childFile: string;
  dataFlow: string[];
  sharedState: string[];
}

// Enhanced types for better analysis
export interface ParameterInfo {
  name: string;
  type?: string;
  optional?: boolean;
  defaultValue?: string;
  destructured?: boolean;
}

export interface PropertyInfo {
  name: string;
  type?: string;
  visibility?: 'public' | 'private' | 'protected';
  isStatic?: boolean;
  isReadonly?: boolean;
  defaultValue?: string;
  jsdoc?: JSDocInfo;
}

export interface ImportItem {
  name: string;
  alias?: string;
  isType?: boolean;
}

export interface JSDocInfo {
  description?: string;
  params?: Array<{name: string, type?: string, description?: string}>;
  returns?: {type?: string, description?: string};
  throws?: string[];
  examples?: string[];
  deprecated?: boolean;
  since?: string;
  author?: string;
  tags?: Array<{tag: string, value?: string}>;
}

export interface DatabaseSchemaInfo {
  name: string;
  type: 'table' | 'model' | 'entity' | 'collection';
  fields: SchemaFieldInfo[];
  relationships: SchemaRelationshipInfo[];
  indexes: SchemaIndexInfo[];
  file: string;
  framework: 'prisma' | 'typeorm' | 'sequelize' | 'mongoose' | 'sqlalchemy' | 'other';
  lineStart?: number;
}

export interface SchemaFieldInfo {
  name: string;
  type: string;
  nullable?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  defaultValue?: string;
  constraints?: string[];
}

export interface SchemaRelationshipInfo {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  target: string;
  foreignKey?: string;
  joinColumn?: string;
}

export interface SchemaIndexInfo {
  fields: string[];
  unique?: boolean;
  name?: string;
}

export interface CodePatternInfo {
  pattern: string;
  type: 'architectural' | 'naming' | 'design' | 'anti-pattern' | 'styling' | 'framework' | 'data-fetching' | 'routing' | 'testing' | 'react-pattern' | 'build-tool' | 'messaging' | 'cloud-service' | 'infrastructure' | 'security' | 'configuration';
  description: string;
  files: string[];
  examples: Array<{file: string, line: number, code: string}>;
  severity?: 'info' | 'warning' | 'error';
  suggestion?: string;
}

export interface ImportExportGraph {
  nodes: Array<{id: string, label: string, type: 'file' | 'function' | 'class' | 'constant'}>;
  edges: Array<{from: string, to: string, type: 'imports' | 'exports' | 'extends' | 'implements'}>;
  circularDependencies: string[][];
  orphanedFiles: string[];
  entryPoints: string[];
}

export interface VectorEmbeddingInfo {
  id: string;
  content: string;
  embedding?: number[];
  metadata: {
    file: string;
    type: 'function' | 'class' | 'interface' | 'component' | 'comment';
    name: string;
    lineStart: number;
    lineEnd: number;
    language: string;
    [key: string]: any;
  };
}

// Enhanced Analysis Interfaces

export interface SemanticRelationshipsAnalysis {
  componentRelationships: ComponentRelationshipInfo[];
  functionRelationships: FunctionRelationshipInfo[];
  dataFlowMaps: DataFlowInfo[];
  dependencyChains: DependencyChainInfo[];
  patterns: RelationshipPatternInfo[];
}

export interface ComponentRelationshipInfo {
  name: string;
  file: string;
  uses: string[];
  usedBy: string[];
  styledWith: string;
  stateManagement: string[];
  similarPatterns: string[];
  props: Array<{name: string; type: string; source?: string}>;
}

export interface FunctionRelationshipInfo {
  name: string;
  file: string;
  calls: string[];
  calledBy: string[];
  errorHandling: string[];
  returnTypes: string[];
  parameters: Array<{name: string; type: string; source?: string}>;
}

export interface DataFlowInfo {
  from: string;
  to: string;
  type: 'props' | 'state' | 'context' | 'api' | 'function-call';
  data: string[];
  direction: 'unidirectional' | 'bidirectional';
}

export interface DependencyChainInfo {
  chain: string[];
  type: 'component' | 'function' | 'module';
  depth: number;
  isCircular: boolean;
}

export interface RelationshipPatternInfo {
  pattern: string;
  occurrences: number;
  examples: Array<{file: string; line: number}>;
  description: string;
}

export interface ImplementationPatternsAnalysis {
  patterns: DetectedPatternInfo[];
  antiPatterns: AntiPatternInfo[];
  patternFrequency: Record<string, number>;
  bestPractices: BestPracticeInfo[];
  frameworkPatterns: FrameworkPatternInfo[];
}

export interface DetectedPatternInfo {
  name: string;
  type: 'architectural' | 'design' | 'behavioral' | 'creational' | 'structural';
  description: string;
  files: string[];
  examples: Array<{file: string; line: number; code: string}>;
  benefits: string[];
  implementation: string;
}

export interface AntiPatternInfo {
  name: string;
  description: string;
  files: string[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
  impact: string;
}

export interface BestPracticeInfo {
  practice: string;
  category: 'performance' | 'security' | 'maintainability' | 'testing' | 'documentation';
  adherence: number;
  examples: string[];
  suggestions: string[];
}

export interface FrameworkPatternInfo {
  framework: string;
  patterns: string[];
  version?: string;
  configFiles: string[];
  conventions: string[];
}

export interface BusinessLogicContextAnalysis {
  domains: DomainInfo[];
  workflows: WorkflowInfo[];
  businessRules: BusinessRuleInfo[];
  dataModels: DataModelInfo[];
  integrations: IntegrationInfo[];
}

export interface DomainInfo {
  name: string;
  description: string;
  files: string[];
  entities: string[];
  services: string[];
  boundaries: string[];
}

export interface WorkflowInfo {
  name: string;
  steps: WorkflowStepInfo[];
  entry: string;
  exit: string[];
  dataFlow: string[];
  errorPaths: string[];
}

export interface WorkflowStepInfo {
  step: string;
  component: string;
  file: string;
  dependencies: string[];
}

export interface BusinessRuleInfo {
  rule: string;
  location: {file: string; line: number};
  type: 'validation' | 'calculation' | 'workflow' | 'authorization';
  impact: string;
}

export interface DataModelInfo {
  entity: string;
  fields: Array<{name: string; type: string; constraints: string[]}>;
  relationships: Array<{type: string; target: string}>;
  operations: string[];
}

export interface IntegrationInfo {
  service: string;
  type: 'external-api' | 'database' | 'message-queue' | 'file-system';
  files: string[];
  endpoints?: string[];
  schemas?: string[];
}

export interface QualityMetricsAnalysis {
  codeComplexity: ComplexityMetrics;
  testCoverage: TestCoverageInfo;
  documentation: DocumentationMetrics;
  typesSafety: TypeSafetyMetrics;
  codeQualityScore: number;
  hotspots: QualityHotspotInfo[];
}

export interface ComplexityMetrics {
  averageComplexity: number;
  highComplexityFunctions: Array<{name: string; file: string; complexity: number}>;
  complexityDistribution: Record<string, number>;
  cognitiveComplexity: number;
}

export interface TestCoverageInfo {
  testFiles: string[];
  coveragePercentage: number;
  testedFunctions: string[];
  untestedFunctions: string[];
  testPatterns: string[];
}

export interface DocumentationMetrics {
  documentedFunctions: number;
  undocumentedFunctions: number;
  jsdocCoverage: number;
  readmeFiles: string[];
  documentationQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TypeSafetyMetrics {
  typescriptCoverage: number;
  anyTypes: number;
  strictModeFiles: number;
  typeDefinitions: number;
  typeErrors: Array<{file: string; error: string}>;
}

export interface QualityHotspotInfo {
  file: string;
  issues: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
  impact: string;
}

export interface DevelopmentGuidanceAnalysis {
  onboardingGuide: OnboardingGuideInfo;
  developmentPatterns: DevelopmentPatternInfo[];
  commonTasks: CommonTaskInfo[];
  troubleshooting: TroubleshootingInfo[];
  codeExamples: CodeExampleInfo[];
}

export interface OnboardingGuideInfo {
  setupSteps: string[];
  keyFiles: string[];
  architectureOverview: string;
  firstSteps: string[];
  resources: string[];
}

export interface DevelopmentPatternInfo {
  task: string;
  steps: string[];
  examples: Array<{description: string; file: string; code: string}>;
  pitfalls: string[];
  tips: string[];
}

export interface CommonTaskInfo {
  task: string;
  pattern: string;
  files: string[];
  codeTemplate: string;
  checklist: string[];
}

export interface TroubleshootingInfo {
  issue: string;
  symptoms: string[];
  solutions: string[];
  relatedFiles: string[];
}

export interface CodeExampleInfo {
  purpose: string;
  code: string;
  file: string;
  line: number;
  explanation: string;
}

export interface ArchitecturalInsightsAnalysis {
  layerStructure: LayerInfo[];
  communicationPatterns: CommunicationPatternInfo[];
  scalingConsiderations: ScalingConsiderationInfo[];
  designPrinciples: DesignPrincipleInfo[];
  architecturalDecisions: ArchitecturalDecisionInfo[];
}

export interface LayerInfo {
  name: string;
  purpose: string;
  files: string[];
  dependencies: string[];
  responsibilities: string[];
}

export interface CommunicationPatternInfo {
  pattern: string;
  description: string;
  files: string[];
  benefits: string[];
  tradeoffs: string[];
}

export interface ScalingConsiderationInfo {
  area: string;
  currentState: string;
  opportunities: string[];
  recommendations: string[];
  impact: 'low' | 'medium' | 'high';
}

export interface DesignPrincipleInfo {
  principle: string;
  adherence: number;
  violations: Array<{file: string; description: string}>;
  recommendations: string[];
}

export interface ArchitecturalDecisionInfo {
  decision: string;
  rationale: string;
  alternatives: string[];
  consequences: string[];
  files: string[];
}

export interface TechnologyIntegrationAnalysis {
  externalServices: ExternalServiceInfo[];
  databases: DatabaseIntegrationInfo[];
  cloudServices: CloudServiceInfo[];
  apis: ApiIntegrationInfo[];
  libraries: LibraryInfo[];
  deployment: DeploymentInfo;
}

export interface ExternalServiceInfo {
  name: string;
  type: string;
  purpose: string;
  files: string[];
  configuration: string[];
  endpoints?: string[];
}

export interface DatabaseIntegrationInfo extends DatabaseAnalysisInfo {
  connectionPatterns: string[];
  queryPatterns: string[];
  performance: {
    indexAnalysis: string[];
    optimizationOpportunities: string[];
  };
}

export interface CloudServiceInfo {
  provider: 'aws' | 'azure' | 'gcp' | 'other';
  services: Array<{name: string; purpose: string; files: string[]}>;
  configuration: string[];
  deployment: string[];
}

export interface ApiIntegrationInfo {
  internal: Array<{name: string; files: string[]; endpoints: string[]}>;
  external: Array<{name: string; files: string[]; purpose: string}>;
  authentication: string[];
  errorHandling: string[];
}

export interface LibraryInfo {
  name: string;
  version?: string;
  purpose: string;
  files: string[];
  alternativeLibraries: string[];
  migrationNotes?: string;
}

export interface DeploymentInfo {
  strategy: string;
  containerization: boolean;
  orchestration?: string;
  cicd: string[];
  environments: string[];
  monitoring: string[];
}

export interface PerformanceAnalysisInfo {
  bundleAnalysis: BundleAnalysisInfo;
  optimizationOpportunities: OptimizationOpportunityInfo[];
  performanceMetrics: PerformanceMetricsInfo;
  bottlenecks: BottleneckInfo[];
  recommendations: PerformanceRecommendationInfo[];
}

export interface BundleAnalysisInfo {
  totalSize: number;
  largeDependencies: Array<{name: string; size: number}>;
  codeSplitting: boolean;
  lazyLoading: string[];
  treeShaking: boolean;
}

export interface OptimizationOpportunityInfo {
  type: 'bundle' | 'runtime' | 'network' | 'caching' | 'database';
  description: string;
  files: string[];
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface PerformanceMetricsInfo {
  largestFiles: Array<{file: string; size: number}>;
  complexFunctions: Array<{function: string; file: string; complexity: number}>;
  deepNesting: Array<{file: string; depth: number}>;
  longFunctions: Array<{function: string; file: string; lines: number}>;
}

export interface BottleneckInfo {
  location: string;
  type: 'computation' | 'io' | 'memory' | 'network';
  description: string;
  severity: 'low' | 'medium' | 'high';
  solution: string;
}

export interface PerformanceRecommendationInfo {
  category: string;
  recommendation: string;
  files: string[];
  codeExample?: string;
  expectedImpact: string;
}

export interface MigrationPathsAnalysis {
  currentState: CurrentStateInfo;
  migrationOpportunities: MigrationOpportunityInfo[];
  modernizationPaths: ModernizationPathInfo[];
  legacyCode: LegacyCodeInfo[];
  upgradeRecommendations: UpgradeRecommendationInfo[];
}

export interface CurrentStateInfo {
  technologies: Array<{name: string; version: string; status: 'current' | 'outdated' | 'deprecated'}>;
  patterns: string[];
  architecture: string;
  maintainability: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface MigrationOpportunityInfo {
  from: string;
  to: string;
  type: 'framework' | 'library' | 'pattern' | 'architecture';
  difficulty: 'easy' | 'medium' | 'hard';
  benefits: string[];
  risks: string[];
  steps: string[];
  files: string[];
}

export interface ModernizationPathInfo {
  goal: string;
  currentGap: string;
  steps: Array<{step: string; effort: string; impact: string}>;
  timeline: string;
  dependencies: string[];
}

export interface LegacyCodeInfo {
  file: string;
  issues: string[];
  modernAlternatives: string[];
  migrationComplexity: 'low' | 'medium' | 'high';
  businessImpact: string;
}

export interface UpgradeRecommendationInfo {
  component: string;
  currentVersion: string;
  recommendedVersion: string;
  breakingChanges: string[];
  benefits: string[];
  migrationGuide: string;
}

// Enhanced Backend API Analysis Types

export interface ServerFrameworkInfo {
  framework: 'express' | 'nestjs' | 'fastify' | 'koa' | 'apollo-server' | 'socket.io' | 'other';
  version?: string;
  files: string[];
  middleware: MiddlewareInfo[];
  routes: RouteInfo[];
  plugins?: PluginInfo[];
  decorators?: DecoratorInfo[];
  configuration: ConfigurationInfo[];
}

export interface MiddlewareInfo {
  name: string;
  type: 'authentication' | 'authorization' | 'logging' | 'cors' | 'rate-limiting' | 'validation' | 'error-handling' | 'other';
  file: string;
  lineStart: number;
  description: string;
  global: boolean;
}

export interface RouteInfo {
  path: string;
  method: string;
  handler: string;
  file: string;
  middleware: string[];
  guards?: string[];
  validation?: string[];
  parameters?: RouteParameterInfo[];
  responses?: RouteResponseInfo[];
}

export interface RouteParameterInfo {
  name: string;
  type: 'path' | 'query' | 'body' | 'header';
  dataType: string;
  required: boolean;
  validation?: string;
}

export interface RouteResponseInfo {
  status: number;
  description: string;
  schema?: string;
}

export interface PluginInfo {
  name: string;
  file: string;
  purpose: string;
  configuration?: string;
}

export interface DecoratorInfo {
  name: string;
  type: 'controller' | 'service' | 'guard' | 'interceptor' | 'pipe' | 'other';
  file: string;
  target: string;
  parameters?: string[];
}

export interface ConfigurationInfo {
  type: 'environment' | 'database' | 'cors' | 'session' | 'security' | 'logging' | 'other';
  file: string;
  settings: Record<string, any>;
  sensitive: boolean;
}

export interface ApiArchitectureInfo {
  restfulDesign: RestfulDesignInfo;
  apiVersioning: ApiVersioningInfo;
  documentation: ApiDocumentationInfo;
  rateLimiting: RateLimitingInfo;
  caching: CachingInfo;
  cors: CorsInfo;
  contentNegotiation: ContentNegotiationInfo;
  pagination: PaginationInfo;
}

export interface RestfulDesignInfo {
  adherenceScore: number;
  violations: Array<{endpoint: string; issue: string; suggestion: string}>;
  resourceNaming: Array<{resource: string; endpoints: string[]; score: number}>;
  httpMethodUsage: Record<string, {count: number; appropriate: boolean}>;
}

export interface ApiVersioningInfo {
  strategy: 'url-path' | 'header' | 'query-param' | 'none';
  versions: string[];
  implementation: Array<{version: string; files: string[]}>;
  deprecations: Array<{version: string; endpoints: string[]; sunsetDate?: string}>;
}

export interface ApiDocumentationInfo {
  type: 'openapi' | 'swagger' | 'postman' | 'custom' | 'none';
  files: string[];
  coverage: number;
  endpoints: Array<{endpoint: string; documented: boolean; examples: boolean}>;
  schemas: Array<{name: string; documented: boolean}>;
}

export interface RateLimitingInfo {
  enabled: boolean;
  strategy: string;
  files: string[];
  configuration: Array<{endpoint: string; limits: string; windowSize: string}>;
  storage: string;
}

export interface CachingInfo {
  layers: CacheLayerInfo[];
  strategies: string[];
  invalidation: string[];
  ttl: Array<{key: string; duration: string}>;
}

export interface CacheLayerInfo {
  type: 'redis' | 'memory' | 'http' | 'database' | 'cdn';
  implementation: string;
  files: string[];
  configuration: Record<string, any>;
}

export interface CorsInfo {
  enabled: boolean;
  configuration: {
    origins: string[];
    methods: string[];
    headers: string[];
    credentials: boolean;
  };
  files: string[];
}

export interface ContentNegotiationInfo {
  supported: string[];
  defaultFormat: string;
  compression: boolean;
  serialization: string[];
}

export interface PaginationInfo {
  strategy: 'offset' | 'cursor' | 'page' | 'none';
  implementation: Array<{endpoint: string; method: string}>;
  metadata: boolean;
}

export interface SecurityAnalysisInfo {
  authentication: AuthenticationSecurityInfo;
  authorization: AuthorizationInfo;
  inputValidation: InputValidationInfo;
  outputSanitization: OutputSanitizationInfo;
  secretManagement: SecretManagementInfo;
  securityHeaders: SecurityHeadersInfo;
  encryption: EncryptionInfo;
  vulnerabilities: VulnerabilityInfo[];
}

export interface AuthenticationSecurityInfo extends AuthenticationInfo {
  strength: 'weak' | 'moderate' | 'strong';
  tokenStorage: string;
  sessionSecurity: SessionSecurityInfo;
  multiFactorAuth: boolean;
}

export interface SessionSecurityInfo {
  secure: boolean;
  httpOnly: boolean;
  sameSite: string;
  expiration: string;
  regeneration: boolean;
}

export interface AuthorizationInfo {
  model: 'rbac' | 'acl' | 'custom' | 'none';
  implementation: Array<{type: string; files: string[]; description: string}>;
  roles: string[];
  permissions: string[];
  enforcement: Array<{endpoint: string; guards: string[]}>;
}

export interface InputValidationInfo {
  frameworks: string[];
  coverage: number;
  validatedEndpoints: Array<{endpoint: string; validation: string[]}>;
  vulnerabilities: Array<{type: string; endpoints: string[]; severity: 'low' | 'medium' | 'high'}>;
}

export interface OutputSanitizationInfo {
  enabled: boolean;
  libraries: string[];
  xssProtection: boolean;
  htmlEncoding: boolean;
  jsonSerialization: boolean;
}

export interface SecretManagementInfo {
  strategy: 'env-vars' | 'vault' | 'key-management' | 'hardcoded';
  files: string[];
  secrets: Array<{type: string; secure: boolean; location: string}>;
  rotation: boolean;
  encryption: boolean;
}

export interface SecurityHeadersInfo {
  implemented: string[];
  missing: string[];
  configuration: Record<string, string>;
  score: number;
}

export interface EncryptionInfo {
  inTransit: {enabled: boolean; protocols: string[]; certificates: string[]};
  atRest: {enabled: boolean; algorithms: string[]; keyManagement: string};
  application: {hashing: string[]; encryption: string[]; signing: string[]};
}

export interface VulnerabilityInfo {
  type: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  affected: string[];
  remediation: string;
  cwe?: string;
}

export interface PerformancePatternInfo {
  type: 'async-pattern' | 'caching' | 'background-job' | 'database-optimization' | 'connection-pooling';
  description: string;
  implementation: string;
  files: string[];
  benefits: string[];
  configuration?: Record<string, any>;
}

export interface InfrastructurePatternInfo {
  type: 'containerization' | 'orchestration' | 'monitoring' | 'logging' | 'deployment' | 'configuration';
  technology: string;
  files: string[];
  configuration: Record<string, any>;
  purpose: string;
  scalability: 'low' | 'medium' | 'high';
}