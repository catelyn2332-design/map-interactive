import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080";

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("dialog", (d) => d.accept());

function rgbOf(hex) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function bg() {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
}

async function waitHydrated() {
  await page.waitForFunction(
    () => document.documentElement.dataset.prefsHydrated === "1",
    { timeout: 20000 },
  );
}

async function waitBg(hex, label) {
  const expected = rgbOf(hex);
  await page.waitForFunction(
    (want) => getComputedStyle(document.documentElement).backgroundColor === want,
    expected,
    { timeout: 15000 },
  );
  const got = await bg();
  if (got !== expected) throw new Error(`${label} ${got}`);
  return got;
}

async function go(path) {
  const target = path.startsWith("http") ? path : `${url}${path === "/" ? "" : path}`;
  const suffix = path === "/" ? "/" : path;
  for (let i = 0; i < 5; i++) {
    try {
      try {
        await page.evaluate(() => {
          window.onbeforeunload = null;
        });
      } catch {
        /* page may not be ready */
      }
      await page.goto(target, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForURL((u) => {
        try {
          const p = new URL(u).pathname;
          return suffix === "/" ? p === "/" : p === suffix;
        } catch {
          return false;
        }
      }, { timeout: 8000 });
      await waitHydrated();
      return;
    } catch (err) {
      const msg = String(err?.message || err);
      if (i === 4) throw err;
      if (!/ERR_ABORTED|destroyed|Timeout|interrupted/i.test(msg)) throw err;
      await page.waitForTimeout(700);
    }
  }
}

async function clickSavePrefs() {
  const btn = page.getByRole("button", { name: "Sauvegarder les préférences" });
  await btn.click();
  try {
    await page.getByText("Préférences enregistrées").first().waitFor({ timeout: 8000 });
  } catch {
    await page.waitForTimeout(500);
    if (await btn.isEnabled()) {
      throw new Error("save prefs did not complete");
    }
  }
}

async function waitInputValue(value, timeout = 4000) {
  await page.waitForFunction(
    (want) =>
      [...document.querySelectorAll("input")].some((el) => el.value === want),
    value,
    { timeout },
  );
}

async function wipeLocal() {
  for (let i = 0; i < 4; i++) {
    try {
      await page.evaluate(() => {
        window.onbeforeunload = null;
        localStorage.clear();
        sessionStorage.clear();
      });
      return;
    } catch {
      await page.waitForTimeout(400);
      try {
        await page.waitForLoadState("load");
      } catch {
        /* keep trying */
      }
    }
  }
}

const result = { ok: false, errors, steps: {} };

try {
  await go("/parametres/interface");
  const creamField = page.locator("#color-background");
  await creamField.waitFor({ timeout: 4000 });
  await creamField.fill("#efe8d8");
  await page.waitForTimeout(80);
  const creamSave = page.getByRole("button", { name: "Sauvegarder les préférences" });
  if (await creamSave.isEnabled()) {
    await clickSavePrefs();
  }

  await go("/parametres/proprietes");
  const bootstrapReset = page.getByRole("button", { name: /Tout retirer/ });
  if ((await bootstrapReset.count()) && (await bootstrapReset.isEnabled())) {
    await bootstrapReset.click();
    await page.waitForTimeout(80);
  }
  await page.getByText("Aucune propriété").first().waitFor({ timeout: 4000 });
  result.steps.emptySchema = true;

  await go("/");
  await page.getByText(/Plan vide|Tracez une pièce/).first().waitFor({ timeout: 4000 });
  const homeText = await page.locator("body").innerText();
  if (/\bAccès\b/.test(homeText) || /\bStyle\b/.test(homeText)) {
    throw new Error("factory Accès/Style still on the map");
  }
  result.steps.sandboxHome = true;

  await go("/parametres/compte");
  await page.getByRole("button", { name: "Nouveau plan vide" }).click();
  await page.waitForTimeout(80);
  const emptySave = page.getByRole("button", { name: "Sauvegarder les préférences" });
  if (await emptySave.isEnabled()) {
    await emptySave.click();
    await page.getByText("Préférences enregistrées").first().waitFor({ timeout: 8000 });
  }

  await go("/parametres/interface");
  await page.locator("#color-background").fill("#141611");
  await page.waitForTimeout(80);
  const night = await waitBg("#141611", "theme apply");
  result.steps.themeApply = night;

  const saveBtn = page.getByRole("button", { name: "Sauvegarder les préférences" });
  await saveBtn.waitFor({ timeout: 4000 });
  if (await saveBtn.isDisabled()) {
    throw new Error("save prefs still disabled after theme change");
  }
  await clickSavePrefs();
  result.steps.prefsSave = true;

  await wipeLocal();
  await go("/parametres/interface");
  await page.waitForTimeout(300);
  const afterWipe = await waitBg("#141611", "prefs recover");
  result.steps.prefsRecover = afterWipe;

  await go("/");
  const addFloor = page.getByRole("button", { name: "Ajouter un étage" });
  await addFloor.click();
  await page.waitForTimeout(80);
  const two = page.getByRole("button", { name: "2", exact: true });
  await two.waitFor({ timeout: 4000 });
  await page.getByRole("button", { name: "1", exact: true }).click();
  await page.waitForTimeout(80);
  result.steps.floorSwitch = true;

  await go("/parametres/interface");
  await page.locator("#color-background").fill("#efe8d8");
  await page.waitForTimeout(1200);
  const creamHold = await bg();
  if (creamHold !== rgbOf("#efe8d8")) {
    throw new Error(`live theme snapped back ${creamHold}`);
  }
  result.steps.noMidSessionSnap = creamHold;

  await page.locator("#color-background").fill("#141611");
  await page.waitForTimeout(150);

  await go("/");
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Tracer une pièce" }).first().click();
  const map = page.getByRole("img", { name: /Plan/ });
  await map.waitFor({ timeout: 4000 });
  const box = await map.boundingBox();
  if (!box) throw new Error("map missing");
  await page.mouse.move(box.x + 90, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + 320, box.y + 220);
  await page.mouse.up();
  await page.waitForTimeout(200);

  const undoBtn = page.getByRole("button", { name: "Annuler" });
  await undoBtn.waitFor({ timeout: 4000 });
  if (await undoBtn.isDisabled()) throw new Error("undo disabled after drawing a room");
  await undoBtn.click();
  await page.getByText(/Plan vide/).first().waitFor({ timeout: 4000 });
  result.steps.undoRoom = true;

  await page.getByRole("button", { name: "Tracer une pièce" }).first().click();
  await page.mouse.move(box.x + 90, box.y + 70);
  await page.mouse.down();
  await page.mouse.move(box.x + 320, box.y + 220);
  await page.mouse.up();
  await page.waitForTimeout(200);

  await page.mouse.click(box.x + 180, box.y + 130, { button: "right" });
  await page.getByRole("menu", { name: /Éditer/ }).waitFor({ timeout: 4000 });
  result.steps.roomContextMenu = true;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);

  const roomTitle = `Maison relue ${Date.now()}`;
  await page.getByRole("button", { name: "Modifier" }).click();
  const name = page.locator("#room-name");
  await name.waitFor({ timeout: 4000 });
  await name.fill(roomTitle);
  await page.waitForTimeout(200);
  const roomSave = page.getByRole("button", { name: "Sauvegarder les préférences" });
  await page.waitForFunction(
    () => {
      const buttons = [...document.querySelectorAll("button")];
      const b = buttons.find((el) =>
        (el.textContent || "").includes("Sauvegarder les préférences"),
      );
      return b && !b.disabled;
    },
    null,
    { timeout: 8000 },
  );
  await clickSavePrefs();
  result.steps.roomPrefsSave = true;

  await wipeLocal();
  await go("/");
  await page.waitForTimeout(400);
  const bodyAfterRoom = await page.locator("body").innerText();
  if (!bodyAfterRoom.includes(roomTitle)) {
    throw new Error("room name lost after prefs recover");
  }
  result.steps.roomPrefsRecover = true;

  await go("/proprietes");
  await page.locator("#new-prop").fill("Lumière");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await waitInputValue("Lumière", 4000);
  const propSave = page.getByRole("button", { name: "Sauvegarder les préférences" });
  if (await propSave.isDisabled()) throw new Error("prop save still disabled");
  await clickSavePrefs();
  result.steps.propSave = true;

  await wipeLocal();
  await go("/proprietes");
  await page.waitForTimeout(500);
  await waitInputValue("Lumière", 8000);
  result.steps.propRecover = true;

  await go("/sauvegardes");
  await page.waitForTimeout(300);
  const saveName = `Partie test ${Date.now()}`;
  await page.getByLabel("Nouveau jeu de réglages").fill(saveName);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText(saveName).first().waitFor({ timeout: 4000 });
  result.steps.namedSave = true;

  await go("/parametres/interface");
  await page.locator("#color-background").fill("#efe8d8");
  await page.waitForTimeout(200);

  await go("/sauvegardes");
  await page.waitForTimeout(200);
  await page
    .locator("li")
    .filter({ hasText: saveName })
    .getByRole("button", { name: "Restaurer" })
    .click();
  await page.waitForTimeout(400);
  const restoredBg = await bg();
  if (restoredBg !== rgbOf("#141611")) throw new Error(`restore theme ${restoredBg}`);
  result.steps.restoreTheme = restoredBg;

  await go("/");
  await page.waitForFunction(
    (t) => (document.body.innerText || "").includes(t),
    roomTitle,
    { timeout: 8000 },
  );
  result.steps.restoreRoom = true;

  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Tracer une zone" }).click();
  await page.waitForTimeout(120);
  const map2 = page.getByRole("img", { name: /Plan/ });
  const zbox = await map2.boundingBox();
  if (!zbox) throw new Error("map missing for zone");
  const loop = [
    [zbox.x + 48, zbox.y + 28],
    [zbox.x + 230, zbox.y + 28],
    [zbox.x + 230, zbox.y + 160],
    [zbox.x + 48, zbox.y + 160],
    [zbox.x + 48, zbox.y + 28],
  ];
  await page.mouse.move(loop[0][0], loop[0][1]);
  await page.mouse.down();
  for (const [x, y] of loop.slice(1)) {
    await page.mouse.move(x, y, { steps: 10 });
  }
  await page.mouse.up();
  await page.getByRole("button", { name: /Supprimer l.élément/ }).waitFor({ timeout: 4000 });
  result.steps.zoneCommit = true;
  await page.getByRole("button", { name: /Supprimer l.élément/ }).click();
  await page.waitForTimeout(80);

  await page.reload({ waitUntil: "load" });
  await waitHydrated();
  await page.waitForTimeout(400);
  const afterBg = await bg();
  if (afterBg !== rgbOf("#141611")) throw new Error(`theme lost ${afterBg}`);
  const body2 = await page.locator("body").innerText();
  if (!body2.includes(roomTitle)) throw new Error("room name lost after reload");
  result.steps.afterReload = true;

  await go("/sauvegardes");
  await page.waitForTimeout(300);
  const savesBody = await page.locator("body").innerText();
  if (!savesBody.includes(saveName)) throw new Error("named save lost after reload");
  result.steps.saveSurvived = true;

  result.ok = true;

  await go("/");
  const edit = page.getByRole("button", { name: "Modifier" });
  if (await edit.count()) {
    await edit.click();
    const resetRoom = page.getByRole("button", { name: /Vider les textes/ });
    if ((await resetRoom.count()) && (await resetRoom.isEnabled())) {
      await resetRoom.click();
    }
  }
  await go("/parametres/proprietes");
  const resetSchema = page.getByRole("button", { name: /Tout retirer/ });
  if ((await resetSchema.count()) && (await resetSchema.isEnabled())) {
    await resetSchema.click();
  }
  await go("/parametres/compte");
  await page.getByRole("button", { name: "Nouveau plan vide" }).click();
  await page.waitForTimeout(80);
  await go("/parametres/interface");
  await page.locator("#color-background").fill("#efe8d8");
  const cleanup = page.getByRole("button", { name: "Sauvegarder les préférences" });
  if (await cleanup.isEnabled()) {
    await clickSavePrefs();
  }
} catch (e) {
  result.error = String(e?.message || e);
}

await page.screenshot({ path: "/workspace/screenshots/sauvegardes.png" });
await browser.close();
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
