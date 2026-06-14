import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Container = styled.div`
  position: relative;
  width: 100%;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #60a5fa;
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 6px 12px;
  outline: none;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover, &:focus {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  svg {
    color: #5a7098;
  }
`;

const Dropdown = styled(motion.div)`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: max-content;
  min-width: 120px;
  max-height: 250px;
  background: #0b1f45;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  padding: 8px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }
`;

const TimeOption = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? '#3b82f6' : 'transparent'};
  color: ${p => p.$active ? 'white' : '#90aecb'};
  border: none;
  padding: 8px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;

  &:hover {
    background: ${p => p.$active ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)'};
    color: white;
  }
`;

interface TimePickerProps {
  value: string; // "HH:MM" 24hr format
  onChange: (value: string) => void;
  placeholder?: string;
}

const generateTimeOptions = () => {
  const options = [];
  for (let h = 5; h <= 22; h++) { // 5 AM to 10 PM
    for (let m = 0; m < 60; m += 15) {
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, placeholder = "--:--" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll to active item when opened
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'center' });
    }
  }, [isOpen]);

  const handleSelect = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  return (
    <Container ref={containerRef}>
      <Trigger onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}>
        <Clock size={14} />
        {value || placeholder}
      </Trigger>

      <AnimatePresence>
        {isOpen && (
          <Dropdown
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {TIME_OPTIONS.map(time => {
              const isActive = value === time;
              return (
                <TimeOption
                  key={time}
                  $active={isActive}
                  onClick={(e) => { e.preventDefault(); handleSelect(time); }}
                  ref={isActive ? activeRef : null}
                >
                  {time}
                </TimeOption>
              );
            })}
          </Dropdown>
        )}
      </AnimatePresence>
    </Container>
  );
};

export default TimePicker;
