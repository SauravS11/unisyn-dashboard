import { SignInCard } from "@/components/SignInCard";
import { SignUpCard } from "@/components/SignUpCard";
import { DealCodeCard } from "@/components/DealCodeCard";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/ui/page-shell";
import { useState } from "react";

type Tab = "signin" | "signup" | "dealcode";

const tabs: { id: Tab; label: string }[] = [
  { id: "signin", label: "Sign In" },
  { id: "signup", label: "Sign Up" },
  { id: "dealcode", label: "Client Access" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <PageShell>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-10 sm:py-14">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <img src={unisynLogo} alt="UniSyn Technology" className="relative w-48 sm:w-56 md:w-64 h-auto drop-shadow-2xl" />
        </div>

        <div className="text-center mb-8 max-w-md">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Deal Operations Platform</p>
          <h2 className="font-display text-3xl sm:text-4xl tracking-tight leading-tight">
            Clarity for every <span className="text-gradient-brand">transaction</span>.
          </h2>
        </div>

        {/* Tab Navigation — glass pill */}
        <div className="mb-7 relative w-full max-w-md glass-surface rounded-full p-1.5">
          <div className="relative flex">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-primary rounded-full transition-transform duration-300 ease-out shadow-glow-primary"
              style={{ width: `${100 / tabs.length}%`, transform: `translateX(${activeIndex * 100}%)` }}
            />
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`relative z-10 flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-300 touch-manipulation ${
                  activeTab === t.id ? "text-primary-foreground" : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Auth Form */}
        <div className="w-full max-w-md">
          <div className="relative">
            <div className={`transition-opacity duration-300 ${activeTab === "signin" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
              <SignInCard />
            </div>
            <div className={`transition-opacity duration-300 ${activeTab === "signup" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
              <SignUpCard />
            </div>
            <div className={`transition-opacity duration-300 ${activeTab === "dealcode" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"}`}>
              <DealCodeCard />
            </div>
          </div>
        </div>

        <p className="mt-12 text-xs text-muted-foreground/80 text-center tracking-wide">
          © 2026 UniSyn Technology · All rights reserved
        </p>
      </div>
    </PageShell>
  );
};

export default Index;
