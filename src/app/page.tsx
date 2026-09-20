"use client";

import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import FeedCard from '@/components/FeedCard';
import CompactFeedCard from '@/components/CompactFeedCard';
import AddFeedModal from '@/components/AddFeedModal';
import ManageFeedsModal from '@/components/ManageFeedsModal';
import LoginPage from '@/components/LoginPage';
import { useAuth } from '@/context/AuthContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { Loader2, AlertCircle, LayoutGrid, List, FileText, ExternalLink, X, ChevronRight, BarChart3, Bookmark, Rss, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type FilterPlatform = 'all' | 'web_forum' | 'reddit' | 'social';
type FilterScope = 'all' | 'lokal' | 'global';
type FilterPillar = 'all' | 'intersection' | 'gaming' | 'internet_culture';
type ViewMode = 'grid' | 'list';
type MainTab = 'feeds'  | 'focus'  | 'favorites'  | 'idea_bank'  | 'platform_web_forum' | 'platform_reddit' | 'platform_social' | 'scope_lokal' | 'scope_global' | 'pillar_intersection'  | 'pillar_gaming'  | 'pillar_internet_culture';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  sourceName: string;
  contentSnippet?: string;
  thumbnail?: string | null;
  content?: string;
  sourceId: string;
}

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <HomeApp userId={user.uid} onLogout={logout} />;
}

function HomeApp({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const {
    feeds: allFeeds,
    bookmarks: bookmarkedArticles,
    favorites: favoriteArticles,
    addFeed,
    removeFeed,
    updateFeed,
    addBookmark,
    removeBookmark,
    addFavorite,
    removeFavorite,
    isBookmarked,
    isFavorite,
    isLoaded: dataLoaded,
  } = useFirestoreData(userId);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<MainTab>('feeds');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageFeedsModalOpen, setIsManageFeedsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  // Filters
  const [platform, setPlatform] = useState<FilterPlatform>('all');
  const [scope, setScope] = useState<FilterScope>('all');
  const [pillar, setPillar] = useState<FilterPillar>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Article for Reading Pane
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const isSelectedBookmarked = selectedArticle ? isBookmarked(selectedArticle.link) : false;
  const isSelectedFavorite = selectedArticle ? isFavorite(selectedArticle.link) : false;

  const handleToggleBookmark = async () => {
    if (!selectedArticle) return;
    if (isSelectedBookmarked) {
      await removeBookmark(selectedArticle.link);
    } else {
      await addBookmark({
        id: selectedArticle.link,
        title: selectedArticle.title,
        link: selectedArticle.link,
        pubDate: selectedArticle.pubDate,
        sourceName: selectedArticle.sourceName,
        contentSnippet: selectedArticle.contentSnippet,
        thumbnail: selectedArticle.thumbnail ?? null,
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedArticle) return;
    if (isSelectedFavorite) {
      await removeFavorite(selectedArticle.link);
    } else {
      await addFavorite({
        id: selectedArticle.link,
        title: selectedArticle.title,
        link: selectedArticle.link,
        pubDate: selectedArticle.pubDate,
        sourceName: selectedArticle.sourceName,
        contentSnippet: selectedArticle.contentSnippet,
        thumbnail: selectedArticle.thumbnail ?? null,
        savedAt: Date.now(),
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchFeeds = async () => {
      setLoading(true);
      let fetchedArticles: Article[] = [];

      const fetchPromises = allFeeds.map(async (feed) => {
        try {
          const cacheBuster = new Date().getTime();
          const res = await fetch(`/api/feed?url=${encodeURIComponent(feed.url)}&_t=${cacheBuster}`);
          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              const feedArticles = data.items.map((item: any) => ({
                ...item,
                sourceName: feed.name,
                sourceId: feed.id
              }));
              fetchedArticles = [...fetchedArticles, ...feedArticles];
            }
          }
        } catch (error) {
          // Soft fail
        }
      });

      await Promise.allSettled(fetchPromises);
      
      if (isMounted) {
        fetchedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        setArticles(fetchedArticles);
        setLoading(false);
      }
    };

    fetchFeeds();

    return () => { isMounted = false; };
  }, [allFeeds]);

  // Apply Filters
  const filteredArticles = useMemo(() => {
    let baseArticles = articles;
    if (activeTab === 'idea_bank') baseArticles = bookmarkedArticles as unknown as Article[];
    if (activeTab === 'favorites') baseArticles = favoriteArticles as unknown as Article[];

    return baseArticles.filter((article) => {
      const source = allFeeds.find(f => f.name === article.sourceName || f.id === (article as Article).sourceId);
      
      if (activeTab === 'feeds' && !source) return false;
      if (activeTab === 'focus' && !source?.isFocus) return false;
      if (activeTab === 'platform_web_forum' && source?.platform !== 'web_forum') return false;
      if (activeTab === 'platform_reddit' && source?.platform !== 'reddit') return false;
      if (activeTab === 'platform_social' && source?.platform !== 'social') return false;
      if (activeTab === 'scope_lokal' && source?.scope !== 'lokal') return false;
      if (activeTab === 'scope_global' && source?.scope !== 'global') return false;
      if (activeTab === 'pillar_intersection' && source?.pillar !== 'intersection') return false;
      if (activeTab === 'pillar_gaming' && source?.pillar !== 'gaming') return false;
      if (activeTab === 'pillar_internet_culture' && source?.pillar !== 'internet_culture') return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = article.title?.toLowerCase().includes(query);
        const matchesSource = article.sourceName?.toLowerCase().includes(query);
        const matchesSnippet = article.contentSnippet?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSource && !matchesSnippet) return false;
      }

      return true;
    });
  }, [articles, bookmarkedArticles, favoriteArticles, allFeeds, activeTab, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddFeed={() => setIsAddModalOpen(true)} 
        onManageFeeds={() => setIsManageFeedsModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar 
          onSearch={setSearchQuery} 
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />

        {/* Main Layout Container - flex-col with h-full prevents page-level scrolling so we can have true split view */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Page Header & Breadcrumbs */}
          <div className="flex items-center text-sm text-slate-500 mt-4 md:mt-6 mb-6 px-4 md:px-6 lg:px-8">
            <span>Workspace</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            
            {activeTab.startsWith('platform_') && (
              <>
                <span className="hidden sm:inline">Kategori Platform</span>
                <ChevronRight className="hidden sm:block w-4 h-4 mx-2" />
              </>
            )}
            {activeTab.startsWith('scope_') && (
              <>
                <span className="hidden sm:inline">Cakupan Wilayah</span>
                <ChevronRight className="hidden sm:block w-4 h-4 mx-2" />
              </>
            )}
            {activeTab.startsWith('pillar_') && (
              <>
                <span className="hidden sm:inline">Fokus Pilar Topik</span>
                <ChevronRight className="hidden sm:block w-4 h-4 mx-2" />
              </>
            )}

            <span className="font-medium text-slate-900">
              {activeTab === 'feeds' && 'Semua Artikel'}
              {activeTab === 'focus' && 'Fokus Utama'}
              {activeTab === 'favorites' && 'Favorit'}
              {activeTab === 'idea_bank' && 'Tersimpan'}
              {activeTab === 'platform_web_forum' && 'Web Editorial & Forum'}
              {activeTab === 'platform_reddit' && 'Subreddit'}
              {activeTab === 'platform_social' && 'Akun Social Media'}
              {activeTab === 'scope_lokal' && 'Lokal (Indonesia)'}
              {activeTab === 'scope_global' && 'Global (Internasional)'}
              {activeTab === 'pillar_intersection' && 'Tech & AI'}
              {activeTab === 'pillar_gaming' && 'Gaming'}
              {activeTab === 'pillar_internet_culture' && 'Internet Culture'}
            </span>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-6 px-4 md:px-6 lg:px-8">
            <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-4 flex flex-col items-center md:items-start justify-center shadow-sm text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 text-slate-500 mb-1 md:mb-2">
                <div className="p-1 md:p-1.5 bg-indigo-50 rounded-md text-indigo-600 shrink-0">
                  <Rss className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="font-medium text-[10px] md:text-xs hidden sm:block">Total Feed</span>
                <span className="font-medium text-[10px] sm:hidden">Feed</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-900">{allFeeds.length}</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-4 flex flex-col items-center md:items-start justify-center shadow-sm text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 text-slate-500 mb-1 md:mb-2">
                <div className="p-1 md:p-1.5 bg-rose-50 rounded-md text-rose-600 shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="font-medium text-[10px] md:text-xs">Artikel</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-900">
                {loading ? <Loader2 className="w-3 h-3 md:w-5 md:h-5 animate-spin text-slate-400 mx-auto md:mx-0" /> : articles.length}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-4 flex flex-col items-center md:items-start justify-center shadow-sm text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 text-slate-500 mb-1 md:mb-2">
                <div className="p-1 md:p-1.5 bg-amber-50 rounded-md text-amber-500 shrink-0">
                  <Star className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="font-medium text-[10px] md:text-xs">Favorit</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-900">{favoriteArticles.length}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-2 md:p-4 flex flex-col items-center md:items-start justify-center shadow-sm text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2.5 text-slate-500 mb-1 md:mb-2">
                <div className="p-1 md:p-1.5 bg-emerald-50 rounded-md text-emerald-600 shrink-0">
                  <Bookmark className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="font-medium text-[10px] md:text-xs hidden sm:block">Tersimpan</span>
                <span className="font-medium text-[10px] sm:hidden">Simpan</span>
              </div>
              <p className="text-lg md:text-2xl font-bold text-slate-900">{bookmarkedArticles.length}</p>
            </div>
          </div>

          {/* Split View Container - Takes remaining height, true split view */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 md:px-6 lg:px-8 pb-6 min-h-0 items-stretch">
            
            {/* Left Column: Article List & Filters */}
            <div className={`lg:col-span-5 h-full flex flex-col border border-slate-200 bg-white rounded-xl shadow-sm overflow-hidden ${selectedArticle ? 'hidden lg:flex' : 'flex'}`}>
              
              {/* Header - Fixed at top of column */}
              <div className="p-4 border-b border-slate-200 bg-white shrink-0 shadow-sm z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {activeTab === 'feeds' && 'Daftar Artikel'}
                    {activeTab === 'focus' && 'Artikel Fokus'}
                    {activeTab === 'favorites' && 'Artikel Favorit'}
                    {activeTab === 'idea_bank' && 'Tersimpan'}
                    {activeTab === 'platform_web_forum' && 'Platform: Web Editorial & Forum'}
                    {activeTab === 'platform_reddit' && 'Platform: Subreddit'}
                    {activeTab === 'platform_social' && 'Platform: Akun Social Media'}
                    {activeTab === 'scope_lokal' && 'Wilayah: Lokal (Indonesia)'}
                    {activeTab === 'scope_global' && 'Wilayah: Global (Internasional)'}
                    {activeTab === 'pillar_intersection' && 'Fokus: Tech & AI'}
                    {activeTab === 'pillar_gaming' && 'Fokus: Gaming'}
                    {activeTab === 'pillar_internet_culture' && 'Fokus: Internet Culture'}
                  </h2>
                  <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable List Area (Internal scrolling) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2 md:p-4 bg-slate-50/50">
                {loading && (activeTab === 'feeds' || (activeTab.startsWith('platform') || activeTab.startsWith('scope') || activeTab.startsWith('pillar')) || activeTab === 'focus') ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
                    <span className="text-sm">Menarik data dari sumber...</span>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <AlertCircle className="h-10 w-10 text-slate-300 mb-3" />
                    <p className="text-slate-500 text-sm">Tidak ada artikel yang cocok dengan filter atau pencarian Anda.</p>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4' : 'flex flex-col gap-3'}>
                    {filteredArticles.map((article, i) => {
                      const isBookmarked = bookmarkedArticles.some(b => b.id === article.link);
                      const isFavorite = favoriteArticles.some(f => f.id === article.link);
                      
                      const handleToggleBookmark = (e: React.MouseEvent) => {
                        if (isBookmarked) {
                          removeBookmark(article.link);
                        } else {
                          addBookmark({
                            id: article.link,
                            title: article.title,
                            link: article.link,
                            pubDate: article.pubDate,
                            sourceName: article.sourceName,
                            contentSnippet: article.contentSnippet,
                            thumbnail: article.thumbnail,
                          });
                        }
                      };

                      const handleToggleFavorite = (e: React.MouseEvent) => {
                        if (isFavorite) {
                          removeFavorite(article.link);
                        } else {
                          addFavorite({
                            id: article.link,
                            title: article.title,
                            link: article.link,
                            pubDate: article.pubDate,
                            sourceName: article.sourceName,
                            contentSnippet: article.contentSnippet,
                            thumbnail: article.thumbnail,
                            savedAt: Date.now(),
                          });
                        }
                      };

                      return viewMode === 'grid' ? (
                        <FeedCard 
                          key={`${article.link}-${i}`} 
                          article={article as any} 
                          onReadQuick={() => setSelectedArticle(article as any)}
                          isSelected={selectedArticle?.link === article.link}
                          isBookmarked={isBookmarked}
                          isFavorite={isFavorite}
                          onToggleBookmark={handleToggleBookmark}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ) : (
                        <CompactFeedCard 
                          key={`${article.link}-${i}`} 
                          article={article as any} 
                          onReadQuick={() => setSelectedArticle(article as any)}
                          isSelected={selectedArticle?.link === article.link}
                          isBookmarked={isBookmarked}
                          isFavorite={isFavorite}
                          onToggleBookmark={handleToggleBookmark}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Reading Pane */}
            <div className={`lg:col-span-7 h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-200 ${!selectedArticle ? 'hidden lg:flex items-center justify-center' : 'flex'}`}>
              
              {!selectedArticle ? (
                <div className="text-center p-8 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">Pilih Artikel</h3>
                  <p className="text-slate-500 text-sm max-w-sm">Klik pada salah satu kartu artikel di panel kiri untuk mulai membaca konten lengkapnya di sini.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full overflow-hidden relative">
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Header: Sticky on Mobile/Tablet only */}
                    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-6 lg:static lg:p-0 lg:mb-6 lg:px-8 lg:pt-8 lg:bg-transparent flex items-center justify-between border-b border-slate-100 lg:border-none shadow-[0_4px_10px_-5px_rgba(0,0,0,0.05)] lg:shadow-none">
                      <div className="flex items-center gap-3">
                        {/* Mobile Back Button (inline in header) */}
                        <button 
                          onClick={() => setSelectedArticle(null)}
                          className="lg:hidden p-1.5 -ml-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors flex items-center gap-1"
                        >
                          <ChevronRight className="w-5 h-5 rotate-180" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Kembali</span>
                        </button>
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider hidden sm:block">
                          {selectedArticle.sourceName}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatDistanceToNow(new Date(selectedArticle.pubDate), { addSuffix: true, locale: localeId })}
                        </span>
                      </div>
                      
                      {/* Top Right Action Buttons */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button 
                          onClick={handleToggleBookmark}
                          className={`p-2 rounded-lg transition-colors border ${
                            isSelectedBookmarked 
                              ? 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-100' 
                              : 'text-slate-400 bg-white border-slate-200 hover:text-indigo-600 hover:bg-slate-50'
                          }`}
                          title={isSelectedBookmarked ? "Hapus dari Idea Bank" : "Simpan ke Idea Bank"}
                        >
                          <Bookmark className="w-4 h-4" fill={isSelectedBookmarked ? "currentColor" : "none"} />
                        </button>
                        
                        <button 
                          onClick={handleToggleFavorite}
                          className={`p-2 rounded-lg transition-colors border ${
                            isSelectedFavorite 
                              ? 'text-amber-500 bg-amber-50 border-amber-100 hover:bg-amber-100' 
                              : 'text-slate-400 bg-white border-slate-200 hover:text-amber-500 hover:bg-slate-50'
                          }`}
                          title={isSelectedFavorite ? "Hapus dari Favorit" : "Tambahkan ke Favorit"}
                        >
                          <Star className="w-4 h-4" fill={isSelectedFavorite ? "currentColor" : "none"} />
                        </button>
                        
                        <a
                          href={selectedArticle.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 sm:gap-2 p-2 px-2 sm:px-3 rounded-lg transition-colors border border-slate-200 bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 text-sm font-medium"
                          title="Buka Sumber Asli"
                        >
                          <span className="hidden sm:inline">Sumber</span> <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    <div className="px-6 pb-6 md:px-8 md:pb-8 lg:pt-0">
                      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-8">
                        {selectedArticle.title}
                      </h1>

                      {selectedArticle.thumbnail && (
                        <div className="w-full rounded-xl overflow-hidden mb-8 border border-slate-200 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedArticle.thumbnail} alt="" className="w-full h-auto object-cover max-h-[400px]" />
                        </div>
                      )}

                      <div 
                        className="prose prose-slate prose-indigo max-w-none 
                          prose-headings:font-bold prose-headings:text-slate-900 
                          prose-p:text-slate-600 prose-p:leading-relaxed 
                          prose-a:text-indigo-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline 
                          prose-img:rounded-xl prose-img:border prose-img:border-slate-200 prose-img:shadow-sm
                          prose-ul:text-slate-600 prose-li:marker:text-indigo-500"
                        dangerouslySetInnerHTML={{ __html: selectedArticle.content || selectedArticle.contentSnippet || 'Tidak ada konten.' }}
                      />
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center shrink-0">
                    <p className="text-xs text-slate-500 font-medium hidden sm:block">
                      Diterbitkan pada {new Date(selectedArticle.pubDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <AddFeedModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFeed={addFeed}
      />
      <ManageFeedsModal
        isOpen={isManageFeedsModalOpen}
        onClose={() => setIsManageFeedsModalOpen(false)}
        feeds={allFeeds}
        onRemoveFeed={removeFeed}
        onUpdateFeed={updateFeed}
      />
    </div>
  );
}
