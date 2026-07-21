import React, { useState, lazy, Suspense, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { MapPin, Edit2, Trash2, Plus, X, UploadCloud, Map, Film, Image as ImageIcon, Clock, Phone, Globe, DollarSign, Ticket, Check, ChevronDown, Star, Sparkles } from 'lucide-react';
import AdminSearchBar from './AdminSearchBar';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../../api/db';
import { ATTRACTION_CATEGORIES, ATTRACTION_TAGS, getMapIconUrl } from './CategoryTagConfig';
import { uploadFile } from '../../api/storage';
import { compressImage } from '../../utils/imageUtils';
import { useAlert } from '../Common/AlertProvider';
import { getMediaUrl } from '../../utils/mediaUtils';
import { useAuth } from '../../hooks/useAuth';

const MapPicker = lazy(() => import('./MapPicker'));

// ─── Animations ─────────────────────────────────────────────────────────────
const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Manager Container ───────────────────────────────────────────────────────
const ManagerContainer = styled(motion.div)`
  background: var(--surface-bg);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;

const HeaderRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h2 { font-size: 1.5rem; color: ${p => p.theme.colors.darkBlue}; font-weight: 800; }
  .actions { display: flex; gap: 16px; align-items: center; }
  button.add-btn {
    background: linear-gradient(135deg, ${p => p.theme.colors.ctaBlue}, ${p => p.theme.colors.primaryBlue});
    color: white; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700;
    display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(46,117,182,0.3);
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(46,117,182,0.4); }
  }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid rgba(148,163,184,0.1); }
  th { font-weight: 700; color: var(--text-light); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; }
  td { color: var(--text-dark); }
  tr:hover td { background: rgba(46,117,182,0.02); }
  .row-actions { display: flex; gap: 8px;
    button { background: #f8fafc; border: 1px solid #e2e8f0; padding: 7px; border-radius: 8px; cursor: pointer; color: var(--text-light); transition: all 0.2s;
      &:hover { color: ${p => p.theme.colors.ctaBlue}; background: rgba(46,117,182,0.08); border-color: var(--cta-blue); }
      &.delete:hover { color: #ef4444; background: rgba(239,68,68,0.08); border-color: #ef4444; }
    }
  }
`;

// ─── Modal Layout ────────────────────────────────────────────────────────────
const FormModalOverlay = styled(motion.div)`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(12px);
  display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 8px;
`;

const FormModalContent = styled(motion.div)`
  background: var(--surface-bg);
  width: calc(100vw - 16px);
  height: calc(100vh - 16px);
  border-radius: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0,0,0,0.35);
`;

const ModalHeader = styled.div`
  padding: 0 40px;
  height: 72px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .icon-box {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: white;
  }
  h3 {
    font-family: ${p => p.theme.fonts.heading};
    font-size: 1.4rem;
    color: white;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.3px;
  }
  .subtitle {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }
  .close-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: rgba(255,255,255,0.7);
    transition: all 0.2s;
    &:hover { background: rgba(239,68,68,0.4); color: white; border-color: transparent; }
  }
`;

const ThreeColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 400px minmax(350px, 1fr) 420px;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
`;

// ─── Left Pane (Form) ────────────────────────────────────────────────────────
const FormPane = styled.div`
  border-right: 1px solid rgba(148,163,184,0.12);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 10px; }
`;

const FormSection = styled.div<{ $index: number }>`
  padding: 24px 28px;
  border-bottom: 1px solid rgba(148,163,184,0.08);
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${p => p.$index * 0.05}s;
`;

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;

  .num {
    width: 26px; height: 26px;
    background: linear-gradient(135deg, var(--cta-blue), var(--primary-blue));
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: white;
    font-size: 0.7rem;
    font-weight: 900;
    flex-shrink: 0;
  }
  .title {
    font-weight: 800;
    font-size: 0.9rem;
    color: var(--text-dark);
    letter-spacing: 0.3px;
  }
  .hint {
    font-size: 0.75rem;
    color: var(--text-light);
    font-weight: 500;
    margin-left: auto;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid rgba(148,163,184,0.2);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--light-bg);
  color: var(--text-dark);
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  &:focus {
    border-color: var(--cta-blue);
    background: var(--surface-bg);
    box-shadow: 0 0 0 3px rgba(46,117,182,0.1);
  }
  &::placeholder { color: rgba(148,163,184,0.7); }
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  padding: 13px 16px;
  border: 1.5px solid rgba(148,163,184,0.2);
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--light-bg);
  color: var(--text-dark);
  outline: none;
  transition: all 0.2s;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  font-family: inherit;
  &:focus {
    border-color: var(--cta-blue);
    background: var(--surface-bg);
    box-shadow: 0 0 0 3px rgba(46,117,182,0.1);
  }
  &::placeholder { color: rgba(148,163,184,0.7); }
`;

const FieldLabel = styled.label`
  display: block;
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const CategoryGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CategoryPill = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  border: 1.5px solid ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148,163,184,0.2)'};
  background: ${p => p.$active ? 'var(--cta-blue)' : 'var(--light-bg)'};
  color: ${p => p.$active ? 'white' : 'var(--text-dark)'};
  box-shadow: ${p => p.$active ? '0 4px 12px rgba(46,117,182,0.25)' : 'none'};
  img { height: 16px; filter: ${p => p.$active ? 'brightness(0) invert(1)' : 'none'}; }
  &:hover {
    border-color: var(--cta-blue);
    transform: translateY(-1px);
  }
`;

const TagPill = styled.button<{ $active: boolean }>`
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: 1.5px solid ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148,163,184,0.2)'};
  background: ${p => p.$active ? 'rgba(46,117,182,0.1)' : 'transparent'};
  color: ${p => p.$active ? 'var(--cta-blue)' : 'var(--text-light)'};
  &:hover { border-color: var(--cta-blue); color: var(--cta-blue); }
`;

const ShowMoreBtn = styled.button`
  background: none;
  border: none;
  color: var(--cta-blue);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  svg { transition: transform 0.2s; }
  &.expanded svg { transform: rotate(180deg); }
`;

// ─── Admission Section ───────────────────────────────────────────────────────
const AdmissionToggle = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 16px;
`;

const AdmissionOption = styled.button<{ $active: boolean }>`
  padding: 14px;
  border-radius: 14px;
  border: 2px solid ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148,163,184,0.2)'};
  background: ${p => p.$active ? 'rgba(46,117,182,0.08)' : 'var(--light-bg)'};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  .icon { 
    width: 36px; height: 36px; border-radius: 10px;
    background: ${p => p.$active ? 'var(--cta-blue)' : 'rgba(148,163,184,0.1)'};
    display: flex; align-items: center; justify-content: center;
    color: ${p => p.$active ? 'white' : 'var(--text-light)'};
    transition: all 0.2s;
  }
  .label { font-size: 0.82rem; font-weight: 800; color: ${p => p.$active ? 'var(--cta-blue)' : 'var(--text-dark)'}; }
  .sub { font-size: 0.7rem; color: var(--text-light); }
  &:hover { border-color: var(--cta-blue); }
`;

const OffersBuilder = styled.div`
  background: var(--light-bg);
  border-radius: 14px;
  padding: 16px;
  border: 1px solid rgba(148,163,184,0.15);
`;

const OfferInputRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SmallInput = styled.input`
  padding: 10px 12px;
  border: 1.5px solid rgba(148,163,184,0.2);
  border-radius: 10px;
  font-size: 0.85rem;
  background: var(--surface-bg);
  color: var(--text-dark);
  outline: none;
  transition: all 0.2s;
  min-width: 0;
  &:focus { border-color: var(--cta-blue); box-shadow: 0 0 0 3px rgba(46,117,182,0.1); }
  &::placeholder { color: rgba(148,163,184,0.6); font-size: 0.8rem; }
`;

const AddOfferBtn = styled.button`
  background: var(--cta-blue);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  &:hover { background: var(--primary-blue); transform: scale(1.02); }
`;

const OfferItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface-bg);
  padding: 10px 12px;
  border-radius: 10px;
  margin-bottom: 6px;
  border: 1px solid rgba(148,163,184,0.1);

  img { width: 32px; height: 32px; border-radius: 8px; object-fit: cover; }
  .name { flex: 1; font-weight: 700; font-size: 0.85rem; color: var(--text-dark); }
  .price { color: var(--cta-blue); font-weight: 900; font-size: 0.85rem; }
  .del {
    background: rgba(239,68,68,0.1); border: none; color: #ef4444;
    width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    &:hover { background: rgba(239,68,68,0.2); }
  }
`;

// ─── Media Upload ────────────────────────────────────────────────────────────
const DropZone = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${p => p.$isDragActive ? 'var(--cta-blue)' : 'rgba(148,163,184,0.3)'};
  background: ${p => p.$isDragActive ? 'rgba(46,117,182,0.08)' : 'rgba(148,163,184,0.03)'};
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
  &:hover { border-color: var(--cta-blue); background: rgba(46,117,182,0.05); }
  input[type="file"] { display: none; }
  .dz-title { font-weight: 700; font-size: 0.9rem; color: var(--text-dark); }
  .dz-sub { font-size: 0.75rem; }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const PhotoThumb = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(148,163,184,0.2);
  img { width: 100%; height: 100%; object-fit: cover; }
  .thumb-badge {
    position: absolute; top: 3px; left: 3px;
    background: rgba(0,0,0,0.65); color: white;
    font-size: 0.55rem; font-weight: 800;
    padding: 2px 5px; border-radius: 5px; text-transform: uppercase;
  }
  .del-btn {
    position: absolute; top: 3px; right: 3px;
    background: rgba(239,68,68,0.9); color: white;
    border: none; width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 12px;
  }
`;

const SaveBtn = styled.button`
  margin: 20px 28px 28px;
  background: linear-gradient(135deg, var(--cta-blue), var(--primary-blue));
  color: white;
  border: none;
  padding: 18px 32px;
  border-radius: 16px;
  font-size: 1.05rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 8px 25px rgba(46,117,182,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-shrink: 0;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 35px rgba(46,117,182,0.4); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

// ─── Middle Pane (Live Preview) ──────────────────────────────────────────────
const PreviewPane = styled.div`
  background: var(--light-bg);
  border-right: 1px solid rgba(148,163,184,0.12);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 24px;
  gap: 20px;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 10px; }
`;

const PreviewTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--text-dark);
  text-transform: uppercase;
  letter-spacing: 1px;
  svg { color: var(--cta-blue); }
`;

const PreviewCard = styled.div`
  background: var(--surface-bg);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  border: 1px solid rgba(148,163,184,0.1);
  animation: ${fadeUp} 0.3s ease;
`;

const PreviewImageArea = styled.div`
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
  position: relative;
  overflow: hidden;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const PreviewPlaceholder = styled.div`
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 8px; color: rgba(148,163,184,0.8);
  font-size: 0.8rem; font-weight: 600;
`;

const PreviewCatBadge = styled.span`
  position: absolute;
  top: 12px; left: 12px;
  background: rgba(0,0,0,0.6);
  color: white;
  font-size: 0.7rem; font-weight: 800;
  padding: 4px 10px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.5px;
`;

const PreviewBody = styled.div`
  padding: 18px;
`;

const PreviewName = styled.h4`
  font-size: 1.1rem;
  font-weight: 900;
  color: var(--text-dark);
  margin: 0 0 6px;
  font-family: ${p => p.theme.fonts.heading};
`;

const PreviewLocation = styled.div`
  display: flex; align-items: center; gap: 5px;
  color: var(--text-light); font-size: 0.8rem; font-weight: 600;
  margin-bottom: 14px;
`;

const PreviewDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(148,163,184,0.12);
  margin: 0 0 14px;
`;

const PreviewInfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`;

const PreviewRowIcon = styled.div`
  width: 30px; height: 30px;
  border-radius: 8px;
  background: var(--light-bg);
  display: flex; align-items: center; justify-content: center;
  color: var(--cta-blue);
  flex-shrink: 0;
`;

const PreviewRowContent = styled.div`
  flex: 1;
  .label { font-size: 0.72rem; font-weight: 700; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
  .value { font-size: 0.85rem; font-weight: 600; color: var(--text-dark); }
`;

const FreeBadge = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.75rem; font-weight: 900;
  padding: 3px 10px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 1px;
`;

const PreviewOfferLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  padding: 5px 0;
  border-bottom: 1px solid rgba(148,163,184,0.08);
  .oname { font-weight: 600; color: var(--text-dark); }
  .oprice { font-weight: 800; color: var(--cta-blue); }
  &:last-child { border-bottom: none; }
`;

const TagsPreview = styled.div`
  display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px;
  span {
    background: rgba(46,117,182,0.08);
    color: var(--cta-blue);
    font-size: 0.7rem; font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
  }
`;

// ─── Right Pane (Map) ────────────────────────────────────────────────────────
const MapPane = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--light-bg);
`;

const MapHeader = styled.div`
  padding: 18px 20px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(148,163,184,0.12);
  .map-title { font-weight: 800; font-size: 0.85rem; color: var(--text-dark); display: flex; align-items: center; gap: 8px; }
  .map-sub { font-size: 0.75rem; color: var(--text-light); margin-top: 4px; }
`;

const MapContainer = styled.div`
  flex: 1;
  overflow: hidden;
`;

const CoordBadge = styled.div`
  margin: 10px 20px;
  background: rgba(46,117,182,0.1);
  border: 1px solid rgba(46,117,182,0.2);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.78rem;
  color: var(--cta-blue);
  font-weight: 700;
  display: flex; align-items: center; gap: 6px;
  flex-shrink: 0;
`;

// ─── Live Preview Component ──────────────────────────────────────────────────
function LivePreview({ formData, photos, offers }: { formData: any; photos: string[]; offers: any[] }) {
  const thumbnail = photos[0] ? getMediaUrl(photos[0]) : null;
  const isFree = formData.pricingType === 'Free';

  return (
    <>
      <PreviewTitle>
        <Sparkles size={14} />
        Live Preview
      </PreviewTitle>

      <PreviewCard>
        <PreviewImageArea>
          {thumbnail ? (
            <img src={thumbnail} alt="Preview" />
          ) : (
            <PreviewPlaceholder>
              <ImageIcon size={28} />
              <span>Upload a photo to see thumbnail</span>
            </PreviewPlaceholder>
          )}
          {formData.categories?.[0] && (
            <PreviewCatBadge>{formData.categories[0]}</PreviewCatBadge>
          )}
        </PreviewImageArea>

        <PreviewBody>
          <PreviewName>{formData.name || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Attraction Name...</span>}</PreviewName>

          <PreviewLocation>
            <MapPin size={13} />
            {formData.location || <span style={{ opacity: 0.5 }}>Location will appear here</span>}
          </PreviewLocation>

          {formData.categories?.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {formData.categories.map((c: string) => (
                <span key={c} style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>{c}</span>
              ))}
            </div>
          )}

          <PreviewDivider />

          <PreviewInfoBlock>
            {/* Admission */}
            <PreviewRow>
              <PreviewRowIcon><DollarSign size={15} /></PreviewRowIcon>
              <PreviewRowContent>
                <div className="label">Admission</div>
                {isFree ? (
                  <FreeBadge>Free Entry</FreeBadge>
                ) : offers.length > 0 ? (
                  <div>
                    {offers.slice(0, 3).map(o => (
                      <PreviewOfferLine key={o.id}>
                        <span className="oname">{o.name}</span>
                        <span className="oprice">₱{o.price}</span>
                      </PreviewOfferLine>
                    ))}
                    {offers.length > 3 && <div style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: 4 }}>+{offers.length - 3} more offers</div>}
                  </div>
                ) : (
                  <span className="value" style={{ color: '#94a3b8' }}>Add offers below...</span>
                )}
              </PreviewRowContent>
            </PreviewRow>

            {/* Hours */}
            {(formData.openingTime || formData.closingTime) && (
              <PreviewRow>
                <PreviewRowIcon><Clock size={15} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Operating Hours</div>
                  <div className="value">{formData.openingTime || '--:--'} – {formData.closingTime || '--:--'}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Contact */}
            {formData.contactInfo && (
              <PreviewRow>
                <PreviewRowIcon><Phone size={15} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Contact</div>
                  <div className="value">{formData.contactInfo}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}

            {/* Website */}
            {formData.website && (
              <PreviewRow>
                <PreviewRowIcon><Globe size={15} /></PreviewRowIcon>
                <PreviewRowContent>
                  <div className="label">Website</div>
                  <div className="value" style={{ color: 'var(--cta-blue)' }}>{formData.website}</div>
                </PreviewRowContent>
              </PreviewRow>
            )}
          </PreviewInfoBlock>

          {(formData.tags || []).length > 0 && (
            <TagsPreview>
              {(formData.tags || []).map((t: string) => <span key={t}>#{t}</span>)}
            </TagsPreview>
          )}
        </PreviewBody>
      </PreviewCard>

      {/* Description preview */}
      {formData.description && (
        <div style={{ background: 'var(--surface-bg)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Description</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.6, opacity: 0.85 }}>{formData.description}</div>
        </div>
      )}

      {/* Photos preview strip */}
      {photos.length > 1 && (
        <div style={{ background: 'var(--surface-bg)', borderRadius: 16, padding: '16px 18px', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Gallery ({photos.length} photos)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {photos.slice(1).map((p, i) => (
              <img key={i} src={getMediaUrl(p)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AttractionsManager({ attractions, ownerMode, onDataChange }: { attractions?: any[]; ownerMode?: boolean; onDataChange?: () => void }) {
  const { role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [videoDragActive, setVideoDragActive] = useState(false);

  const [offers, setOffers] = useState<any[]>([]);
  const [newOfferName, setNewOfferName] = useState('');
  const [newOfferPrice, setNewOfferPrice] = useState('');
  const [newOfferImage, setNewOfferImage] = useState<string>('');
  const [isUploadingOfferImg, setIsUploadingOfferImg] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const { showAlert, showConfirm } = useAlert();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const offerImageInputRef = useRef<HTMLInputElement>(null);

  const displayAttractions = ownerMode
    ? (attractions || [])
    : role === 'OWNER'
    ? (attractions || []).filter(item => item.ownerId === user?.id)
    : (attractions || []);

  const filtered = displayAttractions.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item?: any) => {
    if (item) {
      const hoursParts = item.metadata?.hours ? item.metadata.hours.split(' - ') : [];
      setFormData({
        recordId: item.id,
        name: item.name || '',
        location: item.location || '',
        description: item.description || '',
        pricingType: item.isFreeAdmission ? 'Free' : 'Offers',
        openingTime: item.openingTime || hoursParts[0] || '',
        closingTime: item.closingTime || hoursParts[1] || '',
        contactInfo: item.contactInfo || item.metadata?.contact || '',
        website: item.metadata?.website || '',
        categories: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : []),
        tags: item.tags || [],
        coordinates: (item.lat && item.lng) ? { lat: item.lat, lng: item.lng } : (item.coordinates || null),
      });
      setPhotos(item.photos && item.photos.length > 0 ? item.photos : [item.img].filter(Boolean));
      setVideoUrl(item.videoUrl || '');
      setOffers(item.offers || []);
    } else {
      setFormData({ name: '', location: '', description: '', categories: [], tags: [], pricingType: 'Offers', openingTime: '', closingTime: '', contactInfo: '', website: '', coordinates: null });
      setPhotos([]);
      setVideoUrl('');
      setOffers([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (isUploadingPhotos || isUploadingVideo || isUploadingOfferImg) return showAlert("Wait", "Please wait for files to finish uploading.", "error");
    if (photos.length < 1) return showAlert("Validation Error", "Please upload at least 1 photo for the thumbnail.", "error");
    if (photos.length > 5) return showAlert("Validation Error", "Maximum 5 photos allowed.", "error");
    if (!formData.name?.trim()) return showAlert("Validation Error", "Please enter an attraction name.", "error");
    if (!formData.location?.trim()) return showAlert("Validation Error", "Please enter an address.", "error");
    if (!formData.description?.trim()) return showAlert("Validation Error", "Please enter a description.", "error");
    if (!formData.categories?.length) return showAlert("Validation Error", "Please select at least 1 category.", "error");
    if (!formData.coordinates?.lat) return showAlert("Validation Error", "Please pinpoint the location on the map on the right side.", "error");

    const isFree = formData.pricingType === 'Free';
    const dataToSave = {
      ...formData,
      img: photos[0] || '',
      photos: photos,
      videoUrl: videoUrl,
      isFreeAdmission: isFree,
      offers: isFree ? [] : offers,
      metadata: { entranceFee: isFree ? 'Free Admission' : 'See Offers', hours: `${formData.openingTime} - ${formData.closingTime}`, contact: formData.contactInfo, website: formData.website },
    };
    const cleanData = JSON.parse(JSON.stringify(dataToSave));

    setIsSubmitting(true);
    try {
      if (formData.recordId) {
        await dbService.update('attractions', formData.recordId, cleanData);
      } else {
        cleanData.ownerId = user?.id;
        cleanData.ownerName = user?.name;
        cleanData.ownerRole = user?.role;
        cleanData.ownerAvatar = user?.avatar;
        await dbService.add('attractions', cleanData);
      }
      setIsModalOpen(false);
      showAlert("Success", "Attraction saved successfully!", "success");
      onDataChange?.();
    } catch (err: any) {
      console.error(err);
      showAlert("Error", `Failed to save attraction: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm("Delete Attraction", "Are you sure you want to delete this attraction? This action cannot be undone.", async () => {
      try {
        await dbService.delete('attractions', id);
        showAlert("Success", "Attraction deleted.", "success");
        onDataChange?.();
      } catch (err) {
        showAlert("Error", "Failed to delete attraction.", "error");
      }
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (valid.length > 0) {
      setIsUploadingPhotos(true);
      try {
        for (const file of valid) {
          const compressedFile = await compressImage(file as File);
          const url = await uploadFile(compressedFile, `attractions/photos/${Date.now()}_${compressedFile.name}`);
          setPhotos(prev => { if (prev.length >= 5) return prev; return [...prev, url]; });
        }
      } catch (e: any) {
        showAlert("Upload Error", `Failed to upload photos: ${e.message}`, "error");
      } finally {
        setIsUploadingPhotos(false);
      }
    }
  };

  const processVideo = async (files: FileList | File[]) => {
    const file = Array.from(files).find(f => f.type.startsWith('video/'));
    if (file) {
      setIsUploadingVideo(true);
      try {
        const url = await uploadFile(file, `attractions/videos/${Date.now()}_${file.name}`);
        setVideoUrl(url);
      } catch (e: any) {
        showAlert("Upload Error", `Failed to upload video: ${e.message}`, "error");
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  const processOfferImage = async (files: FileList | File[]) => {
    const file = Array.from(files).find(f => f.type.startsWith('image/'));
    if (file) {
      setIsUploadingOfferImg(true);
      try {
        const url = await uploadFile(file, `offers/${Date.now()}_${file.name}`);
        setNewOfferImage(url);
      } catch (e) {
        showAlert("Upload Error", "Failed to upload offer image", "error");
      } finally {
        setIsUploadingOfferImg(false);
      }
    }
  };

  const addCategory = (cat: string) => {
    if (!cat) return;
    setFormData((prev: any) => {
      let newCats = [...(prev.categories || [])];
      if (!newCats.includes(cat)) { newCats.push(cat); if (newCats.length > 3) newCats.shift(); }
      return { ...prev, categories: newCats };
    });
  };

  const removeCategory = (cat: string) => {
    setFormData((prev: any) => ({ ...prev, categories: prev.categories.filter((c: string) => c !== cat) }));
  };

  const addTag = (tag: string) => {
    if (!tag) return;
    const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
    setFormData((prev: any) => {
      let newTags = [...(prev.tags || [])];
      if (!newTags.includes(cleanTag)) newTags.push(cleanTag);
      return { ...prev, tags: newTags };
    });
  };

  const removeTag = (tag: string) => {
    setFormData((prev: any) => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tag) }));
  };

  return (
    <ManagerContainer initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <HeaderRow>
        <h2>Manage Attractions</h2>
        <div className="actions">
          <AdminSearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search attractions..." style={{ minWidth: '250px' }} />
          {(role !== 'OWNER' || ownerMode) && (
            <button className="add-btn" onClick={() => handleOpenModal()}><Plus size={18} /> Add New</button>
          )}
        </div>
      </HeaderRow>

      <Table>
        <thead>
          <tr><th>Name</th><th>Location</th><th>Categories</th><th>Author</th><th style={{ width: 100 }}>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: 700 }}>{item.name}</td>
              <td><MapPin size={14} style={{ display: 'inline', marginRight: 4, opacity: 0.5 }} />{item.location}</td>
              <td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(Array.isArray(item.categories) ? item.categories : [item.categories]).map(c =>
                    c && <span key={`${item.id}-${c}`} style={{ background: '#eff6ff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 800 }}>{c}</span>
                  )}
                </div>
              </td>
              <td style={{ position: 'relative' }}>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 2, cursor: 'help', position: 'relative' }}
                  onMouseEnter={(e) => { const t = e.currentTarget.nextElementSibling as HTMLElement; if (t) { t.style.opacity = '1'; t.style.visibility = 'visible'; t.style.transform = 'translateX(-50%) translateY(0)'; } }}
                  onMouseLeave={(e) => { const t = e.currentTarget.nextElementSibling as HTMLElement; if (t) { t.style.opacity = '0'; t.style.visibility = 'hidden'; t.style.transform = 'translateX(-50%) translateY(-10px)'; } }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.ownerName || item.owner?.name || (item.ownerId ? `User #${item.ownerId}` : 'Admin')}</span>
                </div>
                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%) translateY(-10px)', background: 'var(--surface-bg)', padding: '16px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 100, minWidth: '220px', border: '1px solid rgba(148,163,184,0.2)', opacity: 0, visibility: 'hidden', transition: 'all 0.2s', pointerEvents: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={item.ownerAvatar || item.owner?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.ownerName || item.owner?.name || 'Admin')}`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '0.95rem' }}>{item.ownerName || item.owner?.name || 'Admin'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase' }}>{item.ownerRole || (item.ownerId ? 'Owner' : 'System Admin')}</div>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div className="row-actions">
                  <button onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                  {(role !== 'OWNER' || ownerMode) && (
                    <button className="delete" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(!attractions || attractions.length === 0) && (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>No attractions found.</td></tr>
          )}
        </tbody>
      </Table>

      <AnimatePresence>
        {isModalOpen && (
          <FormModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
            <FormModalContent initial={{ scale: 0.96, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 24 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }}>

              {/* Header */}
              <ModalHeader>
                <div className="header-left">
                  <div className="icon-box"><MapPin size={20} /></div>
                  <div>
                    <h3>{formData.recordId ? 'Edit Attraction' : 'New Attraction'}</h3>
                    <div className="subtitle">Fill in the details • Preview updates live on the right</div>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
              </ModalHeader>

              <ThreeColumnLayout>
                {/* ── Left: Form ─────────────────────────────────────── */}
                <FormPane>

                  {/* Section 1: Basic Info */}
                  <FormSection $index={0}>
                    <SectionLabel>
                      <div className="num">1</div>
                      <span className="title">Basic Information</span>
                    </SectionLabel>
                    <FieldGroup>
                      <FieldLabel>Attraction Name *</FieldLabel>
                      <StyledInput required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Dancalan Beach" />
                    </FieldGroup>
                    <FieldGroup>
                      <FieldLabel>Full Address *</FieldLabel>
                      <StyledInput required value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Brgy. Dancalan, Bulusan, Sorsogon" />
                    </FieldGroup>
                    <FieldGroup style={{ marginBottom: 0 }}>
                      <FieldLabel>Description *</FieldLabel>
                      <StyledTextarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Describe what makes this place special..." />
                    </FieldGroup>
                  </FormSection>

                  {/* Section 2: Categories & Tags */}
                  <FormSection $index={1}>
                    <SectionLabel>
                      <div className="num">2</div>
                      <span className="title">Categories & Tags</span>
                      <span className="hint">Max 3 categories</span>
                    </SectionLabel>
                    <FieldGroup>
                      <FieldLabel>Categories *</FieldLabel>
                      <CategoryGrid>
                        {(isCategoriesExpanded ? ATTRACTION_CATEGORIES : ATTRACTION_CATEGORIES.slice(0, 6)).map(cat => {
                          const isActive = (formData.categories || []).includes(cat.label);
                          return (
                            <CategoryPill type="button" key={cat.label} $active={isActive}
                              onClick={() => isActive ? removeCategory(cat.label) : addCategory(cat.label)}>
                              <img loading="lazy" src={getMapIconUrl(cat.label)} alt="" />
                              {cat.label}
                              {isActive && <Check size={12} />}
                            </CategoryPill>
                          );
                        })}
                      </CategoryGrid>
                      <ShowMoreBtn type="button" className={isCategoriesExpanded ? 'expanded' : ''} onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}>
                        {isCategoriesExpanded ? 'Show Less' : `Show All (${ATTRACTION_CATEGORIES.length})`}
                        <ChevronDown size={14} />
                      </ShowMoreBtn>
                    </FieldGroup>

                    <FieldGroup style={{ marginBottom: 0 }}>
                      <FieldLabel>Tags (Optional)</FieldLabel>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <SmallInput style={{ flex: 1 }} placeholder="Custom tag..." value={customTag} onChange={e => setCustomTag(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (customTag) { addTag(customTag); setCustomTag(''); } } }} />
                        <AddOfferBtn type="button" onClick={() => { if (customTag) { addTag(customTag); setCustomTag(''); } }}>Add</AddOfferBtn>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(isTagsExpanded ? ATTRACTION_TAGS : ATTRACTION_TAGS.slice(0, 10)).map(tag => {
                          const isActive = (formData.tags || []).includes(tag);
                          return (
                            <TagPill type="button" key={tag} $active={isActive}
                              onClick={() => isActive ? removeTag(tag) : addTag(tag)}>
                              #{tag}
                            </TagPill>
                          );
                        })}
                        {(formData.tags || []).filter((t: string) => !ATTRACTION_TAGS.includes(t)).map((tag: string) => (
                          <TagPill type="button" key={`c-${tag}`} $active={true} onClick={() => removeTag(tag)}>
                            #{tag} <X size={10} style={{ marginLeft: 3 }} />
                          </TagPill>
                        ))}
                      </div>
                      <ShowMoreBtn type="button" className={isTagsExpanded ? 'expanded' : ''} onClick={() => setIsTagsExpanded(!isTagsExpanded)}>
                        {isTagsExpanded ? 'Show Less' : `Show All Tags`} <ChevronDown size={14} />
                      </ShowMoreBtn>
                    </FieldGroup>
                  </FormSection>

                  {/* Section 3: Admission */}
                  <FormSection $index={2}>
                    <SectionLabel>
                      <div className="num">3</div>
                      <span className="title">Admission & Pricing</span>
                    </SectionLabel>
                    <AdmissionToggle>
                      <AdmissionOption type="button" $active={formData.pricingType === 'Free'}
                        onClick={() => setFormData({ ...formData, pricingType: 'Free' })}>
                        <div className="icon"><Ticket size={18} /></div>
                        <div className="label">Free Entry</div>
                        <div className="sub">No charge to visit</div>
                      </AdmissionOption>
                      <AdmissionOption type="button" $active={formData.pricingType === 'Offers'}
                        onClick={() => setFormData({ ...formData, pricingType: 'Offers' })}>
                        <div className="icon"><DollarSign size={18} /></div>
                        <div className="label">Paid Offers</div>
                        <div className="sub">Fixed prices per type</div>
                      </AdmissionOption>
                    </AdmissionToggle>

                    {formData.pricingType === 'Offers' && (
                      <OffersBuilder>
                        <FieldLabel style={{ marginBottom: 10 }}>Add Ticket / Offer</FieldLabel>
                        <OfferInputRow>
                          <SmallInput style={{ flex: '1 1 100%' }} placeholder="e.g. Adult Entrance" value={newOfferName} onChange={e => setNewOfferName(e.target.value)} />
                          <SmallInput style={{ flex: 1, minWidth: '80px' }} placeholder="PHP" type="number" value={newOfferPrice} onChange={e => setNewOfferPrice(e.target.value)} />
                          <div style={{ position: 'relative', flex: '0 0 auto' }}>
                            <input type="file" accept="image/*" ref={offerImageInputRef} style={{ display: 'none' }} onChange={e => e.target.files && processOfferImage(e.target.files)} />
                            <AddOfferBtn type="button" onClick={() => offerImageInputRef.current?.click()} style={{ background: newOfferImage ? '#10b981' : 'rgba(148,163,184,0.2)', color: newOfferImage ? 'white' : 'var(--text-dark)', fontSize: '0.75rem', padding: '10px 12px' }}>
                              <ImageIcon size={14} />
                              {isUploadingOfferImg ? '...' : newOfferImage ? '✓' : 'Pic'}
                            </AddOfferBtn>
                          </div>
                          <AddOfferBtn type="button" style={{ flex: '0 0 auto' }}
                            onClick={() => {
                              if (newOfferName && newOfferPrice) {
                                setOffers([...offers, { id: Date.now().toString(), name: newOfferName, price: newOfferPrice, image: newOfferImage }]);
                                setNewOfferName(''); setNewOfferPrice(''); setNewOfferImage('');
                              }
                            }}>
                            + Add
                          </AddOfferBtn>
                        </OfferInputRow>
                        {offers.map(o => (
                          <OfferItem key={o.id}>
                            {o.image
                              ? <img src={getMediaUrl(o.image)} alt={o.name} />
                              : <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(148,163,184,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ticket size={14} color="var(--text-light)" /></div>
                            }
                            <span className="name">{o.name}</span>
                            <span className="price">₱{o.price}</span>
                            <button className="del" type="button" onClick={() => setOffers(offers.filter(x => x.id !== o.id))}><X size={12} /></button>
                          </OfferItem>
                        ))}
                        {offers.length === 0 && (
                          <div style={{ textAlign: 'center', padding: '16px', fontSize: '0.8rem', color: 'var(--text-light)' }}>No offers added yet</div>
                        )}
                      </OffersBuilder>
                    )}
                  </FormSection>

                  {/* Section 4: Hours & Contact */}
                  <FormSection $index={3}>
                    <SectionLabel>
                      <div className="num">4</div>
                      <span className="title">Hours & Contact</span>
                    </SectionLabel>
                    <TwoCol style={{ marginBottom: 12 }}>
                      <FieldGroup style={{ marginBottom: 0 }}>
                        <FieldLabel>Opening Time *</FieldLabel>
                        <StyledInput type="time" required value={formData.openingTime || ''} onChange={e => setFormData({ ...formData, openingTime: e.target.value })} />
                      </FieldGroup>
                      <FieldGroup style={{ marginBottom: 0 }}>
                        <FieldLabel>Closing Time *</FieldLabel>
                        <StyledInput type="time" required value={formData.closingTime || ''} onChange={e => setFormData({ ...formData, closingTime: e.target.value })} />
                      </FieldGroup>
                    </TwoCol>
                    <TwoCol>
                      <FieldGroup style={{ marginBottom: 0 }}>
                        <FieldLabel>Contact Number *</FieldLabel>
                        <StyledInput required value={formData.contactInfo || ''} onChange={e => setFormData({ ...formData, contactInfo: e.target.value })} placeholder="+639..." />
                      </FieldGroup>
                      <FieldGroup style={{ marginBottom: 0 }}>
                        <FieldLabel>Website (Optional)</FieldLabel>
                        <StyledInput type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." />
                      </FieldGroup>
                    </TwoCol>
                  </FormSection>

                  {/* Section 5: Photos */}
                  <FormSection $index={4}>
                    <SectionLabel>
                      <div className="num">5</div>
                      <span className="title">Photos</span>
                      <span className="hint">Min 1 • Max 5</span>
                    </SectionLabel>
                    <DropZone
                      $isDragActive={dragActive}
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); setDragActive(false); processFiles(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={32} strokeWidth={1.5} />
                      <div className="dz-title">{isUploadingPhotos ? 'Uploading...' : 'Drop photos here or click to browse'}</div>
                      <div className="dz-sub">First uploaded photo = thumbnail · JPG/PNG/WEBP</div>
                      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={e => e.target.files && processFiles(e.target.files)} />
                    </DropZone>
                    {photos.length > 0 && (
                      <PhotoGrid>
                        {photos.map((p, i) => (
                          <PhotoThumb key={i}>
                            {i === 0 && <div className="thumb-badge">Thumbnail</div>}
                            <img loading="lazy" src={getMediaUrl(p)} alt={`Photo ${i + 1}`} />
                            <button className="del-btn" type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}><X size={12} /></button>
                          </PhotoThumb>
                        ))}
                      </PhotoGrid>
                    )}
                  </FormSection>

                  {/* Section 6: Video */}
                  <FormSection $index={5}>
                    <SectionLabel>
                      <div className="num">6</div>
                      <span className="title">Promo Video</span>
                      <span className="hint">Optional</span>
                    </SectionLabel>
                    {!videoUrl ? (
                      <DropZone
                        $isDragActive={videoDragActive}
                        onDragEnter={() => setVideoDragActive(true)}
                        onDragLeave={() => setVideoDragActive(false)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); setVideoDragActive(false); processVideo(e.dataTransfer.files); }}
                        onClick={() => videoInputRef.current?.click()}
                      >
                        <Film size={32} strokeWidth={1.5} />
                        <div className="dz-title">{isUploadingVideo ? 'Uploading video...' : 'Drop promo video here'}</div>
                        <div className="dz-sub">MP4 or WEBM format</div>
                        <input type="file" accept="video/mp4,video/webm" ref={videoInputRef} onChange={e => e.target.files && processVideo(e.target.files)} />
                      </DropZone>
                    ) : (
                      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)' }}>
                        <video src={getMediaUrl(videoUrl)} style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} autoPlay muted loop />
                        <button type="button" onClick={() => setVideoUrl('')}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <X size={12} /> Remove
                        </button>
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 6 }}>Promo Video</div>
                      </div>
                    )}
                  </FormSection>

                  {/* Save Button */}
                  <SaveBtn onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><span>Saving...</span></>
                    ) : (
                      <><Check size={20} /> {formData.recordId ? 'Save Changes' : 'Publish Attraction'}</>
                    )}
                  </SaveBtn>
                </FormPane>

                {/* ── Middle: Live Preview ────────────────────────────── */}
                <PreviewPane>
                  <LivePreview formData={formData} photos={photos} offers={offers} />
                </PreviewPane>

                {/* ── Right: Map ─────────────────────────────────────── */}
                <MapPane>
                  <MapHeader>
                    <div className="map-title"><Map size={16} color="var(--cta-blue)" /> Pinpoint Location *</div>
                    <div className="map-sub">Click on the map to drop a pin</div>
                  </MapHeader>
                  <MapContainer>
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.85rem' }}>Loading map...</div>}>
                      <MapPicker
                        value={formData.coordinates}
                        onChange={(c: any) => setFormData({ ...formData, coordinates: c })}
                      />
                    </Suspense>
                  </MapContainer>
                  {formData.coordinates?.lat && (
                    <CoordBadge>
                      <Check size={14} />
                      {formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)}
                    </CoordBadge>
                  )}
                </MapPane>
              </ThreeColumnLayout>

            </FormModalContent>
          </FormModalOverlay>
        )}
      </AnimatePresence>
    </ManagerContainer>
  );
}
