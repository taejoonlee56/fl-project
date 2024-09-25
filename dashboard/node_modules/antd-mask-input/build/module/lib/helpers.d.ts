export declare function isUndo(e: KeyboardEvent): boolean;
export declare function isRedo(e: KeyboardEvent): boolean;
declare type GetSelectionResult = {
    start: number;
    end: number;
};
export declare function getSelection(el: HTMLInputElement): GetSelectionResult;
export declare function setSelection(el: HTMLInputElement, selection: GetSelectionResult): void;
/**
 * Merge an object defining format characters into the defaults.
 * Passing null/undefined for en existing format character removes it.
 * Passing a definition for an existing format character overrides it.
 */
export declare function mergeFormatCharacters(formatCharacters: FormatCharacters): {
    [x: string]: {
        transform?(str: string): string;
        validate(str: string): boolean;
    };
};
export declare const ESCAPE_CHAR = "\\";
export declare const DIGIT_RE: RegExp;
export declare const LETTER_RE: RegExp;
export declare const ALPHANNUMERIC_RE: RegExp;
export declare const DEFAULT_PLACEHOLDER_CHAR = "_";
export declare const DEFAULT_FORMAT_CHARACTERS: FormatCharacters;
export declare type FormatCharacters = {
    [key: string]: {
        transform?(str: string): string;
        validate(str: string): boolean;
    };
};
export {};
