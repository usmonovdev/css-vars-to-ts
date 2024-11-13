"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssVarsConverter = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class CssVarsConverter {
    parseCssVariables(content, options = {}) {
        const variables = {};
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
        if (!rootMatch)
            return variables;
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
    generateTypeScriptCode(variables, options = {}) {
        const colorGroups = {};
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
    convert(inputPath, outputPath, options = {}) {
        try {
            // Check if input file exists
            if (!fs_1.default.existsSync(inputPath)) {
                throw new Error(`Input file not found: ${inputPath}`);
            }
            // Create output directory if it doesn't exist
            const outputDir = path_1.default.dirname(outputPath);
            if (!fs_1.default.existsSync(outputDir)) {
                fs_1.default.mkdirSync(outputDir, { recursive: true });
            }
            // Read CSS file
            const cssContent = fs_1.default.readFileSync(inputPath, 'utf-8');
            // Parse variables
            const variables = this.parseCssVariables(cssContent, options);
            // Generate TypeScript code
            const tsCode = this.generateTypeScriptCode(variables, options);
            // Write to output file
            fs_1.default.writeFileSync(outputPath, tsCode);
            console.log('✅ Conversion completed successfully!');
            console.log(`Input: ${inputPath}`);
            console.log(`Output: ${outputPath}`);
        }
        catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error occurred');
            process.exit(1);
        }
    }
}
exports.CssVarsConverter = CssVarsConverter;
