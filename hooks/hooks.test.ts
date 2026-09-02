/** Run: `npx tsx hooks/hooks.test.ts`
 *
 * Assert-based test suite for custom hooks logic, defensive storage,
 * and responsive constants.
 */

import assert from "node:assert/strict";
import {
  readStorageItem,
  writeStorageItem,
  removeStorageItem,
} from "./use-safe-storage.ts";
import { BREAKPOINTS } from "./use-responsive.ts";
import * as hooks from "./index.ts";

// --- 1. Barrel Export Integrity ---
assert.ok(typeof hooks.useDebounce === "function", "useDebounce exported");
assert.ok(typeof hooks.useDebouncedCallback === "function", "useDebouncedCallback exported");
assert.ok(typeof hooks.useThrottle === "function", "useThrottle exported");
assert.ok(typeof hooks.useInView === "function", "useInView exported");
assert.ok(typeof hooks.useMounted === "function", "useMounted exported");
assert.ok(typeof hooks.useImagePreload === "function", "useImagePreload exported");
assert.ok(typeof hooks.useReducedMotion === "function", "useReducedMotion exported");
assert.ok(typeof hooks.useResponsive === "function", "useResponsive exported");
assert.ok(typeof hooks.useMediaQuery === "function", "useMediaQuery exported");
assert.ok(typeof hooks.useViewport === "function", "useViewport exported");
assert.ok(typeof hooks.useOnClickOutside === "function", "useOnClickOutside exported");
assert.ok(typeof hooks.useSafeStorage === "function", "useSafeStorage exported");
assert.ok(typeof hooks.useUser === "function", "useUser exported");
assert.ok(typeof hooks.useOnlineStatus === "function", "useOnlineStatus exported");
assert.ok(typeof hooks.useIsMobile === "function", "useIsMobile exported");

// --- 2. Breakpoint Token Consistency with Tailwind v4 ---
assert.equal(BREAKPOINTS.sm, 640);
assert.equal(BREAKPOINTS.md, 768);
assert.equal(BREAKPOINTS.lg, 1024);
assert.equal(BREAKPOINTS.xl, 1280);
assert.equal(BREAKPOINTS["2xl"], 1536);

// --- 3. SafeStorage In-Memory Resilient Fallback ---
const testKey = "bazaar_pref_test_key";
const testValue = { theme: "dark", volume: 85 };

// Reading unset key returns initial value
const initial = readStorageItem(testKey, { fallback: true });
assert.deepEqual(initial, { fallback: true });

// Writing and reading back from in-memory fallback
writeStorageItem(testKey, testValue);
const stored = readStorageItem(testKey, { fallback: true });
assert.deepEqual(stored, testValue);

// Overwriting value
const updatedValue = { theme: "light", volume: 100 };
writeStorageItem(testKey, updatedValue);
assert.deepEqual(readStorageItem(testKey, null), updatedValue);

// Removing item restores fallback on next read
removeStorageItem(testKey);
assert.deepEqual(readStorageItem(testKey, "default"), "default");

// Handling invalid JSON safely without throwing
writeStorageItem("corrupted_key", "raw_string");
const stringVal = readStorageItem("corrupted_key", "fallback");
assert.equal(stringVal, "raw_string");

console.log("hooks.test.ts: all assertions passed");
