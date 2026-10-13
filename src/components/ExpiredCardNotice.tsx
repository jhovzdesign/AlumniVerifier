import React from 'react';
import { VerificationResponse } from '../types/index.ts';
import { AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface ExpiredCardNoticeProps {
  data: VerificationResponse;
  onVerifyAnother: () => void;
}

export const ExpiredCardNotice: React.FC<ExpiredCardNoticeProps> = ({ data, onVerifyAnother }) => {
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
      {/* Top action */}
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

      {/* Main Expired Warning Card */}
      <div className="bg-white border-2 border-amber-500/80 rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        {/* Banner */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7 text-amber-700" />
          </div>
          <div className="space-y-1">
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Status Notice: Card Expired
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              ⚠ ALUMNI CARD EXPIRED
            </h1>
            <p className="text-sm font-medium text-amber-800">
              "This alumni card has expired."
            </p>
          </div>
        </div>

        {/* Critical Distinction Box: Alumni Membership vs Card Status */}
        <div className="mt-6 bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5">
          <div className="text-xs uppercase font-semibold text-stone-500 tracking-wider mb-3">
            Official Status Classification
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-white border border-stone-200 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Alumni Membership</div>
                <div className="text-sm font-bold text-emerald-700">✓ VERIFIED ALUMNUS</div>
              </div>
            </div>

            <div className="p-3 bg-white border border-amber-300 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold">Card Status</div>
                <div className="text-sm font-bold text-amber-800">EXPIRED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Alumni & Card Details */}
        {alumni && (
          <div className="mt-6 border-t border-stone-200 pt-5 space-y-3">
            <div className="flex items-center gap-4">
              <img
                src={alumni.photo_url}
                alt={alumni.full_name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-amber-300 shrink-0"
              />
              <div>
                <h3 className="font-cinzel text-lg font-bold text-stone-900">{alumni.full_name}</h3>
                <p className="text-xs text-stone-600">{alumni.program} · Class of {alumni.graduation_year}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                  <span>Alumni ID: <strong className="font-mono text-stone-800">{alumni.alumni_id}</strong></span>
                  <span>·</span>
                  <span>Card No: <strong className="font-mono text-stone-800">{card?.card_number || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Renewal Required for Physical Privileges:</span>
              </div>
              <p>
                The individual is confirmed to be an alumnus/alumna of Panpacific University. However, the physical identification card expired on <strong>{card?.expiration_date ? new Date(card.expiration_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</strong>. Please proceed to the Alumni Affairs Office for renewal.
              </p>
            </div>
          </div>
        )}

        {/* Verification Event Details */}
        <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between text-xs text-stone-500">
          <div>
            <span>Verified: <strong>{formattedDate}</strong> at {formattedTime}</span>
          </div>
          <div>
            <span>Reference: <strong className="font-mono text-stone-700">{data.verification_reference}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
