import os
import pathspec
from typing import List, Dict, Any, Optional
from git import Repo
import logging

logger = logging.getLogger(__name__)

class RepoScanner:
    """
    Scans a repository and collects file information while respecting gitignore rules.
    """
    
    def __init__(self, repo_path: str):
        """
        Initialize the repository scanner.
        
        Args:
            repo_path: Path to the repository to scan
        """
        self.repo_path = os.path.abspath(repo_path)
        self.files = []
        self.is_git_repo = os.path.exists(os.path.join(repo_path, '.git'))
        self.ignore_patterns = self._load_gitignore()
        
        # Common file extensions by language
        self.extensions = {
            'python': ['.py', '.pyi', '.pyx'],
            'javascript': ['.js', '.jsx', '.mjs'],
            'typescript': ['.ts', '.tsx'],
            'java': ['.java'],
            'go': ['.go'],
            'ruby': ['.rb'],
            'php': ['.php'],
            'c': ['.c', '.h'],
            'cpp': ['.cpp', '.hpp', '.cc', '.hh', '.cxx', '.hxx'],
            'csharp': ['.cs'],
            'rust': ['.rs'],
            'swift': ['.swift'],
            'kotlin': ['.kt', '.kts'],
            'html': ['.html', '.htm'],
            'css': ['.css', '.scss', '.sass', '.less'],
            'json': ['.json'],
            'yaml': ['.yaml', '.yml'],
            'markdown': ['.md', '.markdown'],
            'shell': ['.sh', '.bash', '.zsh'],
            'sql': ['.sql'],
            'config': ['.xml', '.ini', '.toml', '.conf', '.config'],
        }
        
        # Binary file extensions to skip
        self.binary_extensions = [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
            '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
            '.zip', '.tar', '.gz', '.rar', '.7z',
            '.exe', '.dll', '.so', '.dylib',
            '.pyc', '.pyo', '.pyd',
            '.class', '.jar',
            '.mp3', '.mp4', '.avi', '.mov', '.wav',
            '.ttf', '.otf', '.woff', '.woff2',
        ]
        
        # Directories to skip
        self.skip_dirs = [
            'node_modules', 'venv', '.venv', 'env', '.env', 'virtualenv',
            '.git', '.svn', '.hg', '.idea', '.vscode',
            'dist', 'build', 'target', '.DS_Store',
            '__pycache__', '.pytest_cache', '.mypy_cache',
            'vendor', 'bower_components', 'packages',
        ]
        
    def _load_gitignore(self) -> Optional[pathspec.PathSpec]:
        """
        Load gitignore rules from the repository.
        
        Returns:
            PathSpec object with gitignore patterns or None if no .gitignore found
        """
        gitignore_path = os.path.join(self.repo_path, '.gitignore')
        
        if not os.path.exists(gitignore_path):
            return None
            
        with open(gitignore_path, 'r') as f:
            gitignore_content = f.read()
            
        return pathspec.PathSpec.from_lines(
            pathspec.patterns.GitWildMatchPattern, 
            gitignore_content.splitlines()
        )
    
    def is_binary_file(self, file_path: str) -> bool:
        """
        Check if a file is binary based on its extension.
        
        Args:
            file_path: Path to the file to check
            
        Returns:
            True if the file is likely binary, False otherwise
        """
        _, ext = os.path.splitext(file_path.lower())
        return ext in self.binary_extensions
    
    def should_skip_directory(self, dir_name: str) -> bool:
        """
        Check if a directory should be skipped during scanning.
        
        Args:
            dir_name: Name of the directory to check
            
        Returns:
            True if the directory should be skipped, False otherwise
        """
        return dir_name in self.skip_dirs
    
    def get_language_from_extension(self, file_path: str) -> Optional[str]:
        """
        Determine the programming language based on file extension.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Language identifier or None if unknown
        """
        _, ext = os.path.splitext(file_path.lower())
        
        for language, extensions in self.extensions.items():
            if ext in extensions:
                return language
                
        return None
    
    def get_file_metadata(self, file_path: str) -> Dict[str, Any]:
        """
        Get metadata for a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dictionary with file metadata
        """
        abs_path = os.path.join(self.repo_path, file_path)
        rel_path = os.path.relpath(abs_path, self.repo_path)
        
        size = os.path.getsize(abs_path)
        language = self.get_language_from_extension(file_path)
        
        # Get git info if available
        last_modified = None
        author = None
        
        if self.is_git_repo:
            try:
                repo = Repo(self.repo_path)
                for commit, lines in repo.blame('HEAD', file_path):
                    if not last_modified or commit.committed_date > last_modified:
                        last_modified = commit.committed_date
                        author = f"{commit.author.name} <{commit.author.email}>"
            except Exception as e:
                logger.warning(f"Could not get git info for {file_path}: {e}")
        
        return {
            'path': rel_path,
            'abs_path': abs_path,
            'size': size,
            'language': language,
            'last_modified': last_modified,
            'author': author,
        }
    
    def scan(self, max_file_size: int = 1024 * 1024) -> List[Dict[str, Any]]:
        """
        Scan the repository for files.
        
        Args:
            max_file_size: Maximum file size in bytes to include (default: 1MB)
            
        Returns:
            List of file metadata dictionaries
        """
        result = []
        
        for root, dirs, files in os.walk(self.repo_path):
            # Apply directory exclusions
            dirs[:] = [d for d in dirs if not self.should_skip_directory(d)]
            
            # Process each file
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, self.repo_path)
                
                # Skip if matches gitignore patterns
                if self.ignore_patterns and self.ignore_patterns.match_file(rel_path):
                    continue
                    
                # Skip binary files
                if self.is_binary_file(file_path):
                    continue
                    
                # Skip large files
                if os.path.getsize(file_path) > max_file_size:
                    logger.info(f"Skipping large file: {rel_path}")
                    continue
                
                # Add file metadata
                try:
                    metadata = self.get_file_metadata(rel_path)
                    result.append(metadata)
                except Exception as e:
                    logger.error(f"Error processing file {rel_path}: {e}")
        
        # Sort by modification time (newest first)
        if self.is_git_repo:
            result.sort(key=lambda x: x.get('last_modified', 0) or 0, reverse=True)
        
        self.files = result
        return result