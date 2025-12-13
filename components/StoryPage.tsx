import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Story } from '../types';
import { getStoryBySlug } from '../services/storyService';
import MarkdownRenderer from './MarkdownRenderer';

interface StoryPageProps {
  slug: string;
}

const StoryPage: React.FC<StoryPageProps> = ({ slug }) => {
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getStoryBySlug(slug);
        if (!cancelled) {
          setStory(data);
          if (!data) setError('未找到该短篇');
        }
      } catch (err: any) {
        console.warn('[story] failed to load story by slug', err);
        if (!cancelled) {
          setStory(null);
          setError('未找到该短篇');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 text-slate-400 italic">正在加载短篇…</div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 px-4 sm:px-10 py-10">
        <a href="/lore" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft size={16} /> 返回设定集
        </a>
        <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-6 text-slate-200">
          {error ?? '未找到该短篇'}
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

      <main className="px-4 sm:px-10 py-8 max-w-4xl mx-auto">
        <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900/40">
          {story.coverImageUrl ? (
            <img
              src={story.coverImageUrl}
              alt={story.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-72 bg-slate-900 flex items-center justify-center text-slate-500">
              暂无封面
            </div>
          )}

          <div className="p-6 sm:p-10">
            <div className="text-3xl sm:text-4xl font-bold fantasy-font text-amber-200">
              {story.title}
            </div>
            {story.excerpt && (
              <div className="mt-3 text-slate-300 italic border-l-2 border-amber-500/40 pl-4">
                “{story.excerpt}”
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/30 p-6">
              {story.contentMd ? (
                <MarkdownRenderer content={story.contentMd} />
              ) : (
                <div className="text-slate-500">正文暂无内容。</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoryPage;

