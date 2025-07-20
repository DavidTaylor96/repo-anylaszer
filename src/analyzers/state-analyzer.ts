import * as fs from 'fs';
import { FileInfo, ParseResult, ComponentInfo, StateAnalysisInfo, StateStoreInfo, ComponentRelationship } from '../types';

export class StateAnalyzer {
  private repoPath: string;
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, _fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.parserResults = parserResults;
  }

  public analyze(): StateAnalysisInfo {
    const stores = this.extractStateStores();
    const relationships = this.mapComponentRelationships();
    const dataFlow = this.analyzeDataFlow();
    const stateManagementPattern = this.detectStateManagementPattern();

    return {
      stores,
      relationships,
      dataFlow,
      stateManagementPattern,
      summary: this.generateSummary(stores, relationships, dataFlow)
    };
  }

  private extractStateStores(): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for different state management patterns
      stores.push(...this.extractZustandStores(filePath, fileContent, parseResult));
      stores.push(...this.extractReduxStores(filePath, fileContent, parseResult));
      stores.push(...this.extractContextStores(filePath, fileContent, parseResult));
      stores.push(...this.extractMobXStores(filePath, fileContent, parseResult));
      stores.push(...this.extractRecoilStores(filePath, fileContent, parseResult));
    }

    return stores;
  }

  private mapComponentRelationships(): ComponentRelationship[] {
    const relationships: ComponentRelationship[] = [];
    const allComponents = this.getAllComponents();

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent || !parseResult.components) continue;

      for (const component of parseResult.components) {
        const parentComponents = this.findParentComponents(component, fileContent, allComponents);
        const childComponents = this.findChildComponents(component, fileContent, allComponents);
        const sharedState = this.findSharedState(component, fileContent);

        for (const parent of parentComponents) {
          relationships.push({
            type: 'parent-child',
            parent: parent.name,
            child: component.name,
            parentFile: parent.file,
            childFile: filePath,
            dataFlow: this.analyzeDataFlowBetweenComponents(parent.name, component.name, fileContent),
            sharedState
          });
        }

        for (const child of childComponents) {
          relationships.push({
            type: 'parent-child',
            parent: component.name,
            child: child.name,
            parentFile: filePath,
            childFile: child.file,
            dataFlow: this.analyzeDataFlowBetweenComponents(component.name, child.name, fileContent),
            sharedState
          });
        }
      }
    }

    return relationships;
  }

  private analyzeDataFlow(): Array<{from: string, to: string, type: string, data: string[]}> {
    const dataFlow: Array<{from: string, to: string, type: string, data: string[]}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Analyze prop passing
      dataFlow.push(...this.extractPropFlow(filePath, fileContent, parseResult));
      
      // Analyze state store usage
      dataFlow.push(...this.extractStoreFlow(filePath, fileContent, parseResult));
      
      // Analyze event flow
      dataFlow.push(...this.extractEventFlow(filePath, fileContent, parseResult));
    }

    return dataFlow;
  }

  private detectStateManagementPattern(): string {
    const patterns: Record<string, number> = {};

    for (const [filePath, _] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for different patterns
      if (fileContent.includes('zustand') || fileContent.includes('create(')) patterns['Zustand'] = (patterns['Zustand'] || 0) + 1;
      if (fileContent.includes('redux') || fileContent.includes('createStore')) patterns['Redux'] = (patterns['Redux'] || 0) + 1;
      if (fileContent.includes('useContext') || fileContent.includes('createContext')) patterns['Context API'] = (patterns['Context API'] || 0) + 1;
      if (fileContent.includes('mobx') || fileContent.includes('observable')) patterns['MobX'] = (patterns['MobX'] || 0) + 1;
      if (fileContent.includes('recoil') || fileContent.includes('atom')) patterns['Recoil'] = (patterns['Recoil'] || 0) + 1;
      if (fileContent.includes('useState') || fileContent.includes('useReducer')) patterns['React Hooks'] = (patterns['React Hooks'] || 0) + 1;
    }

    // Return the most common pattern
    const sortedPatterns = Object.entries(patterns).sort(([,a], [,b]) => b - a);
    return sortedPatterns.length > 0 ? sortedPatterns[0][0] : 'Unknown';
  }

  private extractZustandStores(filePath: string, content: string, _parseResult: ParseResult): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];
    
    // Check if file imports from zustand or has create function calls
    const hasZustandImport = content.includes('from \'zustand\'') || content.includes('from "zustand"');
    const hasCreateCall = content.includes('create(') || content.includes('create<');
    
    if (!hasZustandImport && !hasCreateCall) return stores;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for Zustand store creation patterns
      const zustandPatterns = [
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*create\s*<[^>]*>\s*\(\s*\)\s*\(/,  // create<Type>()(
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*create\s*<[^>]*>\s*\(/,           // create<Type>(
        /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*create\s*\(/,                    // create(
        /(?:export\s+default\s+)?(\w+)\s*=\s*create\s*<[^>]*>\s*\(\s*\)\s*\(/,          // default export ()()
        /(?:export\s+default\s+)?(\w+)\s*=\s*create\s*<[^>]*>\s*\(/,                    // default export
        /(?:export\s+default\s+)?(\w+)\s*=\s*create\s*\(/                               // default export simple
      ];
      
      for (const pattern of zustandPatterns) {
        const storeMatch = line.match(pattern);
        if (storeMatch && hasZustandImport) {
          const storeName = storeMatch[1];
          const storeContent = this.extractStoreContent(lines, i);
          const actions = this.extractZustandActions(storeContent);
          const state = this.extractZustandState(storeContent);

          stores.push({
            name: storeName,
            type: 'zustand',
            file: filePath,
            lineStart: i + 1,
            state,
            actions,
            description: `Zustand store: ${storeName}`
          });
          break;
        }
      }
    }

    return stores;
  }

  private extractReduxStores(filePath: string, content: string, _parseResult: ParseResult): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];
    
    if (!content.includes('redux') && !content.includes('createStore') && !content.includes('createSlice')) return stores;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Redux store
      if (line.includes('createStore') || line.includes('configureStore')) {
        const storeMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:createStore|configureStore)/);
        if (storeMatch) {
          stores.push({
            name: storeMatch[1],
            type: 'redux',
            file: filePath,
            lineStart: i + 1,
            state: ['store'],
            actions: this.extractReduxActions(content),
            description: `Redux store: ${storeMatch[1]}`
          });
        }
      }

      // Redux slice
      if (line.includes('createSlice')) {
        const sliceMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*createSlice/);
        if (sliceMatch) {
          const sliceContent = this.extractStoreContent(lines, i);
          const actions = this.extractReduxSliceActions(sliceContent);
          const state = this.extractReduxSliceState(sliceContent);

          stores.push({
            name: sliceMatch[1],
            type: 'redux-slice',
            file: filePath,
            lineStart: i + 1,
            state,
            actions,
            description: `Redux slice: ${sliceMatch[1]}`
          });
        }
      }
    }

    return stores;
  }

  private extractContextStores(filePath: string, content: string, _parseResult: ParseResult): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];
    
    if (!content.includes('createContext') && !content.includes('useContext')) return stores;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('createContext')) {
        const contextMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*createContext/);
        if (contextMatch) {
          const contextName = contextMatch[1];
          const providerInfo = this.findContextProvider(content, contextName);

          stores.push({
            name: contextName,
            type: 'context',
            file: filePath,
            lineStart: i + 1,
            state: providerInfo.state,
            actions: providerInfo.actions,
            description: `React Context: ${contextName}`
          });
        }
      }
    }

    return stores;
  }

  private extractMobXStores(filePath: string, content: string, parseResult: ParseResult): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];
    
    if (!content.includes('mobx') && !content.includes('observable')) return stores;

    // Look for MobX store classes
    if (parseResult.classes) {
      for (const cls of parseResult.classes) {
        if (this.isMobXStore(cls.name, content)) {
          const state = cls.properties.map(p => typeof p === 'string' ? p : p.name);
          const actions = cls.methods.map(m => m.name);

          stores.push({
            name: cls.name,
            type: 'mobx',
            file: filePath,
            lineStart: cls.lineStart,
            state,
            actions,
            description: `MobX store: ${cls.name}`
          });
        }
      }
    }

    return stores;
  }

  private extractRecoilStores(filePath: string, content: string, _parseResult: ParseResult): StateStoreInfo[] {
    const stores: StateStoreInfo[] = [];
    
    if (!content.includes('recoil') && !content.includes('atom') && !content.includes('selector')) return stores;

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Recoil atoms
      if (line.includes('atom(')) {
        const atomMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*atom/);
        if (atomMatch) {
          stores.push({
            name: atomMatch[1],
            type: 'recoil-atom',
            file: filePath,
            lineStart: i + 1,
            state: [atomMatch[1]],
            actions: [],
            description: `Recoil atom: ${atomMatch[1]}`
          });
        }
      }

      // Recoil selectors
      if (line.includes('selector(')) {
        const selectorMatch = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*selector/);
        if (selectorMatch) {
          stores.push({
            name: selectorMatch[1],
            type: 'recoil-selector',
            file: filePath,
            lineStart: i + 1,
            state: [selectorMatch[1]],
            actions: [],
            description: `Recoil selector: ${selectorMatch[1]}`
          });
        }
      }
    }

    return stores;
  }

  private getAllComponents(): Array<{name: string, file: string}> {
    const components: Array<{name: string, file: string}> = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (parseResult.components) {
        for (const component of parseResult.components) {
          components.push({ name: component.name, file: filePath });
        }
      }
    }

    return components;
  }

  private findParentComponents(component: ComponentInfo, _fileContent: string, allComponents: Array<{name: string, file: string}>): Array<{name: string, file: string}> {
    const parents: Array<{name: string, file: string}> = [];
    
    // Look for components that import and use this component
    for (const comp of allComponents) {
      if (comp.name === component.name || comp.file === component.name) continue;
      
      const compContent = this.getFileContent(comp.file);
      if (!compContent) continue;

      // Check if this component is imported and used
      if (compContent.includes(`import`) && compContent.includes(component.name) && 
          compContent.includes(`<${component.name}`)) {
        parents.push(comp);
      }
    }

    return parents;
  }

  private findChildComponents(component: ComponentInfo, fileContent: string, allComponents: Array<{name: string, file: string}>): Array<{name: string, file: string}> {
    const children: Array<{name: string, file: string}> = [];

    // Look for components that are imported and used in this component
    for (const comp of allComponents) {
      if (comp.name === component.name) continue;

      if (fileContent.includes(`import`) && fileContent.includes(comp.name) && 
          fileContent.includes(`<${comp.name}`)) {
        children.push(comp);
      }
    }

    return children;
  }

  private findSharedState(component: ComponentInfo, fileContent: string): string[] {
    const sharedState: string[] = [];

    // Look for hooks and state management usage
    for (const hook of component.hooks) {
      if (hook.includes('use') && (
        fileContent.includes('store') || 
        fileContent.includes('context') ||
        fileContent.includes('atom') ||
        fileContent.includes('selector')
      )) {
        sharedState.push(hook);
      }
    }

    return sharedState;
  }

  private analyzeDataFlowBetweenComponents(_parent: string, child: string, content: string): string[] {
    const dataFlow: string[] = [];

    // Look for prop passing
    const propPattern = new RegExp(`<${child}[^>]*\\s+(\\w+)=`, 'g');
    let match;
    while ((match = propPattern.exec(content)) !== null) {
      dataFlow.push(`prop:${match[1]}`);
    }

    return dataFlow;
  }

  private extractPropFlow(_filePath: string, _content: string, parseResult: ParseResult): Array<{from: string, to: string, type: string, data: string[]}> {
    const flows: Array<{from: string, to: string, type: string, data: string[]}> = [];

    if (!parseResult.components) return flows;

    for (const component of parseResult.components) {
      const propData = component.props.map(p => p.name);
      
      if (propData.length > 0) {
        flows.push({
          from: 'parent',
          to: component.name,
          type: 'props',
          data: propData
        });
      }
    }

    return flows;
  }

  private extractStoreFlow(filePath: string, content: string, _parseResult: ParseResult): Array<{from: string, to: string, type: string, data: string[]}> {
    const flows: Array<{from: string, to: string, type: string, data: string[]}> = [];

    // Look for store usage patterns
    const storePatterns = [
      /use(\w+Store)/g,
      /useStore\((\w+)\)/g,
      /useContext\((\w+)\)/g,
      /useRecoilValue\((\w+)\)/g
    ];

    for (const pattern of storePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        flows.push({
          from: match[1],
          to: filePath,
          type: 'store',
          data: [match[1]]
        });
      }
    }

    return flows;
  }

  private extractEventFlow(filePath: string, content: string, _parseResult: ParseResult): Array<{from: string, to: string, type: string, data: string[]}> {
    const flows: Array<{from: string, to: string, type: string, data: string[]}> = [];

    // Look for event patterns
    const eventPatterns = [
      /on(\w+)=\{([^}]+)\}/g,
      /addEventListener\(['"`](\w+)['"`]/g,
      /emit\(['"`](\w+)['"`]/g
    ];

    for (const pattern of eventPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        flows.push({
          from: filePath,
          to: 'event-system',
          type: 'event',
          data: [match[1]]
        });
      }
    }

    return flows;
  }

  private extractStoreContent(lines: string[], startIndex: number): string {
    let braceCount = 0;
    let content = '';
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      content += line + '\n';
      
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      if (braceCount === 0 && i > startIndex) {
        break;
      }
    }
    
    return content;
  }

  private extractZustandActions(content: string): string[] {
    const actions: string[] = [];
    
    // Enhanced patterns for Zustand actions
    const actionPatterns = [
      // Standard arrow function actions: actionName: () => ...
      /(\w+):\s*\([^)]*\)\s*=>/g,
      // Function actions: actionName: function() ...
      /(\w+):\s*function\s*\([^)]*\)/g,
      // Set state patterns: set(() => ...) 
      /(\w+):\s*\([^)]*set[^)]*\)\s*=>/g,
      // Get/set patterns: (get, set) => ...
      /(\w+):\s*\([^)]*get[^)]*set[^)]*\)\s*=>/g,
      // Async actions
      /(\w+):\s*async\s*\([^)]*\)\s*=>/g
    ];

    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (!actions.includes(match[1]) && !this.isStateProperty(match[1], content)) {
          actions.push(match[1]);
        }
      }
    }
    
    return actions;
  }

  private extractZustandState(content: string): string[] {
    const state: string[] = [];
    
    // Enhanced patterns for Zustand state properties
    const statePatterns = [
      // Simple property: name: value,
      /(\w+):\s*(?!function|async|\([^)]*\)\s*=>)[^,\n}]+[,\n}]/g,
      // Initial state object properties
      /initialState:\s*\{([^}]+)\}/g,
      // State with primitive values
      /(\w+):\s*(?:true|false|null|\d+|'[^']*'|"[^"]*"|\[[^\]]*\]|\{[^}]*\})/g
    ];

    for (const pattern of statePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (pattern.source.includes('initialState')) {
          // Extract properties from initialState object
          const stateContent = match[1];
          const propPattern = /(\w+):/g;
          let propMatch;
          while ((propMatch = propPattern.exec(stateContent)) !== null) {
            if (!state.includes(propMatch[1])) {
              state.push(propMatch[1]);
            }
          }
        } else {
          if (!state.includes(match[1]) && !this.isActionMethod(match[1], content)) {
            state.push(match[1]);
          }
        }
      }
    }
    
    return state;
  }

  private isStateProperty(name: string, content: string): boolean {
    // Check if this is likely a state property (not an action)
    const stateIndicators = [
      new RegExp(`${name}:\\s*(?:true|false|null|\\d+|'[^']*'|"[^"]*"|\\[[^\\]]*\\]|\\{[^}]*\\})`),
      new RegExp(`${name}:\\s*\\w+State`),
      new RegExp(`${name}:\\s*initial`)
    ];
    
    return stateIndicators.some(pattern => pattern.test(content));
  }

  private isActionMethod(name: string, content: string): boolean {
    // Check if this is likely an action method (not state)
    const actionIndicators = [
      new RegExp(`${name}:\\s*\\([^)]*\\)\\s*=>`),
      new RegExp(`${name}:\\s*function`),
      new RegExp(`${name}:\\s*async`),
      new RegExp(`${name}:\\s*\\([^)]*set[^)]*\\)`)
    ];
    
    return actionIndicators.some(pattern => pattern.test(content));
  }

  private extractReduxActions(content: string): string[] {
    const actions: string[] = [];
    const actionPattern = /type:\s*['"`]([^'"`]+)['"`]/g;
    
    let match;
    while ((match = actionPattern.exec(content)) !== null) {
      actions.push(match[1]);
    }
    
    return actions;
  }

  private extractReduxSliceActions(content: string): string[] {
    const actions: string[] = [];
    const actionPattern = /(\w+):\s*\([^)]*\)\s*=>/g;
    
    let match;
    while ((match = actionPattern.exec(content)) !== null) {
      actions.push(match[1]);
    }
    
    return actions;
  }

  private extractReduxSliceState(content: string): string[] {
    const state: string[] = [];
    const initialStateMatch = content.match(/initialState:\s*\{([^}]+)\}/);
    
    if (initialStateMatch) {
      const stateContent = initialStateMatch[1];
      const statePattern = /(\w+):/g;
      
      let match;
      while ((match = statePattern.exec(stateContent)) !== null) {
        state.push(match[1]);
      }
    }
    
    return state;
  }

  private findContextProvider(content: string, contextName: string): {state: string[], actions: string[]} {
    const state: string[] = [];
    const actions: string[] = [];
    
    // Look for provider component
    const providerPattern = new RegExp(`${contextName}\\.Provider`, 'g');
    if (providerPattern.test(content)) {
      // Extract state and actions from provider value
      const valuePattern = /value=\{\{([^}]+)\}\}/;
      const match = content.match(valuePattern);
      
      if (match) {
        const valueContent = match[1];
        const itemPattern = /(\w+)(?:,|\s|$)/g;
        
        let itemMatch;
        while ((itemMatch = itemPattern.exec(valueContent)) !== null) {
          if (itemMatch[1].toLowerCase().includes('set') || itemMatch[1].toLowerCase().includes('update')) {
            actions.push(itemMatch[1]);
          } else {
            state.push(itemMatch[1]);
          }
        }
      }
    }
    
    return { state, actions };
  }

  private isMobXStore(className: string, content: string): boolean {
    return content.includes('observable') || 
           content.includes('makeObservable') ||
           content.includes('makeAutoObservable') ||
           className.toLowerCase().includes('store');
  }

  private generateSummary(stores: StateStoreInfo[], relationships: ComponentRelationship[], dataFlow: Array<{from: string, to: string, type: string, data: string[]}>): string {
    const storeTypes = stores.map(s => s.type);
    const uniqueStoreTypes = [...new Set(storeTypes)];
    
    return `Found ${stores.length} state stores (${uniqueStoreTypes.join(', ')}), ${relationships.length} component relationships, and ${dataFlow.length} data flow connections.`;
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