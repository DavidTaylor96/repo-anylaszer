from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import os
import logging

logger = logging.getLogger(__name__)

class GenericParser(ABC):
    """
    Base abstract class for all language parsers.
    """
    
    def __init__(self, file_path: str):
        """
        Initialize the parser with a file path.
        
        Args:
            file_path: Path to the file to parse
        """
        self.file_path = file_path
        self.content = self._read_file()
        self.analysis = {}
    
    def _read_file(self) -> Optional[str]:
        """
        Read the file content.
        
        Returns:
            String content of the file or None if file cannot be read
        """
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Could not read file {self.file_path}: {e}")
            return None
    
    @abstractmethod
    def parse(self) -> Dict[str, Any]:
        """
        Parse the file and extract information.
        
        Returns:
            Dictionary with parsed information
        """
        pass
    
    @abstractmethod
    def extract_imports(self) -> List[Dict[str, Any]]:
        """
        Extract import statements from the file.
        
        Returns:
            List of import statements with metadata
        """
        pass
    
    @abstractmethod
    def extract_functions(self) -> List[Dict[str, Any]]:
        """
        Extract function definitions from the file.
        
        Returns:
            List of function definitions with metadata
        """
        pass
    
    @abstractmethod
    def extract_classes(self) -> List[Dict[str, Any]]:
        """
        Extract class definitions from the file.
        
        Returns:
            List of class definitions with metadata
        """
        pass
    
    def extract_file_summary(self) -> Dict[str, Any]:
        """
        Extract a high-level summary of the file.
        
        Returns:
            Dictionary with file summary information
        """
        return {
            'file_path': self.file_path,
            'file_name': os.path.basename(self.file_path),
            'directory': os.path.dirname(self.file_path),
            'size': len(self.content) if self.content else 0,
            'line_count': len(self.content.splitlines()) if self.content else 0,
        }
    
    def get_analysis(self) -> Dict[str, Any]:
        """
        Get the complete analysis of the file.
        
        Returns:
            Dictionary with all analysis data
        """
        if not self.analysis:
            self.analysis = self.parse()
        return self.analysis