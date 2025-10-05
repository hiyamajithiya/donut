import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Box, List, ListItem, Typography } from '@mui/material';
import { useVirtualScrolling } from '../hooks/usePerformanceOptimization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  overscan?: number;
  loadMoreItems?: () => void;
  hasNextPage?: boolean;
  isLoadingMore?: boolean;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  overscan = 5,
  loadMoreItems,
  hasNextPage = false,
  isLoadingMore = false,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return { start: startIndex, end: endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      originalIndex: visibleRange.start + index,
    }));
  }, [items, visibleRange]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);

    // Load more items when near the bottom
    if (
      loadMoreItems &&
      hasNextPage &&
      !isLoadingMore &&
      newScrollTop + containerHeight >= (items.length * itemHeight) - (itemHeight * 5)
    ) {
      loadMoreItems();
    }
  }, [loadMoreItems, hasNextPage, isLoadingMore, items.length, itemHeight, containerHeight]);

  // Total height calculation
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <Box
        sx={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: offsetY,
            left: 0,
            right: 0,
          }}
        >
          <List disablePadding>
            {visibleItems.map(({ item, originalIndex }) => (
              <ListItem
                key={keyExtractor(item, originalIndex)}
                sx={{
                  height: itemHeight,
                  minHeight: itemHeight,
                  maxHeight: itemHeight,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                }}
                disablePadding
              >
                {renderItem(item, originalIndex)}
              </ListItem>
            ))}
            {isLoadingMore && (
              <ListItem
                sx={{
                  height: itemHeight,
                  minHeight: itemHeight,
                  maxHeight: itemHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  Loading more items...
                </Typography>
              </ListItem>
            )}
          </List>
        </Box>
      </Box>
    </Box>
  );
}

export default VirtualizedList;