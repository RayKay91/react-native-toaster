export function debounce(cb: () => void, timeout: number) {
  let timerId: NodeJS.Timeout;
  return () => {
    clearTimeout(timerId);
    timerId = setTimeout(cb, timeout);
  };
}
