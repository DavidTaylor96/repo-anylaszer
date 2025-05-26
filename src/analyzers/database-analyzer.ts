import * as fs from 'fs';
import * as path from 'path';
import { FileInfo, ParseResult, DatabaseAnalysisInfo, DatabaseSchemaInfo, MigrationInfo, QueryInfo, ConnectionInfo } from '../types';

export class DatabaseAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public analyze(): DatabaseAnalysisInfo {
    const schemas = this.extractDatabaseSchemas();
    const migrations = this.extractMigrations();
    const queries = this.extractQueries();
    const ormFrameworks = this.detectORMFrameworks();
    const databaseConnections = this.extractDatabaseConnections();

    return {
      schemas,
      migrations,
      queries,
      ormFrameworks,
      databaseConnections
    };
  }

  private extractDatabaseSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];

    // Extract schemas from parser results
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (parseResult.databaseSchemas) {
        schemas.push(...parseResult.databaseSchemas);
      }
    }

    // Look for additional schema files
    schemas.push(...this.findPrismaSchemas());
    schemas.push(...this.findSQLSchemas());
    schemas.push(...this.findMongoSchemas());

    return schemas;
  }

  private extractMigrations(): MigrationInfo[] {
    const migrations: MigrationInfo[] = [];

    // Look for migration files
    const migrationFiles = this.fileData.filter(file => 
      file.path.includes('migration') || 
      file.path.includes('migrate') ||
      file.path.includes('schema') ||
      file.extension === '.sql'
    );

    for (const file of migrationFiles) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf-8');
        const migration = this.parseMigrationFile(file.path, content);
        if (migration) {
          migrations.push(migration);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return migrations;
  }

  private extractQueries(): QueryInfo[] {
    const queries: QueryInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Extract SQL queries from code
      queries.push(...this.extractSQLQueries(filePath, fileContent));
      queries.push(...this.extractORMQueries(filePath, fileContent));
    }

    return queries;
  }

  private detectORMFrameworks(): string[] {
    const frameworks = new Set<string>();

    // Check package.json for ORM dependencies
    const packageJsonPath = path.join(this.repoPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const ormPackages = {
          'prisma': 'Prisma',
          '@prisma/client': 'Prisma',
          'typeorm': 'TypeORM',
          'sequelize': 'Sequelize',
          'mongoose': 'Mongoose',
          'knex': 'Knex',
          'objection': 'Objection.js',
          'bookshelf': 'Bookshelf.js',
          'waterline': 'Waterline',
          'mikro-orm': 'MikroORM'
        };

        for (const [pkg, framework] of Object.entries(ormPackages)) {
          if (dependencies[pkg]) {
            frameworks.add(framework);
          }
        }
      } catch (error) {
        // Skip if package.json can't be parsed
      }
    }

    // Check imports in code files
    for (const [_, parseResult] of Object.entries(this.parserResults)) {
      for (const importInfo of parseResult.imports) {
        if (importInfo.module.includes('prisma')) frameworks.add('Prisma');
        if (importInfo.module.includes('typeorm')) frameworks.add('TypeORM');
        if (importInfo.module.includes('sequelize')) frameworks.add('Sequelize');
        if (importInfo.module.includes('mongoose')) frameworks.add('Mongoose');
        if (importInfo.module.includes('knex')) frameworks.add('Knex');
      }
    }

    return Array.from(frameworks);
  }

  private extractDatabaseConnections(): ConnectionInfo[] {
    const connections: ConnectionInfo[] = [];

    // Look for database connection strings and configurations
    for (const file of this.fileData) {
      if (file.path.includes('config') || file.path.includes('env') || file.path.includes('database')) {
        try {
          const content = fs.readFileSync(file.absolutePath, 'utf-8');
          connections.push(...this.extractConnectionsFromFile(file.path, content));
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }

    return connections;
  }

  private findPrismaSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const prismaFiles = this.fileData.filter(file => file.extension === '.prisma');

    for (const file of prismaFiles) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf-8');
        schemas.push(...this.parsePrismaSchema(file.path, content));
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return schemas;
  }

  private findSQLSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const sqlFiles = this.fileData.filter(file => file.extension === '.sql');

    for (const file of sqlFiles) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf-8');
        schemas.push(...this.parseSQLSchema(file.path, content));
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return schemas;
  }

  private findMongoSchemas(): DatabaseSchemaInfo[] {
    // This would look for MongoDB schema definitions
    return [];
  }

  private parseMigrationFile(filePath: string, content: string): MigrationInfo | null {
    const operations: Array<{type: string, details: string}> = [];

    // Simple SQL migration parsing
    if (filePath.endsWith('.sql')) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('create table')) {
          operations.push({ type: 'CREATE_TABLE', details: line.trim() });
        } else if (trimmed.startsWith('alter table')) {
          operations.push({ type: 'ALTER_TABLE', details: line.trim() });
        } else if (trimmed.startsWith('drop table')) {
          operations.push({ type: 'DROP_TABLE', details: line.trim() });
        }
      }
    }

    if (operations.length > 0) {
      return {
        name: path.basename(filePath),
        file: filePath,
        operations
      };
    }

    return null;
  }

  private extractSQLQueries(filePath: string, content: string): QueryInfo[] {
    const queries: QueryInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for SQL query patterns
      const sqlPatterns = [
        { pattern: /SELECT\s+.+\s+FROM/i, type: 'select' as const },
        { pattern: /INSERT\s+INTO/i, type: 'insert' as const },
        { pattern: /UPDATE\s+.+\s+SET/i, type: 'update' as const },
        { pattern: /DELETE\s+FROM/i, type: 'delete' as const }
      ];

      for (const { pattern, type } of sqlPatterns) {
        if (pattern.test(line)) {
          queries.push({
            content: line.trim(),
            type,
            file: filePath,
            line: i + 1
          });
        }
      }
    }

    return queries;
  }

  private extractORMQueries(filePath: string, content: string): QueryInfo[] {
    const queries: QueryInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for ORM query patterns
      const ormPatterns = [
        /\.find\(/,
        /\.findOne\(/,
        /\.findMany\(/,
        /\.create\(/,
        /\.update\(/,
        /\.delete\(/,
        /\.query\(/,
        /\.rawQuery\(/
      ];

      for (const pattern of ormPatterns) {
        if (pattern.test(line)) {
          queries.push({
            content: line.trim(),
            type: 'raw',
            file: filePath,
            line: i + 1
          });
        }
      }
    }

    return queries;
  }

  private extractConnectionsFromFile(filePath: string, content: string): ConnectionInfo[] {
    const connections: ConnectionInfo[] = [];

    // Look for database connection patterns
    const connectionPatterns = [
      /DATABASE_URL\s*=\s*["']([^"']+)["']/,
      /mongodb:\/\/([^"'\s]+)/,
      /postgresql:\/\/([^"'\s]+)/,
      /mysql:\/\/([^"'\s]+)/,
      /redis:\/\/([^"'\s]+)/
    ];

    for (const pattern of connectionPatterns) {
      const match = content.match(pattern);
      if (match) {
        const url = match[1] || match[0];
        const type = this.extractDatabaseType(url);
        
        connections.push({
          type,
          file: filePath,
          isConfigFile: filePath.includes('config') || filePath.includes('env')
        });
      }
    }

    return connections;
  }

  private parsePrismaSchema(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
      
      if (modelMatch) {
        const modelName = modelMatch[1];
        const endLine = this.findEndBrace(lines, i);
        const fields = this.parsePrismaFields(lines.slice(i + 1, endLine));
        
        schemas.push({
          name: modelName,
          type: 'model',
          fields: fields.fields,
          relationships: fields.relationships,
          indexes: [],
          file: filePath,
          framework: 'prisma',
          lineStart: i + 1
        });
      }
    }

    return schemas;
  }

  private parseSQLSchema(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const tableMatch = line.match(/CREATE\s+TABLE\s+(\w+)/i);
      
      if (tableMatch) {
        const tableName = tableMatch[1];
        const endLine = this.findEndStatement(lines, i);
        const fields = this.parseSQLFields(lines.slice(i, endLine + 1));
        
        schemas.push({
          name: tableName,
          type: 'table',
          fields: fields.fields,
          relationships: [],
          indexes: [],
          file: filePath,
          framework: 'other',
          lineStart: i + 1
        });
      }
    }

    return schemas;
  }

  private getFileContent(filePath: string): string | null {
    try {
      const fullPath = path.join(this.repoPath, filePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  private extractDatabaseType(url: string): string {
    if (url.includes('mongodb')) return 'MongoDB';
    if (url.includes('postgresql') || url.includes('postgres')) return 'PostgreSQL';
    if (url.includes('mysql')) return 'MySQL';
    if (url.includes('redis')) return 'Redis';
    if (url.includes('sqlite')) return 'SQLite';
    return 'Unknown';
  }

  private findEndBrace(lines: string[], startLine: number): number {
    let braceCount = 1;
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('{')) braceCount++;
      if (line.includes('}')) braceCount--;
      if (braceCount === 0) return i;
    }
    return lines.length;
  }

  private findEndStatement(lines: string[], startLine: number): number {
    for (let i = startLine; i < lines.length; i++) {
      if (lines[i].includes(';')) return i;
    }
    return lines.length;
  }

  private parsePrismaFields(lines: string[]): {fields: any[], relationships: any[]} {
    // Simplified implementation
    return { fields: [], relationships: [] };
  }

  private parseSQLFields(lines: string[]): {fields: any[]} {
    // Simplified implementation
    return { fields: [] };
  }
}