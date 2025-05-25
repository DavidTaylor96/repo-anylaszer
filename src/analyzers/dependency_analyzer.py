from typing import Dict, List, Any, Optional, Set
import os
import logging
from collections import defaultdict
import re

logger = logging.getLogger(__name__)

class DependencyAnalyzer:
    """
    Analyzes the dependencies between files and modules in a repository.
    """
    
    def __init__(self, repo_path: str, file_data: List[Dict[str, Any]], parser_results: Dict[str, Any]):
        """
        Initialize the dependency analyzer.
        
        Args:
            repo_path: Path to the repository
            file_data: List of file metadata from RepoScanner
            parser_results: Dictionary of parsing results for each file
        """
        self.repo_path = repo_path
        self.file_data = file_data
        self.parser_results = parser_results
        self.module_mapping = {}  # Maps import names to file paths
        self.dependency_graph = defaultdict(set)  # Maps file paths to their dependencies
        self.reverse_dependency_graph = defaultdict(set)  # Maps file paths to files that depend on them
    
    def analyze(self) -> Dict[str, Any]:
        """
        Analyze the dependencies between files and modules.
        
        Returns:
            Dictionary with dependency analysis results
        """
        # Create a mapping from module names to file paths
        self._build_module_mapping()
        
        # Build the dependency graph
        self._build_dependency_graph()
        
        # Identify key modules (highly depended upon)
        key_modules = self._identify_key_modules()
        
        # Identify circular dependencies
        circular_deps = self._find_circular_dependencies()
        
        # Generate dependency metrics
        metrics = self._calculate_dependency_metrics()
        
        # Create a simplified dependency graph for visualization
        graph = self._create_simplified_graph()
        
        return {
            'key_modules': key_modules,
            'circular_dependencies': circular_deps,
            'metrics': metrics,
            'dependency_graph': graph,
        }
    
    def _build_module_mapping(self) -> None:
        """
        Build a mapping from module names to file paths.
        """
        for file_info in self.file_data:
            file_path = file_info['path']
            file_name = os.path.basename(file_path)
            module_name, ext = os.path.splitext(file_name)
            
            # Map the module name to this file
            self.module_mapping[module_name] = file_path
            
            # For Python, handle __init__.py specially
            if file_name == '__init__.py':
                # The directory becomes importable
                dir_path = os.path.dirname(file_path)
                dir_name = os.path.basename(dir_path)
                self.module_mapping[dir_name] = dir_path
            
            # For JavaScript/TypeScript, handle index.js/ts specially
            if file_name in ['index.js', 'index.jsx', 'index.ts', 'index.tsx']:
                # The directory becomes importable
                dir_path = os.path.dirname(file_path)
                dir_name = os.path.basename(dir_path)
                self.module_mapping[dir_name] = dir_path
    
    def _resolve_import(self, importing_file: str, import_path: str) -> Optional[str]:
        """
        Resolve an import to an actual file path.
        
        Args:
            importing_file: Path of the file making the import
            import_path: Import statement path
            
        Returns:
            Resolved file path or None if it couldn't be resolved
        """
        # Handle relative imports
        if import_path.startswith('.'):
            base_dir = os.path.dirname(importing_file)
            
            # Count leading dots
            dot_count = 0
            while dot_count < len(import_path) and import_path[dot_count] == '.':
                dot_count += 1
            
            # Move up directories based on dot count
            for _ in range(dot_count - 1):
                base_dir = os.path.dirname(base_dir)
            
            # Remove leading dots
            rel_path = import_path[dot_count:].lstrip('/')
            
            # Try to find the file
            if rel_path in self.module_mapping:
                return self.module_mapping[rel_path]
            
            # Check if it's a directory
            dir_path = os.path.join(base_dir, rel_path)
            if dir_path in [os.path.dirname(f['path']) for f in self.file_data]:
                return dir_path
        
        # Handle absolute imports
        else:
            # Simple case - direct module name
            if import_path in self.module_mapping:
                return self.module_mapping[import_path]
            
            # Try to handle package imports (common in JS/TS)
            parts = import_path.split('/')
            if parts[0] in self.module_mapping:
                base_path = self.module_mapping[parts[0]]
                if len(parts) > 1:
                    # This is a submodule import, try to resolve it
                    remaining = '/'.join(parts[1:])
                    submodule = os.path.join(os.path.dirname(base_path), remaining)
                    if submodule in [f['path'] for f in self.file_data]:
                        return submodule
        
        return None
    
    def _build_dependency_graph(self) -> None:
        """
        Build the dependency graph based on import statements.
        """
        for file_path, parse_result in self.parser_results.items():
            # Skip if no imports found
            if 'imports' not in parse_result:
                continue
            
            # Process each import
            for import_info in parse_result['imports']:
                module_name = None
                
                # Handle different import formats
                if import_info.get('type') == 'import':
                    module_name = import_info.get('name')
                elif import_info.get('type') == 'from_import':
                    module_name = import_info.get('module')
                elif import_info.get('type') == 'named_import' or import_info.get('type') == 'default_import':
                    module_name = import_info.get('module')
                elif import_info.get('type') == 'namespace_import':
                    module_name = import_info.get('module')
                elif import_info.get('type') == 'side_effect_import':
                    module_name = import_info.get('module')
                
                if not module_name:
                    continue
                
                # Ignore built-in/external modules
                if module_name.startswith(('http', 'https', '@')):
                    continue
                
                # Resolve the import to a file path
                resolved_path = self._resolve_import(file_path, module_name)
                if resolved_path:
                    # Add to the dependency graph
                    self.dependency_graph[file_path].add(resolved_path)
                    self.reverse_dependency_graph[resolved_path].add(file_path)
    
    def _identify_key_modules(self, threshold: int = 5) -> List[Dict[str, Any]]:
        """
        Identify key modules that are depended upon by many other files.
        
        Args:
            threshold: Minimum number of dependents to be considered a key module
            
        Returns:
            List of key modules with their dependents
        """
        key_modules = []
        
        for module, dependents in self.reverse_dependency_graph.items():
            if len(dependents) >= threshold:
                # Find the corresponding file info
                file_info = None
                for f in self.file_data:
                    if f['path'] == module:
                        file_info = f
                        break
                
                # Get module description from parse results if available
                description = None
                if module in self.parser_results:
                    parse_result = self.parser_results[module]
                    if 'module_docstring' in parse_result:
                        description = parse_result['module_docstring']
                    elif 'summary' in parse_result:
                        description = f"A {parse_result.get('summary', {}).get('file_name')} file"
                
                key_modules.append({
                    'path': module,
                    'dependents_count': len(dependents),
                    'language': file_info['language'] if file_info else None,
                    'description': description,
                })
        
        # Sort by dependents count (highest first)
        key_modules.sort(key=lambda x: x['dependents_count'], reverse=True)
        
        return key_modules
    
    def _find_circular_dependencies(self) -> List[List[str]]:
        """
        Find circular dependencies in the codebase.
        
        Returns:
            List of circular dependency chains
        """
        circular_deps = []
        visited = set()
        path = []
        
        def dfs(node):
            if node in path:
                # Found a cycle
                cycle_start = path.index(node)
                circular_deps.append(path[cycle_start:] + [node])
                return
            
            if node in visited:
                return
            
            visited.add(node)
            path.append(node)
            
            for neighbor in self.dependency_graph.get(node, []):
                dfs(neighbor)
            
            path.pop()
        
        # Run DFS from each node
        for node in self.dependency_graph:
            if node not in visited:
                dfs(node)
        
        return circular_deps
    
    def _calculate_dependency_metrics(self) -> Dict[str, Any]:
        """
        Calculate metrics about the dependency structure.
        
        Returns:
            Dictionary with dependency metrics
        """
        # Count of files with no dependencies
        isolated_files = sum(1 for file in self.file_data if file['path'] not in self.dependency_graph)
        
        # Count of files with no dependents
        leaf_files = sum(1 for file in self.file_data if file['path'] not in self.reverse_dependency_graph)
        
        # Average number of dependencies per file
        avg_deps = sum(len(deps) for deps in self.dependency_graph.values()) / max(1, len(self.dependency_graph))
        
        # Maximum dependencies
        max_deps = max((len(deps), file) for file, deps in self.dependency_graph.items()) if self.dependency_graph else (0, None)
        
        # Maximum dependents
        max_dependents = max((len(deps), file) for file, deps in self.reverse_dependency_graph.items()) if self.reverse_dependency_graph else (0, None)
        
        # Strongly connected components (clusters of tightly coupled files)
        # This is a simplified approach - a proper SCC algorithm would be Tarjan's or Kosaraju's
        connected_components = []
        visited = set()
        
        for file in self.file_data:
            file_path = file['path']
            if file_path in visited:
                continue
            
            # Find all files reachable from this file
            component = set()
            to_visit = [file_path]
            
            while to_visit:
                current = to_visit.pop()
                if current in component:
                    continue
                
                component.add(current)
                visited.add(current)
                
                # Add dependencies
                for dep in self.dependency_graph.get(current, []):
                    if dep not in component:
                        to_visit.append(dep)
                
                # Add dependents
                for dep in self.reverse_dependency_graph.get(current, []):
                    if dep not in component:
                        to_visit.append(dep)
            
            if len(component) > 1:
                connected_components.append(list(component))
        
        return {
            'total_files': len(self.file_data),
            'files_with_dependencies': len(self.dependency_graph),
            'files_with_dependents': len(self.reverse_dependency_graph),
            'isolated_files': isolated_files,
            'leaf_files': leaf_files,
            'average_dependencies': avg_deps,
            'max_dependencies': {
                'count': max_deps[0],
                'file': max_deps[1]
            } if max_deps[1] else None,
            'max_dependents': {
                'count': max_dependents[0],
                'file': max_dependents[1]
            } if max_dependents[1] else None,
            'connected_components': len(connected_components),
            'largest_component_size': max(len(c) for c in connected_components) if connected_components else 0,
        }
    
    def _create_simplified_graph(self, max_nodes: int = 50) -> Dict[str, Any]:
        """
        Create a simplified dependency graph for visualization.
        
        Args:
            max_nodes: Maximum number of nodes to include in the graph
            
        Returns:
            Dictionary representation of the graph
        """
        # If we have too many nodes, simplify by grouping them by directory
        if len(self.dependency_graph) > max_nodes:
            return self._create_directory_level_graph()
        
        # Otherwise, create a node for each file
        nodes = []
        edges = []
        
        # Add nodes
        for file_path in set(list(self.dependency_graph.keys()) + list(self.reverse_dependency_graph.keys())):
            # Find the file info
            file_info = None
            for f in self.file_data:
                if f['path'] == file_path:
                    file_info = f
                    break
            
            nodes.append({
                'id': file_path,
                'label': os.path.basename(file_path),
                'language': file_info['language'] if file_info else None,
                'dependencies': len(self.dependency_graph.get(file_path, [])),
                'dependents': len(self.reverse_dependency_graph.get(file_path, [])),
            })
        
        # Add edges
        for source, targets in self.dependency_graph.items():
            for target in targets:
                edges.append({
                    'source': source,
                    'target': target,
                })
        
        return {
            'nodes': nodes,
            'edges': edges,
        }
    
    def _create_directory_level_graph(self) -> Dict[str, Any]:
        """
        Create a directory-level dependency graph.
        
        Returns:
            Dictionary representation of the graph
        """
        # Group files by directory
        dir_to_files = defaultdict(list)
        
        for file_info in self.file_data:
            file_path = file_info['path']
            dir_path = os.path.dirname(file_path)
            if not dir_path:
                dir_path = 'root'
            dir_to_files[dir_path].append(file_path)
        
        # Create directory-level dependency graph
        dir_dependencies = defaultdict(set)
        
        for source, targets in self.dependency_graph.items():
            source_dir = os.path.dirname(source) or 'root'
            
            for target in targets:
                target_dir = os.path.dirname(target) or 'root'
                
                # Skip self-dependencies
                if source_dir != target_dir:
                    dir_dependencies[source_dir].add(target_dir)
        
        # Create nodes and edges
        nodes = []
        edges = []
        
        # Add nodes
        for dir_path, files in dir_to_files.items():
            # Count files by language
            languages = defaultdict(int)
            for file_path in files:
                for file_info in self.file_data:
                    if file_info['path'] == file_path:
                        if file_info.get('language'):
                            languages[file_info['language']] += 1
            
            nodes.append({
                'id': dir_path,
                'label': os.path.basename(dir_path) or 'root',
                'file_count': len(files),
                'main_language': max(languages.items(), key=lambda x: x[1])[0] if languages else None,
                'dependencies': len(dir_dependencies.get(dir_path, [])),
                'dependents': sum(1 for deps in dir_dependencies.values() if dir_path in deps),
            })
        
        # Add edges
        for source, targets in dir_dependencies.items():
            for target in targets:
                edges.append({
                    'source': source,
                    'target': target,
                })
        
        return {
            'nodes': nodes,
            'edges': edges,
        }