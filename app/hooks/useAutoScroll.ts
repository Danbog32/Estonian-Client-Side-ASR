import { useEffect, useRef, useCallback, useState } from "react";

interface UseAutoScrollOptions {
  /**
   * The content that triggers autoscroll when changed
   */
  content: string | number;
  /**
   * Threshold in pixels from bottom to consider "at bottom" for autoscroll
   * Default: 50
   */
  threshold?: number;
  /**
   * Threshold in pixels from bottom to show the scroll-to-bottom button
   * Default: 200
   */
  buttonThreshold?: number;
  /**
   * Whether autoscroll is enabled
   * Default: true
   */
  enabled?: boolean;
  /**
   * Scroll behavior used when autoscrolling due to new content.
   * Default: "auto"
   */
  autoBehavior?: ScrollBehavior;
  /**
   * Scroll behavior used when user clicks the scroll-to-bottom button.
   * Default: "smooth"
   */
  manualBehavior?: ScrollBehavior;
}

/**
 * A robust autoscroll hook that automatically scrolls to bottom when content changes,
 * but allows users to scroll up and read without interruption.
 *
 * @returns Object containing scrollRef, isScrolledUp state, and scrollToBottom function
 */
export function useAutoScroll<T extends HTMLElement>({
  content,
  threshold = 50,
  buttonThreshold = 200,
  enabled = true,
  autoBehavior = "auto",
  manualBehavior = "smooth",
}: UseAutoScrollOptions) {
  const scrollRef = useRef<T | null>(null);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  /**
   * Check if the element is scrolled near the bottom (for autoscroll)
   */
  const isNearBottom = useCallback(
    (element: HTMLElement): boolean => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      return scrollHeight - scrollTop - clientHeight < threshold;
    },
    [threshold]
  );

  /**
   * Check if the element is scrolled far enough to show button
   */
  const isScrolledFarFromBottom = useCallback(
    (element: HTMLElement): boolean => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      return scrollHeight - scrollTop - clientHeight > buttonThreshold;
    },
    [buttonThreshold]
  );

  /**
   * Scroll to bottom smoothly
   */
  const scrollToBottomWithBehavior = useCallback((behavior: ScrollBehavior) => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior,
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollToBottomWithBehavior(manualBehavior);
  }, [manualBehavior, scrollToBottomWithBehavior]);

  /**
   * Handle scroll events to detect user interaction
   */
  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Clear existing timeout
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }

    // Mark as user scrolling
    isUserScrollingRef.current = true;

    // Check if user scrolled back to bottom (for autoscroll re-enabling)
    const nearBottom = isNearBottom(element);
    if (nearBottom) {
      shouldAutoScrollRef.current = true;
    } else {
      shouldAutoScrollRef.current = false;
    }

    // Check if user scrolled far enough to show button (higher threshold)
    const farFromBottom = isScrolledFarFromBottom(element);
    setIsScrolledUp(farFromBottom);

    // Debounce: consider user done scrolling after 150ms of no scroll events
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 150);
  }, [isNearBottom, isScrolledFarFromBottom]);

  /**
   * Effect to handle autoscrolling when content changes
   */
  useEffect(() => {
    if (!enabled) return;

    const element = scrollRef.current;
    if (!element) return;

    // Re-check proximity on each content update to support "near bottom" behavior.
    // This handles cases where user didn't trigger a recent scroll event.
    if (isNearBottom(element)) {
      shouldAutoScrollRef.current = true;
    }

    // Only autoscroll if:
    // 1. User is not actively scrolling
    // 2. User is near the bottom (or explicitly wants to autoscroll)
    if (!isUserScrollingRef.current && shouldAutoScrollRef.current) {
      scrollToBottomWithBehavior(autoBehavior);

      // Run a second pass on the next frame to account for late layout changes
      // (font rendering / wrapping / container resize) in live caption streams.
      const rafId = window.requestAnimationFrame(() => {
        scrollToBottomWithBehavior(autoBehavior);
      });

      return () => window.cancelAnimationFrame(rafId);
    }
  }, [autoBehavior, content, enabled, isNearBottom, scrollToBottomWithBehavior]);

  /**
   * Set up scroll event listener
   */
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize state for the current scroll position.
    handleScroll();

    return () => {
      element.removeEventListener("scroll", handleScroll);
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, [enabled, handleScroll]);

  /**
   * Initialize: assume we want to autoscroll at start
   */
  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, []);

  return {
    scrollRef,
    isScrolledUp,
    scrollToBottom,
  };
}
