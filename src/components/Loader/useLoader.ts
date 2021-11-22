import { useRef, useState } from 'react';

export function useLoader(loading = false): [boolean, () => void, () => void] {
  const [isLoading, setIsLoading] = useState(loading);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const showLoader = () => {
    if (timeout.current !== undefined) {
      return;
    }
    timeout.current = setTimeout(() => {
      setIsLoading(true);
    }, 500);
  };

  const hideLoader = () => {
    setIsLoading(false);
    if (timeout.current !== undefined) {
      clearTimeout(timeout.current);
    }
    timeout.current = undefined;
  };

  return [isLoading, showLoader, hideLoader];
}
