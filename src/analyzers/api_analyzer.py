from typing import Dict, List, Any, Optional
import os
import logging
import re
from collections import defaultdict

logger = logging.getLogger(__name__)

class ApiAnalyzer:
    """
    Analyzes API endpoints and interfaces in a codebase.
    """
    
    def __init__(self, repo_path: str, file_data: List[Dict[str, Any]], parser_results: Dict[str, Any]):
        """
        Initialize the API analyzer.
        
        Args:
            repo_path: Path to the repository
            file_data: List of file metadata from RepoScanner
            parser_results: Dictionary of parsing results for each file
        """
        self.repo_path = repo_path
        self.file_data = file_data
        self.parser_results = parser_results
        self.api_endpoints = []
        self.interfaces = []
        self.rest_patterns = {
            'GET': re.compile(r'get|fetch|retrieve|list|search|find|query'),
            'POST': re.compile(r'create|add|insert|post|submit|upload'),
            'PUT': re.compile(r'update|edit|modify|change|replace|put'),
            'DELETE': re.compile(r'delete|remove|destroy'),
            'PATCH': re.compile(r'patch|partial|update'),
        }
    
    def analyze(self) -> Dict[str, Any]:
        """
        Analyze API endpoints and interfaces in the codebase.
        
        Returns:
            Dictionary with API analysis results
        """
        # Extract API endpoints from parser results
        self._extract_api_endpoints()
        
        # Extract interface definitions from parser results
        self._extract_interfaces()
        
        # Group endpoints by path/functionality
        grouped_endpoints = self._group_endpoints()
        
        # Identify API patterns
        api_patterns = self._identify_api_patterns()
        
        # Identify potential authentication/authorization mechanisms
        auth_info = self._identify_auth_mechanisms()
        
        # Create API documentation
        api_docs = self._generate_api_docs()
        
        return {
            'endpoints': self.api_endpoints,
            'grouped_endpoints': grouped_endpoints,
            'interfaces': self.interfaces,
            'patterns': api_patterns,
            'auth': auth_info,
            'documentation': api_docs,
        }
    
    def _extract_api_endpoints(self) -> None:
        """
        Extract API endpoints from parser results.
        """
        for file_path, parse_result in self.parser_results.items():
            # Check for endpoints in parser results
            if 'api_endpoints' in parse_result:
                for endpoint in parse_result['api_endpoints']:
                    # Add file information
                    endpoint['file_path'] = file_path
                    
                    # Get more details about the endpoint function/method
                    self._enrich_endpoint_info(endpoint, parse_result)
                    
                    self.api_endpoints.append(endpoint)
            
            # Look for GraphQL schema definitions
            if parse_result.get('language') == 'graphql' or '.graphql' in file_path or '.gql' in file_path:
                self._extract_graphql_definitions(file_path, parse_result)
            
            # Look for OpenAPI/Swagger definitions
            if 'swagger' in file_path.lower() or 'openapi' in file_path.lower() or 'api-spec' in file_path.lower():
                self._extract_openapi_definitions(file_path)
    
    def _enrich_endpoint_info(self, endpoint: Dict[str, Any], parse_result: Dict[str, Any]) -> None:
        """
        Add more information to an API endpoint based on the parser results.
        
        Args:
            endpoint: API endpoint information
            parse_result: Parser results for the file containing the endpoint
        """
        function_name = endpoint.get('function') or endpoint.get('view')
        if not function_name:
            return
        
        # Find the function/method in the parser results
        functions = parse_result.get('functions', [])
        for func in functions:
            if func['name'] == function_name:
                endpoint['params'] = func.get('args', [])
                endpoint['docstring'] = func.get('docstring') or func.get('jsdoc')
                endpoint['return_type'] = func.get('return_type')
                return
        
        # Check in classes for methods
        for cls in parse_result.get('classes', []):
            for method in cls.get('methods', []):
                if method['name'] == function_name:
                    endpoint['params'] = method.get('params', [])
                    endpoint['docstring'] = method.get('docstring') or method.get('jsdoc')
                    endpoint['return_type'] = method.get('return_type')
                    endpoint['class'] = cls['name']
                    return
    
    def _extract_graphql_definitions(self, file_path: Dict[str, Any], parse_result: Dict[str, Any]) -> None:
        """
        Extract GraphQL type definitions and operations.
        
        Args:
            file_path: Path to the file
            parse_result: Parser results for the file
        """
        # For now, just do a simple regex-based extraction
        try:
            with open(os.path.join(self.repo_path, file_path), 'r') as f:
                content = f.read()
                
                # Extract types
                type_matches = re.finditer(r'type\s+(\w+)(?:\s+implements\s+(\w+))?\s*{([^}]*)}', content)
                for match in type_matches:
                    type_name, implements, fields_str = match.groups()
                    fields = []
                    
                    # Parse fields
                    for field in fields_str.strip().split('\n'):
                        field = field.strip()
                        if field:
                            field_match = re.match(r'(\w+)(?:\(([^)]*)\))?\s*:\s*(\w+)', field)
                            if field_match:
                                field_name, args, field_type = field_match.groups()
                                fields.append({
                                    'name': field_name,
                                    'args': args,
                                    'type': field_type,
                                })
                    
                    self.interfaces.append({
                        'type': 'graphql_type',
                        'name': type_name,
                        'implements': implements,
                        'fields': fields,
                        'file_path': file_path,
                    })
                
                # Extract queries and mutations
                op_matches = re.finditer(r'(type|extend type)\s+(Query|Mutation)\s*{([^}]*)}', content)
                for match in op_matches:
                    op_type, op_name, op_fields_str = match.groups()
                    operations = []
                    
                    # Parse operations
                    for op in op_fields_str.strip().split('\n'):
                        op = op.strip()
                        if op:
                            op_match = re.match(r'(\w+)(?:\(([^)]*)\))?\s*:\s*(\w+)', op)
                            if op_match:
                                op_func, args, return_type = op_match.groups()
                                
                                # Parse arguments
                                arg_list = []
                                if args:
                                    for arg in args.split(','):
                                        arg = arg.strip()
                                        if arg:
                                            arg_match = re.match(r'(\w+)\s*:\s*(\w+)', arg)
                                            if arg_match:
                                                arg_name, arg_type = arg_match.groups()
                                                arg_list.append({
                                                    'name': arg_name,
                                                    'type': arg_type,
                                                })
                                
                                operations.append({
                                    'name': op_func,
                                    'args': arg_list,
                                    'return_type': return_type,
                                })
                    
                    for op in operations:
                        self.api_endpoints.append({
                            'type': 'graphql',
                            'operation': op_name.lower(),
                            'name': op['name'],
                            'args': op['args'],
                            'return_type': op['return_type'],
                            'file_path': file_path,
                        })
        except Exception as e:
            logger.error(f"Error extracting GraphQL definitions from {file_path}: {e}")
    
    def _extract_openapi_definitions(self, file_path: str) -> None:
        """
        Extract API definitions from OpenAPI/Swagger specification files.
        
        Args:
            file_path: Path to the OpenAPI specification file
        """
        try:
            # Check if it's a JSON or YAML file
            if file_path.endswith('.json'):
                import json
                with open(os.path.join(self.repo_path, file_path), 'r') as f:
                    spec = json.load(f)
            elif file_path.endswith(('.yaml', '.yml')):
                import yaml
                with open(os.path.join(self.repo_path, file_path), 'r') as f:
                    spec = yaml.safe_load(f)
            else:
                return
            
            # Check if it's an OpenAPI spec
            if 'swagger' not in spec and 'openapi' not in spec:
                return
            
            # Process the paths
            paths = spec.get('paths', {})
            for path, path_item in paths.items():
                for method, operation in path_item.items():
                    if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                        # Get operation parameters
                        parameters = operation.get('parameters', [])
                        param_list = []
                        
                        for param in parameters:
                            param_list.append({
                                'name': param.get('name'),
                                'type': param.get('type') or param.get('schema', {}).get('type'),
                                'in': param.get('in'),
                                'required': param.get('required', False),
                                'description': param.get('description'),
                            })
                        
                        # Get response info
                        responses = operation.get('responses', {})
                        response_info = {}
                        
                        for status, response in responses.items():
                            response_info[status] = {
                                'description': response.get('description'),
                                'schema': response.get('schema'),
                            }
                        
                        self.api_endpoints.append({
                            'type': 'openapi',
                            'path': path,
                            'method': method.upper(),
                            'operation_id': operation.get('operationId'),
                            'summary': operation.get('summary'),
                            'description': operation.get('description'),
                            'parameters': param_list,
                            'responses': response_info,
                            'file_path': file_path,
                        })
        except Exception as e:
            logger.error(f"Error extracting OpenAPI definitions from {file_path}: {e}")
    
    def _extract_interfaces(self) -> None:
        """
        Extract interface definitions from parser results.
        """
        for file_path, parse_result in self.parser_results.items():
            # Extract TypeScript interfaces
            if 'interfaces' in parse_result:
                for interface in parse_result['interfaces']:
                    interface['file_path'] = file_path
                    interface['language'] = 'typescript'
                    self.interfaces.append(interface)
            
            # Extract data classes and models
            if 'classes' in parse_result:
                for cls in parse_result['classes']:
                    # Check if it's a data class or model
                    is_data_class = False
                    
                    # Check for Python dataclasses
                    if 'decorators' in cls and 'dataclass' in cls['decorators']:
                        is_data_class = True
                    
                    # Check for Django models
                    if 'bases' in cls and any('Model' in base for base in cls['bases']):
                        is_data_class = True
                    
                    # Check for SQLAlchemy models
                    if 'class_variables' in cls and any('Column(' in str(var) for var in cls['class_variables']):
                        is_data_class = True
                    
                    if is_data_class:
                        # Convert to a common interface format
                        properties = []
                        
                        # Add class variables as properties
                        for var in cls.get('class_variables', []):
                            properties.append({
                                'name': var.get('name'),
                                'type': var.get('type'),
                            })
                        
                        # Look for property methods
                        for method in cls.get('methods', []):
                            if method.get('name').startswith('get_') or method.get('name').startswith('set_'):
                                properties.append({
                                    'name': method.get('name')[4:],  # Remove get_ or set_
                                    'type': method.get('return_type'),
                                })
                        
                        self.interfaces.append({
                            'type': 'data_class',
                            'name': cls['name'],
                            'language': parse_result.get('language'),
                            'properties': properties,
                            'file_path': file_path,
                            'docstring': cls.get('docstring'),
                        })
    
    def _group_endpoints(self) -> List[Dict[str, Any]]:
        """
        Group API endpoints by path or functionality.
        
        Returns:
            List of endpoint groups
        """
        # Group REST endpoints by path
        path_groups = defaultdict(list)
        
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                path = endpoint.get('path') or endpoint.get('route')
                if path:
                    # Remove path parameters for grouping
                    base_path = re.sub(r'<[^>]+>', '<param>', path)
                    base_path = re.sub(r':[^/]+', '<param>', base_path)
                    base_path = re.sub(r'{[^}]+}', '<param>', base_path)
                    
                    path_groups[base_path].append(endpoint)
        
        # Group GraphQL endpoints by type
        graphql_groups = defaultdict(list)
        
        for endpoint in self.api_endpoints:
            if endpoint.get('type') == 'graphql':
                group_key = f"GraphQL {endpoint.get('operation', 'operation')}"
                graphql_groups[group_key].append(endpoint)
        
        # Convert to list of groups
        groups = []
        
        for path, endpoints in path_groups.items():
            groups.append({
                'type': 'rest',
                'path': path,
                'endpoints': endpoints,
                'methods': [endpoint.get('method') for endpoint in endpoints],
            })
        
        for name, endpoints in graphql_groups.items():
            groups.append({
                'type': 'graphql',
                'name': name,
                'endpoints': endpoints,
            })
        
        return groups
    
    def _identify_api_patterns(self) -> Dict[str, Any]:
        """
        Identify common API patterns in the codebase.
        
        Returns:
            Dictionary with API pattern information
        """
        patterns = {
            'rest': False,
            'graphql': False,
            'rpc': False,
            'crud': False,
            'resource_based': False,
            'versioned': False,
        }
        
        # Check for REST APIs
        rest_count = 0
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                rest_count += 1
        
        if rest_count > 0:
            patterns['rest'] = True
        
        # Check for GraphQL
        graphql_count = sum(1 for endpoint in self.api_endpoints if endpoint.get('type') == 'graphql')
        if graphql_count > 0:
            patterns['graphql'] = True
        
        # Check for RPC-style endpoints
        rpc_count = 0
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                path = endpoint.get('path') or endpoint.get('route') or ''
                method = endpoint.get('method', '').upper()
                
                if method == 'POST' and '/rpc' in path or '/api/call' in path or '/execute' in path:
                    rpc_count += 1
        
        if rpc_count > 0:
            patterns['rpc'] = True
        
        # Check for CRUD patterns
        crud_endpoints = defaultdict(set)
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                path = endpoint.get('path') or endpoint.get('route') or ''
                method = endpoint.get('method', '').upper()
                
                # Extract resource name from path
                resource_match = re.search(r'/api/v?\d*/([^/]+)(?:/|$)', path)
                if resource_match:
                    resource = resource_match.group(1)
                    crud_endpoints[resource].add(method)
        
        # Check if any resource has at least 3 CRUD operations
        for resource, methods in crud_endpoints.items():
            if len(methods) >= 3 and 'GET' in methods:
                patterns['crud'] = True
                patterns['resource_based'] = True
                break
        
        # Check for versioned APIs
        version_count = 0
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                path = endpoint.get('path') or endpoint.get('route') or ''
                if re.search(r'/api/v\d+/', path) or re.search(r'/v\d+/', path):
                    version_count += 1
        
        if version_count > 0:
            patterns['versioned'] = True
        
        return patterns
    
    def _identify_auth_mechanisms(self) -> Dict[str, Any]:
        """
        Identify potential authentication/authorization mechanisms.
        
        Returns:
            Dictionary with authentication information
        """
        auth_info = {
            'mechanisms': set(),
            'middleware': [],
            'protected_endpoints': 0,
        }
        
        # Look for common auth keywords in files
        auth_keywords = {
            'jwt': 'JWT',
            'oauth': 'OAuth',
            'basic auth': 'Basic Auth',
            'api key': 'API Key',
            'session': 'Session',
            'cookie': 'Cookie',
            'token': 'Token',
            'authentication': 'Custom Authentication',
            'authorization': 'Custom Authorization',
        }
        
        for file_path, parse_result in self.parser_results.items():
            # Check for auth mechanisms in imports
            for imp in parse_result.get('imports', []):
                import_name = imp.get('name', '') or imp.get('module', '')
                for keyword, auth_type in auth_keywords.items():
                    if keyword in import_name.lower():
                        auth_info['mechanisms'].add(auth_type)
            
            # Check for auth decorators or middleware
            for decorator in parse_result.get('decorators', []):
                decorator_name = decorator.get('name', '').lower()
                if any(keyword in decorator_name for keyword in ['auth', 'login', 'permission', 'role']):
                    auth_info['middleware'].append({
                        'name': decorator.get('name'),
                        'file_path': file_path,
                    })
            
            # Check for auth-related functions and classes
            for func in parse_result.get('functions', []):
                func_name = func.get('name', '').lower()
                if any(keyword in func_name for keyword in ['auth', 'login', 'authenticate', 'authorize']):
                    auth_info['middleware'].append({
                        'name': func.get('name'),
                        'file_path': file_path,
                        'type': 'function',
                    })
            
            for cls in parse_result.get('classes', []):
                cls_name = cls.get('name', '').lower()
                if any(keyword in cls_name for keyword in ['auth', 'login', 'permission', 'role']):
                    auth_info['middleware'].append({
                        'name': cls.get('name'),
                        'file_path': file_path,
                        'type': 'class',
                    })
        
        # Count protected endpoints
        for endpoint in self.api_endpoints:
            # Check for auth in endpoint path or function name
            path = endpoint.get('path') or endpoint.get('route') or ''
            function = endpoint.get('function') or endpoint.get('view') or ''
            
            requires_auth = False
            
            # Check if the endpoint explicitly excludes auth
            if 'public' in path.lower() or 'public' in function.lower():
                requires_auth = False
            # Check for login/auth requirement
            elif any(keyword in path.lower() or keyword in function.lower() 
                    for keyword in ['secure', 'auth', 'login', 'private', 'admin']):
                requires_auth = True
            # Check for auth middleware in file
            elif any(middleware['file_path'] == endpoint.get('file_path') for middleware in auth_info['middleware']):
                requires_auth = True
            
            if requires_auth:
                auth_info['protected_endpoints'] += 1
        
        # Convert set to list for serialization
        auth_info['mechanisms'] = list(auth_info['mechanisms'])
        
        return auth_info
    
    def _generate_api_docs(self) -> List[Dict[str, Any]]:
        """
        Generate structured API documentation.
        
        Returns:
            List of API documentation sections
        """
        docs = []
        
        # Group endpoints by path for REST APIs
        rest_groups = defaultdict(list)
        for endpoint in self.api_endpoints:
            if endpoint.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']:
                path = endpoint.get('path') or endpoint.get('route')
                if path:
                    rest_groups[path].append(endpoint)
        
        # Create documentation for REST endpoints
        if rest_groups:
            rest_doc = {
                'title': 'REST API Endpoints',
                'type': 'rest',
                'endpoints': [],
            }
            
            for path, endpoints in rest_groups.items():
                # Sort endpoints by method
                endpoints.sort(key=lambda e: e.get('method', ''))
                
                endpoint_docs = []
                for endpoint in endpoints:
                    # Extract parameters
                    params = []
                    for param in endpoint.get('parameters', []) or endpoint.get('params', []) or []:
                        params.append({
                            'name': param.get('name'),
                            'type': param.get('type'),
                            'required': param.get('required', False),
                            'description': '',
                        })
                    
                    # Extract response information
                    response_info = endpoint.get('responses', {}) or {}
                    responses = []
                    for status, response in response_info.items():
                        responses.append({
                            'status': status,
                            'description': response.get('description', ''),
                        })
                    
                    endpoint_docs.append({
                        'method': endpoint.get('method', 'GET'),
                        'summary': endpoint.get('summary') or endpoint.get('function') or '',
                        'description': endpoint.get('description') or endpoint.get('docstring') or '',
                        'parameters': params,
                        'responses': responses,
                    })
                
                rest_doc['endpoints'].append({
                    'path': path,
                    'operations': endpoint_docs,
                })
            
            docs.append(rest_doc)
        
        # Create documentation for GraphQL endpoints
        graphql_endpoints = [e for e in self.api_endpoints if e.get('type') == 'graphql']
        if graphql_endpoints:
            graphql_doc = {
                'title': 'GraphQL API',
                'type': 'graphql',
                'operations': {
                    'queries': [],
                    'mutations': [],
                },
            }
            
            for endpoint in graphql_endpoints:
                operation = endpoint.get('operation', '')
                if operation == 'query':
                    graphql_doc['operations']['queries'].append({
                        'name': endpoint.get('name'),
                        'arguments': endpoint.get('args', []),
                        'return_type': endpoint.get('return_type', ''),
                    })
                elif operation == 'mutation':
                    graphql_doc['operations']['mutations'].append({
                        'name': endpoint.get('name'),
                        'arguments': endpoint.get('args', []),
                        'return_type': endpoint.get('return_type', ''),
                    })
            
            docs.append(graphql_doc)
        
        # Add interface documentation
        if self.interfaces:
            interface_doc = {
                'title': 'Data Models & Interfaces',
                'type': 'interfaces',
                'models': [],
            }
            
            for interface in self.interfaces:
                properties = []
                for prop in interface.get('properties', []):
                    properties.append({
                        'name': prop.get('name', ''),
                        'type': prop.get('type', ''),
                        'optional': prop.get('optional', False),
                    })
                
                interface_doc['models'].append({
                    'name': interface.get('name', ''),
                    'type': interface.get('type', ''),
                    'language': interface.get('language', ''),
                    'properties': properties,
                    'description': interface.get('docstring', ''),
                })
            
            docs.append(interface_doc)
        
        return docs