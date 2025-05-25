#!/usr/bin/env python3
"""
Example script demonstrating how to use the repo-analyzer library programmatically.
"""

import os
import sys
import logging
from src.repo_scanner import RepoScanner
from src.parsers.python_parser import PythonParser
from src.analyzers.structure_analyzer import StructureAnalyzer
from src.analyzers.dependency_analyzer import DependencyAnalyzer
from src.analyzers.api_analyzer import ApiAnalyzer
from src.generators.document_generator import DocumentGenerator

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def analyze_repository(repo_path, output_path):
    """
    Analyze a repository and generate documentation.
    
    Args:
        repo_path: Path to the repository to analyze
        output_path: Path where to save the output document
    """
    # Step 1: Scan the repository
    logger.info(f"Scanning repository: {repo_path}")
    scanner = RepoScanner(repo_path)
    file_data = scanner.scan()
    logger.info(f"Found {len(file_data)} files")
    
    # Step 2: Parse files
    logger.info("Parsing files...")
    parser_results = {}
    
    for file_info in file_data:
        file_path = file_info['path']
        abs_path = file_info['abs_path']
        language = file_info.get('language')
        
        try:
            if language == 'python':
                parser = PythonParser(abs_path)
                parser_results[file_path] = parser.parse()
            # Add more parsers as needed
        except Exception as e:
            logger.warning(f"Error parsing {file_path}: {e}")
    
    logger.info(f"Parsed {len(parser_results)} files")
    
    # Step 3: Analyze structure
    logger.info("Analyzing repository structure...")
    structure_analyzer = StructureAnalyzer(repo_path, file_data)
    structure_analysis = structure_analyzer.analyze()
    
    # Step 4: Analyze dependencies
    logger.info("Analyzing dependencies...")
    dependency_analyzer = DependencyAnalyzer(repo_path, file_data, parser_results)
    dependency_analysis = dependency_analyzer.analyze()
    
    # Step 5: Analyze APIs
    logger.info("Analyzing APIs...")
    api_analyzer = ApiAnalyzer(repo_path, file_data, parser_results)
    api_analysis = api_analyzer.analyze()
    
    # Step 6: Generate documentation
    logger.info("Generating documentation...")
    analysis_results = {
        'file_data': file_data,
        'parser_results': parser_results,
        'structure_analysis': structure_analysis,
        'dependency_analysis': dependency_analysis,
        'api_analysis': api_analysis,
    }
    
    generator = DocumentGenerator(repo_path, analysis_results)
    generator.generate(output_path)
    
    logger.info(f"Documentation generated and saved to: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_repository.py <repo_path> [output_path]")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "analysis.md"
    
    analyze_repository(repo_path, output_path)