import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FLIGHT_MODES = ['horizontal', 'diagonal-up', 'diagonal-down', 'vertical-launch'];

export default function FlyingRocket() {
  const [active, setActive] = useState(false);
  const [flightMode, setFlightMode] = useState('horizontal');
  const canvasRef = useRef(null);
  const rocketRef = useRef({ x: -100, y: 300 });
  const particlesRef = useRef([]);

  // Trigger a new flight event every 22 seconds
  useEffect(() => {
    const triggerFlight = () => {
      if (active) return;
      const modes = FLIGHT_MODES;
      const chosenMode = modes[Math.floor(Math.random() * modes.length)];
      setFlightMode(chosenMode);
      setActive(true);
    };

    // Initial trigger after 4 seconds, then loop
    const initialTimeout = setTimeout(triggerFlight, 4000);
    const interval = setInterval(triggerFlight, 22000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [active]);

  // Handle exhaust particle drawing
  useEffect(() => {
    if (!active) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let frameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = particlesRef.current;

    // Monitor rocket DOM element coordinates
    const updateParticles = () => {
      const rocketEl = document.querySelector('.bg-flying-rocket-element');
      if (rocketEl) {
        const rect = rocketEl.getBoundingClientRect();
        const rx = rect.left + rect.width / 2;
        const ry = rect.top + rect.height / 2;
        
        rocketRef.current = { x: rx, y: ry };

        // Emit engine flame particles
        if (Math.random() < 0.6) {
          // Angle of particle spray depends on flight mode
          let vx = -1.5;
          let vy = 0.5;
          
          if (flightMode === 'vertical-launch') {
            vx = (Math.random() - 0.5) * 0.8;
            vy = 3.0; // blast downwards
          } else if (flightMode === 'diagonal-up') {
            vx = -2.0;
            vy = 1.0;
          } else if (flightMode === 'diagonal-down') {
            vx = -2.0;
            vy = -1.0;
          } else {
            // horizontal
            vx = -2.5;
            vy = (Math.random() - 0.5) * 0.6;
          }

          particles.push({
            x: rx,
            y: ry,
            vx: vx + (Math.random() - 0.5) * 0.5,
            vy: vy + (Math.random() - 0.5) * 0.5,
            size: Math.random() * 5 + 2,
            color: Math.random() > 0.5 ? '#f97316' : '#ea580c', // Orange exhaust fire
            alpha: 0.9,
            decay: Math.random() * 0.02 + 0.015,
          });
        }
      }

      // Draw exhaust particles
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        
        // Draw fire glowing circles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      frameId = requestAnimationFrame(updateParticles);
    };

    updateParticles();

    return () => {
      cancelAnimationFrame(frameId);
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [active, flightMode]);

  // Motion paths based on modes
  const getMotionProps = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    switch (flightMode) {
      case 'vertical-launch':
        return {
          initial: { x: w * 0.5, y: h + 100, rotate: -90 },
          animate: { x: w * 0.5, y: -150, rotate: -90 },
          transition: { duration: 6, ease: 'easeInOut' }
        };
      case 'diagonal-up':
        return {
          initial: { x: -100, y: h * 0.8, rotate: -25 },
          animate: { x: w + 150, y: h * 0.2, rotate: -25 },
          transition: { duration: 11, ease: 'linear' }
        };
      case 'diagonal-down':
        return {
          initial: { x: -100, y: h * 0.1, rotate: 25 },
          animate: { x: w + 150, y: h * 0.7, rotate: 25 },
          transition: { duration: 11, ease: 'linear' }
        };
      case 'horizontal':
      default:
        return {
          initial: { x: -100, y: h * 0.45, rotate: 0 },
          animate: { x: w + 150, y: h * 0.45, rotate: 0 },
          transition: { duration: 14, ease: 'linear' }
        };
    }
  };

  const motionProps = getMotionProps();

  return (
    <>
      {active && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            className="bg-flying-rocket-element"
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={{ opacity: 0 }}
            transition={motionProps.transition}
            onAnimationComplete={() => setActive(false)}
            style={{
              position: 'fixed',
              zIndex: -1,
              pointerEvents: 'none',
              width: '80px',
              height: '80px',
            }}
          >
            {/* SVG Rocket */}
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ transform: 'rotate(90deg)' }} // point to the right as base
            >
              {/* Rocket Flame */}
              <path
                d="M12 32C12 32 3 35 1 32C3 29 12 32 12 32Z"
                fill="#fb923c"
              />
              <path
                d="M10 32C10 32 5 33.5 4 32C5 30.5 10 32 10 32Z"
                fill="#facc15"
              />

              {/* Rocket Fins */}
              <path
                d="M20 20L10 14V22L20 20Z"
                fill="#7c3aed"
                stroke="#c084fc"
                strokeWidth="1"
              />
              <path
                d="M20 44L10 50V42L20 44Z"
                fill="#7c3aed"
                stroke="#c084fc"
                strokeWidth="1"
              />

              {/* Rocket Body */}
              <path
                d="M12 32C12 22 20 18 36 18C48 18 56 26 58 32C56 38 48 46 36 46C20 46 12 42 12 32Z"
                fill="url(#rocketBodyGrad)"
                stroke="#818cf8"
                strokeWidth="1.2"
              />

              {/* Rocket Nose Cone */}
              <path
                d="M44 20C47 23 54 28 58 32C54 36 47 41 44 44C49 39 49 25 44 20Z"
                fill="#ec4899"
              />

              {/* Glass Window */}
              <circle
                cx="34"
                cy="32"
                r="4.5"
                fill="#e0e7ff"
                stroke="#4f46e5"
                strokeWidth="1"
              />
              <circle
                cx="33"
                cy="31"
                r="1.8"
                fill="#ffffff"
              />

              {/* Thruster Rings */}
              <rect
                x="12"
                y="27"
                width="3"
                height="10"
                rx="1"
                fill="#312e81"
              />

              <defs>
                <linearGradient id="rocketBodyGrad" x1="12" y1="32" x2="58" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e0e7ff" />
                  <stop offset="50%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
