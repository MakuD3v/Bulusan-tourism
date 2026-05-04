import React from 'react';
import styled from 'styled-components';
import { Search, X } from 'lucide-react';

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
  width: 100%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 0.9rem;
  font-weight: 500;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    background: var(--surface-bg);
    border-color: var(--cta-blue);
    box-shadow: 0 0 0 3px rgba(46, 117, 182, 0.1);
  }
`;

const IconWrapper = styled.div`
  position: absolute;
  left: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
  
  &:hover {
    background: #f1f5f9;
    color: #475569;
  }
`;

interface AdminSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const AdminSearchBar: React.FC<AdminSearchBarProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search...", 
  className,
  style 
}) => {
  return (
    <SearchContainer className={className} style={style}>
      <IconWrapper>
        <Search size={18} />
      </IconWrapper>
      <SearchInput 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
      />
      {value && (
        <ClearButton onClick={() => onChange("")} title="Clear search">
          <X size={14} />
        </ClearButton>
      )}
    </SearchContainer>
  );
};

export default AdminSearchBar;
