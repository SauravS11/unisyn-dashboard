import { useCallback, useEffect, useRef, useState } from "react";
import type React from "react";

export interface TabBarRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Shared press-and-drag behaviour for pill nav bars: the sliding indicator
 * follows the pointer across items and the item under it is selected on release.
 * Plain clicks keep working; a drag suppresses the click that follows it.
 */
export function useDraggableTabs(activeId: string | undefined, onSelect: (id: string) => void) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [bar, setBar] = useState<TabBarRect | null>(null);
  const press = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);

  const shownId = previewId ?? activeId;

  const measure = useCallback(() => {
    const container = containerRef.current;
    const el = shownId ? itemRefs.current.get(shownId) : undefined;
    if (!container || !el) return setBar(null);
    const a = el.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setBar({
      left: a.left - c.left + container.scrollLeft,
      top: a.top - c.top,
      width: a.width,
      height: a.height,
    });
  }, [shownId]);

  useEffect(() => {
    measure();
    const raf = requestAnimationFrame(measure);
    const t = window.setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const itemAt = (x: number, y: number) => {
    let best: string | null = null;
    let bestDist = Infinity;
    itemRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      const dx = x < r.left ? r.left - x : x > r.right ? x - r.right : 0;
      const dy = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
      const d = dx + dy * 4;
      if (d < bestDist) {
        bestDist = d;
        best = id;
      }
    });
    return best;
  };

  const setItemRef = (id: string) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  };

  const containerProps = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      press.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const p = press.current;
      if (!p || p.id !== e.pointerId) return;
      if (!p.dragging) {
        if (Math.abs(e.clientX - p.x) < 6) return;
        p.dragging = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      const id = itemAt(e.clientX, e.clientY);
      if (id) setPreviewId(id);
    },
    onPointerUp: (e: React.PointerEvent) => {
      const p = press.current;
      press.current = null;
      if (!p?.dragging) return;
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 0);
      const id = itemAt(e.clientX, e.clientY) ?? previewId;
      setPreviewId(null);
      if (id && id !== activeId) onSelect(id);
    },
    onPointerCancel: () => {
      press.current = null;
      setPreviewId(null);
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (suppressClick.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClick.current = false;
      }
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
  };

  return { containerRef, setItemRef, bar, shownId, dragging: previewId !== null, containerProps };
}
