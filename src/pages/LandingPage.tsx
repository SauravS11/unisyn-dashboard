import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { Target, Shield, Sparkles } from "lucide-react";
import { motion, type Variants, type Easing } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";

const LandingPage = () => {
  const navigate = useNavigate();
  
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

  // Easing curve
  const easeOut: Easing = [0.25, 0.46, 0.45, 0.94];

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: easeOut
      }
    }
  };

  const featureCardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.8 + i * 0.15,
        duration: 0.5,
        ease: easeOut
      }
    })
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/10">
      {/* Animated particle background */}
      <AnimatedBackground />

      {/* Subtle radial gradient overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-[radial-gradient(circle,hsl(var(--primary)/0.04)_0%,transparent_70%)]" />
      </div>

      {/* Ambient depth layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Glassmorphism Hero Panel */}
            <motion.div 
              className="relative backdrop-blur-2xl bg-glass border border-glass-border rounded-[32px] p-10 sm:p-14 md:p-16 shadow-[0_8px_60px_-12px_hsl(var(--primary)/0.15),inset_0_1px_0_hsl(var(--glass-highlight))]"
              variants={itemVariants}
            >
              {/* Subtle red edge accent */}
              <div className="absolute inset-0 rounded-[32px] p-[1px] bg-gradient-to-b from-primary/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Inner content glow */}
              <div className="absolute inset-4 bg-gradient-to-b from-glass-highlight/30 to-transparent rounded-[24px] pointer-events-none" />

              <div className="relative flex flex-col items-center">
                {/* Logo with Breathing Animation */}
                <motion.div 
                  className="relative mb-10 sm:mb-12"
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Outer ethereal glow */}
                  <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full scale-[2.5]" />
                  {/* Inner soft glow */}
                  <div className="absolute inset-0 bg-primary/15 blur-[50px] rounded-full scale-150" />
                  <motion.img 
                    src={unisynLogo} 
                    alt="UniSyn Technology" 
                    className="relative w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl"
                    variants={itemVariants}
                  />
                </motion.div>

                {/* Headline with Animated Entry */}
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center tracking-tight mb-6"
                  variants={itemVariants}
                >
                  One platform. Total deal clarity.
                </motion.h1>

                {/* Supporting Text */}
                <motion.p 
                  className="max-w-xl text-center text-muted-foreground/80 text-base sm:text-lg leading-relaxed mb-10 sm:mb-12"
                  variants={itemVariants}
                >
                  UniSyn is a deal management platform designed for M&A teams, 
                  advisors, and decision-makers. Structure, visibility, and control 
                  at every stage of the deal.
                </motion.p>

                {/* CTA Section */}
                <motion.div 
                  className="flex flex-col items-center gap-4"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="relative group"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 hsl(0 85% 60% / 0.4)",
                        "0 0 0 12px hsl(0 85% 60% / 0)",
                        "0 0 0 0 hsl(0 85% 60% / 0)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 8
                    }}
                  >
                    {/* Button glow effect on hover */}
                    <div className="absolute -inset-2 bg-primary/25 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Button 
                      onClick={() => navigate("/auth")} 
                      size="lg" 
                      className="relative px-12 py-7 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-0.5"
                    >
                      Get Started
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
                      <span className="absolute left-0 bottom-0 w-full h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  custom={index}
                  variants={featureCardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ 
                    y: -6, 
                    transition: { duration: 0.3, ease: "easeOut" } 
                  }}
                  className="group relative"
                >
                  {/* Card glow on hover */}
                  <div className="absolute -inset-1 bg-gradient-to-b from-primary/10 to-transparent rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  
                  {/* Glass card */}
                  <div className="relative backdrop-blur-xl bg-glass border border-glass-border rounded-3xl p-8 shadow-[0_4px_24px_-8px_hsl(var(--foreground)/0.08),inset_0_1px_0_hsl(var(--glass-highlight))] transition-all duration-300 group-hover:shadow-[0_12px_40px_-12px_hsl(var(--primary)/0.2),inset_0_1px_0_hsl(var(--glass-highlight))] group-hover:border-primary/20">
                    {/* Inner highlight */}
                    <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-glass-highlight to-transparent" />
                    
                    <div className="flex flex-col items-center text-center">
                      {/* Icon container */}
                      <div className="relative mb-5">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-glass-highlight to-glass border border-glass-border backdrop-blur-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/20 transition-shadow duration-300">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 text-lg">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
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
