import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Eye, Star, MapPin, Building2, TrendingUp, Award } from 'lucide-react';

const shimmer = keyframes`
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
`;

const StatCard = styled.div<{ $accent?: string }>`
  background: rgba(8, 20, 48, 0.5);
  border: 1px solid ${p => p.$accent ? `${p.$accent}22` : 'rgba(255,255,255,0.06)'};
  border-radius: 20px;
  padding: 28px 24px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: ${p => p.$accent ?? 'transparent'};
    opacity: 0.6;
  }

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: ${p => p.$accent ? `${p.$accent}18` : 'rgba(255,255,255,0.05)'};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.$accent ?? '#90cdf4'};
    margin-bottom: 20px;
  }

  .value {
    font-family: 'Outfit', sans-serif;
    font-size: 2.4rem;
    font-weight: 800;
    color: #e2ecf7;
    letter-spacing: -1px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .label {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #3d5a8a;
  }
`;

const Section = styled.section`
  margin-bottom: 36px;
`;

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #c8d9f0;
  margin-bottom: 16px;
  letter-spacing: -0.3px;
`;

const Table = styled.div`
  background: rgba(8, 20, 48, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  overflow: hidden;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 80px 80px;
  padding: 14px 24px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #3d5a8a;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 80px 80px;
  padding: 16px 24px;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  transition: background 0.2s;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255, 255, 255, 0.02); }

  .name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #c8d9f0;
    display: flex;
    align-items: center;
    gap: 10px;

    .type-badge {
      font-size: 0.67rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .type-attraction {
      background: rgba(52, 211, 153, 0.12);
      color: #34d399;
    }

    .type-enterprise {
      background: rgba(144, 205, 244, 0.12);
      color: #90cdf4;
    }
  }

  .visits {
    font-size: 0.9rem;
    font-weight: 700;
    color: #e2ecf7;
    display: flex;
    align-items: center;
    gap: 6px;
    color: #9faed4;
  }

  .rating {
    font-size: 0.9rem;
    font-weight: 700;
    color: #fbbf24;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .status {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    display: inline-block;
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
  }
`;

const EmptyState = styled.div`
  padding: 60px 24px;
  text-align: center;
  color: #2d4070;
  font-size: 0.9rem;

  p { margin-top: 8px; font-size: 0.85rem; color: #1e2d50; }
`;

const SkeletonCard = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%);
  background-size: 400px 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 20px;
  height: 120px;
`;

interface Props {
  attractions: any[];
  enterprises: any[];
  loading?: boolean;
}

const OwnerAnalyticsPanel: React.FC<Props> = ({ attractions, enterprises, loading }) => {
  const allListings = [
    ...attractions.map(a => ({ ...a, _type: 'attraction' })),
    ...enterprises.map(e => ({ ...e, _type: 'enterprise' })),
  ];

  const totalViews = allListings.reduce((sum, l) => sum + (l.visits ?? 0), 0);
  const avgRating =
    allListings.length > 0
      ? allListings.reduce((sum, l) => sum + (l.rating ?? 0), 0) / allListings.length
      : 0;

  if (loading) {
    return (
      <Grid>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
      </Grid>
    );
  }

  return (
    <>
      <Grid>
        <StatCard $accent="#34d399">
          <div className="icon"><MapPin size={20} /></div>
          <div className="value">{attractions.length}</div>
          <div className="label">Attractions</div>
        </StatCard>

        <StatCard $accent="#90cdf4">
          <div className="icon"><Building2 size={20} /></div>
          <div className="value">{enterprises.length}</div>
          <div className="label">Enterprises</div>
        </StatCard>

        <StatCard $accent="#a78bfa">
          <div className="icon"><Eye size={20} /></div>
          <div className="value">{totalViews.toLocaleString()}</div>
          <div className="label">Total Views</div>
        </StatCard>

        <StatCard $accent="#fbbf24">
          <div className="icon"><Star size={20} /></div>
          <div className="value">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</div>
          <div className="label">Avg Rating</div>
        </StatCard>
      </Grid>

      <Section>
        <SectionTitle>Your Listings Performance</SectionTitle>
        <Table>
          {allListings.length === 0 ? (
            <EmptyState>
              <TrendingUp size={36} opacity={0.3} />
              <p>No listings yet. Add your first attraction or enterprise to see analytics.</p>
            </EmptyState>
          ) : (
            <>
              <TableHead>
                <span>Listing</span>
                <span>Views</span>
                <span>Rating</span>
                <span>Status</span>
              </TableHead>
              {allListings.map(item => (
                <TableRow key={`${item._type}-${item.id}`}>
                  <div className="name">
                    {item.name}
                    <span className={`type-badge type-${item._type}`}>
                      {item._type}
                    </span>
                  </div>
                  <div className="visits">
                    <Eye size={14} />
                    {(item.visits ?? 0).toLocaleString()}
                  </div>
                  <div className="rating">
                    <Star size={13} />
                    {item.rating > 0 ? Number(item.rating).toFixed(1) : '—'}
                  </div>
                  <div><span className="status">Active</span></div>
                </TableRow>
              ))}
            </>
          )}
        </Table>
      </Section>
    </>
  );
};

export default OwnerAnalyticsPanel;
