"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentItem {
  type: "matter" | "client" | "document";
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

const STORAGE_KEY = "legal-copilot-recent-items";
const MAX_ITEMS = 10;

function loadRecentItems(): RecentItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load recent items:", error);
    return [];
  }
}

function saveRecentItems(items: RecentItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save recent items:", error);
  }
}

export function useRecentItems() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(loadRecentItems());
  }, []);

  const addRecentItem = useCallback((item: RecentItem) => {
    setItems((prevItems) => {
      // Remove duplicate if exists
      const filtered = prevItems.filter((i) => !(i.type === item.type && i.id === item.id));

      // Add to front and limit to MAX_ITEMS
      const newItems = [item, ...filtered].slice(0, MAX_ITEMS);

      // Save to localStorage
      saveRecentItems(newItems);

      return newItems;
    });
  }, []);

  const clearRecentItems = useCallback(() => {
    setItems([]);
    saveRecentItems([]);
  }, []);

  return {
    items,
    addRecentItem,
    clearRecentItems,
  };
}
