import { FileInfo, ParseResult, VectorEmbeddingInfo } from '../types';

export class VectorAnalyzer {
  private repoPath: string;
  private fileData: FileInfo[];
  private parserResults: Record<string, ParseResult>;

  constructor(repoPath: string, fileData: FileInfo[], parserResults: Record<string, ParseResult>) {
    this.repoPath = repoPath;
    this.fileData = fileData;
    this.parserResults = parserResults;
  }

  public async analyze(): Promise<VectorEmbeddingInfo[]> {
    const embeddings: VectorEmbeddingInfo[] = [];

    // Collect all embedding chunks from parser results
    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      if (parseResult.embeddingChunks) {
        embeddings.push(...parseResult.embeddingChunks);
      }
    }

    // Create additional semantic chunks
    embeddings.push(...this.createSemanticChunks());

    return embeddings;
  }

  private createSemanticChunks(): VectorEmbeddingInfo[] {
    const chunks: VectorEmbeddingInfo[] = [];

    // Create chunks for documentation and comments
    chunks.push(...this.createDocumentationChunks());
    
    // Create chunks for API endpoints
    chunks.push(...this.createAPIChunks());
    
    // Create chunks for configuration files
    chunks.push(...this.createConfigChunks());

    return chunks;
  }

  private createDocumentationChunks(): VectorEmbeddingInfo[] {
    const chunks: VectorEmbeddingInfo[] = [];
    const docFiles = this.fileData.filter(file => 
      file.extension === '.md' || 
      file.extension === '.txt' ||
      file.path.toLowerCase().includes('readme') ||
      file.path.toLowerCase().includes('doc')
    );

    for (const file of docFiles) {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(file.absolutePath, 'utf-8');
        
        // Split large documents into smaller chunks
        const sections = this.splitIntoSections(content);
        
        sections.forEach((section, index) => {
          chunks.push({
            id: `${file.path}:doc:${index}`,
            content: section,
            metadata: {
              file: file.path,
              type: 'comment',
              name: `Documentation section ${index + 1}`,
              lineStart: 1,
              lineEnd: section.split('\n').length,
              language: 'markdown',
              isDocumentation: true
            }
          });
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return chunks;
  }

  private createAPIChunks(): VectorEmbeddingInfo[] {
    const chunks: VectorEmbeddingInfo[] = [];

    for (const [filePath, parseResult] of Object.entries(this.parserResults)) {
      // Create chunks for functions that look like API endpoints
      parseResult.functions.forEach(func => {
        if (this.isAPIFunction(func.name, filePath)) {
          const content = this.getFunctionContent(filePath, func.lineStart, func.lineEnd);
          if (content) {
            chunks.push({
              id: `${filePath}:api:${func.name}`,
              content,
              metadata: {
                file: filePath,
                type: 'function',
                name: func.name,
                lineStart: func.lineStart,
                lineEnd: func.lineEnd,
                language: this.getLanguageFromExtension(filePath),
                isAPI: true,
                parameters: func.parameters.map(p => typeof p === 'string' ? p : p.name),
                returnType: func.returnType
              }
            });
          }
        }
      });
    }

    return chunks;
  }

  private createConfigChunks(): VectorEmbeddingInfo[] {
    const chunks: VectorEmbeddingInfo[] = [];
    const configFiles = this.fileData.filter(file => 
      file.extension === '.json' ||
      file.extension === '.yaml' ||
      file.extension === '.yml' ||
      file.extension === '.toml' ||
      file.path.includes('config') ||
      file.path.includes('.env')
    );

    for (const file of configFiles) {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(file.absolutePath, 'utf-8');
        
        chunks.push({
          id: `${file.path}:config`,
          content,
          metadata: {
            file: file.path,
            type: 'function', // Using function as a general type
            name: file.path.split('/').pop() || 'config',
            lineStart: 1,
            lineEnd: content.split('\n').length,
            language: file.extension.slice(1) || 'text',
            isConfiguration: true
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return chunks;
  }

  public async storeEmbeddings(embeddings: VectorEmbeddingInfo[], collectionName: string = 'codebase'): Promise<void> {
    try {
      // Optional: Store embeddings in ChromaDB if available
      // This is a placeholder for vector database integration
      console.log(`Would store ${embeddings.length} embeddings in collection: ${collectionName}`);
      
      // Example ChromaDB integration (commented out as it requires actual API)
      /*
      const { ChromaClient } = require('chromadb');
      const client = new ChromaClient();
      
      // Create or get collection
      const collection = await client.createCollection({
        name: collectionName,
        metadata: { description: 'Code repository embeddings' }
      });
      
      // Prepare documents for embedding
      const documents = embeddings.map(e => e.content);
      const metadatas = embeddings.map(e => e.metadata);
      const ids = embeddings.map(e => e.id);
      
      // Add documents to collection
      await collection.add({
        ids,
        documents,
        metadatas
      });
      */
    } catch (error) {
      console.warn('Vector database storage failed:', error);
    }
  }

  public async searchSimilar(query: string, collectionName: string = 'codebase', limit: number = 10): Promise<VectorEmbeddingInfo[]> {
    try {
      // Optional: Search similar embeddings in ChromaDB if available
      // This is a placeholder for vector search functionality
      console.log(`Would search for: "${query}" in collection: ${collectionName}`);
      
      // Example ChromaDB search (commented out as it requires actual API)
      /*
      const { ChromaClient } = require('chromadb');
      const client = new ChromaClient();
      
      const collection = await client.getCollection({ name: collectionName });
      
      const results = await collection.query({
        queryTexts: [query],
        nResults: limit
      });
      
      // Convert results back to VectorEmbeddingInfo format
      return results.ids[0].map((id, index) => ({
        id,
        content: results.documents[0][index],
        metadata: results.metadatas[0][index]
      }));
      */
      
      return [];
    } catch (error) {
      console.warn('Vector search failed:', error);
      return [];
    }
  }

  private splitIntoSections(content: string, maxChunkSize: number = 1000): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    let currentSection = '';

    for (const line of lines) {
      // Start new section on headers or when size limit reached
      if ((line.startsWith('#') || currentSection.length > maxChunkSize) && currentSection.length > 0) {
        sections.push(currentSection.trim());
        currentSection = line + '\n';
      } else {
        currentSection += line + '\n';
      }
    }

    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }

    return sections.filter(section => section.length > 50); // Filter out very short sections
  }

  private isAPIFunction(functionName: string, filePath: string): boolean {
    const apiIndicators = [
      'get', 'post', 'put', 'delete', 'patch',
      'handle', 'process', 'execute',
      'endpoint', 'route', 'api'
    ];

    const lowerName = functionName.toLowerCase();
    const lowerPath = filePath.toLowerCase();

    return apiIndicators.some(indicator => 
      lowerName.includes(indicator) || 
      lowerPath.includes('controller') ||
      lowerPath.includes('route') ||
      lowerPath.includes('api')
    );
  }

  private getFunctionContent(filePath: string, lineStart: number, lineEnd: number): string | null {
    try {
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(this.repoPath, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      return lines.slice(lineStart - 1, lineEnd).join('\n');
    } catch (error) {
      return null;
    }
  }

  private getLanguageFromExtension(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust'
    };

    return languageMap[extension || ''] || 'text';
  }

  public generateEmbeddingStats(embeddings: VectorEmbeddingInfo[]): any {
    const stats = {
      totalEmbeddings: embeddings.length,
      byType: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
      byFile: {} as Record<string, number>,
      averageContentLength: 0,
      totalContentLength: 0
    };

    let totalLength = 0;

    for (const embedding of embeddings) {
      // Count by type
      stats.byType[embedding.metadata.type] = (stats.byType[embedding.metadata.type] || 0) + 1;
      
      // Count by language
      stats.byLanguage[embedding.metadata.language] = (stats.byLanguage[embedding.metadata.language] || 0) + 1;
      
      // Count by file
      stats.byFile[embedding.metadata.file] = (stats.byFile[embedding.metadata.file] || 0) + 1;
      
      // Calculate content lengths
      totalLength += embedding.content.length;
    }

    stats.totalContentLength = totalLength;
    stats.averageContentLength = embeddings.length > 0 ? totalLength / embeddings.length : 0;

    return stats;
  }
}