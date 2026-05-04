import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { Upload, X, FileVideo, Plus } from 'lucide-react';

const UploaderContainer = styled.div<{ $isDragOver: boolean, $hasFiles: boolean }>`
  border: 2px dashed ${(props) => props.$isDragOver ? props.theme.colors.ctaBlue : '#ddd'};
  background: ${(props) => props.$isDragOver ? 'rgba(46, 117, 182, 0.05)' : props.$hasFiles ? 'transparent' : '#f9fbff'};
  border-radius: 16px;
  padding: ${(props) => props.$hasFiles ? '0' : '32px'};
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${(props) => props.theme.colors.ctaBlue};
    background: rgba(46, 117, 182, 0.02);
  }

  .icon {
    margin-bottom: 12px;
    color: ${(props) => props.theme.colors.ctaBlue};
    opacity: ${(props) => props.$isDragOver ? 1 : 0.6};
  }

  p {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    strong { color: ${(props) => props.theme.colors.darkBlue}; }
  }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  width: 100%;
  padding: 16px;
`;

const PreviewCard = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;

  img, video {
    width: 100%; height: 100%; object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 8px; right: 8px;
    background: rgba(0,0,0,0.6); color: white;
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10;
    &:hover { background: #e74c3c; }
  }
`;

const AddMoreBox = styled.div`
  width: 100%; aspect-ratio: 1;
  border: 2px dashed #ddd; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: #888; transition: all 0.2s;
  &:hover { border-color: #2e75b6; color: #2e75b6; background: #f0f7ff; }
`;

interface FileData {
    id: string;
    file: File;
    src: string;
    type: 'image' | 'video';
}

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
    onFilesSelect?: (files: File[]) => void;
    multiple?: boolean;
    maxFiles?: number;
    accept?: string;
    label?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
    onFileSelect, 
    onFilesSelect, 
    multiple = false, 
    maxFiles = 5, 
    accept = "image/*,video/*", 
    label 
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [filesData, setFilesData] = useState<FileData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (incomingFiles: FileList | File[]) => {
        let validFiles = Array.from(incomingFiles);
        if (!multiple) {
            validFiles = [validFiles[0]];
        }

        let newFilesData: FileData[] = [];
        let processing = validFiles.length;

        if (multiple && filesData.length >= maxFiles) {
             alert(`Maximum of ${maxFiles} files allowed.`);
             return;
        }

        if (multiple) {
            const spacesLeft = maxFiles - filesData.length;
            validFiles = validFiles.slice(0, spacesLeft);
        }

        validFiles.forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const reader = new FileReader();

            reader.onload = () => {
                newFilesData.push({
                    id: Math.random().toString(36).substring(7),
                    file,
                    src: reader.result as string,
                    type: isImage ? 'image' : 'video'
                });
                processing--;
                if (processing === 0) {
                    if (multiple) {
                        const updated = [...filesData, ...newFilesData];
                        setFilesData(updated);
                        if(onFilesSelect) onFilesSelect(updated.map(f => f.file));
                    } else {
                        setFilesData(newFilesData);
                        if(onFileSelect) onFileSelect(newFilesData[0].file);
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const removeFile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (multiple) {
            const updated = filesData.filter(f => f.id !== id);
            setFilesData(updated);
            if(onFilesSelect) onFilesSelect(updated.map(f => f.file));
        } else {
            setFilesData([]);
            if(onFileSelect) onFileSelect(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const hasFiles = filesData.length > 0;

    return (
        <UploaderContainer
            $isDragOver={isDragOver}
            $hasFiles={hasFiles}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            onClick={() => !hasFiles && fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={accept}
                multiple={multiple}
                onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
            />

            {!hasFiles ? (
                <>
                    <div className="icon">
                        <Upload size={40} />
                    </div>
                    <p>
                        <strong>{label || 'Click or drag file(s)'}</strong> to upload
                    </p>
                    <p style={{ fontSize: '0.75rem', marginTop: '4px', opacity: 0.6 }}>
                        {multiple ? `Max ${maxFiles} files` : 'Images and Videos supported'}
                    </p>
                </>
            ) : multiple ? (
                <GalleryGrid onClick={(e) => e.stopPropagation()}>
                    {filesData.map((f) => (
                        <PreviewCard key={f.id}>
                            {f.type === 'image' ? (
                                <img src={f.src} alt="Preview" />
                            ) : (
                                <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                                    <video src={f.src} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                                    <FileVideo size={24} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'white' }} />
                                </div>
                            )}
                            <div className="remove-btn" onClick={(e) => removeFile(e, f.id)}>
                                <X size={16} />
                            </div>
                        </PreviewCard>
                    ))}
                    {filesData.length < maxFiles && (
                        <AddMoreBox onClick={() => fileInputRef.current?.click()}>
                            <Plus size={32} />
                        </AddMoreBox>
                    )}
                </GalleryGrid>
            ) : (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '14px', overflow: 'hidden' }}>
                    {filesData[0].type === 'image' ? (
                        <img src={filesData[0].src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
                            <video src={filesData[0].src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <FileVideo size={32} style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', color:'white' }} />
                        </div>
                    )}
                    <div className="remove-btn" onClick={(e) => removeFile(e, filesData[0].id)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: 'white', padding: 8, borderRadius: '50%', zIndex: 10 }}>
                        <X size={18} />
                    </div>
                </div>
            )}
        </UploaderContainer>
    );
};

export default FileUploader;
