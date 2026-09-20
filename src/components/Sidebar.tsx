"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Inbox, 
  Target, 
  Star, 
  Bookmark, 
  Cpu, 
  Gamepad2, 
  Globe, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Settings, 
  Plus, 
  X,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react';

export type MainTab = 
  | 'feeds' 
  | 'focus' 
  | 'favorites' 
  | 'idea_bank' 
  | 'platform_web_forum'
  | 'platform_reddit'
  | 'platform_social'
  | 'scope_lokal'
  | 'scope_global'
  | 'pillar_intersection' 
  | 'pillar_gaming' 
  | 'pillar_internet_culture';

interface SidebarProps {
  activeTab: MainTab;
  setActiveTab: (tab: MainTab) => void;
  onAddFeed: () => void;
  onManageFeeds: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onAddFeed, 
  onManageFeeds, 
  isMobileOpen, 
  onCloseMobile,
  onLogout
}: SidebarProps) {
  const bookmarkedArticles: any[] = [];
  const favoriteArticles: any[] = [];
  const customFeedsCount = 0;
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>('platform');

  // Helper to render navigation items
  const NavItem = ({ 
    id, 
    icon: Icon, 
    label, 
    count 
  }: { 
    id: MainTab | 'manage', 
    icon: any, 
    label: string, 
    count?: number 
  }) => {
    const isActive = activeTab === id;
    const isManage = id === 'manage';

    const handleClick = () => {
      if (isManage) {
        onManageFeeds();
      } else {
        setActiveTab(id as MainTab);
      }
      if (onCloseMobile) onCloseMobile();
    };


  return (
      <button
        onClick={handleClick}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-md transition-colors group ${
          isActive 
            ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'group-hover:text-slate-200'}`} />
          {!isCollapsed && <span className="text-sm">{label}</span>}
        </div>
        {!isCollapsed && count !== undefined && count > 0 && (
          <span className={`py-0.5 px-2 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-300'
          }`}>
            {count}
          </span>
        )}
        {/* Mobile/Collapsed Badge fallback */}
        {isCollapsed && count !== undefined && count > 0 && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
        )}
      </button>
    );
  };

  const AccordionItem = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => {
    const isOpen = openAccordion === id;
    return (
      <div className="space-y-1">
        <button
          onClick={() => {
            if (isCollapsed) setIsCollapsed(false);
            setOpenAccordion(isOpen ? null : id);
          }}
          title={isCollapsed ? label : undefined}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${isOpen && !isCollapsed ? 'text-indigo-400 font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
          <span className="text-sm">{isCollapsed ? label.substring(0,2).toUpperCase() : label}</span>
          {!isCollapsed && (
            isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {isOpen && !isCollapsed && (
          <div className="pl-2 space-y-1 border-l border-slate-700/50 ml-3 mt-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-[100] bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Logo Area */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'} border-b border-slate-800 shrink-0`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/zeinity.ico" alt="ZeinityFeed Logo" className="w-full h-full object-contain" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl tracking-tight text-white">
                ZeinityFeed
              </span>
            )}
          </div>
          
          {/* Close button for mobile */}
          {!isCollapsed && (
            <button 
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Button */}
        <div className={`p-4 shrink-0 border-b border-slate-800/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => {
              onAddFeed();
              if (onCloseMobile) onCloseMobile();
            }}
            title={isCollapsed ? "Tambah Feed Baru" : undefined}
            className={`flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-sm ${
              isCollapsed ? 'w-10 h-10 p-0' : 'w-full px-4 py-2.5'
            }`}
          >
            <Plus className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span>Tambah Feed</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Main Nav Group */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Navigasi Feed</p>
            )}
            <div className="space-y-1 relative">
              <NavItem id="feeds" icon={Inbox} label="Semua Artikel" />
              <NavItem id="focus" icon={Target} label="Fokus" />
              <NavItem id="favorites" icon={Star} label="Favorit" count={favoriteArticles.length} />
              <NavItem id="idea_bank" icon={Bookmark} label="Tersimpan" count={bookmarkedArticles.length} />
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/50"></div>

          {/* Folders Group */}
          <div>
            {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</p>
            )}
            <div className="space-y-2">
              <AccordionItem id="platform" label="Kategori Platform">
                <NavItem id="platform_web_forum" icon={Cpu} label="Web Editorial & Forum" />
                <NavItem id="platform_reddit" icon={Globe} label="Subreddit" />
                <NavItem id="platform_social" icon={Gamepad2} label="Akun Social Media" />
              </AccordionItem>
              <AccordionItem id="scope" label="Cakupan Wilayah">
                <NavItem id="scope_lokal" icon={Target} label="Lokal (Indonesia)" />
                <NavItem id="scope_global" icon={Globe} label="Global (Internasional)" />
              </AccordionItem>
              <AccordionItem id="pillar" label="Fokus Pilar Topik">
                <NavItem id="pillar_intersection" icon={Cpu} label="Tech & AI" />
                <NavItem id="pillar_gaming" icon={Gamepad2} label="Gaming" />
                <NavItem id="pillar_internet_culture" icon={Globe} label="Internet Culture" />
              </AccordionItem>
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/50"></div>

          {/* Management Group */}
          <div>
             {!isCollapsed && (
              <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Manajemen</p>
            )}
            <div className="space-y-1">
              <NavItem id="manage" icon={Settings} label="Pengaturan Feed" count={customFeedsCount} />
            </div>
          </div>

        </nav>

        {/* Footer: Logout + Collapse */}
        <div className="p-3 border-t border-slate-800 flex flex-col gap-2 shrink-0">
          {onLogout && (
            <button
              onClick={onLogout}
              title="Keluar"
              className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-3'} p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors group`}
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="text-sm font-medium">Keluar</span>}
              </div>
              {!isCollapsed && user && (
                <span className="text-[10px] bg-slate-800 group-hover:bg-rose-500/20 px-2 py-0.5 rounded text-slate-400 group-hover:text-rose-400 truncate max-w-[100px]" title={user.email || ""}>
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

      </aside>
    </>
  );
}
