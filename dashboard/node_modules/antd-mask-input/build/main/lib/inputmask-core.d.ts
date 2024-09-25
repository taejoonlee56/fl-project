import { FormatCharacters } from './helpers';
import { Pattern } from './Pattern';
declare type SelectionObject = {
    start: number;
    end: number;
};
declare type Options = {
    formatCharacters: FormatCharacters;
    pattern: string;
    isRevealingMask: boolean;
    placeholderChar: string;
    selection: SelectionObject;
    value: string;
};
export declare class InputMask {
    static Pattern: typeof Pattern;
    formatCharacters: FormatCharacters;
    pattern: Pattern;
    isRevealingMask: boolean;
    placeholderChar: string;
    selection: SelectionObject;
    value: string[];
    emptyValue: string;
    _history: {
        value: string;
        selection: SelectionObject;
        lastOp: string | null;
        startUndo?: boolean;
    }[];
    _historyIndex: null | number;
    _lastOp: null | string;
    _lastSelection: null | SelectionObject;
    constructor(options: Partial<Options>);
    setPattern(patternSource: string, options: Partial<Options>): void;
    setValue(value?: string): void;
    _resetHistory(): void;
    getValue(): string;
    getRawValue(): string;
    /**
     * Applies a single character of input based on the current selection.
     * @param {string} char
     * @return {boolean} true if a change has been made to value or selection as a
     *   result of the input, false otherwise.
     */
    input(char: string): boolean;
    /**
     * Attempts to delete from the value based on the current cursor position or
     * selection.
     * @return {boolean} true if the value or selection changed as the result of
     *   backspacing, false otherwise.
     */
    backspace(): boolean;
    /**
     * Attempts to paste a string of input at the current cursor position or over
     * the top of the current selection.
     * Invalid content at any position will cause the paste to be rejected, and it
     * may contain static parts of the mask's pattern.
     * @param {string} input
     * @return {boolean} true if the paste was successful, false otherwise.
     */
    paste(input: string): boolean;
    undo(): boolean;
    redo(): boolean;
    setSelection(selection: SelectionObject): boolean;
}
export default InputMask;
