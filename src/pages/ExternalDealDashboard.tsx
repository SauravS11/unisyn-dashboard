import { useEffect, useState } from "react";
import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, AlertCircle, CheckCircle2, Clock, FileText, Flag, User, Calendar, ArrowLeft, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { DocumentsModal } from "@/components/DocumentsModal";
import { getProgressColors } from "@/lib/progressColors";

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

const ExternalDealDashboard = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [dealName, setDealName] = useState<string>("Loading...");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [specialists, setSpecialists] = useState<Array<{ id?: string; name: string; email: string; role: string; category: string; categoryId?: string; categoryOrder?: number; categoryCode?: string }>>([]);
  const [specialistsModalOpen, setSpecialistsModalOpen] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; title: string; code: string }>>([]);
  const [targetCloseDate, setTargetCloseDate] = useState<string | null>(null);
  const [coreTeam, setCoreTeam] = useState<Array<{ full_name: string; email: string; role: string; contact_number: string; permission_level: string }>>([]);
  const [coreTeamModalOpen, setCoreTeamModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, [dealId]);

  const checkAuthorization = async () => {
    const storedAccessToken = sessionStorage.getItem("deal_access_token");
    const storedDealId = sessionStorage.getItem("deal_id");

    if (!storedAccessToken || storedDealId !== dealId) {
      toast.error("Unauthorized access. Please enter the deal code.");
      navigate("/");
      return;
    }

    // Validate access token via secure edge function
    try {
      const { data, error } = await supabase.functions.invoke("validate-deal-access", {
        body: {
          dealId: dealId,
          accessToken: storedAccessToken,
        },
      });

      if (error || !data?.valid) {
        sessionStorage.removeItem("deal_access_token");
        sessionStorage.removeItem("deal_id");
        toast.error("Invalid or expired access. Please enter the deal code again.");
        navigate("/");
        return;
      }

      setIsAuthorized(true);
      fetchDealData(storedAccessToken);
    } catch (err) {
      console.error("Error validating access:", err);
      sessionStorage.removeItem("deal_access_token");
      sessionStorage.removeItem("deal_id");
      toast.error("Failed to validate access. Please try again.");
      navigate("/");
    }
  };

  const fetchDealData = async (accessToken?: string) => {
    if (!dealId) return;

    const token = accessToken || sessionStorage.getItem("deal_access_token");
    if (!token) {
      toast.error("No access token found.");
      navigate("/");
      return;
    }

    try {
      // Fetch all deal data via secure edge function
      const { data, error } = await supabase.functions.invoke("get-deal-data", {
        body: {
          dealId: dealId,
          accessToken: token,
        },
      });

      if (error || !data?.success) {
        console.error("Error fetching deal data:", error || data?.message);
        toast.error("Failed to load deal data. Please try again.");
        return;
      }

      // Set deal info
      setDealName(data.deal.name);
      setTargetCloseDate(data.deal.target_close_date);

      const categoriesData = data.categories || [];
      const tasksData = data.tasks || [];
      const specialistsData = data.specialists || [];

      // Map specialists with category names for display and sort by category order (A-N)
      const specialistsList = specialistsData.map((specialist: any) => {
        const category = categoriesData.find((cat: any) => cat.id === specialist.category_id);
        return {
          id: specialist.id,
          name: specialist.name,
          email: specialist.email,
          role: specialist.role,
          category: category?.title || 'Unknown',
          categoryId: specialist.category_id,
          categoryOrder: category?.category_order || 999,
          categoryCode: category?.category_code || '',
        };
      }).sort((a: any, b: any) => a.categoryOrder - b.categoryOrder);
      setSpecialists(specialistsList);
      
      // Set available categories for the add specialist form
      setAvailableCategories(categoriesData.map((cat: any) => ({
        id: cat.id,
        title: cat.title,
        code: cat.category_code,
      })));

      // Build categories with tasks
      const categoriesWithTasks: Category[] = categoriesData.map((category: any) => {
        const categoryTasks = tasksData.filter((task: any) => task.category_id === category.id);
        const specialist = specialistsData.find((s: any) => s.category_id === category.id);

        return {
          id: category.category_code,
          title: category.title,
          tasks: categoryTasks.map((task: any) => ({
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
      setDocumentsCount(data.documentsCount || 0);
      setCoreTeam(data.coreTeam || []);
    } catch (error) {
      console.error('Error fetching deal data:', error);
      toast.error("Failed to load deal data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const allTasks = categories.flatMap((cat) => cat.tasks);
  const completedTasks = allTasks.filter((t) => t.checked).length;
  const totalTasks = allTasks.length || 1;
  const readinessScore = Math.round((completedTasks / totalTasks) * 100);
  const openTasks = allTasks.filter((t) => !t.checked).length;
  const highPriorityTasks = allTasks.filter((t) => t.priority === "high" && !t.checked).length;
  const specialistsAssigned = new Set(allTasks.filter((t) => t.assignedName).map((t) => t.assignedEmail)).size;

  // Calculate days until close (comparing dates without time)
  const daysUntilClose = targetCloseDate 
    ? (() => {
        const target = new Date(targetCloseDate);
        const today = new Date();
        // Reset both to start of day for accurate day comparison
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      })()
    : null;

  const handleExit = () => {
    sessionStorage.removeItem("deal_access_token");
    sessionStorage.removeItem("deal_id");
    navigate("/");
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <div className="text-lg text-muted-foreground">Verifying access...</div>
        </div>
      </div>
    );
  }

  const getCategoryCompletion = (category: Category) => {
    const completed = category.tasks.filter((t) => t.checked).length;
    return Math.round((completed / category.tasks.length) * 100);
  };

  const getOpenTasksCount = (category: Category) => {
    return category.tasks.filter((t) => !t.checked).length;
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            className="absolute top-4 left-4 sm:top-6 sm:left-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Exit
          </Button>
          <Badge className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-primary/10 text-primary border-primary/20">
            <Lock className="h-3 w-3 mr-1" />
            External View
          </Badge>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-36 sm:w-44 h-auto mt-8 sm:mt-0" />
          <h1 className="text-lg sm:text-xl font-semibold text-center">{dealName}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Top Summary Section */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* First Row - Readiness Score + Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6">
            {/* Readiness Score Card */}
            <Card className={`sm:col-span-2 backdrop-blur-xl bg-card/60 border-2 ${getProgressColors(readinessScore).ring} shadow-2xl`}>
              <CardContent className="py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - readinessScore / 100)}`}
                        className={`${getProgressColors(readinessScore).stroke} transition-all duration-500`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl sm:text-2xl font-bold ${getProgressColors(readinessScore).text}`}>{readinessScore}%</span>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-2">{dealName}</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Readiness Score · <span className={`font-semibold ${getProgressColors(readinessScore).text}`}>{getProgressColors(readinessScore).label}</span>
                    </p>
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
                  <Button variant="link" className="mt-2 text-xs">View Details</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - Days Until Close + Core Team + Documents */}
          <div className="grid md:grid-cols-5 gap-6">
            {/* Days Until Close Card - Read Only */}
            <Card 
              className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl"
            >
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      {daysUntilClose !== null && (
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`}
                          className="text-accent transition-all duration-500"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {daysUntilClose !== null ? (
                        <span className={`text-2xl font-bold ${daysUntilClose < 0 ? 'text-destructive' : ''}`}>
                          {daysUntilClose < 0 ? `+${Math.abs(daysUntilClose)}` : daysUntilClose}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {daysUntilClose !== null && daysUntilClose < 0 ? 'Days Overdue' : 'Days Until Close'}
                    </p>
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
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
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
                    <Button variant="link" className="text-xs p-0 h-auto">View Details</Button>
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

        {/* Core Team Modal */}
        <Dialog open={coreTeamModalOpen} onOpenChange={setCoreTeamModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Core Deal <span className="text-red-500">Team</span></DialogTitle>
              <DialogDescription>View all core team members for this deal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {coreTeam.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No core team members have been added yet</div>
              ) : (
                coreTeam.map((member, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{member.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm"><span className="text-muted-foreground">Email:</span> {member.email}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Contact:</span> {member.contact_number}</p>
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
            <DialogHeader className="flex flex-row items-start justify-between pr-8">
              <div className="space-y-2">
                <DialogTitle>Specialists Assigned</DialogTitle>
                <DialogDescription className="mt-1.5">
                  View and add specialists to this deal
                </DialogDescription>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {/* Specialists List - View Only */}
              {specialists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No specialists have been assigned yet
                </div>
              ) : (
                specialists.map((specialist, index) => (
                  <Card key={specialist.id || index} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-semibold text-base">{specialist.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">{specialist.email}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {specialist.role}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {specialist.categoryCode}. {specialist.category}
                        </Badge>
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
            <div className="space-y-3 overflow-y-auto pr-2 max-h-[calc(80vh-12rem)]">
              {selectedCategory?.tasks.map((task) => (
                <Card key={task.id} className="backdrop-blur-xl bg-card/40 border border-border/40 hover:bg-card/60 transition-colors">
                  <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                      {/* Checkbox - Read Only */}
                      <Checkbox
                        checked={task.checked}
                        disabled
                        className="mt-1 rounded-full data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                      />

                      {/* Priority Flag - Display Only */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="h-8 w-8 flex items-center justify-center">
                          <Flag className={`h-4 w-4 ${
                            task.priority === 'high' ? 'text-red-500 fill-red-500' :
                            task.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' :
                            task.priority === 'low' ? 'text-green-500 fill-green-500' :
                            'text-muted-foreground'
                          }`} />
                        </div>
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

                        {/* Display Only - No Actions Allowed */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {/* Assigned Person - Display Only */}
                          {task.assignedName && (
                            <Badge variant="outline" className="h-7 text-xs gap-1">
                              <User className="h-3 w-3" />
                              {task.assignedName}
                            </Badge>
                          )}

                          {/* Due Date - Display Only */}
                          {task.dueDate && (
                            <Badge variant="outline" className="h-7 text-xs gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                            </Badge>
                          )}

                          {task.hasAttachment && (
                            <Badge variant="outline" className="h-7 gap-1 text-xs">
                              <Paperclip className="h-3 w-3" />Attachment
                            </Badge>
                          )}
                        </div>

                        {task.assignedEmail && (
                          <div className="text-xs text-muted-foreground">{task.assignedEmail}</div>
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
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* First Half - Categories 1-7 */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (1-7)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {categories.slice(0, 7).map((category) => {
                  const completion = getCategoryCompletion(category);
                  const openTasksCount = getOpenTasksCount(category);
                  const completedTasksCount = category.tasks.filter((t) => t.checked).length;
                  const colors = getProgressColors(completion);

                  return (
                    <Card
                      key={category.id}
                      className={`backdrop-blur-xl bg-background/40 border-2 ${colors.ring} cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg overflow-hidden`}
                      onClick={() => { setSelectedCategory(category); setCategoryModalOpen(true); }}
                    >
                      <CardContent className="p-2.5 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`font-bold text-xs sm:text-base ${colors.text}`}>{category.id}</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-xs sm:text-sm truncate">{category.title}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {completedTasksCount}/{category.tasks.length} done · <span className={colors.text}>{colors.label}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right pl-1">
                            <div className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${colors.text}`}>{completion}%</div>
                            <Progress value={completion} indicatorClassName={colors.bar} className="w-10 sm:w-20 h-1.5 sm:h-2 mt-0.5" />
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
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (8-14)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {categories.slice(7).map((category) => {
                  const completion = getCategoryCompletion(category);
                  const openTasksCount = getOpenTasksCount(category);
                  const completedTasksCount = category.tasks.filter((t) => t.checked).length;
                  const colors = getProgressColors(completion);

                  return (
                    <Card
                      key={category.id}
                      className={`backdrop-blur-xl bg-background/40 border-2 ${colors.ring} cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg overflow-hidden`}
                      onClick={() => { setSelectedCategory(category); setCategoryModalOpen(true); }}
                    >
                      <CardContent className="p-2.5 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`font-bold text-xs sm:text-base ${colors.text}`}>{category.id}</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-xs sm:text-sm truncate">{category.title}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {completedTasksCount}/{category.tasks.length} done · <span className={colors.text}>{colors.label}</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right pl-1">
                            <div className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${colors.text}`}>{completion}%</div>
                            <Progress value={completion} indicatorClassName={colors.bar} className="w-10 sm:w-20 h-1.5 sm:h-2 mt-0.5" />
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
        dealId={dealId || ''}
      />
    </div>
  );
};

export default ExternalDealDashboard;