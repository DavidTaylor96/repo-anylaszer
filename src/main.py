#!/usr/bin/env python3

import os
import click
import logging
import sys
from typing import Dict, List, Any, Optional
from rich.console import Console
from rich.logging import RichHandler
from rich.progress import Progress, SpinnerColumn, TextColumn

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
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)

logger = logging.getLogger("repo-analyzer")
console = Console()

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
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                console=console
            ) as progress:
                # Scan repository
                scan_task = progress.add_task("[green]Scanning repository...", total=None)
                self._scan_repository()
                progress.update(scan_task, completed=True)
                
                # Parse files
                parse_task = progress.add_task("[green]Parsing files...", total=len(self.file_data))
                self._parse_files(progress, parse_task)
                
                # Analyze structure
                if 'all' in self.focus or 'structure' in self.focus:
                    structure_task = progress.add_task("[green]Analyzing structure...", total=None)
                    self._analyze_structure()
                    progress.update(structure_task, completed=True)
                
                # Analyze dependencies
                if 'all' in self.focus or 'dependencies' in self.focus:
                    deps_task = progress.add_task("[green]Analyzing dependencies...", total=None)
                    self._analyze_dependencies()
                    progress.update(deps_task, completed=True)
                
                # Analyze APIs
                if 'all' in self.focus or 'api' in self.focus:
                    api_task = progress.add_task("[green]Analyzing APIs...", total=None)
                    self._analyze_apis()
                    progress.update(api_task, completed=True)
                
                # Generate document
                doc_task = progress.add_task("[green]Generating documentation...", total=None)
                self._generate_document()
                progress.update(doc_task, completed=True)
            
            console.print(f"[green]Analysis complete! Documentation saved to: {self.output_path}")
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
    
    def _parse_files(self, progress, task_id) -> None:
        """
        Parse the content of each file.
        
        Args:
            progress: Progress object for updating progress
            task_id: Task ID for the progress bar
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
                
                progress.update(task_id, advance=1)
            except Exception as e:
                logger.warning(f"Error parsing {file_path}: {e}")
                progress.update(task_id, advance=1)
        
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


@click.group()
def cli():
    """
    Repository Analyzer CLI - Generate comprehensive documentation from code repositories.
    """
    pass


@cli.command('scan')
@click.argument('repo_path', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option('--output', '-o', default='analysis.md', help='Output file path')
@click.option('--focus', '-f', multiple=True, help='Focus on specific analysis types (structure, dependencies, api)')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def scan_command(repo_path, output, focus, verbose):
    """
    Scan a single repository and generate documentation.
    
    REPO_PATH is the path to the repository to analyze.
    """
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    focus_list = list(focus) if focus else ['all']
    analyzer = RepositoryAnalyzer(repo_path, output, focus_list)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


@cli.command('scan-multi')
@click.argument('repo_paths', type=click.Path(exists=True, file_okay=False, dir_okay=True), nargs=-1)
@click.option('--output', '-o', default='combined_analysis.md', help='Output file path')
@click.option('--focus', '-f', multiple=True, help='Focus on specific analysis types (structure, dependencies, api)')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def scan_multi_command(repo_paths, output, focus, verbose):
    """
    Scan multiple repositories and generate combined documentation.
    
    REPO_PATHS are the paths to the repositories to analyze.
    """
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    if not repo_paths:
        console.print("[red]Error: At least one repository path is required")
        sys.exit(1)
    
    focus_list = list(focus) if focus else ['all']
    
    # TODO: Implement multi-repository scanning
    console.print("[yellow]Multi-repository scanning not yet implemented")
    console.print("[yellow]Falling back to analyzing the first repository")
    
    analyzer = RepositoryAnalyzer(repo_paths[0], output, focus_list)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


@cli.command('compare')
@click.argument('repo_path1', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.argument('repo_path2', type=click.Path(exists=True, file_okay=False, dir_okay=True))
@click.option('--output', '-o', default='comparison.md', help='Output file path')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
def compare_command(repo_path1, repo_path2, output, verbose):
    """
    Compare two repositories and generate a comparison document.
    
    REPO_PATH1 is the path to the first repository.
    REPO_PATH2 is the path to the second repository.
    """
    if verbose:
        logging.getLogger("repo-analyzer").setLevel(logging.DEBUG)
    
    # TODO: Implement repository comparison
    console.print("[yellow]Repository comparison not yet implemented")
    console.print("[yellow]Falling back to analyzing the first repository")
    
    analyzer = RepositoryAnalyzer(repo_path1, output)
    success = analyzer.analyze()
    
    if not success:
        sys.exit(1)


if __name__ == '__main__':
    cli()