import { describe, test, expect } from "bun:test";
import { OID, ComputeScatteringInput } from "../src/mcp/schemas";
import { selectRecipe } from "../src/recipes/index";

const VALID_OID = "a1b2c3d4e5f6789012345678abcd";

describe("OID", () => {
  test("accepts valid 28-hex oid", () => {
    expect(OID.safeParse(VALID_OID).success).toBe(true);
  });

  test("rejects 40-hex (SHA1-era relic)", () => {
    expect(OID.safeParse("a1b2c3d4e5f6789012345678abcdef1234567890").success).toBe(false);
  });

  test("rejects 27-char oid (too short)", () => {
    expect(OID.safeParse("a1b2c3d4e5f6789012345678abc").success).toBe(false);
  });

  test("rejects uppercase hex chars", () => {
    expect(OID.safeParse("A1B2C3D4E5F6789012345678ABCD").success).toBe(false);
  });

  test("rejects non-hex char (g)", () => {
    expect(OID.safeParse("g1b2c3d4e5f6789012345678abcd").success).toBe(false);
  });

  test("rejects empty string", () => {
    expect(OID.safeParse("").success).toBe(false);
  });
});

describe("ComputeScatteringInput", () => {
  test("accepts valid input with required fields", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 1024,
      cfg: { J: 4, Q: 8 },
    });
    expect(result.success).toBe(true);
  });

  test("applies cfg defaults (L=1, order=2, dim=1, group=trivial)", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 512,
      cfg: { J: 3, Q: 4 },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cfg.L).toBe(1);
      expect(result.data.cfg.order).toBe(2);
      expect(result.data.cfg.dim).toBe("1");
      expect(result.data.cfg.group).toBe("trivial");
    }
  });

  test("accepts dim=2, group=so2 runtime config", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 4096,
      cfg: { J: 4, Q: 8, dim: "2", group: "so2", L: 8 },
    });
    expect(result.success).toBe(true);
  });

  test("accepts dim=3, group=so3 runtime config", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 8192,
      cfg: { J: 3, Q: 4, dim: "3", group: "so3" },
    });
    expect(result.success).toBe(true);
  });

  test("rejects raw float array as input_oid", () => {
    expect(
      ComputeScatteringInput.safeParse({
        input_oid: [0.1, 0.2, 0.3],
        signal_len: 512,
        cfg: { J: 4, Q: 8 },
      }).success,
    ).toBe(false);
  });

  test("rejects J out of range (0 and 15)", () => {
    expect(
      ComputeScatteringInput.safeParse({ input_oid: VALID_OID, signal_len: 512, cfg: { J: 0, Q: 8 } }).success,
    ).toBe(false);
    expect(
      ComputeScatteringInput.safeParse({ input_oid: VALID_OID, signal_len: 512, cfg: { J: 15, Q: 8 } }).success,
    ).toBe(false);
  });

  test("rejects invalid oid (too short)", () => {
    expect(
      ComputeScatteringInput.safeParse({ input_oid: "tooshort", signal_len: 512, cfg: { J: 4, Q: 8 } }).success,
    ).toBe(false);
  });

  test("dim_shape accepts integer arrays (shape metadata, not tensor data)", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 64 * 64,
      cfg: { J: 4, Q: 8, dim: "2", group: "so2", dim_shape: [64, 64] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cfg.dim_shape).toEqual([64, 64]);
    }
  });

  test("extra cfg fields (e.g. raw tensor) are stripped by Zod, not passed through", () => {
    const result = ComputeScatteringInput.safeParse({
      input_oid: VALID_OID,
      signal_len: 512,
      cfg: { J: 4, Q: 8, raw_signal: [0.1, 0.2, 0.3, 0.4] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data.cfg as Record<string, unknown>)["raw_signal"]).toBeUndefined();
    }
  });
});

describe("selectRecipe", () => {
  test('"tag this jet, decorrelate mass" → hep-tagging-disco', () => {
    expect(selectRecipe("tag this jet, decorrelate mass").id).toBe("hep-tagging-disco");
  });

  test('"find anomalies / new physics" → bsm-anomaly', () => {
    expect(selectRecipe("find anomalies / new physics").id).toBe("bsm-anomaly");
  });

  test('"extract features from this plasma volume" → general-feature', () => {
    expect(selectRecipe("extract features from this plasma volume").id).toBe("general-feature");
  });

  test("unknown request defaults to general-feature", () => {
    expect(selectRecipe("something completely unrelated").id).toBe("general-feature");
  });

  test("hep-tagging recipe has compute_scattering from ingestMeta", () => {
    const r = selectRecipe("tag jets sculpt background");
    const step = r.steps.find((s) => s.tool === "compute_scattering");
    expect(step?.cfgFrom).toBe("ingestMeta");
  });

  test("bsm-anomaly recipe includes detect_anomaly step", () => {
    const r = selectRecipe("detect bsm outlier");
    expect(r.steps.some((s) => s.tool === "detect_anomaly")).toBe(true);
  });

  test("general-feature recipe has compute_scattering from request", () => {
    const r = selectRecipe("scatter plasma data");
    const step = r.steps.find((s) => s.tool === "compute_scattering");
    expect(step?.cfgFrom).toBe("request");
  });
});
