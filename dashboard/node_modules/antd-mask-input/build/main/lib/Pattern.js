"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
class Pattern {
    constructor(source, formatCharacters, placeholderChar, isRevealingMask = false) {
        /** Pattern characters after escape characters have been processed. */
        this.pattern = [];
        /** Length of the pattern after escape characters have been processed. */
        this.length = 0;
        /** Index of the first editable character. */
        this.firstEditableIndex = null;
        /** Index of the last editable character. */
        this.lastEditableIndex = null;
        /** Lookup for indices of editable characters in the pattern. */
        this._editableIndices = {};
        /** Placeholder character */
        this.placeholderChar = placeholderChar || helpers_1.DEFAULT_PLACEHOLDER_CHAR;
        /** Format character definitions. */
        this.formatCharacters = formatCharacters || helpers_1.DEFAULT_FORMAT_CHARACTERS;
        /** Pattern definition string with escape characters. */
        this.source = source;
        this.isRevealingMask = isRevealingMask;
        this._parse();
    }
    _parse() {
        var sourceChars = this.source.split('');
        var patternIndex = 0;
        var pattern = [];
        for (var i = 0, l = sourceChars.length; i < l; i++) {
            var char = sourceChars[i];
            if (char === helpers_1.ESCAPE_CHAR) {
                if (i === l - 1) {
                    throw new Error('InputMask: pattern ends with a raw ' + helpers_1.ESCAPE_CHAR);
                }
                char = sourceChars[++i];
            }
            else if (char in this.formatCharacters) {
                if (this.firstEditableIndex === null) {
                    this.firstEditableIndex = patternIndex;
                }
                this.lastEditableIndex = patternIndex;
                this._editableIndices[patternIndex] = true;
            }
            pattern.push(char);
            patternIndex++;
        }
        if (this.firstEditableIndex === null) {
            throw new Error('InputMask: pattern "' + this.source + '" does not contain any editable characters.');
        }
        // @ts-ignore
        this.pattern = pattern;
        this.length = pattern.length;
    }
    formatValue(value) {
        var valueBuffer = new Array(this.length);
        var valueIndex = 0;
        for (var i = 0, l = this.length; i < l; i++) {
            if (this.isEditableIndex(i)) {
                if (this.isRevealingMask &&
                    value.length <= valueIndex &&
                    !this.isValidAtIndex(value[valueIndex], i)) {
                    break;
                }
                valueBuffer[i] =
                    value.length > valueIndex && this.isValidAtIndex(value[valueIndex], i)
                        ? this.transform(value[valueIndex], i)
                        : this.placeholderChar;
                valueIndex++;
            }
            else {
                valueBuffer[i] = this.pattern[i];
                // Also allow the value to contain static values from the pattern by
                // advancing its index.
                if (value.length > valueIndex && value[valueIndex] === this.pattern[i]) {
                    valueIndex++;
                }
            }
        }
        return valueBuffer;
    }
    isEditableIndex(index) {
        return !!this._editableIndices[index];
    }
    isValidAtIndex(char, index) {
        return this.formatCharacters[this.pattern[index]].validate(char);
    }
    transform(char, index) {
        var format = this.formatCharacters[this.pattern[index]];
        return typeof format.transform == 'function' ? format.transform(char) : char;
    }
}
exports.Pattern = Pattern;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGF0dGVybi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvUGF0dGVybi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHVDQUttQjtBQUVuQixNQUFhLE9BQU87SUF1QmxCLFlBQ0UsTUFBYyxFQUNkLGdCQUFrQyxFQUNsQyxlQUF1QixFQUN2QixlQUFlLEdBQUcsS0FBSztRQXRCekIsc0VBQXNFO1FBQ3RFLFlBQU8sR0FBRyxFQUFFLENBQUM7UUFFYix5RUFBeUU7UUFDekUsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUVYLDZDQUE2QztRQUM3Qyx1QkFBa0IsR0FBa0IsSUFBSSxDQUFDO1FBRXpDLDRDQUE0QztRQUM1QyxzQkFBaUIsR0FBa0IsSUFBSSxDQUFDO1FBRXhDLGdFQUFnRTtRQUNoRSxxQkFBZ0IsR0FBK0IsRUFBRSxDQUFDO1FBV2hELDRCQUE0QjtRQUM1QixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsSUFBSSxrQ0FBd0IsQ0FBQztRQUNuRSxvQ0FBb0M7UUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixJQUFJLG1DQUF5QixDQUFDO1FBQ3RFLHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUV2QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4QyxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBRTNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7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