import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { V as ArrowLeft } from "../_libs/lucide-react.mjs";
import { t as Button } from "./press-UBLDE-un.mjs";
import { n as PrefsSaveBar, t as GuardBoundary } from "./prefs-save-bar-Dju-onwJ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/settings-shell-B4409fB9.js
var import_jsx_runtime = require_jsx_runtime();
function SettingsShell({ title, children, backTo = "/parametres", backLabel = "Paramètres" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex h-12 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "min-w-0 truncate font-display text-lg font-medium tracking-[-0.03em] sm:text-xl",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: backTo,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), backLabel]
					})
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GuardBoundary, {
				label: title,
				children
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrefsSaveBar, {})]
		})]
	});
}
//#endregion
export { SettingsShell as t };
