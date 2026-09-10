import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Tip = { text: string; x: number; y: number; place: "top" | "bottom" };

function labelOf(el: HTMLElement): string {
  let n: HTMLElement | null = el;
  for (let i = 0; i < 4 && n; i++) {
    const data = n.getAttribute("data-tip");
    if (data?.trim()) return data.trim();
    n = n.parentElement;
  }
  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim();
  return "";
}

function targetOf(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  const el = node.closest<HTMLElement>(
    "button, [role='button'], summary, a[aria-label], a[data-tip]",
  );
  if (!el) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el.getAttribute("aria-disabled") === "true") return null;
  if (el.closest("[data-atlas-tip]")) return null;
  return el;
}

/** Bulle au survol de n’importe quel bouton, via aria-label / data-tip. */
export function ButtonTips() {
  const [tip, setTip] = useState<Tip | null>(null);
  const timer = useRef(0);
  const current = useRef<HTMLElement | null>(null);

  useEffect(() => {
    function clear() {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = 0;
      current.current = null;
      setTip(null);
    }
    function schedule(el: HTMLElement) {
      const text = labelOf(el);
      if (!text) {
        clear();
        return;
      }
      if (current.current === el) return;
      current.current = el;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (current.current !== el) return;
        const r = el.getBoundingClientRect();
        const place: "top" | "bottom" = window.innerHeight - r.bottom < 40 ? "top" : "bottom";
        setTip({
          text,
          x: r.left + r.width / 2,
          y: place === "bottom" ? r.bottom + 8 : r.top - 8,
          place,
        });
      }, 140);
    }
    function onOver(e: PointerEvent) {
      const el = targetOf(e.target);
      if (!el) return;
      schedule(el);
    }
    function onOut(e: PointerEvent) {
      const el = current.current;
      if (!el) return;
      const next = e.relatedTarget;
      if (next instanceof Node && el.contains(next)) return;
      if (targetOf(next)) return;
      clear();
    }
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerout", onOut);
    window.addEventListener("pointerdown", clear);
    window.addEventListener("scroll", clear, true);
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", clear);
      window.removeEventListener("scroll", clear, true);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  if (typeof document === "undefined" || !tip) return null;
  return createPortal(
    <div
      data-atlas-tip
      role="tooltip"
      className="pointer-events-none fixed z-[120] max-w-52 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground shadow-sm"
      style={{
        left: tip.x,
        top: tip.y,
        transform: tip.place === "bottom" ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
