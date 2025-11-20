import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import unisynLogo from "@/assets/unisyn-logo.png";
import { Briefcase, FileSearch, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Briefcase,
      title: "Create Deals",
      description: "Streamline deal creation and management with intelligent workflows",
      onClick: () => navigate("/deals/create"),
    },
    {
      icon: FileSearch,
      title: "Manage Due Diligence",
      description: "Centralise documentation and track progress in real-time",
    },
    {
      icon: Users,
      title: "Collaborate with Specialists",
      description: "Connect seamlessly with advisors and stakeholders",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 border border-border/30 rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 border border-border/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/20 rounded-full" />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Logo with Glow */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full scale-150" />
          <img 
            src={unisynLogo} 
            alt="UniSyn Technology" 
            className="relative w-56 h-auto drop-shadow-2xl"
          />
        </div>

        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-foreground">Welcome to Uni</span>
            <span className="text-primary">Syn</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light">
            Centralise your M&A workflow.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={feature.onClick}
              >
                <CardHeader className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Text */}
        <p className="mt-16 text-sm text-muted-foreground">
          © 2025 UniSyn Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Welcome;
