/* 端末内保存・書き出し・読み込みの厳格な検証。外部送信なし。 */
(function(root, factory) {
  const first = typeof module !== "undefined" && module.exports ? require("./story.js") : root.HandoverStory;
  const morning = typeof module !== "undefined" && module.exports ? require("./morning.js") : root.HandoverMorning;
  const api = factory(first, morning);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.HandoverSave = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function(first, morning) {
  "use strict";

  const FORMAT = "handover-room-offline-backup";
  const VERSION = 2;
  const MAX_BYTES = 65536;
  const KEY = "handover-room-prototype-v2";
  const LEGACY_KEY = "handover-room-prototype-v1";

  function ownKeys(obj, keys) {
    return obj && typeof obj === "object" && !Array.isArray(obj) &&
      Object.keys(obj).length === keys.length && keys.every(k => Object.hasOwn(obj, k));
  }

  function validFirst(s) {
    if (!first.isValid(s)) return false;
    try {
      let expected = first.fresh();
      for (const h of s.history) {
        if (!ownKeys(h, ["scene", "choice"]) || h.scene !== expected.scene) return false;
        expected = first.advance(expected, h.choice);
      }
      return JSON.stringify(expected) === JSON.stringify(s);
    } catch (_err) { return false; }
  }

  function validState(value) {
    if (!ownKeys(value, ["night1", "morning"])) return false;
    if (!validFirst(value.night1)) return false;
    if (value.morning === null) return true;
    return value.night1.scene === "ending" && morning.isValid(value.morning, value.night1);
  }

  function blank() { return { night1: first.fresh(), morning: null }; }

  function parse(text) {
    if (typeof text !== "string" || !text.trim() ||
        new TextEncoder().encode(text).length > MAX_BYTES) throw new Error("保存データが空か、大きすぎます（最大64KiB）");
    let value;
    try { value = JSON.parse(text); } catch (_err) { throw new Error("JSON形式ではありません"); }
    if (!ownKeys(value, ["format", "version", "data"]) || value.format !== FORMAT || value.version !== VERSION)
      throw new Error("このゲームのv2保存データではありません");
    if (!validState(value.data)) throw new Error("進行履歴が一致しないため復元できません");
    return value.data;
  }

  function serialize(value) {
    if (!validState(value)) throw new Error("保存対象に不整合があります");
    const text = JSON.stringify({format: FORMAT, version: VERSION, data: value}, null, 2);
    if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error("保存データが最大64KiBを超えました");
    return text;
  }

  function fromLegacy(text) {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > MAX_BYTES) return null;
    try {
      const firstState = JSON.parse(text);
      if (!validFirst(firstState)) return null;
      return { night1: firstState, morning: null };
    } catch (_err) { return null; }
  }

  return Object.freeze({ FORMAT, VERSION, KEY, LEGACY_KEY, MAX_BYTES, blank, validFirst, validState, parse, serialize, fromLegacy });
});
