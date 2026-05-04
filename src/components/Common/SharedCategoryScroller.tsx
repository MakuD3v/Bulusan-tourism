import React, { useState } from 'react';
import styled from 'styled-components';
import { getMapIconUrl } from '../Admin/CategoryTagConfig';

const CategoryBarContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const CategoryGridBox = styled.div<{ $expanded: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  
  /* Scroll separately! */
  max-height: ${p => p.$expanded ? '220px' : '44px'}; 
  overflow-y: ${p => p.$expanded ? 'auto' : 'hidden'};
  overflow-x: hidden;
  padding: 4px 8px;
  width: 100%;
  
  transition: max-height 0.3s ease;
  
  /* Custom scrollbar to show it's scrollable */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
`;

const CategoryPill = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'var(--cta-blue)' : 'white'};
  color: ${p => p.$active ? 'white' : '#64748b'};
  border: 1px solid ${p => p.$active ? 'var(--cta-blue)' : '#e2e8f0'};
  padding: 5px 12px 5px 5px;
  border-radius: 30px;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);

  img {
    height: 22px;
    width: auto;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
  }

  &:hover {
    border-color: var(--cta-blue);
    background: ${p => p.$active ? 'var(--cta-blue)' : '#f8fafc'};
  }
`;

const ExpandBtn = styled.button`
  background: var(--surface-bg);
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  padding: 6px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--cta-blue);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.03);
  transition: all 0.2s;
  
  &:hover {
    background: #f8fafc;
    border-color: var(--cta-blue);
  }
`;

interface CategoryDef {
  label: string;
}

interface Props {
  categories: { label: string }[];
  activeCategories: string[];
  onSelect: (cats: string[]) => void; 
}

const SharedCategoryScroller: React.FC<Props> = ({ categories, activeCategories, onSelect }) => {
  const [catsExpanded, setCatsExpanded] = useState(false);

  const handleToggle = (catLabel: string) => {
    if (catLabel === 'All') {
      onSelect([]);
      return;
    }
    
    let next = [...activeCategories];
    if (next.includes(catLabel)) {
      next = next.filter(c => c !== catLabel);
    } else {
      next.push(catLabel);
      if (next.length > 3) next.shift(); // FIFO logic
    }
    onSelect(next);
  };

  return (
    <CategoryBarContainer>
      <CategoryGridBox $expanded={catsExpanded}>
        <CategoryPill
          $active={activeCategories.length === 0}
          onClick={() => handleToggle('All')}
        >
          <img src="/map-icons/general.svg" alt="All" />
          All
        </CategoryPill>

        {categories.map((cat) => {
          const isActive = activeCategories.includes(cat.label);
          return (
            <CategoryPill
              key={cat.label}
              $active={isActive}
              onClick={() => handleToggle(cat.label)}
            >
              <img src={getMapIconUrl(cat.label)} alt={cat.label} />
              {cat.label}
            </CategoryPill>
          );
        })}
      </CategoryGridBox>
      
      {categories.length > 5 && (
        <ExpandBtn onClick={() => setCatsExpanded(!catsExpanded)}>
          {catsExpanded ? 'Show Less' : 'Show More...'}
        </ExpandBtn>
      )}
    </CategoryBarContainer>
  );
};

export default SharedCategoryScroller;
