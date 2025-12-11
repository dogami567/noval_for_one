# Architecture Instruction: Map Refactor & Fix

**ID**: 001-setup-and-map
**Priority**: Critical
**Target**: Execution Agent

## 🚨 Context
The current deployed version (Vite + React) shows a **black screen** or missing map elements. This is likely due to unreliable external image URLs (Unsplash) and CSS layer collapsing. We need to implement the "Enhanced Map" (PRD v1.3) immediately to fix this and provide the zoom/pan feature.

## 🛠️ Step-by-Step Implementation

### 1. Vercel Configuration (Infrastructure)
*   **Action**: Create `vercel.json` in the root directory.
*   **Content**:
    ```json
    {
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/api/$1" },
        { "source": "/(.*)", "destination": "/index.html" }
      ]
    }
    ```

### 2. Map Component (The Fix)
*   **Action**: Create `components/InteractiveMap.tsx`.
*   **Requirements**:
    *   Use `react-zoom-pan-pinch` (already in package.json).
    *   **CRITICAL**: Use a **fallback background color** (`bg-slate-800`) on the container so it's never purely black if the image fails.
    *   **Image Source**: Use this reliable placeholder for now: `https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/map-v1.jpg` (or any reliable static asset). **Do not use random Unsplash URLs**.
    *   **Structure**:
        ```tsx
        <TransformWrapper centerOnInit minScale={0.5} maxScale={4}>
           <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
               <div className="relative w-[1920px] h-[1080px] bg-slate-800">
                   <img src="..." className="w-full h-full object-cover" />
                   {/* Markers go here */}
               </div>
           </TransformComponent>
        </TransformWrapper>
        ```

### 3. Layout Integration (App.tsx)
*   **Action**: Refactor `App.tsx` to use the new "Hybrid Scroll" layout.
*   **Changes**:
    *   **Remove**: `<MapBackground />` and the old `fixed inset-0` container.
    *   **New Structure**:
        ```tsx
        <div className="relative w-full bg-slate-950">
            {/* HERO SECTION: H-SCREEN (The Map) */}
            <div className="h-screen w-full relative z-0">
                <InteractiveMap 
                    locations={locations} 
                    onLocationClick={handleLocationClick} 
                />
                {/* Scroll Down Indicator */}
                <div className="absolute bottom-10 left-1/2 ...">Scroll to Explore</div>
            </div>

            {/* CONTENT SECTION: Z-10 (The Cards) */}
            <div className="relative z-10 w-full bg-slate-950 shadow-2xl border-t border-amber-500/20">
                <CharacterGridSection ... />
                <ChroniclesView ... />
            </div>
        </div>
        ```
    *   **Note**: Ensure the Map section is *not* `fixed`. It should scroll away naturally as the user scrolls down to see the content.

### 4. API Stub (Optional but Good)
*   **Action**: Create `api/hello.ts` returning `{ "status": "ok" }`.

## ✅ Verification Criteria
1.  Run `npm run dev`.
2.  **Verify**: The map image loads (or at least the dark blue background shows).
3.  **Verify**: You can drag/pan the map in the top section.
4.  **Verify**: Scrolling down reveals the Character Cards naturally.