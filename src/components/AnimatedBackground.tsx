import { useEffect, useRef } from "react";

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
  const orbsRef = useRef<GlowOrb[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

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

    // Initialize ambient glow orbs - larger and more visible
    orbsRef.current = Array.from({ length: 6 }, (_, i) => ({
      x: (canvas.width / 7) * (i + 1),
      y: canvas.height * (0.2 + Math.random() * 0.6),
      radius: 200 + Math.random() * 150,
      opacity: 0.045 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
      speed: 0.004 + Math.random() * 0.004,
    }));

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const orbs = orbsRef.current;
      const time = timeRef.current;

      // Draw ambient glow orbs - richer blue/cyan/purple tones
      orbs.forEach((orb, i) => {
        orb.phase += orb.speed;
        const breathe = Math.sin(orb.phase) * 0.35 + 1;
        const currentRadius = orb.radius * breathe;
        
        // Vary hue for visual interest
        const hue = 200 + (i * 15) % 40;
        
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius
        );
        gradient.addColorStop(0, `hsla(${hue}, 45%, 75%, ${orb.opacity})`);
        gradient.addColorStop(0.4, `hsla(${hue + 10}, 35%, 65%, ${orb.opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue + 20}, 25%, 55%, 0)`);
        
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
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
