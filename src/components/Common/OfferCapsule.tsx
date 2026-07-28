import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getMediaUrl } from '../../utils/mediaUtils';
import { Offer } from '../../data/types';
import { X } from 'lucide-react';

interface OfferCapsuleProps {
  offer: Offer;
}

const OfferCapsule: React.FC<OfferCapsuleProps> = ({ offer }) => {
  const [showModal, setShowModal] = useState(false);
  const imgUrl = getMediaUrl(offer.image) || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&w=400';

  const formatPrice = (price: string, type?: string) => {
    if (type === 'Hourly Price') return `₱${price} / hr`;
    if (type === 'Price Range') return `₱${price}`;
    return `₱${price}`;
  };

  return (
    <>
      <motion.div
        layout
        onClick={() => setShowModal(true)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          marginBottom: '8px',
        }}
      >
        <div
          style={{ 
            display: 'flex', 
            height: '48px',
            backgroundImage: `linear-gradient(to right, rgba(30,41,59,0.2) 0%, rgba(30,41,59,0.9) 60%, rgba(30,41,59,1) 100%), url(${imgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontWeight: 700,
            color: 'white',
            fontSize: '0.95rem',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
          }}>
            {offer.name}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontWeight: 900,
            color: '#60a5fa', /* Light blue for the price text */
            fontSize: '1rem',
            whiteSpace: 'nowrap'
          }}>
            {formatPrice(offer.price, offer.type)}
          </div>
        </div>
      </motion.div>

      {showModal && createPortal(
        <AnimatePresence>
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }} onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1e293b', // var(--surface-bg)
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img 
                  src={imgUrl} 
                  alt={offer.name} 
                  style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', backgroundColor: '#0f172a' }} 
                />
                <button 
                  onClick={() => setShowModal(false)}
                  style={{
                    position: 'absolute', top: '12px', right: '12px',
                    background: 'rgba(0,0,0,0.5)', border: 'none',
                    color: 'white', borderRadius: '50%', width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '1.4rem', fontWeight: 700 }}>{offer.name}</h3>
                  <span style={{ 
                    background: 'rgba(96,165,250,0.15)', color: '#60a5fa', 
                    padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '1.1rem' 
                  }}>
                    {formatPrice(offer.price, offer.type)}
                  </span>
                </div>
                {offer.description && (
                  <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>
                    {offer.description}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default OfferCapsule;
