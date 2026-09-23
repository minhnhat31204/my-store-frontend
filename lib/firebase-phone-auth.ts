import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';

let verifier: RecaptchaVerifier | null = null;

export function toVietnamE164(value: string) {
  const digits = value.replace(/\D/g, '');
  if (/^0\d{9}$/.test(digits)) return `+84${digits.slice(1)}`;
  if (/^84\d{9}$/.test(digits)) return `+${digits}`;
  if (/^\+84\d{9}$/.test(value.trim())) return value.trim();
  throw new Error('Vui lòng nhập số điện thoại Việt Nam hợp lệ (10 số).');
}

export async function sendFirebasePhoneOtp(phone: string, containerId: string): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const container = document.getElementById(containerId);
  if (!container) throw new Error('Không tìm thấy vùng xác minh reCAPTCHA. Tải lại trang và thử lại.');
  if (!verifier) verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return signInWithPhoneNumber(auth, toVietnamE164(phone), verifier);
}

export function clearFirebasePhoneVerifier() {
  verifier?.clear();
  verifier = null;
}
