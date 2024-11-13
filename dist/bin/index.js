#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        removeComments: true // default true qilib qo'ydik
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--name':
                options.exportName = args[++i];
                break;
            case '--keep-comments':
                options.removeComments = false;
                break;
            default:
                if (!options.inputFile) {
                    options.inputFile = arg;
                }
                else if (!options.outputFile) {
                    options.outputFile = arg;
                }
        }
    }
    return options;
}
function showHelp() {
    console.log(`
Usage: npx css-vars-to-ts <input-file> <output-file> [options]

Options:
  --name <name>      Export name for the colors object (default: "colors")
  --keep-comments    Keep CSS comments in processing
  
Examples:
  npx css-vars-to-ts input.css output.ts
  npx css-vars-to-ts input.css output.ts --name variables
  npx css-vars-to-ts input.css output.ts --keep-comments
  `);
}
function main() {
    const options = parseArgs();
    if (!options.inputFile || !options.outputFile) {
        showHelp();
        process.exit(1);
    }
    const converter = new src_1.CssVarsConverter();
    converter.convert(options.inputFile, options.outputFile, {
        exportName: options.exportName,
        removeComments: options.removeComments
    });
}
main();
