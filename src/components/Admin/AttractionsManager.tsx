import React, { useState, lazy, Suspense, useRef } from 'react';
import styled from 'styled-components';
import { MapPin, Search, Edit2, Trash2, Plus, X, UploadCloud, Map, Film, Image as ImageIcon, Video } from 'lucide-react';
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

const ManagerContainer = styled(motion.div)`
  background: var(--surface-bg); border-radius: 20px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;

const HeaderRow = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;
  h2 { font-size: 1.5rem; color: ${(props) => props.theme.colors.darkBlue}; }
  .actions { display: flex; gap: 16px; align-items: center; }
  button.add-btn { background: ${(props) => props.theme.colors.ctaBlue}; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: background 0.2s; white-space: nowrap; &:hover { background: ${(props) => props.theme.colors.primaryBlue}; } }
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse;
  th, td { padding: 16px; text-align: left; border-bottom: 1px solid rgba(148, 163, 184, 0.1); }
  th { font-weight: 600; color: var(--text-light); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
  td { color: var(--text-dark); }
  .row-actions { display: flex; gap: 8px; button { background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px; border-radius: 6px; cursor: pointer; color: var(--text-light); &:hover { color: ${(props) => props.theme.colors.ctaBlue}; background: var(--surface-bg); } &.delete:hover { color: #ef4444; } } }
`;

const FormModalOverlay = styled(motion.div)`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px;
`;

const FormModalContent = styled(motion.div)`
  background: var(--surface-bg); width: 95%; max-width: 1200px; height: 90vh; border-radius: 24px; position: relative; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
`;

const ModalHeader = styled.div`
  padding: 32px 48px; border-bottom: 1px solid rgba(148, 163, 184, 0.1); display: flex; justify-content: space-between; align-items: center;
  h3 { font-family: ${(props) => props.theme.fonts.heading}; font-size: 2.2rem; color: ${(props) => props.theme.colors.darkBlue}; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
  button { background: rgba(148, 163, 184, 0.05); border: none; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-light); transition: all 0.2s; &:hover { background: #fee2e2; color: #ef4444; } }
`;

const SplitLayout = styled.div` display: flex; flex: 1; overflow: hidden; @media (max-width: 1024px) { flex-direction: column; overflow-y: auto; } `;

const LeftPane = styled.div`
  flex: 1.3; padding: 40px 48px; overflow-y: auto; border-right: 1px solid rgba(148, 163, 184, 0.1);
  &::-webkit-scrollbar { width: 6px; } &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
`;

const RightPane = styled.div`
  flex: 1; padding: 40px; display: flex; flex-direction: column; background: var(--light-bg); overflow-y: auto;
  .map-container { flex: 1; background: var(--surface-bg); border-radius: 20px; border: 1px solid rgba(148, 163, 184, 0.2); margin-top: 16px; margin-bottom: 24px; min-height: 500px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;
  label { font-weight: 800; font-size: 0.9rem; color: var(--text-dark); display:flex; align-items: center; gap: 6px; }
  input, textarea, select { padding: 16px 20px; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 16px; font-size: 1rem; background: var(--surface-bg); color: var(--text-dark); outline: none; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02); &:focus { border-color: var(--cta-blue); box-shadow: 0 0 0 4px rgba(46, 117, 182, 0.1); } }
  textarea { resize: vertical; min-height: 120px; }
`;

const DropZone = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${p => p.$isDragActive ? 'var(--cta-blue)' : 'rgba(148, 163, 184, 0.3)'}; 
  background: ${p => p.$isDragActive ? 'rgba(46, 117, 182, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border-radius: 16px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-dark); margin-bottom: 20px;
  &:hover { border-color: var(--cta-blue); background: rgba(255, 255, 255, 0.05); }
  input[type="file"] { display: none; }
`;

const PreviewGrid = styled.div` display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-top: 16px; margin-bottom: 24px; `;
const PreviewItem = styled.div`
  position: relative; width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background: #000;
  img, video { width: 100%; height: 100%; object-fit: cover; }
  .badge { position: absolute; top: 4px; left: 4px; background: rgba(0,0,0,0.6); color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 8px; font-weight: bold; z-index: 10;}
  button { position: absolute; top: 4px; right: 4px; background: rgba(239, 68, 68, 0.9); color: white; border: none; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 14px;}
`;

const SubmitBtn = styled.button`
  background: var(--cta-blue); color: white; width: 100%; padding: 20px; border-radius: 16px; font-size: 1.2rem; font-weight: 900; border: none; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 10px 20px rgba(46,117,182,0.25); margin-top: 32px;
  &:hover { background: var(--primary-blue); transform: translateY(-3px); box-shadow: 0 15px 30px rgba(46,117,182,0.35); }
  &:active { transform: translateY(-1px); }
`;

export default function AttractionsManager({ attractions, ownerMode, onDataChange }: { attractions?: any[]; ownerMode?: boolean; onDataChange?: () => void }) {
  const { role, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  
  const [offers, setOffers] = useState<any[]>([]);
  const [newOfferName, setNewOfferName] = useState('');
  const [newOfferPrice, setNewOfferPrice] = useState('');
  const [newOfferImage, setNewOfferImage] = useState<string>('');
  const [isUploadingOfferImg, setIsUploadingOfferImg] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [customTag, setCustomTag] = useState('');

  const { showAlert, showConfirm } = useAlert();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const offerImageInputRef = useRef<HTMLInputElement>(null);

  // In ownerMode, data is already filtered by server; otherwise filter by owner locally for admin view
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
      setFormData({
        recordId: item.id,
        name: item.name || '',
        location: item.location || '',
        description: item.description || '',
        pricingType: item.isFreeAdmission ? 'Free' : 'Offers',
        openingTime: item.openingTime || '',
        closingTime: item.closingTime || '',
        contactInfo: item.contactInfo || item.metadata?.contact || '',
        website: item.metadata?.website || '',
        categories: Array.isArray(item.categories) ? item.categories : (item.categories ? [item.categories] : []),
        tags: item.tags || [],
        coordinates: item.coordinates || null,
      });
      setPhotos(item.photos || [item.img].filter(Boolean));
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
    if (isUploadingPhotos || isUploadingVideo || isUploadingOfferImg) return showAlert("Wait", "Please wait for files to finish uploading.", "error");
    if (photos.length < 1) return showAlert("Validation Error", "Please upload at least 1 photo for the thumbnail.", "error");
    if (photos.length > 5) return showAlert("Validation Error", "Maximum 5 photos allowed.", "error");
    if (!formData.coordinates?.lat) return showAlert("Validation Error", "Please pinpoint the location on the map.", "error");

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

    try {
      if (formData.recordId) {
        await dbService.update('attractions', formData.recordId, cleanData);
      } else {
        await dbService.add('attractions', cleanData);
      }
      setIsModalOpen(false);
      showAlert("Success", "Attraction saved successfully!", "success");
      onDataChange?.();
    } catch (err: any) { console.error(err); showAlert("Error", `Failed to save attraction: ${err.message}`, "error"); }
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
          setPhotos(prev => {
            if (prev.length >= 5) return prev;
            return [...prev, url];
          });
        }
      } catch (e: any) {
        console.error(e);
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
          } catch(e: any) {
              console.error(e);
              showAlert("Upload Error", `Failed to upload video: ${e.message}`, "error");
          } finally {
              setIsUploadingVideo(false);
          }
      }
  }

  const processOfferImage = async (files: FileList | File[]) => {
      const file = Array.from(files).find(f => f.type.startsWith('image/'));
      if (file) {
          setIsUploadingOfferImg(true);
          try {
              const url = await uploadFile(file, `offers/${Date.now()}_${file.name}`);
              setNewOfferImage(url);
          } catch(e) {
              showAlert("Upload Error", "Failed to upload offer image", "error");
          } finally {
              setIsUploadingOfferImg(false);
          }
      }
  }

  const addCategory = (cat: string) => {
    if (!cat) return;
    setFormData((prev: any) => {
      let newCats = [...(prev.categories || [])];
      if (!newCats.includes(cat)) {
        newCats.push(cat);
        if (newCats.length > 3) newCats.shift();
      }
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
          <tr><th>Name</th><th>Location</th><th>Categories</th><th style={{ width: 100 }}>Actions</th></tr>
        </thead>
        <tbody>
          {filtered.map((item) => (
            <tr key={item.id}>
              <td style={{ fontWeight: 600 }}>{item.name}</td>
              <td><MapPin size={14} style={{ display: 'inline', marginRight: 4, opacity: 0.5 }}/> {item.location}</td>
              <td>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(Array.isArray(item.categories) ? item.categories : [item.categories]).map(c => (
                    c && <span key={`${item.id}-${c}`} style={{ background: '#f0f4f8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 700 }}>{c}</span>
                  ))}
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
            <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px' }}>No attractions found.</td></tr>
          )}
        </tbody>
      </Table>

      <AnimatePresence>
        {isModalOpen && (
          <FormModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FormModalContent initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <ModalHeader>
                <h3>{formData.recordId ? 'Edit' : 'Add New'} Attraction</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
              </ModalHeader>
              
              <SplitLayout>
                <LeftPane>
                  <FormGroup>
                    <label>Name *</label>
                    <input required value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dancalan Beach" />
                  </FormGroup>

                  <FormGroup>
                    <label style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>Category (Max 3) *</span>
                        <button type="button" onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)} style={{ background:'none', border:'none', color:'var(--cta-blue)', cursor:'pointer', fontSize:'0.85rem', fontWeight:'bold' }}>
                            {isCategoriesExpanded ? 'Hide' : 'Show All'}
                        </button>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {(isCategoriesExpanded ? ATTRACTION_CATEGORIES : ATTRACTION_CATEGORIES.slice(0, 5)).map(cat => {
                         const isActive = (formData.categories || []).includes(cat.label);
                         return (
                            <button type="button" key={cat.label} onClick={() => isActive ? removeCategory(cat.label) : addCategory(cat.label)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isActive ? 'var(--cta-blue)' : 'var(--surface-bg)', color: isActive ? 'white' : 'var(--text-dark)', padding: '10px 18px', borderRadius: '30px', border: isActive ? '1px solid var(--cta-blue)' : '1px solid rgba(148, 163, 184, 0.2)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isActive ? '0 4px 12px rgba(46,117,182,0.2)' : 'none' }}>
                              <img src={getMapIconUrl(cat.label)} alt="" style={{ height: 20, filter: isActive ? 'brightness(0) invert(1)' : 'none' }} />
                              {cat.label}
                            </button>
                         )
                      })}
                    </div>
                  </FormGroup>

                  <FormGroup>
                    <label>Address *</label>
                    <input required value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Full Address" />
                  </FormGroup>

                  <FormGroup style={{ marginBottom: '32px' }}>
                    <label>Description *</label>
                    <textarea required value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Provide a rich description..." />
                  </FormGroup>

                  {/* Pricing / Offers Section */}
                  <div style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(148, 163, 184, 0.1)', marginBottom: '32px' }}>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label>Admission Options *</label>
                      <select required value={formData.pricingType || 'Offers'} onChange={e => setFormData({ ...formData, pricingType: e.target.value })}>
                        <option value="Free">Free Admission</option>
                        <option value="Offers">Offers (Fixed Prices)</option>
                      </select>
                    </FormGroup>

                    {formData.pricingType === 'Offers' && (
                      <div style={{ marginTop: '20px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-light)', marginBottom: '12px', display: 'block' }}>Offers Builder</label>
                        
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <input placeholder="Offer Name (e.g. Adult Entrance)" value={newOfferName} onChange={e => setNewOfferName(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'var(--surface-bg)', color: 'var(--text-dark)' }} />
                          <input placeholder="Price" type="number" value={newOfferPrice} onChange={e => setNewOfferPrice(e.target.value)} style={{ width: '120px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.2)', background: 'var(--surface-bg)', color: 'var(--text-dark)' }} />
                          
                          <div style={{ position: 'relative' }}>
                              <input type="file" accept="image/*" ref={offerImageInputRef} style={{ display: 'none' }} onChange={e => e.target.files && processOfferImage(e.target.files)} />
                              <button type="button" onClick={() => offerImageInputRef.current?.click()} style={{ background: newOfferImage ? 'rgba(34, 197, 94, 0.1)' : 'var(--surface-bg)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'var(--text-dark)', padding: '12px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <ImageIcon size={16} /> {isUploadingOfferImg ? '...' : newOfferImage ? 'Uploaded' : 'Pic (Opt)'}
                              </button>
                              {newOfferImage && (
                                  <button type="button" onClick={() => setNewOfferImage('')} style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer' }}>×</button>
                              )}
                          </div>

                          <button type="button" onClick={() => { if(newOfferName && newOfferPrice) { setOffers([...offers, { id: Date.now().toString(), name: newOfferName, price: newOfferPrice, image: newOfferImage }]); setNewOfferName(''); setNewOfferPrice(''); setNewOfferImage(''); } }} style={{ background: 'var(--cta-blue)', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer' }}>Add</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {offers.map((o) => (
                             <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-bg)', padding: '12px 16px', borderRadius: '14px', border: '1px solid rgba(148, 163, 184, 0.1)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                   {o.image ? <img src={getMediaUrl(o.image)} alt={o.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(148, 163, 184, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon size={16} color="var(--text-light)" /></div>}
                                   <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{o.name}</span>
                               </div>
                               <span style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--cta-blue)', fontWeight: 900 }}>PHP {o.price} <button type="button" onClick={() => setOffers(offers.filter(x => x.id !== o.id))} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14}/></button></span>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label style={{ color: 'var(--text-dark)' }}>Opening Time *</label>
                      <input type="time" required value={formData.openingTime || ''} onChange={e => setFormData({ ...formData, openingTime: e.target.value })} />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label style={{ color: 'var(--text-dark)' }}>Closing Time *</label>
                      <input type="time" required value={formData.closingTime || ''} onChange={e => setFormData({ ...formData, closingTime: e.target.value })} />
                    </FormGroup>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label style={{ color: 'var(--text-dark)' }}>Contact Number *</label>
                      <input required value={formData.contactInfo || ''} onChange={e => setFormData({ ...formData, contactInfo: e.target.value })} placeholder="e.g. +639123456789" />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: 0 }}>
                      <label style={{ color: 'var(--text-dark)' }}>Website URL (Optional)</label>
                      <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://example.com" />
                    </FormGroup>
                  </div>

                  <FormGroup style={{ marginBottom: '40px' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-dark)' }}>
                        <span>Tags</span>
                        <button type="button" onClick={() => setIsTagsExpanded(!isTagsExpanded)} style={{ background:'none', border:'none', color:'var(--cta-blue)', cursor:'pointer', fontSize:'0.85rem', fontWeight:'bold' }}>
                            {isTagsExpanded ? 'Hide' : 'Show All'}
                        </button>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
                        <input placeholder="Add custom tag (e.g. Swimming)" value={customTag} onChange={e => setCustomTag(e.target.value)} style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                        <button type="button" onClick={() => { if(customTag) { addTag(customTag); setCustomTag(''); } }} style={{ background: 'var(--cta-blue)', color: 'white', border: 'none', borderRadius: '12px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }}>Add Tag</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {(isTagsExpanded ? ATTRACTION_TAGS : ATTRACTION_TAGS.slice(0, 8)).map(tag => {
                         const isActive = (formData.tags || []).includes(tag);
                         return (
                            <button type="button" key={tag} onClick={() => isActive ? removeTag(tag) : addTag(tag)} style={{ background: isActive ? 'rgba(46, 117, 182, 0.1)' : 'var(--surface-bg)', color: isActive ? 'var(--cta-blue)' : 'var(--text-light)', padding: '8px 16px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, border: isActive ? '1px solid var(--cta-blue)' : '1px solid rgba(148, 163, 184, 0.2)', cursor: 'pointer', transition: 'all 0.2s' }}>
                              #{tag}
                            </button>
                         )
                      })}
                      {/* Show custom tags that are not in the predefined list */}
                      {(formData.tags || []).filter((t: string) => !ATTRACTION_TAGS.includes(t)).map((tag: string) => (
                           <button type="button" key={`custom-${tag}`} onClick={() => removeTag(tag)} style={{ background: '#f0f7ff', color: 'var(--cta-blue)', padding: '8px 16px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--cta-blue)', cursor: 'pointer' }}>
                              #{tag} <X size={12} style={{ display: 'inline', marginLeft: 4 }}/>
                           </button>
                      ))}
                    </div>
                  </FormGroup>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                    <label style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <ImageIcon size={18} color="var(--text-dark)" /> Photos (Min 1, Max 5) *
                    </label>
                    <DropZone 
                      $isDragActive={dragActive}
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); setDragActive(false); processFiles(e.dataTransfer.files); }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={40} color="var(--text-dark)" strokeWidth={1.5} />
                      <div style={{ fontSize: '1.1rem' }}><strong>{isUploadingPhotos ? 'Uploading...' : 'Drop images here'}</strong> or click to browse</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>First image uploaded will be the thumbnail</div>
                      <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={e => e.target.files && processFiles(e.target.files)} />
                    </DropZone>
                    
                    {photos.length > 0 && (
                      <PreviewGrid>
                        {photos.map((p, i) => (
                          <PreviewItem key={i}>
                            {i === 0 && <div className="badge">Thumbnail</div>}
                            <img src={getMediaUrl(p)} alt={`Preview ${i}`} />
                            <button type="button" onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}><X size={14}/></button>
                          </PreviewItem>
                        ))}
                      </PreviewGrid>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '32px', paddingBottom: '40px' }}>
                      <label style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Film size={18} color="var(--text-dark)" /> Promo Video (Optional)
                     </label>
                     <DropZone 
                      $isDragActive={dragActive}
                      onDragEnter={() => setDragActive(true)}
                      onDragLeave={() => setDragActive(false)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); setDragActive(false); processVideo(e.dataTransfer.files); }}
                      onClick={() => videoInputRef.current?.click()}
                    >
                      <Film size={40} color="var(--text-dark)" strokeWidth={1.5} />
                      <div style={{ fontSize: '1.1rem' }}><strong>{isUploadingVideo ? 'Uploading Video (This may take a few minutes)...' : 'Drop video here'}</strong> or click to browse</div>
                      <input type="file" accept="video/mp4,video/webm" ref={videoInputRef} onChange={e => e.target.files && processVideo(e.target.files)} />
                    </DropZone>
                    {videoUrl && (
                        <PreviewItem style={{ width: '200px', height: '150px', marginTop: '16px' }}>
                            <div className="badge" style={{ background: 'var(--cta-blue)'}}>Featured Promo</div>
                            <video src={getMediaUrl(videoUrl)} autoPlay muted loop />
                            <button type="button" onClick={() => setVideoUrl('')}><X size={14}/></button>
                        </PreviewItem>
                    )}
                  </div>
                  
                  {/* Save button moved to the bottom of the scrollable form (left side) */}
                  <SubmitBtn onClick={handleSave}>
                    Save Attraction
                  </SubmitBtn>

                </LeftPane>
                
                <RightPane>
                  <label style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Map size={22} color="var(--text-dark)" strokeWidth={2.5} /> Pinpoint Location
                  </label>
                  <div className="map-container">
                    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>Initializing high-precision map...</div>}>
                       <MapPicker 
                         value={formData.coordinates} 
                         onChange={(c) => setFormData({ ...formData, coordinates: c })} 
                       />
                    </Suspense>
                  </div>
                  <div>
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '16px', fontWeight: 500 }}>
                      Pinpoint the exact location on the map for visitors to navigate.
                    </p>
                  </div>
                </RightPane>
              </SplitLayout>
            </FormModalContent>
          </FormModalOverlay>
        )}
      </AnimatePresence>
    </ManagerContainer>
  );
}
