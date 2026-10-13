import React from 'react';
import { VerificationResponse } from '../types/index.ts';
import { XCircle, ArrowLeft, ShieldX, HelpCircle } from 'lucide-react';

interface NotFoundNoticeProps {
  data: VerificationResponse;
  onVerifyAnother: () => void;
  onRegisterThisAlumni?: (qrToken: string) => void;
}

export const NotFoundNotice: React.FC<NotFoundNoticeProps> = ({ data, onVerifyAnother, onRegisterThisAlumni }) => {
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

  const queryToken = data.token_queried || '';

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={onVerifyAnother}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Scan Another QR Code</span>
        </button>
        <span className="font-mono-ref text-xs text-stone-400">
          Ref: {data.verification_reference}
        </span>
      </div>

      <div className="bg-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-stone-800 text-center relative overflow-hidden">
        {/* Top Warning Icon */}
        <div className="w-20 h-20 rounded-full bg-red-950/80 border-2 border-red-500/60 mx-auto flex items-center justify-center mb-5 shadow-inner">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>

        {/* State 4 Title */}
        <div className="space-y-1">
          <div className="inline-block text-[11px] font-bold uppercase tracking-widest text-red-400 bg-red-950/60 px-3 py-0.5 rounded-full border border-red-900/60">
            QR CODE NOT REGISTERED
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-black text-red-500 tracking-tight">
            ❌ NOT AN ALUMNI MEMBER
          </h1>
        </div>

        {/* Official statement */}
        <div className="my-6 py-4 px-6 bg-stone-950/60 rounded-xl border border-stone-800 max-w-md mx-auto">
          <p className="text-sm sm:text-base text-stone-300 font-serif-official italic leading-relaxed">
            "This QR code is not registered in the official Alumni Database of Panpacific University."
          </p>
        </div>

        {/* Verification Result Meta */}
        <div className="max-w-md mx-auto bg-stone-800/40 rounded-lg p-4 border border-stone-800/80 text-xs space-y-2 text-stone-400">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="uppercase tracking-wider text-[11px] font-medium text-stone-400">Verification Result:</span>
            <span className="font-bold text-red-400 font-mono tracking-wider">NOT FOUND</span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <span className="uppercase tracking-wider text-[11px] font-medium text-stone-400">Verification Reference:</span>
            <span className="font-mono text-stone-200">{data.verification_reference}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wider text-[11px] font-medium text-stone-400">Timestamp:</span>
            <span className="text-stone-300">{formattedDate} · {formattedTime}</span>
          </div>
        </div>

        {/* Security and Fraud Notice */}
        <div className="mt-6 text-left p-4 bg-stone-950/80 border border-stone-800 rounded-xl text-xs text-stone-400 flex items-start gap-3">
          <ShieldX className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-stone-200">Security & Privacy Protocol</div>
            <p className="text-[11px] text-stone-400 leading-normal">
              To prevent unauthorized data harvesting and preserve academic record confidentiality, no private names, student records, or university identities are disclosed for unregistered QR tokens.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onVerifyAnother}
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Scan Another QR Code
          </button>

          {onRegisterThisAlumni && (
            <button
              onClick={() => onRegisterThisAlumni(queryToken)}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>+</span>
              <span>Register Alumni With This QR Code</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
