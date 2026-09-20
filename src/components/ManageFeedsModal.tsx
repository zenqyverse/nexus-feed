'use client';

import { useState } from 'react';
import { X, Trash2, Rss, Pencil, Check, XCircle } from 'lucide-react';
import { FeedSource } from '@/config/feeds';
import toast from 'react-hot-toast';

interface ManageFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: FeedSource[];
  onRemoveFeed: (id: string) => Promise<void>;
  onUpdateFeed: (id: string, updates: Partial<FeedSource>) => Promise<void>;
}

export default function ManageFeedsModal({
  isOpen,
  onClose,
  feeds,
  onRemoveFeed,
  onUpdateFeed,
}: ManageFeedsModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editPlatform, setEditPlatform] = useState<FeedSource['platform']>('web_forum');
  const [editScope, setEditScope] = useState<FeedSource['scope']>('lokal');
  const [editPillar, setEditPillar] = useState<FeedSource['pillar']>('intersection');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async (id: string, name: string) => {
    await onRemoveFeed(id);
    toast.success(`Feed "${name}" berhasil dihapus.`);
  };

  const startEdit = (feed: FeedSource) => {
    setEditingId(feed.id);
    setEditName(feed.name);
    setEditUrl(feed.url);
    setEditPlatform(feed.platform);
    setEditScope(feed.scope);
    setEditPillar(feed.pillar);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditUrl('');
    setEditPlatform('web_forum');
    setEditScope('lokal');
    setEditPillar('intersection');
  };

  const saveEdit = async (feedId: string) => {
    if (!editName.trim() || !editUrl.trim()) {
      toast.error('Nama dan URL tidak boleh kosong.');
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateFeed(feedId, { 
        name: editName.trim(), 
        url: editUrl.trim(),
        platform: editPlatform,
        scope: editScope,
        pillar: editPillar
      });
      toast.success('Feed berhasil diperbarui!');
      cancelEdit();
    } catch {
      toast.error('Gagal memperbarui feed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 text-slate-900">
            <Rss className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold">Manajemen Feed</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/30">
          {feeds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Rss className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Belum ada feed</p>
              <p className="text-slate-400 text-sm mt-1">Gunakan tombol &ldquo;+ Tambah Feed&rdquo; untuk menambahkan sumber berita Anda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feeds.map((feed) => (
                <div key={feed.id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-colors overflow-hidden">
                  {editingId === feed.id ? (
                    /* Edit Mode */
                    <div className="p-4 space-y-3">
                      <div>
                        <label htmlFor={`edit-name-${feed.id}`} className="text-xs font-medium text-slate-500 mb-1 block">Nama Feed</label>
                        <input
                          id={`edit-name-${feed.id}`}
                          name={`edit-name-${feed.id}`}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          placeholder="Nama sumber..."
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-url-${feed.id}`} className="text-xs font-medium text-slate-500 mb-1 block">URL RSS Feed</label>
                        <input
                          id={`edit-url-${feed.id}`}
                          name={`edit-url-${feed.id}`}
                          type="url"
                          value={editUrl}
                          onChange={(e) => setEditUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent font-mono"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Kategori Platform</label>
                          <select
                            value={editPlatform}
                            onChange={(e) => setEditPlatform(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          >
                            <option value="web_forum">Web Editorial & Forum</option>
                            <option value="reddit">Reddit (.rss)</option>
                            <option value="social">Media Sosial (X, Facebook, dsb)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Cakupan Wilayah</label>
                          <select
                            value={editScope}
                            onChange={(e) => setEditScope(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          >
                            <option value="lokal">Lokal (Indonesia)</option>
                            <option value="global">Global (Internasional)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Fokus Pilar Topik</label>
                          <select
                            value={editPillar}
                            onChange={(e) => setEditPillar(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                          >
                            <option value="intersection">Irisan Gaming & Budaya Internet</option>
                            <option value="gaming">Fokus Gaming & Industri</option>
                            <option value="internet_culture">Fokus Budaya Internet & Meme</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end pt-2 mt-2 border-t border-slate-100">
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> Batal
                        </button>
                        <button
                          onClick={() => saveEdit(feed.id)}
                          disabled={isSaving}
                          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        <h3 className="font-semibold text-slate-900 truncate">{feed.name}</h3>
                        <a href={feed.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate max-w-[250px] md:max-w-[300px] mt-0.5 block">
                          {feed.url}
                        </a>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {feed.platform}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {feed.scope}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(feed)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Edit Feed"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(feed.id, feed.name)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                          title="Hapus Feed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
