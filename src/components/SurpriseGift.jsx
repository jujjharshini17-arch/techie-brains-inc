import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';

export default function SurpriseGift() {
  const { showGift, giftTarget, closeGift } = useAppStore();
  const navigate = useNavigate();
  const [stage, setStage] = useState('closed'); // 'closed', 'shaking', 'opened', 'launched'
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!showGift) return;

    // Reset state
    setStage('closed');
    particlesRef.current = [];

    // Trigger animations sequence
    const shakeTimer = setTimeout(() => setStage('shaking'), 300);
    const openTimer = setTimeout(() => {
      setStage('opened');
      spawnGiftExplosion();
    }, 900);
    const launchTimer = setTimeout(() => setStage('launched'), 1300);
    const completeTimer = setTimeout(() => {
      // Navigate to target
      if (giftTarget) {
        navigate(giftTarget);
      }
      closeGift();
    }, 2400);

    return () => {
      clearTimeout(shakeTimer);
      clearTimeout(openTimer);
      clearTimeout(launchTimer);
      clearTimeout(completeTimer);
    };
  }, [showGift, giftTarget]);

  // Particle explosion drawing
  useEffect(() => {
    if (!showGift || stage === 'closed') return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04; // gravity drift downwards
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      frameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [showGift, stage]);

  const spawnGiftExplosion = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      particlesRef.current.push({
        x: cx,
        y: cy - 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // blast upwards slightly
        size: Math.random() * 5 + 2,
        color: i % 4 === 0 ? '#fb923c' : i % 3 === 0 ? '#ec4899' : i % 2 === 0 ? '#facc15' : '#00d4ff', // gold, pink, orange, cyan
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.012,
      });
    }
  };

  if (!showGift) return null;

  return (
    <>
      <div className="gift-overlay">
        {/* Particle Canvas */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 100001,
          }}
        />

        {/* Global screen glow on launch */}
        <AnimatePresence>
          {stage === 'opened' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="gift-glow"
            />
          )}
        </AnimatePresence>

        <div className="gift-box-card">
          <AnimatePresence>
            {stage !== 'launched' && (
              <motion.div
                initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
                animate={
                  stage === 'shaking'
                    ? {
                        scale: 1.0,
                        rotate: [0, -10, 10, -10, 10, 0],
                        y: [0, -5, 0, -5, 0],
                        opacity: 1,
                      }
                    : { scale: 1.0, rotate: 0, opacity: 1 }
                }
                exit={{ scale: 0.8, opacity: 0 }}
                transition={
                  stage === 'shaking'
                    ? { duration: 0.6, ease: 'easeInOut' }
                    : { type: 'spring', damping: 15, stiffness: 200 }
                }
                style={{ position: 'relative', width: '120px', height: '120px' }}
              >
                {/* Gift Lid */}
                <motion.svg
                  width="120"
                  height="40"
                  viewBox="0 0 120 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="gift-box-svg"
                  style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
                  animate={stage === 'opened' ? { y: -120, rotate: 45, opacity: 0 } : { y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {/* Lid shape */}
                  <rect x="5" y="10" width="110" height="20" rx="3" fill="#ec4899" stroke="#f472b6" strokeWidth="1" />
                  {/* Lid Ribbon */}
                  <rect x="50" y="10" width="20" height="20" fill="#facc15" />
                  {/* Ribbon Bow */}
                  <path d="M60 10C50 0 45 10 60 10Z" fill="#facc15" />
                  <path d="M60 10C70 0 75 10 60 10Z" fill="#facc15" />
                </motion.svg>

                {/* Gift Box Base */}
                <svg
                  width="110"
                  height="80"
                  viewBox="0 0 110 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="gift-box-svg"
                  style={{ position: 'absolute', top: 35, left: 5 }}
                >
                  <rect x="5" y="0" width="100" height="75" rx="4" fill="#a855f7" stroke="#c084fc" strokeWidth="1.2" />
                  {/* Base Ribbon */}
                  <rect x="45" y="0" width="20" height="75" fill="#facc15" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rocket Launching out of box */}
          <AnimatePresence>
            {(stage === 'opened' || stage === 'launched') && (
              <motion.div
                initial={{ y: 50, scale: 0.1, opacity: 0, rotate: -45 }}
                animate={{ y: -380, scale: 1.8, opacity: [1, 1, 0], rotate: -45 }}
                transition={{ duration: 1.1, ease: 'easeIn' }}
                style={{ position: 'absolute', zIndex: 100002 }}
              >
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  {/* Flame */}
                  <path d="M12 32C12 32 3 35 1 32C3 29 12 32 12 32Z" fill="#f97316" />
                  <path d="M10 32C10 32 5 33.5 4 32C5 30.5 10 32 10 32Z" fill="#facc15" />
                  {/* Body */}
                  <path d="M12 32C12 22 20 18 36 18C48 18 56 26 58 32C56 38 48 46 36 46C20 46 12 42 12 32Z" fill="url(#giftRocketGrad)" stroke="#818cf8" strokeWidth="1" />
                  {/* Fins */}
                  <path d="M20 20L10 14V22L20 20Z" fill="#ec4899" />
                  <path d="M20 44L10 50V42L20 44Z" fill="#ec4899" />
                  <defs>
                    <linearGradient id="giftRocketGrad" x1="12" y1="32" x2="58" y2="32" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#312e81" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold', textShadow: '0 0 10px rgba(168,85,247,0.5)' }}
          >
            {stage === 'closed' || stage === 'shaking'
              ? 'Opening surprise...'
              : 'Blasting Off!'}
          </motion.h2>
        </div>
      </div>
    </>
  );
}
