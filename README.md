# Code Repository Analyzer

A tool that scans code repositories and generates comprehensive documentation that can be uploaded to Claude Projects for intelligent Q&A about codebases.

## Features

- Scans Git repositories and extracts structural information
- Supports multiple programming languages (Python, JavaScript, TypeScript)
- Analyzes code dependencies and relationships
- Identifies APIs, data models, and integration points
- Generates structured markdown documentation
- Creates outputs optimized for Claude Projects

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/repo-analyzer.git
cd repo-analyzer

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Command Line Interface

```bash
# Activate the virtual environment first
source venv/bin/activate

# Scan a single repository
python3 run.py scan /path/to/repo --output analysis.md

# Example: Scan a repository on your desktop
python3 run.py scan /Users/username/Desktop/my-project --output analysis.md

# View all available commands
python3 run.py --help
```

### Programmatic Usage

```python
from src.repo_scanner import RepoScanner
from src.analyzers.structure_analyzer import StructureAnalyzer
from src.generators.document_generator import DocumentGenerator

# Scan repository
scanner = RepoScanner("/path/to/repo")
file_data = scanner.scan()

# Analyze structure
structure_analyzer = StructureAnalyzer("/path/to/repo", file_data)
analysis_results = {"structure_analysis": structure_analyzer.analyze()}

# Generate documentation
generator = DocumentGenerator("/path/to/repo", analysis_results)
generator.generate("analysis.md")
```

See the `examples` directory for more detailed examples.

## Output

The analyzer generates a comprehensive markdown document that includes:

- Project overview and structure
- Core components and dependencies
- API endpoints and data models
- Integration points with external systems
- Code examples for key functionality

This document is optimized for use with Claude Projects, allowing you to:

1. Upload the document to a Claude Project
2. Ask questions about the codebase
3. Get intelligent responses based on the document content

## Project Structure

```
repo-analyzer/
├── src/
│   ├── parsers/       # Language-specific code parsers
│   ├── analyzers/     # Code analysis engines
│   ├── generators/    # Documentation generators
│   └── main.py        # CLI entry point
├── tests/             # Test suite
├── examples/          # Usage examples
├── requirements.txt   # Project dependencies
└── README.md          # This file
```

## Supported Languages

- Python
- JavaScript
- TypeScript

More languages coming soon!

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.