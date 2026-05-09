import React, { useEffect, useRef } from 'react';
import { getMediaUrl } from '../../utils/mediaUtils';

interface SmartMediaProps {
  src: string;
  type: 'img' | 'video';
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  poster?: string;
  unmuteOnInteraction?: boolean;
  onEnded?: () => void;
}

let globalHasInteracted = false;
const interactionEvents = ['mousedown', 'touchstart', 'scroll', 'keydown'];

if (typeof window !== 'undefined') {
  const setInteracted = () => {
    globalHasInteracted = true;
    window.dispatchEvent(new Event('user-interacted'));
    interactionEvents.forEach(e => window.removeEventListener(e, setInteracted));
  };
  interactionEvents.forEach(e => window.addEventListener(e, setInteracted));
}

const SmartMedia: React.FC<SmartMediaProps> = ({
  src,
  type,
  alt,
  className,
  style,
  controls,
  autoPlay,
  muted,
  loop,
  poster,
  unmuteOnInteraction,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fix React's muted prop bug — React doesn't reliably set .muted on the DOM element.
  // Solution: set it directly after mount.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.muted = !!muted;
    el.defaultMuted = !!muted;

    if (autoPlay) {
      el.load();
    }

    if (unmuteOnInteraction && muted) {
      if (globalHasInteracted) {
        el.muted = false;
      } else {
        const unmute = () => { el.muted = false; };
        window.addEventListener('user-interacted', unmute, { once: true });
        return () => window.removeEventListener('user-interacted', unmute);
      }
    }
  }, [src]);

  const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
  
  if (isYouTube && type === 'video') {
    const getYouTubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    const videoId = getYouTubeId(src);
    
    if (videoId) {
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&enablejsapi=1`;

      return (
        <div className={className} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0, ...style }}>
          <iframe
            src={embedUrl}
            style={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '56.25vw', // 16:9 aspect ratio
              minHeight: '100vh',
              minWidth: '177.77vh', // 16:9 aspect ratio
              transform: 'translate(-50%, -50%) scale(1.1)',
              border: 'none', 
              pointerEvents: 'none',
              opacity: 1,
              visibility: 'visible'
            }}
            title="YouTube background video"
            allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
            loading="eager"
          />
        </div>
      );
    }
  }

  if (type === 'img') {
    return (
      <img
        src={getMediaUrl(src)}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      src={getMediaUrl(src)}
      className={className}
      style={style}
      controls={controls}
      autoPlay={autoPlay}
      muted={!!muted}
      loop={loop}
      poster={poster}
      playsInline
      preload="metadata"
      onEnded={onEnded}
    />
  );
};

export default SmartMedia;
