import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, Clock, ChevronRight, MoreVertical, CheckCircle2, Key, Trash2, Inbox, Hourglass, Briefcase } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/customClient";
import { useToast } from "@/hooks/use-toast";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { format } from "date-fns";
import { PageNavigation } from "@/components/PageNavigation";
import { PageHeaderActions } from "@/components/PageHeaderActions";
import { NotificationButton } from "@/components/NotificationButton";
import { toast as sonnerToast } from "sonner";
import { PasscodeDialog } from "@/components/PasscodeDialog";

interface Deal {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: string;
  passcode?: string | null;
  deal_code: string;
}

interface Intake {
  id: string;
  intake_code: string;
  company_name: string;
  client_type: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

type ViewMode = "pending" | "awaiting" | "active" | "completed";

const PENDING_STATUSES = ["draft"];
const AWAITING_STATUSES = [
  "request_sent",
  "awaiting_response",
  "in_progress",
  "submitted_for_review",
  "changes_requested",
  "approved",
];

const INTAKE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  awaiting_response: "Awaiting Response",
  in_progress: "In Progress",
  submitted_for_review: "Submitted for Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

const DealsListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("pending");
  const [passcodeDialogOpen, setPasscodeDialogOpen] = useState(false);
  const [selectedDealForPasscode, setSelectedDealForPasscode] = useState<Deal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDealForDelete, setSelectedDealForDelete] = useState<Deal | null>(null);

  const fetchAll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication required", description: "Please sign in to view your deals.", variant: "destructive" });
        navigate("/");
        return;
      }

      const [dealsRes, intakesRes] = await Promise.all([
        supabase.from("deals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        (supabase as any)
          .from("client_intakes")
          .select("id, intake_code, company_name, client_type, status, due_date, created_at, updated_at")
          .eq("created_by", user.id)
          .neq("status", "converted_to_deal")
          .order("created_at", { ascending: false }),
      ]);

      if (dealsRes.error) throw dealsRes.error;
      setDeals(dealsRes.data || []);
      setIntakes(intakesRes.data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast({ title: "Error", description: "Failed to load deals. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDealComplete = async (dealId: string, dealName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from("deals").update({ status: "completed" }).eq("id", dealId);
      if (error) throw error;
      sonnerToast.success(`${dealName} marked as complete!`);
      fetchAll();
    } catch (error) {
      console.error("Error marking deal as complete:", error);
      sonnerToast.error("Failed to mark deal as complete");
    }
  };

  const pendingIntakes = intakes.filter((i) => PENDING_STATUSES.includes(i.status));
  const awaitingIntakes = intakes.filter((i) => AWAITING_STATUSES.includes(i.status));
  const activeDeals = deals.filter((d) => d.status === "active" || d.status === "in_progress");
  const completedDeals = deals.filter((d) => d.status === "completed");

  const counts = {
    pending: pendingIntakes.length,
    awaiting: awaitingIntakes.length,
    active: activeDeals.length,
    completed: completedDeals.length,
  };

  const handleOpenPasscodeDialog = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealForPasscode(deal);
    setPasscodeDialogOpen(true);
  };

  const handleDealClick = async (deal: Deal) => {
    if (deal.status === "in_progress") {
      const [{ data: categories }, { data: members }] = await Promise.all([
        supabase.from("deal_categories").select("id").eq("deal_id", deal.id).limit(1),
        supabase.from("deal_team_members").select("id").eq("deal_id", deal.id).limit(1),
      ]);
      if (categories && categories.length > 0) navigate(`/deals/${deal.id}/checklist`);
      else if (members && members.length > 0) navigate(`/deals/${deal.id}/team`);
      else navigate(`/deals/${deal.id}/edit`);
    } else {
      navigate(`/deals/${deal.id}/dashboard`);
    }
  };

  const handleIntakeClick = async (intake: Intake) => {
    if (intake.status === "draft") {
      const { count } = await (supabase as any)
        .from("client_intake_categories")
        .select("id", { count: "exact", head: true })
        .eq("client_intake_id", intake.id);
      if ((count ?? 0) === 0) navigate(`/onboarding/${intake.id}/profile`);
      else navigate(`/onboarding/${intake.id}/send`);
      return;
    }
    navigate(`/onboarding/${intake.id}/review`);
  };

  const handleOpenDeleteDialog = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealForDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDeal = async () => {
    if (!selectedDealForDelete) return;
    try {
      const { error } = await supabase.from("deals").delete().eq("id", selectedDealForDelete.id);
      if (error) throw error;
      sonnerToast.success(`${selectedDealForDelete.name} has been deleted`);
      setDeleteDialogOpen(false);
      setSelectedDealForDelete(null);
      fetchAll();
    } catch (error) {
      console.error("Error deleting deal:", error);
      sonnerToast.error("Failed to delete deal");
    }
  };

  const tabs: { key: ViewMode; label: string; icon: typeof Inbox; count: number }[] = [
    { key: "pending", label: "Pending", icon: Inbox, count: counts.pending },
    { key: "awaiting", label: "Awaiting", icon: Hourglass, count: counts.awaiting },
    { key: "active", label: "Active", icon: Briefcase, count: counts.active },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: counts.completed },
  ];

  const headings: Record<ViewMode, { title: string; subtitle: string; emptyTitle: string; emptyBody: string }> = {
    pending: {
      title: "Pending Intakes",
      subtitle: "Client onboardings you've started but not yet sent",
      emptyTitle: "No pending intakes",
      emptyBody: "Start a new client onboarding to see it here.",
    },
    awaiting: {
      title: "Awaiting Response",
      subtitle: "Intakes sent to clients and progressing toward a deal",
      emptyTitle: "Nothing awaiting response",
      emptyBody: "Once you send a client request, it will appear here.",
    },
    active: {
      title: "Active Deals",
      subtitle: "Live deals moving through due diligence",
      emptyTitle: "No active deals",
      emptyBody: "Approved intakes will convert into active deals.",
    },
    completed: {
      title: "Completed Deals",
      subtitle: "Deals you've marked as complete",
      emptyTitle: "No completed deals",
      emptyBody: "Mark deals as complete to see them here.",
    },
  };

  const currentHeading = headings[viewMode];

  const renderDealCard = (deal: Deal) => {
    const statusStyles =
      deal.status === "completed"
        ? { ring: "border-green-500/40", badge: "bg-green-500/15 text-green-600 dark:text-green-500 border-green-500/30", label: "Completed" }
        : deal.status === "in_progress"
        ? { ring: "border-orange-500/40", badge: "bg-orange-500/15 text-orange-600 dark:text-orange-500 border-orange-500/30", label: "In Progress" }
        : { ring: "border-blue-500/40", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-500 border-blue-500/30", label: "Active" };

    return (
      <Card
        key={deal.id}
        className={`backdrop-blur-xl bg-card/60 border-2 ${statusStyles.ring} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group touch-manipulation`}
        onClick={() => handleDealClick(deal)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 touch-manipulation">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-50 bg-card border-border">
                  <DropdownMenuItem onClick={(e) => handleDealComplete(deal.id, deal.name, e)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Deal Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleOpenPasscodeDialog(deal, e)}>
                    <Key className="h-4 w-4 mr-2" />
                    {deal.passcode ? "Edit Passcode" : "Add Passcode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleOpenDeleteDialog(deal, e)} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Deal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="flex-1 truncate">{deal.name}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <Badge className={`${statusStyles.badge} hover:${statusStyles.badge}`}>{statusStyles.label}</Badge>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Created {format(new Date(deal.created_at), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Updated {format(new Date(deal.updated_at), "MMM dd, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderIntakeCard = (intake: Intake, tone: "pending" | "awaiting") => {
    const styles =
      tone === "pending"
        ? { ring: "border-blue-500/40", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-500 border-blue-500/30" }
        : { ring: "border-amber-500/40", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-500 border-amber-500/30" };

    return (
      <Card
        key={intake.id}
        className={`backdrop-blur-xl bg-card/60 border-2 ${styles.ring} shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group touch-manipulation`}
        onClick={() => handleIntakeClick(intake)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors flex items-start justify-between gap-2">
            <span className="flex-1 truncate">{intake.company_name}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${styles.badge} hover:${styles.badge}`}>
              {INTAKE_STATUS_LABEL[intake.status] ?? intake.status}
            </Badge>
            <span className="text-xs font-mono text-primary">{intake.intake_code}</span>
            <span className="text-xs text-muted-foreground capitalize">· {intake.client_type}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">Created {format(new Date(intake.created_at), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-2 shrink-0" />
            <span className="truncate">
              {intake.due_date
                ? `Due ${format(new Date(intake.due_date), "MMM dd, yyyy")}`
                : `Updated ${format(new Date(intake.updated_at), "MMM dd, yyyy")}`}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg animate-pulse">
              <CardHeader className="pb-3"><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
              <CardContent><div className="space-y-2"><div className="h-4 bg-muted rounded w-1/2"></div><div className="h-4 bg-muted rounded w-2/3"></div></div></CardContent>
            </Card>
          ))}
        </div>
      );
    }

    let items: React.ReactNode[] = [];
    if (viewMode === "pending") items = pendingIntakes.map((i) => renderIntakeCard(i, "pending"));
    else if (viewMode === "awaiting") items = awaitingIntakes.map((i) => renderIntakeCard(i, "awaiting"));
    else if (viewMode === "active") items = activeDeals.map(renderDealCard);
    else items = completedDeals.map(renderDealCard);

    if (items.length === 0) {
      return (
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{currentHeading.emptyTitle}</h3>
            <p className="text-muted-foreground mb-6">{currentHeading.emptyBody}</p>
            {(viewMode === "pending" || viewMode === "awaiting") && (
              <Button onClick={() => navigate("/onboarding/new")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Start Client Onboarding
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{items}</div>;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <PageHeaderActions rightSlot={<NotificationButton />} />
          <img src={unisynLogo} alt="UniSyn Technology" className="w-32 sm:w-44 h-auto mt-2 sm:mt-0" />
          <PageNavigation items={[{ to: "/welcome", label: "Home" }, { to: "/deals", label: "Deals", isActive: true }]} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Your <span className="text-primary">{currentHeading.title.split(" ")[0]}</span> {currentHeading.title.split(" ").slice(1).join(" ")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">{currentHeading.subtitle}</p>
          </div>
          <Button
            onClick={() => navigate("/onboarding/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto touch-manipulation"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Client Onboarding
          </Button>
        </div>

        {/* Flow tabs: Pending → Awaiting → Active → Completed */}
        <div className="mb-8">
          <div className="inline-flex flex-wrap gap-2 p-1.5 rounded-2xl backdrop-blur-xl bg-card/60 border border-border/50 shadow-lg">
            {tabs.map((t, idx) => {
              const Icon = t.icon;
              const isActive = viewMode === t.key;
              return (
                <div key={t.key} className="flex items-center">
                  <button
                    onClick={() => setViewMode(t.key)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                    <span
                      className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground/70"
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                  {idx < tabs.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/60 hidden sm:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {renderContent()}
      </div>

      {/* Passcode Dialog */}
      {selectedDealForPasscode && (
        <PasscodeDialog
          isOpen={passcodeDialogOpen}
          onClose={() => { setPasscodeDialogOpen(false); setSelectedDealForPasscode(null); }}
          dealId={selectedDealForPasscode.id}
          dealCode={selectedDealForPasscode.deal_code}
          dealName={selectedDealForPasscode.name}
          currentPasscode={selectedDealForPasscode.passcode}
          onPasscodeUpdate={fetchAll}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDealForDelete?.name}"? This action cannot be undone and will permanently delete the deal and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDealForDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeal} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealsListPage;
