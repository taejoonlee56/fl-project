import React, { Component } from 'react';
import { Input } from 'antd';
import InputMask from './inputmask-core';
import { isRedo, isUndo, getSelection, setSelection } from './helpers';
export default class MaskedInput extends Component {
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
            if (isUndo(e)) {
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
            else if (isRedo(e)) {
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
            let { placeholderChar, formatCharacters, ...cleanedProps } = this.props;
            const props = { ...cleanedProps, ...eventHandlers, maxLength, placeholder };
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
        this.state.mask = new InputMask(options);
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
                    selection: state.input && getSelection(state.input)
                });
            }
            else {
                state.mask.setPattern(nextMask, {
                    value: state.mask.getRawValue(),
                    selection: state.input && getSelection(state.input)
                });
            }
        }
        else if (currMask !== nextMask) {
            state.mask.setPattern(nextMask, {
                value: state.mask.getRawValue(),
                selection: state.input && getSelection(state.input)
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
        this.state.mask.selection = getSelection(this.state.input);
    }
    _updateInputSelection() {
        setSelection(this.state.input, this.state.mask.selection);
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
        return React.createElement(Input, Object.assign({}, this.getInputProps(), { ref: this.handleInputRef }));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFza2VkSW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL01hc2tlZElucHV0LnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEtBQUssRUFBRSxFQUFlLFNBQVMsRUFBa0IsTUFBTSxPQUFPLENBQUM7QUFDdEUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUM3QixPQUFPLFNBQVMsTUFBTSxrQkFBa0IsQ0FBQztBQUN6QyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBdUJ2RSxNQUFNLENBQUMsT0FBTyxPQUFPLFdBQVksU0FBUSxTQUEyQjtJQVdsRSxZQUFZLEtBQXVCO1FBQ2pDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQVZmLFVBQUssR0FBcUI7WUFDeEIsS0FBSyxFQUFFLElBQUk7WUFDWCxVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsSUFBSTtZQUNaLElBQUksRUFBRSxJQUFJO1lBQ1YsUUFBUSxFQUFFLElBQUk7WUFDZCxTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDO1FBc0dGLGNBQVMsR0FBRyxDQUFDLENBQWUsRUFBRSxFQUFFO1lBQzlCLDBGQUEwRjtZQUUxRixJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUMzQyxJQUFJLGFBQWEsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztZQUNuQyxJQUFJLGFBQWEsS0FBSyxTQUFTLEVBQUU7Z0JBQy9CLHFEQUFxRDtnQkFDckQsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7Z0JBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLDhDQUE4QztnQkFDdkYsSUFBSSxDQUFDLGFBQWEs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