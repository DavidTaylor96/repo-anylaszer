import re
import os
from typing import Dict, List, Any, Optional
import logging
from .javascript_parser import JavaScriptParser

logger = logging.getLogger(__name__)

class TypeScriptParser(JavaScriptParser):
    """
    Parser for TypeScript files, extending the JavaScript parser.
    Adds support for TypeScript-specific syntax like interfaces and types.
    """
    
    def __init__(self, file_path: str):
        """
        Initialize the TypeScript parser.
        
        Args:
            file_path: Path to the TypeScript file
        """
        super().__init__(file_path)
        
        # Additional TypeScript patterns
        self.interface_pattern = re.compile(
            r'interface\s+(\w+)(?:\s+extends\s+([^{]*))?'
        )
        
        self.type_pattern = re.compile(
            r'type\s+(\w+)\s*=\s*'
        )
        
        self.typed_function_pattern = re.compile(
            r'(?:function\s+(\w+)\s*\(([^)]*)\)\s*:\s*([^{]*))|'  # function name(params): returnType
            r'(?:(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*:\s*([^=]*)\s*=>)'  # const name = (params): returnType =>
        )
        
        self.decorator_pattern = re.compile(
            r'@(\w+)(?:\(([^)]*)\))?'
        )
    
    def parse(self) -> Dict[str, Any]:
        """
        Parse the TypeScript file and extract detailed information.
        
        Returns:
            Dictionary with parsed information
        """
        # Start with JavaScript parsing
        result = super().parse()
        
        # Add TypeScript-specific information
        interfaces = self.extract_interfaces()
        types = self.extract_types()
        decorators = self.extract_decorators()
        
        result['interfaces'] = interfaces
        result['types'] = types
        result['decorators'] = decorators
        
        # Enhance function and class info with type information
        self._enhance_functions_with_types(result['functions'])
        self._enhance_classes_with_types(result['classes'])
        
        return result
    
    def _enhance_functions_with_types(self, functions: List[Dict[str, Any]]) -> None:
        """
        Enhance function information with type annotations.
        
        Args:
            functions: List of function definitions to enhance
        """
        if not self.content:
            return
            
        for line_number, line in enumerate(self.content.splitlines(), 1):
            for match in self.typed_function_pattern.finditer(line):
                groups = match.groups()
                
                function_name = groups[0] or groups[3]
                params_str = groups[1] or groups[4] or ''
                return_type = groups[2] or groups[5] or ''
                
                if function_name:
                    # Find the corresponding function in our list
                    for func in functions:
                        if func['name'] == function_name and func['line_number'] == line_number:
                            # Extract parameter types
                            typed_params = []
                            for param in params_str.split(','):
                                param = param.strip()
                                if ':' in param:
                                    param_name, param_type = param.split(':', 1)
                                    typed_params.append({
                                        'name': param_name.strip(),
                                        'type': param_type.strip()
                                    })
                                elif param:
                                    typed_params.append({'name': param, 'type': None})
                                    
                            func['typed_params'] = typed_params
                            func['return_type'] = return_type.strip() if return_type else None
    
    def _enhance_classes_with_types(self, classes: List[Dict[str, Any]]) -> None:
        """
        Enhance class information with type annotations.
        
        Args:
            classes: List of class definitions to enhance
        """
        if not self.content or not classes:
            return
            
        lines = self.content.splitlines()
        
        for cls in classes:
            # Find class definition line
            class_line_idx = cls['line_number'] - 1  # Convert to 0-indexed
            
            # Find class body
            class_body_start = None
            open_braces = 0
            for i, line in enumerate(lines[class_line_idx:], class_line_idx):
                if '{' in line:
                    open_braces += line.count('{')
                    if class_body_start is None:
                        class_body_start = i
                
                if '}' in line:
                    open_braces -= line.count('}')
                    if open_braces == 0 and class_body_start is not None:
                        class_body_end = i
                        break
            
            if class_body_start is None:
                continue
                
            # Extract properties with types
            properties = []
            for i in range(class_body_start, class_body_end + 1):
                line = lines[i]
                # Look for class properties (not methods)
                prop_match = re.search(r'^\s*(?:readonly\s+)?(?:private\s+|public\s+|protected\s+)?(\w+)\s*:\s*([^;=]*)', line)
                if prop_match:
                    prop_name, prop_type = prop_match.groups()
                    if prop_name and not re.match(r'^\s*(?:constructor|get|set|static)\s+', line):
                        properties.append({
                            'name': prop_name,
                            'type': prop_type.strip(),
                            'line_number': i + 1,  # Convert back to 1-indexed
                        })
            
            cls['properties'] = properties
            
            # Enhance methods with type information
            for method in cls.get('methods', []):
                method_line = method['line_number'] - 1  # Convert to 0-indexed
                line = lines[method_line]
                
                # Look for return type
                return_type_match = re.search(r'(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*([^{]*)', line)
                if return_type_match:
                    method_name, return_type = return_type_match.groups()
                    if method_name == method['name']:
                        method['return_type'] = return_type.strip()
                
                # Look for parameter types
                params_match = re.search(r'(?:async\s+)?(\w+)\s*\(([^)]*)\)', line)
                if params_match:
                    method_name, params_str = params_match.groups()
                    if method_name == method['name']:
                        typed_params = []
                        for param in params_str.split(','):
                            param = param.strip()
                            if ':' in param:
                                param_name, param_type = param.split(':', 1)
                                typed_params.append({
                                    'name': param_name.strip(),
                                    'type': param_type.strip()
                                })
                            elif param:
                                typed_params.append({'name': param, 'type': None})
                                
                        method['typed_params'] = typed_params
    
    def extract_interfaces(self) -> List[Dict[str, Any]]:
        """
        Extract interface definitions from the TypeScript file.
        
        Returns:
            List of interface definitions with metadata
        """
        if not self.content:
            return []
            
        interfaces = []
        
        lines = self.content.splitlines()
        for line_number, line in enumerate(lines, 1):
            match = self.interface_pattern.search(line)
            if match:
                interface_name, extends_str = match.groups()
                
                # Extract JSDoc
                jsdoc = self._extract_jsdoc_comment(line_number)
                
                # Get extended interfaces
                extends = []
                if extends_str:
                    extends = [ext.strip() for ext in extends_str.split(',')]
                
                # Extract interface properties
                properties = []
                
                # Find interface body
                interface_body_start = None
                open_braces = 0
                for i, body_line in enumerate(lines[line_number - 1:], line_number):
                    if '{' in body_line:
                        open_braces += body_line.count('{')
                        if interface_body_start is None:
                            interface_body_start = i
                    
                    if '}' in body_line:
                        open_braces -= body_line.count('}')
                        if open_braces == 0 and interface_body_start is not None:
                            interface_body_end = i
                            break
                
                if interface_body_start:
                    for i in range(interface_body_start, interface_body_end + 1):
                        body_line = lines[i - 1]  # Convert back to 0-indexed
                        # Look for properties
                        prop_match = re.search(r'^\s*(?:readonly\s+)?(\w+)(?:\?)?:\s*([^;]*)', body_line)
                        if prop_match:
                            prop_name, prop_type = prop_match.groups()
                            properties.append({
                                'name': prop_name,
                                'type': prop_type.strip(),
                                'line_number': i,
                                'optional': '?' in body_line and '?' in body_line.split(prop_name)[1].split(':')[0]
                            })
                
                interfaces.append({
                    'name': interface_name,
                    'extends': extends,
                    'properties': properties,
                    'line_number': line_number,
                    'jsdoc': jsdoc,
                })
        
        return interfaces
    
    def extract_types(self) -> List[Dict[str, Any]]:
        """
        Extract type definitions from the TypeScript file.
        
        Returns:
            List of type definitions with metadata
        """
        if not self.content:
            return []
            
        types = []
        
        for line_number, line in enumerate(self.content.splitlines(), 1):
            match = self.type_pattern.search(line)
            if match:
                type_name = match.group(1)
                
                # Extract JSDoc
                jsdoc = self._extract_jsdoc_comment(line_number)
                
                # Extract type definition
                type_def = None
                
                # Look for the rest of the line after the type name
                rest_match = re.search(f"type\\s+{type_name}\\s*=\\s*(.+?)(;|$)", line)
                if rest_match:
                    type_def = rest_match.group(1).strip()
                
                types.append({
                    'name': type_name,
                    'definition': type_def,
                    'line_number': line_number,
                    'jsdoc': jsdoc,
                })
        
        return types
    
    def extract_decorators(self) -> List[Dict[str, Any]]:
        """
        Extract decorators from the TypeScript file.
        
        Returns:
            List of decorators with metadata
        """
        if not self.content:
            return []
            
        decorators = []
        
        for line_number, line in enumerate(self.content.splitlines(), 1):
            for match in self.decorator_pattern.finditer(line):
                decorator_name, args_str = match.groups()
                
                # Find the decorated element
                decorated_element = None
                
                # Check if it's a class or method decorator
                if line_number < len(self.content.splitlines()):
                    next_line = self.content.splitlines()[line_number]
                    
                    class_match = re.search(r'class\s+(\w+)', next_line)
                    method_match = re.search(r'(?:async\s+)?(\w+)\s*\(', next_line)
                    property_match = re.search(r'(?:private|public|protected)?\s*(\w+)\s*:', next_line)
                    
                    if class_match:
                        decorated_element = {
                            'type': 'class',
                            'name': class_match.group(1)
                        }
                    elif method_match:
                        decorated_element = {
                            'type': 'method',
                            'name': method_match.group(1)
                        }
                    elif property_match:
                        decorated_element = {
                            'type': 'property',
                            'name': property_match.group(1)
                        }
                
                decorators.append({
                    'name': decorator_name,
                    'args': args_str,
                    'line_number': line_number,
                    'decorated_element': decorated_element,
                })
        
        return decorators