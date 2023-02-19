import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  StyleSheet,
  ViewStyle,
  View,
  Text,
  TextStyle,
} from 'react-native';
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
export const FINAL_POSITION = 65; // i.e. 65 pixels from top edge of screen
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const SHOW_ANIM_CONFIG = { damping: 13, stiffness: 110 };
const HIDE_ANIM_CONFIG = { easing: Easing.back(1.3), duration: 500 };

type Props = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  delay: number;
  title: string;
  subText?: string;
  autoDismiss?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subTextStyle?: TextStyle;
  topOffset?: number;
  onWillShow?: () => void;
  onDidShow?: () => void;
  onWillHide?: () => void;
  onDidHide?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
};
// to allow it to appear over modals try using fullscreenwindow component from react-native-screens

export function Toast(props: Props) {
  const top = useSharedValue(INITIAL_POSITION);
  const onShow = useCallback(() => {
    props.onDidShow?.();
  }, [props]);

  const show = useCallback(() => {
    props.onWillShow?.();
    top.value = withSpring(
      props.topOffset ?? FINAL_POSITION,
      SHOW_ANIM_CONFIG,
      () => {
        runOnJS(onShow)();
      }
    );
  }, [props, top, onShow]);

  const onHide = useCallback(() => {
    props.setIsVisible(false);
    props.onDidHide?.();
  }, [props]);

  const hide = useCallback(() => {
    props.onWillHide?.();
    top.value = withTiming(INITIAL_POSITION, HIDE_ANIM_CONFIG, () => {
      runOnJS(onHide)(); // needs to be a named cb
    });
  }, [props, top, onHide]);

  // useEffect necessary otherwise causes too many pending callbacks issue.
  useEffect(() => {
    if (props.isVisible) {
      show();
      if (props.autoDismiss !== false) {
        setTimeout(() => props.setIsVisible(false), props.delay);
      }
    }

    if (!props.isVisible && top.value !== INITIAL_POSITION) {
      hide();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  const onFlingStart = useCallback(() => {
    // move into useGesture custom hook
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
        testID={'toast'}
      >
        <View style={styles.innerContainer}>
          <View style={styles.accentColumn} />
          <View style={styles.contentWrapper}>
            <View style={styles.contentContainer}>
              <Text style={[styles.title, props.titleStyle]}>
                {props.title}
              </Text>
              {!!props.subText && (
                <Text style={[styles.subtText, props.subTextStyle]}>
                  {props.subText}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Reanimated.View>
    </GestureDetector>
  );
}

const BORDER_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
  },
  innerContainer: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: BORDER_RADIUS,
  },
  accentColumn: {
    width: 10,
    backgroundColor: 'red',
    borderTopLeftRadius: BORDER_RADIUS,
    borderBottomLeftRadius: BORDER_RADIUS,
  },
  contentWrapper: {
    flexDirection: 'row',
    flex: 1,
    paddingLeft: 10,
    borderRadius: BORDER_RADIUS,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    backgroundColor: 'white',
  },
  contentContainer: {
    justifyContent: 'center',
  },
  title: {},
  subtText: {},
});
