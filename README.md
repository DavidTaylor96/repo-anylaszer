# Repository Analyzer - Enterprise Edition

🚀 **A comprehensive code analysis tool that understands modern development patterns and generates intelligent documentation for AI-powered development workflows.**

Perfect for teams using **React**, **Node.js**, **Azure**, **AWS**, **Kafka**, **Docker**, and modern JavaScript/TypeScript stacks. Generate rich documentation that enables AI chatbots to understand your codebase architecture and generate contextually appropriate code.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

---

## 🎯 Perfect For

- **AI-Powered Development** - Generate documentation that enables AI chatbots to understand and extend your codebase
- **Enterprise Applications** - Full Azure/AWS cloud service pattern recognition
- **Modern React/Node.js** - Deep understanding of component patterns, hooks, styling approaches
- **Microservices Architecture** - Kafka, message queues, containerization patterns
- **Team Onboarding** - Comprehensive documentation for new developers

---

## ✨ Key Features

### 🔍 **Intelligent Pattern Recognition**
- **React Ecosystem**: Components, hooks, Next.js, React Query, styled-components, Tailwind CSS
- **Azure Services**: Service Bus, Functions, Storage, Key Vault, Cosmos DB, Event Hubs, Application Insights
- **AWS Services**: Lambda, S3, SQS, DynamoDB, CloudFormation
- **Message Queues**: Kafka producers/consumers, Azure Service Bus, AWS SQS
- **Infrastructure**: Docker, containerization, environment configuration
- **Security**: JWT, OAuth, SAML, bcrypt, authentication middleware

### 📊 **Comprehensive Analysis**
- **Code Structure**: Directory trees, file organization, architectural patterns
- **Dependencies**: Internal relationships, external packages, circular dependency detection
- **APIs**: Express routes, serverless functions, database schemas, authentication flows
- **Component Relationships**: React component trees, prop flows, styling connections
- **State Management**: Redux, Zustand, Context API, MobX pattern detection

### 🚀 **AI Integration Ready**
- **MCP Protocol**: Real-time integration with AI chatbots and IDEs
- **Rich Documentation**: Context-aware markdown reports optimized for AI consumption
- **Pattern Examples**: Concrete code examples showing how patterns are implemented
- **Zero Dependencies**: Pure TypeScript implementation, works in any environment

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+**
- **TypeScript** (for development)

### Installation

```bash

# Install dependencies (TypeScript only)
npm install

# Build the project
npm run build

# Make executable (optional)
chmod +x dist/main.js
```

### Basic Usage

```bash
# Analyze a repository (generates analysis.md)
node dist/main.js scan /path/to/your/project

# Custom output file
node dist/main.js scan /path/to/project -o my-analysis.md

# Focus on specific areas
node dist/main.js scan /path/to/project --focus api -v

# Get help
node dist/main.js --help
```

---

## 📋 Command Line Interface

```
USAGE:
  repo-analyzer scan <repository-path> [options]

OPTIONS:
  -o, --output <file>     Output file path (default: analysis.md)
  -f, --focus <type>      Focus analysis type
  -v, --verbose          Enable detailed logging
  -h, --help             Show help message

FOCUS OPTIONS:
  structure    - Directory structure and file organization
  dependencies - Internal and external dependency analysis  
  api          - API endpoints, functions, and interfaces
  patterns     - Code patterns and architectural analysis
  all          - Complete analysis (default)

EXAMPLES:
  repo-analyzer scan ./my-react-app
  repo-analyzer scan ./my-api -o api-docs.md -f api -v
  repo-analyzer scan ./enterprise-app --focus patterns
```

---

## 🔍 Analysis Capabilities

### **React & Frontend Patterns**
```markdown
✅ React Components (functional, class, HOCs)
✅ Custom Hooks and built-in React hooks
✅ Component Props and TypeScript interfaces
✅ Styling Systems:
   • CSS Modules (.module.css)
   • Styled Components / Emotion
   • Tailwind CSS utility classes
   • SCSS/SASS preprocessors
   • CSS-in-JS patterns
   • Inline styles
✅ State Management (Redux, Zustand, Context API, MobX)
✅ Routing (React Router patterns)
✅ Data Fetching (React Query, SWR, Apollo Client)
✅ Testing Patterns (React Testing Library, Jest)
✅ Next.js Framework detection
```

### **Node.js & Backend Patterns**
```markdown
✅ Express.js APIs and middleware
✅ Authentication patterns (JWT, OAuth, Passport.js)
✅ Database integrations (Prisma, TypeORM, Mongoose)
✅ Error handling and logging patterns
✅ API documentation and schemas
✅ TypeScript interfaces and type definitions
✅ Async/await and Promise patterns
```

### **Cloud Services - Azure**
```markdown
✅ Azure Functions (HTTP/Timer triggers)
✅ Azure Service Bus (queues, topics, subscriptions)
✅ Azure Storage (Blob, Queue, File services)
✅ Azure Key Vault (secrets, keys management)
✅ Azure SQL Database / Cosmos DB
✅ Azure Event Hubs (streaming data)
✅ Azure Application Insights (monitoring)
```

### **Cloud Services - AWS**
```markdown
✅ AWS Lambda functions
✅ AWS S3 (storage operations)
✅ AWS SQS (message queues)
✅ AWS DynamoDB (NoSQL database)
✅ Serverless Framework patterns
✅ CloudFormation / SAM templates
```

### **Message Queues & Streaming**
```markdown
✅ Apache Kafka (producers, consumers, admin operations)
✅ Azure Service Bus messaging patterns
✅ AWS SQS queue operations
✅ Event-driven architecture patterns
✅ Message serialization and error handling
```

### **Infrastructure & DevOps**
```markdown
✅ Docker (Dockerfile, docker-compose)
✅ Container orchestration patterns
✅ Environment configuration (.env, config files)
✅ CI/CD pipeline detection
✅ Health checks and monitoring
```

### **Security & Authentication**
```markdown
✅ JWT token handling
✅ OAuth 2.0 / SAML patterns  
✅ Password hashing (bcrypt)
✅ API key management
✅ CORS and security middleware
✅ Secret management patterns
```

---

## 🤖 AI Integration

### **For Custom AI Chatbots**

The generated markdown documentation provides rich context that enables AI chatbots to:

1. **Understand your architecture** - Framework choices, patterns, and conventions
2. **Generate consistent code** - Following your existing patterns and styling approaches  
3. **Suggest appropriate solutions** - Based on your tech stack and architectural decisions
4. **Maintain code quality** - Using the same libraries, patterns, and structures

**Example AI Prompt:**
```
"Build a new user registration page that looks like the login page"
```

With the repository analysis, the AI will understand:
- Your React component patterns
- Styling approach (CSS modules, Tailwind, etc.)
- Form handling patterns
- Authentication flow
- API integration patterns
- Error handling approaches

### **MCP (Model Context Protocol) Integration**

For real-time AI integration:

```bash
# Start MCP server
npm run build
node dist/mcp-server.js
```

**Claude Desktop Integration:**
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

**MCP Tools Available:**
- `analyze_repository` - Full codebase analysis
- `search_codebase` - Find specific patterns or functions
- `get_code_structure` - Get component/module structure
- `suggest_implementation` - AI suggestions based on existing patterns

---

## 📄 Sample Output

The analyzer generates comprehensive documentation like this:

```markdown
# Repository Analysis: my-ecommerce-app

## Executive Summary
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS + CSS Modules  
- **State**: Redux Toolkit + React Query
- **Cloud**: Azure (Functions, Service Bus, Cosmos DB)
- **Auth**: JWT + Azure AD integration

## Detected Patterns

### Frontend Architecture
- **Components**: 47 React components with TypeScript props
- **Styling**: Tailwind utility classes + CSS modules for complex components
- **Hooks**: Custom hooks for API calls, form handling, local storage
- **Routing**: Next.js file-based routing with dynamic routes

### Backend Services  
- **APIs**: 23 Express routes with OpenAPI documentation
- **Authentication**: JWT middleware + Azure AD integration
- **Database**: Prisma ORM with PostgreSQL and Cosmos DB
- **Messaging**: Azure Service Bus for order processing

### Infrastructure
- **Containerization**: Multi-stage Docker builds
- **Cloud Services**: Azure Functions for background processing
- **Monitoring**: Application Insights with custom telemetry
- **Configuration**: Environment-based config with Key Vault secrets

## Code Examples
[Concrete examples of how patterns are implemented...]
```

---

## 🏗️ Project Structure

```
repo-analyzer/
├── src/
│   ├── analyzers/           # Core analysis engines
│   │   ├── api-analyzer.ts          # API endpoint detection
│   │   ├── code-patterns-analyzer.ts # Pattern recognition
│   │   ├── dependency-analyzer.ts   # Dependency mapping
│   │   ├── state-analyzer.ts        # State management detection
│   │   └── structure-analyzer.ts    # Directory structure analysis
│   ├── parsers/             # Language-specific parsers
│   │   ├── typescript-parser.ts     # TypeScript/JavaScript parsing
│   │   ├── python-parser.ts         # Python code parsing
│   │   └── base-parser.ts           # Common parsing utilities
│   ├── generators/          # Documentation generators  
│   ├── main.ts             # CLI entry point
│   ├── mcp-server.ts       # MCP server for AI integration
│   ├── scanner.ts          # File system scanning
│   └── types.ts            # TypeScript type definitions
├── tests/                   # Test suite
├── examples/               # Usage examples
├── dist/                   # Compiled JavaScript output
└── docs/                   # Additional documentation
```

---

## 💡 Use Cases

### **Enterprise Development Teams**
- **Onboarding**: Generate comprehensive documentation for new team members
- **Architecture Review**: Understand patterns and dependencies across large codebases
- **Migration Planning**: Analyze current state before technology migrations
- **Code Standards**: Document and enforce architectural patterns

### **AI-Powered Development**
- **Custom AI Assistants**: Provide rich context for AI code generation
- **Code Review Automation**: Train AI models on your specific patterns
- **Documentation Generation**: Automated technical documentation
- **Pattern Enforcement**: Ensure new code follows established patterns

### **Consulting & Code Audits**
- **Technical Due Diligence**: Rapid codebase assessment for acquisitions
- **Architecture Assessment**: Identify technical debt and improvement opportunities  
- **Technology Modernization**: Plan updates to modern frameworks and cloud services
- **Security Review**: Identify authentication and security patterns

---

## 🌟 Supported Technologies

### **Languages & Frameworks**
- **JavaScript/TypeScript** - Full ES6+, React, Node.js, Next.js
- **Python** - Basic support (expanding)

### **Frontend Technologies**
- **React** (Functional components, hooks, class components)
- **Next.js** (Pages, API routes, app directory)
- **Styling** (CSS Modules, Styled Components, Tailwind, SCSS)
- **State Management** (Redux, Zustand, Context API, MobX, Recoil)
- **Data Fetching** (React Query, SWR, Apollo Client)

### **Backend Technologies**
- **Node.js** (Express, Fastify, Koa)
- **Authentication** (JWT, OAuth, Passport.js, bcrypt)
- **Databases** (Prisma, TypeORM, Mongoose, Sequelize)
- **Message Queues** (Kafka, Azure Service Bus, AWS SQS)

### **Cloud Platforms**
- **Azure** (Functions, Service Bus, Storage, Key Vault, Cosmos DB, Event Hubs, App Insights)
- **AWS** (Lambda, S3, SQS, DynamoDB)

### **Infrastructure**
- **Docker** (Dockerfile, docker-compose)
- **Configuration** (.env files, config management)
- **Build Tools** (Vite, Webpack, Rollup, ESBuild)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Add new analyzers, improve existing ones
4. **Add tests**: Ensure your changes work correctly
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### **Areas for Contribution**
- **New Language Support**: Add parsers for Go, Rust, Java, C#
- **Cloud Services**: Add GCP, IBM Cloud, Oracle Cloud support  
- **Framework Detection**: Add support for Vue.js, Angular, Svelte
- **Database Systems**: Expand ORM and database pattern recognition
- **Testing Frameworks**: Add more testing pattern detection
- **Documentation**: Improve examples and guides

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


*Transform your codebase into AI-ready documentation and accelerate your development workflow.*