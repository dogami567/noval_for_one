import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, LogOut, Shield } from 'lucide-react';
import { Place, Character, ChronicleEntry, Story } from '../types';
import { listPlaces } from '../services/placeService';
import { listCharacters } from '../services/characterService';
import { listTimelineEvents } from '../services/chronicleService';
import { listStories } from '../services/storyService';
import {
  adminListPlaces,
  adminCreatePlace,
  adminUpdatePlace,
  adminDeletePlace,
  adminCreateCharacter,
  adminUpdateCharacter,
  adminDeleteCharacter,
  adminListStories,
  adminGetStoryDetail,
  adminCreateStory,
  adminUpdateStory,
  adminDeleteStory,
  adminCreateTimelineEvent,
  adminUpdateTimelineEvent,
  adminDeleteTimelineEvent,
  adminUploadImage,
} from '../services/adminApi';

type TabKey = 'places' | 'characters' | 'stories' | 'chronicles';

const AdminPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem('adminEditToken');
  });
  const [isVerified, setIsVerified] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>('places');
  const [places, setPlaces] = useState<Place[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [chronicles, setChronicles] = useState<ChronicleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeForm, setPlaceForm] = useState<Partial<Place>>({ kind: 'poi', status: 'unlocked' });

  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [characterForm, setCharacterForm] = useState<Partial<Character>>({});
  const [aliasesText, setAliasesText] = useState('');
  const [attributesJson, setAttributesJson] = useState('{}');

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [storyForm, setStoryForm] = useState<Partial<Story>>({});
  const [storyCharacterIds, setStoryCharacterIds] = useState<string[]>([]);
  const [storyPlaceIds, setStoryPlaceIds] = useState<string[]>([]);

  const [selectedChronicleId, setSelectedChronicleId] = useState<string | null>(null);
  const [chronicleForm, setChronicleForm] = useState<Partial<ChronicleEntry>>({});

  const [placeImageFile, setPlaceImageFile] = useState<File | null>(null);
  const [characterImageFile, setCharacterImageFile] = useState<File | null>(null);
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const reloadData = async () => {
    setIsLoading(true);
    try {
      const [dbPlaces, dbCharacters, dbStories, dbChronicles] = await Promise.all([
        listPlaces(),
        listCharacters(),
        listStories(),
        listTimelineEvents(),
      ]);
      setPlaces(dbPlaces);
      setCharacters(dbCharacters);
      setStories(dbStories);
      setChronicles(dbChronicles);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyToken = async () => {
    try {
      await adminListPlaces();
      setIsVerified(true);
      setAuthError(null);
      await reloadData();
    } catch {
      setIsVerified(false);
      setAuthError('管理员口令无效（或 places 未完成迁移）');
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('adminEditToken');
      }
      setAdminToken(null);
    }
  };

  useEffect(() => {
    if (adminToken) {
      verifyToken();
    }
  }, [adminToken]);

  const handleLogin = async () => {
    const token = tokenInput.trim();
    if (!token) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('adminEditToken', token);
    }
    setAdminToken(token);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminEditToken');
    }
    setAdminToken(null);
    setIsVerified(false);
    setAuthError(null);
  };

  const sortedPlaces = useMemo(() => {
    const order: Record<Place['kind'], number> = {
      continent: 1,
      country: 2,
      city: 3,
      poi: 4,
    };
    return [...places].sort((a, b) => {
      const ak = order[a.kind] ?? 99;
      const bk = order[b.kind] ?? 99;
      if (ak !== bk) return ak - bk;
      return a.name.localeCompare(b.name, 'zh-CN');
    });
  }, [places]);
  const sortedCharacters = useMemo(
    () => [...characters].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    [characters]
  );
  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')),
    [stories]
  );
  const sortedChronicles = useMemo(
    () => [...chronicles].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN')),
    [chronicles]
  );

  const normalizeSlug = (value: string | undefined, fallback: string): string => {
    const trimmed = String(value ?? '').trim();
    if (trimmed.length > 0) return trimmed;
    return String(fallback ?? '').trim();
  };

  const parseAliases = (raw: string): string[] =>
    raw
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const toPlaceRow = (form: Partial<Place>) => ({
    parent_id: form.parentId ?? null,
    kind: form.kind ?? 'poi',
    name: form.name ?? '',
    slug: normalizeSlug(form.slug, form.name ?? ''),
    description: form.description ?? '',
    lore_md: form.loreMd ?? '',
    cover_image_url: form.coverImageUrl ?? '',
    map_x: form.mapX === undefined ? null : Number(form.mapX),
    map_y: form.mapY === undefined ? null : Number(form.mapY),
    status: form.status ?? 'unlocked',
  });

  const toCharacterRow = (form: Partial<Character>) => {
    let attributes: unknown = null;
    try {
      attributes = JSON.parse(attributesJson);
    } catch {
      attributes = null;
    }

    const aliases = parseAliases(aliasesText);

    return {
      name: form.name ?? '',
      slug: normalizeSlug(form.slug, form.name ?? ''),
      aliases: aliases.length > 0 ? aliases : null,
      title: form.title ?? '',
      faction: form.faction ?? '',
      description: form.description ?? '',
      lore: form.lore ?? '',
      bio: form.bio ?? '',
      rp_prompt: form.rpPrompt ?? '',
      image_url: form.imageUrl ?? '',
      current_place_id: form.currentPlaceId ?? places[0]?.id ?? null,
      home_place_id: form.homePlaceId ?? null,
      discovery_stage: form.discoveryStage ?? 'revealed',
      attributes,
    };
  };

  const toStoryRow = (form: Partial<Story>) => ({
    title: form.title ?? '',
    slug: normalizeSlug(form.slug, form.title ?? ''),
    excerpt: form.excerpt ?? '',
    content_md: form.contentMd ?? '',
    cover_image_url: form.coverImageUrl ?? '',
    character_ids: storyCharacterIds,
    place_ids: storyPlaceIds,
  });

  const toTimelineRow = (form: Partial<ChronicleEntry>) => ({
    title: form.title ?? '',
    date_label: form.date ?? '',
    summary: form.summary ?? '',
    status: form.status ?? 'pending',
  });

  const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const parts = result.split(',');
          resolve(parts[1] || '');
        } else {
          resolve('');
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleUploadPlaceImage = async () => {
    if (!selectedPlaceId) {
      setStatusMessage('请先保存以生成 ID');
      return;
    }
    if (!placeImageFile) {
      setStatusMessage('请先选择图片');
      return;
    }
    if (placeImageFile.size > MAX_IMAGE_BYTES) {
      setStatusMessage('图片过大，请压缩后再上传');
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);
    try {
      const base64 = await readFileAsBase64(placeImageFile);
      const publicUrl = await adminUploadImage({
        entity: 'place',
        id: selectedPlaceId,
        filename: placeImageFile.name,
        contentType: placeImageFile.type,
        base64,
      });

      const nextForm = { ...placeForm, coverImageUrl: publicUrl };
      setPlaceForm(nextForm);
      await handleSavePlace(nextForm);
      setPlaceImageFile(null);
    } catch (err: any) {
      setStatusMessage(`上传失败：${err?.message ?? '未知错误'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadCharacterImage = async () => {
    if (!selectedCharacterId) {
      setStatusMessage('请先保存以生成 ID');
      return;
    }
    if (!characterImageFile) {
      setStatusMessage('请先选择图片');
      return;
    }
    if (characterImageFile.size > MAX_IMAGE_BYTES) {
      setStatusMessage('图片过大，请压缩后再上传');
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);
    try {
      const base64 = await readFileAsBase64(characterImageFile);
      const publicUrl = await adminUploadImage({
        entity: 'character',
        id: selectedCharacterId,
        filename: characterImageFile.name,
        contentType: characterImageFile.type,
        base64,
      });

      const nextForm = { ...characterForm, imageUrl: publicUrl };
      setCharacterForm(nextForm);
      await handleSaveCharacter(nextForm);
      setCharacterImageFile(null);
    } catch (err: any) {
      setStatusMessage(`上传失败：${err?.message ?? '未知错误'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleUploadStoryImage = async () => {
    if (!selectedStoryId) {
      setStatusMessage('请先保存以生成 ID');
      return;
    }
    if (!storyImageFile) {
      setStatusMessage('请先选择图片');
      return;
    }
    if (storyImageFile.size > MAX_IMAGE_BYTES) {
      setStatusMessage('图片过大，请压缩后再上传');
      return;
    }

    setIsUploadingImage(true);
    setStatusMessage(null);
    try {
      const base64 = await readFileAsBase64(storyImageFile);
      const publicUrl = await adminUploadImage({
        entity: 'story',
        id: selectedStoryId,
        filename: storyImageFile.name,
        contentType: storyImageFile.type,
        base64,
      });

      const nextForm = { ...storyForm, coverImageUrl: publicUrl };
      setStoryForm(nextForm);
      await handleSaveStory(nextForm);
      setStoryImageFile(null);
    } catch (err: any) {
      setStatusMessage(`上传失败：${err?.message ?? '未知错误'}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSavePlace = async (override?: Partial<Place>) => {
    setStatusMessage(null);
    try {
      const payload = toPlaceRow(override ?? placeForm);
      if (selectedPlaceId) {
        await adminUpdatePlace(selectedPlaceId, payload);
      } else {
        const created: any = await adminCreatePlace(payload);
        setSelectedPlaceId(created?.id ? String(created.id) : null);
      }
      await reloadData();
      setStatusMessage('已保存');
    } catch (err: any) {
      setStatusMessage(`保存失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleDeletePlace = async () => {
    if (!selectedPlaceId) return;
    setStatusMessage(null);
    try {
      await adminDeletePlace(selectedPlaceId);
      setSelectedPlaceId(null);
      setPlaceForm({ kind: 'poi', status: 'unlocked' });
      await reloadData();
      setStatusMessage('已删除');
    } catch (err: any) {
      setStatusMessage(`删除失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleSaveCharacter = async (override?: Partial<Character>) => {
    setStatusMessage(null);
    try {
      const payload = toCharacterRow(override ?? characterForm);
      if (selectedCharacterId) {
        await adminUpdateCharacter(selectedCharacterId, payload);
      } else {
        const created: any = await adminCreateCharacter(payload);
        setSelectedCharacterId(created?.id ? String(created.id) : null);
      }
      await reloadData();
      setStatusMessage('已保存');
    } catch (err: any) {
      setStatusMessage(`保存失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedCharacterId) return;
    setStatusMessage(null);
    try {
      await adminDeleteCharacter(selectedCharacterId);
      setSelectedCharacterId(null);
      setCharacterForm({});
      setAliasesText('');
      setAttributesJson('{}');
      await reloadData();
      setStatusMessage('已删除');
    } catch (err: any) {
      setStatusMessage(`删除失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleSaveStory = async (override?: Partial<Story>) => {
    setStatusMessage(null);
    try {
      const payload = toStoryRow(override ?? storyForm);
      if (selectedStoryId) {
        await adminUpdateStory(selectedStoryId, payload);
      } else {
        const created: any = await adminCreateStory(payload);
        setSelectedStoryId(created?.id ? String(created.id) : null);
      }
      await reloadData();
      setStatusMessage('已保存');
    } catch (err: any) {
      setStatusMessage(`保存失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStoryId) return;
    setStatusMessage(null);
    try {
      await adminDeleteStory(selectedStoryId);
      setSelectedStoryId(null);
      setStoryForm({});
      setStoryCharacterIds([]);
      setStoryPlaceIds([]);
      await reloadData();
      setStatusMessage('已删除');
    } catch (err: any) {
      setStatusMessage(`删除失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleSelectStory = async (id: string) => {
    setStatusMessage(null);
    setSelectedStoryId(id);
    try {
      const detail = await adminGetStoryDetail(id);
      const storyRow: any = detail?.story ?? null;
      setStoryForm({
        id,
        title: storyRow?.title ?? '',
        slug: storyRow?.slug ?? '',
        excerpt: storyRow?.excerpt ?? '',
        contentMd: storyRow?.content_md ?? '',
        coverImageUrl: storyRow?.cover_image_url ?? '',
      });
      setStoryCharacterIds(detail?.character_ids ?? []);
      setStoryPlaceIds(detail?.place_ids ?? []);
    } catch (err: any) {
      setStatusMessage(`加载短篇关联失败：${err?.message ?? '未知错误'}`);
      const fallback = sortedStories.find((s) => s.id === id);
      if (fallback) setStoryForm(fallback);
    }
  };

  const handleSaveChronicle = async () => {
    setStatusMessage(null);
    try {
      const payload = toTimelineRow(chronicleForm);
      if (selectedChronicleId) {
        await adminUpdateTimelineEvent(selectedChronicleId, payload);
      } else {
        const created: any = await adminCreateTimelineEvent(payload);
        setSelectedChronicleId(created?.id ? String(created.id) : null);
      }
      await reloadData();
      setStatusMessage('已保存');
    } catch (err: any) {
      setStatusMessage(`保存失败：${err?.message ?? '未知错误'}`);
    }
  };

  const handleDeleteChronicle = async () => {
    if (!selectedChronicleId) return;
    setStatusMessage(null);
    try {
      await adminDeleteTimelineEvent(selectedChronicleId);
      setSelectedChronicleId(null);
      setChronicleForm({});
      await reloadData();
      setStatusMessage('已删除');
    } catch (err: any) {
      setStatusMessage(`删除失败：${err?.message ?? '未知错误'}`);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900/70 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-amber-400" />
            <h1 className="text-2xl font-bold fantasy-font">管理员入口</h1>
          </div>
          <label className="block text-sm text-slate-300 mb-2">请输入管理员口令</label>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none"
            placeholder="管理员口令"
          />
          {authError && <div className="text-rose-400 text-sm mt-3">{authError}</div>}
          <button
            type="button"
            onClick={handleLogin}
            className="mt-6 w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            进入管理面板
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-white/10 px-4 sm:px-10 py-4 flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl fantasy-font text-amber-300">世界观管理面板</h1>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          退出管理模式
        </button>
      </header>

      <main className="px-4 sm:px-10 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'places' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            地点/地区
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'characters' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            英雄
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stories')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'stories' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            短篇
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chronicles')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'chronicles' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            编年史事件
          </button>
        </div>

        {statusMessage && (
          <div className="mb-4 text-sm text-slate-200 bg-slate-900/60 border border-white/10 rounded-lg px-4 py-2">
            {statusMessage}
          </div>
        )}

        {isLoading && <div className="mb-4 text-sm text-slate-400 italic">正在加载数据...</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-300">
                {activeTab === 'places' && '地点/地区列表'}
                {activeTab === 'characters' && '英雄列表'}
                {activeTab === 'stories' && '短篇列表'}
                {activeTab === 'chronicles' && '事件列表'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusMessage(null);
                  if (activeTab === 'places') {
                    setSelectedPlaceId(null);
                    setPlaceForm({
                      name: '',
                      slug: '',
                      kind: 'poi',
                      parentId: undefined,
                      description: '',
                      loreMd: '',
                      coverImageUrl: '',
                      mapX: undefined,
                      mapY: undefined,
                      status: 'unlocked',
                    });
                    setPlaceImageFile(null);
                  }
                  if (activeTab === 'characters') {
                    setSelectedCharacterId(null);
                    setCharacterForm({
                      name: '',
                      slug: '',
                      title: '',
                      faction: '',
                      description: '',
                      lore: '',
                      bio: '',
                      rpPrompt: '',
                      imageUrl: '',
                      currentPlaceId: places[0]?.id,
                      homePlaceId: undefined,
                      discoveryStage: 'revealed',
                    });
                    setAliasesText('');
                    setAttributesJson('{}');
                    setCharacterImageFile(null);
                  }
                  if (activeTab === 'stories') {
                    setSelectedStoryId(null);
                    setStoryForm({
                      title: '',
                      slug: '',
                      excerpt: '',
                      contentMd: '',
                      coverImageUrl: '',
                    });
                    setStoryCharacterIds([]);
                    setStoryPlaceIds([]);
                    setStoryImageFile(null);
                  }
                  if (activeTab === 'chronicles') {
                    setSelectedChronicleId(null);
                    setChronicleForm({
                      title: '',
                      date: '',
                      summary: '',
                      status: 'pending',
                    });
                  }
                }}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-100"
              >
                <Plus size={14} />
                新增
              </button>
            </div>

            {activeTab === 'places' &&
              sortedPlaces.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlaceId(loc.id);
                    setPlaceForm(loc);
                    setStatusMessage(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    selectedPlaceId === loc.id
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {loc.coverImageUrl ? (
                      <img
                        src={loc.coverImageUrl}
                        alt={loc.name}
                        className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-300 shrink-0">
                        {(loc.name || '?').slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{loc.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {loc.kind}
                        {loc.status ? ` · ${loc.status}` : ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

            {activeTab === 'characters' &&
              sortedCharacters.map((char) => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => {
                    setSelectedCharacterId(char.id);
                    setCharacterForm(char);
                    setAliasesText((char.aliases ?? []).join('\n'));
                    setAttributesJson(JSON.stringify(char.attributes ?? {}, null, 2));
                    setStatusMessage(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    selectedCharacterId === char.id
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {char.imageUrl ? (
                      <img
                        src={char.imageUrl}
                        alt={char.name}
                        className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-300 shrink-0">
                        {(char.name || '?').slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{char.name}</div>
                      <div className="text-xs text-slate-400 truncate">
                        {char.title || char.faction || ''}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

            {activeTab === 'stories' &&
              sortedStories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => handleSelectStory(story.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    selectedStoryId === story.id
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {story.coverImageUrl ? (
                      <img
                        src={story.coverImageUrl}
                        alt={story.title}
                        className="w-9 h-9 rounded-full object-cover bg-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-300 shrink-0">
                        {(story.title || '?').slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">{story.title}</div>
                      <div className="text-xs text-slate-400 truncate">{story.excerpt}</div>
                    </div>
                  </div>
                </button>
              ))}

            {activeTab === 'chronicles' &&
              sortedChronicles.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    setSelectedChronicleId(entry.id);
                    setChronicleForm(entry);
                    setStatusMessage(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    selectedChronicleId === entry.id
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {entry.title}
                </button>
              ))}
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 h-[70vh] overflow-y-auto">
            {activeTab === 'places' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  {placeForm.coverImageUrl ? (
                    <img
                      src={placeForm.coverImageUrl}
                      alt={placeForm.name ?? '当前图片'}
                      className="w-full max-h-52 object-contain rounded-lg bg-slate-950/60"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-slate-800/60 flex items-center justify-center text-sm text-slate-400">
                      暂无图片
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">名称</label>
                    <input
                      value={placeForm.name ?? ''}
                      onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Slug（URL）</label>
                    <input
                      value={placeForm.slug ?? ''}
                      onChange={(e) => setPlaceForm({ ...placeForm, slug: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                      placeholder="默认=名称"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">类型</label>
                    <select
                      value={placeForm.kind ?? 'poi'}
                      onChange={(e) =>
                        setPlaceForm({ ...placeForm, kind: e.target.value as Place['kind'] })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="continent">continent</option>
                      <option value="country">country</option>
                      <option value="city">city</option>
                      <option value="poi">poi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">父级</label>
                    <select
                      value={placeForm.parentId ?? ''}
                      onChange={(e) =>
                        setPlaceForm({ ...placeForm, parentId: e.target.value || undefined })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="">无</option>
                      {sortedPlaces
                        .filter((p) => p.id !== selectedPlaceId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}（{p.kind}）
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">状态</label>
                    <select
                      value={placeForm.status ?? 'unlocked'}
                      onChange={(e) =>
                        setPlaceForm({ ...placeForm, status: e.target.value as Place['status'] })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="unlocked">unlocked</option>
                      <option value="locked">locked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">地图 X（0-100，可选）</label>
                    <input
                      type="number"
                      value={placeForm.mapX ?? ''}
                      onChange={(e) =>
                        setPlaceForm({
                          ...placeForm,
                          mapX: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">地图 Y（0-100，可选）</label>
                    <input
                      type="number"
                      value={placeForm.mapY ?? ''}
                      onChange={(e) =>
                        setPlaceForm({
                          ...placeForm,
                          mapY: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">短介绍</label>
                  <textarea
                    rows={3}
                    value={placeForm.description ?? ''}
                    onChange={(e) =>
                      setPlaceForm({ ...placeForm, description: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">设定正文（Markdown）</label>
                  <textarea
                    rows={10}
                    value={placeForm.loreMd ?? ''}
                    onChange={(e) => setPlaceForm({ ...placeForm, loreMd: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">封面 URL</label>
                  <input
                    value={placeForm.coverImageUrl ?? ''}
                    onChange={(e) =>
                      setPlaceForm({ ...placeForm, coverImageUrl: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPlaceImageFile(e.target.files?.[0] ?? null)}
                      className="text-xs text-slate-200 file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleUploadPlaceImage}
                      disabled={isUploadingImage || !selectedPlaceId}
                      className={`px-3 py-2 text-xs rounded font-semibold transition-colors ${
                        isUploadingImage
                          ? 'bg-slate-700 text-slate-300 cursor-wait'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      } ${!selectedPlaceId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploadingImage ? '上传中...' : '上传并替换'}
                    </button>
                  </div>
                  {!selectedPlaceId && (
                    <div className="mt-1 text-xs text-slate-500">请先保存以生成 ID</div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSavePlace()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-semibold"
                  >
                    <Save size={16} />
                    保存
                  </button>
                  {selectedPlaceId && (
                    <button
                      type="button"
                      onClick={handleDeletePlace}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 rounded text-white font-semibold"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'characters' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  {characterForm.imageUrl ? (
                    <img
                      src={characterForm.imageUrl}
                      alt={characterForm.name ?? '当前图片'}
                      className="w-full max-h-52 object-contain rounded-lg bg-slate-950/60"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-slate-800/60 flex items-center justify-center text-sm text-slate-400">
                      暂无图片
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">名称</label>
                    <input
                      value={characterForm.name ?? ''}
                      onChange={(e) =>
                        setCharacterForm({ ...characterForm, name: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">称号</label>
                    <input
                      value={characterForm.title ?? ''}
                      onChange={(e) =>
                        setCharacterForm({ ...characterForm, title: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Slug（URL）</label>
                    <input
                      value={characterForm.slug ?? ''}
                      onChange={(e) =>
                        setCharacterForm({ ...characterForm, slug: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                      placeholder="默认=名称"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">别名（可选）</label>
                    <textarea
                      rows={3}
                      value={aliasesText}
                      onChange={(e) => setAliasesText(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-xs"
                      placeholder="换行或逗号分隔，用于聊天命中"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">阵营/势力</label>
                    <input
                      value={characterForm.faction ?? ''}
                      onChange={(e) =>
                        setCharacterForm({ ...characterForm, faction: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">图片 URL</label>
                    <input
                      value={characterForm.imageUrl ?? ''}
                      onChange={(e) =>
                        setCharacterForm({ ...characterForm, imageUrl: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCharacterImageFile(e.target.files?.[0] ?? null)
                        }
                        className="text-xs text-slate-200 file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                      />
                      <button
                        type="button"
                        onClick={handleUploadCharacterImage}
                        disabled={isUploadingImage || !selectedCharacterId}
                        className={`px-3 py-2 text-xs rounded font-semibold transition-colors ${
                          isUploadingImage
                            ? 'bg-slate-700 text-slate-300 cursor-wait'
                            : 'bg-amber-600 hover:bg-amber-500 text-white'
                        } ${!selectedCharacterId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isUploadingImage ? '上传中...' : '上传并替换'}
                      </button>
                    </div>
                    {!selectedCharacterId && (
                      <div className="mt-1 text-xs text-slate-500">请先保存以生成 ID</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">简短描述</label>
                  <textarea
                    rows={3}
                    value={characterForm.description ?? ''}
                    onChange={(e) =>
                      setCharacterForm({ ...characterForm, description: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">传记 / Lore</label>
                  <textarea
                    rows={5}
                    value={characterForm.lore ?? ''}
                    onChange={(e) =>
                      setCharacterForm({ ...characterForm, lore: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bio（酒馆/叙事）</label>
                  <textarea
                    rows={4}
                    value={characterForm.bio ?? ''}
                    onChange={(e) =>
                      setCharacterForm({ ...characterForm, bio: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">角色 RP Prompt</label>
                  <textarea
                    rows={4}
                    value={characterForm.rpPrompt ?? ''}
                    onChange={(e) =>
                      setCharacterForm({ ...characterForm, rpPrompt: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Attributes（JSON 对象）</label>
                  <textarea
                    rows={5}
                    value={attributesJson}
                    onChange={(e) => setAttributesJson(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">当前地点</label>
                    <select
                      value={characterForm.currentPlaceId ?? places[0]?.id ?? ''}
                      onChange={(e) =>
                        setCharacterForm({
                          ...characterForm,
                          currentPlaceId: e.target.value,
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      {sortedPlaces.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}（{place.kind}）
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">家乡地点（可选）</label>
                    <select
                      value={characterForm.homePlaceId ?? ''}
                      onChange={(e) =>
                        setCharacterForm({
                          ...characterForm,
                          homePlaceId: e.target.value || undefined,
                        })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    >
                      <option value="">无</option>
                      {sortedPlaces.map((place) => (
                        <option key={place.id} value={place.id}>
                          {place.name}（{place.kind}）
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">发现阶段</label>
                  <select
                    value={characterForm.discoveryStage ?? 'revealed'}
                    onChange={(e) =>
                      setCharacterForm({
                        ...characterForm,
                        discoveryStage: e.target.value as Character['discoveryStage'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="hidden">hidden</option>
                    <option value="rumor">rumor</option>
                    <option value="revealed">revealed</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCharacter}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-semibold"
                  >
                    <Save size={16} />
                    保存
                  </button>
                  {selectedCharacterId && (
                    <button
                      type="button"
                      onClick={handleDeleteCharacter}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 rounded text-white font-semibold"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stories' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-slate-900/40 p-3">
                  {storyForm.coverImageUrl ? (
                    <img
                      src={storyForm.coverImageUrl}
                      alt={storyForm.title ?? '当前图片'}
                      className="w-full max-h-52 object-contain rounded-lg bg-slate-950/60"
                    />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-slate-800/60 flex items-center justify-center text-sm text-slate-400">
                      暂无图片
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">标题</label>
                    <input
                      value={storyForm.title ?? ''}
                      onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Slug（URL）</label>
                    <input
                      value={storyForm.slug ?? ''}
                      onChange={(e) => setStoryForm({ ...storyForm, slug: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                      placeholder="默认=标题"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">摘要</label>
                  <textarea
                    rows={4}
                    value={storyForm.excerpt ?? ''}
                    onChange={(e) => setStoryForm({ ...storyForm, excerpt: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">正文（Markdown）</label>
                  <textarea
                    rows={12}
                    value={storyForm.contentMd ?? ''}
                    onChange={(e) => setStoryForm({ ...storyForm, contentMd: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">封面 URL</label>
                  <input
                    value={storyForm.coverImageUrl ?? ''}
                    onChange={(e) =>
                      setStoryForm({ ...storyForm, coverImageUrl: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setStoryImageFile(e.target.files?.[0] ?? null)}
                      className="text-xs text-slate-200 file:mr-2 file:px-3 file:py-1 file:rounded file:border-0 file:bg-slate-700 file:text-white hover:file:bg-slate-600"
                    />
                    <button
                      type="button"
                      onClick={handleUploadStoryImage}
                      disabled={isUploadingImage || !selectedStoryId}
                      className={`px-3 py-2 text-xs rounded font-semibold transition-colors ${
                        isUploadingImage
                          ? 'bg-slate-700 text-slate-300 cursor-wait'
                          : 'bg-amber-600 hover:bg-amber-500 text-white'
                      } ${!selectedStoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isUploadingImage ? '上传中...' : '上传并替换'}
                    </button>
                  </div>
                  {!selectedStoryId && (
                    <div className="mt-1 text-xs text-slate-500">请先保存以生成 ID</div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">关联角色（多选）</label>
                    <div className="max-h-56 overflow-y-auto rounded border border-slate-700 bg-slate-900/40 p-2 space-y-1">
                      {sortedCharacters.map((char) => {
                        const checked = storyCharacterIds.includes(char.id);
                        return (
                          <label
                            key={char.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/60 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setStoryCharacterIds((prev) =>
                                  prev.includes(char.id)
                                    ? prev.filter((id) => id !== char.id)
                                    : [...prev, char.id]
                                )
                              }
                            />
                            <span className="text-sm truncate">{char.name}</span>
                          </label>
                        );
                      })}
                      {sortedCharacters.length === 0 && (
                        <div className="text-xs text-slate-500 px-2 py-2">暂无英雄</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-2">关联地点（多选）</label>
                    <div className="max-h-56 overflow-y-auto rounded border border-slate-700 bg-slate-900/40 p-2 space-y-1">
                      {sortedPlaces.map((place) => {
                        const checked = storyPlaceIds.includes(place.id);
                        return (
                          <label
                            key={place.id}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-800/60 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setStoryPlaceIds((prev) =>
                                  prev.includes(place.id)
                                    ? prev.filter((id) => id !== place.id)
                                    : [...prev, place.id]
                                )
                              }
                            />
                            <span className="text-sm truncate">
                              {place.name}（{place.kind}）
                            </span>
                          </label>
                        );
                      })}
                      {sortedPlaces.length === 0 && (
                        <div className="text-xs text-slate-500 px-2 py-2">暂无地点/地区</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveStory}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-semibold"
                  >
                    <Save size={16} />
                    保存
                  </button>
                  {selectedStoryId && (
                    <button
                      type="button"
                      onClick={handleDeleteStory}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 rounded text-white font-semibold"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'chronicles' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">标题</label>
                  <input
                    value={chronicleForm.title ?? ''}
                    onChange={(e) =>
                      setChronicleForm({ ...chronicleForm, title: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">日期 / 纪元</label>
                  <input
                    value={chronicleForm.date ?? ''}
                    onChange={(e) =>
                      setChronicleForm({ ...chronicleForm, date: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">摘要</label>
                  <textarea
                    rows={5}
                    value={chronicleForm.summary ?? ''}
                    onChange={(e) =>
                      setChronicleForm({ ...chronicleForm, summary: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">状态</label>
                  <select
                    value={chronicleForm.status ?? 'pending'}
                    onChange={(e) =>
                      setChronicleForm({
                        ...chronicleForm,
                        status: e.target.value as ChronicleEntry['status'],
                      })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
                  >
                    <option value="completed">completed</option>
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveChronicle}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 rounded text-white font-semibold"
                  >
                    <Save size={16} />
                    保存
                  </button>
                  {selectedChronicleId && (
                    <button
                      type="button"
                      onClick={handleDeleteChronicle}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 hover:bg-rose-600 rounded text-white font-semibold"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
