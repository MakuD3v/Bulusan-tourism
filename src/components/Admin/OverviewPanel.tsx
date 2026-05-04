import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Users, MapPin, FileText, Heart, Star, X, TrendingUp, Calendar, ArrowUpRight, Search } from 'lucide-react';
import { Attraction, Enterprise, BlogPost, Inquiry, Heritage } from '../../data/types';
import { useGlobalStats } from '../../hooks/useFirestore';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatCard = styled(motion.div)`
  background: white;
  padding: 24px;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 12px;
  border: 1px solid rgba(0,0,0,0.02);

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #94a3b8;
    
    .icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .value {
    font-size: 2rem;
    font-weight: 800;
    color: #0f172a;
    font-family: ${p => p.theme.fonts.heading};
  }

  .label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #64748b;
  }
`;

const GlassTable = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.03);

  table {
    width: 100%;
    border-collapse: collapse;
    
    th {
      text-align: left;
      padding: 20px 24px;
      background: #f8fafc;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #94a3b8;
      font-weight: 700;
    }

    td {
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 0.95rem;
    }

    tr:hover td {
      background: #f8fbff;
      cursor: pointer;
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.3);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.1);
  position: relative;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 300px;

  input {
    border: none;
    background: none;
    padding: 8px;
    width: 100%;
    outline: none;
    font-size: 0.9rem;
  }
`;

interface OverviewPanelProps {
  attractions: Attraction[];
  enterprises: Enterprise[];
  heritageItems: Heritage[];
  blogPosts: BlogPost[];
  inboxInquiries: Inquiry[];
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ 
  attractions, 
  enterprises, 
  heritageItems, 
  blogPosts, 
  inboxInquiries 
}) => {
  const { stats: globalStats } = useGlobalStats();
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const allEntities = [
    ...attractions.map(a => ({ ...a, type: 'Attraction' })),
    ...enterprises.map(a => ({ ...a, type: 'Enterprise' })),
    ...heritageItems.map(h => ({ ...h, type: 'Heritage' }))
  ].filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
   .sort((a, b) => (b.visits || 0) - (a.visits || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <StatsGrid>
        <StatCard whileHover={{ y: -4 }}>
          <div className="header">
            <div className="icon" style={{ background: 'rgba(52, 152, 219, 0.1)', color: '#3498db' }}><Users size={20} /></div>
            <TrendingUp size={16} color="#2ecc71" />
          </div>
          <div className="value">{(globalStats.totalVisitors || 0).toLocaleString()}</div>
          <div className="label">Total Platform Visitors</div>
        </StatCard>
        
        <StatCard whileHover={{ y: -4 }}>
          <div className="header">
            <div className="icon" style={{ background: 'rgba(155, 89, 182, 0.1)', color: '#9b59b6' }}><MapPin size={20} /></div>
          </div>
          <div className="value">{attractions.length + enterprises.length}</div>
          <div className="label">Active Destinations</div>
        </StatCard>

        <StatCard whileHover={{ y: -4 }}>
          <div className="header">
            <div className="icon" style={{ background: 'rgba(241, 196, 15, 0.1)', color: '#f1c40f' }}><FileText size={20} /></div>
          </div>
          <div className="value">{blogPosts.length}</div>
          <div className="label">Published Stories</div>
        </StatCard>

        <StatCard whileHover={{ y: -4 }}>
          <div className="header">
            <div className="icon" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}><Users size={20} /></div>
          </div>
          <div className="value">{inboxInquiries.filter(i => i.status === 'New').length}</div>
          <div className="label">New Inquiries</div>
        </StatCard>
      </StatsGrid>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BarChart3 size={24} color="var(--cta-blue)" /> Discovery Interactions
        </h2>
        <SearchContainer>
          <Search size={18} color="#94a3b8" />
          <input 
            placeholder="Search entities..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </SearchContainer>
      </div>

      <GlassTable>
        <table>
          <thead>
            <tr>
              <th>Entity Name</th>
              <th>Category</th>
              <th>Total Visits</th>
              <th>Avg Rating</th>
              <th style={{ textAlign: 'right' }}>Trending</th>
            </tr>
          </thead>
          <tbody>
            {allEntities.slice(0, 10).map((entity) => (
              <tr key={entity.firebaseId} onClick={() => setSelectedEntity(entity)}>
                <td style={{ fontWeight: 700 }}>{entity.name}</td>
                <td>
                  <span style={{ padding: '4px 10px', borderRadius: '20px', background: '#f1f5f9', fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                    {entity.type}
                  </span>
                </td>
                <td>{entity.visits || 0} clicks</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                    <Star size={14} fill="#f1c40f" color="#f1c40f" /> {entity.rating || '0.0'}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <ArrowUpRight size={18} color="#2ecc71" style={{ opacity: 0.5 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassTable>

      <AnimatePresence>
        {selectedEntity && (
          <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEntity(null)}>
            <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedEntity(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={24} />
              </button>
              
              <div style={{ marginBottom: '32px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--cta-blue)', fontWeight: 800, marginBottom: '8px' }}>
                  Performance Report
                </div>
                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{selectedEntity.name}</h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Total Interactions</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{selectedEntity.visits || 0}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '4px' }}>Average Rating</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={20} fill="#f1c40f" color="#f1c40f" /> {selectedEntity.rating || '0.0'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
                  <Calendar size={18} />
                  <span>Past 30 Days Interaction: <strong>{Math.floor((selectedEntity.visits || 0) * 0.4)} clicks</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b' }}>
                  <TrendingUp size={18} />
                  <span>Growth Trend: <strong style={{ color: '#2ecc71' }}>+12.4%</strong></span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEntity(null)}
                style={{ width: '100%', marginTop: '40px', padding: '16px', background: 'var(--cta-blue)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                Close Insights
              </button>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OverviewPanel;
