import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Wind, EyeOff, Sparkles, ChevronDown } from 'lucide-react';

interface WeatherCanvasProps {
  weatherCode: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  isDay?: number; // 1 = day, 0 = night
  currentOverride?: string | null;
  onSelectOverride?: (override: string | null) => void;
}

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 25; /* above map tiles/canvas, below UI controls & markers */
  overflow: hidden;
`;

const ControlsCluster = styled.div`
  position: absolute;
  top: 14px;
  right: 56px; /* positioned neatly to the left of MapLibre NavigationControl */
  z-index: 35;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: auto;

  @media (max-width: 768px) {
    top: 60px;
    right: 14px;
  }
`;

const EffectsToggleBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(30, 58, 138, 0.7)' : 'rgba(15, 23, 42, 0.85)'};
  border: 1px solid ${p => p.$active ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.12)'};
  color: ${p => p.$active ? '#93c5fd' : '#94a3b8'};
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(37, 99, 235, 0.45);
    color: #ffffff;
    border-color: rgba(147, 197, 253, 0.8);
    transform: translateY(-1px);
  }
`;

const WeatherPresetBtn = styled.button<{ $active: boolean }>`
  background: ${p => p.$active ? 'rgba(234, 88, 12, 0.25)' : 'rgba(15, 23, 42, 0.85)'};
  border: 1px solid ${p => p.$active ? 'rgba(251, 146, 60, 0.6)' : 'rgba(255, 255, 255, 0.12)'};
  color: ${p => p.$active ? '#fdba74' : '#cbd5e1'};
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 0.68rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(249, 115, 22, 0.3);
    color: white;
  }
`;

const PresetDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
  z-index: 40;
`;

const PresetOption = styled.button<{ $selected: boolean }>`
  background: ${p => p.$selected ? 'rgba(59, 130, 246, 0.25)' : 'transparent'};
  border: 1px solid ${p => p.$selected ? 'rgba(96, 165, 250, 0.4)' : 'transparent'};
  color: ${p => p.$selected ? '#93c5fd' : '#cbd5e1'};
  font-size: 0.7rem;
  font-weight: 600;
  text-align: left;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: white;
  }
`;

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
}

interface WindStreak {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface FogBlob {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseOpacity: number;
  twinkleSpeed: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  weatherCode,
  windSpeed,
  windDirection,
  isDay = 1,
  currentOverride,
  onSelectOverride,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    return localStorage.getItem('bulusan_weather_effects') !== 'false';
  });
  const [showPresets, setShowPresets] = useState(false);

  const toggleEffects = () => {
    setEffectsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('bulusan_weather_effects', next.toString());
      return next;
    });
  };

  useEffect(() => {
    if (!effectsEnabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isTabVisible = true;

    // Accessibility check: Skip animation if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // High DPI Canvas Scaling with ResizeObserver
    let cssWidth = 0;
    let cssHeight = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const isMobile = window.innerWidth < 768;

    // ─────────────────────────────────────────────────────────────────────────
    // Weather Conditions Analysis
    // ─────────────────────────────────────────────────────────────────────────
    // 51-57: Drizzle | 61-67: Rain | 80-82: Showers | 95-99: Thunderstorm
    const isDrizzle = weatherCode >= 51 && weatherCode <= 57;
    const isRain = (weatherCode >= 61 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82);
    const isThunderstorm = weatherCode >= 95 && weatherCode <= 99;
    const hasPrecipitation = isDrizzle || isRain || isThunderstorm;

    // 45, 48: Fog
    const isFog = weatherCode === 45 || weatherCode === 48;

    // Wind streaks: active when wind >= 7 km/h and not blinding rain
    const hasWindStreaks = windSpeed >= 7;

    // Particle caps (strictly performant)
    const maxRainParticles = isThunderstorm
      ? (isMobile ? 120 : 260)
      : isRain
      ? (isMobile ? 75 : 170)
      : isDrizzle
      ? (isMobile ? 35 : 75)
      : 0;

    const maxWindStreaks = hasWindStreaks ? (isMobile ? 25 : 55) : 0;

    // Wind travel angle (meteorological wind direction is where it blows FROM)
    const travelAngleRad = ((windDirection + 180) % 360) * (Math.PI / 180);
    const windSpeedFactor = Math.max(windSpeed / 14, 0.5);

    // ── Generate Rain Particles ──────────────────────────────────────────────
    const rainParticles: RainDrop[] = [];
    const splashes: Splash[] = [];

    for (let i = 0; i < maxRainParticles; i++) {
      rainParticles.push({
        x: Math.random() * (cssWidth || window.innerWidth),
        y: Math.random() * (cssHeight || window.innerHeight),
        length: isThunderstorm ? 24 + Math.random() * 18 : isRain ? 16 + Math.random() * 12 : 8 + Math.random() * 6,
        speed: (isThunderstorm ? 17 : isRain ? 12 : 7) + Math.random() * 5,
        opacity: 0.35 + Math.random() * 0.45,
        width: isThunderstorm ? 1.7 : isRain ? 1.2 : 0.85,
      });
    }

    // ── Generate Wind Streaks ────────────────────────────────────────────────
    const windStreaks: WindStreak[] = [];
    for (let i = 0; i < maxWindStreaks; i++) {
      windStreaks.push({
        x: Math.random() * (cssWidth || window.innerWidth),
        y: Math.random() * (cssHeight || window.innerHeight),
        length: (40 + Math.random() * 70) * (windSpeed / 20 + 0.6),
        speed: (windSpeed / 5 + 2) + Math.random() * 3,
        opacity: 0.12 + Math.random() * 0.2,
      });
    }

    // ── Generate Fog Blobs ───────────────────────────────────────────────────
    const fogBlobs: FogBlob[] = [];
    if (isFog) {
      const count = isMobile ? 6 : 14;
      for (let i = 0; i < count; i++) {
        fogBlobs.push({
          x: Math.random() * (cssWidth || window.innerWidth),
          y: Math.random() * (cssHeight || window.innerHeight),
          radius: 140 + Math.random() * 190,
          speedX: 0.25 + Math.random() * 0.45,
          opacity: 0.12 + Math.random() * 0.14,
        });
      }
    }

    // ── Generate Night Stars ─────────────────────────────────────────────────
    const stars: Star[] = [];
    if (isDay === 0 && !hasPrecipitation && !isFog) {
      const count = isMobile ? 25 : 60;
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * (cssWidth || window.innerWidth),
          y: Math.random() * (cssHeight || window.innerHeight) * 0.65,
          radius: 0.7 + Math.random() * 1.3,
          baseOpacity: 0.3 + Math.random() * 0.5,
          twinkleSpeed: 0.02 + Math.random() * 0.04,
        });
      }
    }

    // ── Lightning State for Thunderstorm ─────────────────────────────────────
    let lightningFlash = 0;
    let lightningBolt: { x1: number; y1: number; segments: { x: number; y: number }[] } | null = null;
    let nextLightningTime = Date.now() + 3000 + Math.random() * 6000;

    const triggerLightning = (w: number, h: number) => {
      lightningFlash = 0.55 + Math.random() * 0.35;
      const startX = w * (0.2 + Math.random() * 0.6);
      const segments: { x: number; y: number }[] = [];
      let curX = startX;
      let curY = 0;
      const segCount = 8 + Math.floor(Math.random() * 5);
      const stepY = (h * 0.75) / segCount;

      for (let s = 0; s < segCount; s++) {
        curX += (Math.random() - 0.5) * 50;
        curY += stepY + (Math.random() - 0.5) * 12;
        segments.push({ x: curX, y: curY });
      }

      lightningBolt = { x1: startX, y1: 0, segments };
      setTimeout(() => {
        lightningBolt = null;
      }, 130);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Animation Render Loop
    // ─────────────────────────────────────────────────────────────────────────
    let frameCount = 0;

    const render = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      frameCount++;
      const w = cssWidth || canvas.getBoundingClientRect().width;
      const h = cssHeight || canvas.getBoundingClientRect().height;

      ctx.clearRect(0, 0, w, h);

      // ── Ambient Day/Night Tint ──
      if (isDay === 0) {
        ctx.fillStyle = 'rgba(8, 15, 33, 0.28)';
        ctx.fillRect(0, 0, w, h);

        // Night stars twinkle
        if (stars.length > 0) {
          stars.forEach(s => {
            const alpha = s.baseOpacity + Math.sin(frameCount * s.twinkleSpeed) * 0.25;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      // ── Draw Fog Blobs ──
      if (isFog) {
        fogBlobs.forEach(blob => {
          blob.x += blob.speedX;
          if (blob.x - blob.radius > w) blob.x = -blob.radius;

          const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
          grad.addColorStop(0, `rgba(226, 232, 240, ${blob.opacity})`);
          grad.addColorStop(1, 'rgba(226, 232, 240, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ── Draw Wind Streaks ──
      if (hasWindStreaks) {
        const vx = Math.cos(travelAngleRad);
        const vy = Math.sin(travelAngleRad);

        windStreaks.forEach(s => {
          s.x += vx * s.speed * windSpeedFactor;
          s.y += vy * s.speed * windSpeedFactor;

          if (s.x > w + 100) s.x = -100;
          if (s.x < -100) s.x = w + 100;
          if (s.y > h + 100) s.y = -100;
          if (s.y < -100) s.y = h + 100;

          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(186, 230, 253, ${s.opacity})`;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + vx * s.length, s.y + vy * s.length);
          ctx.stroke();
        });
      }

      // ── Draw Rain Drops & Splashes ──
      if (hasPrecipitation) {
        const slantX = Math.cos(travelAngleRad) * (windSpeed / 10);

        rainParticles.forEach(p => {
          p.x += slantX;
          p.y += p.speed;

          if (p.y > h) {
            // Drop hit bottom: spawn small splash ring
            if (splashes.length < 25 && Math.random() < 0.3) {
              splashes.push({
                x: p.x,
                y: h - 3,
                radius: 1,
                maxRadius: 4 + Math.random() * 4,
                opacity: 0.5,
              });
            }
            p.y = -p.length;
            p.x = Math.random() * w;
          }
          if (p.x > w) p.x = 0;
          if (p.x < 0) p.x = w;

          ctx.lineWidth = p.width;
          ctx.strokeStyle = `rgba(147, 197, 253, ${p.opacity})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + slantX * 1.4, p.y + p.length);
          ctx.stroke();
        });

        // Animate splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.radius += 0.45;
          sp.opacity -= 0.045;
          if (sp.opacity <= 0 || sp.radius >= sp.maxRadius) {
            splashes.splice(i, 1);
          } else {
            ctx.strokeStyle = `rgba(186, 230, 253, ${sp.opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      // ── Draw Thunderstorm Lightning ──
      if (isThunderstorm) {
        const now = Date.now();
        if (now > nextLightningTime) {
          triggerLightning(w, h);
          nextLightningTime = now + 4000 + Math.random() * 6000;
        }

        // Screen Flash
        if (lightningFlash > 0.02) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
          ctx.fillRect(0, 0, w, h);
          lightningFlash *= 0.8; // fast decay
        }

        // Jagged Bolt
        if (lightningBolt) {
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.4;
          ctx.shadowColor = '#60a5fa';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.moveTo(lightningBolt.x1, lightningBolt.y1);
          lightningBolt.segments.forEach(seg => {
            ctx.lineTo(seg.x, seg.y);
          });
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [weatherCode, windSpeed, windDirection, isDay, effectsEnabled]);

  const presets = [
    { id: null, label: '🌐 Live Bulusan' },
    { id: 'thunderstorm', label: '⚡ Thunderstorm' },
    { id: 'rain', label: '🌧 Heavy Rain' },
    { id: 'drizzle', label: '🌦 Light Drizzle' },
    { id: 'fog', label: '🌫 Mountain Fog' },
    { id: 'clear', label: '☀️ Sunny & Wind' },
    { id: 'night', label: '🌙 Clear Night' },
  ];

  return (
    <>
      <CanvasWrapper>
        {effectsEnabled && <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />}
      </CanvasWrapper>

      <ControlsCluster>
        {/* Toggle Canvas Effects */}
        <EffectsToggleBtn
          $active={effectsEnabled}
          onClick={toggleEffects}
          title="Toggle live weather canvas animations on the map"
        >
          {effectsEnabled ? (
            <>
              <Wind size={12} /> Effects: On
            </>
          ) : (
            <>
              <EyeOff size={12} /> Effects: Off
            </>
          )}
        </EffectsToggleBtn>

        {/* Live Weather Simulator Dropdown */}
        {onSelectOverride && (
          <div style={{ position: 'relative' }}>
            <WeatherPresetBtn
              $active={Boolean(currentOverride)}
              onClick={() => setShowPresets(prev => !prev)}
              title="Test dynamic weather effects"
            >
              <Sparkles size={11} />
              {currentOverride
                ? presets.find(p => p.id === currentOverride)?.label || 'Custom'
                : 'Weather Mode'}
              <ChevronDown size={10} />
            </WeatherPresetBtn>

            {showPresets && (
              <PresetDropdown>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94a3b8', padding: '4px 8px', textTransform: 'uppercase' }}>
                  Weather Simulator
                </div>
                {presets.map(p => (
                  <PresetOption
                    key={p.label}
                    $selected={currentOverride === p.id}
                    onClick={() => {
                      onSelectOverride(p.id);
                      setShowPresets(false);
                    }}
                  >
                    {p.label}
                  </PresetOption>
                ))}
              </PresetDropdown>
            )}
          </div>
        )}
      </ControlsCluster>
    </>
  );
};

export default WeatherCanvas;
