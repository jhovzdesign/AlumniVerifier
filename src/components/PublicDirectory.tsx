import React, { useState, useEffect } from 'react';
import { Alumni, AlumniCard, AlumniQRCode, DegreeBatch } from '../types/index.ts';
import { fetchAlumniList } from '../utils/api.ts';
import { detectDegreeBatch, getDegreeBatchBadge, getHighestDegree } from '../utils/academicPrograms.ts';
import { useCentralSync } from '../context/SyncContext.tsx';
import { Search, GraduationCap, CheckCircle2, ArrowRight, ShieldCheck, Filter, Award, BookOpen, Cloud, Radio } from 'lucide-react';

interface PublicDirectoryProps {
  onSelectAlumnus: (token: string) => void;
  onOpenRegisterModal?: () => void;
}

export const PublicDirectory: React.FC<PublicDirectoryProps> = ({ onSelectAlumnus, onOpenRegisterModal }) => {
  const { registerListener, connectedDevices, version } = useCentralSync();
  const [alumni, setAlumni] = useState<Array<Alumni & { card?: AlumniCard; qr?: AlumniQRCode }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [selectedDegree, setSelectedDegree] = useState<'ALL' | DegreeBatch>('ALL');

  const loadAlumni = () => {
    setIsLoading(true);
    fetchAlumniList()
      .then(res => setAlumni(res))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAlumni();
  }, []);

  // Multi-device real-time sync: when any authorized device adds, edits, or deletes an alumnus, reflect live
  useEffect(() => {
    const unregister = registerListener(event => {
      if (
        event.action === 'CREATE_ALUMNI' ||
        event.action === 'UPDATE_ALUMNI' ||
        event.action === 'DELETE_ALUMNI' ||
        event.action === 'UPDATE_CARD_STATUS' ||
        event.action === 'EXTERNAL_SYNC'
      ) {
        loadAlumni();
      }
    });
    return unregister;
  }, [registerListener]);

  const filtered = alumni.filter(item => {
    const q = query.toLowerCase();
    const matchesSearch =
      item.first_name.toLowerCase().includes(q) ||
      item.last_name.toLowerCase().includes(q) ||
      item.alumni_id.toLowerCase().includes(q) ||
      item.program.toLowerCase().includes(q) ||
      (item.masters_program || '').toLowerCase().includes(q) ||
      (item.doctorate_program || '').toLowerCase().includes(q);

    const matchesCampus =
      selectedCampus === 'ALL' || item.campus === selectedCampus;

    const highestDegree = getHighestDegree(item);
    const matchesDegree =
      selectedDegree === 'ALL'
        ? true
        : selectedDegree === 'DOCTORATE'
        ? item.has_doctorate || highestDegree === 'DOCTORATE'
        : selectedDegree === 'MASTERS'
        ? item.has_masters || highestDegree === 'MASTERS'
        : true;

    return matchesSearch && matchesCampus && matchesDegree;
  });


  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      <div className="text-center space-y-2 pt-2">
        <h1 className="font-cinzel text-3xl font-bold text-stone-900">
          Public Alumni Roster
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto">
          Explore registered graduates across Bachelor's, Master's, and Doctorate programs and authenticate digital certificates in real time.
        </p>

        <div className="flex items-center justify-center gap-2 pt-1 text-xs text-stone-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Centralized Cloud Database: Live</span>
            <span className="text-emerald-400">·</span>
            <span className="text-[11px] text-stone-600 font-mono">v{version}</span>
            <span className="text-emerald-400">·</span>
            <span className="text-[11px] text-stone-600">{connectedDevices} device{connectedDevices !== 1 ? 's' : ''} synced</span>
          </span>
        </div>

        {/* 3 Batch Quick Selector Bar */}
        <div className="pt-2 flex flex-wrap justify-center gap-2">
          {[
            { id: 'ALL', label: 'All Degrees' },
            { id: 'BACHELORS', label: "Bachelor's Degree" },
            { id: 'MASTERS', label: "Master's Degree" },
            { id: 'DOCTORATE', label: 'Doctorate Degree' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedDegree(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                selectedDegree === tab.id
                  ? 'bg-amber-900 text-white border-amber-950 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, Alumni ID (PU-2024-XXXXX), program title..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-800/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="text-xs border border-stone-300 rounded-lg px-3 py-2 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-800 w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">All Campuses</option>
            <option value="Urdaneta Campus">Urdaneta Campus</option>
            <option value="Tayug Campus">Tayug Campus</option>
            <option value="Main Campus">Main Campus</option>
          </select>

          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
              title="Register new alumni graduate"
            >
              <span>+</span>
              <span className="hidden sm:inline">Register Alumni</span>
              <span className="sm:hidden">Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const degreeLevel = item.degree_level || detectDegreeBatch(item.program);
          const badge = getDegreeBatchBadge(degreeLevel);

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={item.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg'}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-stone-200 shrink-0"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <span className={`inline-block text-[9px] px-1.5 py-0.2 rounded border uppercase tracking-wider font-semibold mb-1 ${badge.className}`}>
                      {badge.label}
                    </span>
                    <h3 className="font-cinzel text-sm sm:text-base font-bold text-stone-900 truncate">
                      {item.first_name} {item.last_name} {item.suffix}
                    </h3>
                    <div className="font-mono text-[11px] text-amber-900 font-semibold">
                      {item.alumni_id}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                      <span>Class of {item.graduation_year}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 text-xs space-y-1.5">
                  <div>
                    <div className="font-semibold text-stone-800 line-clamp-1">{item.program}</div>
                    <div className="text-stone-500 text-[11px]">{item.campus} · Class of {item.graduation_year}</div>
                  </div>

                  {item.has_masters && item.masters_program && (
                    <div className="p-1.5 rounded bg-purple-50/70 border border-purple-100">
                      <div className="text-[10px] font-bold text-purple-900 flex items-center gap-1">
                        <BookOpen className="w-2.5 h-2.5 text-purple-700" />
                        <span>Master's Degree ({item.masters_year || 'Conferred'})</span>
                      </div>
                      <div className="text-[11px] text-purple-950 font-medium truncate">
                        {item.masters_program}
                      </div>
                    </div>
                  )}

                  {item.has_doctorate && item.doctorate_program && (
                    <div className="p-1.5 rounded bg-amber-50/70 border border-amber-200">
                      <div className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                        <Award className="w-2.5 h-2.5 text-amber-700" />
                        <span>Doctorate Degree ({item.doctorate_year || 'Conferred'})</span>
                      </div>
                      <div className="text-[11px] text-amber-950 font-medium truncate">
                        {item.doctorate_program}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  item.card?.status === 'ACTIVE'
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : item.card?.status === 'EXPIRED'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-red-800 bg-red-50 border-red-200'
                }`}>
                  Card: {item.card?.status || 'UNASSIGNED'}
                </span>

                <button
                  onClick={() => onSelectAlumnus(item.qr?.qr_value || item.alumni_id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-700 cursor-pointer"
                >
                  <span>Verify QR</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200 text-stone-500 space-y-2">
          <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
          <div className="text-sm font-semibold">No alumni records match your query.</div>
          <p className="text-xs text-stone-400">Try adjusting your degree level batch or search keywords.</p>
        </div>
      )}
    </div>
  );
};

