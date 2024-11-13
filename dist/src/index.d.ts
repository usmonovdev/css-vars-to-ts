interface ConverterOptions {
    exportName?: string;
    removeComments?: boolean;
}
export declare class CssVarsConverter {
    private parseCssVariables;
    private generateTypeScriptCode;
    convert(inputPath: string, outputPath: string, options?: ConverterOptions): void;
}
export {};
