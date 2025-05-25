#!/usr/bin/env python3
"""
Repository Analyzer - Convenience Script

This script automatically sets up the environment and runs the repository analyzer.
Usage: python3 analyze.py /path/to/repository [output_file]
"""

import sys
import os
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 analyze.py /path/to/repository [output_file]")
        print("Example: python3 analyze.py /Users/username/Desktop/my-project")
        sys.exit(1)
    
    repo_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else "analysis.md"
    
    # Check if repository path exists
    if not os.path.exists(repo_path):
        print(f"❌ Error: Repository path '{repo_path}' does not exist.")
        sys.exit(1)
    
    # Get the directory where this script is located
    script_dir = Path(__file__).parent.absolute()
    venv_path = script_dir / "venv"
    
    # Check if virtual environment exists
    if not venv_path.exists():
        print("❌ Virtual environment not found. Please run setup.sh first:")
        print("  chmod +x setup.sh && ./setup.sh")
        sys.exit(1)
    
    # Prepare the command to run
    python_exe = venv_path / "bin" / "python"
    run_script = script_dir / "run.py"
    
    print(f"🔍 Analyzing repository: {repo_path}")
    print(f"📄 Output file: {output_file}")
    
    try:
        # Run the analyzer
        subprocess.run([
            str(python_exe), 
            str(run_script), 
            "scan", 
            repo_path, 
            "--output", 
            output_file
        ], check=True, cwd=script_dir)
        
        print(f"✅ Analysis complete! Output saved to: {output_file}")
        print(f"📋 You can now upload {output_file} to Claude Projects for Q&A about the codebase.")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running analyzer: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️  Analysis interrupted by user")
        sys.exit(1)

if __name__ == "__main__":
    main()