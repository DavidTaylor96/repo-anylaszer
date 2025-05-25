import * as fs from 'fs';
import { ParseResult, FunctionInfo, ClassInfo, ImportInfo, ExportInfo, ConstantInfo } from '../types';

export abstract class BaseParser {
  protected filePath: string;
  protected content: string;
  protected lines: string[];

  constructor(filePath: string) {
    this.filePath = filePath;
    this.content = fs.readFileSync(filePath, 'utf-8');
    this.lines = this.content.split('\n');
  }

  public abstract parse(): ParseResult;

  protected extractDocstring(startLine: number, endLine: number): string | undefined {
    // Look for docstring patterns in the range
    for (let i = startLine; i <= Math.min(endLine + 2, this.lines.length - 1); i++) {
      const line = this.lines[i].trim();
      if (line.includes('"""') || line.includes("'''") || line.includes('/**') || line.includes('//')) {
        return this.extractDocstringFromLine(i);
      }
    }
    return undefined;
  }

  private extractDocstringFromLine(lineIndex: number): string {
    const line = this.lines[lineIndex];
    
    // Python-style docstrings
    if (line.includes('"""') || line.includes("'''")) {
      const quote = line.includes('"""') ? '"""' : "'''";
      let docstring = '';
      let i = lineIndex;
      
      // Single line docstring
      if (line.split(quote).length >= 3) {
        return line.split(quote)[1].trim();
      }
      
      // Multi-line docstring
      while (i < this.lines.length) {
        const currentLine = this.lines[i];
        docstring += currentLine.trim() + ' ';
        if (i > lineIndex && currentLine.includes(quote)) {
          break;
        }
        i++;
      }
      
      return docstring.replace(new RegExp(quote, 'g'), '').trim();
    }
    
    // JavaScript/TypeScript JSDoc
    if (line.includes('/**')) {
      let docstring = '';
      let i = lineIndex;
      
      while (i < this.lines.length) {
        const currentLine = this.lines[i].trim();
        docstring += currentLine.replace(/^\/?\*+\/?/, '').trim() + ' ';
        if (currentLine.includes('*/')) {
          break;
        }
        i++;
      }
      
      return docstring.trim();
    }
    
    // Single line comments
    if (line.includes('//') || line.includes('#')) {
      return line.replace(/^.*?(\/\/|#)/, '').trim();
    }
    
    return '';
  }

  protected findLineNumber(pattern: RegExp, startFrom: number = 0): number {
    for (let i = startFrom; i < this.lines.length; i++) {
      if (pattern.test(this.lines[i])) {
        return i + 1; // 1-indexed
      }
    }
    return -1;
  }

  protected findEndLine(startLine: number, openChar: string, closeChar: string): number {
    let depth = 0;
    let found = false;
    
    for (let i = startLine - 1; i < this.lines.length; i++) {
      const line = this.lines[i];
      
      for (const char of line) {
        if (char === openChar) {
          depth++;
          found = true;
        } else if (char === closeChar && found) {
          depth--;
          if (depth === 0) {
            return i + 1; // 1-indexed
          }
        }
      }
    }
    
    return startLine + 10; // Fallback
  }
}