import React, { useCallback, useEffect, useRef } from 'react';
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
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
  GestureUpdateEvent,
} from 'react-native-gesture-handler';
import type { ToastType } from './types';
import * as consts from './constants';
import type { ToastConfig } from './ToastContext';
import { FullWindowOverlay } from 'react-native-screens';

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

export type Props = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setToastConfig: React.Dispatch<React.SetStateAction<ToastConfig>>;
  toastQueue: ToastConfig[];
  title: string;
  delay?: number;
  subText?: string;
  autoDismiss?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subTextStyle?: TextStyle;
  topOffset?: number;
  toastType?: ToastType;
  onWillShow?: () => void;
  onDidShow?: () => void;
  onWillHide?: () => void;
  onDidHide?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
};

// @todo implemenet toast type

const debug = false;

export function Toast({ delay = consts.DEFAULT_DELAY, ...props }: Props) {
  debug && console.log({ props });
  // keep track of is on screen as visibility triggers an animation which may
  // yield a false for is visible, but it is still on screen during that animaiton
  const timer = useRef<NodeJS.Timer | null>(null);
  const top = useSharedValue(INITIAL_POSITION);
  const onShowFinish = useCallback(() => {
    props.onDidShow?.();
  }, [props]);

  const show = useCallback(() => {
    props.onWillShow?.();
    top.value = withSpring(
      props.topOffset ?? FINAL_POSITION,
      SHOW_ANIM_CONFIG,
      () => {
        runOnJS(onShowFinish)();
      }
    );
  }, [props, top, onShowFinish]);

  const onHideFinish = useCallback(() => {
    props.onDidHide?.();
    props.toastQueue.shift();
    const nextToast = props.toastQueue[0];
    if (nextToast) {
      props.setToastConfig(nextToast);
      props.setIsVisible(true);
    }
  }, [props]);

  const hide = useCallback(() => {
    props.onWillHide?.();
    props.setIsVisible(false);
    // callback is running sooner than expected with fling gesture hence the check for finished.
    top.value = withTiming(INITIAL_POSITION, HIDE_ANIM_CONFIG, (finished) => {
      if (finished) runOnJS(onHideFinish)(); // needs to be a named cb
    });
  }, [props, top, onHideFinish]);

  // useEffect necessary otherwise causes too many pending callbacks issue.
  useEffect(() => {
    if (props.isVisible) {
      show();
      if (props.autoDismiss !== false) {
        timer.current = setTimeout(() => props.setIsVisible(false), delay);
      }
    }

    if (!props.isVisible) {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      if (top.value !== INITIAL_POSITION) {
        hide();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  const onPan = useCallback(
    (e: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
      const newPosition = FINAL_POSITION + e.translationY ** 0.7;
      const isMovingDown = e.translationY > 0;
      if (isMovingDown) {
        top.value = newPosition; // add resistance when moving down
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const onEnd = useCallback(
    (e: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (e.translationY > -20) {
        top.value = withSpring(FINAL_POSITION, SHOW_ANIM_CONFIG);
      }
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const pan = Gesture.Pan().onUpdate(onPan).onEnd(onEnd);
  const onFlingStart = useCallback(() => {
    // move into useGesture custom hook
    hide();
  }, [hide]);
  const fling = Gesture.Fling().onStart(onFlingStart).direction(Directions.UP);
  const gestures = Gesture.Simultaneous(pan, fling);
  const animatedStyles = useAnimatedStyle(() => ({
    top: top.value,
    opacity: interpolate(
      top.value,
      [INITIAL_POSITION, TOP_OF_SCREEN, props.topOffset ?? FINAL_POSITION],
      [INITIAL_OPACITY, FINAL_OPACITY * 0.3, FINAL_OPACITY]
    ),
  }));

  return (
    // <FullWindowOverlay>
    <GestureDetector gesture={gestures}>
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
    // </FullWindowOverlay>
  );
}

const BORDER_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    alignSelf: 'center',
  },
  innerContainer: {
    flexDirection: 'row',
    height: '100%',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#BBB',
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
