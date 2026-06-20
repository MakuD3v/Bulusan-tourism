import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { BlogPost } from '../../data/types';
import { Eye, Trash2 } from 'lucide-react';
import { dbService } from '../../api/db';
import { useAlert } from '../Common/AlertProvider';
const GlassTable = styled.div`
  background: var(--surface-bg);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  overflow: hidden;

  table {
    width: 100%;
    border-collapse: collapse;
    
    th {
      text-align: left;
      padding: 20px 24px;
      background: #f9fbff;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #999;
      border-bottom: 1px solid #f0f0f0;
    }

    td {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      color: #444;
      font-size: 0.95rem;

      .action-btns {
        display: flex;
        gap: 12px;
        button {
          background: none;
          border: none;
          cursor: pointer;
          color: #888;
          transition: color 0.2s;
          &:hover { color: ${(props) => props.theme.colors.ctaBlue}; }
          &.delete:hover { color: #e74c3c; }
        }
      }
    }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalContent = styled(motion.div)`
  background: var(--surface-bg);
  width: 95%;
  max-width: 800px;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15);
  position: relative;
`;

interface BlogModeratorProps {
  blogPosts: (BlogPost & { id?: string })[];
}

const BlogModerator: React.FC<BlogModeratorProps> = ({ blogPosts }) => {
  const [blogPopup, setBlogPopup] = useState<(BlogPost & { id?: string }) | null>(null);
  const { showConfirm, showAlert } = useAlert();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Blog Moderation Audit</h2>
      <GlassTable>
        <table>
          <thead><tr><th>Title</th><th>Author</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {[...blogPosts].reverse().map(post => (
              <tr key={post.id || post.id}>
                <td style={{ fontWeight: 700 }}>{post.title}</td>
                <td>{post.authorName}</td>
                <td>
                  <span style={{ color: post.status === 'Published' ? '#2ecc71' : '#f39c12' }}>
                    {post.status || 'Under Review'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                    <button onClick={() => setBlogPopup(post)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={18} /> View Digest
                    </button>
                    <button 
                      className="delete" 
                      onClick={async () => {
                        showConfirm('Delete Blog Post', `Delete blog post: ${post.title}?`, async () => {
                          try {
                            await dbService.delete('blogs', post.id || post.id);
                            window.location.reload();
                          } catch (e) {
                            console.error("Failed to delete blog", e);
                            showAlert('Error', "Failed to delete the blog post.", 'error');
                          }
                        });
                      }} 
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassTable>

      <AnimatePresence>
        {blogPopup && (
          <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBlogPopup(null)}>
            <ModalContent initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
              <h2>{blogPopup.title}</h2>
              <p style={{ margin: '24px 0', lineHeight: 1.6 }}>{blogPopup.content || blogPopup.excerpt}</p>
              <button onClick={() => setBlogPopup(null)} style={{ padding: '12px 24px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close Review</button>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BlogModerator;
