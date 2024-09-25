"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const antd_1 = require("antd");
const inputmask_core_1 = __importDefault(require("./inputmask-core"));
const helpers_1 = require("./helpers");
class MaskedInput extends react_1.Component {
    constructor(props) {
        super(props);
        this.state = {
            input: null,
            _lastValue: null,
            _Input: null,
            mask: null,
            prevMask: null,
            prevValue: null,
        };
        this._onChange = (e) => {
            // console.log('onChange', JSON.stringify(getSelection(this.state.input)), e.target.value)
            let maskValue = this.state.mask.getValue();
            let incomingValue = e.target.value;
            if (incomingValue !== maskValue) {
                // only modify mask if form contents actually changed
                this._updateMaskSelection();
                this.state.mask.setValue(incomingValue); // write the whole updated value into the mask
                this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
                this._updateInputSelection();
            }
            if (this.props.onChange) {
                this.props.onChange(e);
            }
        };
        this._onKeyDown = (e) => {
            setTimeout(() => {
                this.state.input.classList[this.state.input.value ? 'add' : 'remove']('has-value');
            }, 100);
            if (helpers_1.isUndo(e)) {
                e.preventDefault();
                if (this.state.mask.undo()) {
                    this.setInputValue(this._getDisplayValue());
                    this._updateInputSelection();
                    if (this.props.onChange) {
                        this.props.onChange(e);
                    }
                }
                return;
            }
            else if (helpers_1.isRedo(e)) {
                e.preventDefault();
                if (this.state.mask.redo()) {
                    this.setInputValue(this._getDisplayValue());
                    this._updateInputSelection();
                    if (this.props.onChange) {
                        this.props.onChange(e);
                    }
                }
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                this._updateMaskSelection();
                if (this.state.mask.backspace()) {
                    let value = this._getDisplayValue();
                    this.setInputValue(value);
                    if (value) {
                        this._updateInputSelection();
                    }
                    if (this.props.onChange) {
                        this.props.onChange(e);
                    }
                }
            }
        };
        this._onKeyPress = (e) => {
            // console.log('onKeyPress', JSON.stringify(getSelection(this.state.input)), e.key, e.target.value)
            // Ignore modified key presses
            // Ignore enter key to allow form submission
            if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
                return;
            }
            e.preventDefault();
            this._updateMaskSelection();
            if (this.state.mask.input(e.key || e.data)) {
                this.setInputValue(this.state.mask.getValue());
                this._updateInputSelection();
                if (this.props.onChange) {
                    this.props.onChange(e);
                }
            }
        };
        this._onPaste = (e) => {
            e.preventDefault();
            this._updateMaskSelection();
            // getData value needed for IE also works in FF & Chrome
            if (this.state.mask.paste(e.clipboardData.getData('Text'))) {
                // @ts-ignore
                this.setInputValue(this.state.mask.getValue());
                // Timeout needed for IE
                setTimeout(() => this._updateInputSelection(), 0);
                if (this.props.onChange) {
                    // @ts-ignore
                    this.props.onChange(e);
                }
            }
        };
        this.getInputProps = () => {
            let maxLength = this.state.mask.pattern.length;
            let eventHandlers = this._getEventHandlers();
            let { placeholder = this.state.mask.emptyValue } = this.props;
            let _a = this.props, { placeholderChar, formatCharacters } = _a, cleanedProps = __rest(_a, ["placeholderChar", "formatCharacters"]);
            const props = Object.assign({}, cleanedProps, eventHandlers, { maxLength, placeholder });
            delete props.value;
            return props;
        };
        this.setInputValue = (value) => {
            if (!this.state._Input || !this.state._Input.input)
                return;
            if (value === this.state._lastValue)
                return;
            this.state._lastValue = value;
            this.state._Input.setState({ value });
            this.state._Input.input.value = value;
        };
        this.handleInputRef = (ref) => {
            if (!ref)
                return;
            this.state._Input = ref;
            this.state.input = ref.input;
            if (this.state._lastValue === null &&
                typeof this.props.defaultValue === 'string') {
                this.state.mask.setValue(this.props.defaultValue); // write the whole updated value into the mask
                this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
            }
        };
        let options = {
            pattern: this.props.mask,
            value: this.props.value,
            formatCharacters: this.props.formatCharacters
        };
        if (this.props.placeholderChar) {
            options.placeholderChar = this.props.placeholderChar;
        }
        this.state.mask = new inputmask_core_1.default(options);
    }
    componentDidMount() {
        this.setInputValue(this._getDisplayValue());
    }
    static getDerivedStateFromProps(props, state) {
        const currMask = state.prevMask;
        const currValue = state.prevValue;
        const nextMask = props.mask;
        const nextValue = props.value;
        if (nextMask !== currMask &&
            nextValue !== currValue) {
            // if we get a new value and a new mask at the same time
            // check if the mask.value is still the initial value
            // - if so use the next's value
            // - otherwise the `this.mask` has a value for us (most likely from paste action)
            if (state.mask.getValue() === state.mask.emptyValue) {
                state.mask.setPattern(nextMask, {
                    value: nextValue,
                    selection: state.input && helpers_1.getSelection(state.input)
                });
            }
            else {
                state.mask.setPattern(nextMask, {
                    value: state.mask.getRawValue(),
                    selection: state.input && helpers_1.getSelection(state.input)
                });
            }
        }
        else if (currMask !== nextMask) {
            state.mask.setPattern(nextMask, {
                value: state.mask.getRawValue(),
                selection: state.input && helpers_1.getSelection(state.input)
            });
        }
        if (currValue !== nextValue) {
            state.mask.setValue(nextValue);
            let value = state.mask.getValue();
            value = value === state.mask.emptyValue ? '' : value;
            if (state._Input && state._Input.input && value !== state._lastValue) {
                state._lastValue = value;
                state._Input.setState({ value });
                state._Input.input.value = value;
            }
        }
        if (nextMask !== currMask || nextValue !== currValue) {
            const newState = {};
            if (nextMask !== currMask) {
                newState.prevMask = nextMask;
            }
            if (nextValue !== currValue) {
                newState.prevValue = nextValue;
            }
            return newState;
        }
        return null;
    }
    componentDidUpdate(prevProps) {
        if (!this.props.mask)
            return null;
        if (prevProps.mask !== this.props.mask && this.state.mask.selection.start) {
            this._updateInputSelection();
        }
        return;
    }
    _updateMaskSelection() {
        this.state.mask.selection = helpers_1.getSelection(this.state.input);
    }
    _updateInputSelection() {
        helpers_1.setSelection(this.state.input, this.state.mask.selection);
    }
    _getDisplayValue() {
        let value = this.state.mask.getValue();
        return value === this.state.mask.emptyValue ? '' : value;
    }
    _keyPressPropName() {
        if (typeof navigator !== 'undefined') {
            return navigator.userAgent.match(/Android/i)
                ? 'onBeforeInput'
                : 'onKeyPress';
        }
        return 'onKeyPress';
    }
    _getEventHandlers() {
        return {
            onChange: this._onChange,
            onKeyDown: this._onKeyDown,
            onPaste: this._onPaste,
            [this._keyPressPropName()]: this._onKeyPress
        };
    }
    focus() {
        this.state.input.focus();
    }
    blur() {
        this.state.input.blur();
    }
    render() {
        return react_1.default.createElement(antd_1.Input, Object.assign({}, this.getInputProps(), { ref: this.handleInputRef }));
    }
}
exports.default = MaskedInput;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFza2VkSW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL01hc2tlZElucHV0LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtDQUFzRTtBQUN0RSwrQkFBNkI7QUFDN0Isc0VBQXlDO0FBQ3pDLHVDQUF1RTtBQXVCdkUsTUFBcUIsV0FBWSxTQUFRLGlCQUEyQjtJQVdsRSxZQUFZLEtBQXVCO1FBQ2pDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQVZmLFVBQUssR0FBcUI7WUFDeEIsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLElBQUk7WUFDZCxTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDO1FBc0dGLGNBQVMsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO1lBQzlCLDBGQUEwRjtZQUUxRixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNuQyxJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7Z0JBQy9CLHFEQUFxRDtnQkFDckQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLDhDQUE4QztnQkFDdkYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsb0RBQW9EO2dCQUNqRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQzthQUM5QjtZQUVELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUU7Z0JBQ3ZC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