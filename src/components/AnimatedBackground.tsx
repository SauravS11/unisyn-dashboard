import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface GlowOrb {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
}

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const orbsRef = useRef<GlowOrb[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Track mouse for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Initialize particles
    const particleCount = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 1,
      opacity: Math.random() * 0.2 + 0.08,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
    }));

    // Initialize ambient glow orbs
    orbsRef.current = Array.from({ length: 4 }, (_, i) => ({
      x: (canvas.width / 5) * (i + 1),
      y: canvas.height * (0.3 + Math.random() * 0.4),
      radius: 150 + Math.random() * 100,
      opacity: 0.03 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.005,
    }));

    const connectionDistance = 180;
    const mouseInfluenceRadius = 200;

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const orbs = orbsRef.current;
      const mouse = mouseRef.current;
      const time = timeRef.current;

      // Draw ambient glow orbs - sophisticated blue/cyan tones
      orbs.forEach((orb) => {
        orb.phase += orb.speed;
        const breathe = Math.sin(orb.phase) * 0.3 + 1;
        const currentRadius = orb.radius * breathe;
        
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius
        );
        gradient.addColorStop(0, `hsla(210, 40%, 70%, ${orb.opacity * 0.8})`);
        gradient.addColorStop(0.5, `hsla(220, 30%, 60%, ${orb.opacity * 0.3})`);
        gradient.addColorStop(1, "hsla(220, 20%, 50%, 0)");
        
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction - particles gently attracted to cursor
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        
        if (distToMouse < mouseInfluenceRadius && distToMouse > 0) {
          const force = (1 - distToMouse / mouseInfluenceRadius) * 0.02;
          particle.vx += (dx / distToMouse) * force;
          particle.vy += (dy / distToMouse) * force;
        }

        // Apply gentle damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges with buffer
        if (particle.x < -20) particle.x = canvas.width + 20;
        if (particle.x > canvas.width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = canvas.height + 20;
        if (particle.y > canvas.height + 20) particle.y = -20;

        // Pulse effect
        particle.pulsePhase += particle.pulseSpeed;
        const pulse = Math.sin(particle.pulsePhase) * 0.3 + 1;
        const currentSize = particle.size * pulse;
        const currentOpacity = particle.opacity * (0.8 + pulse * 0.2);

        // Draw particle with glow - cool white/blue tones
        const particleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, currentSize * 3
        );
        particleGradient.addColorStop(0, `hsla(210, 20%, 85%, ${currentOpacity})`);
        particleGradient.addColorStop(0.5, `hsla(220, 15%, 70%, ${currentOpacity * 0.3})`);
        particleGradient.addColorStop(1, "hsla(220, 10%, 60%, 0)");

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = particleGradient;
        ctx.fill();

        // Draw solid core - subtle silver/white
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 15%, 80%, ${currentOpacity * 1.2})`;
        ctx.fill();

        // Draw connections with gradient
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const connDx = particle.x - other.x;
          const connDy = particle.y - other.y;
          const distance = Math.sqrt(connDx * connDx + connDy * connDy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.1;
            const gradient = ctx.createLinearGradient(
              particle.x, particle.y,
              other.x, other.y
            );
            gradient.addColorStop(0, `hsla(210, 20%, 70%, ${opacity * currentOpacity * 4})`);
            gradient.addColorStop(0.5, `hsla(220, 15%, 65%, ${opacity * 0.5})`);
            gradient.addColorStop(1, `hsla(210, 20%, 70%, ${opacity * (other.opacity / 0.2) * 0.4})`);

            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      // Draw subtle scan line effect - neutral tone
      const scanY = (time * 25) % (canvas.height + 200) - 100;
      const scanGradient = ctx.createLinearGradient(0, scanY - 50, 0, scanY + 50);
      scanGradient.addColorStop(0, "hsla(220, 20%, 70%, 0)");
      scanGradient.addColorStop(0.5, "hsla(220, 15%, 75%, 0.015)");
      scanGradient.addColorStop(1, "hsla(220, 20%, 70%, 0)");
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 50, canvas.width, 100);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
