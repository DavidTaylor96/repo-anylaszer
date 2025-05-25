import ast
import os
from typing import Dict, List, Any, Optional, Union, Tuple
import logging
from .generic_parser import GenericParser

logger = logging.getLogger(__name__)

class PythonParser(GenericParser):
    """
    Parser for Python files using the built-in ast module.
    """
    
    def __init__(self, file_path: str):
        """
        Initialize the Python parser.
        
        Args:
            file_path: Path to the Python file
        """
        super().__init__(file_path)
        self.ast_tree = None
        if self.content:
            try:
                self.ast_tree = ast.parse(self.content)
            except SyntaxError as e:
                logger.error(f"Syntax error in {file_path}: {e}")
    
    def _get_docstring(self, node: Union[ast.FunctionDef, ast.ClassDef, ast.Module]) -> Optional[str]:
        """
        Extract docstring from an AST node.
        
        Args:
            node: AST node to extract docstring from
            
        Returns:
            Docstring text or None if no docstring found
        """
        if not node.body:
            return None
            
        first_node = node.body[0]
        if isinstance(first_node, ast.Expr) and isinstance(first_node.value, ast.Str):
            return first_node.value.s.strip()
            
        return None
    
    def _get_function_info(self, node: ast.FunctionDef) -> Dict[str, Any]:
        """
        Extract information about a function definition.
        
        Args:
            node: AST function definition node
            
        Returns:
            Dictionary with function information
        """
        # Get docstring
        docstring = self._get_docstring(node)
        
        # Get arguments
        args = []
        for arg in node.args.args:
            arg_info = {'name': arg.arg}
            
            # Get type annotation if available
            if arg.annotation:
                if isinstance(arg.annotation, ast.Name):
                    arg_info['type'] = arg.annotation.id
                elif isinstance(arg.annotation, ast.Subscript):
                    # Handle things like List[str]
                    if isinstance(arg.annotation.value, ast.Name):
                        arg_info['type'] = arg.annotation.value.id
            
            args.append(arg_info)
        
        # Get return type annotation if available
        return_type = None
        if node.returns:
            if isinstance(node.returns, ast.Name):
                return_type = node.returns.id
            elif isinstance(node.returns, ast.Subscript):
                if isinstance(node.returns.value, ast.Name):
                    return_type = node.returns.value.id
        
        # Get decorators
        decorators = []
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Name):
                decorators.append(decorator.id)
            elif isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Name):
                decorators.append(decorator.func.id)
        
        # Check if it's a method
        is_method = False
        for parent in ast.walk(self.ast_tree):
            if isinstance(parent, ast.ClassDef) and any(
                isinstance(child, ast.FunctionDef) and child.name == node.name 
                for child in parent.body
            ):
                is_method = True
                break
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'end_line_number': node.end_lineno if hasattr(node, 'end_lineno') else None,
            'args': args,
            'return_type': return_type,
            'docstring': docstring,
            'decorators': decorators,
            'is_method': is_method,
        }
    
    def _get_class_info(self, node: ast.ClassDef) -> Dict[str, Any]:
        """
        Extract information about a class definition.
        
        Args:
            node: AST class definition node
            
        Returns:
            Dictionary with class information
        """
        # Get docstring
        docstring = self._get_docstring(node)
        
        # Get base classes
        bases = []
        for base in node.bases:
            if isinstance(base, ast.Name):
                bases.append(base.id)
        
        # Get methods
        methods = []
        class_variables = []
        
        for child in node.body:
            if isinstance(child, ast.FunctionDef):
                methods.append(self._get_function_info(child))
            elif isinstance(child, ast.Assign):
                for target in child.targets:
                    if isinstance(target, ast.Name):
                        class_variables.append({
                            'name': target.id,
                            'line_number': child.lineno,
                        })
        
        # Get decorators
        decorators = []
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Name):
                decorators.append(decorator.id)
            elif isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Name):
                decorators.append(decorator.func.id)
        
        return {
            'name': node.name,
            'line_number': node.lineno,
            'end_line_number': node.end_lineno if hasattr(node, 'end_lineno') else None,
            'bases': bases,
            'methods': methods,
            'class_variables': class_variables,
            'docstring': docstring,
            'decorators': decorators,
        }
    
    def parse(self) -> Dict[str, Any]:
        """
        Parse the Python file and extract detailed information.
        
        Returns:
            Dictionary with parsed information
        """
        if not self.ast_tree:
            return {'error': 'Could not parse file'}
        
        # Get file summary
        summary = self.extract_file_summary()
        
        # Get imports
        imports = self.extract_imports()
        
        # Get functions
        functions = self.extract_functions()
        
        # Get classes
        classes = self.extract_classes()
        
        # Get module-level docstring
        module_docstring = self._get_docstring(self.ast_tree)
        
        # Extract API patterns (e.g., Flask routes, Django views)
        api_endpoints = self.extract_api_endpoints()
        
        return {
            'summary': summary,
            'imports': imports,
            'functions': functions,
            'classes': classes,
            'module_docstring': module_docstring,
            'api_endpoints': api_endpoints,
        }
    
    def extract_imports(self) -> List[Dict[str, Any]]:
        """
        Extract import statements from the Python file.
        
        Returns:
            List of import statements with metadata
        """
        if not self.ast_tree:
            return []
        
        imports = []
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.Import):
                for name in node.names:
                    imports.append({
                        'type': 'import',
                        'name': name.name,
                        'alias': name.asname,
                        'line_number': node.lineno,
                    })
            elif isinstance(node, ast.ImportFrom):
                module = node.module if node.module else ''
                for name in node.names:
                    imports.append({
                        'type': 'from_import',
                        'module': module,
                        'name': name.name,
                        'alias': name.asname,
                        'line_number': node.lineno,
                    })
        
        return imports
    
    def extract_functions(self) -> List[Dict[str, Any]]:
        """
        Extract function definitions from the Python file.
        
        Returns:
            List of function definitions with metadata
        """
        if not self.ast_tree:
            return []
        
        functions = []
        
        # Get top-level functions (not methods inside classes)
        for node in self.ast_tree.body:
            if isinstance(node, ast.FunctionDef):
                functions.append(self._get_function_info(node))
        
        return functions
    
    def extract_classes(self) -> List[Dict[str, Any]]:
        """
        Extract class definitions from the Python file.
        
        Returns:
            List of class definitions with metadata
        """
        if not self.ast_tree:
            return []
        
        classes = []
        
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.ClassDef):
                classes.append(self._get_class_info(node))
        
        return classes
    
    def extract_api_endpoints(self) -> List[Dict[str, Any]]:
        """
        Extract API endpoints from common Python web frameworks.
        
        Returns:
            List of API endpoints with metadata
        """
        if not self.ast_tree:
            return []
        
        endpoints = []
        
        # Look for Flask route decorators
        for node in ast.walk(self.ast_tree):
            if isinstance(node, ast.FunctionDef):
                for decorator in node.decorator_list:
                    # Flask: @app.route('/path')
                    if (isinstance(decorator, ast.Call) and 
                        isinstance(decorator.func, ast.Attribute) and
                        decorator.func.attr == 'route' and
                        decorator.args):
                        
                        route = decorator.args[0].s if isinstance(decorator.args[0], ast.Str) else None
                        
                        if route:
                            methods = []
                            for keyword in decorator.keywords:
                                if keyword.arg == 'methods' and isinstance(keyword.value, ast.List):
                                    for elt in keyword.value.elts:
                                        if isinstance(elt, ast.Str):
                                            methods.append(elt.s)
                            
                            endpoints.append({
                                'type': 'flask',
                                'route': route,
                                'methods': methods if methods else ['GET'],
                                'function': node.name,
                                'line_number': node.lineno,
                            })
                    
                    # FastAPI: @app.get('/path')
                    elif (isinstance(decorator, ast.Call) and 
                          isinstance(decorator.func, ast.Attribute) and
                          decorator.func.attr in ['get', 'post', 'put', 'delete', 'patch', 'options'] and
                          decorator.args):
                        
                        route = decorator.args[0].s if isinstance(decorator.args[0], ast.Str) else None
                        
                        if route:
                            endpoints.append({
                                'type': 'fastapi',
                                'route': route,
                                'methods': [decorator.func.attr.upper()],
                                'function': node.name,
                                'line_number': node.lineno,
                            })
        
        # Look for Django patterns
        if any('django' in imp.get('module', '') for imp in self.extract_imports()):
            for node in ast.walk(self.ast_tree):
                # Django: urlpatterns = [...path('route/', view), ...]
                if (isinstance(node, ast.Assign) and 
                    any(target.id == 'urlpatterns' for target in node.targets if isinstance(target, ast.Name)) and
                    isinstance(node.value, ast.List)):
                    
                    for elt in node.value.elts:
                        if (isinstance(elt, ast.Call) and 
                            isinstance(elt.func, ast.Name) and
                            elt.func.id in ['path', 'url'] and
                            len(elt.args) >= 2):
                            
                            route = elt.args[0].s if isinstance(elt.args[0], ast.Str) else None
                            view = None
                            
                            if isinstance(elt.args[1], ast.Name):
                                view = elt.args[1].id
                            elif isinstance(elt.args[1], ast.Attribute):
                                view = f"{elt.args[1].value.id}.{elt.args[1].attr}"
                            
                            if route and view:
                                endpoints.append({
                                    'type': 'django',
                                    'route': route,
                                    'view': view,
                                    'line_number': node.lineno,
                                })
        
        return endpoints