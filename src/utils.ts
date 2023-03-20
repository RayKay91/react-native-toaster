export function debounce(cb: () => void, timeout: number) {
  let timerId: NodeJS.Timeout;
  return () => {
    clearTimeout(timerId);
    timerId = setTimeout(cb, timeout);
  };
}

export function isJestRunningCode() {
  return process.env.JEST_WORKER_ID !== undefined;
}
