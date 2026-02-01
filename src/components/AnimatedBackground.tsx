import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface GlowOrb {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  phase: number;
  speed: number;
  hue: number;
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

    // Initialize ambient glow orbs with richer colors
    const orbConfigs = [
      { hue: 220, saturation: 60 }, // Deep blue
      { hue: 250, saturation: 50 }, // Purple
      { hue: 180, saturation: 45 }, // Cyan
      { hue: 200, saturation: 55 }, // Sky blue
      { hue: 270, saturation: 40 }, // Lavender
      { hue: 190, saturation: 50 }, // Teal
      { hue: 230, saturation: 55 }, // Indigo
      { hue: 160, saturation: 45 }, // Mint
    ];

    orbsRef.current = orbConfigs.map((config, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 200 + Math.random() * 250,
      opacity: 0.08 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.004,
      hue: config.hue,
    }));

    const drawGrid = (time: number) => {
      ctx.strokeStyle = "hsla(220, 40%, 75%, 0.06)";
      ctx.lineWidth = 1;
      
      const gridSize = 100;
      const offsetX = (time * 8) % gridSize;
      const offsetY = (time * 6) % gridSize;
      
      // Vertical lines with fade
      for (let x = -gridSize + offsetX; x < canvas.width + gridSize; x += gridSize) {
        const distFromCenter = Math.abs(x - canvas.width / 2) / (canvas.width / 2);
        ctx.globalAlpha = 0.06 * (1 - distFromCenter * 0.5);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal lines with fade
      for (let y = -gridSize + offsetY; y < canvas.height + gridSize; y += gridSize) {
        const distFromCenter = Math.abs(y - canvas.height / 2) / (canvas.height / 2);
        ctx.globalAlpha = 0.06 * (1 - distFromCenter * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const orbs = orbsRef.current;
      const time = timeRef.current;

      // Draw subtle moving grid
      drawGrid(time);

      // Draw ambient glow orbs with movement
      orbs.forEach((orb) => {
        orb.phase += orb.speed;
        const breathe = Math.sin(orb.phase) * 0.3 + 1;
        const currentRadius = orb.radius * breathe;
        
        // Slow drift movement
        orb.x += Math.sin(orb.phase * 0.5) * 0.3;
        orb.y += Math.cos(orb.phase * 0.3) * 0.2;
        
        // Wrap around edges
        if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius;
        if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius;
        if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius;
        
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, currentRadius
        );
        gradient.addColorStop(0, `hsla(${orb.hue}, 50%, 70%, ${orb.opacity})`);
        gradient.addColorStop(0.3, `hsla(${orb.hue}, 45%, 65%, ${orb.opacity * 0.6})`);
        gradient.addColorStop(0.7, `hsla(${orb.hue}, 35%, 75%, ${orb.opacity * 0.2})`);
        gradient.addColorStop(1, `hsla(${orb.hue}, 30%, 80%, 0)`);
        
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Scan line effect
      const scanY = (time * 30) % (canvas.height + 300) - 150;
      const scanGradient = ctx.createLinearGradient(0, scanY - 100, 0, scanY + 100);
      scanGradient.addColorStop(0, "hsla(220, 50%, 80%, 0)");
      scanGradient.addColorStop(0.5, "hsla(220, 60%, 85%, 0.03)");
      scanGradient.addColorStop(1, "hsla(220, 50%, 80%, 0)");
      ctx.fillStyle = scanGradient;
      ctx.fillRect(0, scanY - 100, canvas.width, 200);

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
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        {/* Large floating ring */}
        <motion.div
          className="absolute top-[10%] right-[5%] w-72 h-72 border-2 border-[hsl(220_50%_70%/0.12)] rounded-full"
          animate={{
            rotate: 360,
            scale: [1, 1.08, 1],
          }}
          transition={{
            rotate: { duration: 35, repeat: Infinity, ease: "linear" },
            scale: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Second ring - offset */}
        <motion.div
          className="absolute top-[12%] right-[7%] w-64 h-64 border border-[hsl(250_45%_70%/0.08)] rounded-full"
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Floating square - bottom left */}
        <motion.div
          className="absolute bottom-[15%] left-[5%] w-40 h-40 border border-[hsl(250_40%_70%/0.1)] rounded-3xl backdrop-blur-sm"
          animate={{
            rotate: [-10, 10, -10],
            y: [-15, 15, -15],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Floating diamond */}
        <motion.div
          className="absolute top-[55%] right-[12%] w-24 h-24 border border-[hsl(200_50%_70%/0.12)] rounded-xl"
          animate={{
            rotate: [45, 405],
            y: [-25, 25, -25],
          }}
          transition={{
            rotate: { duration: 30, repeat: Infinity, ease: "linear" },
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Small floating circles */}
        <motion.div
          className="absolute top-[25%] left-[15%] w-8 h-8 bg-[hsl(220_60%_75%/0.15)] rounded-full blur-sm"
          animate={{
            y: [-30, 30, -30],
            x: [-15, 15, -15],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[65%] left-[55%] w-5 h-5 bg-[hsl(250_50%_70%/0.2)] rounded-full blur-sm"
          animate={{
            y: [25, -25, 25],
            x: [12, -12, 12],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[20%] right-[25%] w-10 h-10 bg-[hsl(180_45%_70%/0.12)] rounded-full blur-sm"
          animate={{
            y: [-20, 20, -20],
            scale: [1, 1.4, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[30%] right-[35%] w-6 h-6 bg-[hsl(270_40%_75%/0.15)] rounded-full blur-sm"
          animate={{
            y: [20, -20, 20],
            x: [-10, 10, -10],
          }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Gradient mesh accent - center */}
        <motion.div
          className="absolute top-[35%] left-[25%] w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background: "conic-gradient(from 0deg, hsla(220, 55%, 75%, 0.06), hsla(250, 50%, 80%, 0.1), hsla(180, 45%, 75%, 0.06), hsla(220, 55%, 75%, 0.06))",
            filter: "blur(60px)",
          }}
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Accent lines */}
        <motion.div
          className="absolute top-[40%] left-0 w-32 h-[1px] bg-gradient-to-r from-transparent via-[hsl(220_50%_70%/0.2)] to-transparent"
          animate={{
            x: [-50, 150, -50],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[60%] right-0 w-40 h-[1px] bg-gradient-to-r from-transparent via-[hsl(250_45%_70%/0.2)] to-transparent"
          animate={{
            x: [50, -150, 50],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </>
  );
};
