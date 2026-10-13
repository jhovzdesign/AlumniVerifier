export type CardStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type VerificationResult = 'VERIFIED' | 'EXPIRED' | 'REVOKED' | 'NOT_FOUND';

export type DegreeBatch = 'BACHELORS' | 'MASTERS' | 'DOCTORATE';

export interface Alumni {
  id: string;
  alumni_id: string; // e.g. PU-2024-00123
  first_name: string;
  middle_name?: string;
  last_name: string;
  suffix?: string;
  photo_url: string;
  program: string; // Bachelor's Degree (e.g. Bachelor of Science in Information Technology)
  degree_level?: DegreeBatch; // Highest attained: 'BACHELORS' | 'MASTERS' | 'DOCTORATE'
  college: string; // e.g. College of Computing and Information Technology
  major?: string;
  graduation_year: number; // e.g. 2024
  campus: string; // e.g. Urdaneta Campus

  // Master's Degree (Optional / If Applicable)
  has_masters?: boolean;
  masters_program?: string;
  masters_college?: string;
  masters_major?: string;
  masters_year?: number;

  // Doctorate Degree (Optional / If Applicable)
  has_doctorate?: boolean;
  doctorate_program?: string;
  doctorate_college?: string;
  doctorate_major?: string;
  doctorate_year?: number;

  created_at: string;
  updated_at: string;
}

export interface AlumniCard {
  id: string;
  alumni_id: string;
  card_number: string; // e.g. AC-2024-00123
  issue_date: string;
  expiration_date: string;
  status: CardStatus;
  created_at: string;
  updated_at: string;
}

export interface AlumniQRCode {
  id: string;
  card_id: string;
  qr_image_url?: string;
  qr_value: string;
  status: 'ACTIVE' | 'REVOKED';
  uploaded_at: string;
  updated_at: string;
}

export interface VerificationLog {
  id: string;
  qr_id?: string | null;
  card_id?: string | null;
  verification_reference: string; // e.g. VER-2026-8X29P7
  result: VerificationResult;
  verified_at: string;
  ip_address?: string;
  user_agent?: string;
  queried_token?: string;
  alumni_name?: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_id: string;
  details?: string;
  created_at: string;
}

export interface VerificationResponse {
  result: VerificationResult;
  verification_reference: string;
  verified_at: string;
  message?: string;
  alumni?: {
    id: string;
    alumni_id: string;
    full_name: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    photo_url: string;
    program: string;
    degree_level?: DegreeBatch;
    college: string;
    major?: string;
    graduation_year: number;
    campus: string;

    // Master's Degree (Optional / If Applicable)
    has_masters?: boolean;
    masters_program?: string;
    masters_college?: string;
    masters_major?: string;
    masters_year?: number;

    // Doctorate Degree (Optional / If Applicable)
    has_doctorate?: boolean;
    doctorate_program?: string;
    doctorate_college?: string;
    doctorate_major?: string;
    doctorate_year?: number;
  };
  card?: {
    id: string;
    card_number: string;
    issue_date: string;
    expiration_date: string;
    status: CardStatus;
  };
  qr?: {
    qr_value: string;
    status: string;
  };
  university?: {
    name: string;
    tagline: string;
    address: string;
    logo_url: string;
    office: string;
    registrar_signatory: string;
    alumni_director_signatory: string;
  };
}

export interface DashboardStats {
  total_alumni: number;
  active_cards: number;
  expired_cards: number;
  revoked_cards: number;
  qr_codes_registered: number;
  total_verifications: number;
  today_verifications: number;
  not_found_attempts: number;
}

export interface AdminCredentialsInfo {
  username: string;
  name: string;
  role: string;
  email?: string;
  updated_at: string;
  is_default: boolean;
}

export interface UpdateCredentialsPayload {
  currentPassword: string;
  newUsername?: string;
  newPassword?: string;
  name?: string;
  email?: string;
}

export interface DBChangeEvent {
  version: number;
  timestamp: string;
  action:
    | 'CREATE_ALUMNI'
    | 'UPDATE_ALUMNI'
    | 'DELETE_ALUMNI'
    | 'UPDATE_CARD_STATUS'
    | 'UPDATE_UNIVERSITY'
    | 'UPDATE_CREDENTIALS'
    | 'RESET_CREDENTIALS'
    | 'VERIFY_QR'
    | 'EXTERNAL_SYNC';
  entity: 'alumni' | 'card' | 'university' | 'verification' | 'credentials' | 'database';
  id?: string;
  summary?: string;
  clientCount?: number;
}

export interface SyncStatusResponse {
  status: 'online' | 'degraded';
  version: number;
  lastModified: string;
  clientCount: number;
  alumniCount: number;
  totalVerifications: number;
}

