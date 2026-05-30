import styled from 'styled-components';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Send, CheckCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useState } from 'react';
import { dbService } from '../api/db';
import StandardPageHeader from '../components/Common/StandardPageHeader';

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

const HeroSection = styled.div`
  margin-bottom: 80px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: baseline;
  gap: 24px;
  flex-wrap: wrap;

  h1 {
    font-family: ${(props) => props.theme.fonts.heading};
    font-size: clamp(2.5rem, 8vw, 3.8rem);
    font-weight: 900;
    color: ${(props) => props.theme.colors.darkBlue};
    letter-spacing: -2px;
    line-height: 1;
  }

  h3 {
    font-family: 'Pacifico', cursive;
    font-size: 1.6rem;
    color: var(--cta-blue);
    font-weight: normal;
    opacity: 0.8;
  }
`;

const Tagline = styled.div`
  color: var(--cta-blue);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 4px;
  font-size: 0.75rem;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 64px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 48px;
  }
`;

const LeftCol = styled.div`
  flex: 1;

  .description { 
    font-size: 1.15rem; 
    color: ${(props) => props.theme.colors.textDark}; 
    line-height: 1.8; 
    margin-bottom: 48px;
    opacity: 0.8;
  }

  .info-blocks {
    display: flex;
    flex-direction: column;
    gap: 24px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .icon-box {
        width: 48px; height: 48px; border-radius: 50%; background: rgba(30, 136, 229, 0.1);
        display: flex; align-items: center; justify-content: center; color: var(--cta-blue);
      }
      
      div {
        h4 { color: var(--dark-blue); font-size: 1.1rem; margin-bottom: 4px; }
        span { color: #666; font-size: 0.95rem; }
      }
    }
  }

  .map-container {
    margin-top: 48px;
    height: 300px;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  }
`;

const RightCol = styled.div`
  flex: 1;
`;

const GlassForm = styled(motion.form)`
  background: ${(props) => props.theme.glass.background};
  backdrop-filter: ${(props) => props.theme.glass.filter};
  border: ${(props) => props.theme.glass.border};
  padding: 56px;
  border-radius: 40px;
  box-shadow: ${(props) => props.theme.glass.shadow};

  h2 { 
    font-size: 2.2rem; 
    color: var(--dark-blue); 
    margin-bottom: 32px; 
    font-family: ${(props) => props.theme.fonts.heading}; 
    font-weight: 900;
  }

  .input-group {
    margin-bottom: 24px;
    label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem; color: #555; }
    input, textarea {
      width: 100%;
      padding: 16px;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 12px;
      background: rgba(255,255,255,0.9);
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;

      &:focus { border-color: var(--cta-blue); box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.1); }
    }
    textarea { height: 150px; resize: none; }
  }

  button {
    width: 100%;
    padding: 14px 44px;
    background: var(--cta-blue);
    color: white;
    border: none;
    border-radius: 40px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 8px 16px rgba(46, 117, 182, 0.2);

    &:hover { 
      background: var(--primary-blue);
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(46, 117, 182, 0.3);
    }
  }
`;

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    try {
      // 1. Save to Database
      await dbService.add('inquiries', {
        sender: formData.name,
        email: formData.email,
        subject: `General Inquiry from ${formData.name}`,
        message: formData.message,
        date: new Date().toISOString(),
        status: 'New'
      });

      // 2. Direct Email Link (Removed as per user request)

      setSent(true);
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      alert('Failed to send inquiry. Please try again or call our direct line.');
    }
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <HeroSection>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Tagline>Bulusan Tourism Office</Tagline>
          <TitleGroup>
            <h1>Get in Touch</h1>
            <h3>Send us a Message</h3>
          </TitleGroup>
        </motion.div>

        <motion.p
          className="description"
          style={{ maxWidth: '800px', fontSize: '1.2rem', color: '#666', lineHeight: '1.8', margin: '16px 0 0 0' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Planning your journey to the heart of Sorsogon? Our dedicated team is ready to assist you in mapping out the perfect Bulusan adventure.
        </motion.p>
      </HeroSection>

      <ContentWrapper>
        <LeftCol>

          <div className="info-blocks">
            <div className="info-item">
              <div className="icon-box"><MapPin /></div>
              <div><h4>Tourism Sanctuary</h4><span>Municipal Hall, Bulusan, Sorsogon</span></div>
            </div>
            <div className="info-item">
              <div className="icon-box"><Phone /></div>
              <div><h4>Direct Line</h4><span>+63 912 345 6789</span></div>
            </div>
            <div className="info-item">
              <div className="icon-box"><Mail /></div>
              <div><h4>Support Email</h4><span>info@bulusantourism.ph</span></div>
            </div>
          </div>

          <div className="map-container">
            <MapContainer center={[12.7533, 124.1362]} zoom={15} style={{ height: '100%', width: '100%', zIndex: 1 }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Marker position={[12.7533, 124.1362]}>
                <Popup>Bulusan Tourism Office</Popup>
              </Marker>
            </MapContainer>
          </div>
        </LeftCol>

        <RightCol>
          <GlassForm
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            onSubmit={handleSubmit}
          >
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <CheckCircle size={64} color="#2ecc71" style={{ marginBottom: 24 }} />
                <h2 style={{ marginBottom: 12 }}>Message Sent!</h2>
                <p style={{ color: '#666' }}>We've received your inquiry and our team will get back to you shortly.</p>
                <button onClick={() => setSent(false)} style={{ marginTop: 24, padding: '12px 24px', background: 'var(--cta-blue)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer' }}>Send Another</button>
              </div>
            ) : (
              <>
                <div className="input-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Juan Dela Cruz" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="juan@example.com" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Message</label>
                  <textarea 
                    placeholder="How can we help you?" 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>
                <button type="submit">Send Message <Send size={18} /></button>
              </>
            )}
          </GlassForm>
        </RightCol>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ContactPage;
