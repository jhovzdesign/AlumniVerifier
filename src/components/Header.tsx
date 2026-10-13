import React from 'react';
import { ShieldCheck, UserCheck, Lock, LogOut } from 'lucide-react';
import { CentralSyncIndicator } from './CentralSyncIndicator.tsx';

interface HeaderProps {
  currentTab: 'verify' | 'admin' | 'directory';
  onSelectTab: (tab: 'verify' | 'admin' | 'directory') => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  onOpenLoginModal: () => void;
  onOpenRegisterModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isAdminLoggedIn,
  onLogoutAdmin,
  onOpenLoginModal,
  onOpenRegisterModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onSelectTab('verify')}
          className="text-left group flex items-center gap-3 cursor-pointer"
        >
          <img
            src="/src/assets/images/university_seal_1790822746896.jpg"
            alt="University Seal"
            referrerPolicy="no-referrer"
            className="w-9 h-9 object-contain rounded-full shadow-xs border border-amber-600/20"
          />
          <div className="flex flex-col">
            <span className="font-cinzel text-base sm:text-lg font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors">
              Panpacific University
            </span>
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-widest -mt-1 hidden sm:block">
              Alumni QR Verification System
            </span>
          </div>
        </button>

        {/* Main Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2.5 text-xs sm:text-sm font-medium text-stone-600">
          <button
            onClick={() => onSelectTab('verify')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'verify'
                ? 'text-amber-900 font-semibold bg-amber-50 border border-amber-300/80 shadow-2xs'
                : 'hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            <span>Verification</span>
          </button>

          <button
            onClick={() => onSelectTab('directory')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'directory'
                ? 'text-amber-900 font-semibold bg-amber-50 border border-amber-300/80 shadow-2xs'
                : 'hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-800" />
            <span>Directory</span>
          </button>

          <button
            onClick={() => {
              if (isAdminLoggedIn) {
                onSelectTab('admin');
              } else {
                onOpenLoginModal();
              }
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'admin'
                ? 'text-amber-900 font-semibold bg-amber-50 border border-amber-300/80 shadow-2xs'
                : 'hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>{isAdminLoggedIn ? 'Admin Portal' : 'Staff Portal'}</span>
          </button>

          {/* Direct Quick Register Button */}
          <button
            onClick={onOpenRegisterModal}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-white bg-amber-900 hover:bg-amber-800 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs font-semibold text-xs"
            title="Register new alumni graduate & generate verified QR code"
          >
            <span>+</span>
            <span className="hidden sm:inline">Register Alumni</span>
            <span className="sm:hidden">Register</span>
          </button>
        </nav>

        {/* User Status / Actions */}
        <div className="flex items-center gap-2">
          <CentralSyncIndicator />

          {isAdminLoggedIn ? (
            <>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Admin
              </span>
              <button
                onClick={onLogoutAdmin}
                title="Log out from Admin session"
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300/80 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-800" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

