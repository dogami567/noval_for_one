import React from 'react';
import { motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import MapMarker from './MapMarker';
import type { Location } from '../types';

interface InteractiveMapProps {
  locations: Location[];
  selectedLocationId: string | null;
  currentLocationId: string;
  onSelectLocation: (location: Location) => void;
  onClearSelection: () => void;
  onViewDetails: (location: Location) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  locations,
  selectedLocationId,
  currentLocationId,
  onSelectLocation,
  onClearSelection,
  onViewDetails,
}) => {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.55)] bg-slate-950">
      <TransformWrapper
        centerOnInit
        minScale={0.5}
        maxScale={4}
        initialScale={1}
        doubleClick={{ disabled: true }}
        limitToBounds
        wheel={{ step: 0.2, activationKeys: ['Control'] }}
        panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperClass="h-full w-full"
              contentClass="h-full w-full flex items-center justify-center"
            >
              <div
                className="relative w-[1920px] h-[1080px] bg-slate-800 overflow-hidden"
                onClick={onClearSelection}
              >
                <img
                  src="https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/map-v1.jpg"
                  alt="Realm map"
                  className="absolute inset-0 h-full w-full object-cover"
                />

              {/* Grid Overlay */}
              <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-cyan-600" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Topographic Motion */}
              <svg className="absolute inset-0 h-full w-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                <motion.path
                  d="M0,100 Q400,300 800,100 T1600,100"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="80%"
                  cy="30%"
                  r="200"
                  stroke="white"
                  strokeWidth="0.5"
                  fill="none"
                  initial={{ scale: 0.9, opacity: 0.1 }}
                  animate={{ scale: 1.1, opacity: 0.3 }}
                  transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                />
              </svg>

              {/* Markers */}
                <div className="absolute inset-0" onClick={(e) => e.stopPropagation()}>
                  {locations.map((loc) => (
                    <MapMarker
                      key={loc.id}
                      location={loc}
                      isSelected={selectedLocationId === loc.id}
                      isCurrent={currentLocationId === loc.id}
                      onClick={onSelectLocation}
                      onViewDetails={(location) => onViewDetails(location)}
                    />
                  ))}
                </div>
              </div>
            </TransformComponent>

            {/* Map Controls */}
            <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:border-white/20 transition-all">
              <button
                type="button"
                onClick={() => zoomOut()}
                className="p-1 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Zoom out"
              >
                <Minus size={18} />
              </button>
              <button
                type="button"
                onClick={() => resetTransform()}
                className="p-1 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Reset view"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={() => zoomIn()}
                className="p-1 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Zoom in"
              >
                <Plus size={18} />
              </button>
            </div>
          </>
        )}
      </TransformWrapper>

      {/* Mana atmosphere + vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0)_0%,rgba(2,6,23,0)_55%,rgba(2,6,23,0.95)_100%)]" />
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-lg border border-white/5 bg-black/50 px-3 py-2 text-xs text-slate-200 backdrop-blur">
        拖拽平移，按住 Ctrl + 滚轮缩放
      </div>
    </div>
  );
};

export default InteractiveMap;
