import { VerificationResponse, DashboardStats, Alumni, AlumniCard, AlumniQRCode, VerificationLog, ActivityLog, AdminCredentialsInfo, UpdateCredentialsPayload, SyncStatusResponse } from '../types/index.ts';

export async function verifyQRCode(token: string): Promise<VerificationResponse> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Verification failed with HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}

export async function fetchAlumniList(): Promise<Array<Alumni & { card?: AlumniCard; qr?: AlumniQRCode }>> {
  const res = await fetch('/api/alumni');
  if (!res.ok) throw new Error('Failed to load alumni list');
  return res.json();
}

export async function updateCardStatus(cardId: string, status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'): Promise<any> {
  const res = await fetch(`/api/cards/${cardId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update card status');
  }
  return res.json();
}

export async function checkQRUniqueness(qr_value: string, exclude_card_id?: string): Promise<{ isUnique: boolean; existingRecord?: any }> {
  try {
    const res = await fetch('/api/check-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr_value, exclude_card_id })
    });
    if (!res.ok) return { isUnique: true };
    return await res.json();
  } catch {
    return { isUnique: true };
  }
}

export async function fetchNextAlumniCredentials(): Promise<{ alumni_id: string; card_number: string; qr_value: string }> {
  const res = await fetch('/api/alumni/next-id');
  if (!res.ok) {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    return {
      alumni_id: `PU-${year}-${rand}`,
      card_number: `AC-${year}-${rand}`,
      qr_value: `PU-ALUMNI-${year}-${rand}-VERIFY`
    };
  }
  return res.json();
}

export async function checkAlumniIdUniqueness(alumni_id: string): Promise<{ isUnique: boolean; existingRecord?: any }> {
  try {
    const res = await fetch('/api/check-alumni-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alumni_id })
    });
    if (!res.ok) return { isUnique: true };
    return await res.json();
  } catch {
    return { isUnique: true };
  }
}

export async function generateServerQRCode(text: string, width: number = 300): Promise<{ qr_value: string; qr_image_url: string }> {
  const res = await fetch('/api/generate-qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, width })
  });
  if (!res.ok) {
    throw new Error('Failed to generate QR code on server');
  }
  return res.json();
}

export async function createAlumnus(data: any): Promise<any> {
  const res = await fetch('/api/alumni', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    let errorDetail = '';
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        errorDetail = parsed.error || parsed.message || '';
      } catch {
        errorDetail = text.slice(0, 150);
      }
    } catch {}
    throw new Error(errorDetail || `Failed to register alumni (HTTP ${res.status})`);
  }
  return res.json();
}

export async function updateAlumnus(id: string, data: any): Promise<any> {
  const res = await fetch(`/api/alumni/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    let errorDetail = '';
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        errorDetail = parsed.error || parsed.message || '';
      } catch {
        errorDetail = text.slice(0, 150);
      }
    } catch {}
    throw new Error(errorDetail || `Failed to update alumni record (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteAlumnus(id: string): Promise<any> {
  const res = await fetch(`/api/alumni/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete alumnus');
  return res.json();
}

export async function fetchVerificationLogs(): Promise<VerificationLog[]> {
  const res = await fetch('/api/logs/verifications');
  if (!res.ok) throw new Error('Failed to fetch verification logs');
  return res.json();
}

export async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const res = await fetch('/api/logs/activity');
  if (!res.ok) throw new Error('Failed to fetch activity logs');
  return res.json();
}

export async function loginAdmin(username: string, password: string): Promise<any> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid administrator credentials');
  }
  return res.json();
}

export async function fetchAdminCredentials(): Promise<AdminCredentialsInfo> {
  const res = await fetch('/api/admin/credentials');
  if (!res.ok) throw new Error('Failed to load admin credentials info');
  return res.json();
}

export async function updateAdminCredentials(payload: UpdateCredentialsPayload): Promise<any> {
  const res = await fetch('/api/admin/credentials', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update credentials');
  }
  return res.json();
}

export async function resetAdminCredentials(): Promise<any> {
  const res = await fetch('/api/admin/credentials/reset', {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reset credentials');
  }
  return res.json();
}

export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
  const res = await fetch('/api/sync/status');
  if (!res.ok) {
    throw new Error('Failed to retrieve centralized sync status');
  }
  return res.json();
}


