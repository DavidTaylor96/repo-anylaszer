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
}

export interface FunctionInfo {
  name: string;
  parameters: string[];
  returnType?: string;
  isAsync: boolean;
  lineStart: number;
  lineEnd: number;
  docstring?: string;
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  properties: string[];
  extends?: string;
  implements?: string[];
  lineStart: number;
  lineEnd: number;
  docstring?: string;
}

export interface ImportInfo {
  module: string;
  items: string[];
  isDefault: boolean;
  alias?: string;
}

export interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'constant' | 'default';
}

export interface ConstantInfo {
  name: string;
  type?: string;
  value?: string;
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
}

export interface EndpointInfo {
  method: string;
  path: string;
  file: string;
  function: string;
}

export interface AnalysisResults {
  fileData: FileInfo[];
  parserResults: Record<string, ParseResult>;
  structureAnalysis?: StructureAnalysis;
  dependencyAnalysis?: DependencyAnalysis;
  apiAnalysis?: ApiAnalysis;
}

export type AnalysisFocus = 'all' | 'structure' | 'dependencies' | 'api';