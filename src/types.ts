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
  type: 'architectural' | 'naming' | 'design' | 'anti-pattern';
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