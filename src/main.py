#!/usr/bin/env python3

import os
import argparse
import logging
import sys
from typing import Dict, List, Any, Optional

from src.repo_scanner import RepoScanner
from src.parsers.python_parser import PythonParser
from src.parsers.javascript_parser import JavaScriptParser
from src.parsers.typescript_parser import TypeScriptParser
from src.analyzers.structure_analyzer import StructureAnalyzer
from src.analyzers.dependency_analyzer import DependencyAnalyzer
from src.analyzers.api_analyzer import ApiAnalyzer
from src.generators.document_generator import DocumentGenerator

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("repo-analyzer")

class RepositoryAnalyzer:
    """
    Main class that orchestrates the repository analysis process.
    """
    
    def __init__(self, repo_path: str, output_path: str, focus: Optional[List[str]] = None):
        """
        Initialize the repository analyzer.
        
        Args:
            repo_path: Path to the repository to analyze
            output_path: Path where to save the output document
            focus: Optional list of analysis types to focus on
        """
        self.repo_path = os.path.abspath(repo_path)
        self.output_path = output_path
        self.focus = focus or ['all']
        
        self.scanner = None
        self.file_data = []
        self.parser_results = {}
        self.analysis_results = {}
    
    def analyze(self) -> bool:
        """
        Perform the complete analysis process.
        
        Returns:
            True if analysis was successful, False otherwise
        """
        try:
            # Scan repository
            print("Scanning repository...")
            self._scan_repository()
            print("✓ Repository scan complete")
            
            # Parse files
            print("Parsing files...")
            self._parse_files()
            print("✓ File parsing complete")
            
            # Analyze structure
            if 'all' in self.focus or 'structure' in self.focus:
                print("Analyzing structure...")
                self._analyze_structure()
                print("✓ Structure analysis complete")
            
            # Analyze dependencies
            if 'all' in self.focus or 'dependencies' in self.focus:
                print("Analyzing dependencies...")
                self._analyze_dependencies()
                print("✓ Dependency analysis complete")
            
            # Analyze APIs
            if 'all' in self.focus or 'api' in self.focus:
                print("Analyzing APIs...")
                self._analyze_apis()
                print("✓ API analysis complete")
            
            # Generate document
            print("Generating documentation...")
            self._generate_document()
            print("✓ Documentation generation complete")
            
            print(f"Analysis complete! Documentation saved to: {self.output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error during analysis: {e}", exc_info=True)
            return False
    
    def _scan_repository(self) -> None:
        """
        Scan the repository for files.
        """
        logger.info(f"Scanning repository: {self.repo_path}")
        self.scanner = RepoScanner(self.repo_path)
        self.file_data = self.scanner.scan()
        logger.info(f"Found {len(self.file_data)} files")
    
    def _parse_files(self) -> None:
        """
        Parse the content of each file.
        """
        logger.info("Parsing files...")
        
        for file_info in self.file_data:
            file_path = file_info['path']
            abs_path = file_info['abs_path']
            language = file_info.get('language')
            
            try:
                if language == 'python':
                    parser = PythonParser(abs_path)
                    self.parser_results[file_path] = parser.parse()
                elif language == 'javascript':
                    parser = JavaScriptParser(abs_path)
                    self.parser_results[file_path] = parser.parse()
                elif language == 'typescript':
                    parser = TypeScriptParser(abs_path)
                    self.parser_results[file_path] = parser.parse()
                # Add more parsers as needed
                
            except Exception as e:
                logger.warning(f"Error parsing {file_path}: {e}")
        
        logger.info(f"Parsed {len(self.parser_results)} files")
    
    def _analyze_structure(self) -> None:
        """
        Analyze the repository structure.
        """
        logger.info("Analyzing repository structure...")
        analyzer = StructureAnalyzer(self.repo_path, self.file_data)
        self.analysis_results['structure_analysis'] = analyzer.analyze()
    
    def _analyze_dependencies(self) -> None:
        """
        Analyze the dependencies between files.
        """
        logger.info("Analyzing dependencies...")
        analyzer = DependencyAnalyzer(self.repo_path, self.file_data, self.parser_results)
        self.analysis_results['dependency_analysis'] = analyzer.analyze()
    
    def _analyze_apis(self) -> None:
        """
        Analyze the APIs in the repository.
        """
        logger.info("Analyzing APIs...")
        analyzer = ApiAnalyzer(self.repo_path, self.file_data, self.parser_results)
        self.analysis_results['api_analysis'] = analyzer.analyze()
    
    def _generate_document(self) -> None:
        """
        Generate the documentation document.
        """
        logger.info("Generating documentation...")
        
        # Add file data and parser results to analysis results
        self.analysis_results['file_data'] = self.file_data
        self.analysis_results['parser_results'] = self.parser_results
        
        generator = DocumentGenerator(self.repo_path, self.analysis_results)
        generator.generate(self.output_path)
        
        doc_size = os.path.getsize(self.output_path)
        logger.info(f"Documentation generated ({doc_size / 1024:.2f} KB)")


def scan_command(repo_path, output, focus, verbose):
    """Scan a single repository and generate documentation."""
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    focus_list = focus if focus else ['all']
    analyzer = RepositoryAnalyzer(repo_path, output, focus_list)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


def scan_multi_command(repo_paths, output, focus, verbose):
    """Scan multiple repositories and generate combined documentation."""
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    if not repo_paths:
        print("Error: At least one repository path is required")
        sys.exit(1)
    
    focus_list = focus if focus else ['all']
    
    # TODO: Implement multi-repository scanning
    print("Multi-repository scanning not yet implemented")
    print("Falling back to analyzing the first repository")
    
    analyzer = RepositoryAnalyzer(repo_paths[0], output, focus_list)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


def compare_command(repo_path1, repo_path2, output, verbose):
    """Compare two repositories and generate a comparison document."""
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    # TODO: Implement repository comparison
    print("Repository comparison not yet implemented")
    print("Falling back to analyzing the first repository")
    
    analyzer = RepositoryAnalyzer(repo_path1, output)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Repository Analyzer CLI - Generate comprehensive documentation from code repositories.'
    )
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Scan command
    scan_parser = subparsers.add_parser('scan', help='Scan a single repository and generate documentation')
    scan_parser.add_argument('repo_path', help='Path to the repository to analyze')
    scan_parser.add_argument('-o', '--output', default='analysis.md', help='Output file path')
    scan_parser.add_argument('-f', '--focus', action='append', 
                           help='Focus on specific analysis types (structure, dependencies, api)')
    scan_parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    
    # Scan-multi command
    scan_multi_parser = subparsers.add_parser('scan-multi', 
                                             help='Scan multiple repositories and generate combined documentation')
    scan_multi_parser.add_argument('repo_paths', nargs='+', help='Paths to the repositories to analyze')
    scan_multi_parser.add_argument('-o', '--output', default='combined_analysis.md', help='Output file path')
    scan_multi_parser.add_argument('-f', '--focus', action='append',
                                  help='Focus on specific analysis types (structure, dependencies, api)')
    scan_multi_parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    
    # Compare command
    compare_parser = subparsers.add_parser('compare', 
                                          help='Compare two repositories and generate a comparison document')
    compare_parser.add_argument('repo_path1', help='Path to the first repository')
    compare_parser.add_argument('repo_path2', help='Path to the second repository')
    compare_parser.add_argument('-o', '--output', default='comparison.md', help='Output file path')
    compare_parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Validate repository paths exist
    if args.command == 'scan':
        if not os.path.exists(args.repo_path) or not os.path.isdir(args.repo_path):
            print(f"Error: Repository path '{args.repo_path}' does not exist or is not a directory")
            sys.exit(1)
        scan_command(args.repo_path, args.output, args.focus, args.verbose)
    
    elif args.command == 'scan-multi':
        for repo_path in args.repo_paths:
            if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
                print(f"Error: Repository path '{repo_path}' does not exist or is not a directory")
                sys.exit(1)
        scan_multi_command(args.repo_paths, args.output, args.focus, args.verbose)
    
    elif args.command == 'compare':
        for repo_path in [args.repo_path1, args.repo_path2]:
            if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
                print(f"Error: Repository path '{repo_path}' does not exist or is not a directory")
                sys.exit(1)
        compare_command(args.repo_path1, args.repo_path2, args.output, args.verbose)


if __name__ == '__main__':
    main()