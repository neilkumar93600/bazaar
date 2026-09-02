# Universal Modern React Custom Hooks Architecture & Specification

This document specifies the custom React hook architecture for **Bazaar**, engineered for maximum performance, zero runtime dependencies, React 19 / Next.js 16 App Router compatibility, and rock-solid **universal cross-browser support** across **Chrome, Firefox, Edge, Safari, Brave, and mobile WebViews (iOS & Android)**.

---

## 1. Executive Summary & Core Philosophy

* **Universal First**: Every hook follows standard W3C specifications and works natively across all modern desktop and mobile browsers.
* **Defensive Fallbacks**: Where browsers diverge (such as Safari Private Mode storage restrictions, dynamic address bar resize on iOS Safari/Android Chrome, or legacy event listener APIs), hooks include seamless, invisible fallbacks without requiring browser-specific code in components.
* **React 19 & Next.js 16 SSR Safe**: Zero hydration warnings, zero undefined `window` crashes during server rendering.
* **Zero Dependency & High Performance**: Lightweight (<3KB total bundle footprint), tree-shakable, and optimized with `requestAnimationFrame` and passive listeners to guarantee consistent 60fps/120fps UI performance.

---

## 2. Decision Log

| Decision | Alternatives Considered | Rationale |
| :--- | :--- | :--- |
| **Universal W3C Standard Implementation** | Browser-specific forks or fragmented utility functions | One clean API for each hook that works identically in Chrome, Firefox, Safari, Edge, Android, and iOS. |
| **Modular Zero-Dependency Suite** | Global Performance Context, Heavy third-party packages | Maximum tree-shaking efficiency, zero external supply chain risk, and minimal runtime footprint. |
| **Passive & RAF Event Throttling** | Unthrottled listeners, arbitrary `setTimeout` delays | Syncs scroll/resize events directly with hardware display refresh rates (60Hz / 120Hz/144Hz) across all devices. |
| **In-Memory Storage Fallback** | Hard exceptions / unhandled errors | Prevents crashes in Private Browsing / Incognito modes (Safari, Firefox, Chrome) or when cookies/storage are blocked. |
| **Isomorphic SSR Safety** | Direct window access | Eliminates React 19 hydration mismatch warnings and enables flawless static/server rendering. |

---

## 3. Supported Browser Matrix

| Browser | Minimum Version | Tested & Optimized Features |
| :--- | :--- | :--- |
| **Google Chrome / Chromium / Edge / Brave** | 90+ | Passive listeners, ResizeObserver, VisualViewport, IntersectionObserver, standard requestIdleCallback |
| **Mozilla Firefox** | 90+ | Standard storage, media queries, VisualViewport, smooth scroll throttling |
| **Apple Safari (macOS & iOS)** | 14+ | Dynamic toolbar resize (`visualViewport`), Private Browsing storage fallback, legacy `addListener` fallback |
| **Android WebKit / Chrome Mobile** | 90+ | Virtual keyboard awareness, dynamic address bar scroll, touch passive events |

---

## 4. Hook Catalog & Specifications

```text
hooks/
├── use-debounce.ts           # Input debouncing & high-frequency callback throttling
├── use-in-view.ts            # Universal IntersectionObserver for lazy UI rendering
├── use-mounted.ts            # SSR hydration barrier hook
├── use-image-preload.ts      # Image preloader to eliminate layout shift & flickers
├── use-reduced-motion.ts     # Cross-browser OS motion & battery-saver detector
├── use-responsive.ts         # Type-safe breakpoint tracker matching Tailwind v4 tokens
├── use-viewport.ts           # Universal dynamic viewport & visual keyboard tracker
├── use-on-click-outside.ts   # Outside click & touch listener with mobile gesture safety
├── use-safe-storage.ts       # Incognito/Private Mode resilient localStorage hook
├── use-user.ts               # Universal client Supabase auth state subscriber
├── use-online-status.ts      # Universal network connectivity monitor
├── use-mobile.ts             # (Existing mobile breakpoint hook)
└── index.ts                  # Barrel export file
```

---

### Group A: UI Rendering & Animation Performance

#### 1. `useInView`
* **Purpose**: Lazy-renders heavy design cards, 3D elements, and offscreen lists when they approach the viewport.
* **Implementation**: Uses standard `IntersectionObserver` with custom `rootMargin` thresholds and a `triggerOnce` option.
* **Cross-Browser Handling**: Handles zero-height bounding boxes and unobserves cleanly on unmount.

#### 2. `useMounted`
* **Purpose**: Prevents SSR hydration mismatch by ensuring client-only UI elements render only after mounting.
* **Implementation**: Uses standard React 19 state synchronization.

#### 3. `useImagePreload`
* **Purpose**: Preloads hero graphics, mockups, or next-slide images in the background to prevent blank flash during transitions.
* **Implementation**: Uses browser `Image()` constructor with Promise caching.

#### 4. `useReducedMotion`
* **Purpose**: Detects if the user enabled "Reduce Motion" in Windows, macOS, iOS, or Android settings.
* **Cross-Browser Handling**: Supports modern `addEventListener('change')` with fallback to `addListener()` for older WebKit engines.

---

### Group B: Universal Responsiveness & Layout

#### 5. `useResponsive` & `useMediaQuery`
* **Purpose**: Responsive breakpoint detector strictly matching Tailwind CSS v4 tokens (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`).
* **Implementation**: Uses `window.matchMedia` with passive event listeners for instantaneous, zero-jank layout adjustments.

#### 6. `useViewport`
* **Purpose**: Universal viewport measurement that handles mobile dynamic address bars and on-screen virtual keyboards across **both iOS Safari and Android Chrome**.
* **Implementation**: Reads `window.visualViewport` where supported, falling back to `window.innerWidth`/`window.innerHeight`, updating a `--app-height` CSS custom property smoothly.

#### 7. `useOnClickOutside`
* **Purpose**: Closes dropdowns, modal dialogs, and popovers on outside click or tap.
* **Cross-Browser Handling**: Binds to `pointerdown` / `touchstart` with passive listeners, preventing touch-delay and ghost clicks on mobile devices.

---

### Group C: Performance Primitives & Data/User Fetching

#### 8. `useDebounce` & `useThrottle`
* **Purpose**: Debounces search inputs and throttles rapid mouse/scroll events via `requestAnimationFrame`.
* **Implementation**: Guarantees frame-rate synchronization (60Hz/120Hz/144Hz) across all platforms.

#### 9. `useSafeStorage`
* **Purpose**: Type-safe local storage reader/writer with automatic JSON parsing and cross-tab synchronization.
* **Cross-Browser Handling**: Transparently falls back to an in-memory storage store when browser blocks storage or runs in Private / Incognito mode (`QuotaExceededError`, `SecurityError`).

#### 10. `useUser`
* **Purpose**: Real-time client-side auth state hook subscribing to Supabase auth events with in-memory session deduplication.
* **Implementation**: Works across all client components with zero redundant network queries.

#### 11. `useOnlineStatus`
* **Purpose**: Monitors online/offline network transitions via `navigator.onLine` and `window` event listeners.

---

## 5. Verification & Testing Plan

1. **Automated Unit Tests**:
   * Test debounce timings, throttle rate limiting, storage in-memory fallback, and breakpoint listeners.
2. **Next.js Production Build**:
   * Run `npm run build` and `npm run typecheck` to confirm zero SSR hydration issues or type errors.
3. **Cross-Browser Validation**:
   * Chrome / Edge (Desktop & Mobile emulation)
   * Safari (macOS & iOS WebKit)
   * Firefox (Desktop)
