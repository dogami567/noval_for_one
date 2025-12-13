import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, MapPin } from 'lucide-react';
import { Character, Place, Story } from '../types';
import { getCharacterBySlug } from '../services/characterService';
import { getPlace } from '../services/placeService';
import { listStoriesByCharacter } from '../services/storyService';
import { CHARACTERS, PLACES } from '../constants';

interface CharacterPageProps {
  slug: string;
}

const CharacterPage: React.FC<CharacterPageProps> = ({ slug }) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [currentPlace, setCurrentPlace] = useState<Place | null>(null);
  const [homePlace, setHomePlace] = useState<Place | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackCharacter = useMemo(
    () => CHARACTERS.find((c) => c.slug === slug) ?? null,
    [slug]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getCharacterBySlug(slug);
        const resolved = data ?? fallbackCharacter;
        if (!resolved) {
          setError('未找到该英雄');
          setCharacter(null);
          return;
        }
        if (!cancelled) setCharacter(resolved);

        try {
          const [storiesData, current, home] = await Promise.all([
            listStoriesByCharacter(resolved.id),
            getPlace(resolved.currentPlaceId).catch(() => null),
            resolved.homePlaceId ? getPlace(resolved.homePlaceId).catch(() => null) : Promise.resolve(null),
          ]);

          if (!cancelled) {
            setStories(storiesData);
            setCurrentPlace(current ?? PLACES.find((p) => p.id === resolved.currentPlaceId) ?? null);
            setHomePlace(home ?? (resolved.homePlaceId ? PLACES.find((p) => p.id === resolved.homePlaceId) ?? null : null));
          }
        } catch (err) {
          console.warn('[character] failed to load relations', err);
        }
      } catch (err: any) {
        console.warn('[character] failed to load character by slug', err);
        if (!cancelled) {
          if (fallbackCharacter) {
            setCharacter(fallbackCharacter);
          } else {
            setError('未找到该英雄');
            setCharacter(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, fallbackCharacter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 text-slate-400 italic">正在加载英雄详情…</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-6 text-slate-200">
          {error ?? '未找到该英雄'}
        </div>
      </div>
    );
  }

  const storyFallback = stories.length === 0 && character.stories ? character.stories : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-white/10 px-4 sm:px-10 py-4 flex items-center justify-between">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <a href="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          回到首页
        </a>
      </header>

      <main className="px-4 sm:px-10 py-8 max-w-5xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40">
          <div className="relative h-72 sm:h-96">
            <img
              src={character.imageUrl}
              alt={character.name}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10">
              <div className="text-3xl sm:text-5xl font-bold fantasy-font text-amber-200">
                {character.name}
              </div>
              <div className="text-amber-400 uppercase tracking-[0.2em] text-xs sm:text-sm font-bold mt-2">
                {character.title}
              </div>
              <div className="text-slate-300 mt-3 max-w-3xl leading-7">{character.description}</div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-wrap gap-3 text-xs">
              {character.faction && (
                <span className="rounded-full bg-slate-950/40 border border-white/10 px-3 py-1 text-slate-300">
                  阵营：{character.faction}
                </span>
              )}
              {currentPlace && (
                <a
                  href={`/place/${encodeURIComponent(currentPlace.slug)}`}
                  className="rounded-full bg-slate-950/40 border border-white/10 px-3 py-1 text-slate-300 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <MapPin size={14} />
                  当前位置：{currentPlace.name}
                </a>
              )}
              {homePlace && (
                <a
                  href={`/place/${encodeURIComponent(homePlace.slug)}`}
                  className="rounded-full bg-slate-950/40 border border-white/10 px-3 py-1 text-slate-300 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <MapPin size={14} />
                  故乡：{homePlace.name}
                </a>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
              <div className="text-slate-200 font-semibold mb-3">传记</div>
              <div className="text-slate-300 leading-7 whitespace-pre-wrap">{character.lore || character.description}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
              <div className="flex items-center gap-2 text-slate-200 font-semibold mb-4">
                <BookOpen size={18} className="text-cyan-400" />
                相关短篇
              </div>

              {stories.length > 0 ? (
                <div className="space-y-3">
                  {stories.map((story) => (
                    <a
                      key={story.id}
                      href={`/story/${encodeURIComponent(story.slug)}`}
                      className="block rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/70 px-4 py-3 transition-colors"
                    >
                      <div className="text-slate-100 font-semibold">{story.title}</div>
                      {story.excerpt && (
                        <div className="text-xs text-slate-400 mt-1 line-clamp-2">{story.excerpt}</div>
                      )}
                    </a>
                  ))}
                </div>
              ) : storyFallback ? (
                <div className="space-y-3">
                  {storyFallback.map((story) => (
                    <div
                      key={story.title}
                      className="rounded-xl border border-white/10 bg-slate-900/30 px-4 py-3"
                    >
                      <div className="text-slate-100 font-semibold">{story.title}</div>
                      <div className="text-xs text-slate-400 mt-1">{story.excerpt}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500">暂无关联短篇。</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterPage;

