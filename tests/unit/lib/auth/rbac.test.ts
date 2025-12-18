import { describe, it, expect } from "vitest";
import { hasPermission } from "@/lib/auth/rbac";

describe("hasPermission", () => {
  describe("exact match", () => {
    it("should return true for exact permission match", () => {
      expect(hasPermission(["approvals:view"], "approvals:view")).toBe(true);
    });

    it("should return false when permission not in list", () => {
      expect(hasPermission(["approvals:view"], "approvals:decide")).toBe(false);
    });

    it("should return false for empty permissions", () => {
      expect(hasPermission([], "approvals:view")).toBe(false);
    });
  });

  describe("global wildcard (*)", () => {
    it("should return true for * wildcard with any permission", () => {
      expect(hasPermission(["*"], "approvals:view")).toBe(true);
      expect(hasPermission(["*"], "cases:write")).toBe(true);
      expect(hasPermission(["*"], "firm:settings")).toBe(true);
    });

    it("should return true when * is among other permissions", () => {
      expect(hasPermission(["approvals:view", "*"], "cases:delete")).toBe(true);
    });
  });

  describe("resource wildcard (resource:*)", () => {
    it("should return true for resource:* matching resource:action", () => {
      expect(hasPermission(["approvals:*"], "approvals:view")).toBe(true);
      expect(hasPermission(["approvals:*"], "approvals:decide")).toBe(true);
    });

    it("should return false for resource:* not matching different resource", () => {
      expect(hasPermission(["approvals:*"], "cases:read")).toBe(false);
    });

    it("should handle multiple resource wildcards", () => {
      expect(hasPermission(["approvals:*", "cases:*"], "approvals:view")).toBe(true);
      expect(hasPermission(["approvals:*", "cases:*"], "cases:write")).toBe(true);
      expect(hasPermission(["approvals:*", "cases:*"], "clients:read")).toBe(false);
    });
  });
});
