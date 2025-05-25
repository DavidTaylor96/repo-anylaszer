import os
from typing import Dict, List, Any, Optional
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class StructureAnalyzer:
    """
    Analyzes the structure of a repository to create a comprehensive view of the codebase.
    """
    
    def __init__(self, repo_path: str, file_data: List[Dict[str, Any]]):
        """
        Initialize the structure analyzer.
        
        Args:
            repo_path: Path to the repository
            file_data: List of file metadata from RepoScanner
        """
        self.repo_path = repo_path
        self.file_data = file_data
        self.directory_tree = {}
        self.file_count_by_type = defaultdict(int)
        self.language_stats = defaultdict(int)
    
    def analyze(self) -> Dict[str, Any]:
        """
        Analyze the repository structure.
        
        Returns:
            Dictionary with structure analysis results
        """
        # Build directory tree
        self._build_directory_tree()
        
        # Calculate file type statistics
        self._calculate_file_stats()
        
        # Detect project type
        project_type = self._detect_project_type()
        
        # Identify important directories
        important_dirs = self._identify_important_directories()
        
        # Create module map
        module_map = self._create_module_map()
        
        return {
            'directory_tree': self._simplify_directory_tree(self.directory_tree),
            'file_count': len(self.file_data),
            'file_types': dict(self.file_count_by_type),
            'language_stats': dict(self.language_stats),
            'project_type': project_type,
            'important_directories': important_dirs,
            'module_map': module_map,
        }
    
    def _build_directory_tree(self) -> None:
        """
        Build a hierarchical directory tree of the repository.
        """
        self.directory_tree = {}
        
        for file_info in self.file_data:
            path = file_info['path']
            parts = path.split(os.sep)
            
            # Build the tree
            current = self.directory_tree
            for i, part in enumerate(parts):
                if i == len(parts) - 1:  # Leaf/file
                    if '__files__' not in current:
                        current['__files__'] = []
                    current['__files__'].append({
                        'name': part,
                        'path': path,
                        'language': file_info.get('language'),
                        'size': file_info.get('size'),
                    })
                else:  # Directory
                    if part not in current:
                        current[part] = {}
                    current = current[part]
    
    def _simplify_directory_tree(self, tree: Dict[str, Any], max_depth: int = 3) -> Dict[str, Any]:
        """
        Simplify the directory tree to a limited depth for better readability.
        
        Args:
            tree: Directory tree to simplify
            max_depth: Maximum depth to include in the simplified tree
            
        Returns:
            Simplified directory tree
        """
        def _simplify_recursive(subtree, current_depth):
            result = {}
            
            # Include files
            if '__files__' in subtree:
                result['__files__'] = subtree['__files__']
            
            # Include subdirectories up to max_depth
            if current_depth < max_depth:
                for key, value in subtree.items():
                    if key != '__files__':
                        result[key] = _simplify_recursive(value, current_depth + 1)
            else:
                # Just count files and directories beyond max_depth
                dir_count = 0
                file_count = 0
                
                for key, value in subtree.items():
                    if key == '__files__':
                        file_count += len(value)
                    else:
                        dir_count += 1
                        subdir_files = len(value.get('__files__', []))
                        file_count += subdir_files
                
                if dir_count or file_count:
                    result['__summary__'] = {
                        'directories': dir_count,
                        'files': file_count,
                    }
            
            return result
        
        return _simplify_recursive(tree, 0)
    
    def _calculate_file_stats(self) -> None:
        """
        Calculate statistics about file types and languages in the repository.
        """
        self.file_count_by_type = defaultdict(int)
        self.language_stats = defaultdict(int)
        
        for file_info in self.file_data:
            # Get file extension
            _, ext = os.path.splitext(file_info['path'])
            ext = ext.lower()
            if ext:
                self.file_count_by_type[ext] += 1
            
            # Count by language
            language = file_info.get('language')
            if language:
                self.language_stats[language] += 1
    
    def _detect_project_type(self) -> Dict[str, Any]:
        """
        Detect the type of project based on key files and directories.
        
        Returns:
            Dictionary with project type information
        """
        file_paths = [file_info['path'] for file_info in self.file_data]
        
        project_types = {
            'web_frontend': {
                'detected': False,
                'confidence': 0,
                'frameworks': [],
            },
            'web_backend': {
                'detected': False,
                'confidence': 0,
                'frameworks': [],
            },
            'mobile': {
                'detected': False,
                'confidence': 0,
                'platforms': [],
            },
            'desktop': {
                'detected': False,
                'confidence': 0,
                'frameworks': [],
            },
            'library': {
                'detected': False,
                'confidence': 0,
                'type': None,
            },
            'data_science': {
                'detected': False,
                'confidence': 0,
            },
        }
        
        # Check for web frontend frameworks
        if any(path.endswith('package.json') for path in file_paths):
            project_types['web_frontend']['detected'] = True
            project_types['web_frontend']['confidence'] += 30
            
            # Find package.json to detect specific frameworks
            for file_info in self.file_data:
                if file_info['path'].endswith('package.json'):
                    try:
                        with open(os.path.join(self.repo_path, file_info['path']), 'r') as f:
                            import json
                            pkg_data = json.load(f)
                            dependencies = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
                            
                            frameworks = []
                            if 'react' in dependencies:
                                frameworks.append('React')
                                project_types['web_frontend']['confidence'] += 20
                            if 'vue' in dependencies:
                                frameworks.append('Vue.js')
                                project_types['web_frontend']['confidence'] += 20
                            if 'angular' in dependencies or '@angular/core' in dependencies:
                                frameworks.append('Angular')
                                project_types['web_frontend']['confidence'] += 20
                            if 'svelte' in dependencies:
                                frameworks.append('Svelte')
                                project_types['web_frontend']['confidence'] += 20
                            
                            project_types['web_frontend']['frameworks'] = frameworks
                    except:
                        pass
        
        # Check for web backend frameworks
        if any(path.endswith('requirements.txt') for path in file_paths):
            project_types['web_backend']['detected'] = True
            project_types['web_backend']['confidence'] += 30
            
            # Find requirements.txt to detect specific frameworks
            for file_info in self.file_data:
                if file_info['path'].endswith('requirements.txt'):
                    try:
                        with open(os.path.join(self.repo_path, file_info['path']), 'r') as f:
                            content = f.read()
                            
                            frameworks = []
                            if 'django' in content.lower():
                                frameworks.append('Django')
                                project_types['web_backend']['confidence'] += 20
                            if 'flask' in content.lower():
                                frameworks.append('Flask')
                                project_types['web_backend']['confidence'] += 20
                            if 'fastapi' in content.lower():
                                frameworks.append('FastAPI')
                                project_types['web_backend']['confidence'] += 20
                            
                            project_types['web_backend']['frameworks'] = frameworks
                    except:
                        pass
        
        # Check for Node.js backend
        if any(path.endswith('package.json') for path in file_paths) and not project_types['web_frontend']['detected']:
            for file_info in self.file_data:
                if file_info['path'].endswith('package.json'):
                    try:
                        with open(os.path.join(self.repo_path, file_info['path']), 'r') as f:
                            import json
                            pkg_data = json.load(f)
                            dependencies = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
                            
                            frameworks = []
                            if 'express' in dependencies:
                                frameworks.append('Express')
                                project_types['web_backend']['detected'] = True
                                project_types['web_backend']['confidence'] += 50
                            if 'koa' in dependencies:
                                frameworks.append('Koa')
                                project_types['web_backend']['detected'] = True
                                project_types['web_backend']['confidence'] += 50
                            if 'nest' in dependencies or '@nestjs/core' in dependencies:
                                frameworks.append('NestJS')
                                project_types['web_backend']['detected'] = True
                                project_types['web_backend']['confidence'] += 50
                            
                            if frameworks:
                                project_types['web_backend']['frameworks'] = frameworks
                    except:
                        pass
        
        # Check for mobile app
        if any(path.endswith('AndroidManifest.xml') for path in file_paths):
            project_types['mobile']['detected'] = True
            project_types['mobile']['confidence'] += 40
            project_types['mobile']['platforms'].append('Android')
        
        if any(path.endswith('.xcodeproj') for path in file_paths) or any(path.endswith('Info.plist') for path in file_paths):
            project_types['mobile']['detected'] = True
            project_types['mobile']['confidence'] += 40
            project_types['mobile']['platforms'].append('iOS')
        
        # Check for React Native
        for file_info in self.file_data:
            if file_info['path'].endswith('package.json'):
                try:
                    with open(os.path.join(self.repo_path, file_info['path']), 'r') as f:
                        import json
                        pkg_data = json.load(f)
                        dependencies = {**pkg_data.get('dependencies', {}), **pkg_data.get('devDependencies', {})}
                        
                        if 'react-native' in dependencies:
                            project_types['mobile']['detected'] = True
                            project_types['mobile']['confidence'] += 60
                            project_types['mobile']['platforms'].append('React Native')
                except:
                    pass
        
        # Check for desktop app
        if any(path.endswith('electron') for path in file_paths):
            project_types['desktop']['detected'] = True
            project_types['desktop']['confidence'] += 50
            project_types['desktop']['frameworks'].append('Electron')
        
        # Check for library
        if any(path.endswith('setup.py') for path in file_paths) or any(path.endswith('pyproject.toml') for path in file_paths):
            project_types['library']['detected'] = True
            project_types['library']['confidence'] += 40
            project_types['library']['type'] = 'Python'
        
        if any(path.endswith('Cargo.toml') for path in file_paths):
            project_types['library']['detected'] = True
            project_types['library']['confidence'] += 40
            project_types['library']['type'] = 'Rust'
        
        # Check for data science project
        if any(path.endswith('.ipynb') for path in file_paths):
            project_types['data_science']['detected'] = True
            project_types['data_science']['confidence'] += 60
        
        if self.language_stats.get('python', 0) > 0:
            for file_info in self.file_data:
                if file_info['language'] == 'python':
                    try:
                        with open(os.path.join(self.repo_path, file_info['path']), 'r') as f:
                            content = f.read()
                            if any(lib in content for lib in ['import pandas', 'import numpy', 'import sklearn', 'import tensorflow', 'import torch']):
                                project_types['data_science']['detected'] = True
                                project_types['data_science']['confidence'] += 30
                                break
                    except:
                        continue
        
        # Return only detected project types
        return {k: v for k, v in project_types.items() if v['detected']}
    
    def _identify_important_directories(self) -> Dict[str, List[str]]:
        """
        Identify important directories in the repository based on common patterns.
        
        Returns:
            Dictionary mapping directory types to their paths
        """
        important_dirs = {
            'source': [],
            'tests': [],
            'docs': [],
            'config': [],
            'scripts': [],
            'static': [],
            'templates': [],
        }
        
        # Collect all directories
        all_dirs = set()
        for file_info in self.file_data:
            path = file_info['path']
            dirs = os.path.dirname(path).split(os.sep)
            for i in range(len(dirs)):
                all_dirs.add(os.sep.join(dirs[:i+1]))
        
        # Identify source directories
        common_source_dirs = ['src', 'app', 'lib', 'source', 'core']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name in common_source_dirs:
                important_dirs['source'].append(dir_path)
        
        # Identify test directories
        test_dirs = ['test', 'tests', 'spec', 'specs', '__tests__']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in test_dirs:
                important_dirs['tests'].append(dir_path)
        
        # Identify documentation directories
        doc_dirs = ['doc', 'docs', 'documentation', 'wiki']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in doc_dirs:
                important_dirs['docs'].append(dir_path)
        
        # Identify configuration directories
        config_dirs = ['config', 'conf', 'settings', '.github']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in config_dirs:
                important_dirs['config'].append(dir_path)
        
        # Identify script directories
        script_dirs = ['scripts', 'tools', 'bin', 'utils']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in script_dirs:
                important_dirs['scripts'].append(dir_path)
        
        # Identify static asset directories
        static_dirs = ['static', 'assets', 'public', 'dist', 'images', 'img', 'css', 'js']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in static_dirs:
                important_dirs['static'].append(dir_path)
        
        # Identify template directories
        template_dirs = ['templates', 'views', 'pages']
        for dir_path in all_dirs:
            dir_name = os.path.basename(dir_path)
            if dir_name.lower() in template_dirs:
                important_dirs['templates'].append(dir_path)
        
        # Filter out empty categories
        return {k: v for k, v in important_dirs.items() if v}
    
    def _create_module_map(self) -> Dict[str, Any]:
        """
        Create a map of modules and their relationships.
        
        Returns:
            Dictionary with module information
        """
        # Group files by directory
        modules = defaultdict(list)
        
        for file_info in self.file_data:
            dir_path = os.path.dirname(file_info['path'])
            modules[dir_path].append(file_info)
        
        # Create a more structured view of modules
        structured_modules = {}
        
        for module_path, files in modules.items():
            if not module_path:
                module_path = 'root'
                
            languages = defaultdict(int)
            file_count = len(files)
            total_size = 0
            
            for file in files:
                language = file.get('language')
                if language:
                    languages[language] += 1
                total_size += file.get('size', 0)
            
            structured_modules[module_path] = {
                'path': module_path,
                'file_count': file_count,
                'size': total_size,
                'languages': dict(languages),
                'main_language': max(languages.items(), key=lambda x: x[1])[0] if languages else None,
            }
        
        return structured_modules