import { SignInCard } from "@/components/SignInCard";
import { SignUpCard } from "@/components/SignUpCard";
import { DealCodeCard } from "@/components/DealCodeCard";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup" | "dealcode">("signin");

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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8 sm:py-12">
        {/* Logo with Glow */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full scale-150" />
          <img 
            src={unisynLogo} 
            alt="UniSyn Technology" 
            className="relative w-48 sm:w-56 md:w-64 h-auto drop-shadow-2xl"
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 sm:mb-8 relative w-full max-w-md backdrop-blur-xl bg-card/60 border-border/50 rounded-full p-1.5 shadow-lg">
          <div className="relative flex">
            {/* Sliding Background */}
            <div 
              className="absolute top-0 bottom-0 left-0 w-1/3 bg-primary rounded-full transition-transform duration-300 ease-out shadow-lg"
              style={{
                transform: activeTab === "signup" 
                  ? "translateX(100%)" 
                  : activeTab === "dealcode" 
                    ? "translateX(200%)" 
                    : "translateX(0)",
              }}
            />
            
            {/* Sign In Tab */}
            <button
              onClick={() => setActiveTab("signin")}
              className={`relative z-10 flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 touch-manipulation ${
                activeTab === "signin" 
                  ? "text-primary-foreground" 
                  : "text-foreground hover:text-foreground/70"
              }`}
            >
              Sign In
            </button>
            
            {/* Sign Up Tab */}
            <button
              onClick={() => setActiveTab("signup")}
              className={`relative z-10 flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 touch-manipulation ${
                activeTab === "signup" 
                  ? "text-primary-foreground" 
                  : "text-foreground hover:text-foreground/70"
              }`}
            >
              Sign Up
            </button>

            {/* Deal Code Tab */}
            <button
              onClick={() => setActiveTab("dealcode")}
              className={`relative z-10 flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 touch-manipulation ${
                activeTab === "dealcode" 
                  ? "text-primary-foreground" 
                  : "text-foreground hover:text-foreground/70"
              }`}
            >
              Deal Code
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-md px-2 sm:px-0">
          <div className="relative">
            <div 
              className={`transition-opacity duration-300 ${
                activeTab === "signin" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              <SignInCard />
            </div>
            <div 
              className={`transition-opacity duration-300 ${
                activeTab === "signup" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              <SignUpCard />
            </div>
            <div 
              className={`transition-opacity duration-300 ${
                activeTab === "dealcode" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
              }`}
            >
              <DealCodeCard />
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground text-center px-4">
          © 2025 UniSyn Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Index;
