import React, { useState, useEffect, useRef } from 'react';
import { SyncProvider, useCentralSync } from './context/SyncContext.tsx';
import { Header } from './components/Header.tsx';
import { QRVerificationSection } from './components/QRVerificationSection.tsx';
import { AlumniCertificate } from './components/AlumniCertificate.tsx';
import { ExpiredCardNotice } from './components/ExpiredCardNotice.tsx';
import { RevokedCardNotice } from './components/RevokedCardNotice.tsx';
import { NotFoundNotice } from './components/NotFoundNotice.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { PublicDirectory } from './components/PublicDirectory.tsx';
import { AdminLoginModal } from './components/AdminLoginModal.tsx';
import { RegisterAlumniModal } from './components/RegisterAlumniModal.tsx';
import { VerificationResponse } from './types/index.ts';
import { verifyQRCode } from './utils/api.ts';
import { Lock } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<'verify' | 'admin' | 'directory'>('verify');
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Register Alumni Modal state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerInitialQR, setRegisterInitialQR] = useState<string | undefined>(undefined);

  // Initialize from session
  useEffect(() => {
    const saved = localStorage.getItem('alumni_admin_session');
    if (saved) {
      try {
        setIsAdminLoggedIn(true);
      } catch {
        localStorage.removeItem('alumni_admin_session');
      }
    }
  }, []);

  // Check URL parameters for direct verification links (e.g. ?verify=PU-ALUMNI-2024-00123-VERIFY)
  useEffect(() => {
    let token: string | null = null;

    // 1. Query parameters
    const params = new URLSearchParams(window.location.search);
    token = params.get('verify') || params.get('token') || params.get('ref') || params.get('id') || params.get('alumni_id');

    // 2. Hash parameters (e.g. #verify=... or #PU-ALUMNI-...)
    if (!token && window.location.hash) {
      const hashStr = window.location.hash.replace(/^#\/?/, '').trim();
      const hashParams = new URLSearchParams(hashStr);
      token = hashParams.get('verify') || hashParams.get('token') || hashParams.get('ref');
      if (!token && hashStr.toUpperCase().startsWith('PU-')) {
        token = hashStr;
      }
    }

    // 3. Pathname (e.g. /verify/PU-ALUMNI-2024-00123-VERIFY)
    if (!token && window.location.pathname.includes('/verify/')) {
      const parts = window.location.pathname.split('/verify/').filter(Boolean);
      if (parts[0]) {
        token = decodeURIComponent(parts[0].split('/')[0]);
      }
    }

    if (token && token.trim()) {
      handleVerify(token.trim());
    }
  }, []);

  const { registerListener } = useCentralSync();
  const activeTokenRef = useRef<string | null>(null);

  const handleVerify = async (token: string) => {
    activeTokenRef.current = token;
    setIsVerifying(true);
    setErrorMessage(null);
    setCurrentTab('verify');

    try {
      const response = await verifyQRCode(token);
      setVerificationResult(response);
      // Update browser URL without reload so user can share directly
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('verify', token);
      window.history.replaceState({}, '', newUrl.toString());
    } catch (err: any) {
      console.error('Verification query failed:', err);
      setErrorMessage(err.message || 'Unable to connect to live university verification database.');
      // If error occurs, we can show error or not found
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetVerification = () => {
    activeTokenRef.current = null;
    setVerificationResult(null);
    setErrorMessage(null);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('verify');
    newUrl.searchParams.delete('token');
    newUrl.searchParams.delete('ref');
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Cross-device real-time sync: if a card status or alumnus data changes on another device, re-verify live
  useEffect(() => {
    const unregister = registerListener((event) => {
      if (
        activeTokenRef.current &&
        (event.action === 'UPDATE_CARD_STATUS' || event.action === 'UPDATE_ALUMNI' || event.action === 'DELETE_ALUMNI' || event.action === 'EXTERNAL_SYNC')
      ) {
        handleVerify(activeTokenRef.current);
      }
    });
    return unregister;
  }, [registerListener]);

  const handleLogoutAdmin = () => {
    localStorage.removeItem('alumni_admin_session');
    setIsAdminLoggedIn(false);
    if (currentTab === 'admin') {
      setCurrentTab('verify');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/70 text-stone-900">
      {/* Top Bar */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'verify') {
            handleResetVerification();
          }
          setCurrentTab(tab);
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogoutAdmin={handleLogoutAdmin}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenRegisterModal={() => {
          setRegisterInitialQR(undefined);
          setIsRegisterModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'verify' && (
          <div>
            {/* If we have an active verification result, render appropriate state */}
            {verificationResult ? (
              <div>
                {/* STATE 1: VERIFIED ALUMNI */}
                {verificationResult.result === 'VERIFIED' && (
                  <AlumniCertificate
                    data={verificationResult}
                    onVerifyAnother={handleResetVerification}
                  />
                )}

                {/* STATE 2: ALUMNI VERIFIED - CARD EXPIRED */}
                {verificationResult.result === 'EXPIRED' && (
                  <ExpiredCardNotice
                    data={verificationResult}
                    onVerifyAnother={handleResetVerification}
                  />
                )}

                {/* STATE 3: ALUMNI CARD REVOKED */}
                {verificationResult.result === 'REVOKED' && (
                  <RevokedCardNotice
                    data={verificationResult}
                    onVerifyAnother={handleResetVerification}
                  />
                )}

                {/* STATE 4: NOT AN ALUMNI MEMBER */}
                {verificationResult.result === 'NOT_FOUND' && (
                  <NotFoundNotice
                    data={verificationResult}
                    onVerifyAnother={handleResetVerification}
                    onRegisterThisAlumni={(qr) => {
                      setRegisterInitialQR(qr || undefined);
                      setIsRegisterModalOpen(true);
                    }}
                  />
                )}
              </div>
            ) : (
              /* Verification Entry View */
              <QRVerificationSection
                onVerify={handleVerify}
                isLoading={isVerifying}
                errorMessage={errorMessage}
              />
            )}
          </div>
        )}

        {currentTab === 'directory' && (
          <PublicDirectory
            onSelectAlumnus={(token) => handleVerify(token)}
            onOpenRegisterModal={() => {
              setRegisterInitialQR(undefined);
              setIsRegisterModalOpen(true);
            }}
          />
        )}

        {currentTab === 'admin' && (
          <div>
            {isAdminLoggedIn ? (
              <AdminDashboard
                onTestVerify={(token) => handleVerify(token)}
              />
            ) : (
              <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h2 className="font-cinzel text-xl font-bold text-stone-900">
                  Authentication Required
                </h2>
                <p className="text-xs text-stone-600">
                  You must be logged in as an authorized University Administrator to view the management console.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    Sign In to Admin Portal
                  </button>
                  <button
                    onClick={() => {
                      setRegisterInitialQR(undefined);
                      setIsRegisterModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    + Register Alumni Record
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setCurrentTab('admin');
        }}
      />

      {/* Universal Register Alumni Modal */}
      <RegisterAlumniModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialQR={registerInitialQR}
        onSuccess={(created) => {
          if (created?.qr?.qr_value) {
            handleVerify(created.qr.qr_value);
          }
        }}
      />

      {/* Official Institutional Footer (hidden in print) */}
      <footer className="no-print border-t border-stone-200 bg-white py-8 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <img
              src="/src/assets/images/university_seal_1790822746896.jpg"
              alt="Seal"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-contain grayscale opacity-80"
            />
            <div>
              <div className="font-cinzel font-bold text-stone-800 text-xs">
                PANPACIFIC UNIVERSITY · OFFICE OF ALUMNI AFFAIRS
              </div>
              <div className="text-[11px] text-stone-400">
                Official Live QR Card Verification & Digital Certificate System
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:items-end text-center sm:text-right space-y-1 text-[11px]">
            <div>Accredited Higher Education Institution</div>
            <div className="text-stone-400">All queries authenticated against real-time university database</div>

            <div className="pt-1">
              {isAdminLoggedIn ? (
                <div className="flex items-center gap-2 text-stone-500 justify-center sm:justify-end">
                  <span className="flex items-center gap-1 text-emerald-800 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Admin Session Active
                  </span>
                  <span>·</span>
                  <button
                    onClick={handleLogoutAdmin}
                    className="text-stone-400 hover:text-stone-700 underline cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-stone-400 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer transition-colors justify-center sm:justify-end"
                >
                  <Lock className="w-3 h-3 text-stone-400" />
                  <span>Registrar Staff Portal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <SyncProvider>
      <AppContent />
    </SyncProvider>
  );
}

