import React, { createContext, useContext, useRef, useState } from 'react';
import { Toast, Props as ToastProps } from './Toast';

type ToastConfig = {
  id?: string;
} & Omit<ToastProps, 'isVisible' | 'setIsVisible'>;

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

  const getNextToast = () => queue.current[queue.current.length - 1];
  const show = (toastConfigs: ToastConfig) => {
    queue.current.unshift(toastConfigs);
    const nextToast = getNextToast();
    if (nextToast) setToastConfig(nextToast);
    setShowToast(true);
  };

  const hide = () => {
    setShowToast(false);
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
      />
    </ToastContext.Provider>
  );
}
