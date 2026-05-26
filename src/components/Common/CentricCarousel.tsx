import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 4px 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ItemsStage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 460px; /* Reduced from 600px */
  position: relative;

  @media (max-width: 768px) {
    height: 380px;
  }
`;

const ItemWrapper = styled(motion.div)<{ $isActive: boolean }>`
  position: absolute;
  width: 300px; /* Reduced from 360px for side-by-side */
  height: 400px; /* Reduced from 440px */
  cursor: pointer;

  /* Full card sits in stage */
  > * {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* Enlarge image area inside DiscoveryCard for the carousel */
  .image-container {
    height: 200px !important; /* Reduced from 240px */
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    h3 { font-size: 1.1rem; }
    p { font-size: 0.8rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  }

  @media (max-width: 1200px) {
    width: 280px;
    height: 380px;
    .image-container {
      height: 180px !important;
    }
  }

  @media (max-width: 768px) {
    width: 260px;
    height: 360px;
    .image-container {
      height: 180px !important;
    }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
  z-index: 20;
  align-items: center;
`;

const NavButton = styled.button`
  width: 48px; /* Reduced from 58px */
  height: 48px;
  border-radius: 50%;
  background: var(--surface-bg);
  border: 1px solid rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.darkBlue};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.colors.ctaBlue};
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 16px 32px rgba(46, 117, 182, 0.25);
    border-color: transparent;
  }

  &:active {
    transform: translateY(-1px);
  }
`;

const Pagination = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 20px;
  align-items: center;
`;

const Dot = styled.button<{ $active: boolean }>`
  width: ${props => props.$active ? '28px' : '8px'};
  height: 8px;
  border-radius: 4px;
  background: ${props => props.$active ? props.theme.colors.ctaBlue : '#cbd5e1'};
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  border: none;
`;

interface CentricCarouselProps {
  items: any[];
  renderItem: (item: any, isActive: boolean) => React.ReactNode;
  autoPlayInterval?: number;
}

const CentricCarousel: React.FC<CentricCarouselProps> = ({
  items,
  renderItem,
  autoPlayInterval = 5000
}) => {
  const [centerIndex, setCenterIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<any>(null);

  const handleNext = useCallback(() => {
    setCenterIndex(prev => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setCenterIndex(prev => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoPlayInterval > 0) {
      timerRef.current = setInterval(handleNext, autoPlayInterval);
    }
  }, [handleNext, autoPlayInterval]);

  // Start autoplay on mount and whenever items/handleNext changes
  useEffect(() => {
    if (!isHovered) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer, isHovered]);

  // Reset progress bar key on slide change
  const [progressKey, setProgressKey] = useState(0);
  useEffect(() => {
    setProgressKey(k => k + 1);
  }, [centerIndex]);

  if (!items || items.length === 0) return null;

  const getPosition = (index: number) => {
    const diff = (index - centerIndex + items.length) % items.length;
    if (diff === 0) return 'center';
    if (diff === 1 || diff === -(items.length - 1)) return 'right';
    if (diff === items.length - 1 || diff === -1) return 'left';
    return 'hidden';
  };

  const variants = {
    center: {
      x: 0,
      scale: 1.05, /* Reduced scale slightly for less overwhelming pop */
      opacity: 1,
      zIndex: 10,
      filter: 'blur(0px)',
    },
    left: {
      x: '-65%',
      scale: 0.85,
      opacity: 0.5,
      zIndex: 5,
      filter: 'blur(1.5px)',
    },
    right: {
      x: '65%',
      scale: 0.85,
      opacity: 0.5,
      zIndex: 5,
      filter: 'blur(1.5px)',
    },
    hidden: {
      x: 0,
      scale: 0.5,
      opacity: 0,
      zIndex: 0,
      filter: 'blur(8px)',
    }
  };

  return (
    <CarouselContainer
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ItemsStage>
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const position = getPosition(index);
            if (position === 'hidden') return null;

            return (
              <ItemWrapper
                key={item.id || item.id || index}
                $isActive={position === 'center'}
                initial="hidden"
                animate={position}
                variants={variants}
                transition={{
                  type: 'spring',
                  stiffness: 220,
                  damping: 24,
                  opacity: { duration: 0.35 }
                }}
                onClick={() => setCenterIndex(index)}
              >
                {renderItem(item, position === 'center')}
              </ItemWrapper>
            );
          })}
        </AnimatePresence>
      </ItemsStage>

      <Controls>
        <NavButton onClick={handlePrev} aria-label="Previous">
          <ChevronLeft size={24} />
        </NavButton>
        <Pagination>
          {items.map((_, index) => (
            <Dot
              key={index}
              $active={index === centerIndex}
              onClick={() => setCenterIndex(index)}
            />
          ))}
        </Pagination>
        <NavButton onClick={handleNext} aria-label="Next">
          <ChevronRight size={24} />
        </NavButton>
      </Controls>
    </CarouselContainer>
  );
};

export default CentricCarousel;
