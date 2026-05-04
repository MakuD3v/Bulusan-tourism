import React, { useState } from 'react';
import styled from 'styled-components';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  editable?: boolean;
  onChange?: (rating: number) => void;
  size?: number;
}

const RatingContainer = styled.div`
  display: flex;
  gap: 4px;
`;

const StarButton = styled.button<{ $active: boolean; $editable: boolean }>`
  background: none;
  border: none;
  padding: 0;
  cursor: ${props => props.$editable ? 'pointer' : 'default'};
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: ${props => props.$editable ? 'scale(1.2)' : 'none'};
  }

  svg {
    fill: ${props => props.$active ? '#f59e0b' : 'transparent'};
    color: ${props => props.$active ? '#f59e0b' : '#cbd5e1'};
  }
`;

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  max = 5, 
  editable = false, 
  onChange, 
  size = 20 
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (val: number) => {
    if (editable && onChange) {
      onChange(val);
    }
  };

  return (
    <RatingContainer>
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = hoverRating !== null 
          ? starValue <= hoverRating 
          : starValue <= Math.round(rating);

        return (
          <StarButton
            key={i}
            $active={isActive}
            $editable={editable}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => editable && setHoverRating(starValue)}
            onMouseLeave={() => editable && setHoverRating(null)}
            type="button"
          >
            <Star size={size} />
          </StarButton>
        );
      })}
    </RatingContainer>
  );
};

export default StarRating;
