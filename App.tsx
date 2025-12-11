import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Github, Twitter } from 'lucide-react';
import MapBackground from './components/MapBackground';
import MapMarker from './components/MapMarker';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import CharacterGridSection from './components/CharacterGridSection';
import CharacterSidebar from './components/CharacterSidebar';
import ChroniclesView from './components/ChroniclesView';
import { LOCATIONS, CHARACTERS } from './constants';
import { Location, ViewType, Character } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('map');
  const [locations, setLocations] = useState<Location[]>(LOCATIONS);
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS);
  
  // Selections
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  
  // Game State
  const [currentLocationId, setCurrentLocationId] = useState<string>('loc_1'); 
  const [isTraveling, setIsTraveling] = useState(false);

  // Scroll Refs
  // Note: We use the spacer top for map, and actual DOM elements for others
  const topRef = useRef<HTMLDivElement>(null);
  const characterSectionRef = useRef<HTMLDivElement>(null);
  const chronicleSectionRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    if (view === 'map') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (view === 'characters') {
      characterSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (view === 'chronicles') {
      chronicleSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleUpdateLocation = (updatedLocation: Location) => {
    const newLocations = locations.map(loc => 
      loc.id === updatedLocation.id ? updatedLocation : loc
    );
    setLocations(newLocations);
    setSelectedLocation(updatedLocation);
  };

  const handleUpdateCharacter = (updatedChar: Character) => {
    const newChars = characters.map(c => 
      c.id === updatedChar.id ? updatedChar : c
    );
    setCharacters(newChars);
    setSelectedCharacter(updatedChar);
  };

  const handleTravel = () => {
    if (selectedLocation && selectedLocation.status !== 'locked') {
      setSelectedLocation(null);
      setIsTraveling(true);
      setTimeout(() => {
        setIsTraveling(false);
        setCurrentLocationId(selectedLocation.id);
      }, 2500);
    }
  };

  return (
    <div className="relative w-full min-h-screen text-slate-100 selection:bg-cyan-500/30 font-sans">
      
      {/* GLOBAL HUD */}
      <Navbar currentView={currentView} onNavigate={handleNavigate} />
      <ChatWidget selectedLocation={selectedLocation} />

      {/* --- LAYER 1: FIXED MAP BACKGROUND (The "Underneath" Layer) --- */}
      {/* This stays fixed while the rest scrolls over it */}
      <div className="fixed inset-0 z-0 w-full h-full overflow-hidden">
        <MapBackground />
        
        {/* Interactive Map Markers */}
        {/* We place markers here so they stay on screen when at the top */}
        <div className="absolute inset-0 z-10 w-full h-full" onClick={() => setSelectedLocation(null)}>
          {locations.map((loc) => (
            <MapMarker
              key={loc.id}
              location={loc}
              isSelected={selectedLocation?.id === loc.id}
              isCurrent={currentLocationId === loc.id}
              onClick={handleLocationClick}
            />
          ))}
        </div>

        {/* Hero Text / Scroll Indicator - Only visible when at top theoretically, but we fade it out via Scroll opacity or just let it get covered */}
        <div className="absolute bottom-12 left-0 w-full z-20 pointer-events-none flex justify-center">
            <motion.div 
              className="flex flex-col items-center gap-2 text-slate-400 opacity-80"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
               <span className="text-xs uppercase tracking-[0.2em] font-semibold text-cyan-400 drop-shadow-md">Scroll to Explore</span>
               <ChevronDown size={32} className="text-white drop-shadow-md" />
            </motion.div>
        </div>
      </div>

      {/* --- LAYER 2: SCROLLABLE CONTENT (The "Curtain" Layer) --- */}
      {/* relative z-10 puts this structurally above the fixed map */}
      {/* POINTER-EVENTS-NONE IS CRITICAL HERE: It ensures the invisible parts of this layer don't block clicks on the map */}
      <div className="relative z-10 flex flex-col w-full pointer-events-none">
        
        {/* SPACER: Transparent, allows seeing the map for the first 100vh */}
        <div ref={topRef} className="w-full h-[100vh] pointer-events-none"></div>

        {/* REAL CONTENT STARTS HERE */}
        {/* POINTER-EVENTS-AUTO restores interaction for the actual content */}
        <div className="w-full bg-slate-950 shadow-[0_-50px_100px_rgba(2,6,23,1)] border-t border-amber-500/10 pointer-events-auto">
          
          {/* Transition Gradient Element */}
          <div className="w-full h-24 -mt-24 bg-gradient-to-b from-transparent to-slate-950 pointer-events-none"></div>

          {/* Characters Section */}
          <div ref={characterSectionRef} className="relative pt-12 pb-24">
             <CharacterGridSection 
                characters={characters} 
                onSelectCharacter={setSelectedCharacter} 
             />
          </div>

          {/* Chronicles Section */}
          <div ref={chronicleSectionRef} className="relative bg-slate-900/50 border-t border-slate-800">
             <div className="py-24">
                <ChroniclesView />
             </div>
          </div>

          {/* Footer */}
          <footer className="w-full bg-black py-12 border-t border-slate-900 text-center">
             <h3 className="fantasy-font text-2xl text-slate-600 mb-4">Aetheria Chronicles</h3>
             <div className="flex justify-center gap-6 text-slate-500 mb-8">
                <Github className="hover:text-white cursor-pointer transition-colors" />
                <Twitter className="hover:text-white cursor-pointer transition-colors" />
             </div>
             <p className="text-slate-700 text-sm">© 2024 Realm Archives. All rights reserved.</p>
          </footer>
        </div>
      </div>

      {/* OVERLAYS (Sidebars & Modals) - Highest Z-Index */}
      <Sidebar 
        location={selectedLocation} 
        currentLocationId={currentLocationId}
        onClose={() => setSelectedLocation(null)} 
        onUpdate={handleUpdateLocation}
        onTravel={handleTravel}
      />

      <CharacterSidebar
         character={selectedCharacter}
         onClose={() => setSelectedCharacter(null)}
         onUpdate={handleUpdateCharacter}
      />
      
      {/* Travel Animation Overlay */}
      <AnimatePresence>
        {isTraveling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md pointer-events-none"
          >
            <div className="text-center flex flex-col items-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], textShadow: "0px 0px 8px rgb(251, 191, 36)" }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-amber-400 text-5xl font-bold fantasy-font mb-8"
              >
                Traversing the Realm...
              </motion.div>
              <div className="mb-8 relative w-24 h-24 border-4 border-slate-700 rounded-full flex items-center justify-center">
                 <motion.div className="w-16 h-1 bg-cyan-500 absolute" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                 <motion.div className="w-1 h-16 bg-cyan-500 absolute" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;