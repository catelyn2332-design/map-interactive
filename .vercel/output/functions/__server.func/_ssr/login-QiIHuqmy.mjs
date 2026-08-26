import { _ as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-DuSMeD84.mjs";
import { r as pressProps, t as Button } from "./press-UBLDE-un.mjs";
import { r as signIn } from "./client-B40BzJxt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-QiIHuqmy.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-background px-4 text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-medium tracking-[-0.03em]",
					children: "Connexion"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-muted-foreground",
					children: "Associez Atlas à votre compte pour retrouver couleurs, plan et propriétés d’un appareil à l’autre."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-2",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						className: "w-full",
						...pressProps(() => {
							signIn(p.providerId, { callbackURL: "/parametres/compte" });
						}),
						children: ["Continuer avec ", p.label]
					}, p.providerId))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/parametres",
						children: "Retour aux paramètres"
					})
				})
			]
		})
	});
}
//#endregion
export { Login as component };
