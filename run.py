#!/usr/bin/env python3
"""
Simple runner script to launch the repo-analyzer without installation.
"""

import sys
import os

# Add the repository directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the CLI and run it
from src.main import main

if __name__ == '__main__':
    main()