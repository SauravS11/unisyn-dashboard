import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { Target, Shield, Sparkles, ArrowRight } from "lucide-react";
import { motion, type Variants, type Easing, useMotionValue, useTransform, useSpring } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { useEffect, useState } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-5, 5]), springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);
  
  const features = [
    {
      icon: Target,
      title: "Deal Tracking & Control",
      description: "Every moving part, visible."
    },
    {
      icon: Shield,
      title: "Secure Collaboration",
      description: "Built for sensitive transactions."
    },
    {
      icon: Sparkles,
      title: "AI-Assisted Intelligence",
      description: "Surfaces what actually matters."
    }
  ];

  // Easing curves
  const easeOutExpo: Easing = [0.16, 1, 0.3, 1];
  const easeOutBack: Easing = [0.34, 1.56, 0.64, 1];

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: easeOutExpo
      }
    }
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 1,
        ease: easeOutBack
      }
    }
  };

  const headlineVariants: Variants = {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: easeOutExpo
      }
    }
  };

  const featureCardVariants: Variants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: 1 + i * 0.12,
        duration: 0.7,
        ease: easeOutExpo
      }
    }),
    hover: {
      y: -12,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const glowVariants: Variants = {
    animate: {
      opacity: [0.4, 0.8, 0.4],
      scale: [1, 1.1, 1],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const floatingVariants: Variants = {
    animate: {
      y: [-8, 8, -8],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30">
      {/* Layered background textures */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(210_40%_96%),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_100%,hsl(220_30%_94%),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_0%_80%,hsl(200_25%_95%),transparent)]" />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
      
      {/* Animated particle background */}
      <AnimatedBackground />

      {/* Dynamic gradient that follows cursor - more visible */}
      <motion.div 
        className="absolute w-[900px] h-[900px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(210 30% 85% / 0.15) 0%, hsl(220 25% 90% / 0.05) 40%, transparent 65%)",
          left: mousePosition.x - 450,
          top: mousePosition.y - 450,
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Central radial gradient overlay - more prominent */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1600px] h-[1600px] bg-[radial-gradient(circle,hsl(210_35%_92%/0.25)_0%,hsl(220_30%_95%/0.1)_40%,transparent_70%)]"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Ambient depth layers with animation - more prominent */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-[10%] left-[20%] w-[800px] h-[800px] bg-[hsl(210_40%_85%/0.15)] rounded-full blur-[120px]"
          animate={{
            x: [-30, 30, -30],
            y: [-20, 20, -20],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[60%] right-[10%] w-[700px] h-[700px] bg-[hsl(220_35%_88%/0.12)] rounded-full blur-[100px]"
          animate={{
            x: [25, -25, 25],
            y: [15, -15, 15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-[40%] left-[60%] w-[500px] h-[500px] bg-[hsl(200_30%_90%/0.1)] rounded-full blur-[80px]"
          animate={{
            x: [-15, 15, -15],
            y: [20, -20, 20],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-[hsl(230_25%_85%/0.08)] rounded-full blur-[90px]"
          animate={{
            y: [-10, 10, -10],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center perspective-1000"
          >
            {/* Glassmorphism Hero Panel */}
            <motion.div 
              className="relative backdrop-blur-2xl bg-glass border border-glass-border rounded-[32px] p-10 sm:p-14 md:p-16 shadow-[0_8px_60px_-12px_hsl(var(--primary)/0.2),inset_0_1px_0_hsl(var(--glass-highlight))]"
              variants={itemVariants}
            >
              {/* Animated border gradient - subtle silver/white */}
              <motion.div
                className="absolute inset-0 rounded-[32px] p-[1px] bg-gradient-to-b from-[hsl(210_20%_85%/0.4)] via-transparent to-[hsl(220_15%_80%/0.15)] pointer-events-none"
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Inner content glow */}
              <motion.div 
                className="absolute inset-4 bg-gradient-to-b from-glass-highlight/40 to-transparent rounded-[24px] pointer-events-none"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Corner accents - subtle neutral */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[hsl(210_15%_75%/0.25)] rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[hsl(210_15%_75%/0.25)] rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[hsl(210_15%_75%/0.25)] rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[hsl(210_15%_75%/0.25)] rounded-br-lg" />

              <div className="relative flex flex-col items-center">
                {/* Logo */}
                <motion.div 
                  className="relative mb-10 sm:mb-12"
                  variants={logoVariants}
                  animate="animate"
                >
                  {/* Multi-layer glow effect - subtle neutral/silver */}
                  <motion.div 
                    className="absolute inset-0 bg-[hsl(220_20%_75%/0.12)] blur-[100px] rounded-full scale-[3]"
                    variants={glowVariants}
                    animate="animate"
                  />
                  <motion.div 
                    className="absolute inset-0 bg-[hsl(210_15%_80%/0.15)] blur-[60px] rounded-full scale-[2]"
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                      scale: [1.8, 2.2, 1.8],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5
                    }}
                  />
                  <motion.div 
                    className="absolute inset-0 bg-[hsl(210_20%_85%/0.18)] blur-[40px] rounded-full scale-150"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1.4, 1.6, 1.4],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                  />
                  <motion.img 
                    src={unisynLogo} 
                    alt="UniSyn Technology" 
                    className="relative w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl"
                    variants={logoVariants}
                    animate={{
                      scale: [1, 1.03, 1],
                      filter: ["brightness(1)", "brightness(1.05)", "brightness(1)"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                {/* Headline with Character Animation Effect */}
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text"
                  variants={headlineVariants}
                >
                  <motion.span
                    className="inline-block"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    One platform. Total deal clarity.
                  </motion.span>
                </motion.h1>

                {/* Supporting Text with fade */}
                <motion.p 
                  className="max-w-xl text-center text-muted-foreground/80 text-base sm:text-lg leading-relaxed mb-10 sm:mb-12"
                  variants={itemVariants}
                >
                  UniSyn is a deal management platform designed for M&A teams, 
                  advisors, and decision-makers. Structure, visibility, and control 
                  at every stage of the deal.
                </motion.p>

                {/* CTA Section with Enhanced Animations */}
                <motion.div 
                  className="flex flex-col items-center gap-4"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Subtle ripple effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-primary/25"
                      animate={{
                        scale: [1, 1.4, 1.6],
                        opacity: [0.3, 0.1, 0],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 8
                      }}
                    />
                    
                    {/* Button glow effect - subtle */}
                    <motion.div 
                      className="absolute -inset-2 bg-primary/20 rounded-2xl blur-lg"
                      animate={{
                        opacity: [0.2, 0.4, 0.2],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Button 
                      onClick={() => navigate("/auth")} 
                      size="lg" 
                      className="relative px-12 py-7 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-500 group overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Get Started
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.span>
                      </span>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        animate={{
                          x: ["-200%", "200%"],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 4,
                          ease: "easeInOut"
                        }}
                      />
                    </Button>
                  </motion.div>
                  <motion.button 
                    onClick={() => navigate("/auth")} 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 group"
                    whileHover={{ scale: 1.02 }}
                  >
                    Already have an account?{" "}
                    <span className="text-primary font-medium relative">
                      Sign in
                      <motion.span 
                        className="absolute left-0 bottom-0 w-full h-px bg-primary origin-left"
                        initial={{ scaleX: 0 }}
                        whileHover={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    </span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </main>

        {/* Feature Strip */}
        <section className="px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 auto-rows-fr">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  custom={index}
                  variants={featureCardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  className="group relative cursor-pointer"
                >
                  {/* Card glow on hover - subtle neutral */}
                  <motion.div 
                    className="absolute -inset-3 bg-gradient-to-b from-[hsl(210_20%_80%/0.12)] to-[hsl(220_15%_85%/0.06)] rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  />
                  
                  {/* Glass card - larger */}
                  <div className="relative h-full backdrop-blur-xl bg-glass border border-glass-border rounded-3xl p-10 sm:p-12 shadow-[0_4px_24px_-8px_hsl(220_20%_50%/0.1),inset_0_1px_0_hsl(var(--glass-highlight))] transition-all duration-500 group-hover:shadow-[0_20px_60px_-15px_hsl(220_20%_60%/0.2),inset_0_1px_0_hsl(var(--glass-highlight))] group-hover:border-[hsl(210_15%_75%/0.35)] overflow-hidden flex flex-col">
                    {/* Animated inner highlight */}
                    <motion.div 
                      className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(210_20%_80%/0.6)] to-transparent"
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 1.2 + index * 0.1, duration: 0.8 }}
                    />

                    {/* Background shimmer on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[hsl(210_15%_90%/0.06)] via-transparent to-[hsl(220_10%_85%/0.06)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                    
                    <div className="relative flex flex-col items-center text-center">
                      {/* Icon container with enhanced animation - larger */}
                      <motion.div 
                        className="relative mb-6"
                        whileHover={{ 
                          rotate: [0, -5, 5, 0],
                          transition: { duration: 0.5 }
                        }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-[hsl(210_20%_75%/0.2)] blur-xl rounded-full scale-150"
                          animate={{
                            opacity: [0.2, 0.4, 0.2],
                            scale: [1.3, 1.6, 1.3],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5
                          }}
                        />
                        <motion.div 
                          className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-glass-highlight to-glass border border-glass-border backdrop-blur-xl flex items-center justify-center shadow-lg group-hover:shadow-[hsl(210_15%_70%/0.25)] transition-all duration-500"
                          whileHover={{ scale: 1.1 }}
                        >
                          <feature.icon className="w-7 h-7 text-primary" />
                        </motion.div>
                      </motion.div>
                      <h3 className="font-semibold text-foreground mb-3 text-xl group-hover:text-primary transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-base text-muted-foreground/80 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <motion.footer 
          className="py-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
        >
          <p className="text-xs sm:text-sm text-muted-foreground/60">
            © 2026 UniSyn Technology. All rights reserved.
          </p>
        </motion.footer>
      </div>
    </div>
  );
};

export default LandingPage;
