import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Filter, Plus } from 'lucide-react';
import { useBlogs } from '../hooks/useData';
import { useAuth } from '../hooks/useAuth';
import { dbService } from '../api/db';
import { uploadFile } from '../api/storage';
import { blogPosts as staticBlogs } from '../data/blog';
import FileUploader from '../components/Common/FileUploader';
import AuthGuardPopup from '../components/Common/AuthGuardPopup';
import StandardPageHeader from '../components/Common/StandardPageHeader';
import DiscoveryCard from '../components/Common/DiscoveryCard';
import SectionHeader from '../components/Common/SectionHeader';
import CentricCarousel from '../components/Common/CentricCarousel';
import SharedCategoryScroller from '../components/Common/SharedCategoryScroller';
import { BLOG_CATEGORIES } from '../components/Admin/CategoryTagConfig';
import SmartMedia from '../components/Common/SmartMedia';
import { useAlert } from '../components/Common/AlertProvider';
const PageContainer = styled(motion.div)`
  width: 100%;
  padding: 0 64px 64px;

  @media (max-width: 1024px) {
    padding: 0 32px 48px;
  }

  @media (max-width: 768px) {
    padding: 0 20px 40px;
  }
`;

const BlogHeroContainer = styled.div`
  position: relative;
  width: 100vw;
  margin-left: -64px;
  padding: 0 64px 32px;
  margin-bottom: 40px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  
  @media (max-width: 1024px) {
    margin-left: -32px;
    padding: 0 32px 24px;
  }

  @media (max-width: 768px) {
    margin-left: -20px;
    padding: 0 20px 20px;
  }

  .video-container {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    overflow: hidden;
    z-index: 0;
  }

  .video-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .hero-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(
      to bottom,
      ${(props) => props.theme.colors.lightBg}66 0%,
      ${(props) => props.theme.colors.lightBg}cc 50%,
      ${(props) => props.theme.colors.lightBg} 100%
    );
    z-index: 1;
  }

  /* Make StandardPageHeader transparent */
  & > section {
    background: transparent !important;
    position: relative;
    z-index: 2;
  }

  .controls-wrapper {
    position: relative;
    z-index: 2;
  }
`;

const Header = styled.div`
  margin-bottom: 48px;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  background: var(--surface-bg);
  padding: 12px 24px;
  border-radius: 30px;
  border: 1px solid rgba(0,0,0,0.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  flex: 1;
  min-width: 300px;
  max-width: 500px;

  input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 1rem;
    margin-left: 12px;
    width: 100%;
  }
`;

const FilterAreaContainer = styled.div`
  flex: 1;
  min-width: 0;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const FeaturedPost = styled(motion.div)`
  width: 100%;
  height: 450px;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
  margin-bottom: 64px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  align-items: flex-end;
  cursor: pointer;

  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    object-fit: cover;
    z-index: 1;
  }

  .overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
    z-index: 2;
  }

  .content {
    position: relative;
    z-index: 3;
    padding: 48px;
    color: white;
    max-width: 800px;

    .tag { background: var(--cta-blue); padding: 4px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; display: inline-block; }
    h2 { font-size: 2.8rem; font-family: ${(props) => props.theme.fonts.heading}; margin-bottom: 16px; line-height: 1.2; }
    p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 24px; }
    .author { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; img { width: 32px; height: 32px; border-radius: 50%; } }
  }
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 32px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const BlogCard = styled(motion.div)`
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${(props) => props.theme.glass.shadow};
  cursor: pointer;
  transition: all 0.3s ease;
  
  .image { height: 200px; img { width: 100%; height: 100%; object-fit: cover; } }
  .content {
    padding: 24px;
    .tag { color: ${(props) => props.theme.colors.ctaBlue}; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
    h3 { font-size: 1.4rem; color: ${(props) => props.theme.colors.darkBlue}; margin-bottom: 12px; line-height: 1.3;}
    p { color: #666; font-size: 0.95rem; line-height: 1.5; margin-bottom: 24px; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 16px; font-size: 0.85rem; color: #888; }
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  z-index: 2000;
  display: flex;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 0;
`;

const FullPostModal = styled(motion.div)`
  background: var(--surface-bg);
  width: 90%;
  max-width: 900px;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.2);
  height: max-content;
  margin-bottom: 40px;
  
  .hero {
    height: 400px;
    width: 100%;
    position: relative;
    img { width: 100%; height: 100%; object-fit: cover; }
    .overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, white, transparent); }
    .close-btn { position: absolute; top: 24px; right: 24px; background: rgba(0,0,0,0.5); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; font-size: 1.5rem; }
  }

  .content-body {
    padding: 0 80px 80px 80px;
    margin-top: -60px;
    position: relative;
    z-index: 5;
    
    .tag { color: ${(props) => props.theme.colors.ctaBlue}; font-weight: bold; margin-bottom: 12px; display: block; }
    h2 { font-size: 3rem; color: ${(props) => props.theme.colors.darkBlue}; margin-bottom: 24px; line-height: 1.1; }
    .meta { display: flex; gap: 20px; color: #777; margin-bottom: 40px; font-size: 0.9rem; }
    .text { 
      font-size: 1.15rem; color: #333; line-height: 1.8; 
      p { margin-bottom: 24px; }
      h4 { font-size: 1.5rem; margin: 40px 0 20px 0; color: ${(props) => props.theme.colors.darkBlue}; }
    }
  }

  .related {
    background: #f9f9f9;
    padding: 64px 80px;
    h4 { margin-bottom: 32px; font-size: 1.4rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .item { display: flex; gap: 16px; align-items: center; img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; } h5 { font-size: 1rem; color: ${(props) => props.theme.colors.darkBlue}; } }
  }
`;

// Local mockPosts removed

const CreateModalContent = styled(motion.div)`
  background: var(--surface-bg);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15);
  position: relative;
  z-index: 2001;
  background: var(--surface-bg);
  form { display: flex; flex-direction: column; gap: 16px; }
  h2 { margin-bottom: 24px; color: var(--text-dark); }
  .field { margin-bottom: 0px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-light); }
  input, textarea, select {
    width: 100%;
    padding: 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    font-size: 1rem;
    font-family: inherit;
    background: var(--surface-bg);
    color: var(--text-dark);
  }
  button.submit {
    width: 100%;
    padding: 16px;
    background: #2e75b6;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    margin-top: 8px;
    cursor: pointer;
    transition: background 0.2s;
    &:hover { background: #245d91; }
  }
`;

const BlogPage = () => {
  const { data: blogPosts, loading, refresh } = useBlogs();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', category: 'Travel Guide', excerpt: '', content: '' });
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filteredPosts = blogPosts.filter((post: any) => {
    const categoryMatch = selectedCategories.length === 0 || selectedCategories.every(sc => post.category === sc);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && matchesSearch;
  });

  // Replaced local categories 

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthPopupOpen(true);
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&q=80`;

      if (postImage) {
        finalImageUrl = await uploadFile(postImage, `blogs/${Date.now()}_${postImage.name}`);
      }

      const post = {
        id: Date.now(),
        ...newPost,
        image: finalImageUrl,
        authorName: user.name,
        authorAvatar: user.avatar || `https://i.pravatar.cc/150?u=${user.email}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        readTime: '5 min read',
        status: 'Under Review'
      };

      await dbService.add('blogs', post);
      refresh();
      setShowCreateModal(false);
      setNewPost({ title: '', category: 'Travel Guide', excerpt: '', content: '' });
      setPostImage(null);
      showAlert('Success', 'Story submitted for review!', 'success');
    } catch (error) {
      showAlert('Error', 'Failed to share your story. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={!loading ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <BlogHeroContainer>
        <div className="video-container">
          <SmartMedia
            src="https://youtu.be/sBFeTzfXeu8"
            type="video"
            className="video-bg"
            autoPlay
            loop
            muted
            unmuteOnInteraction={false}
          />
          <div className="hero-overlay" />
        </div>
        
        <StandardPageHeader
          tagline="Voice of the Wilderness"
          title="TRAVEL STORIES"
          statementContent={{
            thin: "Insights from the",
            bold: "Heart",
            accent: "of Bulusan"
          }}
          isStatic
        />

        <ControlsContainer className="controls-wrapper">
          <SearchBar>
            <Search size={20} color="#888" />
            <input
              type="text"
              placeholder="Search stories, tips, guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            )}
          </SearchBar>

          <FilterAreaContainer>
            <SharedCategoryScroller
              categories={BLOG_CATEGORIES}
              activeCategories={selectedCategories}
              onSelect={setSelectedCategories}
            />
          </FilterAreaContainer>

          <button
            onClick={() => user ? setShowCreateModal(true) : setIsAuthPopupOpen(true)}
            style={{ marginLeft: 'auto', background: 'var(--cta-blue)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <Plus size={18} /> Share Your Story
          </button>
        </ControlsContainer>
      </BlogHeroContainer>

      {searchQuery === '' && selectedCategories.length === 0 && filteredPosts.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <SectionHeader
            subtitle="Editor's Choice"
            title={<>Featured <span style={{ color: 'var(--cta-blue)' }}>Stories</span></>}
          />
          <CentricCarousel
            items={filteredPosts.slice(0, 5)}
            renderItem={(post) => (
              <DiscoveryCard
                image={post.image}
                category={post.category}
                title={post.title}
                description={post.excerpt}
                location={`By ${post.authorName || 'Anonymous'}`}
                $noAnimate
                onClick={() => setSelectedPost(post)}
              />
            )}
          />
        </div>
      )}

      <div style={{ gridColumn: '1/-1', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', marginBottom: '8px' }}>
        <SectionHeader
          subtitle="Latest News"
          title="Bulusan Chronicles"
        />
      </div>

      <BlogGrid>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', color: '#888' }}>
            Reading the latest stories...
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post: any, i: number) => (
            <DiscoveryCard
              key={post.id}
              index={i}
              image={post.image}
              category={post.category}
              title={post.title}
              description={post.excerpt}
              location={post.authorName || 'Anonymous'}
              rating={undefined}
              onClick={() => setSelectedPost(post)}
            />
          ))
        ) : (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', background: 'rgba(255,255,255,0.7)', borderRadius: '32px', border: '1px solid #eee' }}>
            <h2 style={{ color: '#2e75b6', marginBottom: '16px' }}>Bulusan Stories Coming Soon!</h2>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>No stories have been shared yet. Be the first to share your Bulusan adventure!</p>
            <button
              onClick={() => {
                if (!user) {
                  setIsAuthPopupOpen(true);
                } else {
                  setShowCreateModal(true);
                }
              }}
              style={{ marginTop: '32px', padding: '12px 32px', background: '#2e75b6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Start Writing
            </button>
          </div>
        )}
      </BlogGrid>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}>
            <CreateModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}>
              <h2>Share Your Bulusan Story</h2>
              <form onSubmit={handleCreatePost}>
                <div className="field">
                  <label>Title</label>
                  <input required placeholder="Your adventure title" value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} />
                </div>
                <div className="field">
                  <label>Category</label>
                  <select value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })}>
                    <option>Travel Guide</option>
                    <option>Adventure</option>
                    <option>Food & Culture</option>
                    <option>Nature</option>
                  </select>
                </div>
                <div className="field">
                  <label>Brief Excerpt</label>
                  <input required placeholder="A short summary" value={newPost.excerpt} onChange={e => setNewPost({ ...newPost, excerpt: e.target.value })} />
                </div>
                <div className="field">
                  <label>Content</label>
                  <textarea required placeholder="Write your story here..." style={{ minHeight: '150px' }} value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} />
                </div>
                <div className="field">
                  <label>Cover Photo</label>
                  <FileUploader onFileSelect={setPostImage} accept="image/*" label="Drop your adventure photo" />
                </div>
                <button type="submit" className="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading & Sharing...' : 'Submit Story'}
                </button>
              </form>
            </CreateModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Full Post Reader Modal */}
      {selectedPost && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPost(null)}
        >
          <FullPostModal
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hero">
              <div className="close-btn" onClick={() => setSelectedPost(null)}>×</div>
              <img src={selectedPost.image} alt={selectedPost.title} />
              <div className="overlay" />
            </div>

            <div className="content-body">
              <span className="tag">{selectedPost.category}</span>
              <h2>{selectedPost.title}</h2>
              <div className="meta">
                <span>By {selectedPost.authorName || 'Anonymous'}</span>
                <span>•</span>
                <span>{selectedPost.date}</span>
                <span>•</span>
                <span>8 min read</span>
              </div>

              <div className="text">
                <p>{selectedPost.excerpt} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <h4>The Journey Begins</h4>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
                <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
              </div>
            </div>

            <div className="related">
              <h4>You Might Also Like</h4>
              <div className="grid">
                {blogPosts.filter(p => p.id !== selectedPost.id).slice(0, 2).map(p => (
                  <div className="item" key={p.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPost(p)}>
                    <img src={p.image} alt={p.title} />
                    <h5>{p.title}</h5>
                  </div>
                ))}
              </div>
            </div>
          </FullPostModal>
        </ModalOverlay>
      )}

      <AuthGuardPopup
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        actionName="share your travel stories"
      />
    </PageContainer>
  );
};

export default BlogPage;
