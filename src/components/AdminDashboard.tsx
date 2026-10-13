import React, { useState, useEffect, useRef } from 'react';
import {
  DashboardStats,
  Alumni,
  AlumniCard,
  AlumniQRCode,
  VerificationLog,
  ActivityLog,
  CardStatus,
  DegreeBatch,
  AdminCredentialsInfo
} from '../types/index.ts';
import {
  fetchStats,
  fetchAlumniList,
  updateCardStatus,
  createAlumnus,
  updateAlumnus,
  deleteAlumnus,
  fetchVerificationLogs,
  fetchActivityLogs,
  checkQRUniqueness,
  fetchNextAlumniCredentials,
  checkAlumniIdUniqueness,
  generateServerQRCode,
  fetchAdminCredentials,
  updateAdminCredentials,
  resetAdminCredentials
} from '../utils/api.ts';
import { decodeQRCodeFromImage, generateQRCodeDataUrl } from '../utils/qrReader.ts';
import {
  ACADEMIC_PROGRAM_BATCHES,
  detectDegreeBatch,
  getDegreeBatchLabel,
  getDegreeBatchBadge,
  getHighestDegree
} from '../utils/academicPrograms.ts';

import {
  Users,
  CreditCard,
  AlertTriangle,
  Ban,
  QrCode,
  ShieldCheck,
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  IdCard,
  Printer,
  Sparkles,
  Camera,
  Image as ImageIcon,
  GraduationCap,
  BookOpen,
  KeyRound,
  Shield,
  ShieldAlert,
  Save,
  RotateCcw,
  Lock,
  EyeOff,
  Check,
  Share2,
  ExternalLink,
  Smartphone,
  Copy
} from 'lucide-react';
import { useCentralSync } from '../context/SyncContext.tsx';
import { CentralSyncAdminBanner } from './CentralSyncAdminBanner.tsx';
import { RegisterAlumniModal } from './RegisterAlumniModal.tsx';

interface AdminDashboardProps {
  onTestVerify: (token: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onTestVerify }) => {
  const { registerListener } = useCentralSync();
  const [activeTab, setActiveTab] = useState<'overview' | 'alumni' | 'logs' | 'activity' | 'security'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alumniList, setAlumniList] = useState<Array<Alumni & { card?: AlumniCard; qr?: AlumniQRCode }>>([]);
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentialsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [degreeFilter, setDegreeFilter] = useState<'ALL' | 'BACHELORS' | 'MASTERS' | 'DOCTORATE'>('ALL');

  // Credential modification form state
  const [credsForm, setCredsForm] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
    name: '',
    email: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingCreds, setIsUpdatingCreds] = useState(false);
  const [credsSuccessMessage, setCredsSuccessMessage] = useState<string | null>(null);
  const [credsErrorMessage, setCredsErrorMessage] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isGeneratingNewCreds, setIsGeneratingNewCreds] = useState(false);
  const [alumniIdStatus, setAlumniIdStatus] = useState<{ isUnique: boolean; message: string } | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<{ name: string; id: string; qr: string } | null>(null);
  const [selectedAlumnusForCard, setSelectedAlumnusForCard] = useState<(Alumni & { card?: AlumniCard; qr?: AlumniQRCode }) | null>(null);
  const [selectedAlumnusForQRModal, setSelectedAlumnusForQRModal] = useState<(Alumni & { card?: AlumniCard; qr?: AlumniQRCode }) | null>(null);
  const [cardLiveQRUrl, setCardLiveQRUrl] = useState<string>('');
  const [cardCopiedUrl, setCardCopiedUrl] = useState(false);

  useEffect(() => {
    if (selectedAlumnusForCard) {
      const token = selectedAlumnusForCard.qr?.qr_value || selectedAlumnusForCard.alumni_id;
      const liveVerifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(token)}`;
      generateQRCodeDataUrl(liveVerifyUrl, { width: 220, margin: 1 }).then(url => {
        setCardLiveQRUrl(url);
      });
    } else {
      setCardLiveQRUrl('');
      setCardCopiedUrl(false);
    }
  }, [selectedAlumnusForCard]);

  // New Alumni Form State
  const [formData, setFormData] = useState({
    alumni_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    photo_url: '/src/assets/images/alumni_juan_1790822760049.jpg',

    // Batch 1: Bachelor's Degree (Mandatory)
    program: 'Bachelor of Science in Information Technology',
    college: 'College of Computing and Information Technology',
    major: 'Network & Cloud Systems',
    graduation_year: new Date().getFullYear(),
    campus: 'Urdaneta Campus',

    // Batch 2: Master's Degree (Optional / If Applicable)
    has_masters: false,
    masters_program: 'Master in Information Technology (MIT)',
    masters_college: 'School of Advanced Studies',
    masters_major: 'Enterprise Architecture & Cloud Systems',
    masters_year: new Date().getFullYear(),

    // Batch 3: Doctorate Degree (Optional / If Applicable)
    has_doctorate: false,
    doctorate_program: 'Doctor of Information Technology (DIT)',
    doctorate_college: 'School of Advanced Studies',
    doctorate_major: 'Applied Artificial Intelligence & Systems Theory',
    doctorate_year: new Date().getFullYear(),

    degree_level: 'BACHELORS' as DegreeBatch,
    card_number: '',
    issue_date: new Date().toISOString().substring(0, 10),
    expiration_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    card_status: 'ACTIVE' as CardStatus,
    qr_value: '',
    qr_image_url: ''
  });

  const [qrDecodedMessage, setQrDecodedMessage] = useState<string | null>(null);
  const [qrDecodeError, setQrDecodeError] = useState<string | null>(null);
  const [qrDuplicateWarning, setQrDuplicateWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string | null>(null);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  // Edit Alumni Modal State
  const [editingAlumnus, setEditingAlumnus] = useState<(Alumni & { card?: AlumniCard; qr?: AlumniQRCode }) | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);


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
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setFormData(prev => ({ ...prev, photo_url: dataUrl }));
          } else {
            setFormData(prev => ({ ...prev, photo_url: event.target?.result as string }));
          }
        } catch {
          setFormData(prev => ({ ...prev, photo_url: event.target?.result as string }));
        }
      };
      img.onerror = () => {
        setPhotoUploadError('Failed to parse image file.');
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setPhotoUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };


  // Load dashboard data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, alumniData, vLogs, aLogs, credsData] = await Promise.all([
        fetchStats(),
        fetchAlumniList(),
        fetchVerificationLogs(),
        fetchActivityLogs(),
        fetchAdminCredentials().catch(() => null)
      ]);
      setStats(statsData);
      setAlumniList(alumniData);
      setVerificationLogs(vLogs);
      setActivityLogs(aLogs);
      if (credsData) {
        setAdminCredentials(credsData);
        setCredsForm(prev => ({
          ...prev,
          newUsername: credsData.username || '',
          name: credsData.name || '',
          email: credsData.email || ''
        }));
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-device real-time sync subscription: automatically updates table & stats when another browser/device mutates centralized DB
  useEffect(() => {
    const unregister = registerListener(() => {
      loadData();
    });
    return unregister;
  }, [registerListener]);

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsErrorMessage(null);
    setCredsSuccessMessage(null);

    if (!credsForm.currentPassword) {
      setCredsErrorMessage('Please enter your current administrator password to authorize this update.');
      return;
    }

    if (credsForm.newPassword) {
      if (credsForm.newPassword.length < 4) {
        setCredsErrorMessage('New password must be at least 4 characters long.');
        return;
      }
      if (credsForm.newPassword !== credsForm.confirmPassword) {
        setCredsErrorMessage('New password and password confirmation do not match.');
        return;
      }
    }

    if (credsForm.newUsername && credsForm.newUsername.trim().length < 3) {
      setCredsErrorMessage('New username must be at least 3 characters long.');
      return;
    }

    setIsUpdatingCreds(true);
    try {
      const res = await updateAdminCredentials({
        currentPassword: credsForm.currentPassword,
        newUsername: credsForm.newUsername.trim() || undefined,
        newPassword: credsForm.newPassword.trim() || undefined,
        name: credsForm.name.trim() || undefined,
        email: credsForm.email.trim() || undefined
      });

      if (res.admin) {
        localStorage.setItem('alumni_admin_session', JSON.stringify(res.admin));
      }

      setCredsSuccessMessage(
        `Administrator credentials updated successfully! New active username: "${res.admin?.username || credsForm.newUsername}". Your current session has been updated.`
      );
      setCredsForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      const updatedCreds = await fetchAdminCredentials();
      setAdminCredentials(updatedCreds);
      await loadData();
    } catch (err: any) {
      setCredsErrorMessage(err.message || 'Failed to update administrator credentials.');
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      !confirm(
        'Are you sure you want to reset administrator credentials to factory defaults (Username: admin, Password: admin)?'
      )
    ) {
      return;
    }

    setIsUpdatingCreds(true);
    setCredsErrorMessage(null);
    setCredsSuccessMessage(null);
    try {
      const res = await resetAdminCredentials();
      if (res.admin) {
        localStorage.setItem('alumni_admin_session', JSON.stringify(res.admin));
      }
      setCredsSuccessMessage(
        'Administrator credentials have been restored to factory defaults (Username: admin, Password: admin).'
      );
      const updatedCreds = await fetchAdminCredentials();
      setAdminCredentials(updatedCreds);
      setCredsForm({
        currentPassword: '',
        newUsername: 'admin',
        newPassword: '',
        confirmPassword: '',
        name: updatedCreds.name || '',
        email: updatedCreds.email || ''
      });
      await loadData();
    } catch (err: any) {
      setCredsErrorMessage(err.message || 'Failed to reset credentials.');
    } finally {
      setIsUpdatingCreds(false);
    }
  };

  // Handle Card Status Change directly from table
  const handleStatusChange = async (cardId: string, newStatus: CardStatus) => {
    try {
      await updateCardStatus(cardId, newStatus);
      await loadData();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleDeleteAlumnus = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the alumni record for "${name}"?`)) {
      try {
        await deleteAlumnus(id);
        await loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete alumni record');
      }
    }
  };

  // QR Decoding for Add Form
  const handleQRImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setQrDecodeError(null);
    setQrDecodedMessage(null);
    setQrDuplicateWarning(null);

    try {
      const result = await decodeQRCodeFromImage(file);
      if (!result.success || !result.data) {
        setQrDecodeError('QR CODE COULD NOT BE READ: Please upload a clear QR code image.');
        return;
      }

      const decodedVal = result.data.trim();
      // Check uniqueness in live database
      const check = await checkQRUniqueness(decodedVal);
      if (!check.isUnique) {
        setQrDuplicateWarning(
          `⚠ QR CODE ALREADY REGISTERED: This QR code is already associated with an existing alumni record (${check.existingRecord?.alumnus_name || 'Registered Alumni'}).`
        );
        return;
      }

      // Generate preview
      const previewUrl = await generateQRCodeDataUrl(decodedVal, { width: 180 });
      setFormData(prev => ({
        ...prev,
        qr_value: decodedVal,
        qr_image_url: previewUrl
      }));
      setQrDecodedMessage(`Successfully decoded QR code payload: "${decodedVal}"`);
    } catch (err: any) {
      setQrDecodeError(err.message || 'Error processing uploaded QR image.');
    }
  };

  // Open modal with pre-generated unique credentials and QR code
  const handleOpenAddModal = async () => {
    setFormError(null);
    setQrDecodedMessage(null);
    setQrDecodeError(null);
    setQrDuplicateWarning(null);
    setAlumniIdStatus(null);
    setIsAddModalOpen(true);

    try {
      const creds = await fetchNextAlumniCredentials();
      let preview = await generateQRCodeDataUrl(creds.qr_value, { width: 180 });
      if (!preview) {
        const srv = await generateServerQRCode(creds.qr_value, 180).catch(() => null);
        if (srv) preview = srv.qr_image_url;
      }

      setFormData(prev => ({
        ...prev,
        alumni_id: creds.alumni_id,
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        card_number: creds.card_number,
        qr_value: creds.qr_value,
        qr_image_url: preview || ''
      }));
      setQrDecodedMessage(`Official QR Code pre-generated: "${creds.qr_value}"`);
    } catch (err) {
      console.warn('Failed to pre-fetch credentials:', err);
    }
  };

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

  const handleGenerateOfficialQR = async () => {
    setIsGeneratingQR(true);
    setIsGeneratingNewCreds(true);
    setQrDecodeError(null);
    setQrDuplicateWarning(null);

    try {
      // 1. Fetch fresh guaranteed-unique credentials
      let creds;
      try {
        creds = await fetchNextAlumniCredentials();
      } catch {
        const year = new Date().getFullYear();
        const rand = Math.floor(10000 + Math.random() * 90000);
        creds = {
          alumni_id: `PU-${year}-${rand}`,
          card_number: `AC-${year}-${rand}`,
          qr_value: `PU-ALUMNI-${year}-${rand}-VERIFY`
        };
      }

      // 2. Generate QR code image preview
      let previewUrl = await generateQRCodeDataUrl(creds.qr_value, { width: 180 });
      if (!previewUrl) {
        try {
          const srv = await generateServerQRCode(creds.qr_value, 180);
          previewUrl = srv.qr_image_url;
        } catch {
          // fallback
        }
      }

      // 3. Update form data
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
      setQrDuplicateWarning(null);
      setQrDecodeError(null);
    } catch (err: any) {
      console.error('Failed to generate official QR:', err);
      const fallbackToken = `PU-ALUMNI-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}-VERIFY`;
      const fallbackUrl = await generateQRCodeDataUrl(fallbackToken, { width: 180 });
      setFormData(prev => ({
        ...prev,
        qr_value: fallbackToken,
        qr_image_url: fallbackUrl
      }));
      setQrDecodedMessage(`Generated Official Panpacific University QR: "${fallbackToken}"`);
    } finally {
      setIsGeneratingQR(false);
      setIsGeneratingNewCreds(false);
    }
  };

  const handleAutoFixAndSave = async () => {
    setFormError(null);
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('Please fill in First Name and Last Name before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const creds = await fetchNextAlumniCredentials();
      let preview = await generateQRCodeDataUrl(creds.qr_value, { width: 180 }).catch(() => '');
      if (!preview) {
        const srv = await generateServerQRCode(creds.qr_value, 180).catch(() => null);
        if (srv) preview = srv.qr_image_url;
      }

      let finalDegreeLevel: DegreeBatch = 'BACHELORS';
      if (formData.has_doctorate && formData.doctorate_program.trim()) {
        finalDegreeLevel = 'DOCTORATE';
      } else if (formData.has_masters && formData.masters_program.trim()) {
        finalDegreeLevel = 'MASTERS';
      }

      const cleanProgram = formData.program === 'CUSTOM'
        ? (formData.major.trim() ? `Bachelor of Science in ${formData.major.trim()}` : 'Bachelor of Science in Information Technology')
        : (formData.program.trim() || 'Bachelor of Science in Information Technology');

      const cleanCollege = formData.college.trim() || 'College of Computing and Information Technology';

      await createAlumnus({
        ...formData,
        program: cleanProgram,
        college: cleanCollege,
        alumni_id: creds.alumni_id,
        card_number: creds.card_number,
        qr_value: creds.qr_value,
        qr_image_url: preview || '',
        degree_level: finalDegreeLevel
      });

      setIsAddModalOpen(false);
      setActiveTab('alumni');
      setSaveSuccessToast({
        name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        id: creds.alumni_id,
        qr: creds.qr_value
      });
      setTimeout(() => setSaveSuccessToast(null), 8000);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Auto-fix save failed. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('Please fill in the personal details (First Name and Last Name are required).');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Determine clean student ID
      let finalId = formData.alumni_id.trim();
      if (!finalId) {
        try {
          const creds = await fetchNextAlumniCredentials();
          finalId = creds.alumni_id;
        } catch {
          finalId = `PU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        }
      }

      // Check ID uniqueness - if already taken, seamlessly resolve to guaranteed unique ID so saving never fails
      const idCheck = await checkAlumniIdUniqueness(finalId);
      if (!idCheck.isUnique) {
        try {
          const freshCreds = await fetchNextAlumniCredentials();
          finalId = freshCreds.alumni_id;
        } catch {
          finalId = `${finalId}-${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      const cleanId = finalId
        .replace(/^PU-ALUMNI-/, '')
        .replace(/-VERIFY$/, '')
        .replace(/^PU-/, '');

      const finalCardNumber = formData.card_number.trim() || `AC-${cleanId}`;

      // 2. Ensure QR Value
      let activeQRValue = formData.qr_value.trim();
      if (!activeQRValue) {
        activeQRValue = `PU-ALUMNI-${cleanId}-VERIFY`;
      }

      // Ensure QR uniqueness
      const qrCheck = await checkQRUniqueness(activeQRValue);
      if (!qrCheck.isUnique) {
        const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        activeQRValue = `PU-ALUMNI-${cleanId}-${uniqueSuffix}-VERIFY`;
      }

      // 3. Ensure QR image URL
      let activeQRImageUrl = formData.qr_image_url;
      if (!activeQRImageUrl) {
        activeQRImageUrl = await generateQRCodeDataUrl(activeQRValue, { width: 180 });
        if (!activeQRImageUrl) {
          const srv = await generateServerQRCode(activeQRValue, 180).catch(() => null);
          if (srv) activeQRImageUrl = srv.qr_image_url;
        }
      }

      let finalDegreeLevel: DegreeBatch = 'BACHELORS';
      if (formData.has_doctorate && formData.doctorate_program.trim()) {
        finalDegreeLevel = 'DOCTORATE';
      } else if (formData.has_masters && formData.masters_program.trim()) {
        finalDegreeLevel = 'MASTERS';
      } else {
        finalDegreeLevel = 'BACHELORS';
      }

      const cleanProgram = formData.program === 'CUSTOM'
        ? (formData.major.trim() ? `Bachelor of Science in ${formData.major.trim()}` : 'Bachelor of Science in Information Technology')
        : (formData.program.trim() || 'Bachelor of Science in Information Technology');

      const cleanCollege = formData.college.trim() || 'College of Computing and Information Technology';

      await createAlumnus({
        ...formData,
        program: cleanProgram,
        college: cleanCollege,
        alumni_id: finalId,
        card_number: finalCardNumber,
        qr_value: activeQRValue,
        qr_image_url: activeQRImageUrl,
        degree_level: finalDegreeLevel
      });

      setIsAddModalOpen(false);
      setActiveTab('alumni');
      setSaveSuccessToast({
        name: `${formData.first_name.trim()} ${formData.last_name.trim()}`,
        id: finalId,
        qr: activeQRValue
      });
      setTimeout(() => setSaveSuccessToast(null), 8000);

      // Reset form
      setFormData({
        alumni_id: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: '',
        photo_url: '/src/assets/images/alumni_juan_1790822760049.jpg',

        // Batch 1: Bachelor's Degree (Mandatory)
        program: 'Bachelor of Science in Information Technology',
        college: 'College of Computing and Information Technology',
        major: 'Network & Cloud Systems',
        graduation_year: new Date().getFullYear(),
        campus: 'Urdaneta Campus',

        // Batch 2: Master's Degree (Optional / If Applicable)
        has_masters: false,
        masters_program: 'Master in Information Technology (MIT)',
        masters_college: 'School of Advanced Studies',
        masters_major: 'Enterprise Architecture & Cloud Systems',
        masters_year: new Date().getFullYear(),

        // Batch 3: Doctorate Degree (Optional / If Applicable)
        has_doctorate: false,
        doctorate_program: 'Doctor of Information Technology (DIT)',
        doctorate_college: 'School of Advanced Studies',
        doctorate_major: 'Applied Artificial Intelligence & Systems Theory',
        doctorate_year: new Date().getFullYear(),

        degree_level: 'BACHELORS' as DegreeBatch,
        card_number: '',
        issue_date: new Date().toISOString().substring(0, 10),
        expiration_date: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        card_status: 'ACTIVE',
        qr_value: '',
        qr_image_url: ''
      });
      setUploadedPhotoName(null);
      setQrDecodedMessage(null);
      setQrDecodeError(null);
      setQrDuplicateWarning(null);
      setAlumniIdStatus(null);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register alumni record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (alumnus: Alumni & { card?: AlumniCard; qr?: AlumniQRCode }) => {
    setEditingAlumnus(alumnus);
    setEditError(null);
    setEditFormData({
      first_name: alumnus.first_name,
      middle_name: alumnus.middle_name || '',
      last_name: alumnus.last_name,
      suffix: alumnus.suffix || '',
      photo_url: alumnus.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg',
      program: alumnus.program,
      college: alumnus.college,
      major: alumnus.major || '',
      graduation_year: alumnus.graduation_year,
      campus: alumnus.campus,
      has_masters: !!alumnus.has_masters,
      masters_program: alumnus.masters_program || 'Master in Information Technology (MIT)',
      masters_college: alumnus.masters_college || 'School of Advanced Studies',
      masters_major: alumnus.masters_major || '',
      masters_year: alumnus.masters_year || new Date().getFullYear(),
      has_doctorate: !!alumnus.has_doctorate,
      doctorate_program: alumnus.doctorate_program || 'Doctor of Information Technology (DIT)',
      doctorate_college: alumnus.doctorate_college || 'School of Advanced Studies',
      doctorate_major: alumnus.doctorate_major || '',
      doctorate_year: alumnus.doctorate_year || new Date().getFullYear(),
      card_number: alumnus.card?.card_number || '',
      card_status: alumnus.card?.status || 'ACTIVE',
      expiration_date: alumnus.card?.expiration_date || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlumnus || !editFormData) return;
    setEditError(null);
    setIsEditSubmitting(true);
    try {
      await updateAlumnus(editingAlumnus.id, editFormData);
      setSaveSuccessToast({
        name: `${editFormData.first_name.trim()} ${editFormData.last_name.trim()}`,
        id: editingAlumnus.alumni_id,
        qr: 'Record Updated'
      });
      setTimeout(() => setSaveSuccessToast(null), 6000);
      setEditingAlumnus(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update record');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Filtered alumni list
  const filteredAlumni = alumniList.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.first_name.toLowerCase().includes(q) ||
      item.last_name.toLowerCase().includes(q) ||
      item.alumni_id.toLowerCase().includes(q) ||
      (item.card?.card_number || '').toLowerCase().includes(q) ||
      item.program.toLowerCase().includes(q) ||
      (item.masters_program || '').toLowerCase().includes(q) ||
      (item.doctorate_program || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || item.card?.status === statusFilter;

    const highestDegree = getHighestDegree(item);
    const matchesDegree =
      degreeFilter === 'ALL'
        ? true
        : degreeFilter === 'DOCTORATE'
        ? item.has_doctorate || highestDegree === 'DOCTORATE'
        : degreeFilter === 'MASTERS'
        ? item.has_masters || highestDegree === 'MASTERS'
        : true; // All graduates hold Bachelor's foundation

    return matchesSearch && matchesStatus && matchesDegree;
  });


  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* Centralized Cloud Database Sync Status Banner */}
      <CentralSyncAdminBanner />

      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Registrar Management Portal
            </span>
          </div>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
            Alumni & QR Registry System
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Authoritative university repository for alumni records, identification cards, and cryptographic verification tokens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border shadow-2xs ${
              activeTab === 'security'
                ? 'bg-amber-900 text-white border-amber-900'
                : 'text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-300/80'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-700" />
            <span>Change Credentials</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Alumni & QR</span>
          </button>
        </div>
      </div>

      {/* Save Success Alert Banner */}
      {saveSuccessToast && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="font-bold text-xs text-emerald-950 flex items-center gap-2">
                <span>Alumni + QR Record Saved to Database!</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  {saveSuccessToast.id}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Successfully registered <strong>{saveSuccessToast.name}</strong> with verified QR Token payload <code>"{saveSuccessToast.qr}"</code>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => {
                const found = alumniList.find(a => a.alumni_id === saveSuccessToast.id);
                if (found) setSelectedAlumnusForCard(found);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <IdCard className="w-3.5 h-3.5" />
              <span>View ID Card</span>
            </button>
            <button
              onClick={() => onTestVerify(saveSuccessToast.qr)}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Test Scan</span>
            </button>
            <button
              onClick={() => setSaveSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 font-bold text-sm cursor-pointer ml-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs sm:text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'border-amber-800 text-amber-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Overview & Statistics
        </button>

        <button
          onClick={() => setActiveTab('alumni')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'alumni'
              ? 'border-amber-800 text-amber-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Alumni Directory ({alumniList.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'border-amber-800 text-amber-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Verification Audit Trail ({verificationLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
            activeTab === 'activity'
              ? 'border-amber-800 text-amber-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Admin Activity Logs
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'security'
              ? 'border-amber-800 text-amber-950 font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-700" />
          <span>Security & Credentials</span>
          {adminCredentials?.is_default && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Default credentials active"></span>
          )}
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Stats Metrics Required by Section 15 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Total Alumni</span>
                <Users className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900">
                {stats?.total_alumni ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Registered graduates</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Active Cards</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {stats?.active_cards ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Fully validated cards</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Expired Cards</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-700">
                {stats?.expired_cards ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Requires card renewal</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Revoked Cards</span>
                <Ban className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-red-700">
                {stats?.revoked_cards ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Decommissioned / void</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>QRs Registered</span>
                <QrCode className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900">
                {stats?.qr_codes_registered ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Linked to physical cards</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Total Verifications</span>
                <ShieldCheck className="w-4 h-4 text-amber-800" />
              </div>
              <div className="text-2xl font-bold font-mono text-stone-900">
                {stats?.total_verifications ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">All-time scan requests</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Today's Scans</span>
                <Calendar className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-amber-900">
                {stats?.today_verifications ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Processed in past 24 hrs</div>
            </div>

            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between text-stone-500 text-xs font-semibold uppercase tracking-wider">
                <span>Not Found Attempts</span>
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-red-600">
                {stats?.not_found_attempts ?? 0}
              </div>
              <div className="text-[11px] text-stone-500">Unregistered QR scans</div>
            </div>
          </div>

          {/* Quick status test preview */}
          <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900 text-sm">
                  Live Database Status Reactivity Demonstrator
                </h3>
                <p className="text-xs text-stone-500">
                  Toggle status of any alumni card below, then scan or test to verify immediate reflection on public certificates.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-y border-stone-200 text-stone-600 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Alumnus Name & ID</th>
                    <th className="py-2.5 px-3">Card Number</th>
                    <th className="py-2.5 px-3">Live Card Status</th>
                    <th className="py-2.5 px-3">Quick Change Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {alumniList.slice(0, 4).map(item => (
                    <tr key={item.id} className="hover:bg-stone-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-stone-900">{item.first_name} {item.last_name}</div>
                        <div className="font-mono text-stone-500 text-[11px]">{item.alumni_id}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {item.card?.card_number || 'N/A'}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.card?.status === 'ACTIVE' && (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ACTIVE
                          </span>
                        )}
                        {item.card?.status === 'EXPIRED' && (
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            EXPIRED
                          </span>
                        )}
                        {item.card?.status === 'REVOKED' && (
                          <span className="font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                            REVOKED
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.card && (
                          <select
                            value={item.card.status}
                            onChange={(e) => handleStatusChange(item.card!.id, e.target.value as CardStatus)}
                            className="text-xs bg-white border border-stone-300 rounded px-2 py-1 font-medium focus:ring-1 focus:ring-amber-800 cursor-pointer"
                          >
                            <option value="ACTIVE">ACTIVE (Verified)</option>
                            <option value="EXPIRED">EXPIRED (Expired Card)</option>
                            <option value="REVOKED">REVOKED (Invalid)</option>
                          </select>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          onClick={() => onTestVerify(item.qr?.qr_value || item.alumni_id)}
                          className="px-2.5 py-1 bg-stone-900 hover:bg-amber-900 text-white font-medium rounded text-[11px] cursor-pointer"
                        >
                          Test Public Scan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALUMNI DIRECTORY */}
      {activeTab === 'alumni' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden space-y-4 p-5">
          {/* Search, Action, and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, program..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-800/40"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                title="Register New Alumni & Generate QR Code"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Register Alumni</span>
                <span className="sm:hidden">Register</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Degree Level:</span>
                <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
                  {(['ALL', 'BACHELORS', 'MASTERS', 'DOCTORATE'] as const).map(batch => (
                    <button
                      key={batch}
                      onClick={() => setDegreeFilter(batch)}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                        degreeFilter === batch
                          ? 'bg-white text-stone-900 shadow-2xs font-bold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {batch === 'ALL' ? 'All Degrees' : batch === 'BACHELORS' ? "Bachelor's" : batch === 'MASTERS' ? "Master's" : 'Doctorate'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-stone-500 font-medium">Status:</span>
                <div className="flex gap-1 p-0.5 bg-stone-100 rounded-lg">
                  {(['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                        statusFilter === st
                          ? 'bg-white text-stone-900 shadow-2xs font-bold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-y border-stone-200 text-stone-600 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Alumnus</th>
                  <th className="py-3 px-3">Academic Program</th>
                  <th className="py-3 px-3">Card & Expiration</th>
                  <th className="py-3 px-3">Card Status</th>
                  <th className="py-3 px-3">QR Payload</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredAlumni.map(item => (
                  <tr key={item.id} className="hover:bg-stone-50/60">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg'}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-stone-300 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-stone-900 text-xs">
                            {item.first_name} {item.middle_name ? item.middle_name[0] + '. ' : ''}{item.last_name} {item.suffix}
                          </div>
                          <div className="font-mono text-stone-500 text-[11px]">{item.alumni_id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {(() => {
                          const highest = getHighestDegree(item);
                          const badge = getDegreeBatchBadge(highest);
                          return (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${badge.className}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                        {item.has_masters && (
                          <span className="text-[9px] px-1 py-0.2 rounded border bg-purple-50 text-purple-800 border-purple-200 font-semibold">
                            + Master's
                          </span>
                        )}
                        {item.has_doctorate && (
                          <span className="text-[9px] px-1 py-0.2 rounded border bg-amber-50 text-amber-900 border-amber-300 font-semibold">
                            + Doctorate
                          </span>
                        )}
                      </div>
                      <div className="text-stone-900 font-medium">{item.program}</div>
                      <div className="text-stone-500 text-[11px]">{item.campus} · Class of {item.graduation_year}</div>
                      {item.has_masters && item.masters_program && (
                        <div className="text-purple-900 text-[11px] font-medium mt-0.5">
                          ↳ Master's: {item.masters_program} ({item.masters_year || 'N/A'})
                        </div>
                      )}
                      {item.has_doctorate && item.doctorate_program && (
                        <div className="text-amber-900 text-[11px] font-medium mt-0.5">
                          ↳ Doctorate: {item.doctorate_program} ({item.doctorate_year || 'N/A'})
                        </div>
                      )}
                    </td>


                    <td className="py-3 px-3">
                      <div className="font-mono text-stone-900">{item.card?.card_number || 'N/A'}</div>
                      <div className="text-stone-500 text-[11px]">
                        Exp: {item.card?.expiration_date ? new Date(item.card.expiration_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {item.card && (
                        <select
                          value={item.card.status}
                          onChange={(e) => handleStatusChange(item.card!.id, e.target.value as CardStatus)}
                          className={`text-xs font-semibold rounded px-2 py-1 border cursor-pointer ${
                            item.card.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.card.status === 'EXPIRED'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-red-50 text-red-800 border-red-300'
                          }`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="REVOKED">REVOKED</option>
                        </select>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-stone-500 max-w-[150px] truncate" title={item.qr?.qr_value}>
                      {item.qr?.qr_value || 'None'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedAlumnusForQRModal(item)}
                          title="View & Download Official QR Code"
                          className="p-1.5 text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setSelectedAlumnusForCard(item)}
                          title="View Official Physical ID Card"
                          className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded cursor-pointer"
                        >
                          <IdCard className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Alumni Information & Degrees"
                          className="p-1.5 text-stone-700 hover:text-amber-950 bg-stone-100 hover:bg-amber-100 border border-stone-200 rounded cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onTestVerify(item.qr?.qr_value || item.alumni_id)}
                          title="Test Live Public Verification"
                          className="px-2 py-1 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded cursor-pointer"
                        >
                          Test Scan
                        </button>

                        <button
                          onClick={() => handleDeleteAlumnus(item.id, `${item.first_name} ${item.last_name}`)}
                          title="Delete Record"
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VERIFICATION LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-stone-900 text-sm">
                Official Verification Audit Trail
              </h3>
              <p className="text-xs text-stone-500">
                Immutable event log of every QR verification attempt performed on the live database.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">Total Scans: {verificationLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 border-y border-stone-200 text-stone-600 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Queried Token</th>
                  <th className="py-2.5 px-3">Alumnus Matched</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Client IP / Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {verificationLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                      {log.verification_reference}
                    </td>

                    <td className="py-2.5 px-3">
                      {log.result === 'VERIFIED' && (
                        <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                          VERIFIED
                        </span>
                      )}
                      {log.result === 'EXPIRED' && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold border border-amber-200">
                          EXPIRED
                        </span>
                      )}
                      {log.result === 'REVOKED' && (
                        <span className="text-red-800 bg-red-50 px-2 py-0.5 rounded font-bold border border-red-200">
                          REVOKED
                        </span>
                      )}
                      {log.result === 'NOT_FOUND' && (
                        <span className="text-stone-700 bg-stone-100 px-2 py-0.5 rounded font-bold border border-stone-200">
                          NOT_FOUND
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-stone-600 max-w-[140px] truncate" title={log.queried_token}>
                      {log.queried_token}
                    </td>

                    <td className="py-2.5 px-3 text-stone-800 font-medium">
                      {log.alumni_name || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                      {new Date(log.verified_at).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 text-stone-400 font-mono text-[11px] max-w-[180px] truncate" title={log.user_agent}>
                      {log.ip_address} · {log.user_agent?.substring(0, 30)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY LOGS */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 space-y-4">
          <h3 className="font-semibold text-stone-900 text-sm">
            Administrator Action Log
          </h3>
          <div className="divide-y divide-stone-100">
            {activityLogs.map(log => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-stone-900 flex items-center gap-2">
                    <span className="font-mono text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {log.action}
                    </span>
                    <span>by {log.admin_id}</span>
                  </div>
                  <div className="text-stone-600">{log.details || `Target: ${log.target_id}`}</div>
                </div>
                <div className="text-stone-400 whitespace-nowrap font-mono text-[11px]">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY & CREDENTIALS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Status Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-stone-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 text-amber-900 border border-amber-300">
                    <Shield className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="font-cinzel text-lg font-bold text-stone-900">
                      Administrator Authentication & Security
                    </h2>
                    <p className="text-xs text-stone-500">
                      Manage login credentials, institutional access identifiers, and security authorizations.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                {adminCredentials?.is_default ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
                    <ShieldAlert className="w-4 h-4 text-amber-700" />
                    <span>Default Credentials Active (admin / admin)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Custom Credentials Configured</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Active Username
                </span>
                <span className="font-mono text-sm font-bold text-stone-900 block truncate">
                  {adminCredentials?.username || 'admin'}
                </span>
                <span className="text-[10px] text-stone-400">Used during sign in</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Administrative Role
                </span>
                <span className="text-xs font-semibold text-stone-800 block truncate">
                  {adminCredentials?.role || 'REGISTRAR_ADMIN'}
                </span>
                <span className="text-[10px] text-stone-400">Full institutional permissions</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Signatory Office
                </span>
                <span className="text-xs font-semibold text-stone-800 block truncate" title={adminCredentials?.name}>
                  {adminCredentials?.name || 'Panpacific University Registrar & Alumni Affairs'}
                </span>
                <span className="text-[10px] text-stone-400">Printed on official reports</span>
              </div>

              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
                  Last Changed
                </span>
                <span className="text-xs font-mono font-medium text-stone-700 block truncate">
                  {adminCredentials?.updated_at ? new Date(adminCredentials.updated_at).toLocaleDateString() : 'Initial Setup'}
                </span>
                <span className="text-[10px] text-stone-400">Credential revision date</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-cinzel text-base font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-800" />
                <span>Change Administrator Credentials</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Enter your current password to authorize updates to the administrator username and password.
              </p>
            </div>

            {credsSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Credential Change Successful</div>
                  <p className="mt-0.5">{credsSuccessMessage}</p>
                </div>
              </div>
            )}

            {credsErrorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Update Failed</div>
                  <p className="mt-0.5">{credsErrorMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateCredentials} className="space-y-6">
              {/* Current Password Field (Verification) */}
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                <label className="block text-xs font-semibold text-amber-950 uppercase tracking-wider">
                  Current Administrator Password *
                </label>
                <div className="relative max-w-md">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={credsForm.currentPassword}
                    onChange={(e) => setCredsForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password (default: admin)"
                    className="w-full px-3.5 py-2.5 pr-10 border border-amber-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800">
                  Required to authenticate the credential update request. If you haven't changed it yet, the default is <code className="font-mono font-bold">admin</code>.
                </p>
              </div>

              {/* New Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    New Username *
                  </label>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={credsForm.newUsername}
                    onChange={(e) => setCredsForm(prev => ({ ...prev, newUsername: e.target.value }))}
                    placeholder="e.g. registrar_admin"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-stone-900 bg-white"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Minimum 3 characters. Case-insensitive when logging in.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Administrator Display Title
                  </label>
                  <input
                    type="text"
                    value={credsForm.name}
                    onChange={(e) => setCredsForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Panpacific University Registrar"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-stone-900 bg-white"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Displays in the admin console header and session badge.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={credsForm.newPassword}
                      onChange={(e) => setCredsForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Leave blank to keep current password"
                      className="w-full px-3.5 py-2.5 pr-10 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-stone-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                      title={showNewPass ? 'Hide password' : 'Show password'}
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Minimum 4 characters. Leave blank if only changing username.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={credsForm.confirmPassword}
                      onChange={(e) => setCredsForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                      className={`w-full px-3.5 py-2.5 pr-10 border rounded-lg text-xs focus:outline-none focus:ring-2 bg-white ${
                        credsForm.newPassword && credsForm.confirmPassword && credsForm.newPassword !== credsForm.confirmPassword
                          ? 'border-red-400 focus:ring-red-400/40'
                          : 'border-stone-300 focus:ring-amber-800/40 text-stone-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
                      title={showConfirmPass ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {credsForm.newPassword && credsForm.confirmPassword && (
                    <p className={`text-[11px] mt-1 ${credsForm.newPassword === credsForm.confirmPassword ? 'text-emerald-700 font-medium' : 'text-red-600'}`}>
                      {credsForm.newPassword === credsForm.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                    Institutional Email Address
                  </label>
                  <input
                    type="email"
                    value={credsForm.email}
                    onChange={(e) => setCredsForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="registrar@panpacificu.edu.ph"
                    className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-stone-900 bg-white"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Also supported as an alternative login identifier alongside the username.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isUpdatingCreds}
                  className="px-6 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isUpdatingCreds ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save New Administrator Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Factory Default Reset Card */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-semibold text-stone-900 text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-stone-500" />
                <span>Restore Factory Defaults</span>
              </h4>
              <p className="text-xs text-stone-500 max-w-xl">
                Reset administrator credentials back to initial system defaults (<code className="font-mono bg-stone-200 px-1 rounded">Username: admin</code> and <code className="font-mono bg-stone-200 px-1 rounded">Password: admin</code>).
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetToDefaults}
              disabled={isUpdatingCreds}
              className="px-4 py-2 border border-stone-300 hover:bg-white text-stone-700 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              Reset to Factory Defaults
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTER ALUMNI & QR RECORD                       */}
      {/* ======================================================== */}
      <RegisterAlumniModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async (res) => {
          setIsAddModalOpen(false);
          setActiveTab('alumni');
          if (res?.alumnus) {
            setSaveSuccessToast({
              name: `${res.alumnus.first_name} ${res.alumnus.last_name}`,
              id: res.alumnus.alumni_id,
              qr: res.qr?.qr_value || ''
            });
            setTimeout(() => setSaveSuccessToast(null), 8000);
          }
          await loadData();
        }}
      />

      {/* ======================================================== */}
      {/* MODAL: PHYSICAL ALUMNI ID CARD PREVIEW (PRINTABLE)       */}
      {/* ======================================================== */}
      {selectedAlumnusForCard && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-cinzel text-lg font-bold text-stone-900">
                  Official Alumni Identification Card
                </h3>
                <p className="text-xs text-stone-500">
                  Physical card layout with front credential and reverse verification QR code.
                </p>
              </div>
              <button
                onClick={() => setSelectedAlumnusForCard(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Front & Back Cards */}
            <div className="space-y-4">
              {/* Front Card */}
              <div className="bg-linear-to-br from-amber-950 via-stone-900 to-amber-900 text-white rounded-xl p-5 shadow-lg border border-amber-800/40 relative overflow-hidden aspect-[1.58/1]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/src/assets/images/university_seal_1790822746896.jpg"
                      alt=""
                      className="w-10 h-10 object-contain rounded-full border border-amber-400/30"
                    />
                    <div>
                      <div className="font-cinzel text-xs font-bold tracking-wider text-amber-200 uppercase">
                        Panpacific University
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-stone-300">
                        Alumni Association
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-widest text-amber-400 font-semibold block">Card No.</span>
                    <span className="font-mono text-xs font-bold text-white">{selectedAlumnusForCard.card?.card_number}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <img
                    src={selectedAlumnusForCard.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg'}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover border-2 border-amber-400/80 shadow-md shrink-0"
                  />
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="font-cinzel text-sm sm:text-base font-bold text-amber-100 uppercase truncate">
                      {selectedAlumnusForCard.first_name} {selectedAlumnusForCard.last_name} {selectedAlumnusForCard.suffix}
                    </div>
                    <div className="text-[10px] text-stone-300 truncate">
                      {selectedAlumnusForCard.has_doctorate && selectedAlumnusForCard.doctorate_program
                        ? `Doctorate: ${selectedAlumnusForCard.doctorate_program}`
                        : selectedAlumnusForCard.has_masters && selectedAlumnusForCard.masters_program
                        ? `Master's: ${selectedAlumnusForCard.masters_program}`
                        : selectedAlumnusForCard.program}
                    </div>
                    <div className="text-[10px] font-mono text-stone-400">
                      ID: {selectedAlumnusForCard.alumni_id} · Class of {selectedAlumnusForCard.graduation_year}
                    </div>

                  </div>
                </div>

                <div className="absolute bottom-3 left-5 right-5 flex items-center justify-between text-[9px] text-stone-400 border-t border-amber-900/60 pt-2">
                  <span>Status: <strong className="text-amber-200">{selectedAlumnusForCard.card?.status}</strong></span>
                  <span>Expires: {selectedAlumnusForCard.card ? new Date(selectedAlumnusForCard.card.expiration_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              {/* Back Card with QR */}
              <div className="bg-stone-100 text-stone-900 rounded-xl p-5 shadow-inner border border-stone-300 aspect-[1.58/1] flex flex-col justify-between">
                <div className="text-[9px] text-stone-500 leading-tight">
                  This card certifies alumni membership at Panpacific University. Present upon request for campus access and authorized privileges.
                </div>

                <div className="flex items-center justify-between gap-4 my-auto">
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wider font-bold text-stone-700">Official Verification QR</div>
                    <p className="text-[9px] text-stone-500 max-w-[200px]">
                      Scan to authenticate credentials against the live university registrar database.
                    </p>
                    <div className="font-mono text-[9px] text-stone-600 truncate max-w-[200px]">
                      {selectedAlumnusForCard.qr?.qr_value}
                    </div>
                  </div>

                  {cardLiveQRUrl || selectedAlumnusForCard.qr?.qr_image_url ? (
                    <img
                      src={cardLiveQRUrl || selectedAlumnusForCard.qr?.qr_image_url}
                      alt="Card QR"
                      className="w-16 h-16 border border-stone-400 rounded p-0.5 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white border border-stone-400 rounded flex items-center justify-center font-mono text-[9px]">
                      QR CODE
                    </div>
                  )}
                </div>

                <div className="text-center text-[8px] text-stone-400 uppercase tracking-widest border-t border-stone-200 pt-1">
                  Panpacific University · Office of Alumni Affairs · San Vicente, Urdaneta City
                </div>
              </div>
            </div>

            {/* Live Mobile Scan Box */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-800" />
                  <span className="font-bold text-xs text-stone-900 font-cinzel">
                    Test Live Scan on Your Mobile Device
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Live Database
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {cardLiveQRUrl && (
                  <div className="p-2 bg-white rounded-lg border border-stone-300 shadow-xs shrink-0">
                    <img
                      src={cardLiveQRUrl}
                      alt="Live Mobile QR"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                )}
                <div className="space-y-1.5 text-xs text-center sm:text-left flex-1">
                  <p className="text-stone-600 text-[11px] leading-relaxed">
                    Point your smartphone camera (iPhone Camera or Android Lens) directly at this QR code. It will open this live university database and display this verified credential!
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const token = selectedAlumnusForCard.qr?.qr_value || selectedAlumnusForCard.alumni_id;
                        const liveVerifyUrl = `${window.location.origin}/?verify=${encodeURIComponent(token)}`;
                        navigator.clipboard.writeText(liveVerifyUrl);
                        setCardCopiedUrl(true);
                        setTimeout(() => setCardCopiedUrl(false), 2000);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 text-xs font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                    >
                      {cardCopiedUrl ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                          <span>Copy Mobile Verification Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
              <button
                onClick={() => setSelectedAlumnusForCard(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedAlumnusForCard(null);
                  onTestVerify(selectedAlumnusForCard.qr?.qr_value || selectedAlumnusForCard.alumni_id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg cursor-pointer"
              >
                Test Verification of This Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DEDICATED ALUMNI QR CODE VIEW & DOWNLOAD          */}
      {/* ======================================================== */}
      {selectedAlumnusForQRModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="font-cinzel text-base font-bold text-stone-900">
                  Official Alumni QR Code
                </h3>
                <p className="text-xs text-stone-500">
                  Panpacific University Cryptographic Verification Asset
                </p>
              </div>
              <button
                onClick={() => setSelectedAlumnusForQRModal(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* QR Code Presentation Box */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white rounded-xl border border-stone-300 shadow-md">
                <img
                  src={
                    selectedAlumnusForQRModal.qr?.qr_image_url ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                      selectedAlumnusForQRModal.qr?.qr_value || selectedAlumnusForQRModal.alumni_id
                    )}`
                  }
                  alt="Alumni QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="space-y-1 w-full">
                <div className="font-cinzel font-bold text-stone-900 text-sm">
                  {selectedAlumnusForQRModal.first_name} {selectedAlumnusForQRModal.middle_name} {selectedAlumnusForQRModal.last_name} {selectedAlumnusForQRModal.suffix}
                </div>
                <div className="text-xs text-amber-900 font-mono font-bold">
                  {selectedAlumnusForQRModal.alumni_id} • {selectedAlumnusForQRModal.card?.card_number || 'N/A'}
                </div>
                <div className="text-[11px] text-stone-500 line-clamp-1">
                  {selectedAlumnusForQRModal.program} ({selectedAlumnusForQRModal.graduation_year})
                </div>
              </div>

              {/* Payload box */}
              <div className="w-full bg-white p-2.5 rounded-lg border border-stone-200 text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                  Cryptographic Payload
                </div>
                <div className="font-mono text-xs text-stone-800 break-all select-all font-semibold">
                  {selectedAlumnusForQRModal.qr?.qr_value || selectedAlumnusForQRModal.alumni_id}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <a
                href={
                  selectedAlumnusForQRModal.qr?.qr_image_url ||
                  `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                    selectedAlumnusForQRModal.qr?.qr_value || selectedAlumnusForQRModal.alumni_id
                  )}`
                }
                download={`${selectedAlumnusForQRModal.alumni_id}-qr-code.png`}
                className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Download QR (PNG)</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const token = selectedAlumnusForQRModal.qr?.qr_value || selectedAlumnusForQRModal.alumni_id;
                  setSelectedAlumnusForQRModal(null);
                  onTestVerify(token);
                }}
                className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Test Verify QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT ALUMNI RECORD                                */}
      {/* ======================================================== */}
      {editingAlumnus && editFormData && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h2 className="font-cinzel text-xl font-bold text-stone-900">
                  Edit Alumni Record
                </h2>
                <p className="text-xs text-stone-500">
                  Alumni ID: <span className="font-mono font-bold text-amber-900">{editingAlumnus.alumni_id}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingAlumnus(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Personal Details */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                  1. Personal Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={editFormData.middle_name}
                      onChange={(e) => setEditFormData({ ...editFormData, middle_name: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Suffix (e.g. Jr., III)</label>
                    <input
                      type="text"
                      value={editFormData.suffix}
                      onChange={(e) => setEditFormData({ ...editFormData, suffix: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bachelor's Degree */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                  2. Undergraduate Academic Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Bachelor's Degree Program</label>
                    <select
                      value={editFormData.program}
                      onChange={(e) => setEditFormData({ ...editFormData, program: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white cursor-pointer"
                    >
                      {(ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'BACHELORS')?.programs || []).map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Major / Specialization</label>
                    <input
                      type="text"
                      value={editFormData.major}
                      onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Graduation Year</label>
                    <input
                      type="number"
                      value={editFormData.graduation_year}
                      onChange={(e) => setEditFormData({ ...editFormData, graduation_year: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Campus</label>
                    <select
                      value={editFormData.campus}
                      onChange={(e) => setEditFormData({ ...editFormData, campus: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white cursor-pointer"
                    >
                      <option value="Urdaneta Campus">Urdaneta Campus</option>
                      <option value="Tayug Campus">Tayug Campus</option>
                      <option value="Main Campus">Main Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">College</label>
                    <input
                      type="text"
                      value={editFormData.college}
                      onChange={(e) => setEditFormData({ ...editFormData, college: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Post-Graduate Credentials */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                  3. Post-Graduate Qualifications
                </div>

                {/* Master's Degree */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.has_masters}
                      onChange={(e) => setEditFormData({ ...editFormData, has_masters: e.target.checked })}
                      className="rounded border-stone-300 text-purple-900 focus:ring-purple-800 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Has Conferred Master's Degree
                    </span>
                  </label>

                  {editFormData.has_masters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-stone-700 mb-1">Master's Program</label>
                        <select
                          value={editFormData.masters_program}
                          onChange={(e) => setEditFormData({ ...editFormData, masters_program: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white cursor-pointer"
                        >
                          {(ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'MASTERS')?.programs || []).map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Master's Specialization</label>
                        <input
                          type="text"
                          value={editFormData.masters_major}
                          onChange={(e) => setEditFormData({ ...editFormData, masters_major: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Conferred Year</label>
                        <input
                          type="number"
                          value={editFormData.masters_year}
                          onChange={(e) => setEditFormData({ ...editFormData, masters_year: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Doctorate Degree */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.has_doctorate}
                      onChange={(e) => setEditFormData({ ...editFormData, has_doctorate: e.target.checked })}
                      className="rounded border-stone-300 text-amber-900 focus:ring-amber-800 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800">
                      Has Conferred Doctorate Degree
                    </span>
                  </label>

                  {editFormData.has_doctorate && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-stone-700 mb-1">Doctorate Program</label>
                        <select
                          value={editFormData.doctorate_program}
                          onChange={(e) => setEditFormData({ ...editFormData, doctorate_program: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white cursor-pointer"
                        >
                          {(ACADEMIC_PROGRAM_BATCHES.find(b => b.batch === 'DOCTORATE')?.programs || []).map((p) => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Doctorate Field</label>
                        <input
                          type="text"
                          value={editFormData.doctorate_major}
                          onChange={(e) => setEditFormData({ ...editFormData, doctorate_major: e.target.value })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">Conferred Year</label>
                        <input
                          type="number"
                          value={editFormData.doctorate_year}
                          onChange={(e) => setEditFormData({ ...editFormData, doctorate_year: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Status & Expiration */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1">
                  4. Card Status & Validity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Card Number</label>
                    <input
                      type="text"
                      value={editFormData.card_number}
                      onChange={(e) => setEditFormData({ ...editFormData, card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Card Status</label>
                    <select
                      value={editFormData.card_status}
                      onChange={(e) => setEditFormData({ ...editFormData, card_status: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white cursor-pointer font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                      <option value="REVOKED">REVOKED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Expiration Date</label>
                    <input
                      type="date"
                      value={editFormData.expiration_date}
                      onChange={(e) => setEditFormData({ ...editFormData, expiration_date: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-1 focus:ring-amber-800 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingAlumnus(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
