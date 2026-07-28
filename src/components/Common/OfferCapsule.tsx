import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../../utils/mediaUtils';
import { Offer } from '../../data/types';

interface OfferCapsuleProps {
  offer: Offer;
}

const OfferCapsule: React.FC<OfferCapsuleProps> = ({ offer }) => {
  const [expanded, setExpanded] = useState(false);
  const imgUrl = getMediaUrl(offer.image) || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=400';

  const formatPrice = (price: string, type?: string) => {
    if (type === 'Hourly Price') return `₱${price} / hr`;
    if (type === 'Price Range') return `₱${price}`;
    return `₱${price}`;
  };

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        marginBottom: '8px',
      }}
    >
      <AnimatePresence mode="wait">
        {!expanded ? (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', height: '48px' }}
          >
            <div style={{
              flex: 1,
              backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.8), rgba(15,23,42,0.4)), url(${imgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontWeight: 600,
              color: 'white',
              fontSize: '0.9rem'
            }}>
              {offer.name}
            </div>
            <div style={{
              background: 'linear-gradient(135deg, var(--cta-blue), var(--primary-blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 16px',
              fontWeight: 800,
              color: 'white',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}>
              {formatPrice(offer.price, offer.type)}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ padding: '12px' }}
          >
            <img 
              src={imgUrl} 
              alt={offer.name} 
              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'white', fontSize: '1rem' }}>{offer.name}</span>
              <span style={{ fontWeight: 800, color: 'var(--cta-blue)', fontSize: '1.1rem' }}>
                {formatPrice(offer.price, offer.type)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OfferCapsule;
