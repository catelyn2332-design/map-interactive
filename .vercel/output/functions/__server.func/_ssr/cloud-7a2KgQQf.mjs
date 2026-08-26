import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as getSql, t as authMiddleware } from "./middleware-LXT0xpiK.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cloud-7a2KgQQf.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function isRecord(raw) {
	return Boolean(raw) && typeof raw === "object" && !Array.isArray(raw);
}
var loadCloudPrefs_createServerFn_handler = createServerRpc({
	id: "994483c8865cf3a0a1b79004353266d3d35d745ea47c8fbdc954e07c5ab869d8",
	name: "loadCloudPrefs",
	filename: "src/lib/map/cloud.ts"
}, (opts) => loadCloudPrefs.__executeServer(opts));
var loadCloudPrefs = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(loadCloudPrefs_createServerFn_handler, async ({ context }) => {
	const row = (await (await getSql())`
      select payload, saved_at::text as saved_at
      from atlas_cloud
      where user_id = ${context.userId}
      limit 1
    `)[0];
	if (!row) return null;
	const savedAt = Date.parse(row.saved_at);
	return {
		savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
		payloadJson: row.payload
	};
});
var saveCloudPrefs_createServerFn_handler = createServerRpc({
	id: "81971174ac0cf4fd91b14e4497b90ab537607fa2bb83cc8f373dc660e14c6d0d",
	name: "saveCloudPrefs",
	filename: "src/lib/map/cloud.ts"
}, (opts) => saveCloudPrefs.__executeServer(opts));
var saveCloudPrefs = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => {
	if (!isRecord(data) || typeof data.savedAt !== "number" || typeof data.payloadJson !== "string") throw new Error("invalid cloud prefs");
	return {
		savedAt: data.savedAt,
		payloadJson: data.payloadJson
	};
}).handler(saveCloudPrefs_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const iso = new Date(data.savedAt).toISOString();
	await sql`
      insert into atlas_cloud (user_id, payload, saved_at)
      values (${context.userId}, ${data.payloadJson}, ${iso}::timestamptz)
      on conflict (user_id) do update
        set payload = excluded.payload,
            saved_at = excluded.saved_at
    `;
	return { ok: true };
});
var clearCloudPrefs_createServerFn_handler = createServerRpc({
	id: "308f6180ab4873bf6213a8d79116a4b6f20a9b9a053cecb2c5662179703595f3",
	name: "clearCloudPrefs",
	filename: "src/lib/map/cloud.ts"
}, (opts) => clearCloudPrefs.__executeServer(opts));
var clearCloudPrefs = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(clearCloudPrefs_createServerFn_handler, async ({ context }) => {
	await (await getSql())`delete from atlas_cloud where user_id = ${context.userId}`;
	return { ok: true };
});
//#endregion
export { clearCloudPrefs_createServerFn_handler, loadCloudPrefs_createServerFn_handler, saveCloudPrefs_createServerFn_handler };
