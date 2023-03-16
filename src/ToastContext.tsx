import React, { createContext, useContext, useRef, useState } from 'react';
import { Toast, Props as ToastProps } from './Toast';

export type ToastConfig = {
  id?: string;
} & Omit<
  ToastProps,
  'isVisible' | 'setIsVisible' | 'displayNextToastInQueue' | 'setToastConfig '
>;

type ToastContextType = {
  isToastVisible: boolean;
  show: (toastConfig: ToastConfig) => void;
  queue: ToastConfig[];
  hide: () => void;
};

function getToastContext({
  isToastVisible,
  show,
  queue,
  hide,
}: ToastContextType) {
  return {
    isToastVisible,
    hide,
    show,
    getQueue: () => Object.freeze([...queue.map(Object.freeze)]),
    // dangerous as user can mutate queue.
    dangerously_get_queue: () => queue,
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

// context provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
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
        queue: queue.current,
        isToastVisible: showToast,
        show,
        hide,
      })}
    >
      {children}
      <Toast
        {...toastConfig}
        isVisible={showToast}
        setIsVisible={setShowToast}
        displayNextToastInQueue={displayNextToastInQueue}
      />
    </ToastContext.Provider>
  );
}
