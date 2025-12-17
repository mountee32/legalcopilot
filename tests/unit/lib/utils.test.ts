import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    const result = cn("base-class", false && "hidden", "visible");
    expect(result).toBe("base-class visible");
  });

  it("should merge Tailwind classes correctly", () => {
    // Should keep the last conflicting class
    const result = cn("px-2", "px-4");
    expect(result).toBe("px-4");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle null and undefined", () => {
    const result = cn("base", null, undefined, "end");
    expect(result).toBe("base end");
  });

  it("should handle array inputs", () => {
    const result = cn(["class1", "class2"], "class3");
    expect(result).toBe("class1 class2 class3");
  });

  it("should handle object inputs with conditional values", () => {
    const result = cn({
      active: true,
      disabled: false,
      highlighted: true,
    });
    expect(result).toContain("active");
    expect(result).toContain("highlighted");
    expect(result).not.toContain("disabled");
  });

  it("should combine multiple input types", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active", ["array-class1", "array-class2"], {
      "object-class": true,
    });
    expect(result).toContain("base-class");
    expect(result).toContain("active");
    expect(result).toContain("array-class1");
    expect(result).toContain("object-class");
  });
});
