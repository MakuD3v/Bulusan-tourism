import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PlayCircle } from 'lucide-react';
import SmartMedia from './SmartMedia';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../../utils/mediaUtils';

const GalleryContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MainDisplay = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 320px;
  border-radius: 24px;
  overflow: hidden;
  background: black;
  position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  flex-shrink: 0;
`;

const ThumbnailsRow = styled.div`
  display: flex;
  gap: 16px;
  height: 75px; /* Fixed height for thumbnails */
  width: 100%;
`;

const Thumbnail = styled.div<{ $active: boolean }>`
  flex: 1;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  border: 4px solid ${p => p.$active ? 'var(--cta-blue)' : 'transparent'};
  opacity: ${p => p.$active ? 1 : 0.6};
  transition: all 0.2s;
  background: #f1f5f9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  
  &:hover {
    opacity: 1;
    transform: translateY(-2px);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ReplayButton = styled.button`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  padding: 12px 24px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
  
  &:hover {
    background: var(--cta-blue);
    border-color: var(--cta-blue);
    transform: scale(1.05);
  }
`;

interface Props {
  videoUrl?: string;
  images: string[];
}

export default function GalleryWithThumbnails({ videoUrl, images }: Props) {
  const hasVideo = !!videoUrl;
  const [currentIndex, setCurrentIndex] = useState<number>(hasVideo ? -1 : 0);

  useEffect(() => {
    if (currentIndex >= 0 && images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, images.length]);

  return (
    <GalleryContainer>
      <MainDisplay>
        <AnimatePresence mode="wait">
          {currentIndex === -1 ? (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: '100%', height: '100%' }}
            >
              <SmartMedia
                type="video"
                src={videoUrl!}
                autoPlay
                muted
                controls
                onEnded={() => setCurrentIndex(0)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`img-${currentIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
            >
              {images[currentIndex] && (
                <SmartMedia
                  type="img"
                  src={images[currentIndex]}
                  alt="Gallery"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              {hasVideo && (
                <ReplayButton onClick={() => setCurrentIndex(-1)}>
                  <PlayCircle size={20} /> Replay Video
                </ReplayButton>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </MainDisplay>

      {images.length > 0 && (
        <ThumbnailsRow>
          {images.map((img, i) => (
            <Thumbnail 
              key={i} 
              $active={currentIndex === i} 
              onClick={() => setCurrentIndex(i)}
            >
              <img src={getMediaUrl(img)} alt={`Thumbnail ${i + 1}`} />
            </Thumbnail>
          ))}
        </ThumbnailsRow>
      )}
    </GalleryContainer>
  );
}
