import unittest
import os
from src.repo_scanner import RepoScanner

class TestBasic(unittest.TestCase):
    def test_repo_scanner_init(self):
        """Test RepoScanner initialization."""
        scanner = RepoScanner(".")
        self.assertIsNotNone(scanner)
    
    def test_file_extensions(self):
        """Test file extension categorization."""
        scanner = RepoScanner(".")
        self.assertIn('.py', scanner.extensions['python'])
        self.assertIn('.js', scanner.extensions['javascript'])
        self.assertIn('.ts', scanner.extensions['typescript'])
    
    def test_binary_detection(self):
        """Test binary file detection."""
        scanner = RepoScanner(".")
        self.assertTrue(scanner.is_binary_file('test.jpg'))
        self.assertTrue(scanner.is_binary_file('test.png'))
        self.assertTrue(scanner.is_binary_file('test.exe'))
        self.assertFalse(scanner.is_binary_file('test.py'))
        self.assertFalse(scanner.is_binary_file('test.js'))
        self.assertFalse(scanner.is_binary_file('test.txt'))

if __name__ == '__main__':
    unittest.main()