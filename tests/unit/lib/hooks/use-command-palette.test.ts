import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import {
  useCommandPaletteProvider,
  useCommandPalette,
  CommandPaletteContext,
} from "@/lib/hooks/use-command-palette";

function createWrapper(value: ReturnType<typeof useCommandPaletteProvider>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(CommandPaletteContext.Provider, { value }, children);
  };
}

describe("useCommandPaletteProvider", () => {
  beforeEach(() => {
    // Mock window event listeners
    vi.spyOn(window, "addEventListener");
    vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with closed state", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    expect(result.current.isOpen).toBe(false);
  });

  it("opens the palette", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    act(() => {
      result.current.open();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it("closes the palette", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("toggles the palette state", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("registers keyboard listener on mount", () => {
    renderHook(() => useCommandPaletteProvider());

    expect(window.addEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("removes keyboard listener on unmount", () => {
    const { unmount } = renderHook(() => useCommandPaletteProvider());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });

  it("toggles on Cmd+K keypress", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    // Get the keyboard event handler
    const addEventListenerCalls = vi.mocked(window.addEventListener).mock.calls;
    const keydownHandler = addEventListenerCalls.find(
      (call) => call[0] === "keydown"
    )?.[1] as EventListener;

    expect(keydownHandler).toBeDefined();

    // Simulate Cmd+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      keydownHandler(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("toggles on Ctrl+K keypress", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    const addEventListenerCalls = vi.mocked(window.addEventListener).mock.calls;
    const keydownHandler = addEventListenerCalls.find(
      (call) => call[0] === "keydown"
    )?.[1] as EventListener;

    // Simulate Ctrl+K
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      keydownHandler(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it("does not toggle on other key presses", () => {
    const { result } = renderHook(() => useCommandPaletteProvider());

    const addEventListenerCalls = vi.mocked(window.addEventListener).mock.calls;
    const keydownHandler = addEventListenerCalls.find(
      (call) => call[0] === "keydown"
    )?.[1] as EventListener;

    // Simulate a different key
    const event = new KeyboardEvent("keydown", {
      key: "a",
      metaKey: true,
    });

    act(() => {
      keydownHandler(event);
    });

    expect(result.current.isOpen).toBe(false);
  });
});

describe("useCommandPalette", () => {
  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useCommandPalette());
    }).toThrow("useCommandPalette must be used within CommandPaletteProvider");
  });

  it("returns context value when used within provider", () => {
    const providerValue = {
      isOpen: true,
      open: vi.fn(),
      close: vi.fn(),
      toggle: vi.fn(),
    };

    const { result } = renderHook(() => useCommandPalette(), {
      wrapper: createWrapper(providerValue),
    });

    expect(result.current).toBe(providerValue);
    expect(result.current.isOpen).toBe(true);
  });
});
