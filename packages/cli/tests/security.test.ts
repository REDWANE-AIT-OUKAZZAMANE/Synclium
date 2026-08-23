import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);
const CLI_BIN = resolve(__dirname, "../dist/bin.js");
const SAMPLE_PDF = resolve(__dirname, "../../../examples/sample-invoice.pdf");

describe("CLI Security Hardening Tests (OIB Remediation)", () => {
  it("OIB-003: Rejects missing or invalid input file gracefully without crash", async () => {
    try {
      await execFileAsync("node", [CLI_BIN, "convert", "non_existent_file_xyz.xml", "--to", "canonical"]);
      expect.unreachable("Should have failed on non-existent input");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toMatch(/File does not exist|Cannot read input/i);
    }
  });

  it("OIB-002: Rejects invalid target format", async () => {
    try {
      await execFileAsync("node", [CLI_BIN, "convert", SAMPLE_PDF, "--to", "malicious_format"]);
      expect.unreachable("Should have failed on invalid format");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toMatch(/Unknown --to format/i);
    }
  });
});
