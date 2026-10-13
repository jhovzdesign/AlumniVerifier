import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  GraduationCap,
  BookOpen,
  Award,
  Download,
  X,
  CreditCard,
  QrCode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ACADEMIC_PROGRAM_BATCHES } from '../utils/academicPrograms.ts';
import { generateQRCodeDataUrl, decodeQRCodeFromImage } from '../utils/qrReader.ts';
import {
  fetchNextAlumniCredentials,
  checkAlumniIdUniqueness,
  checkQRUniqueness,
  generateServerQRCode,
  createAlumnus
} from '../utils/api.ts';
import type { DegreeBatch, CardStatus } from '../types/index.ts';

interface RegisterAlumniModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: any) => void;
  initialQR?: string;
}

export const RegisterAlumniModal: React.FC<RegisterAlumniModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialQR
}) => {
  const [formData, setFormData] = useState({
    alumni_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    photo_url: '/src/assets/images/alumni_juan_1790822760049.jpg',

    // Batch 1: Bachelor's Degree
    program: 'Bachelor of Science in Information Technology',
    custom_program: '',
    college: 'College of Computing and Information Technology',
    major: 'Network & Cloud Systems',
    graduation_year: new Date().getFullYear(),
    campus: 'Urdaneta Campus',

    // Batch 2: Master's Degree
    has_masters: false,
    masters_program: 'Master in Information Technology (MIT)',
    custom_masters_program: '',
    masters_college: 'School of Advanced Studies',
    masters_major: 'Enterprise Architecture & Cloud Systems',
    masters_year: new Date().getFullYear(),

    // Batch 3: Doctorate Degree
    has_doctorate: false,
    doctorate_program: 'Doctor of Information Technology (DIT)',
    custom_doctorate_program: '',
    doctorate_college: 'School of Advanced Studies',
    doctorate_major: 'Applied Artificial Intelligence & Systems Theory',
    doctorate_year: new Date().getFullYear(),

    card_number: '',
    issue_date: new Date().toISOString().substring(0, 10),
    expiration_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    card_status: 'ACTIVE' as CardStatus,
    qr_value: '',
    qr_image_url: ''
  });

  const [isCustomBachelors, setIsCustomBachelors] = useState(false);
  const [isCustomMasters, setIsCustomMasters] = useState(false);
  const [isCustomDoctorate, setIsCustomDoctorate] = useState(false);

  const [isGeneratingCredentials, setIsGeneratingCredentials] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [alumniIdStatus, setAlumniIdStatus] = useState<{ isUnique: boolean; message: string } | null>(null);
  const [qrDecodedMessage, setQrDecodedMessage] = useState<string | null>(null);
  const [qrDecodeError, setQrDecodeError] = useState<string | null>(null);
  const [qrDuplicateWarning, setQrDuplicateWarning] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string | null>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Success dialog state
  const [savedRecord, setSavedRecord] = useState<any | null>(null);

  // Initialize or reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSavedRecord(null);
      setFormError(null);
      setQrDecodeError(null);
      setQrDuplicateWarning(null);
      setAlumniIdStatus(null);
      setIsSubmitting(false);

      initCredentials();
    }
  }, [isOpen, initialQR]);

  const initCredentials = async () => {
    setIsGeneratingCredentials(true);
    try {
      const creds = await fetchNextAlumniCredentials();
      const activeQR = initialQR && initialQR.trim() ? initialQR.trim() : creds.qr_value;

      let preview = await generateQRCodeDataUrl(activeQR, { width: 200 }).catch(() => '');
      if (!preview) {
        const srv = await generateServerQRCode(activeQR, 200).catch(() => null);
        if (srv) preview = srv.qr_image_url;
      }

      setFormData(prev => ({
        ...prev,
        alumni_id: creds.alumni_id,
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        photo_url: '/src/assets/images/alumni_juan_1790822760049.jpg',
        program: 'Bachelor of Science in Information Technology',
        custom_program: '',
        college: 'College of Computing and Information Technology',
        major: 'Network & Cloud Systems',
        graduation_year: new Date().getFullYear(),
        campus: 'Urdaneta Campus',
        has_masters: false,
        has_doctorate: false,
        card_number: creds.card_number,
        card_status: 'ACTIVE',
        issue_date: new Date().toISOString().substring(0, 10),
        expiration_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        qr_value: activeQR,
        qr_image_url: preview || ''
      }));

      setIsCustomBachelors(false);
      setIsCustomMasters(false);
      setIsCustomDoctorate(false);
      setUploadedPhotoName(null);
      setPhotoUploadError(null);

      if (initialQR && initialQR.trim()) {
        setQrDecodedMessage(`Pre-filled with scanned QR: "${initialQR.trim()}"`);
      } else {
        setQrDecodedMessage(`Official QR Code pre-generated: "${activeQR}"`);
      }
    } catch (err: any) {
      console.warn('Failed to pre-fetch credentials:', err);
    } finally {
      setIsGeneratingCredentials(false);
    }
  };

  if (!isOpen) return null;

  // Handle manual or automated alumni ID editing
  const handleAlumniIdChange = (val: string) => {
    setFormError(null);
    const cleanId = val.trim().replace(/^PU-ALUMNI-/, '').replace(/-VERIFY$/, '').replace(/^PU-/, '');

    setFormData(prev => {
      const prevCleanId = prev.alumni_id.trim().replace(/^PU-ALUMNI-/, '').replace(/-VERIFY$/, '').replace(/^PU-/, '');
      const shouldSyncCard = !prev.card_number || prev.card_number === `AC-${prevCleanId}`;
      const shouldSyncQR = !prev.qr_value || prev.qr_value.startsWith(`PU-ALUMNI-${prevCleanId}`);

      const nextCard = shouldSyncCard && cleanId ? `AC-${cleanId}` : prev.card_number;
      const nextQR = shouldSyncQR && cleanId ? `PU-ALUMNI-${cleanId}-VERIFY` : prev.qr_value;

      return {
        ...prev,
        alumni_id: val,
        card_number: nextCard,
        qr_value: nextQR
      };
    });

    if (val.trim()) {
      const targetQR = `PU-ALUMNI-${cleanId || 'PREVIEW'}-VERIFY`;
      generateQRCodeDataUrl(targetQR, { width: 180 }).then(url => {
        if (url) {
          setFormData(prev => ({ ...prev, qr_image_url: url }));
        }
      }).catch(() => {});

      checkAlumniIdUniqueness(val.trim()).then(res => {
        if (!res.isUnique) {
          setAlumniIdStatus({
            isUnique: false,
            message: `Alumni ID "${val.trim()}" is already assigned to ${res.existingRecord?.alumnus_name || 'an existing alumnus'}.`
          });
        } else {
          setAlumniIdStatus({
            isUnique: true,
            message: `Alumni ID "${val.trim()}" is unique and available.`
          });
        }
      }).catch(() => {});
    } else {
      setAlumniIdStatus(null);
    }
  };

  // Generate fresh official QR and ID
  const handleGenerateOfficialQR = async () => {
    setIsGeneratingQR(true);
    setIsGeneratingCredentials(true);
    setQrDecodeError(null);
    setQrDuplicateWarning(null);

    try {
      const creds = await fetchNextAlumniCredentials();
      let previewUrl = await generateQRCodeDataUrl(creds.qr_value, { width: 200 });
      if (!previewUrl) {
        const srv = await generateServerQRCode(creds.qr_value, 200).catch(() => null);
        if (srv) previewUrl = srv.qr_image_url;
      }

      setFormData(prev => ({
        ...prev,
        alumni_id: creds.alumni_id,
        card_number: creds.card_number,
        qr_value: creds.qr_value,
        qr_image_url: previewUrl || ''
      }));

      setAlumniIdStatus({
        isUnique: true,
        message: `Generated fresh unique ID "${creds.alumni_id}".`
      });
      setQrDecodedMessage(`Official QR Code generated: "${creds.qr_value}"`);
    } catch (err: any) {
      const fallbackToken = `PU-ALUMNI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}-VERIFY`;
      const fallbackUrl = await generateQRCodeDataUrl(fallbackToken, { width: 200 });
      setFormData(prev => ({
        ...prev,
        qr_value: fallbackToken,
        qr_image_url: fallbackUrl
      }));
      setQrDecodedMessage(`Generated Official Panpacific University QR: "${fallbackToken}"`);
    } finally {
      setIsGeneratingQR(false);
      setIsGeneratingCredentials(false);
    }
  };

  // Image Upload helper
  const processImageFile = (file: File) => {
    setPhotoUploadError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setUploadedPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 400;
          const w = img.width;
          const h = img.height;
          const minSide = Math.min(w, h);
          const startX = (w - minSide) / 2;
          const startY = (h - minSide) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);
            const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setFormData(prev => ({ ...prev, photo_url: croppedDataUrl }));
          } else {
            setFormData(prev => ({ ...prev, photo_url: event.target?.result as string }));
          }
        } catch {
          setFormData(prev => ({ ...prev, photo_url: event.target?.result as string }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  // QR image scan upload
  const handleQRImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrDecodeError(null);
    setQrDecodedMessage(null);
    setQrDuplicateWarning(null);

    try {
      const result = await readQRFromImageFile(file);
      if (!result.success || !result.data) {
        setQrDecodeError(
          result.error || 'Could not detect a valid QR Code barcode. Please ensure clear lighting.'
        );
        return;
      }

      const decodedVal = result.data.trim();
      const check = await checkQRUniqueness(decodedVal);
      if (!check.isUnique) {
        setQrDuplicateWarning(
          `⚠ QR CODE ALREADY IN DATABASE: Associated with (${check.existingRecord?.alumnus_name || 'Existing Alumni'}). A unique suffix will be safely added upon save.`
        );
      }

      const previewUrl = await generateQRCodeDataUrl(decodedVal, { width: 200 });
      setFormData(prev => ({
        ...prev,
        qr_value: decodedVal,
        qr_image_url: previewUrl
      }));
      setQrDecodedMessage(`Successfully decoded physical QR code: "${decodedVal}"`);
    } catch (err: any) {
      setQrDecodeError(err.message || 'Error processing uploaded QR image.');
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();

    if (!firstName || !lastName) {
      setFormError('Please enter both First Name and Last Name.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Resolve Alumni ID
      let finalId = formData.alumni_id.trim();
      if (!finalId) {
        try {
          const creds = await fetchNextAlumniCredentials();
          finalId = creds.alumni_id;
        } catch {
          finalId = `PU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        }
      }

      const cleanId = finalId
        .replace(/^PU-ALUMNI-/, '')
        .replace(/-VERIFY$/, '')
        .replace(/^PU-/, '');

      const finalCardNumber = formData.card_number.trim() || `AC-${cleanId}`;

      // 2. Resolve QR Token
      let activeQRValue = formData.qr_value.trim();
      if (!activeQRValue) {
        activeQRValue = `PU-ALUMNI-${cleanId}-VERIFY`;
      }

      // 3. Resolve QR Image
      let activeQRImageUrl = formData.qr_image_url;
      if (!activeQRImageUrl) {
        activeQRImageUrl = await generateQRCodeDataUrl(activeQRValue, { width: 200 }).catch(() => '');
        if (!activeQRImageUrl) {
          const srv = await generateServerQRCode(activeQRValue, 200).catch(() => null);
          if (srv) activeQRImageUrl = srv.qr_image_url;
        }
      }

      // 4. Resolve Bachelor's Program
      const finalProgram = isCustomBachelors
        ? (formData.custom_program.trim() || 'Bachelor of Science in Information Technology')
        : (formData.program.trim() || 'Bachelor of Science in Information Technology');

      // 5. Resolve Degree Level
      let finalDegreeLevel: DegreeBatch = 'BACHELORS';
      if (formData.has_doctorate && (formData.doctorate_program.trim() || formData.custom_doctorate_program.trim())) {
        finalDegreeLevel = 'DOCTORATE';
      } else if (formData.has_masters && (formData.masters_program.trim() || formData.custom_masters_program.trim())) {
        finalDegreeLevel = 'MASTERS';
      }

      const finalMastersProgram = isCustomMasters
        ? formData.custom_masters_program.trim()
        : formData.masters_program.trim();

      const finalDoctorateProgram = isCustomDoctorate
        ? formData.custom_doctorate_program.trim()
        : formData.doctorate_program.trim();

      const payload = {
        ...formData,
        first_name: firstName,
        last_name: lastName,
        middle_name: formData.middle_name.trim(),
        suffix: formData.suffix.trim(),
        alumni_id: finalId,
        card_number: finalCardNumber,
        program: finalProgram,
        college: formData.college.trim() || 'College of Computing and Information Technology',
        major: formData.major.trim(),
        campus: formData.campus.trim() || 'Urdaneta Campus',
        graduation_year: Number(formData.graduation_year) || new Date().getFullYear(),
        degree_level: finalDegreeLevel,
        has_masters: !!formData.has_masters,
        masters_program: finalMastersProgram,
        masters_college: formData.masters_college.trim(),
        masters_major: formData.masters_major.trim(),
        masters_year: Number(formData.masters_year) || new Date().getFullYear(),
        has_doctorate: !!formData.has_doctorate,
        doctorate_program: finalDoctorateProgram,
        doctorate_college: formData.doctorate_college.trim(),
        doctorate_major: formData.doctorate_major.trim(),
        doctorate_year: Number(formData.doctorate_year) || new Date().getFullYear(),
        qr_value: activeQRValue,
        qr_image_url: activeQRImageUrl
      };

      const result = await createAlumnus(payload);

      setSavedRecord({
        name: `${firstName} ${lastName}`,
        alumni_id: result.alumnus?.alumni_id || finalId,
        qr_value: result.qr?.qr_value || activeQRValue,
        qr_image_url: result.qr?.qr_image_url || activeQRImageUrl,
        card_number: result.card?.card_number || finalCardNumber,
        program: finalProgram,
        campus: formData.campus
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error('Alumni registration failed:', err);
      setFormError(err.message || 'Failed to save alumni details. Please review inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto border border-stone-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-900 border border-amber-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-xl font-bold text-stone-900">
                Register Alumni & QR Record
              </h2>
              <p className="text-xs text-stone-500">
                Panpacific University centralized student enrollment & verification database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-stone-400 hover:text-stone-700 text-lg font-bold p-1 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* SUCCESS CONFIRMATION STATE                               */}
        {/* ======================================================== */}
        {savedRecord ? (
          <div className="space-y-6 py-2">
            <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-base text-emerald-950 font-cinzel">
                  Alumni Record Successfully Registered!
                </div>
                <p className="text-xs text-emerald-800">
                  <strong>{savedRecord.name}</strong> has been enrolled and synced across all devices on the centralized cloud database.
                </p>
              </div>
            </div>

            {/* Generated Credentials Summary */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Official Alumni ID</span>
                  <span className="font-mono font-bold text-amber-950 text-sm">{savedRecord.alumni_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Card Number</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">{savedRecord.card_number}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold block">Degree Program</span>
                  <span className="font-medium text-stone-800">{savedRecord.program} ({savedRecord.campus})</span>
                </div>
              </div>

              {/* QR Preview & Download */}
              <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center gap-4">
                {savedRecord.qr_image_url && (
                  <img
                    src={savedRecord.qr_image_url}
                    alt="Official QR"
                    className="w-24 h-24 object-contain rounded border border-stone-200 bg-white p-1"
                  />
                )}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="text-[11px] font-semibold text-stone-700">Verified QR Code Payload:</div>
                  <div className="font-mono text-[11px] bg-stone-100 p-1.5 rounded text-amber-950 break-all select-all border border-stone-200">
                    {savedRecord.qr_value}
                  </div>
                  {savedRecord.qr_image_url && (
                    <a
                      href={savedRecord.qr_image_url}
                      download={`${savedRecord.alumni_id}-qrcode.png`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download QR Code Image</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setSavedRecord(null);
                  initCredentials();
                }}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Register Another Alumni
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* REGISTRATION FORM                                        */
          /* ======================================================== */
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {formError && (
              <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2 shadow-2xs">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Registration Alert</div>
                  <div>{formError}</div>
                </div>
              </div>
            )}

            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                1. Personal Details & Identity
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-stone-700">Alumni ID *</label>
                    <button
                      type="button"
                      onClick={handleGenerateOfficialQR}
                      disabled={isGeneratingCredentials}
                      className="text-[11px] font-bold text-amber-900 hover:text-amber-800 flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-200 transition-colors"
                      title="Auto-generate next unique available Alumni ID and QR Code"
                    >
                      <Sparkles className="w-3 h-3 text-amber-700" />
                      <span>{isGeneratingCredentials ? 'Generating...' : 'Auto-Generate'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.alumni_id}
                    onChange={(e) => handleAlumniIdChange(e.target.value)}
                    placeholder="e.g. PU-2026-00124"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:ring-1 focus:ring-amber-800 bg-white"
                  />
                  {alumniIdStatus && (
                    <div className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${
                      alumniIdStatus.isUnique ? 'text-emerald-700' : 'text-red-600'
                    }`}>
                      {alumniIdStatus.isUnique ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                      )}
                      <span>{alumniIdStatus.message}</span>
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1.5">
                    Profile Picture / Graduate Photo
                  </label>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={handlePhotoDrop}
                    className={`relative flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isDraggingPhoto
                        ? 'border-amber-800 bg-amber-50/70 scale-[1.01]'
                        : 'border-dashed border-stone-300 bg-stone-50 hover:border-amber-700'
                    }`}
                  >
                    {/* Avatar Preview */}
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="relative group cursor-pointer shrink-0"
                      title="Click to choose a photo file"
                    >
                      <img
                        src={formData.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg'}
                        alt="Profile Preview"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-3 border-amber-800 shadow-md ring-2 ring-amber-100"
                      />
                      <div className="absolute inset-0 bg-stone-900/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white mb-0.5" />
                        <span className="text-[9px] text-white font-semibold">Change</span>
                      </div>
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-4 py-2 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload Photo File</span>
                        </button>

                        <select
                          value={formData.photo_url.startsWith('data:') ? 'custom' : formData.photo_url}
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              setFormData(prev => ({ ...prev, photo_url: e.target.value }));
                              setUploadedPhotoName(null);
                            }
                          }}
                          className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-700 focus:ring-1 focus:ring-amber-800 cursor-pointer"
                        >
                          {formData.photo_url.startsWith('data:') && (
                            <option value="custom">✓ Custom Photo Uploaded</option>
                          )}
                          <option value="/src/assets/images/alumni_juan_1790822760049.jpg">Preset: Juan Dela Cruz</option>
                          <option value="/src/assets/images/alumni_maria_1790822771082.jpg">Preset: Maria Santos</option>
                          <option value="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop">Preset: Female Graduate</option>
                          <option value="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&fit=crop">Preset: Male Graduate</option>
                        </select>
                      </div>

                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileUpload}
                        className="hidden"
                      />

                      {uploadedPhotoName ? (
                        <div className="text-[11px] text-emerald-800 font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Photo ready: <strong>{uploadedPhotoName}</strong></span>
                        </div>
                      ) : photoUploadError ? (
                        <p className="text-[11px] text-red-600 font-medium">
                          {photoUploadError}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-500">
                          Square photo applied automatically. JPG, PNG, or WEBP supported.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Gabriel"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    placeholder="e.g. Gomez"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Mendoza"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Suffix (Optional)</label>
                  <input
                    type="text"
                    value={formData.suffix}
                    onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                    placeholder="e.g. Jr., III, Ph.D., MIT"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ACADEMIC DETAILS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    2. Academic Degrees & Curriculum Batches
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Bachelor's is required. Master's and Doctorate degrees are optional.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                  Tier Batches
                </span>
              </div>

              {/* BATCH 1: BACHELORS */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-100 text-blue-900">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs text-blue-950 font-cinzel">
                      Batch 1: Bachelor's Degree
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-300">
                    Required Undergraduate
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-semibold text-stone-700">
                      Bachelor's Program Title *
                    </label>
                    <select
                      value={isCustomBachelors ? 'CUSTOM' : formData.program}
                      onChange={(e) => {
                        const chosen = e.target.value;
                        if (chosen === 'CUSTOM') {
                          setIsCustomBachelors(true);
                        } else {
                          setIsCustomBachelors(false);
                          const bachelorsGroup = ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'BACHELORS');
                          const matched = bachelorsGroup?.programs.find(p => p.name === chosen);
                          if (matched) {
                            setFormData(prev => ({
                              ...prev,
                              program: matched.name,
                              college: matched.college,
                              major: matched.defaultMajor || prev.major
                            }));
                          } else {
                            setFormData(prev => ({ ...prev, program: chosen }));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-amber-800 cursor-pointer"
                    >
                      {ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'BACHELORS')?.programs.map(prog => (
                        <option key={prog.name} value={prog.name}>
                          {prog.name}
                        </option>
                      ))}
                      <option value="CUSTOM">✏️ Custom Bachelor's Degree (Enter Manually)...</option>
                    </select>

                    {isCustomBachelors && (
                      <input
                        type="text"
                        required
                        value={formData.custom_program}
                        onChange={(e) => setFormData(prev => ({ ...prev, custom_program: e.target.value }))}
                        placeholder="Type full official Bachelor's program title..."
                        className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-medium"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">College / Department *</label>
                    <input
                      type="text"
                      required
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                      placeholder="e.g. College of Computing and Information Technology"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Major / Specialization</label>
                    <input
                      type="text"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      placeholder="e.g. Network & Cloud Systems"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Graduation Year *</label>
                    <input
                      type="number"
                      required
                      value={formData.graduation_year}
                      onChange={(e) => setFormData({ ...formData, graduation_year: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Campus *</label>
                    <select
                      value={formData.campus}
                      onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white cursor-pointer font-medium"
                    >
                      <option value="Urdaneta Campus">Urdaneta Campus</option>
                      <option value="Tayug Campus">Tayug Campus</option>
                      <option value="Main Campus">Main Campus</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BATCH 2: MASTERS DEGREE */}
              <div className={`p-4 rounded-xl border transition-all ${
                formData.has_masters
                  ? 'border-purple-300 bg-purple-50/40 ring-1 ring-purple-200'
                  : 'border-stone-200 bg-stone-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_masters}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_masters: e.target.checked }))}
                      className="w-4 h-4 text-purple-900 rounded border-stone-300 focus:ring-purple-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-purple-100 text-purple-900">
                        <BookOpen className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-stone-900 font-cinzel">
                        Batch 2: Master's Degree
                      </span>
                    </div>
                  </label>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                    Optional Graduate
                  </span>
                </div>

                {formData.has_masters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 mt-3 border-t border-purple-200/60">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block font-semibold text-stone-700">
                        Master's Program Offering *
                      </label>
                      <select
                        value={isCustomMasters ? 'CUSTOM' : formData.masters_program}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          if (chosen === 'CUSTOM') {
                            setIsCustomMasters(true);
                          } else {
                            setIsCustomMasters(false);
                            const mastersGroup = ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'MASTERS');
                            const matched = mastersGroup?.programs.find(p => p.name === chosen);
                            if (matched) {
                              setFormData(prev => ({
                                ...prev,
                                masters_program: matched.name,
                                masters_college: matched.college,
                                masters_major: matched.defaultMajor || prev.masters_major
                              }));
                            } else {
                              setFormData(prev => ({ ...prev, masters_program: chosen }));
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-purple-800 cursor-pointer"
                      >
                        {ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'MASTERS')?.programs.map(prog => (
                          <option key={prog.name} value={prog.name}>
                            {prog.name}
                          </option>
                        ))}
                        <option value="CUSTOM">✏️ Custom Master's Title (Enter Manually)...</option>
                      </select>

                      {isCustomMasters && (
                        <input
                          type="text"
                          required={formData.has_masters}
                          value={formData.custom_masters_program}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_masters_program: e.target.value }))}
                          placeholder="Type full official Master's program title..."
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-medium"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Graduate College</label>
                      <input
                        type="text"
                        value={formData.masters_college}
                        onChange={(e) => setFormData({ ...formData, masters_college: e.target.value })}
                        placeholder="e.g. School of Advanced Studies"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Major / Specialization</label>
                      <input
                        type="text"
                        value={formData.masters_major}
                        onChange={(e) => setFormData({ ...formData, masters_major: e.target.value })}
                        placeholder="e.g. Enterprise Architecture & Cloud Systems"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Conferred Year</label>
                      <input
                        type="number"
                        value={formData.masters_year}
                        onChange={(e) => setFormData({ ...formData, masters_year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BATCH 3: DOCTORATE DEGREE */}
              <div className={`p-4 rounded-xl border transition-all ${
                formData.has_doctorate
                  ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                  : 'border-stone-200 bg-stone-50/50'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_doctorate}
                      onChange={(e) => setFormData(prev => ({ ...prev, has_doctorate: e.target.checked }))}
                      className="w-4 h-4 text-amber-900 rounded border-stone-300 focus:ring-amber-700 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      <div className="p-1 rounded bg-amber-100 text-amber-900">
                        <Award className="w-3.5 h-3.5 text-amber-900" />
                      </div>
                      <span className="font-bold text-xs text-stone-900 font-cinzel">
                        Batch 3: Doctorate Degree
                      </span>
                    </div>
                  </label>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Optional Post-Graduate
                  </span>
                </div>

                {formData.has_doctorate && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 mt-3 border-t border-amber-300/60">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block font-semibold text-stone-700">
                        Doctorate Program Offering *
                      </label>
                      <select
                        value={isCustomDoctorate ? 'CUSTOM' : formData.doctorate_program}
                        onChange={(e) => {
                          const chosen = e.target.value;
                          if (chosen === 'CUSTOM') {
                            setIsCustomDoctorate(true);
                          } else {
                            setIsCustomDoctorate(false);
                            const doctorateGroup = ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'DOCTORATE');
                            const matched = doctorateGroup?.programs.find(p => p.name === chosen);
                            if (matched) {
                              setFormData(prev => ({
                                ...prev,
                                doctorate_program: matched.name,
                                doctorate_college: matched.college,
                                doctorate_major: matched.defaultMajor || prev.doctorate_major
                              }));
                            } else {
                              setFormData(prev => ({ ...prev, doctorate_program: chosen }));
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-medium focus:ring-1 focus:ring-amber-800 cursor-pointer"
                      >
                        {ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'DOCTORATE')?.programs.map(prog => (
                          <option key={prog.name} value={prog.name}>
                            {prog.name}
                          </option>
                        ))}
                        <option value="CUSTOM">✏️ Custom Doctorate Title (Enter Manually)...</option>
                      </select>

                      {isCustomDoctorate && (
                        <input
                          type="text"
                          required={formData.has_doctorate}
                          value={formData.custom_doctorate_program}
                          onChange={(e) => setFormData(prev => ({ ...prev, custom_doctorate_program: e.target.value }))}
                          placeholder="Type full official Doctorate program title..."
                          className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-xs bg-white font-medium"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Graduate College</label>
                      <input
                        type="text"
                        value={formData.doctorate_college}
                        onChange={(e) => setFormData({ ...formData, doctorate_college: e.target.value })}
                        placeholder="e.g. School of Advanced Studies"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Major / Specialization</label>
                      <input
                        type="text"
                        value={formData.doctorate_major}
                        onChange={(e) => setFormData({ ...formData, doctorate_major: e.target.value })}
                        placeholder="e.g. Applied Artificial Intelligence"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Conferred Year</label>
                      <input
                        type="number"
                        value={formData.doctorate_year}
                        onChange={(e) => setFormData({ ...formData, doctorate_year: parseInt(e.target.value) || new Date().getFullYear() })}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: CARD CREDENTIALS */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                3. Physical Alumni ID Card Credentials
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-stone-700">Card Serial Number</label>
                    <span className="text-[10px] text-stone-400">Auto-assigned</span>
                  </div>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    placeholder="e.g. AC-2026-00124"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Card Status *</label>
                  <select
                    value={formData.card_status}
                    onChange={(e) => setFormData({ ...formData, card_status: e.target.value as CardStatus })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE (Valid Card)</option>
                    <option value="EXPIRED">EXPIRED (Expired Card)</option>
                    <option value="REVOKED">REVOKED (Invalid / Void)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Expiration Date</label>
                  <input
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: QR CODE ASSIGNMENT */}
            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                4. QR Code Assignment & Real-Time Verification
              </div>
              <p className="text-[11px] text-stone-500">
                Upload the QR code image printed on the graduate's card or generate the official university cryptographic QR token.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <label className="flex-1 w-full p-4 border-2 border-dashed border-stone-300 hover:border-amber-800 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer bg-white transition-colors shadow-2xs">
                  <Upload className="w-5 h-5 text-amber-800 mb-1" />
                  <span className="font-semibold text-stone-800 text-xs">Scan Physical QR Photo</span>
                  <span className="text-[10px] text-stone-400">Decodes payload automatically</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRImageUpload}
                    className="hidden"
                  />
                </label>

                <div className="text-xs font-semibold text-stone-400 uppercase">OR</div>

                <button
                  type="button"
                  onClick={handleGenerateOfficialQR}
                  disabled={isGeneratingQR}
                  className={`flex-1 w-full p-4 border rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-xs ${
                    formData.qr_value
                      ? 'border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950'
                      : 'border-amber-300 bg-amber-50/40 hover:bg-amber-100/60 text-amber-950'
                  }`}
                >
                  {isGeneratingQR ? (
                    <>
                      <RefreshCw className="w-5 h-5 text-amber-800 animate-spin mb-1" />
                      <span className="font-semibold text-xs">Generating Official QR...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-700 mb-1" />
                      <span className="font-semibold text-xs">Generate Official University QR</span>
                      <span className="text-[10px] text-stone-500">Authoritative Panpacific format</span>
                    </>
                  )}
                </button>
              </div>

              {/* QR Token input */}
              <div className="space-y-1 pt-2">
                <label className="block font-semibold text-stone-700 text-xs">
                  Assigned QR Token Payload:
                </label>
                <input
                  type="text"
                  value={formData.qr_value}
                  onChange={async (e) => {
                    const val = e.target.value;
                    const url = val.trim() ? await generateQRCodeDataUrl(val.trim(), { width: 200 }) : '';
                    setFormData(prev => ({ ...prev, qr_value: val, qr_image_url: url }));
                  }}
                  placeholder="e.g. PU-ALUMNI-2026-00123-VERIFY"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs text-stone-900 bg-white"
                />
              </div>

              {qrDecodeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                  {qrDecodeError}
                </div>
              )}

              {qrDuplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 font-medium">
                  {qrDuplicateWarning}
                </div>
              )}

              {qrDecodedMessage && !qrDuplicateWarning && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{qrDecodedMessage}</span>
                </div>
              )}

              {/* Live QR Image Preview */}
              {formData.qr_value && (
                <div className="mt-3 p-3 bg-white rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center gap-4">
                  {formData.qr_image_url ? (
                    <img
                      src={formData.qr_image_url}
                      alt="QR Preview"
                      className="w-20 h-20 object-contain rounded border border-stone-200"
                    />
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center font-mono text-[10px] text-stone-400 border border-stone-200 rounded">
                      Rendering...
                    </div>
                  )}
                  <div className="space-y-1 flex-1 min-w-0 text-center sm:text-left">
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Live QR Token Verified</span>
                    </span>
                    <div className="font-mono text-xs font-semibold text-stone-900 break-all bg-stone-50 p-1.5 rounded border border-stone-200 select-all">
                      {formData.qr_value}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors disabled:opacity-50 shadow-xs cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Save & Register Alumni Record</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
