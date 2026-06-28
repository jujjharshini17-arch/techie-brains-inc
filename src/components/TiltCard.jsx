import { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function TiltCard({ children, className = '', onClick }) {
  const cardRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  // Smooth springs for tilt rotation
  const springConfig = { damping: 22, stiffness: 220 };
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  
  // Smooth springs for spotlight position
  const spotlightX = useSpring(0, springConfig);
  const spotlightY = useSpring(0, springConfig);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Rotate up to 10 degrees based on offset
    const rX = -((y - centerY) / centerY) * 10;
    const rY = ((x - centerX) / centerX) * 10;

    rotateX.set(rX);
    rotateY.set(rY);

    spotlightX.set(x);
    spotlightY.set(y);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`glass-card ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        position: 'relative',
        overflow: 'hidden',
      }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 250, damping: 20 }}
    >
      {/* Spotlight mouse glow element */}
      <motion.div
        className="card-spotlight-glow"
        style={{
          left: spotlightX,
          top: spotlightY,
          opacity: hovered ? 0.35 : 0,
        }}
      />

      {/* Content wrapper with relative positioning to keep z-index above spotlight */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </motion.div>
  );
}
