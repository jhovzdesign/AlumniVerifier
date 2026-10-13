import React, { useState, useEffect } from 'react';
import { VerificationResponse } from '../types/index.ts';
import { generateQRCodeDataUrl } from '../utils/qrReader.ts';
import { detectDegreeBatch, getDegreeBatchLabel, getDegreeBatchBadge, getHighestDegree } from '../utils/academicPrograms.ts';
import { CheckCircle2, Printer, Download, Share2, Copy, Check, ArrowLeft, ShieldCheck, ExternalLink, Award, GraduationCap, BookOpen } from 'lucide-react';


interface AlumniCertificateProps {
  data: VerificationResponse;
  onVerifyAnother: () => void;
}

export const AlumniCertificate: React.FC<AlumniCertificateProps> = ({ data, onVerifyAnother }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const alumni = data.alumni;
  const card = data.card;
  const university = data.university;

  // Format verification timestamp
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

  const shareableUrl = `${window.location.origin}/?verify=${encodeURIComponent(
    data.qr?.qr_value || alumni?.alumni_id || data.verification_reference
  )}`;

  useEffect(() => {
    // Generate QR code for verification link
    generateQRCodeDataUrl(shareableUrl, { width: 140, margin: 1 }).then(url => {
      setQrCodeDataUrl(url);
    });
  }, [shareableUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Alumni Verification: ${alumni?.full_name}`,
          text: `Official Alumni Verification Certificate for ${alumni?.full_name} (${alumni?.alumni_id}) at ${university?.name || 'Panpacific University'}.`,
          url: shareableUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    // Opens print dialog which allows "Save as PDF" cleanly with exact certificate margins
    window.print();
  };

  if (!alumni) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Action Bar (hidden in print) */}
      <div className="no-print bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onVerifyAnother}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Scan Another QR</span>
          </button>
          <div className="h-4 w-[1px] bg-stone-200 mx-1 hidden sm:block"></div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Live Database Verified</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer shadow-xs"
            title="Print Official Certificate"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            <span>Print Certificate</span>
          </button>

          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors cursor-pointer shadow-xs"
            title="Save as PDF using Print Dialog"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-md transition-colors cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Verification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verified Banner Indicator */}
      <div className="no-print bg-emerald-900 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              ✓ VERIFIED ALUMNI
            </h1>
            <p className="text-xs text-emerald-200">
              Official university record authenticated against the live Alumni Database.
            </p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">Reference</div>
          <div className="font-mono-ref text-xs text-white font-bold">{data.verification_reference}</div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THE OFFICIAL ALUMNI VERIFICATION CERTIFICATE DOCUMENT     */}
      {/* ======================================================== */}
      <div className="print-certificate-container bg-[#fcfbf7] border-[12px] border-double border-amber-900/90 rounded-sm p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden certificate-watermark">
        {/* Ornate corner accents */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-800 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-800 pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-800 pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-800 pointer-events-none"></div>

        {/* Faded Background University Seal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
          <img
            src={university?.logo_url || '/src/assets/images/university_seal_1790822746896.jpg'}
            alt=""
            className="w-[500px] h-[500px] object-contain filter grayscale"
          />
        </div>

        {/* Inner thin decorative border */}
        <div className="border border-amber-900/30 p-6 sm:p-8 relative">
          {/* Header section */}
          <div className="text-center space-y-2 mb-8">
            <div className="flex justify-center mb-3">
              <img
                src={university?.logo_url || '/src/assets/images/university_seal_1790822746896.jpg'}
                alt="University Seal"
                referrerPolicy="no-referrer"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto filter drop-shadow-sm"
              />
            </div>
            <h2 className="font-cinzel text-xl sm:text-2xl lg:text-3xl font-bold tracking-wider text-amber-950 uppercase">
              {university?.name || 'PANPACIFIC UNIVERSITY'}
            </h2>
            <div className="text-xs uppercase tracking-widest text-amber-900/80 font-semibold">
              {university?.tagline || 'Better People, Better World'} · {alumni.campus}
            </div>
            <div className="inline-block mt-1 py-1 px-4 border-y border-amber-800/40 text-[11px] sm:text-xs uppercase tracking-[0.25em] font-cinzel font-bold text-amber-900">
              OFFICIAL ALUMNI VERIFICATION
            </div>
          </div>

          {/* Certificate Main Title */}
          <div className="text-center my-6 space-y-1">
            <h1 className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-wide">
              CERTIFICATE OF ALUMNI MEMBERSHIP
            </h1>
            <p className="font-serif-official italic text-stone-600 text-sm sm:text-base pt-1">
              This is to certify that
            </p>
          </div>

          {/* Alumni Portrait & Name Block */}
          <div className="my-6 text-center">
            <div className="inline-block relative mb-3">
              <img
                src={alumni.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg'}
                alt={alumni.full_name}
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-full border-4 border-amber-800/80 shadow-md mx-auto"
              />
              <div className="absolute bottom-0 right-0 bg-emerald-600 text-white p-1 rounded-full border-2 border-white shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="font-cinzel text-2xl sm:text-3xl lg:text-4xl font-black text-amber-950 tracking-tight uppercase">
              {alumni.full_name}
            </div>
            
            <p className="font-serif-official text-stone-700 italic text-sm sm:text-base mt-2 max-w-xl mx-auto">
              is a duly registered alumnus/alumna of <span className="font-semibold text-stone-900">{university?.name || 'Panpacific University'}</span>, having fulfilled all academic requirements and obligations prescribed by the University.
            </p>
          </div>

          {/* Alumni Information Grid */}
          <div className="my-8 max-w-2xl mx-auto bg-stone-50/80 border border-amber-900/20 rounded-lg p-5 sm:p-6 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
              <div className="border-b border-stone-200/80 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Alumni ID</span>
                <span className="font-mono-ref font-bold text-stone-900 text-sm sm:text-base">{alumni.alumni_id}</span>
              </div>

              <div className="border-b border-stone-200/80 pb-2">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Alumni Card No.</span>
                <span className="font-mono-ref font-bold text-stone-900">{card?.card_number || 'N/A'}</span>
              </div>

              <div className="border-b border-stone-200/80 pb-2 sm:col-span-2">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Highest Academic Level</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-cinzel font-bold text-amber-950 text-sm sm:text-base uppercase tracking-wide">
                    {getDegreeBatchLabel(getHighestDegree(alumni))}
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${getDegreeBatchBadge(getHighestDegree(alumni)).className}`}>
                    Official University Credential
                  </span>
                </div>
              </div>

              {/* 3 BATCH ACADEMIC PROGRAM RECORDS */}
              <div className="sm:col-span-2 border-y border-amber-900/20 py-3 my-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-amber-900 font-bold font-cinzel">
                    Academic Degree Records (3 Batches)
                  </span>
                  <span className="text-[10px] text-stone-500">Official Curriculum Registry</span>
                </div>

                {/* Batch 1: Bachelor's Degree (Mandatory) */}
                <div className="p-3 rounded-md bg-white border border-blue-200/90 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase tracking-wider flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      <span>Batch 1: Bachelor's Degree (Foundational)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Conferred</span>
                    </span>
                  </div>
                  <div className="font-semibold text-stone-900 text-xs sm:text-sm">
                    {alumni.program}
                  </div>
                  <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3">
                    <span>{alumni.college}</span>
                    {alumni.major && <span>• Major in {alumni.major}</span>}
                    <span>• Class of {alumni.graduation_year}</span>
                    <span>• {alumni.campus}</span>
                  </div>
                </div>

                {/* Batch 2: Master's Degree (Optional / If Applicable) */}
                <div className={`p-3 rounded-md border shadow-2xs space-y-1 ${
                  alumni.has_masters && alumni.masters_program
                    ? 'bg-white border-purple-200/90'
                    : 'bg-stone-100/70 border-stone-200/70'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>Batch 2: Master's Degree (If Applicable)</span>
                    </span>
                    {alumni.has_masters && alumni.masters_program ? (
                      <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Conferred</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 italic">
                        Not Applicable / No Master's Degree Recorded
                      </span>
                    )}
                  </div>
                  {alumni.has_masters && alumni.masters_program ? (
                    <>
                      <div className="font-semibold text-stone-900 text-xs sm:text-sm">
                        {alumni.masters_program}
                      </div>
                      <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3">
                        <span>{alumni.masters_college || 'School of Advanced Studies'}</span>
                        {alumni.masters_major && <span>• Specialization in {alumni.masters_major}</span>}
                        {alumni.masters_year && <span>• Class of {alumni.masters_year}</span>}
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Batch 3: Doctorate Degree (Optional / If Applicable) */}
                <div className={`p-3 rounded-md border shadow-2xs space-y-1 ${
                  alumni.has_doctorate && alumni.doctorate_program
                    ? 'bg-white border-amber-300'
                    : 'bg-stone-100/70 border-stone-200/70'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>Batch 3: Doctorate Degree (If Applicable)</span>
                    </span>
                    {alumni.has_doctorate && alumni.doctorate_program ? (
                      <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Conferred</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-500 italic">
                        Not Applicable / No Doctorate Degree Recorded
                      </span>
                    )}
                  </div>
                  {alumni.has_doctorate && alumni.doctorate_program ? (
                    <>
                      <div className="font-semibold text-stone-900 text-xs sm:text-sm">
                        {alumni.doctorate_program}
                      </div>
                      <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3">
                        <span>{alumni.doctorate_college || 'School of Advanced Studies'}</span>
                        {alumni.doctorate_major && <span>• Research / Specialization: {alumni.doctorate_major}</span>}
                        {alumni.doctorate_year && <span>• Class of {alumni.doctorate_year}</span>}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>


              <div className="pt-1">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Membership Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  ACTIVE
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[11px] uppercase tracking-wider text-stone-500 font-semibold block">Card Validity</span>
                <span className="text-stone-700">
                  Valid until {card ? new Date(card.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Official Verification Statement */}
          <div className="text-center my-6 max-w-xl mx-auto">
            <blockquote className="font-serif-official italic text-xs sm:text-sm text-stone-700 leading-relaxed border-y border-amber-900/20 py-3">
              "This certificate confirms that the individual identified above is a registered alumnus/alumna of {university?.name || 'Panpacific University'}, based on the University's official Alumni Database."
            </blockquote>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-stone-600">
              <span className="font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verification Status: <strong>✓ VERIFIED</strong></span>
              </span>
              <span>·</span>
              <span>Date Verified: <strong>{formattedDate}</strong></span>
              <span>·</span>
              <span>Time: <strong>{formattedTime}</strong></span>
            </div>
          </div>

          {/* Signatories & Official Seal */}
          <div className="mt-10 pt-6 border-t border-amber-900/30 grid grid-cols-1 sm:grid-cols-3 items-end gap-6 text-center">
            {/* Signatory 1 */}
            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif-official italic text-amber-900 text-lg opacity-80 select-none">
                  Ferdinand V. Ramirez
                </span>
              </div>
              <div className="border-t border-stone-400 pt-1">
                <div className="font-bold text-stone-900 text-xs sm:text-sm">
                  {university?.registrar_signatory || 'Dr. Ferdinand V. Ramirez'}
                </div>
                <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider">
                  University Registrar
                </div>
              </div>
            </div>

            {/* University Embossed Seal Stamp */}
            <div className="flex flex-col items-center justify-center order-first sm:order-none mb-2 sm:mb-0">
              <div className="w-20 h-20 rounded-full border-2 border-amber-800 p-1 flex items-center justify-center bg-amber-50 shadow-inner">
                <div className="w-full h-full rounded-full border border-dashed border-amber-700 flex flex-col items-center justify-center text-center p-1">
                  <div className="font-cinzel text-[7px] font-extrabold uppercase text-amber-900 leading-tight">
                    OFFICIAL
                  </div>
                  <div className="font-cinzel text-[9px] font-black text-amber-950">
                    SEAL
                  </div>
                  <div className="font-mono text-[7px] text-amber-800">
                    PU-ALUMNI
                  </div>
                </div>
              </div>
            </div>

            {/* Signatory 2 */}
            <div className="space-y-1">
              <div className="h-10 flex items-center justify-center">
                <span className="font-serif-official italic text-amber-900 text-lg opacity-80 select-none">
                  Mary Grace L. Concepcion
                </span>
              </div>
              <div className="border-t border-stone-400 pt-1">
                <div className="font-bold text-stone-900 text-xs sm:text-sm">
                  {university?.alumni_director_signatory || 'Prof. Mary Grace L. Concepcion'}
                </div>
                <div className="text-[10px] sm:text-xs text-stone-500 uppercase tracking-wider">
                  Director, Alumni Affairs
                </div>
              </div>
            </div>
          </div>

          {/* Certificate Footer with Live Verification QR & Reference */}
          <div className="mt-8 pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Verification QR"
                  className="w-16 h-16 border border-stone-300 bg-white p-0.5 rounded shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 bg-stone-100 border border-stone-300 rounded flex items-center justify-center text-[10px] text-stone-400">
                  QR
                </div>
              )}
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold">
                  Verification Reference
                </div>
                <div className="font-mono-ref text-xs sm:text-sm font-bold text-stone-900 tracking-wider">
                  {data.verification_reference}
                </div>
                <div className="text-[10px] text-stone-500">
                  Verified through the Official Alumni Verification System
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right space-y-0.5">
              <div className="text-[10px] text-stone-400">
                Panpacific University Alumni Registry
              </div>
              <div className="text-[10px] text-stone-500 font-mono">
                SEC / CHED Reg. Accredited Institution
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Verification Link (useful for copying or testing) */}
      <div className="no-print bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-stone-600 truncate w-full sm:w-auto">
          <ExternalLink className="w-4 h-4 text-stone-400 shrink-0" />
          <span className="font-medium text-stone-700">Permanent Verification Link:</span>
          <span className="font-mono text-stone-500 truncate">{shareableUrl}</span>
        </div>
        <button
          onClick={handleShare}
          className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded text-stone-800 font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};
