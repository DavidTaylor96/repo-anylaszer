import re
import os
from typing import Dict, List, Any, Optional
import logging
from .generic_parser import GenericParser

logger = logging.getLogger(__name__)

class JavaScriptParser(GenericParser):
    """
    Parser for JavaScript files using regex-based parsing.
    For a production implementation, tree-sitter would be more robust.
    """
    
    def __init__(self, file_path: str):
        """
        Initialize the JavaScript parser.
        
        Args:
            file_path: Path to the JavaScript file
        """
        super().__init__(file_path)
        
        # Common patterns
        self.import_pattern = re.compile(
            r'(?:import\s+{([^}]*)}\s+from\s+[\'"]([^\'"]*)[\'"])|'  # import { something } from 'module'
            r'(?:import\s+(\w+)\s+from\s+[\'"]([^\'"]*)[\'"])|'      # import something from 'module'
            r'(?:import\s+\*\s+as\s+(\w+)\s+from\s+[\'"]([^\'"]*)[\'"])|'  # import * as something from 'module'
            r'(?:import\s+[\'"]([^\'"]*)[\'"])'                      # import 'module'
        )
        
        self.export_pattern = re.compile(
            r'export\s+(?:default\s+)?(?:const|let|var|function|class)\s+(\w+)'
        )
        
        self.function_pattern = re.compile(
            r'(?:function\s+(\w+)\s*\(([^)]*)\))|'                    # function name(params)
            r'(?:(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>)|'  # const name = (params) =>
            r'(?:(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function\s*\(([^)]*)\))'  # const name = function(params)
        )
        
        self.class_pattern = re.compile(
            r'class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{'
        )
        
        self.method_pattern = re.compile(
            r'(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*{'    # method(params) {
        )
        
        self.react_component_pattern = re.compile(
            r'(?:function\s+(\w+)\s*\((?:props|{[^}]*})\))|'  # function Component(props)
            r'(?:const\s+(\w+)\s*=\s*\((?:props|{[^}]*})\)\s*=>)'  # const Component = (props) =>
        )
        
        self.api_route_pattern = re.compile(
            r'(?:app|router)[.](?:get|post|put|delete|patch)\s*\(\s*[\'"]([^\'"]*)[\'"]'  # Express-style routes
        )
    
    def _extract_jsdoc_comment(self, line_number: int) -> Optional[str]:
        """
        Extract JSDoc comment above a given line.
        
        Args:
            line_number: Line number to look above
            
        Returns:
            JSDoc comment text or None if not found
        """
        if not self.content:
            return None
            
        lines = self.content.splitlines()
        if line_number <= 0 or line_number > len(lines):
            return None
            
        # Look for JSDoc-style comment above the line
        comment_lines = []
        current_line = line_number - 2  # -2 because line_number is 1-indexed, and we want to start one line above
        
        # Find the start of the comment block
        while current_line >= 0 and current_line < len(lines):
            line = lines[current_line].strip()
            if line.endswith('*/'):
                comment_lines.insert(0, line)
                break
            current_line -= 1
            
        # If we didn't find the end marker, no JSDoc comment
        if not comment_lines:
            return None
            
        # Collect the rest of the comment block
        current_line -= 1
        while current_line >= 0 and current_line < len(lines):
            line = lines[current_line].strip()
            comment_lines.insert(0, line)
            if line.startswith('/**'):
                # Clean up the comment
                comment = '\n'.join(comment_lines)
                # Remove comment markers
                comment = re.sub(r'/\*\*|\*/|^\s*\*', '', comment, flags=re.MULTILINE)
                return comment.strip()
            current_line -= 1
            
        return None
    
    def parse(self) -> Dict[str, Any]:
        """
        Parse the JavaScript file and extract detailed information.
        
        Returns:
            Dictionary with parsed information
        """
        if not self.content:
            return {'error': 'Could not read file'}
        
        # Get file summary
        summary = self.extract_file_summary()
        
        # Get imports
        imports = self.extract_imports()
        
        # Get functions
        functions = self.extract_functions()
        
        # Get classes
        classes = self.extract_classes()
        
        # Extract React components
        react_components = self.extract_react_components()
        
        # Extract API endpoints
        api_endpoints = self.extract_api_endpoints()
        
        return {
            'summary': summary,
            'imports': imports,
            'functions': functions,
            'classes': classes,
            'react_components': react_components,
            'api_endpoints': api_endpoints,
        }
    
    def extract_imports(self) -> List[Dict[str, Any]]:
        """
        Extract import statements from the JavaScript file.
        
        Returns:
            List of import statements with metadata
        """
        if not self.content:
            return []
            
        imports = []
        
        for line_number, line in enumerate(self.content.splitlines(), 1):
            for match in self.import_pattern.finditer(line):
                groups = match.groups()
                
                if groups[0]:  # import { something } from 'module'
                    module = groups[1]
                    items = [item.strip() for item in groups[0].split(',')]
                    for item in items:
                        # Handle "as" aliases
                        if ' as ' in item:
                            original, alias = item.split(' as ')
                            imports.append({
                                'type': 'named_import',
                                'name': original.strip(),
                                'alias': alias.strip(),
                                'module': module,
                                'line_number': line_number,
                            })
                        else:
                            imports.append({
                                'type': 'named_import',
                                'name': item,
                                'module': module,
                                'line_number': line_number,
                            })
                            
                elif groups[2]:  # import something from 'module'
                    imports.append({
                        'type': 'default_import',
                        'name': groups[2],
                        'module': groups[3],
                        'line_number': line_number,
                    })
                    
                elif groups[4]:  # import * as something from 'module'
                    imports.append({
                        'type': 'namespace_import',
                        'name': groups[4],
                        'module': groups[5],
                        'line_number': line_number,
                    })
                    
                elif groups[6]:  # import 'module'
                    imports.append({
                        'type': 'side_effect_import',
                        'module': groups[6],
                        'line_number': line_number,
                    })
        
        return imports
    
    def extract_functions(self) -> List[Dict[str, Any]]:
        """
        Extract function definitions from the JavaScript file.
        
        Returns:
            List of function definitions with metadata
        """
        if not self.content:
            return []
            
        functions = []
        
        for line_number, line in enumerate(self.content.splitlines(), 1):
            for match in self.function_pattern.finditer(line):
                groups = match.groups()
                
                function_name = groups[0] or groups[2] or groups[4]
                params_str = groups[1] or groups[3] or groups[5] or ''
                
                if function_name:
                    params = [param.strip() for param in params_str.split(',') if param.strip()]
                    
                    # Extract JSDoc
                    jsdoc = self._extract_jsdoc_comment(line_number)
                    
                    functions.append({
                        'name': function_name,
                        'params': params,
                        'line_number': line_number,
                        'jsdoc': jsdoc,
                    })
        
        return functions
    
    def extract_classes(self) -> List[Dict[str, Any]]:
        """
        Extract class definitions from the JavaScript file.
        
        Returns:
            List of class definitions with metadata
        """
        if not self.content:
            return []
            
        classes = []
        current_class = None
        
        lines = self.content.splitlines()
        for line_number, line in enumerate(lines, 1):
            # Look for class definitions
            class_match = self.class_pattern.search(line)
            if class_match:
                class_name, parent_class = class_match.groups()
                
                # Extract JSDoc
                jsdoc = self._extract_jsdoc_comment(line_number)
                
                current_class = {
                    'name': class_name,
                    'extends': parent_class,
                    'line_number': line_number,
                    'jsdoc': jsdoc,
                    'methods': [],
                }
                classes.append(current_class)
                continue
                
            # If inside a class, look for methods
            if current_class and '{' in line:
                method_match = self.method_pattern.search(line)
                if method_match:
                    method_name, params_str = method_match.groups()
                    params = [param.strip() for param in params_str.split(',') if param.strip()]
                    
                    # Skip constructor for inherited methods check
                    is_constructor = method_name == 'constructor'
                    
                    # Extract JSDoc
                    jsdoc = self._extract_jsdoc_comment(line_number)
                    
                    current_class['methods'].append({
                        'name': method_name,
                        'params': params,
                        'is_constructor': is_constructor,
                        'line_number': line_number,
                        'jsdoc': jsdoc,
                    })
        
        return classes
    
    def extract_react_components(self) -> List[Dict[str, Any]]:
        """
        Extract React component definitions from the JavaScript file.
        
        Returns:
            List of React component definitions with metadata
        """
        if not self.content:
            return []
            
        components = []
        
        # Check if this file uses React
        if 'import React' not in self.content and 'from "react"' not in self.content and 'from \'react\'' not in self.content:
            return []
            
        for line_number, line in enumerate(self.content.splitlines(), 1):
            match = self.react_component_pattern.search(line)
            if match:
                groups = match.groups()
                component_name = groups[0] or groups[1]
                
                if component_name:
                    # Extract JSDoc
                    jsdoc = self._extract_jsdoc_comment(line_number)
                    
                    # Look for prop types
                    prop_types = []
                    if component_name and f"{component_name}.propTypes" in self.content:
                        # Very basic prop types extraction - a more robust solution would use AST parsing
                        prop_types_pattern = re.compile(f"{component_name}.propTypes\\s*=\\s*{{([^}}]*)}}");
                        prop_types_match = prop_types_pattern.search(self.content)
                        if prop_types_match:
                            prop_types_str = prop_types_match.group(1)
                            # Extract prop names
                            for prop in re.finditer(r'(\w+)\s*:', prop_types_str):
                                prop_types.append(prop.group(1))
                    
                    components.append({
                        'name': component_name,
                        'line_number': line_number,
                        'jsdoc': jsdoc,
                        'prop_types': prop_types,
                    })
        
        return components
    
    def extract_api_endpoints(self) -> List[Dict[str, Any]]:
        """
        Extract API endpoints from the JavaScript file.
        
        Returns:
            List of API endpoints with metadata
        """
        if not self.content:
            return []
            
        endpoints = []
        
        for line_number, line in enumerate(self.content.splitlines(), 1):
            for match in self.api_route_pattern.finditer(line):
                route = match.group(1)
                
                # Extract HTTP method
                method_match = re.search(r'(?:app|router)[.](\w+)\s*\(', line)
                http_method = method_match.group(1).upper() if method_match else 'GET'
                
                endpoints.append({
                    'route': route,
                    'method': http_method,
                    'line_number': line_number,
                })
        
        return endpoints