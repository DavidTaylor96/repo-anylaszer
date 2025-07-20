import * as fs from 'fs';
import { 
  FileInfo, 
  ParseResult, 
  SemanticRelationshipsAnalysis, 
  ComponentRelationshipInfo, 
  FunctionRelationshipInfo, 
  DataFlowInfo, 
  DependencyChainInfo, 
  RelationshipPatternInfo 
} from '../types';

export class SemanticRelationshipsAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): SemanticRelationshipsAnalysis {
    const componentRelationships = this.analyzeComponentRelationships();
    const functionRelationships = this.analyzeFunctionRelationships();
    const dataFlowMaps = this.analyzeDataFlow();
    const dependencyChains = this.analyzeDependencyChains();
    const patterns = this.analyzeRelationshipPatterns();

    return {
      componentRelationships,
      functionRelationships,
      dataFlowMaps,
      dependencyChains,
      patterns
    };
  }

  private analyzeComponentRelationships(): ComponentRelationshipInfo[] {
    const components: ComponentRelationshipInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Analyze React components
      if (parseResult.components) {
        for (const component of parseResult.components) {
          const relationships = this.extractComponentRelationships(component, fileContent, filePath);
          components.push(relationships);
        }
      }

      // Analyze other component patterns (Vue, Angular, etc.)
      const otherComponents = this.extractOtherComponentPatterns(filePath, fileContent);
      components.push(...otherComponents);
    }

    return components;
  }

  private analyzeFunctionRelationships(): FunctionRelationshipInfo[] {
    const relationships: FunctionRelationshipInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      for (const func of parseResult.functions) {
        const relationship = this.extractFunctionRelationship(func, fileContent, filePath, parseResult);
        relationships.push(relationship);
      }
    }

    return relationships;
  }

  private analyzeDataFlow(): DataFlowInfo[] {
    const dataFlows: DataFlowInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Analyze prop passing
      const propFlows = this.extractPropFlows(fileContent, filePath);
      dataFlows.push(...propFlows);

      // Analyze state management flows
      const stateFlows = this.extractStateFlows(fileContent, filePath);
      dataFlows.push(...stateFlows);

      // Analyze API data flows
      const apiFlows = this.extractApiFlows(fileContent, filePath);
      dataFlows.push(...apiFlows);

      // Analyze function call flows
      const functionFlows = this.extractFunctionCallFlows(parseResult, filePath);
      dataFlows.push(...functionFlows);
    }

    return dataFlows;
  }

  private analyzeDependencyChains(): DependencyChainInfo[] {
    const chains: DependencyChainInfo[] = [];

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph();

    // Find chains for each file
    for (const filePath of Object.keys(this.parserResults)) {
      const componentChains = this.findDependencyChains(filePath, dependencyGraph, 'component');
      const functionChains = this.findDependencyChains(filePath, dependencyGraph, 'function');
      const moduleChains = this.findDependencyChains(filePath, dependencyGraph, 'module');

      chains.push(...componentChains, ...functionChains, ...moduleChains);
    }

    return chains;
  }

  private analyzeRelationshipPatterns(): RelationshipPatternInfo[] {
    const patterns: RelationshipPatternInfo[] = [];

    // Analyze common relationship patterns
    const componentPatterns = this.findComponentPatterns();
    const statePatterns = this.findStateManagementPatterns();
    const dataFlowPatterns = this.findDataFlowPatterns();
    const architecturalPatterns = this.findArchitecturalPatterns();

    patterns.push(...componentPatterns, ...statePatterns, ...dataFlowPatterns, ...architecturalPatterns);

    return patterns;
  }

  private extractComponentRelationships(component: any, fileContent: string, filePath: string): ComponentRelationshipInfo {
    const uses = this.extractComponentDependencies(component, fileContent);
    const usedBy = this.findComponentUsages(component.name, filePath);
    const styledWith = this.extractStylingApproach(fileContent);
    const stateManagement = this.extractStateManagement(fileContent);
    const similarPatterns = this.findSimilarComponents(component, filePath);
    const props = this.extractComponentProps(component, fileContent);

    return {
      name: component.name,
      file: filePath,
      uses,
      usedBy,
      styledWith,
      stateManagement,
      similarPatterns,
      props
    };
  }

  private extractFunctionRelationship(func: any, fileContent: string, filePath: string, parseResult: ParseResult): FunctionRelationshipInfo {
    const calls = this.extractFunctionCalls(func, fileContent, parseResult);
    const calledBy = this.findFunctionCallers(func.name, filePath);
    const errorHandling = this.extractErrorHandling(func, fileContent);
    const returnTypes = this.extractReturnTypes(func, fileContent);
    const parameters = this.extractParameterSources(func, fileContent);

    return {
      name: func.name,
      file: filePath,
      calls,
      calledBy,
      errorHandling,
      returnTypes,
      parameters
    };
  }

  private extractComponentDependencies(component: any, fileContent: string): string[] {
    const dependencies: string[] = [];
    
    // Extract imported components
    const importPattern = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importPattern.exec(fileContent)) !== null) {
      const importPath = match[1];
      if (this.isComponentImport(importPath)) {
        dependencies.push(this.extractComponentName(importPath));
      }
    }

    // Extract JSX element usage
    const jsxPattern = /<(\w+)(?:\s+[^>]*)?(?:\/>|>.*?<\/\1>)/gs;
    while ((match = jsxPattern.exec(fileContent)) !== null) {
      const elementName = match[1];
      if (this.isCustomComponent(elementName)) {
        dependencies.push(elementName);
      }
    }

    return [...new Set(dependencies)];
  }

  private findComponentUsages(componentName: string, excludeFilePath: string): string[] {
    const usages: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (filePath === excludeFilePath) continue;

      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for imports
      if (fileContent.includes(componentName)) {
        const importPattern = new RegExp(`import.*${componentName}.*from`, 'g');
        const jsxPattern = new RegExp(`<${componentName}[\\s>]`, 'g');
        
        if (importPattern.test(fileContent) || jsxPattern.test(fileContent)) {
          usages.push(filePath);
        }
      }
    }

    return usages;
  }

  private extractStylingApproach(fileContent: string): string {
    if (fileContent.includes('styled-components') || fileContent.includes('styled.')) {
      return 'styled-components';
    }
    if (fileContent.includes('module.css') || fileContent.includes('module.scss')) {
      return 'css-modules';
    }
    if (fileContent.includes('className=') && fileContent.includes('tailwind')) {
      return 'tailwind';
    }
    if (fileContent.includes('@emotion') || fileContent.includes('css`')) {
      return 'emotion';
    }
    if (fileContent.includes('makeStyles') || fileContent.includes('useStyles')) {
      return 'material-ui';
    }
    if (fileContent.includes('style={{')) {
      return 'inline-styles';
    }
    return 'css';
  }

  private extractStateManagement(fileContent: string): string[] {
    const stateManagement: string[] = [];

    if (fileContent.includes('useState')) stateManagement.push('useState');
    if (fileContent.includes('useReducer')) stateManagement.push('useReducer');
    if (fileContent.includes('useContext')) stateManagement.push('useContext');
    if (fileContent.includes('useSelector') || fileContent.includes('useDispatch')) stateManagement.push('redux');
    if (fileContent.includes('useStore') && fileContent.includes('zustand')) stateManagement.push('zustand');
    if (fileContent.includes('useRecoilState') || fileContent.includes('useRecoilValue')) stateManagement.push('recoil');
    if (fileContent.includes('observer') && fileContent.includes('mobx')) stateManagement.push('mobx');

    return stateManagement;
  }

  private findSimilarComponents(component: any, filePath: string): string[] {
    const similar: string[] = [];
    const componentProps = new Set((component.props?.map((p: any) => p.name) || []) as string[]);
    const componentHooks = new Set((component.hooks || []) as string[]);

    for (const [otherFilePath, parseResult] of Object.entries(this.parserResults)) {
      if (otherFilePath === filePath) continue;

      if (parseResult.components) {
        for (const otherComponent of parseResult.components) {
          const similarity = this.calculateComponentSimilarity(
            componentProps,
            componentHooks,
            new Set((otherComponent.props?.map((p: any) => p.name) || []) as string[]),
            new Set((otherComponent.hooks || []) as string[])
          );

          if (similarity > 0.6) { // 60% similarity threshold
            similar.push(otherComponent.name);
          }
        }
      }
    }

    return similar;
  }

  private extractComponentProps(component: any, fileContent: string): Array<{name: string; type: string; source?: string}> {
    const props: Array<{name: string; type: string; source?: string}> = [];

    // Extract from component definition
    if (component.props) {
      for (const prop of component.props) {
        props.push({
          name: prop.name,
          type: prop.type || 'unknown',
          source: 'component-definition'
        });
      }
    }

    // Extract from prop destructuring patterns
    const destructuringPattern = /(?:const|let|var)\s*\{\s*([^}]+)\s*\}\s*=\s*props/g;
    let match;
    while ((match = destructuringPattern.exec(fileContent)) !== null) {
      const propsText = match[1];
      const propNames = propsText.split(',').map(p => p.trim().split(':')[0].trim());
      
      for (const propName of propNames) {
        if (!props.some(p => p.name === propName)) {
          props.push({
            name: propName,
            type: 'unknown',
            source: 'destructuring'
          });
        }
      }
    }

    return props;
  }

  private extractFunctionCalls(func: any, fileContent: string, parseResult: ParseResult): string[] {
    const calls: string[] = [];
    const lines = fileContent.split('\n');
    const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');

    // Find function calls within this function
    for (const otherFunc of parseResult.functions) {
      if (otherFunc.name !== func.name) {
        const callPattern = new RegExp(`\\b${otherFunc.name}\\s*\\(`, 'g');
        if (callPattern.test(funcContent)) {
          calls.push(otherFunc.name);
        }
      }
    }

    // Find external library calls
    const externalCallPattern = /(\w+)\.\w+\(/g;
    let match;
    while ((match = externalCallPattern.exec(funcContent)) !== null) {
      const objectName = match[1];
      if (this.isExternalLibrary(objectName)) {
        calls.push(`${objectName}.*`);
      }
    }

    return [...new Set(calls)];
  }

  private findFunctionCallers(functionName: string, excludeFilePath: string): string[] {
    const callers: string[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (filePath === excludeFilePath) continue;

      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      const callPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
      if (callPattern.test(fileContent)) {
        // Find which function contains the call
        for (const func of parseResult.functions) {
          const lines = fileContent.split('\n');
          const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');
          if (callPattern.test(funcContent)) {
            callers.push(`${func.name} (${filePath})`);
          }
        }
      }
    }

    return [...new Set(callers)];
  }

  private extractErrorHandling(func: any, fileContent: string): string[] {
    const errorTypes: string[] = [];
    const lines = fileContent.split('\n');
    const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');

    // Common error patterns
    const patterns = [
      /throw new (\w+Error)/g,
      /catch\s*\(\s*(\w+)/g,
      /instanceof\s+(\w+Error)/g,
      /HttpStatus\.(\w+)/g,
      /status\(\s*(\d{3})\s*\)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(funcContent)) !== null) {
        errorTypes.push(match[1]);
      }
    }

    return [...new Set(errorTypes)];
  }

  private extractReturnTypes(func: any, fileContent: string): string[] {
    const returnTypes: string[] = [];

    // Extract from TypeScript annotations
    if (func.returnType) {
      returnTypes.push(func.returnType);
    }

    // Extract from return statements
    const lines = fileContent.split('\n');
    const funcContent = lines.slice(func.lineStart - 1, func.lineEnd).join('\n');
    const returnPattern = /return\s+([^;]+)/g;
    let match;
    while ((match = returnPattern.exec(funcContent)) !== null) {
      const returnValue = match[1].trim();
      const type = this.inferTypeFromValue(returnValue);
      if (type) {
        returnTypes.push(type);
      }
    }

    return [...new Set(returnTypes)];
  }

  private extractParameterSources(func: any, fileContent: string): Array<{name: string; type: string; source?: string}> {
    return func.parameters?.map((param: any) => ({
      name: param.name,
      type: param.type || 'unknown',
      source: 'function-parameter'
    })) || [];
  }

  private extractPropFlows(fileContent: string, filePath: string): DataFlowInfo[] {
    const flows: DataFlowInfo[] = [];
    
    // Find prop passing patterns
    const propPattern = /<(\w+)[^>]*\s+(\w+)=\{([^}]+)\}/g;
    let match;
    while ((match = propPattern.exec(fileContent)) !== null) {
      const component = match[1];
      const propName = match[2];
      const propValue = match[3];

      flows.push({
        from: filePath,
        to: component,
        type: 'props',
        data: [propName],
        direction: 'unidirectional'
      });
    }

    return flows;
  }

  private extractStateFlows(fileContent: string, filePath: string): DataFlowInfo[] {
    const flows: DataFlowInfo[] = [];

    // Context flows
    if (fileContent.includes('useContext')) {
      const contextPattern = /useContext\((\w+Context)\)/g;
      let match;
      while ((match = contextPattern.exec(fileContent)) !== null) {
        flows.push({
          from: match[1],
          to: filePath,
          type: 'context',
          data: ['context-value'],
          direction: 'unidirectional'
        });
      }
    }

    // Redux flows
    if (fileContent.includes('useSelector')) {
      flows.push({
        from: 'redux-store',
        to: filePath,
        type: 'state',
        data: ['store-state'],
        direction: 'unidirectional'
      });
    }

    return flows;
  }

  private extractApiFlows(fileContent: string, filePath: string): DataFlowInfo[] {
    const flows: DataFlowInfo[] = [];

    // API call patterns
    const apiPatterns = [
      /fetch\(['"`]([^'"`]+)['"`]/g,
      /axios\.\w+\(['"`]([^'"`]+)['"`]/g,
      /api\.\w+\(['"`]([^'"`]+)['"`]/g
    ];

    for (const pattern of apiPatterns) {
      let match;
      while ((match = pattern.exec(fileContent)) !== null) {
        flows.push({
          from: filePath,
          to: match[1],
          type: 'api',
          data: ['api-request'],
          direction: 'bidirectional'
        });
      }
    }

    return flows;
  }

  private extractFunctionCallFlows(parseResult: ParseResult, filePath: string): DataFlowInfo[] {
    const flows: DataFlowInfo[] = [];

    for (const func of parseResult.functions) {
      if (func.calls) {
        for (const calledFunction of func.calls) {
          flows.push({
            from: func.name,
            to: calledFunction,
            type: 'function-call',
            data: ['function-result'],
            direction: 'unidirectional'
          });
        }
      }
    }

    return flows;
  }

  private buildDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      graph[filePath] = [];
      
      for (const importInfo of parseResult.imports) {
        if (importInfo.module.startsWith('.')) {
          // Internal dependency
          const resolvedPath = this.resolvePath(filePath, importInfo.module);
          if (resolvedPath) {
            graph[filePath].push(resolvedPath);
          }
        }
      }
    }

    return graph;
  }

  private findDependencyChains(startPath: string, graph: Record<string, string[]>, type: 'component' | 'function' | 'module'): DependencyChainInfo[] {
    const chains: DependencyChainInfo[] = [];
    const visited = new Set<string>();

    const traverse = (path: string, chain: string[], depth: number): void => {
      if (visited.has(path) || depth > 10) {
        if (visited.has(path) && chain.length > 1) {
          chains.push({
            chain: [...chain, path],
            type,
            depth,
            isCircular: true
          });
        }
        return;
      }

      visited.add(path);
      const dependencies = graph[path] || [];

      if (dependencies.length === 0 && chain.length > 1) {
        chains.push({
          chain,
          type,
          depth,
          isCircular: false
        });
      }

      for (const dep of dependencies) {
        traverse(dep, [...chain, path], depth + 1);
      }

      visited.delete(path);
    };

    traverse(startPath, [], 0);
    return chains;
  }

  private findComponentPatterns(): RelationshipPatternInfo[] {
    const patterns: RelationshipPatternInfo[] = [];

    // Higher-Order Components pattern
    const hocPattern = this.findHOCPattern();
    if (hocPattern.occurrences > 0) {
      patterns.push(hocPattern);
    }

    // Render props pattern
    const renderPropsPattern = this.findRenderPropsPattern();
    if (renderPropsPattern.occurrences > 0) {
      patterns.push(renderPropsPattern);
    }

    // Compound components pattern
    const compoundPattern = this.findCompoundComponentsPattern();
    if (compoundPattern.occurrences > 0) {
      patterns.push(compoundPattern);
    }

    return patterns;
  }

  private findStateManagementPatterns(): RelationshipPatternInfo[] {
    const patterns: RelationshipPatternInfo[] = [];

    // Context + Reducer pattern
    const contextReducerPattern = this.findContextReducerPattern();
    if (contextReducerPattern.occurrences > 0) {
      patterns.push(contextReducerPattern);
    }

    // Custom hooks pattern
    const customHooksPattern = this.findCustomHooksPattern();
    if (customHooksPattern.occurrences > 0) {
      patterns.push(customHooksPattern);
    }

    return patterns;
  }

  private findDataFlowPatterns(): RelationshipPatternInfo[] {
    const patterns: RelationshipPatternInfo[] = [];

    // Props drilling pattern
    const propsDrillingPattern = this.findPropsDrillingPattern();
    if (propsDrillingPattern.occurrences > 0) {
      patterns.push(propsDrillingPattern);
    }

    return patterns;
  }

  private findArchitecturalPatterns(): RelationshipPatternInfo[] {
    const patterns: RelationshipPatternInfo[] = [];

    // MVC pattern
    const mvcPattern = this.findMVCPattern();
    if (mvcPattern.occurrences > 0) {
      patterns.push(mvcPattern);
    }

    // Repository pattern
    const repositoryPattern = this.findRepositoryPattern();
    if (repositoryPattern.occurrences > 0) {
      patterns.push(repositoryPattern);
    }

    return patterns;
  }

  // Helper methods
  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = require('path').join(this.repoPath, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  private isComponentImport(importPath: string): boolean {
    return importPath.includes('component') || 
           importPath.endsWith('.jsx') || 
           importPath.endsWith('.tsx') ||
           /^[A-Z]/.test(importPath.split('/').pop() || '');
  }

  private extractComponentName(importPath: string): string {
    const parts = importPath.split('/');
    return parts[parts.length - 1];
  }

  private isCustomComponent(elementName: string): boolean {
    return /^[A-Z]/.test(elementName) && !['Fragment', 'Suspense', 'StrictMode'].includes(elementName);
  }

  private isExternalLibrary(objectName: string): boolean {
    const commonLibraries = ['axios', 'lodash', 'moment', 'dayjs', 'uuid', 'crypto', 'path', 'fs'];
    return commonLibraries.includes(objectName);
  }

  private calculateComponentSimilarity(
    props1: Set<string>, 
    hooks1: Set<string>, 
    props2: Set<string>, 
    hooks2: Set<string>
  ): number {
    const propsIntersection = new Set([...props1].filter(x => props2.has(x)));
    const hooksIntersection = new Set([...hooks1].filter(x => hooks2.has(x)));
    const propsUnion = new Set([...props1, ...props2]);
    const hooksUnion = new Set([...hooks1, ...hooks2]);

    const propsSimilarity = propsUnion.size > 0 ? propsIntersection.size / propsUnion.size : 0;
    const hooksSimilarity = hooksUnion.size > 0 ? hooksIntersection.size / hooksUnion.size : 0;

    return (propsSimilarity + hooksSimilarity) / 2;
  }

  private inferTypeFromValue(value: string): string | null {
    if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
      return 'string';
    }
    if (/^\d+$/.test(value)) {
      return 'number';
    }
    if (value === 'true' || value === 'false') {
      return 'boolean';
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      return 'array';
    }
    if (value.startsWith('{') && value.endsWith('}')) {
      return 'object';
    }
    return null;
  }

  private resolvePath(basePath: string, relativePath: string): string | null {
    // Simple path resolution for relative imports
    const path = require('path');
    const resolved = path.resolve(path.dirname(basePath), relativePath);
    
    // Check if the resolved file exists in our parser results
    for (const filePath of Object.keys(this.parserResults)) {
      if (filePath.includes(resolved) || resolved.includes(filePath)) {
        return filePath;
      }
    }
    
    return null;
  }

  // Pattern detection methods (simplified implementations)
  private findHOCPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for HOC patterns
      if (fileContent.includes('withAuth') || fileContent.includes('withLoading') || /with[A-Z]\w+/.test(fileContent)) {
        occurrences++;
        examples.push({file: filePath, line: 1});
      }
    }

    return {
      pattern: 'Higher-Order Components',
      occurrences,
      examples,
      description: 'Components wrapped with higher-order functions for shared functionality'
    };
  }

  private findRenderPropsPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('render={') || fileContent.includes('children={')) {
        occurrences++;
        examples.push({file: filePath, line: 1});
      }
    }

    return {
      pattern: 'Render Props',
      occurrences,
      examples,
      description: 'Components that use function props to share code between components'
    };
  }

  private findCompoundComponentsPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Look for compound component patterns
      if (/\w+\.\w+/.test(fileContent) && fileContent.includes('displayName')) {
        occurrences++;
        examples.push({file: filePath, line: 1});
      }
    }

    return {
      pattern: 'Compound Components',
      occurrences,
      examples,
      description: 'Components that work together as a cohesive unit'
    };
  }

  private findContextReducerPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      if (fileContent.includes('useContext') && fileContent.includes('useReducer')) {
        occurrences++;
        examples.push({file: filePath, line: 1});
      }
    }

    return {
      pattern: 'Context + Reducer',
      occurrences,
      examples,
      description: 'State management using React Context with useReducer hook'
    };
  }

  private findCustomHooksPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const func of parseResult.functions) {
        if (func.name.startsWith('use') && func.name.length > 3) {
          occurrences++;
          examples.push({file: filePath, line: func.lineStart});
        }
      }
    }

    return {
      pattern: 'Custom Hooks',
      occurrences,
      examples,
      description: 'Reusable stateful logic extracted into custom hooks'
    };
  }

  private findPropsDrillingPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    // This would need more sophisticated analysis to detect actual props drilling
    return {
      pattern: 'Props Drilling',
      occurrences,
      examples,
      description: 'Props passed through multiple component layers'
    };
  }

  private findMVCPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    const hasControllers = Object.keys(this.parserResults).some(path => path.includes('controller'));
    const hasModels = Object.keys(this.parserResults).some(path => path.includes('model'));
    const hasViews = Object.keys(this.parserResults).some(path => path.includes('view') || path.includes('component'));

    if (hasControllers && hasModels && hasViews) {
      occurrences = 1;
      examples.push({file: 'project-structure', line: 1});
    }

    return {
      pattern: 'MVC Architecture',
      occurrences,
      examples,
      description: 'Model-View-Controller architectural pattern'
    };
  }

  private findRepositoryPattern(): RelationshipPatternInfo {
    let occurrences = 0;
    const examples: Array<{file: string; line: number}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      for (const cls of parseResult.classes) {
        if (cls.name.includes('Repository') || cls.name.includes('DAO')) {
          occurrences++;
          examples.push({file: filePath, line: cls.lineStart});
        }
      }
    }

    return {
      pattern: 'Repository Pattern',
      occurrences,
      examples,
      description: 'Data access abstraction using repository classes'
    };
  }

  private extractOtherComponentPatterns(filePath: string, fileContent: string): ComponentRelationshipInfo[] {
    const components: ComponentRelationshipInfo[] = [];

    // Vue components
    if (filePath.endsWith('.vue')) {
      const component = this.extractVueComponent(fileContent, filePath);
      if (component) components.push(component);
    }

    // Angular components
    if (filePath.endsWith('.component.ts')) {
      const component = this.extractAngularComponent(fileContent, filePath);
      if (component) components.push(component);
    }

    return components;
  }

  private extractVueComponent(fileContent: string, filePath: string): ComponentRelationshipInfo | null {
    const nameMatch = fileContent.match(/name:\s*['"`](\w+)['"`]/);
    if (!nameMatch) return null;

    return {
      name: nameMatch[1],
      file: filePath,
      uses: [],
      usedBy: [],
      styledWith: 'vue-style',
      stateManagement: ['vue-data'],
      similarPatterns: [],
      props: []
    };
  }

  private extractAngularComponent(fileContent: string, filePath: string): ComponentRelationshipInfo | null {
    const componentMatch = fileContent.match(/@Component\s*\(/);
    if (!componentMatch) return null;

    const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
    const componentName = classMatch ? classMatch[1] : 'UnknownComponent';

    return {
      name: componentName,
      file: filePath,
      uses: [],
      usedBy: [],
      styledWith: 'angular-styles',
      stateManagement: ['angular-service'],
      similarPatterns: [],
      props: []
    };
  }
}