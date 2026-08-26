import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

const lastPointer = new WeakMap<EventTarget, number>();

/** Fire once on pointer down (iframe-safe). Falls back to click if needed. */
export function pressProps(fn: () => void) {
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
      lastPointer.set(e.currentTarget, Date.now());
      fn();
    },
    onClick: (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const at = lastPointer.get(e.currentTarget) ?? 0;
      if (Date.now() - at < 600) {
        e.preventDefault();
        return;
      }
      fn();
    },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
      }
    },
  };
}
