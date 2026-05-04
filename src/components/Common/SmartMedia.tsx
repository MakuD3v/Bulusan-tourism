import React, { useEffect, useRef } from 'react';

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

  if (type === 'img') {
    return (
      <img
        src={src}
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
      src={src}
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
