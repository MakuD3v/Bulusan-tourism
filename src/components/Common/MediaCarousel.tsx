import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import SmartMedia from './SmartMedia';

const CarouselContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NextPrevButton = styled.button<{ $right?: boolean }>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${props => props.$right ? 'right: 16px;' : 'left: 16px;'}
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  &:hover {
    background: rgba(255,255,255,0.4);
    transform: translateY(-50%) scale(1.1);
  }
`;

const DotsContainer = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const Dot = styled.div<{ $active: boolean }>`
  width: ${props => props.$active ? '24px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props => props.$active ? 'var(--cta-blue)' : 'rgba(255,255,255,0.5)'};
  transition: all 0.3s ease;
  cursor: pointer;
`;

const ReplayButton = styled.button`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 800;
  font-size: 0.8rem;
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

interface MediaCarouselProps {
  videoUrl?: string;
  mainImage: string;
  gallery?: string[];
}

const carouselVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 200 : -200,
    opacity: 0
  })
};

export default function MediaCarousel({ videoUrl, mainImage, gallery = [] }: MediaCarouselProps) {
  const allImages = [mainImage, ...gallery].filter(Boolean);
  const hasVideo = !!videoUrl;
  
  const [mode, setMode] = useState<'video' | 'carousel'>(hasVideo ? 'video' : 'carousel');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  
  const timerRef = useRef<number | null>(null);

  const startCarouselTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mode === 'carousel' && allImages.length > 1) {
      timerRef.current = window.setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % allImages.length);
      }, 4000);
    }
  };

  useEffect(() => {
    startCarouselTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, allImages.length]);

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % allImages.length);
    startCarouselTimer(); // reset interval
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    startCarouselTimer(); // reset interval
  };

  // Support Youtube Links as well as pure MP4
  const renderVideo = () => {
    if (!videoUrl) return null;

    return (
      <SmartMedia
        type="video"
        src={videoUrl}
        autoPlay
        muted
        unmuteOnInteraction
        controls
        onEnded={() => setMode('carousel')}
        style={{ objectFit: 'cover', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
    );
  };

  return (
    <CarouselContainer>
      <AnimatePresence mode="wait">
        {mode === 'video' ? (
          <motion.div
            key="video-player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            {renderVideo()}
          </motion.div>
        ) : (
          <motion.div
            key="image-carousel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100%' }}
          >
            {hasVideo && (
              <ReplayButton onClick={() => setMode('video')}>
                <PlayCircle size={18} /> Replay Video
              </ReplayButton>
            )}

            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={carouselVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.4 }
                }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              >
                <SmartMedia
                  type="img"
                  src={allImages[currentIndex]}
                  alt="Gallery"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </motion.div>
            </AnimatePresence>

            {allImages.length > 1 && (
              <>
                <NextPrevButton onClick={handlePrev}><ChevronLeft size={24} /></NextPrevButton>
                <NextPrevButton $right onClick={handleNext}><ChevronRight size={24} /></NextPrevButton>
                <DotsContainer>
                  {allImages.map((_, i) => (
                    <Dot 
                      key={i} 
                      $active={i === currentIndex} 
                      onClick={() => { setCurrentIndex(i); startCarouselTimer(); }}
                    />
                  ))}
                </DotsContainer>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </CarouselContainer>
  );
}
