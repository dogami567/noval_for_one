# Frontend Architecture Spec: High-Fidelity Map Experience (Final)

**ID**: 002-visual-enhancement  
**Status**: FINAL  
**Date**: 2025-12-12  
**Owner**: Frontend / Immersion Architect  
**Target**: Execution Agent

本任务 spec 继承并遵循全局基线：`spec/000-system-architecture-final.md`。  
本文件为 002 的**唯一执行规格**。

---

**Theme**: **Arcane Fantasy / Aetherpunk** (Hybrid of Magic, Nature, and Tech)

## ✅ Visual Language & Design Goals
The world is diverse: it has ancient forests (Elves), majestic capitals (Queens), and steampunk cities (Tech). The UI should reflect this "Hybrid" nature, not just pure industrial Hextech.

1.  **The "Vignette" Effect**: The edges of the screen should fade into deep shadow (`slate-950`), creating a focus on the center.
2.  **Arcane Glass**: UI controls look like crystallized mana or polished obsidian.
    - `bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full`
3.  **Diverse Markers**: Locations must visually represent their faction/type.

## 🛠️ Implementation Specs

### 1. `components/InteractiveMap.tsx` (The Canvas)
*   **Wrapper**: Use `react-zoom-pan-pinch`.
*   **Background Layer**:
    *   **Fallback**: `bg-slate-950`.
    *   **Image**: Use a map that looks like "Satellite view mixed with Magic".
    *   **Overlay**: Add a "Mana Atmosphere" layer.
        ```tsx
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-60 pointer-events-none" />
        ```

### 2. `components/MapMarker.tsx` (The Soul)
*   **Dynamic Styling**: The color/glow must depend on the `type` prop.
    *   `mystic` (Magic): **Cyan/Purple** Glow.
    *   `nature` (Elves/Forest): **Emerald/Green** Glow.
    *   `city` (Tech/Empire): **Amber/Gold** Glow.
    *   `ruin` (Danger): **Red/Crimson** Glow.
*   **Motion**:
    *   Use `framer-motion` for a perpetual "Heartbeat".
    *   Unlike mechanical pulsing, this should feel organic (ease-in-out).

### 3. Map Controls (The Artifact)
*   **Location**: Floating at Bottom Center.
*   **Style**: "Floating Artifact".
*   **Tailwind Class**:
    `flex gap-4 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:border-white/20 transition-all`

### 4. Integration into `App.tsx`
*   **Parallax Hook**: The Map is the "Hero".
*   **Scroll Indicator**: A "Ghostly" arrow pointing down, indicating "There is more below".

## ✅ Execution Checklist
1.  **Install**: `npm install react-zoom-pan-pinch clsx tailwind-merge framer-motion`
2.  **Implement**: `components/InteractiveMap.tsx`.
3.  **Refactor**: `components/MapMarker.tsx` to support the **Color Variants** defined above.
4.  **Compose**: Update `App.tsx` to place `InteractiveMap` in the top `h-screen` slot.

## 💡 Architect's Tip
*   **Diversity is Key**: Don't make everything blue. Let the Emerald forest pop against the dark map. Let the Gold city shine.
*   **Subtlety**: The animations should be slow and calm (duration 3s+), not frantic blinking.

