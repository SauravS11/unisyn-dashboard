import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import unisynLogo from "@/assets/unisyn-logo.png";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CheckCircle2, 
  Circle, 
  AlertTriangle, 
  Clock, 
  FileText,
  Users,
  Calendar,
  ArrowLeft,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { differenceInDays } from "date-fns";

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  checked: boolean;
  due_date: string | null;
  assigned_to: string | null;
}

interface Category {
  id: string;
  title: string;
  category_code: string;
  tasks: Task[];
}

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

interface Specialist {
  id: string;
  name: string;
  role: string;
  email: string;
}

const ExternalDealDashboard = () => {
  const { dealId } = useParams();
  const navigate = useNavigate();
  const [dealName, setDealName] = useState("");
  const [targetCloseDate, setTargetCloseDate] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [coreTeam, setCoreTeam] = useState<TeamMember[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSpecialistsModal, setShowSpecialistsModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      const storedPasscode = sessionStorage.getItem("deal_passcode");
      const storedDealId = sessionStorage.getItem("deal_id");

      if (!storedPasscode || storedDealId !== dealId) {
        toast.error("Unauthorized access. Please enter the deal code.");
        navigate("/");
        return;
      }

      // Verify passcode is still valid
      const { data, error } = await supabase
        .from("deals")
        .select("id, passcode")
        .eq("id", dealId)
        .eq("passcode", storedPasscode)
        .maybeSingle();

      if (error || !data) {
        sessionStorage.removeItem("deal_passcode");
        sessionStorage.removeItem("deal_id");
        toast.error("Invalid or expired access. Please enter the deal code again.");
        navigate("/");
        return;
      }

      setIsAuthorized(true);
      fetchDealData();
    };

    checkAuthorization();
  }, [dealId, navigate]);

  const fetchDealData = async () => {
    try {
      // Fetch deal details
      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .select("name, target_close_date")
        .eq("id", dealId)
        .single();

      if (dealError) throw dealError;
      setDealName(dealData.name);
      setTargetCloseDate(dealData.target_close_date);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("deal_categories")
        .select("*")
        .eq("deal_id", dealId)
        .order("category_order");

      if (categoriesError) throw categoriesError;

      // Fetch tasks for all categories
      const { data: tasksData, error: tasksError } = await supabase
        .from("deal_tasks")
        .select("*")
        .in("category_id", categoriesData.map(c => c.id))
        .order("task_order");

      if (tasksError) throw tasksError;

      // Fetch specialists
      const { data: specialistsData } = await supabase
        .from("deal_specialists")
        .select("*")
        .eq("deal_id", dealId);

      setSpecialists(specialistsData || []);

      // Fetch document counts
      const { data: documentsData } = await supabase
        .from("deal_documents")
        .select("category")
        .eq("deal_id", dealId);

      const counts: Record<string, number> = {};
      documentsData?.forEach(doc => {
        if (doc.category) {
          counts[doc.category] = (counts[doc.category] || 0) + 1;
        }
      });
      setDocumentCounts(counts);

      // Fetch core team members
      const { data: teamData } = await supabase
        .from("deal_team_members")
        .select("*")
        .eq("deal_id", dealId);

      setCoreTeam(teamData || []);

      // Structure data
      const structuredCategories: Category[] = categoriesData.map(cat => ({
        ...cat,
        tasks: tasksData.filter(task => task.category_id === cat.id)
      }));

      setCategories(structuredCategories);
    } catch (error) {
      console.error("Error fetching deal data:", error);
      toast.error("Failed to load deal data");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Lock className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const allTasks = categories.flatMap(c => c.tasks);
  const completedTasks = allTasks.filter(t => t.checked).length;
  const totalTasks = allTasks.length;
  const readinessScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const openTasks = allTasks.filter(t => !t.checked).length;
  const highPriorityTasks = allTasks.filter(t => t.priority === "high" && !t.checked).length;
  const specialistsAssigned = new Set(specialists.map(s => s.id)).size;
  const totalDocuments = Object.values(documentCounts).reduce((a, b) => a + b, 0);
  const daysUntilClose = targetCloseDate 
    ? differenceInDays(new Date(targetCloseDate), new Date())
    : null;

  const getCategoryCompletion = (category: Category) => {
    if (category.tasks.length === 0) return 0;
    const completed = category.tasks.filter(t => t.checked).length;
    return Math.round((completed / category.tasks.length) * 100);
  };

  const getOpenTasksCount = (category: Category) => {
    return category.tasks.filter(t => !t.checked).length;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string, checked: boolean) => {
    if (checked) {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Complete</Badge>;
    }
    switch (status) {
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><Circle className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><Circle className="h-3 w-3 mr-1" />{status}</Badge>;
    }
  };

  const leftCategories = categories.slice(0, 7);
  const rightCategories = categories.slice(7, 14);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Background */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem("deal_passcode");
              sessionStorage.removeItem("deal_id");
              navigate("/");
            }}
            className="absolute top-4 left-4 sm:top-6 sm:left-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-16 sm:w-24 h-auto mt-8 sm:mt-0" />
          <div className="text-center">
            <Badge className="mb-2 bg-primary/10 text-primary border-primary/20">
              <Lock className="h-3 w-3 mr-1" />
              External View
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold">{dealName}</h1>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Readiness Score */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary" strokeDasharray={`${readinessScore * 1.76} 176`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">{readinessScore}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Readiness</p>
            </CardContent>
          </Card>

          {/* Open Tasks */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-3xl font-bold text-primary">{openTasks}</p>
              <p className="text-xs text-muted-foreground">Open Tasks</p>
            </CardContent>
          </Card>

          {/* High Priority */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-3xl font-bold text-red-500">{highPriorityTasks}</p>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>

          {/* Specialists */}
          <Card 
            className="backdrop-blur-xl bg-card/60 border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => setShowSpecialistsModal(true)}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-3xl font-bold">{specialistsAssigned}</p>
              <p className="text-xs text-muted-foreground">Specialists</p>
            </CardContent>
          </Card>

          {/* Days Until Close */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              {daysUntilClose !== null ? (
                <>
                  <p className="text-3xl font-bold">{Math.max(0, daysUntilClose)}</p>
                  <p className="text-xs text-muted-foreground">Days to Close</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-muted-foreground">N/A</p>
                  <p className="text-xs text-muted-foreground">Days to Close</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Core Team */}
          <Card 
            className="backdrop-blur-xl bg-card/60 border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
            onClick={() => setShowTeamModal(true)}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-3xl font-bold">{coreTeam.length}</p>
              <p className="text-xs text-muted-foreground">Core Team</p>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className="text-3xl font-bold">{totalDocuments}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column */}
          <div className="space-y-3 sm:space-y-4">
            {leftCategories.map((category) => (
              <Card 
                key={category.id}
                className="backdrop-blur-xl bg-card/60 border-border/50 hover:bg-card/80 transition-all cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{category.category_code}</span>
                      <h3 className="font-semibold text-sm">{category.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getOpenTasksCount(category)} open
                    </Badge>
                  </div>
                  <Progress value={getCategoryCompletion(category)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{getCategoryCompletion(category)}% complete</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Column */}
          <div className="space-y-3 sm:space-y-4">
            {rightCategories.map((category) => (
              <Card 
                key={category.id}
                className="backdrop-blur-xl bg-card/60 border-border/50 hover:bg-card/80 transition-all cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{category.category_code}</span>
                      <h3 className="font-semibold text-sm">{category.title}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getOpenTasksCount(category)} open
                    </Badge>
                  </div>
                  <Progress value={getCategoryCompletion(category)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{getCategoryCompletion(category)}% complete</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Category Tasks Modal */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.title}</DialogTitle>
            <DialogDescription>
              View tasks in this category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedCategory?.tasks.map((task) => (
              <div key={task.id} className="p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {task.checked ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={task.checked ? "line-through text-muted-foreground" : ""}>{task.title}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      {task.assigned_to && (
                        <span className="text-xs text-muted-foreground">• {task.assigned_to}</span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(task.status, task.checked)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Core Team Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Core Deal Team
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {coreTeam.map((member) => (
              <div key={member.id} className="p-3 rounded-lg border border-border/50 bg-background/50">
                <p className="font-medium">{member.full_name}</p>
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Specialists Modal */}
      <Dialog open={showSpecialistsModal} onOpenChange={setShowSpecialistsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Specialists
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {specialists.map((specialist) => (
              <div key={specialist.id} className="p-3 rounded-lg border border-border/50 bg-background/50">
                <p className="font-medium">{specialist.name}</p>
                <p className="text-sm text-muted-foreground">{specialist.role}</p>
                <p className="text-xs text-muted-foreground">{specialist.email}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExternalDealDashboard;