import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Attraction, Enterprise, BlogPost } from '../../data/types';
import { Search, User, Star, Building2, BookOpen, Clock, MapPin, Trash2 } from 'lucide-react';
import { dbService } from '../../api/db';
import AdminSearchBar from './AdminSearchBar';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  height: calc(100vh - 250px);
  min-height: 600px;
`;

const Column = styled.div`
  background: var(--surface-bg);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
`;

const ColumnHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  
  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(148, 163, 184, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cta-blue);
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-dark);
    font-family: ${p => p.theme.fonts.heading};
  }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
`;

const ContentCard = styled(motion.div)`
  background: rgba(148, 163, 184, 0.02);
  border: 1px solid rgba(0,0,0,0.03);
  padding: 16px;
  border-radius: 18px;
  position: relative;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    border-color: rgba(239, 68, 68, 0.4);
  }
  
  .entity-ref {
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--cta-blue);
    margin-bottom: 8px;
  }

  h4 {
    margin: 0 0 4px 0;
    font-size: 0.95rem;
    color: var(--text-dark);
  }

  .meta {
    font-size: 0.8rem;
    color: var(--text-light);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .content-preview {
    font-size: 0.85rem;
    color: var(--text-dark);
    line-height: 1.5;
    background: var(--surface-bg);
    padding: 12px;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .actions {
    display: flex;
    gap: 8px;
  }
`;

interface ModerationDashboardProps {
  attractions: Attraction[];
  enterprises: Enterprise[];
  blogPosts: BlogPost[];
}

const ModerationDashboard: React.FC<ModerationDashboardProps> = ({ attractions, enterprises, blogPosts }) => {
    const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Search size={24} color="var(--cta-blue)" /> Content Moderation
                </h2>
                <AdminSearchBar 
                    value={searchTerm} 
                    onChange={setSearchTerm} 
                    placeholder="Search reviews or blogs..." 
                    style={{ maxWidth: '350px' }}
                />
            </div>

            <Grid>
                {/* Column 1: Attraction Reviews */}
                <Column>
                    <ColumnHeader>
                        <div className="icon-box"><MapPin size={20} /></div>
                        <h3>Attraction Reviews</h3>
                    </ColumnHeader>
                    <ScrollArea>
                        {attractions.map(attr => (attr.reviews || [])
                            .filter(rev => {
                                const q = searchTerm.toLowerCase();
                                return attr.name.toLowerCase().includes(q) || 
                                       rev.author.toLowerCase().includes(q) || 
                                       rev.comment.toLowerCase().includes(q);
                            })
                            .map(rev => (
                                <ContentCard 
                                    key={`rev-${rev.id}`} 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    style={{ cursor: 'pointer' }}
                                    onClick={async () => {
                                        if (window.confirm(`Delete review by ${rev.author} from ${attr.name}?`)) {
                                            try {
                                                const newReviews = attr.reviews.filter(r => r.id !== rev.id);
                                                await dbService.update('attractions', attr.id!, { reviews: newReviews });
                                            } catch (e) {
                                                console.error("Failed to delete review", e);
                                            }
                                        }
                                    }}
                                >
                                    <div className="entity-ref">{attr.name}</div>
                                    <div className="meta">
                                        <User size={12} /> {rev.author} · <Star size={12} fill="#f1c40f" color="#f1c40f" /> {rev.rating}
                                    </div>
                                    <div className="content-preview">"{rev.comment}"</div>
                                </ContentCard>
                            )))}
                    </ScrollArea>
                </Column>

                {/* Column 2: Enterprise Reviews */}
                <Column>
                    <ColumnHeader>
                        <div className="icon-box"><Building2 size={20} /></div>
                        <h3>Stay & Dine Reviews</h3>
                    </ColumnHeader>
                    <ScrollArea>
                        {enterprises.map(acc => (acc.reviews || [])
                            .filter(rev => {
                                const q = searchTerm.toLowerCase();
                                return acc.name.toLowerCase().includes(q) || 
                                       rev.author.toLowerCase().includes(q) || 
                                       rev.comment.toLowerCase().includes(q);
                            })
                            .map(rev => (
                                <ContentCard 
                                    key={`rev-${rev.id}`} 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    style={{ cursor: 'pointer' }}
                                    onClick={async () => {
                                        if (window.confirm(`Delete review by ${rev.author} from ${acc.name}?`)) {
                                            try {
                                                const newReviews = acc.reviews.filter(r => r.id !== rev.id);
                                                await dbService.update('enterprises', acc.id!, { reviews: newReviews });
                                            } catch (e) {
                                                console.error("Failed to delete review", e);
                                            }
                                        }
                                    }}
                                >
                                    <div className="entity-ref">{acc.name}</div>
                                    <div className="meta">
                                        <User size={12} /> {rev.author} · <Star size={12} fill="#f1c40f" color="#f1c40f" /> {rev.rating}
                                    </div>
                                    <div className="content-preview">"{rev.comment}"</div>
                                </ContentCard>
                            )))}
                    </ScrollArea>
                </Column>

                {/* Column 3: Blogs */}
                <Column>
                    <ColumnHeader>
                        <div className="icon-box"><BookOpen size={20} /></div>
                        <h3>Story Moderation</h3>
                    </ColumnHeader>
                    <ScrollArea>
                        {blogPosts.map(blog => (
                            <ContentCard key={blog.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="entity-ref">{blog.category}</div>
                                <h4>{blog.title}</h4>
                                <div className="meta">
                                    <User size={12} /> {blog.authorName} · <Clock size={12} /> {blog.status || 'Under Review'}
                                </div>
                                <div style={{ marginTop: 12, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button onClick={() => setSelectedBlog(blog)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-dark)', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
                                        View Content
                                    </button>
                                    <button 
                                      onClick={async () => {
                                          if (window.confirm(`Delete blog post: ${blog.title}?`)) {
                                              try {
                                                  await dbService.delete('blogs', blog.id || blog.id);
                                                  window.location.reload();
                                              } catch (e) {
                                                  console.error("Failed to delete blog", e);
                                                  alert("Failed to delete the blog post.");
                                              }
                                          }
                                      }}
                                      style={{ padding: '6px', borderRadius: 8, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                      title="Delete Blog"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </ContentCard>
                        ))}
                    </ScrollArea>
                </Column>

                {/* Blog View Modal */}
                <AnimatePresence>
                    {selectedBlog && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ background: 'var(--surface-bg)', width: '90%', maxWidth: 700, padding: 40, borderRadius: 24 }}>
                                <h2 style={{ fontSize: '1.8rem', color: 'var(--text-dark)' }}>{selectedBlog.title}</h2>
                                <p style={{ margin: '24px 0', lineHeight: 1.6, color: 'var(--text-dark)' }}>{selectedBlog.content}</p>
                                <button onClick={() => setSelectedBlog(null)} style={{ background: 'var(--cta-blue)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Close Preview</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </Grid>
        </motion.div>
    );
};

export default ModerationDashboard;
