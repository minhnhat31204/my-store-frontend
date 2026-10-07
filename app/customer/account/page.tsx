'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getStoredUser, resolveApiAssetUrl, type User } from '@/lib/api';

// --- ICONS ---
function CameraIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UserCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}

function PhoneIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TrashIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function EyeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// --- AVATAR CROPPER MODAL COMPONENT ---
interface AvatarCropperModalProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

function AvatarCropperModal({ imageSrc, onCropComplete, onCancel }: AvatarCropperModalProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Center image when loaded
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = e.currentTarget;
    setPosition({ x: 0, y: 0 });
    setScale(1);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.1 : -0.1;
    setScale((prev) => Math.min(Math.max(0.5, prev + zoomFactor), 4));
  };

  const handleSaveCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const size = 400; // Output avatar dimension
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport diameter is 260px in our modal
    const viewportSize = 260;
    const ratio = size / viewportSize;

    ctx.save();
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Make circle clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Translate to center
    ctx.translate(size / 2 + position.x * ratio, size / 2 + position.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * ratio, scale * ratio);

    // Draw image centered
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;
    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    ctx.restore();

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
        
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">Cắt &amp; căn chỉnh ảnh đại diện</h3>
            <p className="text-xs text-slate-500">Kéo di chuyển và thu phóng để chọn vùng tròn ưng ý</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Crop Area Container */}
        <div className="p-6">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="relative mx-auto h-[280px] w-[280px] cursor-grab select-none overflow-hidden rounded-2xl bg-slate-950 flex items-center justify-center active:cursor-grabbing touch-none"
          >
            {/* Image Layer */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop target"
              onLoad={onImageLoad}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
              className="pointer-events-none transition-transform duration-75"
            />

            {/* Circular Mask Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Darkened outer frame using box-shadow */}
              <div
                className="h-[240px] w-[240px] rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.7)]"
                style={{
                  boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.72)',
                }}
              >
                {/* Guide lines */}
                <div className="relative h-full w-full rounded-full">
                  <div className="absolute inset-x-0 top-1/3 border-t border-white/25" />
                  <div className="absolute inset-x-0 top-2/3 border-t border-white/25" />
                  <div className="absolute inset-y-0 left-1/3 border-l border-white/25" />
                  <div className="absolute inset-y-0 left-2/3 border-l border-white/25" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Zoom slider & Rotate button */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Thu nhỏ"
              >
                <ZoomOutIcon />
              </button>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
              />
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(3, s + 0.15))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Phóng to"
              >
                <ZoomInIcon />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="flex h-8 px-2.5 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                title="Xoay 90 độ"
              >
                <RotateIcon />
                <span>Xoay</span>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400">
              Mẹo: Lăn chuột hoặc kéo thanh trượt để phóng to/thu nhỏ
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
          >
            Áp dụng ảnh này
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN ACCOUNT PAGE ---
type ActiveTab = 'profile' | 'phone' | 'email' | 'password' | 'delete';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Avatar & Cropper States
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState('');
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const previewBlobUrlRef = useRef<string | null>(null);

  // Status & Messages
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');

  // Email Verification States
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete Account States
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load User Data
  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) {
      setProfileName(stored.FullName || '');
      setUsername(stored.Username || '');
      setBio(stored.Bio || '');
      setGender(stored.Gender || 'Nam');
      setBirthday(stored.Birthday ? String(stored.Birthday).slice(0, 10) : '');
      setPhone(stored.Phone || '');
      setAddress(stored.Address || '');
      setRecoveryEmail(stored.RecoveryEmail || '');
    }
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
    };
  }, []);

  // Handle file selection -> Open Cropper Modal
  const handleSelectAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setProfileError('Vui lòng chọn ảnh định dạng JPG, PNG, WEBP hoặc GIF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setProfileError('Ảnh đại diện tối đa 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImageSrc(reader.result);
        setCropModalOpen(true);
        setProfileError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // When Cropper finishes -> set avatarBlob and preview
  const handleCropComplete = (croppedBlob: Blob) => {
    if (previewBlobUrlRef.current) URL.revokeObjectURL(previewBlobUrlRef.current);
    const newPreviewUrl = URL.createObjectURL(croppedBlob);
    previewBlobUrlRef.current = newPreviewUrl;
    setAvatarBlob(croppedBlob);
    setAvatarPreview(newPreviewUrl);
    setCropModalOpen(false);
    setProfileMessage('Đã chọn và cắt ảnh đại diện mới. Hãy bấm "Lưu thay đổi" để áp dụng.');
  };

  // Save Full Profile (Hồ sơ & Avatar)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const result = await api.updateUserProfile(user.UserID, {
        fullName: profileName.trim(),
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        gender,
        birthday: birthday || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        avatar: avatarBlob || undefined,
      });

      const updatedUser: User = { ...user, ...result.user };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));

      setAvatarBlob(null);
      setProfileMessage('Cập nhật hồ sơ cá nhân thành công!');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Không thể lưu hồ sơ.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Send OTP for Email Verification
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const result = await api.sendEmailVerificationOtp(user.UserID, recoveryEmail.trim(), emailPassword);
      setEmailOtpSent(true);
      setEmailMessage(result.message);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Không thể gửi mã xác minh.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Verify OTP for Email
  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    setEmailError('');
    setEmailMessage('');
    try {
      const result = await api.verifyEmailOtp(user.UserID, recoveryEmail.trim(), emailOtp);
      const updatedUser = { ...user, RecoveryEmail: result.user.RecoveryEmail, RecoveryEmailVerified: true };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('user-updated'));
      setEmailOtpSent(false);
      setEmailOtp('');
      setEmailPassword('');
      setEmailMessage('Email đã được xác minh và liên kết thành công!');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setEmailLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordMessage('');

    try {
      const result = await api.changePassword(user.UserID, currentPassword, newPassword);
      setPasswordMessage(result.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const confirmInput = deleteConfirmText.trim();
    const phoneMatches = user.Phone && confirmInput === user.Phone.trim();
    if (confirmInput.toUpperCase() !== 'XÓA TÀI KHOẢN' && !phoneMatches) {
      setDeleteError('Vui lòng nhập đúng chữ "XÓA TÀI KHOẢN" hoặc số điện thoại của bạn để xác nhận.');
      return;
    }
    if (!window.confirm('CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này khỏi hệ thống?')) {
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.deleteUser(user.UserID);
      localStorage.removeItem('user');
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('remembered_phone');
      sessionStorage.removeItem('user');
      setUser(null);
      window.dispatchEvent(new Event('user-updated'));
      window.location.href = '/login?deleted=1';
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không thể xóa tài khoản.');
      setDeleteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    sessionStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('user-updated'));
    window.location.href = '/login';
  };

  const currentAvatarSrc = avatarPreview || (user?.Avatar ? resolveApiAssetUrl(user.Avatar) : '');

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 py-12 text-slate-900">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <UserCircleIcon className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-xl font-black">Chưa đăng nhập</h2>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng đăng nhập để xem và quản lý thông tin tài khoản của bạn.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100/70 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        
        {/* Hidden File Input for Avatar */}
        <input
          ref={avatarFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleSelectAvatarFile}
          className="hidden"
        />

        {/* Avatar Cropper Modal */}
        {cropModalOpen && (
          <AvatarCropperModal
            imageSrc={rawImageSrc}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalOpen(false)}
          />
        )}

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm text-slate-500">Cập nhật thông tin cá nhân, liên kết email và bảo mật</p>
        </div>

        {/* Main Grid: Left Sidebar & Right Content */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* Left Sidebar: User Card & Navigation Tabs */}
          <div className="md:col-span-4 lg:col-span-4 space-y-4">
            
            {/* User Profile Overview Card with Clickable Camera Avatar */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm text-center">
              
              {/* Avatar with Camera Icon Overlay */}
              <div className="relative mx-auto inline-block">
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="group relative block h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-400"
                  title="Bấm để thay đổi ảnh đại diện"
                >
                  {currentAvatarSrc ? (
                    <img
                      src={currentAvatarSrc}
                      alt="Ảnh đại diện"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-black text-white">
                      {(user.FullName || user.Phone || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 transition group-hover:opacity-100">
                    <CameraIcon className="w-6 h-6" />
                    <span className="mt-1 text-[10px] font-bold">Đổi ảnh</span>
                  </div>
                </button>

                {/* Floating Camera Badge Button */}
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white transition hover:bg-blue-700 hover:scale-110 active:scale-95"
                  title="Thay đổi ảnh đại diện"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
              </div>

              {/* User Info */}
              <h2 className="mt-4 text-base font-bold text-slate-900">
                {user.FullName || 'Khách hàng'}
              </h2>
              {user.Username && (
                <p className="text-xs text-blue-600 font-semibold">@{user.Username}</p>
              )}
              {(() => {
                const isInternalEmail = user.Email?.includes('@phone.manb.local') || user.Email?.includes('@phone.local');
                const contact = user.Email && !isInternalEmail ? user.Email : (user.RecoveryEmail || (user.Phone ? `SĐT: ${user.Phone}` : ''));
                return contact ? (
                  <p className="mt-0.5 text-xs text-slate-500 truncate">{contact}</p>
                ) : null;
              })()}

              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
              >
                <CameraIcon className="w-3.5 h-3.5" />
                <span>Chỉnh sửa ảnh tròn</span>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
              <nav className="flex flex-col space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === 'profile'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <UserCircleIcon className="w-5 h-5" />
                  <span>Hồ sơ của tôi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('phone')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === 'phone'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span>Điện thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === 'email'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <MailIcon className="w-5 h-5" />
                  <div className="flex flex-1 items-center justify-between">
                    <span>Email liên kết</span>
                    {user.RecoveryEmailVerified && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                        Đã xác minh
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('password')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === 'password'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LockIcon className="w-5 h-5" />
                  <span>Đổi mật khẩu</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('delete')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeTab === 'delete'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <TrashIcon className="w-5 h-5" />
                  <span>Xóa tài khoản</span>
                </button>
              </nav>

              <div className="my-2 border-t border-slate-100" />

              {/* Quick links & Logout */}
              <div className="space-y-1">
                <Link
                  href="/customer/orders"
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  <span>Đơn hàng của tôi</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/customer/addresses"
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  <span>Sổ địa chỉ giao hàng</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/customer/favorites"
                  className="flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  <span>Sản phẩm yêu thích</span>
                  <span>→</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition"
                >
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          </div>

          {/* Right Main Content Panel */}
          <div className="md:col-span-8 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
              
              {/* TAB 1: HỒ SƠ CỦA TÔI */}
              {activeTab === 'profile' && (
                <section>
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900">Hồ sơ của tôi</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Quản lý thông tin hồ sơ để bảo mật tài khoản và tối ưu trải nghiệm mua sắm
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                    {/* Tên hiển thị */}
                    <div>
                      <label htmlFor="full-name" className="block text-xs font-bold text-slate-700">
                        Tên hiển thị <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Tên người dùng */}
                    <div>
                      <label htmlFor="username" className="block text-xs font-bold text-slate-700">
                        Tên người dùng / Biệt danh
                      </label>
                      <div className="relative mt-1.5">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-sm font-bold text-slate-400">
                          @
                        </span>
                        <input
                          id="username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                          placeholder="username_manb"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {/* Tiểu sử */}
                    <div>
                      <label htmlFor="bio" className="block text-xs font-bold text-slate-700">
                        Tiểu sử / Giới thiệu
                      </label>
                      <textarea
                        id="bio"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Chia sẻ đôi nét về bạn..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Giới tính */}
                    <div>
                      <span className="block text-xs font-bold text-slate-700">Giới tính</span>
                      <div className="mt-2 flex items-center gap-6">
                        {['Nam', 'Nữ', 'Khác'].map((g) => (
                          <label key={g} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                            <input
                              type="radio"
                              name="gender"
                              value={g}
                              checked={gender === g}
                              onChange={(e) => setGender(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>{g}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                      <label htmlFor="birthday" className="block text-xs font-bold text-slate-700">
                        Ngày sinh
                      </label>
                      <input
                        id="birthday"
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="mt-1.5 w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Địa chỉ */}
                    <div>
                      <label htmlFor="address" className="block text-xs font-bold text-slate-700">
                        Địa chỉ liên hệ
                      </label>
                      <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Feedback Messages */}
                    {profileError && (
                      <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                        {profileError}
                      </p>
                    )}
                    {profileMessage && (
                      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        {profileMessage}
                      </p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={profileLoading || !profileName.trim()}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    >
                      {profileLoading ? 'Đang lưu…' : 'Lưu thay đổi hồ sơ'}
                    </button>
                  </form>
                </section>
              )}

              {/* TAB 2: ĐIỆN THOẠI */}
              {activeTab === 'phone' && (
                <section>
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900">Số điện thoại</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Số điện thoại dùng để đăng nhập và nhận thông tin giao hàng
                    </p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="phone-input" className="block text-xs font-bold text-slate-700">
                        Số điện thoại
                      </label>
                      <input
                        id="phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0912345678"
                        className="mt-1.5 w-full sm:w-80 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {profileError && (
                      <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                        {profileError}
                      </p>
                    )}
                    {profileMessage && (
                      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        {profileMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    >
                      {profileLoading ? 'Đang lưu…' : 'Cập nhật số điện thoại'}
                    </button>
                  </form>
                </section>
              )}

              {/* TAB 3: EMAIL (LIÊN KẾT) */}
              {activeTab === 'email' && (
                <section>
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900">Email liên kết &amp; khôi phục</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Liên kết email để nhận thông báo đơn hàng và lấy lại mật khẩu khi cần thiết
                    </p>
                  </div>

                  {/* Primary Account Email Display */}
                  {user.Email && !user.Email.includes('@phone.manb.local') && !user.Email.includes('@phone.local') ? (
                    <div className="mt-6 rounded-xl bg-slate-50 p-4 border border-slate-200">
                      <span className="text-xs font-bold text-slate-500">Email tài khoản chính:</span>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{user.Email}</p>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-xl bg-blue-50/60 p-4 border border-blue-100">
                      <span className="text-xs font-bold text-blue-700">Hình thức đăng nhập:</span>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">Đăng ký bằng Số điện thoại ({user.Phone || 'Chưa cập nhật'})</p>
                      <p className="mt-1 text-xs text-slate-500">Bạn có thể liên kết thêm email bên dưới để nhận thông báo và hỗ trợ khôi phục mật khẩu khi cần.</p>
                    </div>
                  )}

                  {/* Recovery Email Section */}
                  <div className="mt-6">
                    {user.RecoveryEmailVerified ? (
                      <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 flex items-center gap-3">
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">
                            Email khôi phục đã được xác minh:
                          </p>
                          <p className="text-sm font-black text-emerald-900">{user.RecoveryEmail}</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={emailOtpSent ? handleVerifyEmailOtp : handleSendEmailOtp} className="space-y-4">
                        <div>
                          <label htmlFor="rec-email" className="block text-xs font-bold text-slate-700">
                            Email liên kết / khôi phục
                          </label>
                          <input
                            id="rec-email"
                            type="email"
                            required
                            value={recoveryEmail}
                            onChange={(e) => {
                              setRecoveryEmail(e.target.value);
                              setEmailOtpSent(false);
                            }}
                            placeholder="email@example.com"
                            className="mt-1.5 w-full sm:w-96 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          />
                        </div>

                        {!emailOtpSent && (
                          <div>
                            <label htmlFor="rec-pw" className="block text-xs font-bold text-slate-700">
                              Mật khẩu hiện tại để xác thực
                            </label>
                            <div className="relative mt-1.5 w-full sm:w-96">
                              <input
                                id="rec-pw"
                                type={showEmailPassword ? 'text' : 'password'}
                                required
                                value={emailPassword}
                                onChange={(e) => setEmailPassword(e.target.value)}
                                placeholder="Nhập mật khẩu tài khoản"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEmailPassword(!showEmailPassword)}
                                aria-label={showEmailPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                              >
                                {showEmailPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {emailOtpSent && (
                          <div>
                            <label htmlFor="email-otp" className="block text-xs font-bold text-slate-700">
                              Mã OTP xác minh (6 số)
                            </label>
                            <input
                              id="email-otp"
                              type="text"
                              maxLength={6}
                              required
                              value={emailOtp}
                              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456"
                              className="mt-1.5 w-full sm:w-64 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-center text-lg font-black tracking-widest text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        )}

                        {emailError && (
                          <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                            {emailError}
                          </p>
                        )}
                        {emailMessage && (
                          <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                            {emailMessage}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={emailLoading || (emailOtpSent && emailOtp.length !== 6)}
                          className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                        >
                          {emailLoading ? 'Đang xử lý…' : emailOtpSent ? 'Xác minh mã OTP' : 'Gửi mã xác minh đến Email'}
                        </button>
                      </form>
                    )}
                  </div>
                </section>
              )}

              {/* TAB 4: ĐỔI MẬT KHẨU */}
              {activeTab === 'password' && (
                <section>
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xl font-black text-slate-900">Đổi mật khẩu</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho bất kỳ ai
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="current-pw" className="block text-xs font-bold text-slate-700">
                        Mật khẩu hiện tại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5 w-full sm:w-96">
                        <input
                          id="current-pw"
                          type={showCurrentPassword ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showCurrentPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="new-pw" className="block text-xs font-bold text-slate-700">
                        Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5 w-full sm:w-96">
                        <input
                          id="new-pw"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showNewPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirm-pw" className="block text-xs font-bold text-slate-700">
                        Xác nhận lại mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5 w-full sm:w-96">
                        <input
                          id="confirm-pw"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showConfirmPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                        {passwordError}
                      </p>
                    )}
                    {passwordMessage && (
                      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        {passwordMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    >
                      {passwordLoading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </section>
              )}

              {/* TAB 5: XÓA TÀI KHOẢN */}
              {activeTab === 'delete' && (
                <section>
                  <div className="border-b border-red-100 pb-4">
                    <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                      <TrashIcon className="w-6 h-6" />
                      <span>Xóa tài khoản vĩnh viễn</span>
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Vùng nguy hiểm: Yêu cầu xóa vĩnh viễn tài khoản của bạn khỏi hệ thống
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50/50 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-red-900 flex items-center gap-2">
                      <span>⚠️ Lưu ý quan trọng trước khi xóa tài khoản:</span>
                    </h4>
                    <ul className="text-xs text-red-800 space-y-1.5 list-disc list-inside">
                      <li>Tất cả thông tin tài khoản, giỏ hàng, thông báo và sổ địa chỉ sẽ bị xóa vĩnh viễn.</li>
                      <li>Bạn sẽ không thể đăng nhập hoặc khôi phục lại tài khoản sau khi đã xóa.</li>
                      <li>Nếu bạn chỉ muốn đăng xuất, vui lòng chọn <strong>Đăng xuất tài khoản</strong> ở menu bên trái.</li>
                    </ul>
                  </div>

                  <form onSubmit={handleDeleteAccount} className="mt-6 space-y-5">
                    <div>
                      <label htmlFor="delete-confirm" className="block text-xs font-bold text-slate-700">
                        Để xác nhận, vui lòng nhập chữ <strong className="text-red-600 font-black">XÓA TÀI KHOẢN</strong> hoặc số điện thoại của bạn:
                      </label>
                      <input
                        id="delete-confirm"
                        type="text"
                        required
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Nhập XÓA TÀI KHOẢN để xác nhận"
                        className="mt-1.5 w-full sm:w-96 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                      />
                    </div>

                    {deleteError && (
                      <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
                        {deleteError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={deleteLoading || !deleteConfirmText.trim()}
                      className="rounded-xl bg-red-600 px-6 py-3 text-xs font-black text-white shadow-md transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
                    >
                      {deleteLoading ? 'Đang xóa tài khoản…' : 'Xác nhận xóa tài khoản vĩnh viễn'}
                    </button>
                  </form>
                </section>
              )}

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
