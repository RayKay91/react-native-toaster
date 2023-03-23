import React, { createContext, useContext, useRef, useState } from 'react';
import { Toast, Props as ToastProps, toastTypeColors } from './Toast';

export type ToastConfig = {
  id?: string;
} & Omit<
  ToastProps,
  | 'isVisible'
  | 'setIsVisible'
  | 'displayNextToastInQueue'
  | 'setToastConfig'
  | 'userConfig'
>;

type ToastContextType = {
  isToastVisible: boolean;
  show: (toastConfig: ToastConfig) => void;
  hide: () => void;
};

function getToastContext({ isToastVisible, show, hide }: ToastContextType) {
  return {
    isToastVisible,
    hide,
    show,
  };
}

// context
const ToastContext = createContext<
  ReturnType<typeof getToastContext> | undefined
>(undefined);

export const useToaster = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('You must use the Toast context inside a provider!');
  }
  return context;
};

export type ToastProviderConfig = {
  toastTypeColors: typeof toastTypeColors;
};

type ToastProviderProps = {
  userConfig?: ToastProviderConfig;
  children: React.ReactNode;
};

// context provider
export function ToastProvider(props: ToastProviderProps) {
  const queue = useRef<ToastConfig[]>([]);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastConfig, setToastConfig] = useState<ToastConfig>({
    title: '',
  });

  const enqueueToast = (_toastConfig: ToastConfig) =>
    queue.current.push(_toastConfig);
  const dequeueToast = () => queue.current.shift();

  const show = (_toastConfig: ToastConfig) => {
    enqueueToast(_toastConfig);
    displayNextToastInQueue(false);
  };

  const hide = () => {
    setShowToast(false);
  };

  const displayNextToastInQueue = (shouldDequeue = true) => {
    if (shouldDequeue) dequeueToast();
    const nextToast = queue.current[0];
    if (nextToast) {
      setToastConfig(nextToast);
      setShowToast(true);
    }
  };

  return (
    <ToastContext.Provider
      value={getToastContext({
        isToastVisible: showToast,
        show,
        hide,
      })}
    >
      {props.children}
      <Toast
        {...toastConfig}
        userConfig={props.userConfig}
        isVisible={showToast}
        setIsVisible={setShowToast}
        displayNextToastInQueue={displayNextToastInQueue}
      />
    </ToastContext.Provider>
  );
}
