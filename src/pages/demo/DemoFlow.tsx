import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/ui/page-shell";
import unisynLogo from "@/assets/unisyn-logo.svg";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Send, FileText,
  Users, Calendar, Building2, Mail, CheckCircle2, Flag, X,
} from "lucide-react";
import { toast } from "sonner";

type Step =
  | "welcome"
  | "profile"
  | "categories"
  | "send"
  | "review"
  | "respondent"
  | "dashboard";

const DEMO_PROFILE = {
  client_type: "Seller",
  company_name: "Northwind Beverages (Pty) Ltd",
  registration_number: "2018/345112/07",
  entity_type: "(Pty) Ltd",
  industry: "Consumer Goods",
  sector: "Food & Beverage",
  country: "South Africa",
  primary_contact_name: "Lerato Mokoena",
  primary_contact_role: "CFO",
  primary_contact_email: "lerato@northwind-bev.com",
  primary_contact_phone: "+27 82 555 0144",
  advisor_notes: "Founder-led, exploring strategic exit. Strong unit economics, EBITDA margin ~22%.",
};

const DEMO_CATEGORIES = [
  { code: "A", name: "Corporate & Governance", requirements: 14, picked: true },
  { code: "B", name: "Financial Information", requirements: 22, picked: true },
  { code: "C", name: "Tax", requirements: 11, picked: false },
  { code: "D", name: "Commercial & Customers", requirements: 9, picked: true },
  { code: "E", name: "Employment & HR", requirements: 12, picked: false },
  { code: "F", name: "Material Contracts", requirements: 16, picked: false },
];

const DEMO_DEAL = {
  name: "Project Aurora — Northwind Beverages",
  closeDate: "2026-09-30",
  daysToClose: 109,
  progress: 64,
  documents: 47,
  specialists: 4,
  coreTeam: 5,
};

const DEMO_TASKS = [
  { code: "A.01", title: "Certificate of Incorporation", status: "completed", priority: "high", assignee: "Lerato Mokoena", flagged: false },
  { code: "A.02", title: "Memorandum of Incorporation", status: "completed", priority: "medium", assignee: "Lerato Mokoena", flagged: false },
  { code: "A.03", title: "Shareholders' Agreement", status: "in-progress", priority: "high", assignee: "Sipho Dlamini", flagged: true },
  { code: "B.01", title: "Audited Financial Statements (3yr)", status: "completed", priority: "high", assignee: "Lerato Mokoena", flagged: false },
  { code: "B.02", title: "Management Accounts YTD", status: "in-progress", priority: "high", assignee: "Lerato Mokoena", flagged: false },
  { code: "B.03", title: "Revenue Breakdown by Customer", status: "pending", priority: "medium", assignee: "Unassigned", flagged: false },
  { code: "D.01", title: "Top 20 Customer Contracts", status: "in-progress", priority: "high", assignee: "Nadia Patel", flagged: true },
  { code: "D.02", title: "Distribution Agreements", status: "pending", priority: "medium", assignee: "Nadia Patel", flagged: false },
];

const DEMO_SPECIALISTS = [
  { name: "Sipho Dlamini", role: "Corporate Lawyer", category: "A — Corporate" },
  { name: "Anita Reddy", role: "Financial Advisor", category: "B — Financial" },
  { name: "Nadia Patel", role: "Commercial Counsel", category: "D — Commercial" },
  { name: "Marcus Chen", role: "Tax Specialist", category: "B — Financial" },
];

export default function DemoFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [tasks, setTasks] = useState(DEMO_TASKS);

  const exitDemo = () => navigate("/");

  return (
    <PageShell>
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary gap-1.5">
          <Sparkles className="h-3 w-3" /> Live Demo
        </Badge>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={exitDemo} title="Exit demo">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          {step === "welcome" && <Welcome onNext={() => setStep("profile")} />}
          {step === "profile" && <Profile onNext={() => setStep("categories")} onBack={() => setStep("welcome")} />}
          {step === "categories" && <Categories onNext={() => setStep("send")} onBack={() => setStep("profile")} />}
          {step === "send" && <SendRequest onNext={() => setStep("review")} onBack={() => setStep("categories")} />}
          {step === "review" && <Review onNext={() => setStep("respondent")} onBack={() => setStep("send")} />}
          {step === "respondent" && <Respondent onNext={() => setStep("dashboard")} onBack={() => setStep("review")} />}
          {step === "dashboard" && <Dashboard tasks={tasks} setTasks={setTasks} onRestart={() => setStep("welcome")} />}
        </motion.div>
      </AnimatePresence>

      {step !== "welcome" && step !== "dashboard" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <StepIndicator step={step} />
        </div>
      )}
    </PageShell>
  );
}

const STEPS_ORDER: Step[] = ["profile", "categories", "send", "review", "respondent"];
const STEP_LABELS: Record<Step, string> = {
  welcome: "",
  profile: "Profile",
  categories: "Categories",
  send: "Send Request",
  review: "Review",
  respondent: "Seller Portal",
  dashboard: "",
};

const StepIndicator = ({ step }: { step: Step }) => {
  const idx = STEPS_ORDER.indexOf(step);
  return (
    <div className="glass-surface rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
      {STEPS_ORDER.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              i < idx ? "bg-primary" : i === idx ? "bg-primary ring-4 ring-primary/20" : "bg-muted"
            }`}
          />
          {i === idx && <span className="text-xs font-medium">{STEP_LABELS[s]}</span>}
        </div>
      ))}
    </div>
  );
};

/* ---------------- WELCOME ---------------- */
const Welcome = ({ onNext }: { onNext: () => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
    <div className="relative mb-8">
      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
      <img src={unisynLogo} alt="UniSyn" className="relative w-56 sm:w-72 h-auto drop-shadow-2xl" />
    </div>
    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">
      Consumer Fest · 2026
    </p>
    <h1 className="font-display text-4xl sm:text-6xl text-center tracking-tight leading-[1.05] max-w-3xl mb-5">
      Welcome to the <span className="text-gradient-brand">UniSyn</span><br /> Consumer Fest Live Demo
    </h1>
    <p className="text-base sm:text-lg text-muted-foreground/90 text-center max-w-xl leading-relaxed mb-10">
      Walk through a complete deal lifecycle in under two minutes — from client onboarding to an interactive deal dashboard. All data is pre-populated.
    </p>
    <Button
      size="lg"
      onClick={onNext}
      className="h-14 px-10 text-base font-semibold rounded-2xl shadow-glow-primary gap-2"
    >
      Get Started <ArrowRight className="h-5 w-5" />
    </Button>
    <p className="mt-6 text-xs text-muted-foreground">
      5 stops · ~90 seconds · ends at an interactive dashboard
    </p>
  </div>
);

/* ---------------- PROFILE ---------------- */
const Profile = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <DemoPage title="Client Intake Profile" subtitle="Step 1 of 3 — Seller profile (pre-filled for demo)">
    <div className="grid md:grid-cols-2 gap-4">
      <Field label="Client type"><Input value={DEMO_PROFILE.client_type} readOnly /></Field>
      <Field label="Entity type"><Input value={DEMO_PROFILE.entity_type} readOnly /></Field>
      <Field label="Company name"><Input value={DEMO_PROFILE.company_name} readOnly /></Field>
      <Field label="Registration number"><Input value={DEMO_PROFILE.registration_number} readOnly /></Field>
      <Field label="Industry"><Input value={DEMO_PROFILE.industry} readOnly /></Field>
      <Field label="Sector"><Input value={DEMO_PROFILE.sector} readOnly /></Field>
      <Field label="Country"><Input value={DEMO_PROFILE.country} readOnly /></Field>
      <Field label="Primary contact"><Input value={DEMO_PROFILE.primary_contact_name} readOnly /></Field>
      <Field label="Contact role"><Input value={DEMO_PROFILE.primary_contact_role} readOnly /></Field>
      <Field label="Contact email"><Input value={DEMO_PROFILE.primary_contact_email} readOnly /></Field>
    </div>
    <Field label="Advisor notes">
      <Textarea rows={3} value={DEMO_PROFILE.advisor_notes} readOnly />
    </Field>
    <NavRow onBack={onBack} onNext={onNext} nextLabel="Continue to Categories" />
  </DemoPage>
);

/* ---------------- CATEGORIES ---------------- */
const Categories = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const [picked, setPicked] = useState<Record<string, boolean>>(
    Object.fromEntries(DEMO_CATEGORIES.map((c) => [c.code, c.picked])),
  );
  const count = Object.values(picked).filter(Boolean).length;
  return (
    <DemoPage
      title="Select Due Diligence Categories"
      subtitle={`Step 2 of 3 — ${count} of ${DEMO_CATEGORIES.length} workstreams selected for this demo`}
    >
      <div className="space-y-2.5">
        {DEMO_CATEGORIES.map((c) => (
          <div
            key={c.code}
            className={`rounded-lg border p-4 transition-colors ${
              picked[c.code] ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={!!picked[c.code]}
                onCheckedChange={() => setPicked((p) => ({ ...p, [c.code]: !p[c.code] }))}
                className="mt-1"
              />
              <div className="flex-1 flex items-baseline gap-2">
                <span className="text-xs font-bold text-destructive tabular-nums">{c.code}</span>
                <h3 className="font-semibold">{c.name}</h3>
                <span className="ml-auto text-xs text-muted-foreground">{c.requirements} requirements</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextLabel="Continue to Request" />
    </DemoPage>
  );
};

/* ---------------- SEND ---------------- */
const SendRequest = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <DemoPage title="Send Client Request" subtitle="Step 3 of 3 — Issue the secure request">
    <div className="grid sm:grid-cols-2 gap-3">
      <Stat label="Intake Code" value="DEMO-7421" mono primary />
      <Stat label="Secure Portal" value="unisyn.app/respond" mono />
    </div>
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Recipient email"><Input value={DEMO_PROFILE.primary_contact_email} readOnly /></Field>
      <Field label="Due date"><Input value="2026-07-15" readOnly /></Field>
    </div>
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm">
      <p className="font-semibold mb-2 flex items-center gap-2"><Mail className="h-4 w-4" /> Email preview</p>
      <p>Hello {DEMO_PROFILE.primary_contact_name.split(" ")[0]},</p>
      <p className="mt-2">
        We are conducting a Pre-Due-Diligence review for <strong>{DEMO_PROFILE.company_name}</strong> and request your secure submission of responses and supporting documents.
      </p>
      <p className="mt-2"><strong>Intake code:</strong> <span className="font-mono">DEMO-7421</span></p>
    </div>
    <NavRow onBack={onBack} onNext={onNext} nextLabel="Send Request" nextIcon={<Send className="h-4 w-4" />} />
  </DemoPage>
);

/* ---------------- REVIEW (Advisor) ---------------- */
const Review = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <DemoPage title="Advisor Review" subtitle="Responses submitted — convert to a live deal">
    <div className="grid sm:grid-cols-3 gap-3">
      <Stat label="Categories" value="3" />
      <Stat label="Requirements answered" value="45 / 45" />
      <Stat label="Documents uploaded" value="47" />
    </div>
    <div className="space-y-2">
      {DEMO_CATEGORIES.filter((c) => c.picked).map((c) => (
        <div key={c.code} className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold text-destructive">{c.code}</span>
          <span className="text-sm font-medium">{c.name}</span>
          <span className="ml-auto text-xs text-muted-foreground">{c.requirements} complete</span>
        </div>
      ))}
    </div>
    <NavRow onBack={onBack} onNext={onNext} nextLabel="Open Seller Portal Preview" />
  </DemoPage>
);

/* ---------------- RESPONDENT preview ---------------- */
const Respondent = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => (
  <DemoPage title="Seller Portal" subtitle="What Northwind sees when they log in with their code">
    <div className="rounded-2xl border border-border/50 bg-card/60 p-6">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Pre-Due-Diligence</p>
      <h3 className="font-display text-3xl tracking-tight mb-1">{DEMO_PROFILE.company_name}</h3>
      <p className="text-sm text-muted-foreground mb-5">Welcome back, Lerato. 45 of 45 requirements complete.</p>
      <Progress value={100} className="h-2" />
      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {DEMO_CATEGORIES.filter((c) => c.picked).map((c) => (
          <div key={c.code} className="rounded-xl border border-border/50 bg-background/60 p-4">
            <p className="text-xs font-bold text-destructive">{c.code}</p>
            <p className="font-semibold text-sm mt-1">{c.name}</p>
            <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Complete
            </p>
          </div>
        ))}
      </div>
    </div>
    <NavRow onBack={onBack} onNext={onNext} nextLabel="Open Deal Dashboard" />
  </DemoPage>
);

/* ---------------- INTERACTIVE DASHBOARD ---------------- */
const Dashboard = ({
  tasks,
  setTasks,
  onRestart,
}: {
  tasks: typeof DEMO_TASKS;
  setTasks: (t: typeof DEMO_TASKS) => void;
  onRestart: () => void;
}) => {
  const completed = tasks.filter((t) => t.status === "completed").length;
  const progress = Math.round((completed / tasks.length) * 100);

  const toggle = (code: string) => {
    setTasks(
      tasks.map((t) =>
        t.code === code
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t,
      ),
    );
    toast.success(`${code} updated`);
  };

  const toggleFlag = (code: string) => {
    setTasks(tasks.map((t) => (t.code === code ? { ...t, flagged: !t.flagged } : t)));
  };

  const grouped = DEMO_CATEGORIES.filter((c) => c.picked).map((c) => ({
    ...c,
    tasks: tasks.filter((t) => t.code.startsWith(c.code)),
  }));

  return (
    <div className="min-h-screen px-4 sm:px-8 py-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-1">
            Deal Dashboard
          </p>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            {DEMO_DEAL.name}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={onRestart} className="gap-2">
          <Sparkles className="h-4 w-4" /> Restart Demo
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Calendar} label="Days to Close" value={String(DEMO_DEAL.daysToClose)} />
        <StatCard icon={CheckCircle2} label="Progress" value={`${progress}%`} />
        <StatCard icon={FileText} label="Documents" value={String(DEMO_DEAL.documents)} />
        <StatCard icon={Users} label="Specialists" value={String(DEMO_DEAL.specialists)} />
      </div>

      <Card className="glass-surface mb-6">
        <CardHeader>
          <CardTitle className="text-base">Overall progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {completed} of {tasks.length} requirements completed across {grouped.length} workstreams
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {grouped.map((cat) => (
            <Card key={cat.code} className="glass-surface">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-destructive font-bold">{cat.code}</span>
                  {cat.name}
                  <Badge variant="outline" className="ml-auto">
                    {cat.tasks.filter((t) => t.status === "completed").length}/{cat.tasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cat.tasks.map((t) => (
                  <div
                    key={t.code}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 hover:bg-background/80 transition-colors"
                  >
                    <Checkbox
                      checked={t.status === "completed"}
                      onCheckedChange={() => toggle(t.code)}
                    />
                    <span className="text-xs font-mono text-muted-foreground w-12">{t.code}</span>
                    <span
                      className={`text-sm font-medium flex-1 ${
                        t.status === "completed" ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        t.priority === "high"
                          ? "border-destructive/40 text-destructive"
                          : "border-border"
                      }`}
                    >
                      {t.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:inline w-32 truncate">
                      {t.assignee}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleFlag(t.code)}
                    >
                      <Flag
                        className={`h-3.5 w-3.5 ${
                          t.flagged ? "fill-destructive text-destructive" : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-5">
          <Card className="glass-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" /> Subject Matter Specialists
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_SPECIALISTS.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">
                    {s.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.role}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.category}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-surface">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Deal Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2.5">
              <Row k="Target" v={DEMO_PROFILE.company_name} />
              <Row k="Sector" v={DEMO_PROFILE.sector} />
              <Row k="Close date" v={DEMO_DEAL.closeDate} />
              <Row k="Core team" v={`${DEMO_DEAL.coreTeam} members`} />
              <Row k="Status" v={<Badge className="bg-primary/15 text-primary border-primary/30" variant="outline">Active</Badge>} />
            </CardContent>
          </Card>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-10">
        This is a live, interactive demo · Toggle tasks and flags freely · No data is saved
      </p>
    </div>
  );
};

/* ---------------- shared bits ---------------- */
const DemoPage = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-screen py-10 px-4">
    <div className="max-w-3xl mx-auto">
      <Card className="glass-surface-strong shadow-2xl">
        <CardHeader>
          <CardTitle className="font-display text-3xl tracking-tight">{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">{children}</CardContent>
      </Card>
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

const NavRow = ({
  onBack,
  onNext,
  nextLabel,
  nextIcon,
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  nextIcon?: React.ReactNode;
}) => (
  <div className="flex justify-between pt-3">
    <Button variant="ghost" onClick={onBack} className="gap-2">
      <ArrowLeft className="h-4 w-4" /> Back
    </Button>
    <Button onClick={onNext} className="gap-2">
      {nextLabel} {nextIcon ?? <ArrowRight className="h-4 w-4" />}
    </Button>
  </div>
);

const Stat = ({
  label,
  value,
  mono,
  primary,
}: {
  label: string;
  value: string;
  mono?: boolean;
  primary?: boolean;
}) => (
  <div className="rounded-lg border border-border/50 bg-card/40 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p
      className={`text-lg font-bold ${mono ? "font-mono" : ""} ${
        primary ? "text-primary" : ""
      }`}
    >
      {value}
    </p>
  </div>
);

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <Card className="glass-surface">
    <CardContent className="p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-xl font-bold tabular-nums">{value}</p>
      </div>
    </CardContent>
  </Card>
);

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground text-xs uppercase tracking-wide">{k}</span>
    <span className="font-medium text-right">{v}</span>
  </div>
);
