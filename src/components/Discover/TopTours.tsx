import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useTours } from '../../hooks/useFirestore';
import { tours as staticTours } from '../../data/tours';
import { useNavigate } from 'react-router-dom';

const ToursGrid = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding-bottom: 80px;
`;

const SectionHeader = styled.div`
  max-width: 1000px;
  margin: 0 auto 24px auto;
  display: flex;
  align-items: center;
  gap: 16px;

  h2 { font-size: 1.6rem; color: ${(props) => props.theme.colors.darkBlue}; }
  .line { flex: 1; height: 1px; background: rgba(0,0,0,0.1); }
`;

const TourCard = styled(motion.div)`
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  display: flex;
  flex-direction: column;
  box-shadow: ${(props) => props.theme.glass.shadow};
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  .content {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;

    .meta {
      font-size: 0.8rem;
      font-weight: 600;
      color: ${(props) => props.theme.colors.ctaBlue};
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h3 { font-size: 1.3rem; margin-bottom: 8px; color: ${(props) => props.theme.colors.darkBlue}; font-weight: 700; }
    p { font-size: 0.95rem; color: ${(props) => props.theme.colors.textLight}; line-height: 1.6; margin-bottom: 16px; flex: 1; }
    
    .price { font-size: 1rem; font-weight: 700; color: ${(props) => props.theme.colors.darkBlue}; margin-bottom: 16px; }

    button {
      background: ${(props) => props.theme.colors.ctaBlue};
      color: white;
      padding: 12px;
      font-weight: 600;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
  }
`;

const TopTours = () => {
  const { data: tours } = useTours(staticTours);
  const navigate = useNavigate();

  if (tours.length === 0) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto 80px auto', textAlign: 'center', padding: '64px', background: 'rgba(255,255,255,0.7)', borderRadius: '32px', border: '1px solid #eee' }}>
        <h2 style={{ color: '#2e75b6', marginBottom: '16px' }}>Top Tours Coming Soon!</h2>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>We are curating the best guided experiences in Bulusan.</p>
      </div>
    );
  }

  const sortedTours = [...tours].sort((a: any, b: any) => (b.visits || 0) - (a.visits || 0));

  return (
    <>
      <SectionHeader>
        <div className="line" />
        <h2>Top Tours</h2>
        <div className="line" />
      </SectionHeader>

      <ToursGrid>
        {sortedTours.slice(0, 3).map((tour: any, index: number) => (
          <TourCard
            key={tour.id}
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/tours?openId=${tour.id}`)}
          >
            <div style={{ height: '180px' }}>
              <img src={tour.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={tour.title} />
            </div>
            <div className="content">
              <div className="meta">{tour.duration} · {tour.groupSize}</div>
              <h3>{tour.title}</h3>
              <p>{tour.desc}</p>
              {tour.price && <div className="price">{tour.price} <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'normal' }}>/pax</span></div>}
              <motion.button whileTap={{ scale: 0.95 }} onClick={(e) => { e.stopPropagation(); navigate(`/tours?openId=${tour.id}`); }}>
                Book Now ›
              </motion.button>
            </div>
          </TourCard>
        ))}
      </ToursGrid>
    </>
  );
};

export default TopTours;
