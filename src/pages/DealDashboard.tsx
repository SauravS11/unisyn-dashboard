import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, AlertCircle, CheckCircle2, Clock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentsModal } from "@/components/DocumentsModal";
import unisynLogo from "@/assets/unisyn-logo.png";
import { PageNavigation } from "@/components/PageNavigation";
import { SignOutButton } from "@/components/SignOutButton";

interface Task {
  id: string;
  code: string;
  title: string;
  priority: "high" | "medium" | "low";
  assignedName: string;
  assignedEmail: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string | null;
  hasAttachment: boolean;
}

interface Category {
  id: string;
  title: string;
  tasks: Task[];
}

const DealDashboard = () => {
  const { id: dealId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [dealName, setDealName] = useState<string>("Loading...");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [specialists, setSpecialists] = useState<Array<{ name: string; email: string; role: string; category: string }>>([]);
  const [specialistsModalOpen, setSpecialistsModalOpen] = useState(false);
  const [targetCloseDate, setTargetCloseDate] = useState<string | null>(null);
  const [coreTeam, setCoreTeam] = useState<Array<{ full_name: string; email: string; role: string; contact_number: string; permission_level: string }>>([]);
  const [coreTeamModalOpen, setCoreTeamModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    fetchDealData();
  }, [dealId, toast]);

  const fetchDealData = async () => {
    if (!dealId) return;

    try {
        // Fetch deal information
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('name, target_close_date')
          .eq('id', dealId)
          .single();

        if (dealError) throw dealError;
        setDealName(dealData.name);
        setTargetCloseDate(dealData.target_close_date);

        // Fetch categories with their tasks and specialists
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('deal_categories')
          .select(`
            id,
            title,
            category_code,
            category_order
          `)
          .eq('deal_id', dealId)
          .order('category_order');

        if (categoriesError) throw categoriesError;

        // Fetch tasks for all categories
        const categoryIds = categoriesData.map(cat => cat.id);
        const { data: tasksData, error: tasksError } = await supabase
          .from('deal_tasks')
          .select('*')
          .in('category_id', categoryIds)
          .order('task_order');

        if (tasksError) throw tasksError;

        // Fetch specialists for all categories
        const { data: specialistsData, error: specialistsError } = await supabase
          .from('deal_specialists')
          .select('*')
          .in('category_id', categoryIds);

        if (specialistsError) throw specialistsError;

        // Map specialists with category names for display
        const specialistsList = specialistsData.map(specialist => {
          const category = categoriesData.find(cat => cat.id === specialist.category_id);
          return {
            name: specialist.name,
            email: specialist.email,
            role: specialist.role,
            category: category?.title || 'Unknown',
          };
        });
        setSpecialists(specialistsList);

        // Build categories with tasks
        const categoriesWithTasks: Category[] = categoriesData.map(category => {
          const categoryTasks = tasksData.filter(task => task.category_id === category.id);
          const specialist = specialistsData.find(s => s.category_id === category.id);

          return {
            id: category.category_code,
            title: category.title,
            tasks: categoryTasks.map(task => ({
              id: task.id,
              code: task.task_code,
              title: task.title,
              priority: task.priority as "high" | "medium" | "low",
              assignedName: specialist?.name || "",
              assignedEmail: specialist?.email || "",
              status: task.status as "pending" | "in-progress" | "completed",
              dueDate: task.due_date,
              hasAttachment: task.has_attachment,
            })),
          };
        });

        setCategories(categoriesWithTasks);

        // Fetch documents count
        const { count: docsCount, error: docsError } = await supabase
          .from('deal_documents')
          .select('*', { count: 'exact', head: true })
          .eq('deal_id', dealId);

        if (!docsError && docsCount !== null) {
          setDocumentsCount(docsCount);
        }

        // Fetch core team members
        const { data: coreTeamData, error: coreTeamError } = await supabase
          .from('deal_team_members')
          .select('*')
          .eq('deal_id', dealId);

        if (!coreTeamError && coreTeamData) {
          setCoreTeam(coreTeamData);
        }
      } catch (error) {
        console.error('Error fetching deal data:', error);
        toast({
          title: "Error",
          description: "Failed to load deal data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  };
  
  // Calculate stats
  const allTasks = categories.flatMap((cat) => cat.tasks);
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const totalTasks = allTasks.length || 1; // Prevent division by zero
  const readinessScore = Math.round((completedTasks / totalTasks) * 100);
  const openTasks = allTasks.filter((t) => t.status !== "completed").length;
  const highPriorityTasks = allTasks.filter((t) => t.priority === "high" && t.status !== "completed").length;
  const specialistsAssigned = new Set(allTasks.filter((t) => t.assignedName).map((t) => t.assignedEmail)).size;
  
  // Calculate days until close
  const daysUntilClose = targetCloseDate 
    ? Math.ceil((new Date(targetCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading deal data...</div>
        </div>
      </div>
    );
  }

  const getCategoryCompletion = (category: Category) => {
    const completed = category.tasks.filter((t) => t.status === "completed").length;
    return Math.round((completed / category.tasks.length) * 100);
  };

  const getOpenTasksCount = (category: Category) => {
    return category.tasks.filter((t) => t.status !== "completed").length;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-primary";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-muted/50 text-muted-foreground border-border/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return null;
    }
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
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center gap-4 relative">
          <div className="absolute top-6 right-6">
            <SignOutButton />
          </div>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-24 h-auto" />
          <PageNavigation
            items={[
              { to: "/welcome", label: "Home" },
              { to: "/deals", label: "Deals" },
              { to: `/deals/${dealId}/dashboard`, label: dealName, isActive: true },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Top Summary Section */}
        <div className="flex flex-col gap-6 mb-8">
          {/* First Row - Readiness Score + Stats */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* Readiness Score Card */}
            <Card className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - readinessScore / 100)}`}
                        className="text-primary transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{readinessScore}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground mb-2">{dealName}</p>
                    <p className="text-sm text-muted-foreground mb-1">Readiness Score</p>
                    <p className="text-xs text-muted-foreground">
                      {completedTasks} of {totalTasks} tasks completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{openTasks}</div>
                  <div className="text-sm text-muted-foreground">Open Tasks</div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{highPriorityTasks}</div>
                  <div className="text-sm text-muted-foreground">High Priority</div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
              onClick={() => setSpecialistsModalOpen(true)}
            >
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{specialistsAssigned}</div>
                  <div className="text-sm text-muted-foreground">Specialists Assigned</div>
                  <Button variant="link" className="mt-2 text-xs">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Days Until Close + Core Team + Documents */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* Days Until Close Card */}
            <Card className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      {daysUntilClose !== null && (
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                          className="text-accent transition-all duration-500"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {daysUntilClose !== null ? (
                        <span className="text-2xl font-bold">{daysUntilClose}</span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Days Until Close</p>
                    <p className="text-xs text-muted-foreground">
                      Target: {targetCloseDate ? new Date(targetCloseDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl cursor-pointer hover:shadow-2xl transition-shadow"
              onClick={() => setCoreTeamModalOpen(true)}
            >
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                        className="text-accent transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{coreTeam.length}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Core <span className="text-red-500">Team</span></p>
                    <Button variant="link" className="text-xs p-0 h-auto">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
              onClick={() => setDocumentsModalOpen(true)}
            >
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2 flex items-center justify-center gap-2">
                    <FileText className="h-8 w-8" />
                    {documentsCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Documents</div>
                  <Button variant="link" className="mt-2 text-xs">
                    View & Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documents Modal */}
        <DocumentsModal
          open={documentsModalOpen}
          onOpenChange={(open) => {
            setDocumentsModalOpen(open);
            if (!open) {
              // Refresh documents count when modal closes
              fetchDealData();
            }
          }}
          dealId={dealId!}
        />

        {/* Core Team Modal */}
        <Dialog open={coreTeamModalOpen} onOpenChange={setCoreTeamModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Core Deal <span className="text-red-500">Team</span></DialogTitle>
              <DialogDescription>
                View all core team members for this deal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {coreTeam.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No core team members have been added yet
                </div>
              ) : (
                coreTeam.map((member, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{member.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Email:</span> {member.email}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Contact:</span> {member.contact_number}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{member.permission_level}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Specialists Modal */}
        <Dialog open={specialistsModalOpen} onOpenChange={setSpecialistsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Specialists Assigned</DialogTitle>
              <DialogDescription>
                View all specialists assigned to this deal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {specialists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No specialists have been assigned yet
                </div>
              ) : (
                specialists.map((specialist, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-base">{specialist.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{specialist.email}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {specialist.role}
                          </Badge>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {specialist.category}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Tasks Modal */}
        <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">{selectedCategory?.id}</span>
                </div>
                {selectedCategory?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedCategory && (
                  <>
                    {selectedCategory.tasks.filter((t) => t.status === "completed").length} completed · {" "}
                    {selectedCategory.tasks.filter((t) => t.status !== "completed").length} remaining
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-y-auto pr-2">
              {selectedCategory?.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="backdrop-blur-xl bg-card/40 border border-border/40 hover:bg-card/60 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Priority Dot */}
                      <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />

                      {/* Task Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">
                              {task.title} <span className="text-muted-foreground">({task.code})</span>
                            </div>
                            {task.assignedName && (
                              <div className="text-xs text-muted-foreground">
                                Assigned to: {task.assignedName} ({task.assignedEmail})
                              </div>
                            )}
                          </div>
                          {getStatusBadge(task.status)}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div>Due: {task.dueDate}</div>
                          {task.hasAttachment && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Panels - Split into two cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* First Half - Categories 1-7 */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (1-7)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {categories.slice(0, 7).map((category) => {
                  const completion = getCategoryCompletion(category);
                  const openTasksCount = getOpenTasksCount(category);
                  const completedTasksCount = category.tasks.filter((t) => t.status === "completed").length;

                  return (
                    <Card
                      key={category.id}
                      className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">{category.id}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-base">{category.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {completedTasksCount} completed · {openTasksCount} remaining
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right min-w-[80px]">
                              <div className="text-sm font-semibold">{completion}%</div>
                              <Progress value={completion} className="w-20 h-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Second Half - Categories 8-14 */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (8-14)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {categories.slice(7).map((category) => {
                  const completion = getCategoryCompletion(category);
                  const openTasksCount = getOpenTasksCount(category);
                  const completedTasksCount = category.tasks.filter((t) => t.status === "completed").length;

                  return (
                    <Card
                      key={category.id}
                      className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">{category.id}</span>
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-base">{category.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {completedTasksCount} completed · {openTasksCount} remaining
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right min-w-[80px]">
                              <div className="text-sm font-semibold">{completion}%</div>
                              <Progress value={completion} className="w-20 h-2 mt-1" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealDashboard;
