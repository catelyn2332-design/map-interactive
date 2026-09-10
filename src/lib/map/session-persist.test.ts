import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { captureAuthToken } from "./session-persist.ts";

describe("captureAuthToken", () => {
  it("reads a top-level token", () => {
    assert.equal(
      captureAuthToken({ token: "session-token-value" }),
      "session-token-value",
    );
  });

  it("reads a nested session token", () => {
    assert.equal(
      captureAuthToken({ session: { token: "nested-session-token" } }),
      "nested-session-token",
    );
  });

  it("ignores junk", () => {
    assert.equal(captureAuthToken(null), null);
    assert.equal(captureAuthToken({ token: "short" }), null);
    assert.equal(captureAuthToken({ user: { id: "x" } }), null);
  });
});
