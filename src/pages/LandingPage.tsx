import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { Target, Shield, Sparkles } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: "Deal Tracking & Control",
      description: "Complete visibility across every stage"
    },
    {
      icon: Shield,
      title: "Secure Collaboration",
      description: "Enterprise-grade security for sensitive deals"
    },
    {
      icon: Sparkles,
      title: "AI-Assisted Intelligence",
      description: "MIA - Your intelligent deal companion"
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
          {/* Logo with Ambient Glow */}
          <div className="relative mb-10 sm:mb-14">
            <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full scale-150" />
            <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-[2]" />
            <img 
              src={unisynLogo} 
              alt="UniSyn Technology" 
              className="relative w-56 sm:w-72 md:w-80 h-auto drop-shadow-xl"
            />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center tracking-tight mb-6">
            One platform. Total deal clarity.
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl text-center text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed mb-10 sm:mb-14 px-4">
            UniSyn is a deal management and collaboration platform designed for M&A teams, 
            advisors, and decision-makers. From pre-due diligence to execution, UniSyn brings 
            structure, visibility, and control to every stage of the deal.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col items-center gap-4">
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="px-10 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
            >
              Get Started
            </Button>
            <button 
              onClick={() => navigate("/auth")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          </div>
        </main>

        {/* Feature Strip */}
        <section className="px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            <div className="backdrop-blur-xl bg-card/40 border border-border/50 rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex flex-col items-center text-center p-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2026 UniSyn Technology. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
