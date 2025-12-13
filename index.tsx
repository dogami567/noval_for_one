import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPage from './components/AdminPage';
import LorePage from './components/LorePage';
import PlacePage from './components/PlacePage';
import CharacterPage from './components/CharacterPage';
import StoryPage from './components/StoryPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isAdminRoute = normalizedPath === '/admin';
const isLoreRoute = normalizedPath === '/lore';
const placeMatch = normalizedPath.match(/^\/place\/(.+)$/);
const characterMatch = normalizedPath.match(/^\/character\/(.+)$/);
const storyMatch = normalizedPath.match(/^\/story\/(.+)$/);

const getSlugParam = (match: RegExpMatchArray | null): string | null => {
  if (!match) return null;
  try {
    return decodeURIComponent(match[1] ?? '');
  } catch {
    return match[1] ?? null;
  }
};

const placeSlug = getSlugParam(placeMatch);
const characterSlug = getSlugParam(characterMatch);
const storySlug = getSlugParam(storyMatch);
root.render(
  <React.StrictMode>
    {isAdminRoute ? (
      <AdminPage />
    ) : isLoreRoute ? (
      <LorePage />
    ) : placeSlug ? (
      <PlacePage slug={placeSlug} />
    ) : characterSlug ? (
      <CharacterPage slug={characterSlug} />
    ) : storySlug ? (
      <StoryPage slug={storySlug} />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
