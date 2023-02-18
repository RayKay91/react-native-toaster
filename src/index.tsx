import React, { useCallback, useEffect } from 'react';
import { Dimensions, StyleSheet, ViewStyle } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  Directions,
} from 'react-native-gesture-handler';

const TOAST_HEIGHT = 75;
const H_PADDING = 25;
const TOAST_WIDTH = Dimensions.get('screen').width - H_PADDING;
const INITIAL_POSITION = -TOAST_HEIGHT; // hide toast above screen
const TOP_OF_SCREEN = 0;
const FINAL_POSITION = 65; // i.e. 65 pixels from top edge of screen
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const SPRING_CONFIG = { damping: 13, stiffness: 110 };

type Props = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  delay: number;
  autoDismiss?: boolean;
  containerStyle?: ViewStyle;
  topOffset?: number;
  onWillShow?: () => void;
  onDidShow?: () => void;
  onWillHide?: () => void;
  onDidHide?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function Toast(props: Props) {
  const top = useSharedValue(INITIAL_POSITION);
  const onHide = useCallback(() => {
    props.setIsVisible(false);
    props.onDidHide?.();
  }, [props]);
  const hide = useCallback(() => {
    top.value = withTiming(
      INITIAL_POSITION,
      { easing: Easing.back(1.3), duration: 500 },
      () => {
        runOnJS(onHide)();
      }
    );
  }, [top, onHide]);

  const onShow = useCallback(() => {
    props.onDidShow?.();
  }, [props]);

  const show = useCallback(() => {
    top.value = withSpring(
      props.topOffset ?? FINAL_POSITION,
      SPRING_CONFIG,
      () => {
        runOnJS(onShow)();
      }
    );
  }, [props.topOffset, top, onShow]);

  // useEffect necessary otherwise causes too many pending callbacks issue.
  useEffect(() => {
    if (props.isVisible) {
      props.onWillShow?.();
      show();
      if (props.autoDismiss !== false) {
        setTimeout(() => props.setIsVisible(false), props.delay);
      }
    }

    if (!props.isVisible && top.value !== INITIAL_POSITION) {
      props.onWillHide?.();
      hide();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  const onFlingStart = useCallback(() => {
    hide();
  }, [hide]);
  const flingGesture = Gesture.Fling()
    .onStart(onFlingStart)
    .direction(Directions.UP);

  const animatedStyles = useAnimatedStyle(() => ({
    top: top.value,
    opacity: interpolate(
      top.value,
      [INITIAL_POSITION, TOP_OF_SCREEN, props.topOffset ?? FINAL_POSITION],
      [INITIAL_OPACITY, FINAL_OPACITY * 0.3, FINAL_OPACITY]
    ),
  }));

  return (
    <GestureDetector gesture={flingGesture}>
      <Reanimated.View
        style={[styles.container, props.containerStyle, animatedStyles]}
      />
    </GestureDetector>
  );
}

const BORDER_RADIUS = 14;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    borderRadius: BORDER_RADIUS,
  },
});
