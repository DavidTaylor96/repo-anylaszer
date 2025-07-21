# Repository Analyzer - Enterprise Edition

🚀 **An enterprise-grade code analysis tool that provides comprehensive backend API analysis, security assessment, and architectural insights for AI-powered development workflows.**

Perfect for teams building **backend APIs** with **Express**, **NestJS**, **Fastify**, or **GraphQL**, using **databases** like **Prisma**, **TypeORM**, **Sequelize**, and deploying to **Azure**, **AWS**, **Docker**, and **Kubernetes**. Features advanced security analysis, performance profiling, and generates AI-ready documentation for intelligent code generation.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

---

## 🎯 Perfect For

- **AI-Powered Development** - Generate documentation that enables AI chatbots to understand and extend your codebase
- **Backend API Development** - Comprehensive analysis of Express, NestJS, Fastify, GraphQL, and database patterns
- **Enterprise Applications** - Full security analysis, performance profiling, and infrastructure pattern detection
- **Modern Full-Stack Applications** - React/Node.js with complete database and API architecture analysis
- **Microservices Architecture** - API gateway patterns, message queues, containerization, and service communication
- **Team Onboarding** - Comprehensive documentation with security best practices and architectural insights

---

## ✨ Key Features

### 🔍 **Intelligent Pattern Recognition**
- **React Ecosystem**: Components, hooks, Next.js, React Query, styled-components, Tailwind CSS
- **Backend Frameworks**: Express.js, NestJS, Fastify, Koa, GraphQL, Socket.io - complete framework analysis
- **Database & ORM**: Prisma, TypeORM, Sequelize, Mongoose, SQLAlchemy - schema relationships and query optimization
- **API Architecture**: REST compliance, OpenAPI documentation, versioning strategies, rate limiting
- **Security Analysis**: Authentication patterns, authorization models, vulnerability detection, secret management
- **Performance Patterns**: Caching strategies, background jobs, connection pooling, async patterns
- **Azure Services**: Service Bus, Functions, Storage, Key Vault, Cosmos DB, Event Hubs, Application Insights
- **AWS Services**: Lambda, S3, SQS, DynamoDB, CloudFormation
- **Infrastructure**: Docker, Kubernetes, monitoring, logging, CI/CD pipelines

### 📊 **Comprehensive Analysis**
- **Code Structure**: Directory trees, file organization, architectural patterns
- **Dependencies**: Internal relationships, external packages, circular dependency detection
- **Backend APIs**: Multi-framework route detection, middleware analysis, API architecture scoring
- **Database Analysis**: ORM pattern detection, schema relationships, query optimization opportunities
- **Security Assessment**: Vulnerability scanning, authentication flow analysis, secret management review
- **Performance Profiling**: Caching patterns, async implementations, performance bottleneck identification
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
node dist/main.js scan /path/to/your/project -o testing.md

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

### **Backend API & Server Framework Analysis**
```markdown
✅ Server Frameworks:
   • Express.js (routes, middleware chains, app configuration)
   • NestJS (decorators, modules, dependency injection, guards)
   • Fastify (plugin system, route schemas, hooks)
   • Koa (middleware composition, context handling)
   • GraphQL/Apollo Server (resolvers, schemas, subscriptions)
   • Socket.io (event handlers, namespaces, rooms)

✅ Database & ORM Analysis:
   • Prisma (models, relations, migrations)
   • TypeORM (entities, decorators, relationships)
   • Sequelize (models, associations, hooks)
   • Mongoose (schemas, models, virtuals)
   • SQLAlchemy (Python ORM detection)
   • Query analysis and N+1 problem detection

✅ API Architecture:
   • RESTful design compliance scoring
   • OpenAPI/Swagger documentation detection
   • API versioning strategies (URL path, headers)
   • Rate limiting implementation analysis
   • CORS configuration detection
   • Content negotiation and caching strategies

✅ Security Analysis:
   • Authentication patterns (JWT, OAuth, session-based)
   • Authorization models (RBAC, ACL, custom)
   • Input validation frameworks (Joi, Yup, Zod, class-validator)
   • Output sanitization and XSS protection
   • Secret management (env vars, vaults, hardcoded detection)
   • Security header implementation
   • Vulnerability detection (code injection, XSS, etc.)

✅ Performance & Reliability:
   • Async/await patterns and error propagation
   • Caching implementations (Redis, memory, HTTP)
   • Background job processing and queues
   • Database connection pooling
   • Circuit breaker patterns
   • Retry logic and exponential backoff

✅ Infrastructure & DevOps:
   • Configuration management patterns
   • Structured logging implementations
   • Health check endpoints
   • Monitoring and alerting setup
   • Containerization (Docker, Kubernetes)
   • CI/CD pipeline detection
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
- **Server Framework**: NestJS with Express adapter, 23 decorated routes
- **API Architecture**: RESTful design (92% compliance), OpenAPI 3.0 documentation
- **Authentication**: JWT + refresh token pattern, Azure AD integration, RBAC authorization
- **Database**: Prisma ORM with PostgreSQL, TypeORM entities with relationships
- **Security**: Input validation (Joi), XSS protection, secret management via Azure Key Vault
- **Performance**: Redis caching layer, background job processing, connection pooling
- **Messaging**: Azure Service Bus with retry patterns and dead letter handling

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
- **Server Frameworks** (Express.js, NestJS, Fastify, Koa, GraphQL/Apollo, Socket.io)
- **Database & ORM** (Prisma, TypeORM, Sequelize, Mongoose, SQLAlchemy)
- **Authentication & Security** (JWT, OAuth, session management, input validation, secret management)
- **API Architecture** (REST compliance, OpenAPI/Swagger, versioning, rate limiting, caching)
- **Performance** (Async patterns, connection pooling, background jobs, caching strategies)
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