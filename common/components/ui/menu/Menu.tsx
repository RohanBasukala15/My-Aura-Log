import React from "react";
import {
  View,
  Modal,
  Easing,
  Animated,
  ViewStyle,
  StatusBar,
  Dimensions,
  StyleSheet,
  I18nManager,
  LayoutChangeEvent,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";

import { measureInWindow } from "../../../utils";

const styles = StyleSheet.create({
  shadowMenuContainer: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 4,
    opacity: 0,

    // Shadow
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 2,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuContainer: {
    overflow: "hidden",
  },
});

export interface MenuProps {
  disabled?: boolean;
  testID?: string;
  visible?: boolean;
  style?: ViewStyle;
  onRequestClose?(): void;
  anchor: React.ReactNode;
  animationDuration?: number;
  children: React.ReactNode;
  anchorOffset?: { top: number };
}

enum States {
  Hidden,
  Animating,
  Shown,
}

interface State {
  buttonHeight: number;
  buttonWidth: number;
  left: number;
  menuHeight: number;
  menuSizeAnimation: Animated.ValueXY;
  menuState: States;
  menuWidth: number;
  opacityAnimation: Animated.Value;
  top: number;
  anchorHeight: number;
  anchorWidth: number;
}

const EASING = Easing.bezier(0.4, 0, 0.2, 1);
const SCREEN_INDENT = 8;

export class Menu extends React.Component<MenuProps, State> {
  private container: View | null = null;

  private anchorContainerRef: View | null = null;

  static defaultProps = {
    visible: false,
    disabled: false,
    style: undefined,
    testID: undefined,
    anchorOffset: { top: 0 },
    animationDuration: 300,
    onRequestClose: undefined,
  };

  constructor(props: MenuProps) {
    super(props);

    this.state = {
      menuState: States.Hidden,

      top: 0,
      left: 0,

      menuWidth: 0,
      menuHeight: 0,

      buttonWidth: 0,
      buttonHeight: 0,
      anchorHeight: 0,
      anchorWidth: 0,

      menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
      opacityAnimation: new Animated.Value(0),
    };
  }

  componentDidMount() {
    const { visible } = this.props;
    if (!visible) {
      return;
    }

    this.show();
  }

  componentDidUpdate(prevProps: MenuProps) {
    const { visible } = this.props;
    if (prevProps.visible === visible) {
      return;
    }

    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  private setContainerRef = (ref: View) => {
    this.container = ref;
  };

  private setAnchorContainerRef = (ref: View) => {
    this.anchorContainerRef = ref;
  };

  // Start menu animation
  private onMenuLayout = (e: LayoutChangeEvent) => {
    const { menuState } = this.state;
    if (menuState === States.Animating) {
      return;
    }

    const { animationDuration } = this.props;
    const { menuSizeAnimation, opacityAnimation, anchorWidth } = this.state;
    const { width, height } = e.nativeEvent.layout;

    this.setState(
      {
        menuState: States.Animating,
        menuWidth: Math.max(width, anchorWidth),
        menuHeight: height,
      },
      () => {
        Animated.parallel([
          Animated.timing(menuSizeAnimation, {
            toValue: { x: Math.max(width, anchorWidth), y: height },
            duration: animationDuration,
            easing: EASING,
            useNativeDriver: false,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: animationDuration,
            easing: EASING,
            useNativeDriver: false,
          }),
        ]).start();
      }
    );
  };

  private show = () => {
    this.measureViews().then((config) => {
      if (config) {
        this.setState({
          ...config,
          menuState: States.Shown,
        });
      }
    });
  };

  private hide = () => {
    const { opacityAnimation } = this.state;
    const { animationDuration } = this.props;
    Animated.timing(opacityAnimation, {
      toValue: 0,
      duration: animationDuration,
      easing: EASING,
      useNativeDriver: false,
    }).start(() => {
      // Reset state
      this.setState({
        menuState: States.Hidden,
        menuSizeAnimation: new Animated.ValueXY({ x: 0, y: 0 }),
        opacityAnimation: new Animated.Value(0),
      });
    });
  };

  private onRequestClose = () => {
    const { onRequestClose } = this.props;
    onRequestClose?.();
  };

  private async measureViews() {
    if (!this.container) {
      return undefined;
    }
    const { x: left, y: top, width: buttonWidth, height: buttonHeight } = await measureInWindow(this.container);
    const { height: anchorHeight = 0, width: anchorWidth = 0 } = this.anchorContainerRef
      ? await measureInWindow(this.anchorContainerRef)
      : {};

    return {
      left,
      top,
      buttonWidth,
      buttonHeight,
      anchorHeight,
      anchorWidth,
    };
  }

  render() {
    const { isRTL } = I18nManager;

    const dimensions = Dimensions.get("window");
    const { width: windowWidth } = dimensions;
    const windowHeight = dimensions.height - (StatusBar.currentHeight || 0);

    const { menuSizeAnimation, menuWidth, menuHeight, buttonWidth, buttonHeight, anchorHeight, opacityAnimation } =
      this.state;
    const { anchorOffset, disabled } = this.props;
    const menuSize = {
      width: menuSizeAnimation.x,
      height: menuSizeAnimation.y,
    };

    // Adjust position of menu
    let { left, top } = this.state;
    const transforms = [];

    if (
      (isRTL && left + buttonWidth - menuWidth > SCREEN_INDENT) ||
      (!isRTL && left + menuWidth > windowWidth - SCREEN_INDENT)
    ) {
      transforms.push({
        translateX: Animated.multiply(menuSizeAnimation.x, -1),
      });

      left = Math.min(windowWidth - SCREEN_INDENT, left + buttonWidth);
    } else if (left < SCREEN_INDENT) {
      left = SCREEN_INDENT;
    }

    // Flip by Y axis if menu hits bottom screen border
    if (top > windowHeight - menuHeight - SCREEN_INDENT) {
      transforms.push({
        translateY: Animated.multiply(menuSizeAnimation.y, -1),
      });

      top = windowHeight - SCREEN_INDENT;
      top = Math.min(windowHeight - SCREEN_INDENT, top + buttonHeight);
    } else if (top < SCREEN_INDENT) {
      top = SCREEN_INDENT + anchorHeight - (anchorOffset?.top ?? 0);
    }

    const shadowMenuContainerStyle = {
      opacity: opacityAnimation,
      transform: transforms,
      top: top + anchorHeight - (anchorOffset?.top ?? 0),

      // Switch left to right for rtl devices
      ...(isRTL ? { right: left } : { left }),
    };

    const { menuState } = this.state;
    const animationStarted = menuState === States.Animating;
    const modalVisible = menuState === States.Shown || animationStarted;

    const { testID, anchor, style, children } = this.props;

    return (
      <View ref={this.setContainerRef} collapsable={false} testID={testID}>
        <View ref={this.setAnchorContainerRef}>{anchor}</View>

        <Modal
          visible={modalVisible}
          onRequestClose={this.onRequestClose}
          supportedOrientations={["portrait", "portrait-upside-down", "landscape", "landscape-left", "landscape-right"]}
          transparent
        >
          <TouchableWithoutFeedback disabled={disabled} onPress={this.onRequestClose} accessible={false}>
            <View style={StyleSheet.absoluteFill}>
              <Animated.View
                onLayout={this.onMenuLayout}
                style={[styles.shadowMenuContainer, shadowMenuContainerStyle, style]}
              >
                <Animated.View style={[styles.menuContainer, animationStarted && menuSize]}>{children}</Animated.View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }
}
