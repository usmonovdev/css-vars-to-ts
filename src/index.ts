import fs from 'fs';
import path from 'path';

interface ConverterOptions {
  exportName?: string;
  removeComments?: boolean;
}

export class CssVarsConverter {
  private parseCssVariables(content: string, options: ConverterOptions = {}): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Remove comments if option is enabled
    let cleanContent = content;
    if (options.removeComments) {
      // Remove single-line comments
      cleanContent = cleanContent.replace(/\/\/.*$/gm, '');
      // Remove multi-line comments
      cleanContent = cleanContent.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    const rootRegex = /:root\s*{([^}]*)}/;
    const varRegex = /--([^:]+):\s*([^;]+);/g;

    const rootMatch = cleanContent.match(rootRegex);
    if (!rootMatch) return variables;

    const rootContent = rootMatch[1];
    let match;

    while ((match = varRegex.exec(rootContent)) !== null) {
      const [, name, value] = match;
      // Convert all dashes (one or more) to single underscore
      const cleanName = name.trim().replace(/[-]+/g, '_');
      const cleanValue = value.trim();
      variables[cleanName] = cleanValue;
    }

    return variables;
  }

  private generateTypeScriptCode(variables: Record<string, string>, options: ConverterOptions = {}): string {
    const colorGroups: Record<string, Record<string, string>> = {};

    // Group variables and create color object structure
    Object.entries(variables).forEach(([key, value]) => {
      // Split by underscore to group colors
      const parts = key.split('_');
      if (parts.length >= 2) {
        const group = parts[0];
        // Use the remaining parts as the shade name, joined by underscore
        const shade = parts.slice(1).join('_');
        if (!colorGroups[group]) {
          colorGroups[group] = {};
        }
        colorGroups[group][`${group}_${shade}`] = value;
      }
    });

    // Generate TypeScript code
    let code = '';
    Object.entries(colorGroups).forEach(([group, colors]) => {
      code += `const ${group}Color = {\n`;
      Object.entries(colors).forEach(([key, value]) => {
        code += `  ${key}: "${value}",\n`;
      });
      code += '};\n\n';
    });

    const exportName = options.exportName || 'colors';
    code += `export const ${exportName} = {\n`;
    Object.keys(colorGroups).forEach((group) => {
      code += `  ...${group}Color,\n`;
    });
    code += '};\n\n';
    
    code += `export type T${exportName.charAt(0).toUpperCase() + exportName.slice(1)} = keyof typeof ${exportName};\n`;

    return code;
  }

  public convert(inputPath: string, outputPath: string, options: ConverterOptions = {}): void {
    try {
      // Check if input file exists
      if (!fs.existsSync(inputPath)) {
        throw new Error(`Input file not found: ${inputPath}`);
      }

      // Create output directory if it doesn't exist
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Read CSS file
      const cssContent = fs.readFileSync(inputPath, 'utf-8');
      
      // Parse variables
      const variables = this.parseCssVariables(cssContent, options);
      
      // Generate TypeScript code
      const tsCode = this.generateTypeScriptCode(variables, options);
      
      // Write to output file
      fs.writeFileSync(outputPath, tsCode);
      
      console.log('✅ Conversion completed successfully!');
      console.log(`Input: ${inputPath}`);
      console.log(`Output: ${outputPath}`);
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error occurred');
      process.exit(1);
    }
  }
}