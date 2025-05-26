# Repository Analyzer - TypeScript Edition

A powerful tool that scans code repositories and generates comprehensive documentation for Claude Projects. Now written in TypeScript with zero external dependencies and MCP (Model Context Protocol) support!

## Features

- 🔍 **Multi-language support**: TypeScript, JavaScript, Python
- 📊 **Comprehensive analysis**: Structure, dependencies, APIs
- 📄 **Rich documentation**: Markdown reports with detailed insights
- 🚀 **Zero dependencies**: Pure Node.js/TypeScript implementation
- ⚡ **Fast scanning**: Efficient file parsing and analysis
- 🎯 **Focused analysis**: Choose what to analyze
- 🤖 **MCP Integration**: Connect to AI chatbots via Model Context Protocol

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

## MCP Integration

The Repository Analyzer includes a complete MCP (Model Context Protocol) server that allows AI chatbots and applications to analyze repositories in real-time.

### MCP Server Features

The MCP server provides these tools for AI integration:

- **`analyze_repository`** - Complete codebase analysis with configurable focus areas
- **`search_codebase`** - Find specific functions, classes, or patterns 
- **`get_code_structure`** - Get structure of specific components
- **`suggest_implementation`** - AI-powered implementation suggestions based on existing patterns

### Starting the MCP Server

```bash
# Build the project first
npm run build

# Start the MCP server
node dist/mcp-server.js
```

### Integrating with Claude Desktop

Add to your Claude Desktop config (`~/.anthropic/claude-app/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "repo-analyzer": {
      "command": "node",
      "args": ["/path/to/repo-analyzer/dist/mcp-server.js"]
    }
  }
}
```

### Custom Chatbot Integration

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: "my-chatbot", version: "1.0.0" });

await client.connect(new StdioClientTransport({
  command: "node",
  args: ["dist/mcp-server.js"]
}));

// Analyze a repository
const result = await client.callTool({
  name: "analyze_repository",
  arguments: { path: "/path/to/repo", focus: "api" }
});

// Search for specific code elements
const searchResult = await client.callTool({
  name: "search_codebase",
  arguments: { query: "getUserById", type: "function" }
});
```

### MCP Benefits

- **Real-time analysis** - No need to generate static reports
- **Interactive queries** - Ask specific questions about codebases
- **Pattern recognition** - AI can suggest implementations based on existing code
- **Standardized protocol** - Works with any MCP-compatible AI tool

## Project Structure

```
repo-analyzer/
├── src/
│   ├── parsers/       # Language-specific code parsers
│   ├── analyzers/     # Code analysis engines
│   ├── generators/    # Documentation generators
│   ├── main.ts        # CLI entry point
│   └── mcp-server.ts  # MCP server for AI integration
├── tests/             # Test suite
├── examples/          # Usage examples
├── dist/              # Compiled JavaScript
├── package.json       # Project dependencies
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