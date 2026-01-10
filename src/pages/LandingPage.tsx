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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Vision OS Style Layered Background */}
      <div className="absolute inset-0">
        {/* Primary ambient orbs */}
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[100px]" />
        
        {/* Secondary depth layers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-muted/30 to-transparent rounded-full blur-[80px]" />
        
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
          {/* Logo with Vision OS Ambient Glow */}
          <div className="relative mb-12 sm:mb-16">
            {/* Outer ethereal glow */}
            <div className="absolute inset-0 bg-primary/8 blur-[100px] rounded-full scale-[2.5]" />
            {/* Inner soft glow */}
            <div className="absolute inset-0 bg-primary/12 blur-[60px] rounded-full scale-150" />
            <img 
              src={unisynLogo} 
              alt="UniSyn Technology" 
              className="relative w-56 sm:w-72 md:w-80 h-auto drop-shadow-2xl" 
            />
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center tracking-tight mb-6">
            One platform. Total deal clarity.
          </h1>

          {/* Supporting Text */}
          <p className="max-w-2xl text-center text-muted-foreground text-base sm:text-lg md:text-xl leading-relaxed mb-12 sm:mb-16 px-4">
            UniSyn is a deal management and collaboration platform designed for M&A teams, 
            advisors, and decision-makers. From pre-due diligence to execution, UniSyn brings 
            structure, visibility, and control to every stage of the deal.
          </p>

          {/* CTA Section - Vision OS Glass Card */}
          <div className="flex flex-col items-center gap-5">
            <div className="relative group">
              {/* Button glow effect */}
              <div className="absolute -inset-1 bg-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Button 
                onClick={() => navigate("/auth")} 
                size="lg" 
                className="relative px-12 py-7 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/25 transition-all duration-500 hover:scale-[1.02]"
              >
                Get Started
              </Button>
            </div>
            <button 
              onClick={() => navigate("/auth")} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          </div>
        </main>

        {/* Feature Strip - Vision OS Glass Panel */}
        <section className="px-6 py-12 sm:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Vision OS Glass Container */}
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-b from-glass-highlight to-transparent rounded-[28px] opacity-60" />
              
              {/* Glass panel */}
              <div className="relative backdrop-blur-[40px] bg-glass border border-glass-border rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.1)]">
                {/* Inner highlight line */}
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-glass-highlight to-transparent" />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
                  {features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="group flex flex-col items-center text-center p-4 rounded-2xl transition-all duration-300 hover:bg-glass-highlight/30"
                    >
                      {/* Icon container with glass effect */}
                      <div className="relative mb-5">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-glass-highlight to-glass border border-glass-border backdrop-blur-xl flex items-center justify-center shadow-lg">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2 text-lg">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground/70">
            © 2025 UniSyn Technology. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
