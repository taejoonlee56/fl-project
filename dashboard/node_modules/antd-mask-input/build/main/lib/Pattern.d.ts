import { FormatCharacters } from './helpers';
export declare class Pattern {
    placeholderChar: string;
    formatCharacters: FormatCharacters;
    source: string;
    /** Pattern characters after escape characters have been processed. */
    pattern: any[];
    /** Length of the pattern after escape characters have been processed. */
    length: number;
    /** Index of the first editable character. */
    firstEditableIndex: null | number;
    /** Index of the last editable character. */
    lastEditableIndex: null | number;
    /** Lookup for indices of editable characters in the pattern. */
    _editableIndices: {
        [key: number]: boolean;
    };
    /** If true, only the pattern before the last valid value character shows. */
    isRevealingMask: boolean;
    constructor(source: string, formatCharacters: FormatCharacters, placeholderChar: string, isRevealingMask?: boolean);
    _parse(): void;
    formatValue(value: string[]): string[];
    isEditableIndex(index: number): boolean;
    isValidAtIndex(char: string, index: number): boolean;
    transform(char: string, index: number): string;
}
