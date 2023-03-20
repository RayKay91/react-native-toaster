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
import type { ToastProviderConfig } from './ToastContext';
import { ToastType } from './types';
import { debounce, isJestRunningCode } from './utils';

const TOAST_HEIGHT = 75;
const H_PADDING = 25;
const TOAST_WIDTH = Dimensions.get('screen').width - H_PADDING;
const INITIAL_POSITION = -TOAST_HEIGHT; // hide toast above screen
export const FINAL_POSITION = TOAST_HEIGHT + 65;
const INITIAL_OPACITY = 0;
const FINAL_OPACITY = 1;
const SHOW_ANIM_CONFIG = {
  toValue: FINAL_POSITION,
  damping: 13,
  stiffness: 110,
  useNativeDriver: !isJestRunningCode(),
};
const HIDE_ANIM_CONFIG = {
  toValue: INITIAL_POSITION,
  easing: Easing.back(1.3),
  duration: 500,
  useNativeDriver: !isJestRunningCode(),
};
const DRAG_RESISTANCE = 0.7;
const DEFAULT_DELAY = 5000;

export type Props = {
  isVisible: boolean;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  displayNextToastInQueue: () => void;
  userConfig?: ToastProviderConfig;
  title: string;
  subText?: string;
  delay?: number;
  showAccent?: boolean;
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
  longPressDuration?: number;
};

const debug = false;

export function Toast({
  delay = DEFAULT_DELAY,
  showAccent = true,
  toastType = ToastType.DEFAULT,
  ...props
}: Props) {
  debug && console.log({ props });
  const timer = useRef<NodeJS.Timer | null>(null);
  const y = useRef(new Animated.Value(INITIAL_POSITION));
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dy }) => {
        // prohibit gesture if not moving to allow touchable opacity on press to function
        return dy !== 0;
      },
      onPanResponderMove: (_, { dy }) => {
        if (timer.current) {
          // refresh timeout if notification interacted with
          // ensures notification is not hidden while user is interacting with it.
          clearTimeout(timer.current);
          timer.current = setTimeout(() => props.setIsVisible(false), delay);
        }
        const isBelowFinalPosition = dy > 0; // use 0 as event gives relative position to where view was
        if (isBelowFinalPosition) {
          // add resistance when moving down
          // dy must be have drag resistance as exponent. Sum of dy and constant with resistance exponent doesn't work properly
          y.current.setValue(FINAL_POSITION + dy ** DRAG_RESISTANCE);
        } else {
          // is going up
          y.current.setValue(FINAL_POSITION + dy);
        }
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 0) {
          // going down
          return Animated.spring(y.current, SHOW_ANIM_CONFIG).start();
        }

        // going up
        Animated.decay(y.current, {
          velocity: vy * 0.1,
          useNativeDriver: true,
        }).start();
        // this should only run if the toast is flung up - not auto hidden, hence not in useEffect
        const listenerId = y.current.addListener(({ value }) => {
          if (value < INITIAL_POSITION) {
            // sometimes being called more than intended since value is from native thread so async.
            debounce(() => {
              if (timer.current) clearTimeout(timer.current);
              y.current.setValue(INITIAL_POSITION);
              hide(false);
            }, 75)();
            y.current.removeListener(listenerId);
          }
        });
      },
    })
  ).current;

  const show = useCallback(() => {
    props.onWillShow?.();
    Animated.spring(y.current, SHOW_ANIM_CONFIG).start(props.onDidShow);
  }, [props]);

  const onHide = useCallback(() => {
    props.onDidHide?.();
    props.displayNextToastInQueue();
  }, [props]);

  const hide = useCallback(
    (runWithAnimation = true) => {
      props.onWillHide?.();
      props.setIsVisible(false);
      // if toast is flung up, we dont want timing function to run, but other cbs and next toast logic should
      runWithAnimation
        ? Animated.timing(y.current, HIDE_ANIM_CONFIG).start(
            ({ finished }) => finished && onHide()
          )
        : onHide();
    },
    [props, onHide]
  );

  const isFirstMount = useRef(true);

  // useEffect necessary otherwise causes bad setState issue
  useEffect(() => {
    if (props.isVisible) {
      show();
      if (props.autoDismiss !== false) {
        timer.current = setTimeout(() => props.setIsVisible(false), delay);
      }
    }

    if (!props.isVisible) {
      timer.current && clearTimeout(timer.current);
      if (!isFirstMount.current) hide();
    }
    isFirstMount.current = false;

    () => y.current.removeAllListeners();
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
              TOAST_HEIGHT,
              props.topOffset ?? FINAL_POSITION,
            ],
            outputRange: [INITIAL_OPACITY, FINAL_OPACITY * 0.3, FINAL_OPACITY],
          }),
        },
      ]}
      testID={'toast'}
    >
      <TouchableOpacity
        accessibilityRole="button"
        delayLongPress={props.longPressDuration}
        onLongPress={() => {
          props.onLongPress?.();
          hide();
        }}
        onPress={() => {
          props.onPress?.();
          hide();
        }}
        disabled={!props.onPress && !props.onLongPress}
        style={styles.button}
      >
        {showAccent && (
          <View
            style={{
              ...styles.accentColumn,
              backgroundColor: getToastTypeColor(
                toastType,
                props.userConfig?.toastTypeColors
              ),
            }}
          />
        )}
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

export const toastTypeColors = {
  DEFAULT: 'white',
  SUCCESS: 'green',
  FAIL: 'red',
  INFO: 'blue',
};

const getToastTypeColor = (
  toastType: ToastType,
  colors: typeof toastTypeColors = toastTypeColors
) => {
  switch (toastType) {
    case ToastType.SUCCESS:
      return colors.SUCCESS;
    case ToastType.FAIL:
      return colors.FAIL;
    case ToastType.INFO:
      return colors.INFO;
    default:
      return colors.DEFAULT;
  }
};

const BORDER_RADIUS = 8;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: TOAST_WIDTH,
    height: TOAST_HEIGHT,
    alignSelf: 'center',
    top: INITIAL_POSITION,
    flexDirection: 'row',
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    borderColor: '#BBB',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
  },
  accentColumn: {
    width: 8,
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
