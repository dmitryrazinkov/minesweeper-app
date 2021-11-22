export function debounce<T extends Function>(callback: T, debounceTime = 0): T {
  let timeoutId: NodeJS.Timeout;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      callback(...args);
    }, debounceTime);
  }) as any;
}
