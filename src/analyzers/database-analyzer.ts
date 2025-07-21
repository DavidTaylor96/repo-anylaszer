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

    // Look for additional schema files with enhanced ORM support
    schemas.push(...this.findPrismaSchemas());
    schemas.push(...this.findTypeORMSchemas());
    schemas.push(...this.findSequelizeSchemas());
    schemas.push(...this.findMongooseSchemas());
    schemas.push(...this.findSQLAlchemySchemas());
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

  // Enhanced ORM Schema Detection Methods

  private findTypeORMSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for TypeORM Entity decorator
      if (fileContent.includes('@Entity(') || fileContent.includes('import') && fileContent.includes('typeorm')) {
        schemas.push(...this.parseTypeORMEntities(filePath, fileContent));
      }
    }

    return schemas;
  }

  private findSequelizeSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for Sequelize model definitions
      if (fileContent.includes('sequelize.define') || fileContent.includes('DataTypes') || 
          fileContent.includes('Model.init')) {
        schemas.push(...this.parseSequelizeModels(filePath, fileContent));
      }
    }

    return schemas;
  }

  private findMongooseSchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for Mongoose schema definitions
      if (fileContent.includes('mongoose.Schema') || fileContent.includes('Schema(')) {
        schemas.push(...this.parseMongooseSchemas(filePath, fileContent));
      }
    }

    return schemas;
  }

  private findSQLAlchemySchemas(): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      const fileContent = this.getFileContent(filePath);
      if (!fileContent) continue;

      // Check for SQLAlchemy model definitions
      if (fileContent.includes('declarative_base') || fileContent.includes('Column') || 
          fileContent.includes('sqlalchemy')) {
        schemas.push(...this.parseSQLAlchemyModels(filePath, fileContent));
      }
    }

    return schemas;
  }

  private parseTypeORMEntities(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for @Entity decorator followed by class
      if (line.includes('@Entity(')) {
        let className = '';
        // Find the class name on subsequent lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const classMatch = lines[j].match(/export\s+class\s+(\w+)/);
          if (classMatch) {
            className = classMatch[1];
            break;
          }
        }

        if (className) {
          const fields = this.extractTypeORMFields(content, className);
          const relationships = this.extractTypeORMRelationships(content, className);

          schemas.push({
            name: className,
            type: 'entity',
            fields,
            relationships,
            indexes: [],
            file: filePath,
            framework: 'typeorm',
            lineStart: i + 1
          });
        }
      }
    }

    return schemas;
  }

  private parseSequelizeModels(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for sequelize.define or Model.init patterns
      const defineMatch = line.match(/sequelize\.define\(['"`](\w+)['"`]/);
      const modelMatch = line.match(/class\s+(\w+)\s+extends\s+Model/);
      
      if (defineMatch || modelMatch) {
        const modelName = defineMatch ? defineMatch[1] : (modelMatch ? modelMatch[1] : '');
        if (modelName) {
          const fields = this.extractSequelizeFields(content, modelName);
          
          schemas.push({
            name: modelName,
            type: 'model',
            fields,
            relationships: [],
            indexes: [],
            file: filePath,
            framework: 'sequelize',
            lineStart: i + 1
          });
        }
      }
    }

    return schemas;
  }

  private parseMongooseSchemas(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for mongoose.Schema or new Schema
      if (line.includes('mongoose.Schema') || line.includes('new Schema')) {
        const schemaVarMatch = line.match(/(?:const|let|var)\s+(\w+(?:Schema)?)/);
        if (schemaVarMatch) {
          const schemaName = schemaVarMatch[1];
          const fields = this.extractMongooseFields(content, schemaName);
          
          schemas.push({
            name: schemaName.replace('Schema', ''),
            type: 'collection',
            fields,
            relationships: [],
            indexes: [],
            file: filePath,
            framework: 'mongoose',
            lineStart: i + 1
          });
        }
      }
    }

    return schemas;
  }

  private parseSQLAlchemyModels(filePath: string, content: string): DatabaseSchemaInfo[] {
    const schemas: DatabaseSchemaInfo[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Look for SQLAlchemy model classes
      if (line.includes('class') && line.includes('Base')) {
        const classMatch = line.match(/class\s+(\w+)/);
        if (classMatch) {
          const className = classMatch[1];
          const fields = this.extractSQLAlchemyFields(content, className);
          
          schemas.push({
            name: className,
            type: 'model',
            fields,
            relationships: [],
            indexes: [],
            file: filePath,
            framework: 'sqlalchemy',
            lineStart: i + 1
          });
        }
      }
    }

    return schemas;
  }

  private extractTypeORMFields(content: string, className: string): any[] {
    const fields: any[] = [];
    const lines = content.split('\n');
    let inClass = false;

    for (const line of lines) {
      if (line.includes(`class ${className}`)) {
        inClass = true;
        continue;
      }
      
      if (inClass && line.includes('}') && !line.includes('{')) {
        break;
      }

      if (inClass && line.includes('@Column(')) {
        const fieldMatch = line.match(/(\w+)\s*:\s*(\w+)/);
        if (fieldMatch) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2],
            nullable: line.includes('nullable: true'),
            unique: line.includes('unique: true'),
            primaryKey: false,
            constraints: []
          });
        }
      }

      if (inClass && line.includes('@PrimaryGeneratedColumn(')) {
        const fieldMatch = line.match(/(\w+)\s*:\s*(\w+)/);
        if (fieldMatch) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2],
            nullable: false,
            unique: true,
            primaryKey: true,
            constraints: []
          });
        }
      }
    }

    return fields;
  }

  private extractTypeORMRelationships(content: string, className: string): any[] {
    const relationships: any[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.includes('@OneToOne(') || line.includes('@OneToMany(') || 
          line.includes('@ManyToOne(') || line.includes('@ManyToMany(')) {
        const relationType = line.includes('OneToOne') ? 'oneToOne' : 
                           line.includes('OneToMany') ? 'oneToMany' :
                           line.includes('ManyToOne') ? 'manyToOne' : 'manyToMany';
        
        const targetMatch = line.match(/=>\s*(\w+)/);
        if (targetMatch) {
          relationships.push({
            type: relationType,
            target: targetMatch[1],
            foreignKey: undefined,
            joinColumn: undefined
          });
        }
      }
    }

    return relationships;
  }

  private extractSequelizeFields(content: string, modelName: string): any[] {
    const fields: any[] = [];
    const lines = content.split('\n');

    // Look for field definitions in the model
    for (const line of lines) {
      if (line.includes('DataTypes.')) {
        const fieldMatch = line.match(/(\w+)\s*:\s*\{?[^,}]*DataTypes\.(\w+)/);
        if (fieldMatch) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2],
            nullable: !line.includes('allowNull: false'),
            unique: line.includes('unique: true'),
            primaryKey: line.includes('primaryKey: true'),
            constraints: []
          });
        }
      }
    }

    return fields;
  }

  private extractMongooseFields(content: string, schemaName: string): any[] {
    const fields: any[] = [];
    const lines = content.split('\n');
    let inSchema = false;

    for (const line of lines) {
      if (line.includes(`${schemaName} = new`) || line.includes(`${schemaName}(`)) {
        inSchema = true;
        continue;
      }

      if (inSchema && line.includes('});')) {
        break;
      }

      if (inSchema) {
        const fieldMatch = line.match(/(\w+)\s*:\s*\{?\s*type\s*:\s*(\w+)/);
        if (fieldMatch) {
          fields.push({
            name: fieldMatch[1],
            type: fieldMatch[2],
            nullable: !line.includes('required: true'),
            unique: line.includes('unique: true'),
            primaryKey: fieldMatch[1] === '_id',
            constraints: []
          });
        }
      }
    }

    return fields;
  }

  private extractSQLAlchemyFields(content: string, className: string): any[] {
    const fields: any[] = [];
    const lines = content.split('\n');
    let inClass = false;

    for (const line of lines) {
      if (line.includes(`class ${className}`)) {
        inClass = true;
        continue;
      }

      if (inClass && line.includes('Column(')) {
        const fieldMatch = line.match(/(\w+)\s*=\s*Column\(([^)]+)\)/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          const columnDef = fieldMatch[2];
          
          fields.push({
            name: fieldName,
            type: this.extractSQLAlchemyType(columnDef),
            nullable: columnDef.includes('nullable=True'),
            unique: columnDef.includes('unique=True'),
            primaryKey: columnDef.includes('primary_key=True'),
            constraints: []
          });
        }
      }
    }

    return fields;
  }

  private extractSQLAlchemyType(columnDef: string): string {
    if (columnDef.includes('Integer')) return 'Integer';
    if (columnDef.includes('String')) return 'String';
    if (columnDef.includes('Boolean')) return 'Boolean';
    if (columnDef.includes('DateTime')) return 'DateTime';
    if (columnDef.includes('Text')) return 'Text';
    return 'Unknown';
  }
}