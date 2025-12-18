import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast, toast } from "@/lib/hooks/use-toast";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns empty toasts array initially", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a toast", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Test toast" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test toast");
  });

  it("adds a toast with description", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({
        title: "Test toast",
        description: "This is a description",
      });
    });

    expect(result.current.toasts[0].description).toBe("This is a description");
  });

  it("adds a toast with variant", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({
        title: "Error toast",
        variant: "destructive",
      });
    });

    expect(result.current.toasts[0].variant).toBe("destructive");
  });

  it("dismisses a specific toast", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = toast({ title: "Test toast" });
      toastId = t.id;
    });

    act(() => {
      result.current.dismiss(toastId!);
    });

    // Toast should be marked as closed
    expect(result.current.toasts[0].open).toBe(false);
  });

  it("dismisses all toasts", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Toast 1" });
    });

    act(() => {
      result.current.dismiss();
    });

    // All toasts should be marked as closed
    result.current.toasts.forEach((t) => {
      expect(t.open).toBe(false);
    });
  });

  it("updates a toast", () => {
    const { result } = renderHook(() => useToast());

    let toastInstance: ReturnType<typeof toast>;
    act(() => {
      toastInstance = toast({ title: "Original title" });
    });

    act(() => {
      toastInstance!.update({ id: toastInstance!.id, title: "Updated title" });
    });

    expect(result.current.toasts[0].title).toBe("Updated title");
  });

  it("limits toasts to maximum count", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: "Toast 1" });
    });

    act(() => {
      toast({ title: "Toast 2" });
    });

    // TOAST_LIMIT is 1 by default
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Toast 2");
  });

  it("returns toast function from hook", () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe("function");
  });

  it("returns dismiss function from hook", () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.dismiss).toBe("function");
  });
});
