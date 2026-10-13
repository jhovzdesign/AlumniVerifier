import React from 'react';
import { VerificationResponse } from '../types/index.ts';
import { ShieldAlert, ArrowLeft, Ban } from 'lucide-react';

interface RevokedCardNoticeProps {
  data: VerificationResponse;
  onVerifyAnother: () => void;
}

export const RevokedCardNotice: React.FC<RevokedCardNoticeProps> = ({ data, onVerifyAnother }) => {
  const alumni = data.alumni;
  const card = data.card;

  const dateObj = new Date(data.verified_at);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={onVerifyAnother}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Verify Another QR</span>
        </button>
        <span className="font-mono-ref text-xs text-stone-500 font-medium">
          Ref: {data.verification_reference}
        </span>
      </div>

      <div className="bg-white border-2 border-red-500 rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
            <Ban className="w-7 h-7 text-red-600" />
          </div>
          <div className="space-y-1">
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
              Security Notice: Card Inactive
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-red-950 tracking-tight">
              ⚠ ALUMNI CARD REVOKED
            </h1>
            <p className="text-sm font-semibold text-red-700">
              "This alumni card is no longer valid."
            </p>
          </div>
        </div>

        {/* Revoked Alumni Card Summary */}
        <div className="mt-6 bg-red-50/50 border border-red-200 rounded-xl p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Alumni Name</span>
              <span className="font-cinzel text-base font-bold text-stone-900">{alumni?.full_name || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Alumni ID</span>
              <span className="font-mono-ref text-base font-bold text-stone-900">{alumni?.alumni_id || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Card Number</span>
              <span className="font-mono-ref font-bold text-stone-800">{card?.card_number || 'N/A'}</span>
            </div>

            <div>
              <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Card Status</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-red-700 uppercase">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                REVOKED / VOID
              </span>
            </div>
          </div>
        </div>

        {/* Institutional notice */}
        <div className="mt-5 p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-stone-800">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Official University Registrar Advisement</span>
          </div>
          <p>
            This alumni card has been officially cancelled, flagged as lost/stolen, or invalidated by the Panpacific University Office of Alumni Affairs. The cardholder must not present this card for university facility access or privileges.
          </p>
        </div>

        {/* Verification Timestamp and Reference */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-500">
          <div>
            <span>Verification Date: <strong>{formattedDate}</strong> at {formattedTime}</span>
          </div>
          <div>
            <span>Reference: <strong className="font-mono text-stone-700">{data.verification_reference}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
