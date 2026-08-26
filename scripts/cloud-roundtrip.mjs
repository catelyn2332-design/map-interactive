import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080";
const stamp = `Nuage-${Date.now().toString(36)}`;
const email = `atlas.${Date.now()}@example.com`;
const password = "AtlasCloud99!";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

const net = [];
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("response", async (r) => {
  const u = r.url();
  if (/auth|cloud|_serverFn|get-session/i.test(u)) {
    let body = "";
    try {
      body = (await r.text()).slice(0, 220);
    } catch {
      /* ignore */
    }
    net.push({
      status: r.status(),
      url: u.replace(url, ""),
      body,
    });
  }
});

async function waitHydrated() {
  await page.waitForFunction(
    () => document.documentElement.dataset.prefsHydrated === "1",
    { timeout: 25000 },
  );
}

async function go(path) {
  const target = `${url}${path}`;
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 25000 });
  await waitHydrated();
}

const result = { ok: false, email, stamp, steps: {}, errors: [], unauthorizedWhileSignedOut: 0 };

try {
  await go("/parametres/compte");
  await page.waitForTimeout(1200);
  const signedOutUi = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      connecter: t.includes("Se connecter"),
      enregistrer: t.includes("Enregistrer sur le compte"),
      locale: t.includes("Copie locale uniquement"),
    };
  });
  result.steps.signedOutUi = signedOutUi;

  const session = await page.evaluate(async () => {
    const r = await fetch("/api/auth/get-session", { credentials: "include" });
    return { status: r.status, body: (await r.text()).slice(0, 120) };
  });
  result.steps.session = session;

  const backend = await page.evaluate(async () => {
    const mod = await import("/src/lib/map/cloud.ts");
    return mod.cloudBackendReady();
  });
  result.steps.backend = backend;

  result.unauthorizedWhileSignedOut = net.filter((n) => {
    const hit = /loadCloudPrefs|saveCloudPrefs|inspectOwnCloud/i.test(n.url + n.body);
    return hit && (n.status === 401 || n.body.includes("Unauthorized"));
  }).length;
  result.steps.signedOutCloudCalls = net
    .filter((n) => /loadCloudPrefs|saveCloudPrefs|inspectOwnCloud/i.test(n.url + n.body))
    .map((n) => ({ status: n.status, url: n.url, body: n.body.slice(0, 80) }));

  await go("/login");
  await page.getByRole("button", { name: "Pas encore de compte — en créer un" }).click();
  await page.locator("#atlas-email").fill(email);
  await page.locator("#atlas-password").fill(password);
  await page.getByRole("button", { name: "Créer le compte" }).click();
  await page.waitForURL(/\/parametres\/compte/, { timeout: 20000 });
  await waitHydrated();
  await page.getByRole("button", { name: "Enregistrer sur le compte" }).waitFor({ timeout: 15000 });
  result.steps.signedInUi = true;

  await go("/parametres/interface");
  const appName = page.getByLabel("Nom de l’application");
  await appName.waitFor({ timeout: 10000 });
  await appName.fill(stamp);
  await page.getByRole("button", { name: "Sauvegarder les préférences" }).click();
  await page.getByText("Préférences enregistrées").first().waitFor({ timeout: 8000 }).catch(() => null);

  await go("/parametres/compte");
  await page.getByRole("button", { name: "Enregistrer sur le compte" }).click();
  await page.getByText("Copie enregistrée sur le compte").first().waitFor({ timeout: 12000 });

  const afterPush = await page.evaluate(async () => {
    const cloud = await import("/src/lib/map/cloud.ts");
    const inspect = await cloud.inspectOwnCloud();
    const loaded = await cloud.loadCloudPrefs();
    let appName = null;
    try {
      appName = JSON.parse(loaded?.payloadJson ?? "{}")?.copy?.appName ?? null;
    } catch {
      appName = "parse-failed";
    }
    return { inspect, appName, savedAt: loaded?.savedAt ?? null };
  });
  result.steps.afterPush = afterPush;

  if (!afterPush?.inspect?.present) {
    throw new Error("inspectOwnCloud present=false after push");
  }
  if (afterPush.appName !== stamp) {
    throw new Error(`cloud payload appName=${afterPush.appName} expected ${stamp}`);
  }

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForTimeout(1500);
  await go("/parametres/compte");
  const afterSignOut = await page.evaluate(() => document.body.innerText.includes("Se connecter"));
  result.steps.afterSignOut = afterSignOut;

  const unsignedLoad = await page.evaluate(async () => {
    try {
      const cloud = await import("/src/lib/map/cloud.ts");
      const loaded = await cloud.loadCloudPrefs();
      return { ok: true, loaded };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
  result.steps.unsignedLoad = unsignedLoad;
  if (unsignedLoad.ok && unsignedLoad.loaded) {
    throw new Error("signed-out loadCloudPrefs returned a payload");
  }

  await go("/login");
  await page.locator("#atlas-email").fill(email);
  await page.locator("#atlas-password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/parametres\/compte/, { timeout: 20000 });
  await waitHydrated();
  await page.getByRole("button", { name: "Restaurer depuis le compte" }).click();
  await page.getByText("Plan restauré depuis le compte").first().waitFor({ timeout: 12000 });

  await go("/parametres/interface");
  const restored = await page.getByLabel("Nom de l’application").inputValue();
  result.steps.restoredAppName = restored;
  if (restored !== stamp) {
    throw new Error(`restored appName=${restored} expected ${stamp}`);
  }

  result.ok = true;
} catch (err) {
  result.error = String(err?.stack || err);
} finally {
  result.errors = errors.slice(0, 24);
  result.netSample = net.slice(-18);
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.ok) process.exit(1);
}
