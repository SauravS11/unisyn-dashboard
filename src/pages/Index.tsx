import { SignInCard } from "@/components/SignInCard";
import { SignUpCard } from "@/components/SignUpCard";
import unisynLogo from "@/assets/unisyn-logo.png";

const Index = () => {
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
        <div className="mb-12 relative">
          <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full scale-150" />
          <img 
            src={unisynLogo} 
            alt="UniSyn Technology" 
            className="relative w-48 h-auto drop-shadow-2xl"
          />
        </div>

        {/* Auth Cards */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
          <div className="flex justify-center">
            <SignInCard />
          </div>
          <div className="flex justify-center">
            <SignUpCard />
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-12 text-sm text-muted-foreground">
          © 2025 UniSyn Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Index;
