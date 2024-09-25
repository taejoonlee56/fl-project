import { DEFAULT_PLACEHOLDER_CHAR, mergeFormatCharacters } from './helpers';
import { Pattern } from './Pattern';
export class InputMask {
    constructor(options) {
        this.emptyValue = '';
        this._history = [];
        this._historyIndex = null;
        this._lastOp = null;
        this._lastSelection = null;
        const mergedOptions = {
            ...{
                isRevealingMask: false,
                placeholderChar: DEFAULT_PLACEHOLDER_CHAR,
                selection: { start: 0, end: 0 },
                value: ''
            },
            ...options
        };
        if (!mergedOptions.pattern) {
            throw new Error('InputMask: you must provide a pattern.');
        }
        if (typeof mergedOptions.placeholderChar !== 'string' ||
            mergedOptions.placeholderChar.length > 1) {
            throw new Error('InputMask: placeholderChar should be a single character or an empty string.');
        }
        this.placeholderChar = mergedOptions.placeholderChar;
        this.formatCharacters = mergeFormatCharacters(mergedOptions.formatCharacters);
        this.setPattern(mergedOptions.pattern, {
            value: mergedOptions.value,
            selection: mergedOptions.selection,
            isRevealingMask: mergedOptions.isRevealingMask
        });
    }
    setPattern(patternSource, options) {
        const merged = {
            selection: { start: 0, end: 0 },
            value: '',
            ...options
        };
        this.pattern = new Pattern(patternSource, this.formatCharacters, this.placeholderChar, merged.isRevealingMask);
        this.setValue(merged.value);
        this.emptyValue = this.pattern.formatValue([]).join('');
        this.selection = merged.selection;
        this._resetHistory();
    }
    setValue(value) {
        if (value == null) {
            value = '';
        }
        this.value = this.pattern.formatValue((value || '').split(''));
    }
    _resetHistory() {
        this._history = [];
        this._historyIndex = null;
        this._lastOp = null;
        this._lastSelection = { ...this.selection };
    }
    getValue() {
        if (this.pattern.isRevealingMask) {
            this.value = this.pattern.formatValue((this.getRawValue() || '').split(''));
        }
        return (this.value || []).join('');
    }
    getRawValue() {
        var rawValue = [];
        for (var i = 0; i < this.value.length; i++) {
            if (this.pattern._editableIndices[i] === true) {
                rawValue.push(this.value[i]);
            }
        }
        return rawValue.join('');
    }
    /**
     * Applies a single character of input based on the current selection.
     * @param {string} char
     * @return {boolean} true if a change has been made to value or selection as a
     *   result of the input, false otherwise.
     */
    input(char) {
        // Ignore additional input if the cursor's at the end of the pattern
        if (this.selection.start === this.selection.end &&
            this.selection.start === this.pattern.length) {
            return false;
        }
        const selectionBefore = copy(this.selection);
        const valueBefore = this.getValue();
        let inputIndex = this.selection.start;
        // If the cursor or selection is prior to the first editable character, make
        // sure any input given is applied to it.
        if (inputIndex < this.pattern.firstEditableIndex) {
            inputIndex = this.pattern.firstEditableIndex;
        }
        // Bail out or add the character to input
        if (this.pattern.isEditableIndex(inputIndex)) {
            if (!this.pattern.isValidAtIndex(char, inputIndex)) {
                return false;
            }
            this.value[inputIndex] = this.pattern.transform(char, inputIndex);
        }
        else {
            console.log('not editable');
        }
        // If multiple characters were selected, blank the remainder out based on the
        // pattern.
        let end = this.selection.end - 1;
        while (end > inputIndex) {
            if (this.pattern.isEditableIndex(end)) {
                this.value[end] = this.placeholderChar;
            }
            end--;
        }
        // Advance the cursor to the next character
        this.selection.start = this.selection.end = inputIndex + 1;
        // Skip over any subsequent static characters
        while (this.pattern.length > this.selection.start &&
            !this.pattern.isEditableIndex(this.selection.start)) {
            this.selection.start++;
            this.selection.end++;
        }
        // History
        if (this._historyIndex != null) {
            // Took more input after undoing, so blow any subsequent history away
            this._history.splice(this._historyIndex, this._history.length - this._historyIndex);
            this._historyIndex = null;
        }
        if (this._lastOp !== 'input' ||
            selectionBefore.start !== selectionBefore.end ||
            (this._lastSelection !== null &&
                selectionBefore.start !== this._lastSelection.start)) {
            this._history.push({
                value: valueBefore,
                selection: selectionBefore,
                lastOp: this._lastOp
            });
        }
        this._lastOp = 'input';
        this._lastSelection = copy(this.selection);
        return true;
    }
    /**
     * Attempts to delete from the value based on the current cursor position or
     * selection.
     * @return {boolean} true if the value or selection changed as the result of
     *   backspacing, false otherwise.
     */
    backspace() {
        // If the cursor is at the start there's nothing to do
        if (this.selection.start === 0 && this.selection.end === 0) {
            return false;
        }
        var selectionBefore = { ...this.selection };
        var valueBefore = this.getValue();
        // No range selected - work on the character preceding the cursor
        if (this.selection.start === this.selection.end) {
            if (this.pattern.isEditableIndex(this.selection.start - 1)) {
                if (this.pattern.isRevealingMask) {
                    this.value.splice(this.selection.start - 1);
                }
                else {
                    this.value[this.selection.start - 1] = this.placeholderChar;
                }
            }
            this.selection.start--;
            this.selection.end--;
        }
        // Range selected - delete characters and leave the cursor at the start of the selection
        else {
            var end = this.selection.end - 1;
            while (end >= this.selection.start) {
                if (this.pattern.isEditableIndex(end)) {
                    this.value[end] = this.placeholderChar;
                }
                end--;
            }
            this.selection.end = this.selection.start;
        }
        // History
        if (this._historyIndex != null) {
            // Took more input after undoing, so blow any subsequent history away
            this._history.splice(this._historyIndex, this._history.length - this._historyIndex);
        }
        if (this._lastOp !== 'backspace' ||
            selectionBefore.start !== selectionBefore.end ||
            (this._lastSelection !== null &&
                selectionBefore.start !== this._lastSelection.start)) {
            this._history.push({
                value: valueBefore,
                selection: selectionBefore,
                lastOp: this._lastOp
            });
        }
        this._lastOp = 'backspace';
        this._lastSelection = { ...this.selection };
        return true;
    }
    /**
     * Attempts to paste a string of input at the current cursor position or over
     * the top of the current selection.
     * Invalid content at any position will cause the paste to be rejected, and it
     * may contain static parts of the mask's pattern.
     * @param {string} input
     * @return {boolean} true if the paste was successful, false otherwise.
     */
    paste(input) {
        // This is necessary because we're just calling input() with each character
        // and rolling back if any were invalid, rather than checking up-front.
        var initialState = {
            value: this.value.slice(),
            selection: { ...this.selection },
            _lastOp: this._lastOp,
            _history: this._history.slice(),
            _historyIndex: this._historyIndex,
            _lastSelection: { ...this._lastSelection }
        };
        // If there are static characters at the start of the pattern and the cursor
        // or selection is within them, the static characters must match for a valid
        // paste.
        if (this.selection.start < this.pattern.firstEditableIndex) {
            for (var i = 0, l = this.pattern.firstEditableIndex - this.selection.start; i < l; i++) {
                if (input.charAt(i) !== this.pattern.pattern[i]) {
                    return false;
                }
            }
            // Continue as if the selection and input started from the editable part of
            // the pattern.
            input = input.substring(this.pattern.firstEditableIndex - this.selection.start);
            this.selection.start = this.pattern.firstEditableIndex;
        }
        for (i = 0, l = input.length; i < l && this.selection.start <= this.pattern.lastEditableIndex; i++) {
            var valid = this.input(input.charAt(i));
            // Allow static parts of the pattern to appear in pasted input - they will
            // already have been stepped over by input(), so verify that the value
            // deemed invalid by input() was the expected static character.
            if (!valid) {
                if (this.selection.start > 0) {
                    // XXX This only allows for one static character to be skipped
                    var patternIndex = this.selection.start - 1;
                    if (!this.pattern.isEditableIndex(patternIndex) &&
                        input.charAt(i) === this.pattern.pattern[patternIndex]) {
                        continue;
                    }
                }
                Object.keys(initialState).forEach(key => {
                    // @ts-ignore
                    this[key] = initialState[key];
                });
                return false;
            }
        }
        return true;
    }
    undo() {
        // If there is no history, or nothing more on the history stack, we can't undo
        if (this._history.length === 0 || this._historyIndex === 0) {
            return false;
        }
        var historyItem;
        if (this._historyIndex == null) {
            // Not currently undoing, set up the initial history index
            this._historyIndex = this._history.length - 1;
            historyItem = this._history[this._historyIndex];
            // Add a new history entry if anything has changed since the last one, so we
            // can redo back to the initial state we started undoing from.
            var value = this.getValue();
            if (historyItem.value !== value ||
                historyItem.selection.start !== this.selection.start ||
                historyItem.selection.end !== this.selection.end) {
                this._history.push({
                    value: value,
                    selection: { ...this.selection },
                    lastOp: this._lastOp,
                    startUndo: true
                });
            }
        }
        else {
            historyItem = this._history[--this._historyIndex];
        }
        this.value = historyItem.value.split('');
        this.selection = historyItem.selection;
        this._lastOp = historyItem.lastOp;
        return true;
    }
    redo() {
        if (this._history.length === 0 || this._historyIndex == null) {
            return false;
        }
        var historyItem = this._history[++this._historyIndex];
        // If this is the last history item, we're done redoing
        if (this._historyIndex === this._history.length - 1) {
            this._historyIndex = null;
            // If the last history item was only added to start undoing, remove it
            if (historyItem.startUndo) {
                this._history.pop();
            }
        }
        this.value = historyItem.value.split('');
        this.selection = historyItem.selection;
        this._lastOp = historyItem.lastOp;
        return true;
    }
    setSelection(selection) {
        this.selection = { ...selection };
        if (this.selection.start === this.selection.end) {
            if (this.selection.start < this.pattern.firstEditableIndex) {
                this.selection.start = this.selection.end = this.pattern
                    .firstEditableIndex;
                return true;
            }
            // Set selection to the first editable, non-placeholder character before the selection
            // OR to the beginning of the pattern
            var index = this.selection.start;
            while (index >= this.pattern.firstEditableIndex) {
                if ((this.pattern.isEditableIndex(index - 1) &&
                    this.value[index - 1] !== this.placeholderChar) ||
                    index === this.pattern.firstEditableIndex) {
                    this.selection.start = this.selection.end = index;
                    break;
                }
                index--;
            }
            return true;
        }
        return false;
    }
}
InputMask.Pattern = Pattern;
function extend(dest, src) {
    if (src) {
        let props = Object.keys(src);
        for (var i = 0, l = props.length; i < l; i++) {
            dest[props[i]] = src[props[i]];
        }
    }
    return dest;
}
function copy(obj) {
    return extend({}, obj);
}
export default InputMask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRtYXNrLWNvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2lucHV0bWFzay1jb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFDTCx3QkFBd0IsRUFFeEIscUJBQXFCLEVBQ3RCLE1BQU0sV0FBVyxDQUFDO0FBQ25CLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFhcEMsTUFBTSxPQUFPLFNBQVM7SUFzQnBCLFlBQVksT0FBeUI7UUFickMsZUFBVSxHQUFHLEVBQUUsQ0FBQztRQUVoQixhQUFRLEdBS0YsRUFBRSxDQUFDO1FBRVQsa0JBQWEsR0FBa0IsSUFBSSxDQUFDO1FBQ3BDLFlBQU8sR0FBa0IsSUFBSSxDQUFDO1FBQzlCLG1CQUFjLEdBQTJCLElBQUksQ0FBQztRQUc1QyxNQUFNLGFBQWEsR0FBWTtZQUM3QixHQUFHO2dCQUNELGVBQWUsRUFBRSxLQUFLO2dCQUN0QixlQUFlLEVBQUUsd0JBQXdCO2dCQUN6QyxTQUFTLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7Z0JBQy9CLEtBQUssRUFBRSxFQUFFO2FBQ1Y7WUFDRCxHQUFHLE9BQU87U0FDQSxDQUFDO1FBRWIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7WUFDMUIsTUFBTSxJQUFJLEtBQUssQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1NBQzNEO1FBRUQsSUFDRSxPQUFPLGFBQWEsQ0FBQyxlQUFlLEtBQUssUUFBUTtZQUNqRCxhQUFhLENBQUMsZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ3hDO1lBQ0EsTUFBTSxJQUFJLEtBQUssQ0FDYiw2RUFBNkUsQ0FDOUUsQ0FBQztTQUNIO1FBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFDO1FBQ3JELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxxQkFBcUIsQ0FDM0MsYUFBYSxD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