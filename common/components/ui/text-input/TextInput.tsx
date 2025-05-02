/* eslint-disable react/no-unused-class-component-methods */
import React from "react";
import {
  Animated,
  TextStyle,
  StyleProp,
  ViewProps,
  ViewStyle,
  ColorValue,
  I18nManager,
  NativeTouchEvent,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TextInputChangeEventData,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { Box, Text, Theme, ThemeConsumer } from "../../theme";

type TextColor = React.ComponentProps<typeof Text>["color"];
type TextVariant = React.ComponentProps<typeof Text>["variant"];
const AnimatedText = Animated.createAnimatedComponent(Text);

type ActionLabelRender = (props: { label: string; activeColor?: ColorValue; color: ColorValue }) => React.ReactNode;
type AffixRenderer = React.ReactNode | ((props: { color: ColorValue }) => React.ReactNode);

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  labelColor?: TextColor;
  labelVariant?: TextVariant;
  labelSize?: number;
  titleSize?: number;

  errorIconVisibility?: boolean | undefined;
  height?: number;

  error?: string;
  helper?: string;

  borderWidth?: number;
  activeBorderWidth?: number;

  editable?: boolean | undefined;

  prefix?: AffixRenderer;
  suffix?: AffixRenderer;

  baseStyle?: StyleProp<TextStyle> | undefined;
  baseContainerStyle?: StyleProp<ViewStyle> | undefined;
  containerStyle?: StyleProp<ViewStyle> | undefined;

  actionLabel?: string | ActionLabelRender;

  useNativeDriver?: boolean;
  animationDuration?: number;

  characterRestriction?: number;

  onPress?: (event: NativeSyntheticEvent<NativeTouchEvent>) => void;
}

export interface TextInputState {
  text?: string;
  error?: string;
  focused: boolean;
  focus: Animated.Value;
}

function focusState(focused: boolean, error?: string): number {
  if (error) {
    return -1;
  }
  return focused ? 1 : 0;
}

class TextInput extends React.PureComponent<TextInputProps, TextInputState> {
  private mounted: boolean;

  private readonly input: React.RefObject<RNTextInput>;

  static defaultProps = {
    label: undefined,
    titleSize: 14,
    labelSize: 12,
    labelColor: "black",
    labelVariant: "labels",
    borderWidth: 1,
    activeBorderWidth: 2,
    animationDuration: 225,
    useNativeDriver: false,
    characterRestriction: 0,

    errorIconVisibility: false,
    height: 48,

    editable: true,

    onPress: undefined,
    error: undefined,
    helper: undefined,
    prefix: undefined,
    suffix: undefined,
    baseStyle: undefined,
    actionLabel: undefined,
    containerStyle: undefined,
    baseContainerStyle: undefined,
  };

  constructor(props: TextInputProps) {
    super(props);

    this.blur = this.blur.bind(this);
    this.focus = this.focus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onPress = this.onPress.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onChangeText = this.onChangeText.bind(this);
    this.onFocusAnimationEnd = this.onFocusAnimationEnd.bind(this);

    this.mounted = false;
    this.input = React.createRef();
    this.state = {
      focused: false,
      error: props.error,
      text: props.value ?? props.defaultValue,
      focus: new Animated.Value(focusState(false, props.error)),
    };
  }

  static getDerivedStateFromProps(nextProps: TextInputProps, prevState: TextInputState) {
    const { error } = prevState;
    const nextState: TextInputState = { ...prevState };

    if (nextProps.value != null) {
      nextState.text = nextProps.value;
    }

    if (nextProps.error && nextProps.error !== error) {
      nextState.error = nextProps.error;
    }

    return nextState;
  }

  componentDidMount() {
    this.mounted = true;
  }

  getSnapshotBeforeUpdate(prevProps: Readonly<TextInputProps>, prevState: Readonly<TextInputState>): never | null {
    const { error, animationDuration: duration, useNativeDriver = false } = prevProps;
    const { focus, focused } = prevState;

    const nextProps = this.props;
    const nextState = this.state;
    if (nextProps.error !== error || focused !== nextState.focused) {
      const toValue = focusState(nextState.focused, nextProps.error);
      focus.setValue(toValue);

      Animated.timing(focus, {
        toValue,
        duration,
        useNativeDriver,
      }).start(this.onFocusAnimationEnd);
    }
    return null;
  }

  componentDidUpdate(): void {
    // do nothing
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  private onPress(event: NativeSyntheticEvent<NativeTouchEvent>) {
    const { onPress: onPressDelicate } = this.props;

    if (typeof onPressDelicate === "function") {
      onPressDelicate(event);
    }
  }

  private onFocus(event: NativeSyntheticEvent<TextInputFocusEventData>) {
    const { onFocus, clearTextOnFocus } = this.props;

    if (typeof onFocus === "function") {
      onFocus(event);
    }

    if (clearTextOnFocus) {
      this.clear();
    }

    this.setState({ focused: true });
  }

  private onBlur(event: NativeSyntheticEvent<TextInputFocusEventData>) {
    const { onBlur } = this.props;

    if (typeof onBlur === "function") {
      onBlur(event);
    }

    this.setState({ focused: false });
  }

  private onChange(event: NativeSyntheticEvent<TextInputChangeEventData>) {
    const { onChange } = this.props;

    if (typeof onChange === "function") {
      onChange(event);
    }
  }

  private onChangeText(text: string) {
    const { onChangeText } = this.props;

    this.setState({ text });

    if (typeof onChangeText === "function") {
      onChangeText(text);
    }
  }

  private onFocusAnimationEnd() {
    if (this.mounted) {
      this.setState((_, { error }) => ({ error }));
    }
  }

  setNativeProps(nativeProps: object): void {
    this.input.current?.setNativeProps?.(nativeProps);
  }

  focus() {
    const { editable } = this.props;

    if (editable) {
      this.input.current?.focus?.();
    }
  }

  blur() {
    this.input.current?.blur?.();
  }

  clear() {
    this.input.current?.clear?.();

    /* onChangeText is not triggered by .clear() */
    this.onChangeText("");
  }

  value() {
    const { text } = this.state;
    return text;
  }

  isErrored(): boolean {
    const { error } = this.state;
    return !!error;
  }

  isFocused(): boolean {
    return this.input?.current?.isFocused() ?? false;
  }

  isActive(): boolean {
    const { placeholder } = this.props;
    return !!(this.value() || placeholder);
  }

  isRestricted() {
    const { characterRestriction = 0 } = this.props;
    const { text = "" } = this.state;

    return characterRestriction > 0 && characterRestriction < text.length;
  }

  private currentColor(theme: Theme): ColorValue {
    if (this.isErrored()) {
      return theme.colors.textCritical;
    }

    if (this.isFocused()) {
      return theme.colors.textDisabled;
    }

    return theme.colors.textSubdued;
  }

  private renderLabel(_: Theme) {
    const { label, labelVariant = "labels", labelColor = "black" } = this.props;
    if (!label) {
      return undefined;
    }
    return (
      <AnimatedText variant={labelVariant} color={labelColor}>
        {label}
      </AnimatedText>
    );
  }

  private renderActionLabel(_: Theme) {
    const { actionLabel } = this.props;
    if (!actionLabel) {
      return undefined;
    }

    if (typeof actionLabel === "function") {
      return actionLabel({} as never);
    }

    return <Text variant="caption">{actionLabel}</Text>;
  }

  private renderPrefix(theme: Theme) {
    const { prefix } = this.props;

    if (typeof prefix === "function") {
      return prefix({ color: this.currentColor(theme) });
    }

    return prefix;
  }

  private renderSuffix(theme: Theme) {
    const { suffix } = this.props;

    if (typeof suffix === "function") {
      return suffix({ color: this.currentColor(theme) });
    }

    return suffix;
  }

  private renderHelperLabel(theme: Theme) {
    const { focus } = this.state;
    const { error, helper, labelSize } = this.props;

    if (error) {
      return undefined;
    }

    const helperLabelStyle = {
      color: theme.colors.textSubdued,
      fontSize: labelSize,
      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 1, 1],
      }),
    };

    return (
      <AnimatedText variant="labels" style={helperLabelStyle}>
        {helper}
      </AnimatedText>
    );
  }

  private renderError(theme: Theme) {
    const { focus } = this.state;
    const { error, labelSize = 12, errorIconVisibility } = this.props;

    if (!error) {
      return undefined;
    }

    const errorStyle = {
      color: theme.colors.critical,
      opacity: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [1, 0, 0],
      }),
      fontSize: focus.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [labelSize, 0, 0],
      }),
    };

    return (
      <Box flexDirection="row" alignItems="center">
        {errorIconVisibility && (
          <Box marginEnd="xxs">
            <MaterialIcons name="info" size={14} color={theme.colors.iconsCritical} />
          </Box>
        )}

        <AnimatedText variant="labels" style={errorStyle}>
          {error}
        </AnimatedText>
      </Box>
    );
  }

  private renderCounter(count: number) {
    const { labelSize: fontSize, characterRestriction } = this.props;

    if (!characterRestriction) {
      return undefined;
    }

    return (
      <AnimatedText variant="labels" style={[{ fontSize }]}>
        {`${count} /${characterRestriction}`}
      </AnimatedText>
    );
  }

  private renderContent(theme: Theme) {
    const { text, focus } = this.state;
    const {
      value,

      label,
      labelSize,
      labelColor,
      labelVariant,

      height,

      onBlur,
      onFocus,
      error,
      style,
      prefix,
      suffix,
      onChange,

      borderWidth = 1,
      activeBorderWidth = 2,

      actionLabel,
      onChangeText,
      useNativeDriver,
      animationDuration,

      characterRestriction: limit = 0,

      baseStyle,
      containerStyle,
      baseContainerStyle: baseContainerStyleOverrides,
      ...props
    } = this.props;

    const count: number = text ? text.length : 0;
    const restricted: boolean = limit === 0 ? false : limit < count;

    const textAlign = I18nManager.isRTL ? "right" : "left";

    const inputContainerStyleDelicate: ViewStyle = {
      borderRadius: 8,
      overflow: "hidden",
      flexDirection: "row",
    };
    const inputContainerStyle = {
      borderColor: restricted
        ? theme.colors.textDisabled
        : focus.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [theme.colors.borderCriticalDefault, theme.colors.borderSubdued, theme.colors.primary],
          }),
      borderWidth: restricted
        ? activeBorderWidth
        : focus.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [activeBorderWidth, borderWidth, activeBorderWidth],
          }),
      backgroundColor: props.editable
        ? focus.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [
              theme.colors.surfaceCriticalSubdued,
              theme.colors.surfaceCriticalSubdued,
              theme.colors.surfaceCriticalSubdued,
            ],
          })
        : theme.colors.surfaceDisabled,
    };
    const inputStyle: RNTextInputProps["style"] = {
      textAlign,
      minHeight: height ?? 48,
      color: props.editable ? theme.colors.textDefault : theme.colors.grey,
    };

    const pressableContainerProps: ViewProps = this.onPress
      ? {
          onResponderRelease: this.onPress,
          onStartShouldSetResponder: () => true,
          pointerEvents: props.editable ? "auto" : "box-only",
        }
      : {};

    return (
      <Box style={containerStyle}>
        <Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
          {this.renderLabel(theme as Theme)}
          {this.renderActionLabel(theme as Theme)}
        </Box>
        <Animated.View
          style={[inputContainerStyleDelicate, inputContainerStyle, baseContainerStyleOverrides]}
          {...pressableContainerProps}
        >
          <Box flex={0} paddingStart="xs" paddingEnd="xxs" justifyContent="center">
            {this.renderPrefix(theme)}
          </Box>
          <Box flex={1} paddingHorizontal="xxs" pointerEvents={props.onPress ? "box-only" : "auto"}>
            <RNTextInput
              value={text}
              ref={this.input}
              onBlur={this.onBlur}
              onFocus={this.onFocus}
              onChange={this.onChange}
              placeholderTextColor={theme.colors.grey}
              onChangeText={this.onChangeText}
              style={[inputStyle, baseStyle]}
              {...props}
            />
          </Box>
          <Box flex={0} paddingEnd="xs" paddingStart="xxs" justifyContent="center">
            {this.renderSuffix(theme)}
          </Box>
        </Animated.View>
        <Box flexDirection="row" justifyContent="space-between">
          <Box flex={1}>
            {this.renderHelperLabel(theme)}
            {this.renderError(theme)}
          </Box>
          <Box>{this.renderCounter(count)}</Box>
        </Box>
      </Box>
    );
  }

  render() {
    return <ThemeConsumer>{(theme) => this.renderContent(theme as Theme)}</ThemeConsumer>;
  }
}

export { TextInput };
