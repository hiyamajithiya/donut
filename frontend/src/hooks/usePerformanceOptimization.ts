import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

// Debounce hook for performance optimization
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for performance optimization
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRanRef = useRef<number>(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRanRef.current >= delay) {
        func(...args);
        lastRanRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          func(...args);
          lastRanRef.current = Date.now();
        }, delay - (now - lastRanRef.current));
      }
    }) as T,
    [func, delay]
  );
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = <T>(
  items: T[],
  containerHeight: number,
  itemHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      start: Math.max(0, startIndex - 2), // Add buffer
      end: endIndex,
    };
  }, [scrollTop, containerHeight, itemHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    offsetY: visibleRange.start * itemHeight,
  };
};

// Memoized expensive calculations
export const useMemoizedCalculation = <T, K extends ReadonlyArray<any>>(
  calculate: () => T,
  deps: K
): T => {
  return useMemo(calculate, deps);
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = new Image();
          img.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
            setIsError(false);
          };
          img.onerror = () => {
            setIsError(true);
            setIsLoaded(false);
          };
          img.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoaded, isError, imgRef };
};

// Component lazy loading with preloading
export const useComponentPreloader = () => {
  const preloadedComponents = useRef<Set<string>>(new Set());

  const preloadComponent = useCallback((componentName: string, loader: () => Promise<any>) => {
    if (!preloadedComponents.current.has(componentName)) {
      preloadedComponents.current.add(componentName);
      loader().catch(console.error);
    }
  }, []);

  return { preloadComponent };
};

// Memory-efficient data processing
export const useChunkedProcessing = <T, R>(
  data: T[],
  processor: (chunk: T[]) => R[],
  chunkSize: number = 100,
  delay: number = 10
) => {
  const [processedData, setProcessedData] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processData = useCallback(async () => {
    setIsProcessing(true);
    setProcessedData([]);
    setProgress(0);

    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    const results: R[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkResult = processor(chunks[i]);
      results.push(...chunkResult);
      setProcessedData([...results]);
      setProgress(((i + 1) / chunks.length) * 100);

      // Allow UI to update
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsProcessing(false);
  }, [data, processor, chunkSize, delay]);

  return {
    processedData,
    isProcessing,
    progress,
    processData,
  };
};

// Cache hook for expensive operations
export const useCache = <T extends Record<string, any>>(
  key: string,
  factory: () => T,
  deps: React.DependencyList
): T => {
  const cache = useRef<Map<string, { value: T; deps: React.DependencyList }>>(new Map());

  return useMemo(() => {
    const cached = cache.current.get(key);

    if (cached && cached.deps.every((dep, index) => dep === deps[index])) {
      return cached.value;
    }

    const value = factory();
    cache.current.set(key, { value, deps });
    return value;
  }, [key, ...deps]);
};

