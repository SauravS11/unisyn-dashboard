import { useEffect, useState } from "react";
import * as React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, AlertCircle, CheckCircle2, Clock, FileText, Flag, User, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
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
  checked: boolean;
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
  const [openFlagPopover, setOpenFlagPopover] = useState<string | null>(null);
  const [openAssignPopover, setOpenAssignPopover] = useState<string | null>(null);
  const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);

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
              assignedName: task.assigned_to || specialist?.name || "",
              assignedEmail: task.assigned_email || specialist?.email || "",
              status: task.status as "pending" | "in-progress" | "completed",
              dueDate: task.due_date,
              hasAttachment: task.has_attachment,
              checked: task.checked,
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
  const completedTasks = allTasks.filter((t) => t.checked).length;
  const totalTasks = allTasks.length || 1; // Prevent division by zero
  const readinessScore = Math.round((completedTasks / totalTasks) * 100);
  const openTasks = allTasks.filter((t) => !t.checked).length;
  const highPriorityTasks = allTasks.filter((t) => t.priority === "high" && !t.checked).length;
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

  const handleTaskUpdate = async (taskId: string, partialUpdates: {
    checked?: boolean;
    status?: "pending" | "in-progress" | "completed";
    priority?: "high" | "medium" | "low";
    assignedName?: string;
    assignedEmail?: string;
    dueDate?: string | null;
  }) => {
    // Map UI field names to database column names
    const dbUpdates: any = {};

    if ("checked" in partialUpdates) dbUpdates.checked = partialUpdates.checked;
    if ("status" in partialUpdates) dbUpdates.status = partialUpdates.status;
    if ("priority" in partialUpdates) dbUpdates.priority = partialUpdates.priority;
    if ("assignedName" in partialUpdates) dbUpdates.assigned_to = partialUpdates.assignedName;
    if ("assignedEmail" in partialUpdates) dbUpdates.assigned_email = partialUpdates.assignedEmail;
    if ("dueDate" in partialUpdates) dbUpdates.due_date = partialUpdates.dueDate;

    // Optimistic update - update UI immediately
    setCategories(prevCategories => 
      prevCategories.map(category => ({
        ...category,
        tasks: category.tasks.map(task => 
          task.id === taskId 
            ? { ...task, ...partialUpdates }
            : task
        )
      }))
    );

    // Also update selectedCategory if the task is in it
    setSelectedCategory(prevSelected => {
      if (!prevSelected) return prevSelected;
      return {
        ...prevSelected,
        tasks: prevSelected.tasks.map(task =>
          task.id === taskId
            ? { ...task, ...partialUpdates }
            : task
        )
      };
    });

    try {
      const { error } = await supabase
        .from('deal_tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      await fetchDealData();
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getCategoryCompletion = (category: Category) => {
    const completed = category.tasks.filter((t) => t.checked).length;
    return Math.round((completed / category.tasks.length) * 100);
  };

  const getOpenTasksCount = (category: Category) => {
    return category.tasks.filter((t) => !t.checked).length;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-muted";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return "High Priority (Red)";
      case "medium":
        return "Medium Priority (Yellow)";
      case "low":
        return "Low Priority (Green)";
      default:
        return "Set Priority";
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <SignOutButton />
          </div>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-20 sm:w-24 h-auto" />
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
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Top Summary Section */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* First Row - Readiness Score + Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            {/* Readiness Score Card */}
            <Card className="sm:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
              <CardContent className="py-4 sm:py-6">
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
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
                      <span className="text-xl sm:text-2xl font-bold">{readinessScore}%</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2">{dealName}</p>
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
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
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
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
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
                    {selectedCategory.tasks.filter((t) => t.checked).length} completed · {" "}
                    {selectedCategory.tasks.filter((t) => !t.checked).length} remaining
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-y-auto pr-2 max-h-[calc(80vh-12rem)] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {selectedCategory?.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="backdrop-blur-xl bg-card/40 border border-border/40 hover:bg-card/60 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for completion */}
                      <Checkbox
                        checked={task.checked}
                        onCheckedChange={(checked) => {
                          const isChecked = checked === true;
                          handleTaskUpdate(task.id, { 
                            checked: isChecked,
                            status: isChecked ? 'completed' : 'pending'
                          });
                        }}
                        className="mt-1 rounded-full data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />

                      {/* Priority Flag */}
                      <div className="flex-shrink-0 mt-0.5">
                        <Popover open={openFlagPopover === task.id} onOpenChange={(open) => setOpenFlagPopover(open ? task.id : null)}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Flag className={`h-4 w-4 ${
                                task.priority === 'high' ? 'text-red-500 fill-red-500' :
                                task.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                                task.priority === 'low' ? 'text-green-500 fill-green-500' :
                                'text-muted-foreground'
                              }`} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2">
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-red-500 hover:text-red-500"
                                onClick={() => {
                                  handleTaskUpdate(task.id, { priority: 'high' });
                                  setOpenFlagPopover(null);
                                }}
                              >
                                <Flag className="h-4 w-4 fill-red-500" />
                                High Priority
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-yellow-500 hover:text-yellow-500"
                                onClick={() => {
                                  handleTaskUpdate(task.id, { priority: 'medium' });
                                  setOpenFlagPopover(null);
                                }}
                              >
                                <Flag className="h-4 w-4 fill-yellow-500" />
                                Medium Priority
                              </Button>
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-green-500 hover:text-green-500"
                                onClick={() => {
                                  handleTaskUpdate(task.id, { priority: 'low' });
                                  setOpenFlagPopover(null);
                                }}
                              >
                                <Flag className="h-4 w-4 fill-green-500" />
                                Low Priority
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Task Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className={`font-medium text-sm mb-1 ${task.checked ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title} <span className="text-muted-foreground text-xs">({task.code})</span>
                            </div>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Assign Person */}
                          <Popover open={openAssignPopover === task.id} onOpenChange={(open) => setOpenAssignPopover(open ? task.id : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                              >
                                <User className="h-3 w-3" />
                                {task.assignedName ? task.assignedName : 'Assign'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3 pointer-events-auto">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Assign Person</label>
                                <Input
                                  placeholder="Name"
                                  defaultValue={task.assignedName}
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    if (value !== task.assignedName) {
                                      handleTaskUpdate(task.id, { assignedName: value });
                                    }
                                  }}
                                  className="h-8 text-sm"
                                />
                                <Input
                                  placeholder="Email"
                                  type="email"
                                  defaultValue={task.assignedEmail}
                                  onBlur={(e) => {
                                    const value = e.target.value.trim();
                                    if (value !== task.assignedEmail) {
                                      handleTaskUpdate(task.id, { assignedEmail: value });
                                    }
                                  }}
                                  className="h-8 text-sm"
                                />
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Due Date */}
                          <Popover open={openDatePopover === task.id} onOpenChange={(open) => setOpenDatePopover(open ? task.id : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                              >
                                <Calendar className="h-3 w-3" />
                                {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'Set Due Date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    handleTaskUpdate(task.id, { 
                                      dueDate: format(date, 'yyyy-MM-dd')
                                    });
                                    setOpenDatePopover(null);
                                  }
                                }}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>

                          {task.hasAttachment && (
                            <Badge variant="outline" className="h-7 gap-1 text-xs">
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </Badge>
                          )}
                        </div>

                        {task.assignedEmail && (
                          <div className="text-xs text-muted-foreground">
                            {task.assignedEmail}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Panels - Split into two cards */}
        <div className="grid md:grid-cols-2 gap-6 items-start">
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
                  const completedTasksCount = category.tasks.filter((t) => t.checked).length;

                  return (
                    <Card
                      key={category.id}
                      className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg h-[88px]"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <CardContent className="p-4 h-full flex items-center">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">{category.id}</span>
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{category.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {completedTasksCount} completed · {openTasksCount} remaining
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
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
                  const completedTasksCount = category.tasks.filter((t) => t.checked).length;

                  return (
                    <Card
                      key={category.id}
                      className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg h-[88px]"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <CardContent className="p-4 h-full flex items-center">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-primary font-bold">{category.id}</span>
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="font-semibold text-sm truncate">{category.title}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {completedTasksCount} completed · {openTasksCount} remaining
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
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
