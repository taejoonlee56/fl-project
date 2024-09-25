let KEYCODE_Z = 90;
let KEYCODE_Y = 89;
export function isUndo(e) {
    return ((e.ctrlKey || e.metaKey) &&
        e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z));
}
export function isRedo(e) {
    return ((e.ctrlKey || e.metaKey) &&
        e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y));
}
export function getSelection(el) {
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
let selectionTimeout;
export function setSelection(el, selection) {
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
/**
 * Merge an object defining format characters into the defaults.
 * Passing null/undefined for en existing format character removes it.
 * Passing a definition for an existing format character overrides it.
 */
export function mergeFormatCharacters(formatCharacters) {
    var merged = { ...DEFAULT_FORMAT_CHARACTERS };
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
export const ESCAPE_CHAR = '\\';
export const DIGIT_RE = /^\d$/;
export const LETTER_RE = /^[A-Za-z]$/;
export const ALPHANNUMERIC_RE = /^[\dA-Za-z]$/;
export const DEFAULT_PLACEHOLDER_CHAR = '_';
export const DEFAULT_FORMAT_CHARACTERS = {
    '*': {
        validate: function (char) {
            return ALPHANNUMERIC_RE.test(char);
        }
    },
    '1': {
        validate: function (char) {
            return DIGIT_RE.test(char);
        }
    },
    a: {
        validate: function (char) {
            return LETTER_RE.test(char);
        }
    },
    A: {
        validate: function (char) {
            return LETTER_RE.test(char);
        },
        transform: function (char) {
            return char.toUpperCase();
        }
    },
    '#': {
        validate: function (char) {
            return ALPHANNUMERIC_RE.test(char);
        },
        transform: function (char) {
            return char.toUpperCase();
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDbkIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBRW5CLE1BQU0sVUFBVSxNQUFNLENBQUMsQ0FBZ0I7SUFDckMsT0FBTyxDQUNMLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUNuRCxDQUFDO0FBQ0osQ0FBQztBQUVELE1BQU0sVUFBVSxNQUFNLENBQUMsQ0FBZ0I7SUFDckMsT0FBTyxDQUNMLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUNuRCxDQUFDO0FBQ0osQ0FBQztBQUlELE1BQU0sVUFBVSxZQUFZLENBQUMsRUFBb0I7SUFDL0MsSUFBSSxLQUFLLEVBQUUsR0FBRyxDQUFDO0lBQ2YsSUFBSSxFQUFFLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxLQUFLLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQztRQUMxQixHQUFHLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQztLQUN2QjtTQUFNO1FBQ0wsSUFBSTtZQUNGLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNYLHVCQUF1QjtZQUN2QixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDbkMsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLFNB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