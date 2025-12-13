import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MapPin, ScrollText } from 'lucide-react';
import { Place, Story } from '../types';
import { getPlaceBySlug, listChildPlaces } from '../services/placeService';
import { listStoriesByPlace } from '../services/storyService';
import { PLACES } from '../constants';
import MarkdownRenderer from './MarkdownRenderer';

interface PlacePageProps {
  slug: string;
}

const PlacePage: React.FC<PlacePageProps> = ({ slug }) => {
  const [place, setPlace] = useState<Place | null>(null);
  const [children, setChildren] = useState<Place[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackPlace = useMemo(
    () => PLACES.find((p) => p.slug === slug) ?? null,
    [slug]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPlaceBySlug(slug);
        const resolved = data ?? fallbackPlace;
        if (!resolved) {
          setError('未找到该地点');
          setPlace(null);
          return;
        }
        if (!cancelled) setPlace(resolved);

        try {
          const [childPlaces, relatedStories] = await Promise.all([
            listChildPlaces(resolved.id),
            listStoriesByPlace(resolved.id),
          ]);
          if (!cancelled) {
            setChildren(childPlaces);
            setStories(relatedStories);
          }
        } catch (err) {
          console.warn('[place] failed to load relations', err);
        }
      } catch (err: any) {
        console.warn('[place] failed to load place by slug', err);
        if (!cancelled) {
          if (fallbackPlace) {
            setPlace(fallbackPlace);
          } else {
            setError('未找到该地点');
            setPlace(null);
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
  }, [slug, fallbackPlace]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 text-slate-400 italic">正在加载地点详情…</div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-6 text-slate-200">
          {error ?? '未找到该地点'}
        </div>
      </div>
    );
  }

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
          {place.coverImageUrl ? (
            <img
              src={place.coverImageUrl}
              alt={place.name}
              className="w-full h-64 sm:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 sm:h-80 bg-slate-900 flex items-center justify-center text-slate-500">
              暂无封面
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-6">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-slate-500">{place.kind}</div>
              <div className="text-3xl sm:text-4xl font-bold fantasy-font text-amber-200">
                {place.name}
              </div>
              {place.description && (
                <div className="text-slate-300 leading-7">{place.description}</div>
              )}
              {place.mapX !== undefined && place.mapY !== undefined && (
                <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-black/30 border border-white/10 rounded-full px-3 py-1">
                  <MapPin size={14} />
                  地图坐标：{place.mapX.toFixed(1)} / {place.mapY.toFixed(1)}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
              <div className="flex items-center gap-2 text-slate-200 mb-4">
                <ScrollText size={18} className="text-amber-400" />
                <span className="font-semibold">设定正文</span>
              </div>
              {place.loreMd ? (
                <MarkdownRenderer content={place.loreMd} />
              ) : (
                <div className="text-slate-500">暂无正文。</div>
              )}
            </div>

            {children.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
                <div className="text-slate-200 font-semibold mb-4">下级地点</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {children.map((child) => (
                    <a
                      key={child.id}
                      href={`/place/${encodeURIComponent(child.slug)}`}
                      className="rounded-xl border border-white/10 bg-slate-900/40 hover:bg-slate-900/70 px-4 py-3 transition-colors"
                    >
                      <div className="text-slate-100 font-semibold">{child.name}</div>
                      <div className="text-xs text-slate-500">{child.kind}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {stories.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-6">
                <div className="text-slate-200 font-semibold mb-4">相关短篇</div>
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
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlacePage;

