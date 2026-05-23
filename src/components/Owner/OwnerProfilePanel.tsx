import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { User, Mail, Camera, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/client';

const Wrap = styled.div`
  max-width: 600px;
`;

const AvatarSection = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 40px;
  padding: 28px;
  background: rgba(8, 20, 48, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
`;

const AvatarRing = styled.div`
  position: relative;
  width: 90px;
  height: 90px;
  flex-shrink: 0;

  .avatar-img {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    font-weight: 800;
    color: white;
    border: 2px solid rgba(144, 205, 244, 0.25);
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  .upload-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #2b6cb0;
    border: 2px solid #050d20;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: background 0.2s;

    &:hover { background: #3182ce; }
  }
`;

const AvatarMeta = styled.div`
  .name {
    font-size: 1.3rem;
    font-weight: 800;
    color: #e2ecf7;
    margin-bottom: 4px;
  }
  .email {
    font-size: 0.88rem;
    color: #5a7098;
    margin-bottom: 12px;
  }
  .hint {
    font-size: 0.78rem;
    color: #2d4070;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #3d5a8a;
    margin-bottom: 10px;
  }

  .input-wrap {
    position: relative;

    svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #2d4070;
      pointer-events: none;
    }

    input {
      width: 100%;
      background: rgba(8, 20, 48, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 14px;
      padding: 14px 16px 14px 46px;
      color: #c8d9f0;
      font-size: 0.95rem;
      font-family: inherit;
      transition: all 0.2s;

      &::placeholder { color: #2d4070; }

      &:focus {
        outline: none;
        border-color: rgba(144, 205, 244, 0.3);
        background: rgba(8, 20, 48, 0.7);
        box-shadow: 0 0 0 4px rgba(43, 108, 176, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
`;

const SaveBtn = styled(motion.button)`
  padding: 14px 32px;
  background: linear-gradient(135deg, #2b6cb0 0%, #1a365d 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(26, 54, 93, 0.5);
  }

  &:disabled { opacity: 0.6; cursor: wait; }
`;

const SuccessBanner = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(52, 211, 153, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 12px;
  color: #34d399;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 28px;
`;

const OwnerProfilePanel: React.FC = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'OW';

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await apiClient.upload(file);
      if (res.url) {
        setAvatarPreview(res.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateUser({ name, avatar: avatarPreview ?? undefined } as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap>
      {saved && (
        <SuccessBanner
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <CheckCircle2 size={18} />
          Profile updated successfully!
        </SuccessBanner>
      )}

      <AvatarSection>
        <AvatarRing>
          <div className="avatar-img">
            {avatarPreview ? (
              <img src={avatarPreview} alt={name} />
            ) : (
              initials
            )}
          </div>
          <div
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Change avatar"
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </AvatarRing>
        <AvatarMeta>
          <div className="name">{user?.name}</div>
          <div className="email">{user?.email}</div>
          <div className="hint">Click the camera icon to change your avatar</div>
        </AvatarMeta>
      </AvatarSection>

      <FieldGroup>
        <label>Display Name</label>
        <div className="input-wrap">
          <User size={17} />
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
          />
        </div>
      </FieldGroup>

      <FieldGroup>
        <label>Email Address</label>
        <div className="input-wrap">
          <Mail size={17} />
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            placeholder="email@example.com"
          />
        </div>
      </FieldGroup>

      <SaveBtn
        onClick={handleSave}
        disabled={saving}
        whileTap={{ scale: 0.97 }}
      >
        {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
        {saving ? 'Saving…' : 'Save Changes'}
      </SaveBtn>
    </Wrap>
  );
};

export default OwnerProfilePanel;
