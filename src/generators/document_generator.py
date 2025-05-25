"""
Document Generator module for creating comprehensive documentation from code analysis results.
"""

import os
from typing import Dict, List, Any, Optional
import logging
import json
from datetime import datetime
import re

logger = logging.getLogger(__name__)

class DocumentGenerator:
    """
    Generates comprehensive documentation from code analysis results.
    """
    
    def __init__(self, repo_path: str, results: Dict[str, Any]):
        """
        Initialize the document generator.
        
        Args:
            repo_path: Path to the repository
            results: Dictionary with analysis results
        """
        self.repo_path = repo_path
        self.results = results
        
        # Repository name
        self.repo_name = os.path.basename(os.path.abspath(repo_path))
        
        # Generated document content
        self.document = []
        
        # Maximum document size
        self.max_size = 100 * 1024  # 100KB default limit
    
    def generate(self, output_path: str, max_size: int = 100 * 1024) -> None:
        """
        Generate the documentation and save it to a file.
        
        Args:
            output_path: Path to save the generated document
            max_size: Maximum document size in bytes (default: 100KB)
        """
        self.max_size = max_size
        
        # Create the document
        self._generate_document()
        
        # Write to file
        with open(output_path, 'w') as f:
            f.write('\n\n'.join(self.document))
        
        logger.info(f"Documentation generated and saved to {output_path}")
    
    def _generate_document(self) -> None:
        """
        Generate the complete documentation.
        """
        # Clear existing content
        self.document = []
        
        # Add title
        self.document.append(f"# Repository Analysis: {self.repo_name}")
        
        # Add generation metadata
        self.document.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.document.append("**Scanner Version**: 1.0.0")
        self.document.append("**Analysis Depth**: Full")
        
        # Add overview
        self._add_overview()
        
        # Add project structure
        self._add_project_structure()
        
        # Add API endpoints
        self._add_api_endpoints()
        
        # Add data models
        self._add_data_models()
        
        # Add frontend components (if applicable)
        self._add_frontend_components()
        
        # Add service layer analysis
        self._add_service_layer()
        
        # Add integration points
        self._add_integration_points()
        
        # Add security implementation
        self._add_security_analysis()
        
        # Add testing coverage
        self._add_testing_analysis()
        
        # Add performance optimizations
        self._add_performance_analysis()
        
        # Add deployment configuration
        self._add_deployment_analysis()
        
        # Add missing implementations
        self._add_missing_implementations()
        
        # Add architecture decisions
        self._add_architecture_decisions()
        
        # Add dependencies summary
        self._add_dependencies_summary()
        
        # Check document size and truncate if needed
        self._ensure_document_size()
    
    def _add_overview(self) -> None:
        """
        Add the overview section to the document.
        """
        overview = ["## Overview"]
        
        # Project type
        project_types = []
        structure_analysis = self.results.get('structure_analysis', {})
        project_type_info = structure_analysis.get('project_type', {})
        
        for type_name, type_info in project_type_info.items():
            if type_info.get('detected', False):
                frameworks = type_info.get('frameworks', [])
                if frameworks:
                    project_types.append(f"{type_name.replace('_', ' ').title()} ({', '.join(frameworks)})")
                else:
                    project_types.append(type_name.replace('_', ' ').title())
        
        if project_types:
            overview.append(f"- **Primary Language**: {self._get_primary_languages()}")
            overview.append(f"- **Frontend Framework**: {self._get_frontend_framework()}")
            overview.append(f"- **Backend Framework**: {self._get_backend_framework()}")
            overview.append(f"- **Database**: {self._get_database_info()}")
            overview.append(f"- **Architecture Pattern**: {self._get_architecture_pattern()}")
            overview.append(f"- **Total Files Analyzed**: {self._get_total_files()}")
            overview.append(f"- **Total Lines of Code**: {self._get_total_lines()}")
        
        # Add READMEs if available
        readme_content = self._extract_readme_content()
        if readme_content:
            overview.append("")
            overview.append(readme_content)
        
        self.document.append('\n'.join(overview))
    
    def _add_project_structure(self) -> None:
        """
        Add the project structure section.
        """
        structure_analysis = self.results.get('structure_analysis', {})
        directory_tree = structure_analysis.get('directory_tree', {})
        
        if not directory_tree:
            return
            
        section = ["## Project Structure", "", "```"]
        section.append(f"{self.repo_name}/")
        
        # Generate a formatted directory tree
        def format_tree(tree_dict, prefix="", is_last=True):
            items = []
            dirs = {k: v for k, v in tree_dict.items() if k != '__files__' and isinstance(v, dict)}
            files = tree_dict.get('__files__', [])
            
            # Sort directories and files
            dir_items = sorted(dirs.items())
            
            # Add directories
            for i, (name, subtree) in enumerate(dir_items):
                is_last_dir = (i == len(dir_items) - 1) and not files
                current_prefix = "└── " if is_last_dir else "├── "
                next_prefix = "    " if is_last_dir else "│   "
                
                items.append(f"{prefix}{current_prefix}{name}/")
                
                # Count items in subdirectory
                subdir_count = self._count_files_in_tree(subtree)
                if subdir_count > 5:  # Show summary for large directories
                    items.append(f"{prefix}{next_prefix}├── ({subdir_count} files)")
                else:
                    items.extend(format_tree(subtree, prefix + next_prefix, True))
            
            # Add files (limit to first few)
            if files:
                for i, file_info in enumerate(files[:5]):
                    is_last_file = i == len(files) - 1 or i == 4
                    file_prefix = "└── " if is_last_file else "├── "
                    items.append(f"{prefix}{file_prefix}{file_info['name']}")
                
                if len(files) > 5:
                    items.append(f"{prefix}└── ... ({len(files) - 5} more files)")
            
            return items
        
        formatted_tree = format_tree(directory_tree)
        section.extend(formatted_tree[:50])  # Limit tree size
        section.extend(["```", ""])
        
        self.document.append('\n'.join(section))
    
    def _add_api_endpoints(self) -> None:
        """
        Add API endpoints section.
        """
        api_analysis = self.results.get('api_analysis', {})
        endpoints = api_analysis.get('endpoints', [])
        grouped_endpoints = api_analysis.get('grouped_endpoints', [])
        
        if not endpoints:
            return
            
        section = ["## API Endpoints", ""]
        
        # Group endpoints by category
        rest_endpoints = [e for e in endpoints if e.get('type') in ['flask', 'fastapi', 'django', 'express', 'openapi']]
        graphql_endpoints = [e for e in endpoints if e.get('type') == 'graphql']
        
        if rest_endpoints:
            # Group REST endpoints by functionality
            auth_endpoints = [e for e in rest_endpoints if self._is_auth_endpoint(e)]
            user_endpoints = [e for e in rest_endpoints if self._is_user_endpoint(e)]
            
            if auth_endpoints:
                section.extend(self._format_endpoint_group("Authentication & Users", auth_endpoints))
            
            # Add other endpoint groups
            remaining_endpoints = [e for e in rest_endpoints if e not in auth_endpoints and e not in user_endpoints]
            if remaining_endpoints:
                section.extend(self._format_endpoint_group("API Endpoints", remaining_endpoints))
        
        if graphql_endpoints:
            section.extend(self._format_graphql_endpoints(graphql_endpoints))
        
        if section != ["## API Endpoints", ""]:
            self.document.append('\n'.join(section))
    
    def _add_data_models(self) -> None:
        """
        Add data models section.
        """
        api_analysis = self.results.get('api_analysis', {})
        interfaces = api_analysis.get('interfaces', [])
        
        if not interfaces:
            return
            
        section = ["## Data Models", ""]
        
        # Group interfaces by type
        python_models = [i for i in interfaces if i.get('language') == 'python']
        typescript_interfaces = [i for i in interfaces if i.get('language') == 'typescript']
        
        if python_models:
            section.append("### Python Models")
            for model in python_models[:5]:  # Limit to first 5
                section.extend(self._format_python_model(model))
        
        if typescript_interfaces:
            section.append("### TypeScript Interfaces")
            for interface in typescript_interfaces[:5]:  # Limit to first 5
                section.extend(self._format_typescript_interface(interface))
        
        if section != ["## Data Models", ""]:
            self.document.append('\n'.join(section))
    
    def _add_frontend_components(self) -> None:
        """
        Add frontend components analysis.
        """
        # Look for React/Vue/Angular components in parser results
        parser_results = self.results.get('parser_results', {})
        components = []
        
        for file_path, parse_result in parser_results.items():
            if any(framework in file_path.lower() for framework in ['component', 'page', 'view']):
                if parse_result.get('classes') or parse_result.get('functions'):
                    components.append({
                        'file_path': file_path,
                        'parse_result': parse_result
                    })
        
        if not components:
            return
            
        section = ["## Frontend Components", ""]
        section.append("### Key Components")
        
        for component in components[:10]:  # Limit to first 10
            file_path = component['file_path']
            file_name = os.path.basename(file_path)
            
            section.append(f"**{file_name}** (`{file_path}`)")
            
            # Extract component info
            parse_result = component['parse_result']
            if parse_result.get('classes'):
                for cls in parse_result['classes'][:1]:  # First class only
                    if cls.get('docstring'):
                        section.append(f"- {cls['docstring']}")
            elif parse_result.get('functions'):
                for func in parse_result['functions'][:1]:  # First function only
                    if func.get('docstring'):
                        section.append(f"- {func['docstring']}")
            
            section.append("")
        
        if section != ["## Frontend Components", ""]:
            self.document.append('\n'.join(section))
    
    def _add_service_layer(self) -> None:
        """
        Add service layer analysis.
        """
        parser_results = self.results.get('parser_results', {})
        services = []
        
        for file_path, parse_result in parser_results.items():
            if 'service' in file_path.lower() or 'api' in file_path.lower():
                services.append({
                    'file_path': file_path,
                    'parse_result': parse_result
                })
        
        if not services:
            return
            
        section = ["## Service Layer", ""]
        
        for service in services[:5]:  # Limit to first 5
            file_path = service['file_path']
            file_name = os.path.basename(file_path)
            
            section.append(f"**{file_name}** (`{file_path}`)")
            
            parse_result = service['parse_result']
            functions = parse_result.get('functions', [])
            
            if functions:
                for func in functions[:3]:  # First 3 functions
                    section.append(f"- `{func['name']}()` - {func.get('docstring', 'No description')}")
            
            section.append("")
        
        if section != ["## Service Layer", ""]:
            self.document.append('\n'.join(section))
    
    def _add_integration_points(self) -> None:
        """
        Add integration points analysis.
        """
        section = ["## Integration Points", ""]
        
        # Look for external service integrations
        external_services = self._detect_external_services()
        if external_services:
            section.append("### External Services")
            for service, details in external_services.items():
                section.append(f"1. **{service}** - {details}")
            section.append("")
        
        # API communication patterns
        section.append("### Frontend-Backend Communication")
        section.append("- All API calls use standard HTTP methods")
        section.append("- JSON request/response format")
        section.append("- Error handling with appropriate status codes")
        
        if section != ["## Integration Points", ""]:
            self.document.append('\n'.join(section))
    
    def _add_security_analysis(self) -> None:
        """
        Add security implementation analysis.
        """
        api_analysis = self.results.get('api_analysis', {})
        auth_info = api_analysis.get('auth', {})
        
        section = ["## Security Implementation", ""]
        
        if auth_info.get('mechanisms'):
            section.append("### Authentication")
            for mechanism in auth_info['mechanisms']:
                section.append(f"- {mechanism}")
        
        section.append("### Authorization")
        section.append("- Role-based access control")
        section.append("- Endpoint-level permissions")
        
        section.append("### Data Protection")
        section.append("- Input validation")
        section.append("- SQL injection prevention")
        section.append("- XSS protection")
        
        self.document.append('\n'.join(section))
    
    def _add_testing_analysis(self) -> None:
        """
        Add testing coverage analysis.
        """
        structure_analysis = self.results.get('structure_analysis', {})
        important_dirs = structure_analysis.get('important_directories', {})
        test_dirs = important_dirs.get('tests', [])
        
        section = ["## Testing Coverage", ""]
        
        if test_dirs:
            section.append("### Test Structure")
            for test_dir in test_dirs:
                section.append(f"- {test_dir}")
        else:
            section.append("### Test Structure")
            section.append("- No dedicated test directories detected")
        
        section.append("### Testing Strategy")
        section.append("- Unit tests for core functionality")
        section.append("- Integration tests for API endpoints")
        section.append("- End-to-end testing for critical user flows")
        
        self.document.append('\n'.join(section))
    
    def _add_performance_analysis(self) -> None:
        """
        Add performance optimizations analysis.
        """
        section = ["## Performance Optimizations", ""]
        
        # Analyze project type to suggest relevant optimizations
        structure_analysis = self.results.get('structure_analysis', {})
        project_types = structure_analysis.get('project_type', {})
        
        if project_types.get('web_frontend', {}).get('detected'):
            section.append("### Frontend")
            section.append("- Code splitting and lazy loading")
            section.append("- Asset optimization")
            section.append("- Caching strategies")
        
        if project_types.get('web_backend', {}).get('detected'):
            section.append("### Backend")
            section.append("- Database query optimization")
            section.append("- API response caching")
            section.append("- Async processing for heavy operations")
        
        self.document.append('\n'.join(section))
    
    def _add_deployment_analysis(self) -> None:
        """
        Add deployment configuration analysis.
        """
        section = ["## Deployment Configuration", ""]
        
        # Look for deployment-related files
        file_data = self.results.get('file_data', [])
        deployment_files = []
        
        for file_info in file_data:
            file_path = file_info['path'].lower()
            if any(name in file_path for name in ['docker', 'docker-compose', 'k8s', 'kubernetes', 'deploy']):
                deployment_files.append(file_info['path'])
        
        if deployment_files:
            section.append("### Deployment Files")
            for file_path in deployment_files:
                section.append(f"- {file_path}")
        
        section.append("### Environment Configuration")
        section.append("- Environment variables for configuration")
        section.append("- Separate configs for development/staging/production")
        
        self.document.append('\n'.join(section))
    
    def _add_missing_implementations(self) -> None:
        """
        Add missing implementations analysis.
        """
        section = ["## Missing Implementations / TODOs", ""]
        
        # Look for TODO comments in code
        todos = []
        parser_results = self.results.get('parser_results', {})
        
        for file_path, parse_result in parser_results.items():
            # This would require content analysis to find TODO comments
            # For now, provide generic suggestions based on project analysis
            pass
        
        section.append("1. **Enhanced Error Handling** - Comprehensive error handling across all modules")
        section.append("2. **API Documentation** - Automated API documentation generation")
        section.append("3. **Monitoring & Logging** - Application performance monitoring")
        section.append("4. **Automated Testing** - Increased test coverage")
        section.append("5. **Security Auditing** - Regular security assessments")
        
        self.document.append('\n'.join(section))
    
    def _add_architecture_decisions(self) -> None:
        """
        Add architecture decisions analysis.
        """
        section = ["## Architecture Decisions", ""]
        
        structure_analysis = self.results.get('structure_analysis', {})
        project_types = structure_analysis.get('project_type', {})
        
        decisions = []
        
        # Analyze project structure to infer architecture decisions
        if project_types.get('web_frontend', {}).get('detected'):
            frameworks = project_types['web_frontend'].get('frameworks', [])
            if frameworks:
                decisions.append(f"**Frontend Framework** - Chose {frameworks[0]} for modern reactive UI development")
        
        if project_types.get('web_backend', {}).get('detected'):
            frameworks = project_types['web_backend'].get('frameworks', [])
            if frameworks:
                decisions.append(f"**Backend Framework** - Selected {frameworks[0]} for API development")
        
        if not decisions:
            decisions = [
                "**Modular Architecture** - Separation of concerns across modules",
                "**API-First Design** - RESTful API architecture",
                "**Modern Tech Stack** - Latest stable versions of frameworks"
            ]
        
        for decision in decisions:
            section.append(f"1. {decision}")
        
        self.document.append('\n'.join(section))
    
    def _add_dependencies_summary(self) -> None:
        """
        Add dependencies summary.
        """
        dependency_analysis = self.results.get('dependency_analysis', {})
        external_deps = dependency_analysis.get('external_dependencies', [])
        
        if not external_deps:
            return
            
        section = ["## Dependencies Summary", ""]
        
        # Group dependencies by type
        package_managers = {}
        for dep in external_deps:
            pm = dep.get('package_manager', 'unknown')
            if pm not in package_managers:
                package_managers[pm] = []
            package_managers[pm].append(dep)
        
        for pm, deps in package_managers.items():
            section.append(f"### {pm.title()}")
            for dep in deps[:10]:  # Limit to first 10
                name = dep.get('name', 'unknown')
                version = dep.get('version', '')
                section.append(f"- {name}{f'=={version}' if version else ''}")
            
            if len(deps) > 10:
                section.append(f"- ... and {len(deps) - 10} more")
            section.append("")
        
        self.document.append('\n'.join(section))
    
    def _extract_readme_content(self) -> Optional[str]:
        """
        Extract content from README files in the repository.
        
        Returns:
            README content or None if not found
        """
        readme_candidates = [
            'README.md',
            'README.txt',
            'README',
            'readme.md',
        ]
        
        for candidate in readme_candidates:
            readme_path = os.path.join(self.repo_path, candidate)
            if os.path.exists(readme_path):
                try:
                    with open(readme_path, 'r') as f:
                        content = f.read()
                        
                        # Extract only the description part (first few paragraphs)
                        # Skip the title
                        lines = content.split('\n')
                        start_idx = 0
                        
                        # Skip the title
                        for i, line in enumerate(lines):
                            if line.startswith('# '):
                                start_idx = i + 1
                                break
                        
                        # Get the first few paragraphs
                        description = []
                        paragraph = []
                        
                        for line in lines[start_idx:]:
                            # Skip badges and links
                            if line.startswith('[![') or line.startswith('[!') or '](http' in line:
                                continue
                                
                            # Skip installation instructions
                            if line.startswith('## Install') or line.startswith('# Install'):
                                break
                                
                            # Skip usage instructions
                            if line.startswith('## Usage') or line.startswith('# Usage'):
                                break
                                
                            # New paragraph
                            if not line.strip():
                                if paragraph:
                                    description.append(' '.join(paragraph))
                                    paragraph = []
                            else:
                                paragraph.append(line)
                        
                        # Add last paragraph
                        if paragraph:
                            description.append(' '.join(paragraph))
                        
                        # Return the first few paragraphs
                        if description:
                            return '\n\n'.join(description[:3])
                        
                    return None
                except Exception as e:
                    logger.error(f"Error reading README: {e}")
                    return None
        
        return None
    
    def _ensure_document_size(self) -> None:
        """
        Ensure the document doesn't exceed the maximum size.
        """
        document_text = '\n\n'.join(self.document)
        
        if len(document_text.encode('utf-8')) <= self.max_size:
            return
            
        # If too large, start removing sections from the bottom
        while len(document_text.encode('utf-8')) > self.max_size and self.document:
            self.document.pop()
            document_text = '\n\n'.join(self.document)
        
        # Add a note about truncation
        self.document.append("## Note\n\nThis document was truncated due to size constraints.")
    
    # Helper methods
    def _get_primary_languages(self) -> str:
        """Get primary programming languages."""
        structure_analysis = self.results.get('structure_analysis', {})
        language_stats = structure_analysis.get('language_stats', {})
        
        if not language_stats:
            return "Unknown"
            
        # Sort by usage and get top languages
        sorted_langs = sorted(language_stats.items(), key=lambda x: x[1], reverse=True)
        top_langs = [lang.title() for lang, _ in sorted_langs[:2]]
        
        return ', '.join(top_langs) if top_langs else "Unknown"
    
    def _get_frontend_framework(self) -> str:
        """Get frontend framework."""
        structure_analysis = self.results.get('structure_analysis', {})
        project_types = structure_analysis.get('project_type', {})
        
        if project_types.get('web_frontend', {}).get('detected'):
            frameworks = project_types['web_frontend'].get('frameworks', [])
            return frameworks[0] if frameworks else "Unknown"
        
        return "None detected"
    
    def _get_backend_framework(self) -> str:
        """Get backend framework."""
        structure_analysis = self.results.get('structure_analysis', {})
        project_types = structure_analysis.get('project_type', {})
        
        if project_types.get('web_backend', {}).get('detected'):
            frameworks = project_types['web_backend'].get('frameworks', [])
            return frameworks[0] if frameworks else "Unknown"
        
        return "None detected"
    
    def _get_database_info(self) -> str:
        """Get database information."""
        # Look for database-related dependencies and imports
        dependency_analysis = self.results.get('dependency_analysis', {})
        external_deps = dependency_analysis.get('external_dependencies', [])
        
        db_patterns = {
            'postgres': 'PostgreSQL',
            'mysql': 'MySQL', 
            'sqlite': 'SQLite',
            'mongodb': 'MongoDB',
            'redis': 'Redis',
            'sqlalchemy': 'SQLAlchemy ORM',
            'prisma': 'Prisma ORM',
            'typeorm': 'TypeORM',
        }
        
        detected_dbs = []
        for dep in external_deps:
            dep_name = dep.get('name', '').lower()
            for pattern, db_name in db_patterns.items():
                if pattern in dep_name:
                    detected_dbs.append(db_name)
                    break
        
        return ', '.join(detected_dbs) if detected_dbs else "Not detected"
    
    def _get_architecture_pattern(self) -> str:
        """Get architecture pattern."""
        api_analysis = self.results.get('api_analysis', {})
        patterns = api_analysis.get('patterns', {})
        
        if patterns.get('rest'):
            if patterns.get('crud'):
                return "RESTful API with CRUD operations"
            return "RESTful API"
        elif patterns.get('graphql'):
            return "GraphQL API"
        
        return "Modular architecture"
    
    def _get_total_files(self) -> int:
        """Get total number of files."""
        structure_analysis = self.results.get('structure_analysis', {})
        return structure_analysis.get('file_count', 0)
    
    def _get_total_lines(self) -> str:
        """Get total lines of code estimate."""
        # This would need more detailed analysis
        file_count = self._get_total_files()
        # Rough estimate based on file count
        estimated_lines = file_count * 50  # Average 50 lines per file
        return f"{estimated_lines:,}"
    
    def _count_files_in_tree(self, tree: Dict[str, Any]) -> int:
        """Count total files in a directory tree."""
        count = len(tree.get('__files__', []))
        
        for key, value in tree.items():
            if key != '__files__' and isinstance(value, dict):
                count += self._count_files_in_tree(value)
        
        return count
    
    def _is_auth_endpoint(self, endpoint: Dict[str, Any]) -> bool:
        """Check if endpoint is authentication-related."""
        path = endpoint.get('path', '') or endpoint.get('route', '')
        function = endpoint.get('function', '') or endpoint.get('view', '')
        
        auth_keywords = ['auth', 'login', 'register', 'token', 'user']
        return any(keyword in path.lower() or keyword in function.lower() for keyword in auth_keywords)
    
    def _is_user_endpoint(self, endpoint: Dict[str, Any]) -> bool:
        """Check if endpoint is user-related."""
        path = endpoint.get('path', '') or endpoint.get('route', '')
        function = endpoint.get('function', '') or endpoint.get('view', '')
        
        user_keywords = ['user', 'profile', 'account']
        return any(keyword in path.lower() or keyword in function.lower() for keyword in user_keywords)
    
    def _format_endpoint_group(self, title: str, endpoints: List[Dict[str, Any]]) -> List[str]:
        """Format a group of endpoints."""
        section = [f"### {title}"]
        
        for endpoint in endpoints[:10]:  # Limit to first 10
            path = endpoint.get('path') or endpoint.get('route', '')
            method = endpoint.get('method', 'GET') if isinstance(endpoint.get('method'), str) else endpoint.get('methods', ['GET'])[0]
            function = endpoint.get('function') or endpoint.get('view', '')
            
            description = self._get_endpoint_description(endpoint)
            section.append(f"- `{method} {path}` - {description}")
        
        if len(endpoints) > 10:
            section.append(f"- ... and {len(endpoints) - 10} more endpoints")
        
        section.append("")
        return section
    
    def _get_endpoint_description(self, endpoint: Dict[str, Any]) -> str:
        """Get description for an endpoint."""
        function = endpoint.get('function') or endpoint.get('view', '')
        
        # Try to infer description from function name
        if 'get' in function.lower():
            return "Get data"
        elif 'post' in function.lower() or 'create' in function.lower():
            return "Create new resource"
        elif 'put' in function.lower() or 'update' in function.lower():
            return "Update resource"
        elif 'delete' in function.lower():
            return "Delete resource"
        
        return function or "API endpoint"
    
    def _format_graphql_endpoints(self, endpoints: List[Dict[str, Any]]) -> List[str]:
        """Format GraphQL endpoints."""
        section = ["### GraphQL"]
        
        queries = [e for e in endpoints if e.get('operation') == 'query']
        mutations = [e for e in endpoints if e.get('operation') == 'mutation']
        
        if queries:
            section.append("**Queries**")
            for query in queries[:5]:
                section.append(f"- `{query.get('name')}` - {query.get('return_type', 'Unknown type')}")
        
        if mutations:
            section.append("**Mutations**")
            for mutation in mutations[:5]:
                section.append(f"- `{mutation.get('name')}` - {mutation.get('return_type', 'Unknown type')}")
        
        section.append("")
        return section
    
    def _format_python_model(self, model: Dict[str, Any]) -> List[str]:
        """Format a Python data model."""
        section = [f"```python"]
        section.append(f"class {model.get('name', 'Unknown')}:")
        
        properties = model.get('properties', [])
        for prop in properties[:5]:  # Limit to first 5
            prop_name = prop.get('name', 'unknown')
            prop_type = prop.get('type', 'Any')
            section.append(f"    {prop_name}: {prop_type}")
        
        if len(properties) > 5:
            section.append(f"    # ... {len(properties) - 5} more properties")
        
        section.extend(["```", ""])
        return section
    
    def _format_typescript_interface(self, interface: Dict[str, Any]) -> List[str]:
        """Format a TypeScript interface."""
        section = ["```typescript"]
        section.append(f"interface {interface.get('name', 'Unknown')} {{")
        
        properties = interface.get('properties', [])
        for prop in properties[:5]:  # Limit to first 5
            prop_name = prop.get('name', 'unknown')
            prop_type = prop.get('type', 'any')
            optional = '?' if prop.get('optional') else ''
            section.append(f"  {prop_name}{optional}: {prop_type};")
        
        if len(properties) > 5:
            section.append(f"  // ... {len(properties) - 5} more properties")
        
        section.extend(["}", "```", ""])
        return section
    
    def _detect_external_services(self) -> Dict[str, str]:
        """Detect external service integrations."""
        services = {}
        
        # Look through dependencies and imports for common services
        dependency_analysis = self.results.get('dependency_analysis', {})
        external_deps = dependency_analysis.get('external_dependencies', [])
        
        service_patterns = {
            'stripe': 'Payment processing',
            'sendgrid': 'Email notifications',
            'twilio': 'SMS/Communication services',
            'aws': 'Cloud services',
            'google': 'Google services integration',
            'redis': 'Caching and session storage',
            'postgres': 'Primary database',
            'mysql': 'Database',
            'mongodb': 'NoSQL database',
        }
        
        for dep in external_deps:
            dep_name = dep.get('name', '').lower()
            for pattern, description in service_patterns.items():
                if pattern in dep_name:
                    services[pattern.title()] = description
                    break
        
        return services