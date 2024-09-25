"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const Pattern_1 = require("./Pattern");
class InputMask {
    constructor(options) {
        this.emptyValue = '';
        this._history = [];
        this._historyIndex = null;
        this._lastOp = null;
        this._lastSelection = null;
        const mergedOptions = Object.assign({
            isRevealingMask: false,
            placeholderChar: helpers_1.DEFAULT_PLACEHOLDER_CHAR,
            selection: { start: 0, end: 0 },
            value: ''
        }, options);
        if (!mergedOptions.pattern) {
            throw new Error('InputMask: you must provide a pattern.');
        }
        if (typeof mergedOptions.placeholderChar !== 'string' ||
            mergedOptions.placeholderChar.length > 1) {
            throw new Error('InputMask: placeholderChar should be a single character or an empty string.');
        }
        this.placeholderChar = mergedOptions.placeholderChar;
        this.formatCharacters = helpers_1.mergeFormatCharacters(mergedOptions.formatCharacters);
        this.setPattern(mergedOptions.pattern, {
            value: mergedOptions.value,
            selection: mergedOptions.selection,
            isRevealingMask: mergedOptions.isRevealingMask
        });
    }
    setPattern(patternSource, options) {
        const merged = Object.assign({ selection: { start: 0, end: 0 }, value: '' }, options);
        this.pattern = new Pattern_1.Pattern(patternSource, this.formatCharacters, this.placeholderChar, merged.isRevealingMask);
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
        this._lastSelection = Object.assign({}, this.selection);
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
        var selectionBefore = Object.assign({}, this.selection);
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
        this._lastSelection = Object.assign({}, this.selection);
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
            selection: Object.assign({}, this.selection),
            _lastOp: this._lastOp,
            _history: this._history.slice(),
            _historyIndex: this._historyIndex,
            _lastSelection: Object.assign({}, this._lastSelection)
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
                    selection: Object.assign({}, this.selection),
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
        this.selection = Object.assign({}, selection);
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
InputMask.Pattern = Pattern_1.Pattern;
exports.InputMask = InputMask;
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
exports.default = InputMask;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRtYXNrLWNvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2lucHV0bWFzay1jb3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsdUNBSW1CO0FBQ25CLHVDQUFvQztBQWFwQyxNQUFhLFNBQVM7SUFzQnBCLFlBQVksT0FBeUI7UUFickMsZUFBVSxHQUFHLEVBQUUsQ0FBQztRQUVoQixhQUFRLEdBS0YsRUFBRSxDQUFDO1FBRVQsa0JBQWEsR0FBa0IsSUFBSSxDQUFDO1FBQ3BDLFlBQU8sR0FBa0IsSUFBSSxDQUFDO1FBQzlCLG1CQUFjLEdBQTJCLElBQUksQ0FBQztRQUc1QyxNQUFNLGFBQWEsR0FBWSxjQUMxQjtZQUNELGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGVBQWUsRUFBRSxrQ0FBd0I7WUFDekMsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO1lBQy9CLEtBQUssRUFBRSxFQUFFO1NBQ1YsRUFDRSxPQUFPLENBQ0EsQ0FBQztRQUViLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQzFCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztTQUMzRDtRQUVELElBQ0UsT0FBTyxhQUFhLENBQUMsZUFBZSxLQUFLLFFBQVE7WUFDakQsYUFBYSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUN4QztZQUNBLE1BQU0sSUFBSSxLQUFLLENBQ2IsNkVBQTZFLENBQzlFLENBQUM7U0FDSDtRQUVELElBQUksQ0FBQyxlQUFlLEdBQUcsYUFBYSxDQUFDLGVBQWUsQ0FBQztRQUNyRCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsK0JBQXFCLENBQzNDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FDL0IsQ0FBQztRQUVGLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRTtZQUNyQyxLQUFLLEVBQUUsYUFBYSxD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