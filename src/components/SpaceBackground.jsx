import { useEffect, useRef } from 'react';

export default function SpaceBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Star configuration
    const stars = [];
    const numStars = Math.min(Math.floor((width * height) / 8000), 180);

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
        color: i % 5 === 0 ? 'rgba(168, 85, 247, ' : i % 8 === 0 ? 'rgba(59, 130, 246, ' : 'rgba(255, 255, 255, ',
        parallax: Math.random() * 0.15 + 0.05,
      });
    }

    // Space Dust Particles
    const dustParticles = [];
    const numDust = 40;
    for (let i = 0; i < numDust; i++) {
      dustParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: i % 2 === 0 ? '#d946ef' : '#3b82f6', // Pink or Blue glow
      });
    }

    // Planets Configuration
    const planets = [
      {
        x: width * 0.15,
        y: height * 0.25,
        radius: 45,
        color1: '#818cf8',
        color2: '#4f46e5',
        ring: true,
        ringColor: 'rgba(129, 140, 248, 0.4)',
        ringAngle: 0.2,
        driftX: 0.02,
        driftY: 0.01,
        initialX: width * 0.15,
        initialY: height * 0.25,
      },
      {
        x: width * 0.85,
        y: height * 0.65,
        radius: 65,
        color1: '#ec4899',
        color2: '#be185d',
        ring: false,
        driftX: -0.015,
        driftY: 0.02,
        initialX: width * 0.85,
        initialY: height * 0.65,
      },
      {
        x: width * 0.5,
        y: height * 0.8,
        radius: 25,
        color1: '#fb923c',
        color2: '#ea580c',
        ring: true,
        ringColor: 'rgba(251, 146, 60, 0.35)',
        ringAngle: -0.3,
        driftX: 0.01,
        driftY: -0.015,
        initialX: width * 0.5,
        initialY: height * 0.8,
      }
    ];

    // Shooting Stars
    const shootingStars = [];
    const spawnShootingStar = () => {
      if (shootingStars.length < 2 && Math.random() < 0.004) {
        shootingStars.push({
          x: Math.random() * width * 0.6,
          y: 0,
          length: Math.random() * 80 + 50,
          speed: Math.random() * 8 + 6,
          angle: Math.PI / 6 + (Math.random() - 0.5) * 0.1,
          thickness: Math.random() * 2 + 0.8,
          opacity: 1,
        });
      }
    };

    // Parallax mouse variables
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      // Update planets initial positions
      planets[0].initialX = width * 0.15;
      planets[0].initialY = height * 0.25;
      planets[1].initialX = width * 0.85;
      planets[1].initialY = height * 0.65;
      planets[2].initialX = width * 0.5;
      planets[2].initialY = height * 0.8;
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse easing for parallax
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // 1. Draw Nebula Background (CSS radial gradients do most, canvas adds highlights)
      const grad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width);
      grad.addColorStop(0, 'rgba(15, 10, 36, 0.2)');
      grad.addColorStop(0.5, 'rgba(8, 5, 24, 0.4)');
      grad.addColorStop(1, 'rgba(3, 4, 12, 0.9)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Twinkling Stars
      stars.forEach((star) => {
        star.phase += star.twinkleSpeed;
        const opacity = (Math.sin(star.phase) + 1) / 2 * 0.7 + 0.3;
        ctx.fillStyle = `${star.color}${opacity})`;
        
        // Render star with parallax offset
        const sx = star.x + mouseX * star.parallax;
        const sy = star.y + mouseY * star.parallax;

        // Wrap stars around screen boundaries
        const wrappedX = (sx + width) % width;
        const wrappedY = (sy + height) % height;

        ctx.beginPath();
        ctx.arc(wrappedX, wrappedY, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Space Dust Particles
      dustParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Reset if goes off screen
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x + mouseX * 0.02, p.y + mouseY * 0.02, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 4. Draw Floating Planets
      planets.forEach((p) => {
        // Drift planets slowly over time
        p.initialX += p.driftX;
        p.initialY += p.driftY;

        // Wrap around boundary limits
        if (p.initialX < -p.radius * 2) p.initialX = width + p.radius * 2;
        if (p.initialX > width + p.radius * 2) p.initialX = -p.radius * 2;
        if (p.initialY < -p.radius * 2) p.initialY = height + p.radius * 2;
        if (p.initialY > height + p.radius * 2) p.initialY = -p.radius * 2;

        const px = p.initialX + mouseX * 0.15;
        const py = p.initialY + mouseY * 0.15;

        // Draw planet shadow/glow back
        ctx.beginPath();
        ctx.arc(px, py, p.radius + 15, 0, Math.PI * 2);
        const glowGrad = ctx.createRadialGradient(px, py, p.radius, px, py, p.radius + 15);
        glowGrad.addColorStop(0, p.color1 + '33');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Draw Planet Body
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(px - p.radius * 0.3, py - p.radius * 0.3, p.radius * 0.1, px, py, p.radius);
        bodyGrad.addColorStop(0, p.color1);
        bodyGrad.addColorStop(1, p.color2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Draw Rings if applicable
        if (p.ring) {
          ctx.strokeStyle = p.ringColor;
          ctx.lineWidth = p.radius * 0.12;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.ringAngle);
          ctx.scale(2.2, 0.35); // flatten ring oval
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      });

      // 5. Draw Shooting Stars
      spawnShootingStar();
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${ss.opacity})`;
        ctx.lineWidth = ss.thickness;
        
        // Draw head glow
        const ssGrad = ctx.createLinearGradient(
          ss.x, ss.y, 
          ss.x - Math.cos(ss.angle) * ss.length, 
          ss.y - Math.sin(ss.angle) * ss.length
        );
        ssGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        ssGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.6)'); // Purple aura
        ssGrad.addColorStop(1, 'rgba(0, 212, 255, 0)'); // Blue fade
        ctx.strokeStyle = ssGrad;

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(
          ss.x - Math.cos(ss.angle) * ss.length, 
          ss.y - Math.sin(ss.angle) * ss.length
        );
        ctx.stroke();
        ctx.restore();

        // Move shooting star
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        
        // Fade out as it flies
        if (ss.x > width || ss.y > height) {
          shootingStars.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="space-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -2,
        pointerEvents: 'none',
      }}
    />
  );
}
