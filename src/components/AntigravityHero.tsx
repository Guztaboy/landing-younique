import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Download } from 'lucide-react';

// Cyan/Electric Blue Palette
const cyanColors = ['#00F0FF', '#00D1FF', '#00A3FF', '#0070FF', '#4D00FF'];

interface Particle {
  x: number;
  y: number;
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  color: string;
  width: number;
  height: number;
  depth: number; // For parallax
  vx: number;
  vy: number;
}

const typewriterPhrases = [
  "Beleza sem barreiras físicas.",
  "A estética premium que vai até você.",
  "Tecnologia assistiva para a sua autonomia.",
  "Inteligência Artificial que entende a sua pele.",
  "Análise 3D para um atendimento perfeito.",
  "Seu perfil, nossas predições genéticas.",
  "Um aplicativo 100% acessível.",
  "Navegação por voz e feedback tátil."
];

export default function AntigravityHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isMoving: false });
  
  // Typewriter Loop State
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPhrase = typewriterPhrases[phraseIndex];
    
    if (isDeleting) {
      if (displayText.length === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        }, 30);
      }
    } else {
      if (displayText.length === currentPhrase.length) {
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, 2500);
      } else {
        timeout = setTimeout(() => {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        }, 60);
      }
    }
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, phraseIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 250;
      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = 0; i < count; i++) {
        const arm = i % 2 === 0 ? 0 : Math.PI; // Two spiral arms
        const baseRadius = 80 + Math.random() * 320;
        // Spiral math: angle increases with radius
        const angle = arm + (baseRadius * 0.012) + (Math.random() * 0.5);
        const depth = 0.5 + Math.random() * 0.7;
        
        // Determine color based on angle/radius to create those smooth color zones
        let colorIndex = 0;
        const normalizedRadius = (baseRadius - 80) / 320;
        if (normalizedRadius < 0.25) colorIndex = 0;
        else if (normalizedRadius < 0.45) colorIndex = 1;
        else if (normalizedRadius < 0.7) colorIndex = 2;
        else if (normalizedRadius < 0.85) colorIndex = 3;
        else colorIndex = 4;

        particles.push({
          x: centerX + Math.cos(angle) * baseRadius,
          y: centerY + Math.sin(angle) * baseRadius,
          angle,
          radius: baseRadius,
          baseRadius,
          speed: (0.0004 + Math.random() * 0.0006) * (Math.random() > 0.5 ? 1 : -1),
          color: cyanColors[colorIndex],
          width: (3 + Math.random() * 2) * depth,
          height: (12 + Math.random() * 10) * depth,
          depth,
          vx: 0,
          vy: 0
        });
      }
    };

    const startTime = Date.now();

    const update = () => {
      const centerX = width / 2;
      const centerY = height / 2;

      // Calculate alignment factor based on time
      const now = Date.now();
      const elapsed = now - startTime;
      const cycle = (elapsed % 16000) / 16000; // 16 second loop
      const t = (Math.sin(cycle * Math.PI * 2) + 1) / 2; // oscillates smoothly between 0 and 1

      // Smooth interpolate mouse tracking
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Orbit rotation
        p.angle += p.speed;
        
        // Calculate dynamic radius to create the align -> disperse -> align loop
        const alignedRadius = 140; // Ring radius when aligned
        const currentRadius = alignedRadius * (1 - t) + p.baseRadius * t;

        // Basic orbit target
        let tx = centerX + Math.cos(p.angle) * currentRadius;
        let ty = centerY + Math.sin(p.angle) * currentRadius;

        // Apply mouse interaction (magnetic wind / push)
        const dx = mouseRef.current.x - tx;
        const dy = mouseRef.current.y - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 220) {
          const force = (220 - dist) / 220;
          // Tangential push
          tx -= (dy / dist) * force * 70 * p.depth;
          ty += (dx / dist) * force * 70 * p.depth;
          // Slight push outwards from center too
          tx -= (dx / dist) * force * 25;
          ty -= (dy / dist) * force * 25;
        }

        // Smooth transition to target
        p.vx += (tx - p.x) * 0.04;
        p.vy += (ty - p.y) * 0.04;
        
        // Apply friction
        p.vx *= 0.85;
        p.vy *= 0.85;

        p.x += p.vx;
        p.y += p.vy;

        // Render particle as a tilted pill shape
        ctx.save();
        ctx.translate(p.x, p.y);
        // Fix at -45 degrees rotated (matches screen tilted dashes)
        ctx.rotate(-Math.PI / 4); 
        
        // Draw rounded rect (pill)
        ctx.fillStyle = p.color;
        // Pulse opacity slightly based on coordinates for shimmering effect
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(p.angle * 2);
        
        ctx.beginPath();
        const r = p.width / 2;
        ctx.moveTo(-p.width/2 + r, -p.height/2);
        ctx.lineTo(p.width/2 - r, -p.height/2);
        ctx.arc(p.width/2 - r, -p.height/2 + r, r, -Math.PI/2, 0);
        ctx.lineTo(p.width/2, p.height/2 - r);
        ctx.arc(p.width/2 - r, p.height/2 - r, r, 0, Math.PI/2);
        ctx.lineTo(-p.width/2 + r, p.height/2);
        ctx.arc(-p.width/2 + r, p.height/2 - r, r, Math.PI/2, Math.PI);
        ctx.lineTo(-p.width/2, -p.height/2 + r);
        ctx.arc(-p.width/2 + r, -p.height/2 + r, r, Math.PI, -Math.PI/2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(update);
    };

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    update();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Animation Variants
  const titleContainerVars = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.04 }
    }
  };

  const wordVars = {
    hidden: { y: 24, filter: 'blur(8px)', opacity: 0 },
    visible: {
      y: 0,
      filter: 'blur(0px)',
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 1, 0.5, 1]
      }
    }
  };

  const buttonGroupVars = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.8, duration: 0.8, ease: [0.25, 1, 0.5, 1] }
    }
  };

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div className="noise-overlay" />
      
      {/* Animated Background Glow Gradient Layer */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 30% 30%, rgba(0, 240, 255, 0.12) 0%, rgba(248,249,250,1) 120%)',
            'radial-gradient(circle at 70% 70%, rgba(0, 163, 255, 0.12) 0%, rgba(248,249,250,1) 120%)',
            'radial-gradient(circle at 30% 70%, rgba(77, 0, 255, 0.12) 0%, rgba(248,249,250,1) 120%)',
            'radial-gradient(circle at 70% 30%, rgba(0, 209, 255, 0.12) 0%, rgba(248,249,250,1) 120%)',
            'radial-gradient(circle at 30% 30%, rgba(0, 240, 255, 0.12) 0%, rgba(248,249,250,1) 120%)',
          ]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Canvas Particle Layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          opacity: 0.9
        }}
      />

      {/* NAVIGATION */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        boxSizing: 'border-box',
        zIndex: 50,
        fontFamily: "'Google Sans Flex', sans-serif",
        fontWeight: 400,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#202124' }}>
            <img 
              src="/logo.png" 
              alt="Younique Logo" 
              style={{ width: '32px', height: 'auto', objectFit: 'contain' }} 
            />
            <span style={{ fontSize: '18px', fontWeight: 500, letterSpacing: '-0.01em' }}>Younique <span style={{ opacity: 0.8 }}>Powered by Youni</span></span>
          </a>

          {/* Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px', fontSize: '14px' }}>
            <a href="#" style={{ textDecoration: 'none', color: '#202124', fontWeight: 500 }}>Serviços</a>
            <a href="#" style={{ textDecoration: 'none', color: '#5F6368', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Casos de Uso <ChevronDown size={14} />
            </a>
            <a href="#" style={{ textDecoration: 'none', color: '#5F6368' }}>Preços</a>
            <a href="#" style={{ textDecoration: 'none', color: '#5F6368' }}>Blog</a>
            <a href="#" style={{ textDecoration: 'none', color: '#5F6368', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Recursos <ChevronDown size={14} />
            </a>
          </nav>
        </div>

        {/* CTA Download Header */}
      
      </header>

      {/* HERO CONTENT */}
      <div style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 24px',
        boxSizing: 'border-box',
        zIndex: 10,
        textAlign: 'center'
      }}>
        {/* Center Sub-Logo/Chip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10, boxShadow: "0px 0px 0px rgba(0, 240, 255, 0)" }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            boxShadow: [
              "0px 4px 10px rgba(0,0,0,0.02), 0px 0px 0px rgba(0, 240, 255, 0)",
              "0px 10px 30px rgba(0,0,0,0.08), 0px 0px 25px rgba(0, 240, 255, 0.25)",
              "0px 4px 10px rgba(0,0,0,0.02), 0px 0px 0px rgba(0, 240, 255, 0)"
            ]
          }}
          transition={{ 
            opacity: { duration: 0.6, ease: "easeOut" },
            scale: { duration: 0.6, ease: "easeOut" },
            y: { duration: 0.6, ease: "easeOut" },
            boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '32px',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '8px 16px',
            borderRadius: '100px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <img 
            src="/logo.png" 
            alt="Younique Logo" 
            style={{ width: '32px', height: 'auto', objectFit: 'contain' }} 
          />
          <span style={{ fontSize: '20px', fontWeight: 500, letterSpacing: '-0.015em' }}>
            Younique <span style={{ color: '#5F6368', fontWeight: 400 }}>SEAL</span>
          </span>
        </motion.div>

        {/* The Epic Headline Typewriter Loop */}
        <motion.h1
          initial={{ textShadow: "0px 0px 0px rgba(0, 240, 255, 0)" }}
          animate={{
            textShadow: [
              "0px 0px 0px rgba(0, 240, 255, 0)",
              "0px 8px 30px rgba(0, 240, 255, 0.3)",
              "0px 0px 0px rgba(0, 240, 255, 0)"
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            maxWidth: '960px',
            fontSize: 'clamp(2.5rem, 6.2vw, 4.8rem)',
            fontWeight: 500,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            color: '#202124',
            fontFamily: "'Google Sans Flex', sans-serif",
            margin: '0 0 48px 0',
            wordBreak: 'break-word',
            minHeight: '2.5em',
          }}
        >
          <span>{displayText}</span>
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            style={{ display: 'inline-block', width: '4px', backgroundColor: '#202124', marginLeft: '8px', verticalAlign: 'middle', height: '0.85em' }}
          />
        </motion.h1>

        {/* Bottom Actions */}
        <motion.div
          variants={buttonGroupVars}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#151618' }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: '#202124',
              color: '#fff',
              border: 'none',
              borderRadius: '24px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: "'Google Sans Flex', sans-serif",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.1-44.6-35.9-2.8-74.3 22.7-93.1 22.7-18.9 0-58.4-21.9-86.6-21.2-42.3.8-82 23.3-104.5 61.2-46.1 76.9-9.8 190.8 34.6 254 21.6 30.8 47.3 64.9 80.8 63.7 32.1-1.2 44.4-20.7 83.5-20.7 38.8 0 49.9 20.7 83.5 19.5 34.5-1.1 56.4-32.3 77.8-63.5 24.6-35.9 34.7-70.6 35.3-72.4-1.2-.5-66.9-24.8-67.2-113.9zM224.8 77c22.6-27.1 37.8-64.9 33.6-102.3-32.2 1.3-71.8 21.3-95.2 48.4-20.8 24.1-38.6 62.7-33.6 99.4 35.8 2.7 72.8-18.5 95.2-45.5z"/>
            </svg>
            Download for App Store
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#E2E5E9' }}
            whileTap={{ scale: 0.98 }}
            style={{
              backgroundColor: '#E8EAED',
              color: '#202124',
              border: 'none',
              borderRadius: '24px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: "'Google Sans Flex', sans-serif",
            }}
          >
            Explore casos de uso
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
