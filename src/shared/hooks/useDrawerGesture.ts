import { useCallback, useRef, useState } from "react";

interface DrawerGestureState {
  isOpen: boolean;
  progress: number; // 0 = closed, 1 = fully open
  isDragging: boolean;
}

interface DrawerGestureHandlers {
  edgeHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
  };
  drawerHandlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

const DRAWER_WIDTH = 320; // px — max-w-sm
const EDGE_WIDTH = 24; // px — zona sensible en el borde izquierdo
const SNAP_THRESHOLD = 0.3; // 30% del drawer para abrir

export function useDrawerGesture(): {
  state: DrawerGestureState;
  handlers: DrawerGestureHandlers;
  open: () => void;
  close: () => void;
  toggle: () => void;
} {
  const [state, setState] = useState<DrawerGestureState>({
    isOpen: false,
    progress: 0,
    isDragging: false,
  });

  const touchRef = useRef<{
    startX: number;
    startProgress: number;
  } | null>(null);

  const maxDrawerWidth = Math.min(DRAWER_WIDTH, typeof window !== "undefined" ? window.innerWidth * 0.8 : DRAWER_WIDTH);

  const updateProgress = useCallback((clientX: number) => {
    if (!touchRef.current) return;
    const delta = clientX - touchRef.current.startX;
    const progressFromStart = delta / maxDrawerWidth;
    const raw = touchRef.current.startProgress + progressFromStart;
    const clamped = Math.max(0, Math.min(1, raw));
    setState((prev) => ({ ...prev, progress: clamped, isOpen: clamped > 0, isDragging: true }));
  }, [maxDrawerWidth]);

  const snapTo = useCallback((targetOpen: boolean) => {
    touchRef.current = null;
    setState({
      isOpen: targetOpen,
      progress: targetOpen ? 1 : 0,
      isDragging: false,
    });
  }, []);

  // ── Edge swipe to open ──
  const onEdgeTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > EDGE_WIDTH) return; // solo borde izquierdo
    touchRef.current = { startX: touch.clientX, startProgress: 0 };
  }, []);

  // ── Drawer touch handlers ──
  const onDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchRef.current = { startX: touch.clientX, startProgress: state.progress };
  }, [state.progress]);

  const onDrawerTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    e.preventDefault();
    updateProgress(e.touches[0].clientX);
  }, [updateProgress]);

  const onDrawerTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const finalX = e.changedTouches[0].clientX;
    const delta = finalX - touchRef.current.startX;
    const totalProgress = touchRef.current.startProgress + delta / maxDrawerWidth;
    snapTo(totalProgress > SNAP_THRESHOLD);
  }, [maxDrawerWidth, snapTo]);

  const open = useCallback(() => snapTo(true), [snapTo]);
  const close = useCallback(() => snapTo(false), [snapTo]);
  const toggle = useCallback(() => snapTo(!state.isOpen), [snapTo, state.isOpen]);

  return {
    state,
    handlers: {
      edgeHandlers: { onTouchStart: onEdgeTouchStart },
      drawerHandlers: {
        onTouchStart: onDrawerTouchStart,
        onTouchMove: onDrawerTouchMove,
        onTouchEnd: onDrawerTouchEnd,
      },
    },
    open,
    close,
    toggle,
  };
}
