# Repository Analyzer - TypeScript Edition

A powerful tool that scans code repositories and generates comprehensive documentation for Claude Projects. Now written in TypeScript with zero external dependencies!

## Features

- 🔍 **Multi-language support**: TypeScript, JavaScript, Python
- 📊 **Comprehensive analysis**: Structure, dependencies, APIs
- 📄 **Rich documentation**: Markdown reports with detailed insights
- 🚀 **Zero dependencies**: Pure Node.js/TypeScript implementation
- ⚡ **Fast scanning**: Efficient file parsing and analysis
- 🎯 **Focused analysis**: Choose what to analyze

## Quick Start

### Prerequisites

- Node.js 16+ 
- TypeScript (for development)

### Installation

```bash
# Clone or download the repository
cd repo-analyzer

# Install TypeScript (dev dependency only)
npm install

# Build the project
npm run build

# Make executable (optional)
chmod +x dist/main.js
```

### Usage

```bash
# Basic analysis
node dist/main.js scan /path/to/repository

# With custom output
node dist/main.js scan /path/to/repository -o my-analysis.md

# Focus on specific analysis
node dist/main.js scan /path/to/repository --focus api -v

# Show help
node dist/main.js --help
```

## Command Line Options

```
USAGE:
  repo-analyzer scan <repository-path> [options]

OPTIONS:
  -o, --output <file>     Output file path (default: analysis.md)
  -f, --focus <type>      Focus analysis (structure|dependencies|api|all)
  -v, --verbose          Enable verbose logging
  -h, --help             Show this help message

EXAMPLES:
  repo-analyzer scan ./my-project
  repo-analyzer scan ./my-project -o report.md -f api -v
  repo-analyzer scan ./my-project --focus dependencies
```

## Analysis Types

### Structure Analysis
- Directory tree visualization
- File count by language
- Repository statistics
- File size analysis

### Dependency Analysis  
- Internal file dependencies
- External package dependencies
- Dependency graph generation
- Circular dependency detection

### API Analysis
- Public function discovery
- Class method extraction
- API endpoint detection (Express, FastAPI, Flask)
- Documentation parsing

## Migration from Python

This TypeScript version replaces the previous Python implementation and offers:

- ✅ **No pip dependencies** - Works on restricted networks
- ✅ **Faster execution** - Native Node.js performance  
- ✅ **Better parsing** - More accurate code analysis
- ✅ **Cross-platform** - Works on all Node.js supported platforms

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