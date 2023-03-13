import React, { useCallback, useEffect, useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  ViewStyle,
  View,
  Text,
  TextStyle,
  TouchableOpacity,
  Animated,
  Easing,
  PanResponder,
} from 'react-native';

import { ToastType } from './types';
import * as consts from './constants';
import type { ToastConfig } from './ToastContext';

const TOAST_HEIGHT = 75;
const H_PADDING = 25;
const TOAST_WIDTH = Dimensions.get('screen').width - H_PADDING;
const INITIAL_POSITION = -TOAST_HEIGHT; // hide toast above screen
const TOP_OF_SCREEN = 0;
export const FINAL_POSITION = TOAST_HEIGHT + 65;
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const SHOW_ANIM_CONFIG = {
  toValue: FINAL_POSITION,
  damping: 13,
  stiffness: 110,
  useNativeDriver: true,
};
const HIDE_ANIM_CONFIG = {
  toValue: INITIAL_POSITION,
  easing: Easing.back(1.3),
  duration: 500,
  useNativeDriver: true,
};
const DRAG_RESISTANCE = 0.7;

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

const debug = false;

export function Toast({ delay = consts.DEFAULT_DELAY, ...props }: Props) {
  debug && console.log({ props });
  const timer = useRef<NodeJS.Timer | null>(null);
  const y = useRef(new Animated.Value(INITIAL_POSITION));
  const panResponder = useRef(
    PanResponder.create({
      onPanResponderMove: (_, gestureState) => {
        if (timer.current) {
          // refresh timeout if notification interacted with
          // ensures notification is not hidden while user is interacting with it.
          clearTimeout(timer.current);
          timer.current = setTimeout(() => props.setIsVisible(false), delay);
        }
        const isBelowFinalPosition = gestureState.dy > 0; // use 0 as event gives relative position to where view was
        if (isBelowFinalPosition) {
          // add resistance when moving down
          const newPosition =
            FINAL_POSITION + gestureState.dy ** DRAG_RESISTANCE;
          y.current.setValue(newPosition);
        }
      },
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 0) {
          Animated.spring(y.current, SHOW_ANIM_CONFIG).start();
        }
      },
    })
  ).current;

  const show = useCallback(() => {
    props.onWillShow?.();
    Animated.spring(y.current, SHOW_ANIM_CONFIG).start(props.onDidShow);
  }, [props]);

  const hide = useCallback(() => {
    props.onWillHide?.();
    props.setIsVisible(false);
    Animated.timing(y.current, HIDE_ANIM_CONFIG).start(({ finished }) => {
      // callback running sooner than expected - on reanimated - check again after refactor.
      if (finished) {
        props.onDidHide?.();
        props.toastQueue.shift();
        const nextToast = props.toastQueue[0];
        if (nextToast) {
          props.setToastConfig(nextToast);
          props.setIsVisible(true);
        }
      }
    });
  }, [props]);

  // useEffect necessary otherwise causes too many pending callbacks issue.
  useEffect(() => {
    if (props.isVisible) {
      show();
      if (props.autoDismiss !== false) {
        timer.current = setTimeout(() => props.setIsVisible(false), delay);
      }
    }

    if (!props.isVisible) {
      if (timer.current) clearTimeout(timer.current);
      // check this works - may need a listener instead of number conversion
      if (Number(y.current) !== INITIAL_POSITION) hide();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isVisible]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        props.containerStyle,
        {
          transform: [{ translateY: y.current }],
          opacity: y.current.interpolate({
            inputRange: [
              INITIAL_POSITION,
              TOP_OF_SCREEN,
              props.topOffset ?? FINAL_POSITION,
            ],
            outputRange: [INITIAL_OPACITY, FINAL_OPACITY * 0.3, FINAL_OPACITY],
          }),
        },
      ]}
      testID={'toast'}
    >
      <TouchableOpacity
        onLongPress={props.onLongPress}
        onPress={props.onPress}
        disabled={!props.onPress && !props.onLongPress}
        style={styles.innerContainer}
      >
        <View
          style={{
            ...styles.accentColumn,
            backgroundColor: getToastTypeColor(props.toastType),
          }}
        />
        <View style={styles.contentWrapper}>
          <View style={styles.contentContainer}>
            <Text style={[styles.title, props.titleStyle]}>{props.title}</Text>
            {!!props.subText && (
              <Text style={[styles.subtText, props.subTextStyle]}>
                {props.subText}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const getToastTypeColor = (toastType: ToastType | undefined) => {
  switch (toastType) {
    case ToastType.SUCCESS:
      return 'green';
    case ToastType.FAIL:
      return 'red';
    case ToastType.INFO:
      return 'blue';
    default:
      return 'white';
  }
};

const BORDER_RADIUS = 12;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    alignSelf: 'center',
    top: INITIAL_POSITION,
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
    backgroundColor: 'white',
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
