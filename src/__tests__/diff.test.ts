import child_process from "node:child_process";
import util from "node:util";
import { describe, expect, it } from "vitest";

describe("is-same-type (zod4 vs zod3) diff", () => {
  it("should match baseline", async () => {
    const exec = util.promisify(child_process.exec);
    const result = await exec(
      "diff src/zod4/__tests__/is-same-type.test.ts src/zod3/__tests__/is-same-type.test.ts || true",
    );
    await expect(result.stdout).toMatchFileSnapshot(
      "__snapshots__/is-same-type.diff",
    );
  });
});

describe("is-compatible-type (zod4 vs zod3) diff", () => {
  it("should match baseline", async () => {
    const exec = util.promisify(child_process.exec);
    const result = await exec(
      "diff src/zod4/__tests__/is-compatible-type.test.ts src/zod3/__tests__/is-compatible-type.test.ts || true",
    );
    await expect(result.stdout).toMatchFileSnapshot(
      "__snapshots__/is-compatible-type.diff",
    );
  });
});
