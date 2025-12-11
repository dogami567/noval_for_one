# Architecture Instruction 001: Initial Setup & Map Refactor

**Author**: Gemini Architect
**Date**: 2025-12-11
**Target**: Execution Agent / User

## 🎯 Objective
Initialize the project infrastructure for Vercel deployment and refactor the main map component to support "Immersive Gate" (Zoom/Pan) functionality, while preserving the existing scroll layout.

## 🛠️ Technical Plan

### Phase 1: Vercel Infrastructure
1.  **Create `vercel.json`**:
    - Configure rewrites for SPA (`/` -> `index.html`).
    - Configure rewrites for API (`/api/*` -> `/api/*`).
2.  **Create API Directory**:
    - Create `/api/hello.ts` as a smoke test.
    - Content: Simple JSON response `{ message: "Hello from Vercel" }`.
3.  **Environment Setup**:
    - Create `.env.local` template (do not commit actual keys).
    - Keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`.

### Phase 2: Enhanced Map Component
1.  **Dependencies**:
    - Install `react-zoom-pan-pinch` (Core map tech).
    - Install `clsx` and `tailwind-merge` (Standard utils if not present).
2.  **Create `components/InteractiveMap.tsx`**:
    - **Wrappers**: Use `TransformWrapper` and `TransformComponent`.
    - **Config**: Limit zoom scale (0.5x to 4x). Disable panning out of bounds if possible (or set generous bounds).
    - **Content**:
        - Move the `<img />` and SVG overlays from `MapBackground.tsx` into this new component.
        - Ensure `MapMarker` elements are INSIDE the `TransformComponent` so they move with the map.
3.  **Refactor `App.tsx`**:
    - **Remove**: Old `MapBackground` (or deprecate it).
    - **Layout**:
        - The Top Section (Hero) must be `h-screen` and contain the `InteractiveMap`.
        - The `InteractiveMap` must handle mouse/touch events *preventing* page scroll only when interacting (check library options for `wheel` behavior, maybe require `Ctrl+Scroll` to zoom to avoid scroll hijacking, or keep it simple for now).
    - **Interaction**:
        - Clicking a Marker should ideally *not* jump the page immediately, but open a tooltip.
        - Tooltip "View Details" button triggers `window.scrollTo` to the Character Section.

## 📝 Code Standards
- **Typing**: Use `interface` for all Props.
- **Styling**: Tailwind CSS only. No extra CSS files.
- **Icons**: Lucide React.

## ⚠️ Critical Checks
- Does `npm run dev` still work?
- Does the map zoom smoothly?
- Does clicking a marker still work?
- Does the "Scroll Down" arrow still appear above the map?

---
*Please execute these steps and report back.*
