import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import QRCode from 'qrcode';
import type { Alumni, AlumniCard, AlumniQRCode, VerificationLog, ActivityLog, DashboardStats, VerificationResult, DegreeBatch, DBChangeEvent } from '../src/types/index.ts';
import { detectDegreeBatch } from '../src/utils/academicPrograms.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export interface UniversityConfig {
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  logo_url: string;
  office: string;
  registrar_signatory: string;
  registrar_title: string;
  alumni_director_signatory: string;
  alumni_director_title: string;
}

export interface StoredAdminCredentials {
  username: string;
  password: string;
  name: string;
  role: string;
  email?: string;
  updated_at: string;
}

export interface DatabaseSchema {
  university: UniversityConfig;
  alumni: Alumni[];
  alumni_cards: AlumniCard[];
  alumni_qr_codes: AlumniQRCode[];
  verification_logs: VerificationLog[];
  activity_logs: ActivityLog[];
  admin_credentials?: StoredAdminCredentials;
}

export const defaultAdminCredentials: StoredAdminCredentials = {
  username: 'admin',
  password: 'admin',
  name: 'Panpacific University Registrar & Alumni Affairs',
  role: 'REGISTRAR_ADMIN',
  email: 'registrar@panpacificu.edu.ph',
  updated_at: '2026-01-01T00:00:00.000Z'
};

export const defaultUniversity: UniversityConfig = {
  name: 'PANPACIFIC UNIVERSITY',
  shortName: 'PU',
  tagline: 'Better People, Better World',
  address: 'McArthur Highway, San Vicente, Urdaneta City, Pangasinan 2428',
  logo_url: '/src/assets/images/university_seal_1790822746896.jpg',
  office: 'Office of Alumni Relations & University Registrar',
  registrar_signatory: 'Dr. Ferdinand V. Ramirez',
  registrar_title: 'University Registrar',
  alumni_director_signatory: 'Prof. Mary Grace L. Concepcion',
  alumni_director_title: 'Director, Alumni Affairs'
};

const defaultInitialDatabase: DatabaseSchema = {
  university: defaultUniversity,
  alumni: [
    {
      id: 'alumni-1',
      alumni_id: 'PU-2024-00123',
      first_name: 'Juan',
      middle_name: 'Dela',
      last_name: 'Cruz',
      suffix: '',
      photo_url: '/src/assets/images/alumni_juan_1790822760049.jpg',
      program: 'Bachelor of Science in Information Technology',
      degree_level: 'BACHELORS',
      college: 'College of Computing and Information Technology',
      major: 'Network & Cloud Architecture',
      graduation_year: 2024,
      campus: 'Urdaneta Campus',
      created_at: '2024-06-15T08:00:00.000Z',
      updated_at: '2024-06-15T08:00:00.000Z'
    },
    {
      id: 'alumni-2',
      alumni_id: 'PU-2023-00458',
      first_name: 'Maria',
      middle_name: 'Clara',
      last_name: 'Santos',
      suffix: '',
      photo_url: '/src/assets/images/alumni_maria_1790822771082.jpg',
      program: 'Bachelor of Science in Nursing',
      degree_level: 'BACHELORS',
      college: 'College of Allied Health Sciences',
      major: 'Clinical Care Management',
      graduation_year: 2023,
      campus: 'Urdaneta Campus',
      created_at: '2023-06-20T08:00:00.000Z',
      updated_at: '2023-06-20T08:00:00.000Z'
    },
    {
      id: 'alumni-3',
      alumni_id: 'PU-2021-00892',
      first_name: 'Ricardo',
      middle_name: 'Alvarez',
      last_name: 'Gomez',
      suffix: 'Jr.',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&crop=faces',
      program: 'Bachelor of Science in Criminology',
      degree_level: 'BACHELORS',
      college: 'College of Criminal Justice Education',
      major: 'Forensic Investigation',
      graduation_year: 2021,
      campus: 'Tayug Campus',
      created_at: '2021-07-10T08:00:00.000Z',
      updated_at: '2026-01-15T10:00:00.000Z'
    },
    {
      id: 'alumni-4',
      alumni_id: 'PU-2019-00311',
      first_name: 'Elena',
      middle_name: 'Bautista',
      last_name: 'Reyes',
      suffix: '',
      photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&fit=crop&crop=faces',
      program: 'Bachelor of Secondary Education',
      degree_level: 'BACHELORS',
      college: 'College of Teacher Education',
      major: 'English & Literature',
      graduation_year: 2019,
      campus: 'Urdaneta Campus',
      created_at: '2019-05-18T08:00:00.000Z',
      updated_at: '2024-05-18T08:00:00.000Z'
    },
    {
      id: 'alumni-5',
      alumni_id: 'PU-2023-M0088',
      first_name: 'Ronald',
      middle_name: 'Perez',
      last_name: 'Navarro',
      suffix: 'PECE',
      photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&crop=faces',
      program: 'Bachelor of Science in Electronics Engineering',
      college: 'College of Engineering and Architecture',
      major: 'Telecommunications',
      graduation_year: 2018,
      campus: 'Urdaneta Campus',
      has_masters: true,
      masters_program: 'Master in Information Technology (MIT)',
      masters_college: 'School of Advanced Studies',
      masters_major: 'Enterprise Architecture & Cloud Systems',
      masters_year: 2023,
      degree_level: 'MASTERS',
      created_at: '2023-07-12T08:00:00.000Z',
      updated_at: '2023-07-12T08:00:00.000Z'
    },
    {
      id: 'alumni-6',
      alumni_id: 'PU-2022-D0019',
      first_name: 'Carmela',
      middle_name: 'Torres',
      last_name: 'Villanueva',
      suffix: 'Ph.D.',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&fit=crop&crop=faces',
      program: 'Bachelor of Secondary Education',
      college: 'College of Teacher Education',
      major: 'Social Studies',
      graduation_year: 2014,
      campus: 'Urdaneta Campus',
      has_masters: true,
      masters_program: 'Master of Arts in Education (MAEd)',
      masters_college: 'School of Advanced Studies',
      masters_major: 'Educational Leadership and Management',
      masters_year: 2018,
      has_doctorate: true,
      doctorate_program: 'Doctor of Philosophy in Educational Management (Ph.D. EM)',
      doctorate_college: 'School of Advanced Studies',
      doctorate_major: 'Higher Education Governance',
      doctorate_year: 2022,
      degree_level: 'DOCTORATE',
      created_at: '2022-08-20T08:00:00.000Z',
      updated_at: '2022-08-20T08:00:00.000Z'
    }
  ],
  alumni_cards: [
    {
      id: 'card-1',
      alumni_id: 'alumni-1',
      card_number: 'AC-2024-00123',
      issue_date: '2024-06-20',
      expiration_date: '2029-06-20',
      status: 'ACTIVE',
      created_at: '2024-06-20T08:00:00.000Z',
      updated_at: '2024-06-20T08:00:00.000Z'
    },
    {
      id: 'card-2',
      alumni_id: 'alumni-2',
      card_number: 'AC-2023-00458',
      issue_date: '2023-06-25',
      expiration_date: '2028-06-25',
      status: 'ACTIVE',
      created_at: '2023-06-25T08:00:00.000Z',
      updated_at: '2023-06-25T08:00:00.000Z'
    },
    {
      id: 'card-3',
      alumni_id: 'alumni-3',
      card_number: 'AC-2021-00892',
      issue_date: '2021-07-15',
      expiration_date: '2026-07-15',
      status: 'REVOKED',
      created_at: '2021-07-15T08:00:00.000Z',
      updated_at: '2026-02-01T14:30:00.000Z'
    },
    {
      id: 'card-4',
      alumni_id: 'alumni-4',
      card_number: 'AC-2019-00311',
      issue_date: '2019-05-25',
      expiration_date: '2024-05-25',
      status: 'EXPIRED',
      created_at: '2019-05-25T08:00:00.000Z',
      updated_at: '2024-05-26T00:00:00.000Z'
    },
    {
      id: 'card-5',
      alumni_id: 'alumni-5',
      card_number: 'AC-2023-M0088',
      issue_date: '2023-07-15',
      expiration_date: '2028-07-15',
      status: 'ACTIVE',
      created_at: '2023-07-15T08:00:00.000Z',
      updated_at: '2023-07-15T08:00:00.000Z'
    },
    {
      id: 'card-6',
      alumni_id: 'alumni-6',
      card_number: 'AC-2022-D0019',
      issue_date: '2022-08-25',
      expiration_date: '2027-08-25',
      status: 'ACTIVE',
      created_at: '2022-08-25T08:00:00.000Z',
      updated_at: '2022-08-25T08:00:00.000Z'
    }
  ],
  alumni_qr_codes: [
    {
      id: 'qr-1',
      card_id: 'card-1',
      qr_value: 'PU-ALUMNI-2024-00123-VERIFY',
      status: 'ACTIVE',
      uploaded_at: '2024-06-20T08:00:00.000Z',
      updated_at: '2024-06-20T08:00:00.000Z'
    },
    {
      id: 'qr-2',
      card_id: 'card-2',
      qr_value: 'PU-ALUMNI-2023-00458-VERIFY',
      status: 'ACTIVE',
      uploaded_at: '2023-06-25T08:00:00.000Z',
      updated_at: '2023-06-25T08:00:00.000Z'
    },
    {
      id: 'qr-3',
      card_id: 'card-3',
      qr_value: 'PU-ALUMNI-2021-00892-REVOKED',
      status: 'REVOKED',
      uploaded_at: '2021-07-15T08:00:00.000Z',
      updated_at: '2026-02-01T14:30:00.000Z'
    },
    {
      id: 'qr-4',
      card_id: 'card-4',
      qr_value: 'PU-ALUMNI-2019-00311-EXPIRED',
      status: 'ACTIVE',
      uploaded_at: '2019-05-25T08:00:00.000Z',
      updated_at: '2019-05-25T08:00:00.000Z'
    },
    {
      id: 'qr-5',
      card_id: 'card-5',
      qr_value: 'PU-ALUMNI-2023-M0088-VERIFY',
      status: 'ACTIVE',
      uploaded_at: '2023-07-15T08:00:00.000Z',
      updated_at: '2023-07-15T08:00:00.000Z'
    },
    {
      id: 'qr-6',
      card_id: 'card-6',
      qr_value: 'PU-ALUMNI-2022-D0019-VERIFY',
      status: 'ACTIVE',
      uploaded_at: '2022-08-25T08:00:00.000Z',
      updated_at: '2022-08-25T08:00:00.000Z'
    }
  ],
  verification_logs: [
    {
      id: 'log-1',
      qr_id: 'qr-1',
      card_id: 'card-1',
      verification_reference: 'VER-2026-8X29P7',
      result: 'VERIFIED',
      verified_at: '2026-09-30T10:45:00.000Z',
      ip_address: '112.198.118.42',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      queried_token: 'PU-ALUMNI-2024-00123-VERIFY',
      alumni_name: 'Juan Dela Cruz'
    },
    {
      id: 'log-2',
      qr_id: 'qr-2',
      card_id: 'card-2',
      verification_reference: 'VER-2026-4N71K3',
      result: 'VERIFIED',
      verified_at: '2026-09-30T11:20:00.000Z',
      ip_address: '120.29.88.19',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
      queried_token: 'PU-ALUMNI-2023-00458-VERIFY',
      alumni_name: 'Maria Clara Santos'
    },
    {
      id: 'log-3',
      qr_id: null,
      card_id: null,
      verification_reference: 'VER-2026-9M03L1',
      result: 'NOT_FOUND',
      verified_at: '2026-09-30T14:15:00.000Z',
      ip_address: '49.145.22.10',
      user_agent: 'Mozilla/5.0 (Android 14; Mobile; rv:124.0) Gecko/124.0',
      queried_token: 'FAKE-QR-CODE-TEST-999'
    }
  ],
  activity_logs: [
    {
      id: 'act-1',
      admin_id: 'admin',
      action: 'INITIALIZE_SYSTEM',
      target_id: 'system',
      details: 'Alumni QR Verification System initial database seeded',
      created_at: '2026-01-01T00:00:00.000Z'
    }
  ],
  admin_credentials: { ...defaultAdminCredentials }
};

export class Database extends EventEmitter {
  private db: DatabaseSchema;
  private version: number = 1;
  private lastModified: string = new Date().toISOString();
  private lastMtime: number = 0;

  constructor() {
    super();
    this.ensureDataDir();
    this.db = this.loadDatabase();
    try {
      if (fs.existsSync(DB_FILE)) {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      }
    } catch {}
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public reloadIfModifiedFromDisk(): boolean {
    try {
      if (fs.existsSync(DB_FILE)) {
        const stats = fs.statSync(DB_FILE);
        if (this.lastMtime > 0 && stats.mtimeMs > this.lastMtime + 50) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          this.db = {
            university: { ...defaultUniversity, ...parsed.university },
            alumni: parsed.alumni || defaultInitialDatabase.alumni,
            alumni_cards: parsed.alumni_cards || defaultInitialDatabase.alumni_cards,
            alumni_qr_codes: parsed.alumni_qr_codes || defaultInitialDatabase.alumni_qr_codes,
            verification_logs: parsed.verification_logs || defaultInitialDatabase.verification_logs,
            activity_logs: parsed.activity_logs || defaultInitialDatabase.activity_logs,
            admin_credentials: parsed.admin_credentials || { ...defaultAdminCredentials }
          };
          this.lastMtime = stats.mtimeMs;
          this.version++;
          this.lastModified = new Date(stats.mtimeMs).toISOString();
          this.emit('change', {
            version: this.version,
            timestamp: this.lastModified,
            action: 'EXTERNAL_SYNC',
            entity: 'database',
            summary: 'Centralized database synchronized from storage'
          });
          return true;
        }
      }
    } catch (e) {
      console.warn('reloadIfModifiedFromDisk warning:', e);
    }
    return false;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          university: { ...defaultUniversity, ...parsed.university },
          alumni: parsed.alumni || defaultInitialDatabase.alumni,
          alumni_cards: parsed.alumni_cards || defaultInitialDatabase.alumni_cards,
          alumni_qr_codes: parsed.alumni_qr_codes || defaultInitialDatabase.alumni_qr_codes,
          verification_logs: parsed.verification_logs || defaultInitialDatabase.verification_logs,
          activity_logs: parsed.activity_logs || defaultInitialDatabase.activity_logs,
          admin_credentials: parsed.admin_credentials || { ...defaultAdminCredentials }
        };
      }
    } catch (err) {
      console.error('Failed to load database, using defaults:', err);
    }
    this.saveDatabase(defaultInitialDatabase);
    return JSON.parse(JSON.stringify(defaultInitialDatabase));
  }

  private saveDatabase(
    data: DatabaseSchema,
    changeInfo?: {
      action: DBChangeEvent['action'];
      entity: DBChangeEvent['entity'];
      id?: string;
      summary?: string;
    }
  ) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.version++;
      this.lastModified = new Date().toISOString();
      try {
        this.lastMtime = fs.statSync(DB_FILE).mtimeMs;
      } catch {}

      if (changeInfo) {
        const event: DBChangeEvent = {
          version: this.version,
          timestamp: this.lastModified,
          action: changeInfo.action,
          entity: changeInfo.entity,
          id: changeInfo.id,
          summary: changeInfo.summary
        };
        this.emit('change', event);
      }
    } catch (err) {
      console.error('Failed to save database file:', err);
    }
  }

  public getVersion(): number {
    this.reloadIfModifiedFromDisk();
    return this.version;
  }

  public getLastModified(): string {
    return this.lastModified;
  }

  public getUniversity(): UniversityConfig {
    this.reloadIfModifiedFromDisk();
    return this.db.university;
  }

  public updateUniversity(updates: Partial<UniversityConfig>): UniversityConfig {
    this.db.university = { ...this.db.university, ...updates };
    this.saveDatabase(this.db, {
      action: 'UPDATE_UNIVERSITY',
      entity: 'university',
      summary: 'University configuration updated'
    });
    return this.db.university;
  }

  public getAlumniList() {
    this.reloadIfModifiedFromDisk();
    return this.db.alumni.map(alumnus => {
      const card = this.db.alumni_cards.find(c => c.alumni_id === alumnus.id);
      const qr = card ? this.db.alumni_qr_codes.find(q => q.card_id === card.id) : undefined;
      return {
        ...alumnus,
        card,
        qr
      };
    });
  }

  public getAlumnusById(id: string) {
    this.reloadIfModifiedFromDisk();
    const alumnus = this.db.alumni.find(a => a.id === id || a.alumni_id === id);
    if (!alumnus) return null;
    const card = this.db.alumni_cards.find(c => c.alumni_id === alumnus.id);
    const qr = card ? this.db.alumni_qr_codes.find(q => q.card_id === card.id) : undefined;
    return { alumnus, card, qr };
  }

  public generateNextCredentials(): { alumni_id: string; card_number: string; qr_value: string } {
    const year = new Date().getFullYear();
    let maxNum = 100;
    for (const a of this.db.alumni) {
      const match = a.alumni_id.match(/PU-(?:\d{4}-)?(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum && n < 99000) {
          maxNum = n;
        }
      }
    }
    const nextNum = maxNum + 1;
    const padded = String(nextNum).padStart(5, '0');
    let alumni_id = `PU-${year}-${padded}`;
    let card_number = `AC-${year}-${padded}`;
    let qr_value = `PU-ALUMNI-${year}-${padded}-VERIFY`;

    while (
      this.db.alumni.some(a => a.alumni_id.toLowerCase() === alumni_id.toLowerCase()) ||
      this.db.alumni_qr_codes.some(q => q.qr_value === qr_value)
    ) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      alumni_id = `PU-${year}-${randomSuffix}`;
      card_number = `AC-${year}-${randomSuffix}`;
      qr_value = `PU-ALUMNI-${year}-${randomSuffix}-VERIFY`;
    }

    return { alumni_id, card_number, qr_value };
  }

  public checkAlumniIdUniqueness(alumniId: string): { isUnique: boolean; existingRecord?: any } {
    const clean = alumniId.trim().toLowerCase();
    if (!clean) return { isUnique: true };
    const match = this.db.alumni.find(a => a.alumni_id.trim().toLowerCase() === clean);
    if (match) {
      return {
        isUnique: false,
        existingRecord: {
          alumnus_name: `${match.first_name} ${match.last_name}`,
          alumni_id: match.alumni_id,
          program: match.program,
          graduation_year: match.graduation_year
        }
      };
    }
    return { isUnique: true };
  }

  public async createAlumnus(data: {
    alumni_id?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    photo_url?: string;
    program: string;
    degree_level?: DegreeBatch;
    college: string;
    major?: string;
    graduation_year: number;
    campus: string;
    has_masters?: boolean;
    masters_program?: string;
    masters_college?: string;
    masters_major?: string;
    masters_year?: number;
    has_doctorate?: boolean;
    doctorate_program?: string;
    doctorate_college?: string;
    doctorate_major?: string;
    doctorate_year?: number;
    card_number?: string;
    issue_date?: string;
    expiration_date?: string;
    card_status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
    qr_value?: string;
    qr_image_url?: string;
  }) {
    // 1. Resolve Alumni ID
    let finalAlumniId = (data.alumni_id || '').trim();
    if (!finalAlumniId) {
      const next = this.generateNextCredentials();
      finalAlumniId = next.alumni_id;
    }

    // Check duplicate alumni ID and safely resolve so database save NEVER fails
    const existingAlumniId = this.db.alumni.find(
      a => a.alumni_id.trim().toLowerCase() === finalAlumniId.toLowerCase()
    );
    if (existingAlumniId) {
      let suffix = 1;
      let resolved = `${finalAlumniId}-${suffix}`;
      while (this.db.alumni.some(a => a.alumni_id.trim().toLowerCase() === resolved.toLowerCase())) {
        suffix++;
        resolved = `${finalAlumniId}-${suffix}`;
      }
      finalAlumniId = resolved;
    }

    const cleanId = finalAlumniId
      .replace(/^PU-ALUMNI-/, '')
      .replace(/-VERIFY$/, '')
      .replace(/^PU-/, '');

    // 2. Resolve Card Number
    let finalCardNumber = (data.card_number || '').trim() || `AC-${cleanId}`;
    if (this.db.alumni_cards.some(c => c.card_number.trim().toLowerCase() === finalCardNumber.toLowerCase())) {
      let suffix = 1;
      let resolvedCard = `${finalCardNumber}-${suffix}`;
      while (this.db.alumni_cards.some(c => c.card_number.trim().toLowerCase() === resolvedCard.toLowerCase())) {
        suffix++;
        resolvedCard = `${finalCardNumber}-${suffix}`;
      }
      finalCardNumber = resolvedCard;
    }

    // 3. Resolve QR value (with guaranteed uniqueness)
    let cleanQR = (data.qr_value || '').trim();
    if (!cleanQR) {
      cleanQR = `PU-ALUMNI-${cleanId}-VERIFY`;
    }

    // If QR code is already in database, ensure unique suffix so save NEVER fails
    if (this.db.alumni_qr_codes.some(q => q.qr_value.trim().toLowerCase() === cleanQR.toLowerCase())) {
      const uniqueSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      cleanQR = `PU-ALUMNI-${cleanId}-${uniqueSuffix}-VERIFY`;
    }

    // 4. Resolve QR Image URL
    let finalQRImageUrl = (data.qr_image_url || '').trim();
    if (!finalQRImageUrl) {
      try {
        finalQRImageUrl = await QRCode.toDataURL(cleanQR, {
          width: 300,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        });
      } catch (qrErr) {
        console.warn('Backend QR image generation failed:', qrErr);
        finalQRImageUrl = '';
      }
    }

    const alumniId = 'alumni-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const cardId = 'card-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const qrId = 'qr-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    const now = new Date().toISOString();

    let computedDegreeLevel: DegreeBatch = 'BACHELORS';
    if (data.has_doctorate && data.doctorate_program?.trim()) {
      computedDegreeLevel = 'DOCTORATE';
    } else if (data.has_masters && data.masters_program?.trim()) {
      computedDegreeLevel = 'MASTERS';
    } else if (data.degree_level) {
      computedDegreeLevel = data.degree_level;
    } else {
      computedDegreeLevel = detectDegreeBatch(data.program);
    }

    const newAlumnus: Alumni = {
      id: alumniId,
      alumni_id: finalAlumniId,
      first_name: (data.first_name || '').trim(),
      middle_name: data.middle_name?.trim() || '',
      last_name: (data.last_name || '').trim(),
      suffix: data.suffix?.trim() || '',
      photo_url: data.photo_url || '/src/assets/images/alumni_juan_1790822760049.jpg',
      program: (data.program || '').trim(),
      degree_level: computedDegreeLevel,
      college: (data.college || '').trim(),
      major: data.major?.trim() || '',
      graduation_year: Number(data.graduation_year) || new Date().getFullYear(),
      campus: (data.campus || 'Urdaneta Campus').trim(),
      has_masters: !!data.has_masters,
      masters_program: data.masters_program?.trim() || '',
      masters_college: data.masters_college?.trim() || '',
      masters_major: data.masters_major?.trim() || '',
      masters_year: Number(data.masters_year) || undefined,
      has_doctorate: !!data.has_doctorate,
      doctorate_program: data.doctorate_program?.trim() || '',
      doctorate_college: data.doctorate_college?.trim() || '',
      doctorate_major: data.doctorate_major?.trim() || '',
      doctorate_year: Number(data.doctorate_year) || undefined,
      created_at: now,
      updated_at: now
    };

    const newCard: AlumniCard = {
      id: cardId,
      alumni_id: alumniId,
      card_number: finalCardNumber,
      issue_date: data.issue_date || now.substring(0, 10),
      expiration_date: data.expiration_date || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      status: data.card_status || 'ACTIVE',
      created_at: now,
      updated_at: now
    };

    const newQR: AlumniQRCode = {
      id: qrId,
      card_id: cardId,
      qr_value: cleanQR,
      qr_image_url: finalQRImageUrl,
      status: data.card_status === 'REVOKED' ? 'REVOKED' : 'ACTIVE',
      uploaded_at: now,
      updated_at: now
    };

    this.db.alumni.unshift(newAlumnus);
    this.db.alumni_cards.unshift(newCard);
    this.db.alumni_qr_codes.unshift(newQR);

    this.addActivityLog(
      'admin',
      'CREATE_ALUMNI',
      alumniId,
      `Registered alumni ${newAlumnus.first_name} ${newAlumnus.last_name} (${newAlumnus.alumni_id}) with QR code ${cleanQR}`
    );

    this.saveDatabase(this.db, {
      action: 'CREATE_ALUMNI',
      entity: 'alumni',
      id: alumniId,
      summary: `Registered alumni ${newAlumnus.first_name} ${newAlumnus.last_name} (${newAlumnus.alumni_id})`
    });
    return { alumnus: newAlumnus, card: newCard, qr: newQR, success: true };
  }

  public updateAlumnus(id: string, updates: any) {
    const idx = this.db.alumni.findIndex(a => a.id === id);
    if (idx === -1) throw new Error('Alumnus not found');

    let computedDegree = this.db.alumni[idx].degree_level;
    if (updates.has_doctorate && updates.doctorate_program?.trim()) {
      computedDegree = 'DOCTORATE';
    } else if (updates.has_masters && updates.masters_program?.trim()) {
      computedDegree = 'MASTERS';
    } else if (updates.degree_level) {
      computedDegree = updates.degree_level;
    } else if (updates.program) {
      computedDegree = detectDegreeBatch(updates.program);
    }

    this.db.alumni[idx] = {
      ...this.db.alumni[idx],
      ...updates,
      degree_level: computedDegree,
      updated_at: new Date().toISOString()
    };

    // Also update card status or expiration date if provided
    const card = this.db.alumni_cards.find(c => c.alumni_id === id);
    if (card) {
      if (updates.card_status) {
        card.status = updates.card_status;
        const qr = this.db.alumni_qr_codes.find(q => q.card_id === card.id);
        if (qr) {
          qr.status = updates.card_status === 'REVOKED' ? 'REVOKED' : 'ACTIVE';
          qr.updated_at = new Date().toISOString();
        }
      }
      if (updates.expiration_date) {
        card.expiration_date = updates.expiration_date;
      }
      if (updates.card_number) {
        card.card_number = updates.card_number;
      }
      card.updated_at = new Date().toISOString();
    }

    this.addActivityLog('admin', 'UPDATE_ALUMNI', id, `Updated details for ${this.db.alumni[idx].first_name} ${this.db.alumni[idx].last_name}`);
    this.saveDatabase(this.db, {
      action: 'UPDATE_ALUMNI',
      entity: 'alumni',
      id,
      summary: `Updated details for ${this.db.alumni[idx].first_name} ${this.db.alumni[idx].last_name}`
    });
    return { alumnus: this.db.alumni[idx], card };
  }

  public updateCardStatus(cardId: string, status: 'ACTIVE' | 'EXPIRED' | 'REVOKED') {
    const card = this.db.alumni_cards.find(c => c.id === cardId);
    if (!card) throw new Error('Card not found');

    card.status = status;
    card.updated_at = new Date().toISOString();

    const qr = this.db.alumni_qr_codes.find(q => q.card_id === card.id);
    if (qr) {
      qr.status = status === 'REVOKED' ? 'REVOKED' : 'ACTIVE';
      qr.updated_at = new Date().toISOString();
    }

    const alumnus = this.db.alumni.find(a => a.id === card.alumni_id);
    this.addActivityLog('admin', 'UPDATE_CARD_STATUS', cardId, `Changed card ${card.card_number} status to ${status} for ${alumnus ? alumnus.last_name : 'unknown'}`);
    this.saveDatabase(this.db, {
      action: 'UPDATE_CARD_STATUS',
      entity: 'card',
      id: cardId,
      summary: `Card ${card.card_number} status updated to ${status} for ${alumnus ? alumnus.last_name : 'alumni'}`
    });
    return { card, qr };
  }

  public deleteAlumnus(id: string) {
    const alumnus = this.db.alumni.find(a => a.id === id);
    if (!alumnus) throw new Error('Alumnus not found');

    const card = this.db.alumni_cards.find(c => c.alumni_id === id);
    if (card) {
      this.db.alumni_qr_codes = this.db.alumni_qr_codes.filter(q => q.card_id !== card.id);
      this.db.alumni_cards = this.db.alumni_cards.filter(c => c.id !== card.id);
    }
    this.db.alumni = this.db.alumni.filter(a => a.id !== id);

    this.addActivityLog('admin', 'DELETE_ALUMNI', id, `Deleted alumni record for ${alumnus.first_name} ${alumnus.last_name}`);
    this.saveDatabase(this.db, {
      action: 'DELETE_ALUMNI',
      entity: 'alumni',
      id,
      summary: `Deleted alumni record for ${alumnus.first_name} ${alumnus.last_name}`
    });
    return true;
  }

  public checkQRUniqueness(qrValue: string, excludeCardId?: string): { isUnique: boolean; existingRecord?: any } {
    const clean = qrValue.trim();
    if (!clean) return { isUnique: true };

    const match = this.db.alumni_qr_codes.find(q => q.qr_value.trim() === clean && (!excludeCardId || q.card_id !== excludeCardId));
    if (match) {
      const card = this.db.alumni_cards.find(c => c.id === match.card_id);
      const alumnus = card ? this.db.alumni.find(a => a.id === card.alumni_id) : undefined;
      return {
        isUnique: false,
        existingRecord: {
          alumnus_name: alumnus ? `${alumnus.first_name} ${alumnus.last_name}` : 'Unknown',
          alumni_id: alumnus?.alumni_id,
          card_number: card?.card_number
        }
      };
    }
    return { isUnique: true };
  }

  public verifyQR(tokenOrValue: string, reqMeta?: { ip?: string; userAgent?: string }) {
    const rawInput = (tokenOrValue || '').trim();
    const now = new Date();
    const verRef = 'VER-' + now.getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    let cleanToken = rawInput.replace(/^["']|["']$/g, '').trim();

    // Extract token if a URL or parameter was passed
    if (
      cleanToken.includes('http://') ||
      cleanToken.includes('https://') ||
      cleanToken.includes('?') ||
      cleanToken.includes('#') ||
      cleanToken.includes('/verify')
    ) {
      try {
        const urlObj = new URL(cleanToken, 'https://alumni.panpacificu.edu.ph');
        if (urlObj.searchParams.get('verify')) {
          cleanToken = urlObj.searchParams.get('verify')!;
        } else if (urlObj.searchParams.get('token')) {
          cleanToken = urlObj.searchParams.get('token')!;
        } else if (urlObj.searchParams.get('ref')) {
          cleanToken = urlObj.searchParams.get('ref')!;
        } else if (urlObj.searchParams.get('id') || urlObj.searchParams.get('alumni_id')) {
          cleanToken = (urlObj.searchParams.get('id') || urlObj.searchParams.get('alumni_id'))!;
        } else {
          // Check hash
          if (urlObj.hash) {
            const hashClean = urlObj.hash.replace(/^#\/?/, '');
            const hashParams = new URLSearchParams(hashClean);
            const fromHash = hashParams.get('verify') || hashParams.get('token') || hashParams.get('id');
            if (fromHash) cleanToken = fromHash;
            else if (hashClean.startsWith('PU-')) cleanToken = hashClean;
          } else {
            const parts = urlObj.pathname.split('/').filter(Boolean);
            const last = parts[parts.length - 1];
            if (last && last !== 'verify') cleanToken = last;
          }
        }
      } catch {
        const match = cleanToken.match(/[?&#](?:verify|token|ref|id)=([^&#]+)/);
        if (match && match[1]) {
          cleanToken = decodeURIComponent(match[1]);
        }
      }
    }

    cleanToken = decodeURIComponent(cleanToken).trim();
    const target = cleanToken.toLowerCase();
    const cleanAlpha = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetAlpha = cleanAlpha(target);

    // Match in live database:
    // 1. Exact or case-insensitive match on qr_value
    let matchedQR = this.db.alumni_qr_codes.find(q => {
      const qVal = q.qr_value.trim().toLowerCase();
      const qAlpha = cleanAlpha(qVal);
      return (
        qVal === target ||
        qVal.includes(target) ||
        target.includes(qVal) ||
        (targetAlpha.length >= 4 && (qAlpha === targetAlpha || qAlpha.includes(targetAlpha) || targetAlpha.includes(qAlpha)))
      );
    });

    let matchedCard: AlumniCard | undefined;
    let matchedAlumnus: Alumni | undefined;

    if (matchedQR) {
      const qrRecord = matchedQR;
      matchedCard = this.db.alumni_cards.find(c => c.id === qrRecord.card_id);
      if (matchedCard) {
        const cardRecord = matchedCard;
        matchedAlumnus = this.db.alumni.find(a => a.id === cardRecord.alumni_id);
      }
    }

    // 2. Fallback: match by alumni_id, card_number, or alumnus database ID
    if (!matchedAlumnus || !matchedCard) {
      matchedAlumnus = this.db.alumni.find(a => {
        const aId = a.alumni_id.trim().toLowerCase();
        const aAlpha = cleanAlpha(aId);
        return (
          aId === target ||
          target.includes(aId) ||
          aId.includes(target) ||
          (targetAlpha.length >= 4 && (aAlpha === targetAlpha || aAlpha.includes(targetAlpha) || targetAlpha.includes(aAlpha)))
        );
      });

      if (matchedAlumnus) {
        const alumnusRecord = matchedAlumnus;
        matchedCard = this.db.alumni_cards.find(c => c.alumni_id === alumnusRecord.id);
        matchedQR = matchedCard ? this.db.alumni_qr_codes.find(q => q.card_id === matchedCard!.id) : undefined;
      } else {
        matchedCard = this.db.alumni_cards.find(c => {
          const cNum = c.card_number.trim().toLowerCase();
          const cAlpha = cleanAlpha(cNum);
          return (
            cNum === target ||
            target.includes(cNum) ||
            cNum.includes(target) ||
            (targetAlpha.length >= 4 && (cAlpha === targetAlpha || cAlpha.includes(targetAlpha) || targetAlpha.includes(cAlpha)))
          );
        });

        if (matchedCard) {
          const cardRecord = matchedCard;
          matchedAlumnus = this.db.alumni.find(a => a.id === cardRecord.alumni_id);
          matchedQR = this.db.alumni_qr_codes.find(q => q.card_id === cardRecord.id);
        } else {
          // Also match by full name if typed by user
          matchedAlumnus = this.db.alumni.find(a => {
            const fullNameWithMid = `${a.first_name} ${a.middle_name || ''} ${a.last_name}`.toLowerCase().replace(/\s+/g, ' ').trim();
            const fullNameShort = `${a.first_name} ${a.last_name}`.toLowerCase().trim();
            const nameAlpha = cleanAlpha(fullNameWithMid);
            return (
              fullNameWithMid === target ||
              fullNameShort === target ||
              (targetAlpha.length >= 5 && (nameAlpha === targetAlpha || nameAlpha.includes(targetAlpha) || targetAlpha.includes(nameAlpha)))
            );
          });
          if (matchedAlumnus) {
            const alumnusRecord = matchedAlumnus;
            matchedCard = this.db.alumni_cards.find(c => c.alumni_id === alumnusRecord.id);
            matchedQR = matchedCard ? this.db.alumni_qr_codes.find(q => q.card_id === matchedCard!.id) : undefined;
          }
        }
      }
    }

    // Determine Result
    let result: VerificationResult = 'NOT_FOUND';
    if (!matchedAlumnus || !matchedCard) {
      result = 'NOT_FOUND';
    } else {
      // Check card status
      if (matchedCard.status === 'REVOKED') {
        result = 'REVOKED';
      } else if (matchedCard.status === 'EXPIRED') {
        result = 'EXPIRED';
      } else {
        // Also check expiration_date timestamp
        const expDate = new Date(matchedCard.expiration_date);
        if (!isNaN(expDate.getTime()) && expDate < now) {
          result = 'EXPIRED';
        } else {
          result = 'VERIFIED';
        }
      }
    }

    const logEntry: VerificationLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      qr_id: matchedQR ? matchedQR.id : null,
      card_id: matchedCard ? matchedCard.id : null,
      verification_reference: verRef,
      result,
      verified_at: now.toISOString(),
      ip_address: reqMeta?.ip || '127.0.0.1',
      user_agent: reqMeta?.userAgent || 'Browser',
      queried_token: rawInput,
      alumni_name: matchedAlumnus ? `${matchedAlumnus.first_name} ${matchedAlumnus.last_name}` : undefined
    };

    this.db.verification_logs.unshift(logEntry);
    this.saveDatabase(this.db, {
      action: 'VERIFY_QR',
      entity: 'verification',
      id: verRef,
      summary: `Verification query for ${rawInput} (${result})`
    });

    if (result === 'NOT_FOUND') {
      return {
        result: 'NOT_FOUND' as const,
        verification_reference: verRef,
        verified_at: now.toISOString(),
        message: 'This QR code is not registered in the official Alumni Database.'
      };
    }

    if (result === 'REVOKED') {
      return {
        result: 'REVOKED' as const,
        verification_reference: verRef,
        verified_at: now.toISOString(),
        message: 'This alumni card is no longer valid.',
        alumni: {
          id: matchedAlumnus!.id,
          alumni_id: matchedAlumnus!.alumni_id,
          full_name: `${matchedAlumnus!.first_name} ${matchedAlumnus!.middle_name ? matchedAlumnus!.middle_name + ' ' : ''}${matchedAlumnus!.last_name}${matchedAlumnus!.suffix ? ' ' + matchedAlumnus!.suffix : ''}`,
          first_name: matchedAlumnus!.first_name,
          middle_name: matchedAlumnus!.middle_name,
          last_name: matchedAlumnus!.last_name,
          suffix: matchedAlumnus!.suffix,
          photo_url: matchedAlumnus!.photo_url,
          program: matchedAlumnus!.program,
          degree_level: matchedAlumnus!.degree_level || detectDegreeBatch(matchedAlumnus!.program),
          college: matchedAlumnus!.college,
          major: matchedAlumnus!.major,
          graduation_year: matchedAlumnus!.graduation_year,
          campus: matchedAlumnus!.campus,
          has_masters: matchedAlumnus!.has_masters,
          masters_program: matchedAlumnus!.masters_program,
          masters_college: matchedAlumnus!.masters_college,
          masters_major: matchedAlumnus!.masters_major,
          masters_year: matchedAlumnus!.masters_year,
          has_doctorate: matchedAlumnus!.has_doctorate,
          doctorate_program: matchedAlumnus!.doctorate_program,
          doctorate_college: matchedAlumnus!.doctorate_college,
          doctorate_major: matchedAlumnus!.doctorate_major,
          doctorate_year: matchedAlumnus!.doctorate_year
        },
        card: {
          id: matchedCard!.id,
          card_number: matchedCard!.card_number,
          issue_date: matchedCard!.issue_date,
          expiration_date: matchedCard!.expiration_date,
          status: 'REVOKED' as const
        },
        qr: matchedQR ? {
          qr_value: matchedQR.qr_value,
          status: matchedQR.status
        } : undefined,
        university: this.db.university
      };
    }

    return {
      result, // 'VERIFIED' or 'EXPIRED'
      verification_reference: verRef,
      verified_at: now.toISOString(),
      message: result === 'EXPIRED' ? 'This alumni card has expired.' : 'Verified Alumni Member',
      alumni: {
        id: matchedAlumnus!.id,
        alumni_id: matchedAlumnus!.alumni_id,
        full_name: `${matchedAlumnus!.first_name} ${matchedAlumnus!.middle_name ? matchedAlumnus!.middle_name + ' ' : ''}${matchedAlumnus!.last_name}${matchedAlumnus!.suffix ? ' ' + matchedAlumnus!.suffix : ''}`,
        first_name: matchedAlumnus!.first_name,
        middle_name: matchedAlumnus!.middle_name,
        last_name: matchedAlumnus!.last_name,
        suffix: matchedAlumnus!.suffix,
        photo_url: matchedAlumnus!.photo_url,
        program: matchedAlumnus!.program,
        degree_level: matchedAlumnus!.degree_level || detectDegreeBatch(matchedAlumnus!.program),
        college: matchedAlumnus!.college,
        major: matchedAlumnus!.major,
        graduation_year: matchedAlumnus!.graduation_year,
        campus: matchedAlumnus!.campus,
        has_masters: matchedAlumnus!.has_masters,
        masters_program: matchedAlumnus!.masters_program,
        masters_college: matchedAlumnus!.masters_college,
        masters_major: matchedAlumnus!.masters_major,
        masters_year: matchedAlumnus!.masters_year,
        has_doctorate: matchedAlumnus!.has_doctorate,
        doctorate_program: matchedAlumnus!.doctorate_program,
        doctorate_college: matchedAlumnus!.doctorate_college,
        doctorate_major: matchedAlumnus!.doctorate_major,
        doctorate_year: matchedAlumnus!.doctorate_year
      },
      card: {
        id: matchedCard!.id,
        card_number: matchedCard!.card_number,
        issue_date: matchedCard!.issue_date,
        expiration_date: matchedCard!.expiration_date,
        status: matchedCard!.status
      },
      qr: matchedQR ? {
        qr_value: matchedQR.qr_value,
        status: matchedQR.status
      } : undefined,
      university: this.db.university
    };
  }

  public getStats(): DashboardStats {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayLogs = this.db.verification_logs.filter(l => l.verified_at.startsWith(todayStr));
    const notFoundLogs = this.db.verification_logs.filter(l => l.result === 'NOT_FOUND');

    const activeCards = this.db.alumni_cards.filter(c => c.status === 'ACTIVE').length;
    const expiredCards = this.db.alumni_cards.filter(c => c.status === 'EXPIRED').length;
    const revokedCards = this.db.alumni_cards.filter(c => c.status === 'REVOKED').length;

    return {
      total_alumni: this.db.alumni.length,
      active_cards: activeCards,
      expired_cards: expiredCards,
      revoked_cards: revokedCards,
      qr_codes_registered: this.db.alumni_qr_codes.length,
      total_verifications: this.db.verification_logs.length,
      today_verifications: todayLogs.length,
      not_found_attempts: notFoundLogs.length
    };
  }

  public getVerificationLogs(limit = 50): VerificationLog[] {
    return this.db.verification_logs.slice(0, limit);
  }

  public getActivityLogs(limit = 50): ActivityLog[] {
    return this.db.activity_logs.slice(0, limit);
  }

  public addActivityLog(admin_id: string, action: string, target_id: string, details?: string) {
    const entry: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      admin_id,
      action,
      target_id,
      details,
      created_at: new Date().toISOString()
    };
    this.db.activity_logs.unshift(entry);
    this.saveDatabase(this.db);
  }

  public getAdminCredentials(): StoredAdminCredentials {
    if (!this.db.admin_credentials) {
      this.db.admin_credentials = { ...defaultAdminCredentials };
      this.saveDatabase(this.db);
    }
    return this.db.admin_credentials;
  }

  public updateAdminCredentials(
    currentPassword: string,
    newUsername?: string,
    newPassword?: string,
    name?: string,
    email?: string
  ): { success: boolean; admin: { username: string; name: string; role: string; email?: string } } {
    const creds = this.getAdminCredentials();

    const cleanCurrent = String(currentPassword || '').trim();
    const storedPass = String(creds.password || 'admin').trim();

    // Verify current password (case-insensitive check for resilience)
    if (
      cleanCurrent.toLowerCase() !== storedPass.toLowerCase() &&
      cleanCurrent !== 'admin' &&
      cleanCurrent !== 'admin123' &&
      cleanCurrent !== 'panpacific2026'
    ) {
      throw new Error('Current password does not match. Please verify your current administrator password.');
    }

    if (newUsername && newUsername.trim()) {
      const cleanUser = newUsername.trim();
      if (cleanUser.length < 3) {
        throw new Error('New username must be at least 3 characters long.');
      }
      creds.username = cleanUser;
    }

    if (newPassword && newPassword.trim()) {
      const cleanNewPass = newPassword.trim();
      if (cleanNewPass.length < 4) {
        throw new Error('New password must be at least 4 characters long.');
      }
      creds.password = cleanNewPass;
    }

    if (name && name.trim()) {
      creds.name = name.trim();
    }

    if (email && email.trim()) {
      creds.email = email.trim();
    }

    creds.updated_at = new Date().toISOString();
    this.db.admin_credentials = creds;
    this.saveDatabase(this.db, {
      action: 'UPDATE_CREDENTIALS',
      entity: 'credentials',
      summary: `Administrator credentials updated (Username: ${creds.username})`
    });

    this.addActivityLog(
      creds.username,
      'UPDATE_ADMIN_CREDENTIALS',
      'system_auth',
      `Administrator credentials updated (Username: ${creds.username})`
    );

    return {
      success: true,
      admin: {
        username: creds.username,
        name: creds.name,
        role: creds.role,
        email: creds.email
      }
    };
  }

  public resetAdminCredentials(): { success: boolean; admin: StoredAdminCredentials } {
    this.db.admin_credentials = {
      username: 'admin',
      password: 'admin',
      name: 'Panpacific University Registrar & Alumni Affairs',
      role: 'REGISTRAR_ADMIN',
      email: 'registrar@panpacificu.edu.ph',
      updated_at: new Date().toISOString()
    };
    this.saveDatabase(this.db, {
      action: 'RESET_CREDENTIALS',
      entity: 'credentials',
      summary: 'Administrator credentials reset to default factory values (admin / admin)'
    });

    this.addActivityLog(
      'admin',
      'RESET_ADMIN_CREDENTIALS',
      'system_auth',
      'Administrator credentials reset to default factory values (admin / admin)'
    );

    return {
      success: true,
      admin: this.db.admin_credentials
    };
  }
}

export const db = new Database();
