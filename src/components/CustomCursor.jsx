import { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, vx: 0, vy: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef([]);

  // Spring physics for smooth movement
  const springConfig = { damping: 30, stiffness: 220, mass: 0.8 };
  const cursorX = useSpring(0, springConfig);
  const cursorY = useSpring(0, springConfig);

  useEffect(() => {
    const mouse = mouseRef.current;
    const cursor = cursorRef.current;

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Global hover detection for interactive elements
    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;
      
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .google-btn, .account-item-btn, .secondary-btn, .gradient-btn, .nav-shell a');
      if (isInteractive) {
        setIsHovered(true);
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (!target) return;

      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .google-btn, .account-item-btn, .secondary-btn, .gradient-btn, .nav-shell a');
      if (isInteractive) {
        setIsHovered(false);
      }
    };

    // Click particle burst
    const handleMouseDown = () => {
      spawnClickExplosion(mouse.x, mouse.y);
    };

    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('mousedown', handleMouseDown);

    // Hide original cursor
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        cursor: none !important;
      }
      body {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    // Canvas particle engine loop
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext('2d') : null;
    let animationFrameId;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Click explosion generator
    const spawnClickExplosion = (x, y) => {
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 4 + 2,
          color: i % 3 === 0 ? '#fb923c' : i % 2 === 0 ? '#a855f7' : '#00d4ff', // orange, purple, cyan
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.015,
        });
      }
    };

    // Core Animation loop for particles & cursor dynamics
    const tick = () => {
      // Calculate velocity and tilt angle
      mouse.vx = mouse.x - mouse.lastX;
      mouse.vy = mouse.y - mouse.lastY;

      // Update spring values
      cursorX.set(mouse.x);
      cursorY.set(mouse.y);

      // Smooth rotation based on movement direction
      if (Math.abs(mouse.vx) > 0.5 || Math.abs(mouse.vy) > 0.5) {
        const angle = Math.atan2(mouse.vy, mouse.vx) * (180 / Math.PI);
        // Tilt subtly (cap at 25 degrees)
        const targetTilt = Math.max(-25, Math.min(25, mouse.vx * 1.5));
        setRotation(targetTilt);

        // Spawn trailing sparkles while moving
        if (Math.random() < 0.4 && canvas) {
          particlesRef.current.push({
            x: cursorX.get(),
            y: cursorY.get() + 5, // offset slightly
            vx: -mouse.vx * 0.2 + (Math.random() - 0.5) * 0.5,
            vy: -mouse.vy * 0.2 + 1.2 + (Math.random() - 0.5) * 0.5, // slight downward drift
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#f59e0b' : '#ec4899', // Orange or Pink rocket fire
            alpha: 0.8,
            decay: Math.random() * 0.04 + 0.02,
          });
        }
      } else {
        // Return to 0 rotation slowly
        setRotation(prev => prev * 0.8);
      }

      mouse.lastX = mouse.x;
      mouse.lastY = mouse.y;

      // Draw trails on Canvas
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const particles = particlesRef.current;

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
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      document.head.removeChild(style);
    };
  }, [cursorX, cursorY, isVisible]);

  // Sync cursor coordinates to standard state for spring rendering
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    const unsubX = cursorX.on('change', (v) => setPosX(v));
    const unsubY = cursorY.on('change', (v) => setPosY(v));
    return () => {
      unsubX();
      unsubY();
    };
  }, [cursorX, cursorY]);

  if (!isVisible) return null;

  return (
    <>
      {/* Particle trail canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />

      {/* Toy Cursor (Cute UFO/Rocket) */}
      <motion.div
        style={{
          position: 'fixed',
          left: posX,
          top: posY,
          x: '-50%',
          y: '-50%',
          zIndex: 9999,
          pointerEvents: 'none',
          transformOrigin: 'center center',
        }}
        animate={{
          scale: isHovered ? 1.4 : 1.0,
          rotate: rotation + (isHovered ? 360 : 0),
        }}
        transition={
          isHovered 
            ? { scale: { type: 'spring', stiffness: 300, damping: 15 }, rotate: { duration: 0.6, ease: 'easeOut' } }
            : { scale: { type: 'spring', stiffness: 200, damping: 20 }, rotate: { type: 'spring', damping: 20 } }
        }
      >
        {/* Animated UFO Wrapper */}
        <div className="toy-cursor-wrapper">
          {/* Subtle floating/bounce animation using pure CSS class */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="toy-ufo-svg"
          >
            {/* UFO Outer Ring (Glass dome back glow) */}
            <ellipse cx="16" cy="19" rx="13" ry="5" fill="rgba(168, 85, 247, 0.4)" />
            
            {/* Glass Cockpit Dome */}
            <path
              d="M10 17C10 11.5 12.5 9 16 9C19.5 9 22 11.5 22 17H10Z"
              fill="url(#ufoDomeGrad)"
              stroke="#818cf8"
              strokeWidth="0.8"
            />
            
            {/* Little Alien / Astronaut inside dome */}
            <circle cx="16" cy="14" r="2.2" fill="#4ade80" />
            <path d="M14.5 17C14.5 15.5 15.2 15 16 15C16.8 15 17.5 15.5 17.5 17H14.5Z" fill="#4ade80" />
            
            {/* UFO Metallic Saucer Body */}
            <ellipse cx="16" cy="18.5" rx="14" ry="4.5" fill="url(#ufoBodyGrad)" stroke="#4f46e5" strokeWidth="1" />
            
            {/* Thrusters / Lights on Saucer */}
            <circle cx="7" cy="18.5" r="1" fill="#facc15" className="ufo-light-blink-1" />
            <circle cx="11" cy="20" r="1" fill="#38bdf8" className="ufo-light-blink-2" />
            <circle cx="16" cy="20.5" r="1" fill="#ec4899" className="ufo-light-blink-3" />
            <circle cx="21" cy="20" r="1" fill="#38bdf8" className="ufo-light-blink-2" />
            <circle cx="25" cy="18.5" r="1" fill="#facc15" className="ufo-light-blink-1" />

            {/* Glowing Rocket Fire from below (only when moving) */}
            <path d="M14 23L16 28L18 23H14Z" fill="url(#ufoFireGrad)" />

            <defs>
              <linearGradient id="ufoDomeGrad" x1="16" y1="9" x2="16" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#312e81" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="ufoBodyGrad" x1="16" y1="14" x2="16" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="60%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <linearGradient id="ufoFireGrad" x1="16" y1="23" x2="16" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ec4899" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="toy-cursor-shadow" />
        </div>
      </motion.div>
    </>
  );
}
