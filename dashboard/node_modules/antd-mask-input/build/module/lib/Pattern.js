import { DEFAULT_FORMAT_CHARACTERS, DEFAULT_PLACEHOLDER_CHAR, ESCAPE_CHAR, } from './helpers';
export class Pattern {
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
        this.placeholderChar = placeholderChar || DEFAULT_PLACEHOLDER_CHAR;
        /** Format character definitions. */
        this.formatCharacters = formatCharacters || DEFAULT_FORMAT_CHARACTERS;
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
            if (char === ESCAPE_CHAR) {
                if (i === l - 1) {
                    throw new Error('InputMask: pattern ends with a raw ' + ESCAPE_CHAR);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGF0dGVybi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvUGF0dGVybi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wseUJBQXlCLEVBQ3pCLHdCQUF3QixFQUN4QixXQUFXLEdBRVosTUFBTSxXQUFXLENBQUM7QUFFbkIsTUFBTSxPQUFPLE9BQU87SUF1QmxCLFlBQ0UsTUFBYyxFQUNkLGdCQUFrQyxFQUNsQyxlQUF1QixFQUN2QixlQUFlLEdBQUcsS0FBSztRQXRCekIsc0VBQXNFO1FBQ3RFLFlBQU8sR0FBRyxFQUFFLENBQUM7UUFFYix5RUFBeUU7UUFDekUsV0FBTSxHQUFHLENBQUMsQ0FBQztRQUVYLDZDQUE2QztRQUM3Qyx1QkFBa0IsR0FBa0IsSUFBSSxDQUFDO1FBRXpDLDRDQUE0QztRQUM1QyxzQkFBaUIsR0FBa0IsSUFBSSxDQUFDO1FBRXhDLGdFQUFnRTtRQUNoRSxxQkFBZ0IsR0FBK0IsRUFBRSxDQUFDO1FBV2hELDRCQUE0QjtRQUM1QixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsSUFBSSx3QkFBd0IsQ0FBQztRQUNuRSxvQ0FBb0M7UUFDcEMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixJQUFJLHlCQUF5QixDQUFDO1FBQ3RFLHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQixJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUV2QyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELE1BQU07UUFDSixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN4QyxJQUFJLFlBQVksR0FBRyxDQUFDLENBQUM7UUFDckIsSUFBSSxPQUFPLEdBQWEsRUFBRSxDQUFDO1FBRTNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FB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