import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { r as Slot, s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/press-UBLDE-un.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium appearance-none touch-manipulation transition-[background-color,opacity,color] duration-100 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
			outline: "border border-border bg-transparent text-foreground hover:bg-accent",
			ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
			destructive: "bg-destructive text-destructive-foreground hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "h-11 w-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		type: asChild ? void 0 : type ?? "button",
		...props
	});
});
Button.displayName = "Button";
var lastPointer = /* @__PURE__ */ new WeakMap();
/** Fire once on pointer down (iframe-safe). Falls back to click if needed. */
function pressProps(fn) {
	return {
		onPointerDown: (e) => {
			if (e.pointerType === "mouse" && e.button !== 0) return;
			e.stopPropagation();
			lastPointer.set(e.currentTarget, Date.now());
			fn();
		},
		onClick: (e) => {
			e.stopPropagation();
			const at = lastPointer.get(e.currentTarget) ?? 0;
			if (Date.now() - at < 600) {
				e.preventDefault();
				return;
			}
			fn();
		},
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				fn();
			}
		}
	};
}
//#endregion
export { cn as n, pressProps as r, Button as t };
