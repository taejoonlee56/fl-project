"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let KEYCODE_Z = 90;
let KEYCODE_Y = 89;
function isUndo(e) {
    return ((e.ctrlKey || e.metaKey) &&
        e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z));
}
exports.isUndo = isUndo;
function isRedo(e) {
    return ((e.ctrlKey || e.metaKey) &&
        e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y));
}
exports.isRedo = isRedo;
function getSelection(el) {
    let start, end;
    if (el.selectionStart !== undefined) {
        start = el.selectionStart;
        end = el.selectionEnd;
    }
    else {
        try {
            el.focus();
            // @ts-ignore (IE only)
            let rangeEl = el.createTextRange();
            let clone = rangeEl.duplicate();
            // @ts-ignore (IE only)
            rangeEl.moveToBookmark(document.selection.createRange().getBookmark());
            clone.setEndPoint('EndToStart', rangeEl);
            start = clone.text.length;
            end = start + rangeEl.text.length;
        }
        catch (e) {
            /* not focused or not visible */
        }
    }
    return { start, end };
}
exports.getSelection = getSelection;
let selectionTimeout;
function setSelection(el, selection) {
    clearTimeout(selectionTimeout);
    try {
        if (el.selectionStart === selection.start &&
            el.selectionEnd === selection.end) {
            return;
        }
        if (el.selectionStart !== undefined) {
            el.focus();
            el.setSelectionRange(selection.start, selection.end);
            // fix https://bugs.chromium.org/p/chromium/issues/detail?id=32865
            selectionTimeout = setTimeout(() => {
                setSelection(el, selection);
            }, 0);
        }
        else {
            el.focus();
            // @ts-ignore (IE only)
            let rangeEl = el.createTextRange();
            rangeEl.collapse(true);
            rangeEl.moveStart('character', selection.start);
            rangeEl.moveEnd('character', selection.end - selection.start);
            rangeEl.select();
        }
    }
    catch (e) {
        /* not focused or not visible */
    }
}
exports.setSelection = setSelection;
/**
 * Merge an object defining format characters into the defaults.
 * Passing null/undefined for en existing format character removes it.
 * Passing a definition for an existing format character overrides it.
 */
function mergeFormatCharacters(formatCharacters) {
    var merged = Object.assign({}, exports.DEFAULT_FORMAT_CHARACTERS);
    if (formatCharacters) {
        var chars = Object.keys(formatCharacters);
        for (var i = 0, l = chars.length; i < l; i++) {
            var char = chars[i];
            if (formatCharacters[char] == null) {
                delete merged[char];
            }
            else {
                merged[char] = formatCharacters[char];
            }
        }
    }
    return merged;
}
exports.mergeFormatCharacters = mergeFormatCharacters;
exports.ESCAPE_CHAR = '\\';
exports.DIGIT_RE = /^\d$/;
exports.LETTER_RE = /^[A-Za-z]$/;
exports.ALPHANNUMERIC_RE = /^[\dA-Za-z]$/;
exports.DEFAULT_PLACEHOLDER_CHAR = '_';
exports.DEFAULT_FORMAT_CHARACTERS = {
    '*': {
        validate: function (char) {
            return exports.ALPHANNUMERIC_RE.test(char);
        }
    },
    '1': {
        validate: function (char) {
            return exports.DIGIT_RE.test(char);
        }
    },
    a: {
        validate: function (char) {
            return exports.LETTER_RE.test(char);
        }
    },
    A: {
        validate: function (char) {
            return exports.LETTER_RE.test(char);
        },
        transform: function (char) {
            return char.toUpperCase();
        }
    },
    '#': {
        validate: function (char) {
            return exports.ALPHANNUMERIC_RE.test(char);
        },
        transform: function (char) {
            return char.toUpperCase();
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztBQUNuQixJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFFbkIsU0FBZ0IsTUFBTSxDQUFDLENBQWdCO0lBQ3JDLE9BQU8sQ0FDTCxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUN4QixDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FDbkQsQ0FBQztBQUNKLENBQUM7QUFMRCx3QkFLQztBQUVELFNBQWdCLE1BQU0sQ0FBQyxDQUFnQjtJQUNyQyxPQUFPLENBQ0wsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDeEIsQ0FBQyxDQUFDLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQ25ELENBQUM7QUFDSixDQUFDO0FBTEQsd0JBS0M7QUFJRCxTQUFnQixZQUFZLENBQUMsRUFBb0I7SUFDL0MsSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDO0lBQ2YsSUFBSSxFQUFFLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxLQUFLLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQztRQUMxQixHQUFHLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQztLQUN2QjtTQUFNO1FBQ0wsSUFBSTtZQUNGLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLHVCQUF1QjtZQUN2QixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDbkMsSUFBSSxLQUFLLEdBQUcs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