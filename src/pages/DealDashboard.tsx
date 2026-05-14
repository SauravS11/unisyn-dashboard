import { useEffect, useState, useRef } from "react";
import * as React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, AlertCircle, CheckCircle2, Clock, FileText, Flag, User, Calendar, Upload } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentsModal } from "@/components/DocumentsModal";
import { SpecialistAssignmentModal } from "@/components/SpecialistAssignmentModal";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { PageNavigation } from "@/components/PageNavigation";
import { SignOutButton } from "@/components/SignOutButton";
import { specialistSchema, validateInput } from "@/lib/validation";
import { handleError, logDebug } from "@/lib/errorHandler";
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
const DealDashboard = () => {
  const {
    id: dealId
  } = useParams<{
    id: string;
  }>();
  const {
    toast
  } = useToast();
  const [dealName, setDealName] = useState<string>("Loading...");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
  const [specialists, setSpecialists] = useState<Array<{
    id?: string;
    name: string;
    email: string;
    role: string;
    category: string;
    categoryId?: string;
    categoryOrder?: number;
    categoryCode?: string;
  }>>([]);
  const [specialistsModalOpen, setSpecialistsModalOpen] = useState(false);
  const [targetCloseDate, setTargetCloseDate] = useState<string | null>(null);
  const [coreTeam, setCoreTeam] = useState<Array<{
    full_name: string;
    email: string;
    role: string;
    contact_number: string;
    permission_level: string;
  }>>([]);
  const [coreTeamModalOpen, setCoreTeamModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [openFlagPopover, setOpenFlagPopover] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<string | null>(null);
  const [openDatePopover, setOpenDatePopover] = useState<string | null>(null);
  const [newSpecialist, setNewSpecialist] = useState({
    name: '',
    email: '',
    role: '',
    categoryId: ''
  });
  const [addingSpecialist, setAddingSpecialist] = useState(false);
  const [showAddSpecialistForm, setShowAddSpecialistForm] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Array<{
    id: string;
    title: string;
    code: string;
  }>>([]);
  const [closeDateDialogOpen, setCloseDateDialogOpen] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTaskForUpload, setSelectedTaskForUpload] = useState<{
    taskId: string;
    categoryCode: string;
    categoryName: string;
  } | null>(null);
  const [dealParties, setDealParties] = useState<{
    buyerName: string | null;
    buyerEmail: string | null;
    sellerName: string | null;
    sellerEmail: string | null;
    buyerLegalName: string | null;
    buyerLegalEmail: string | null;
    sellerLegalName: string | null;
    sellerLegalEmail: string | null;
  }>({
    buyerName: null,
    buyerEmail: null,
    sellerName: null,
    sellerEmail: null,
    buyerLegalName: null,
    buyerLegalEmail: null,
    sellerLegalName: null,
    sellerLegalEmail: null
  });
  useEffect(() => {
    fetchDealData();
  }, [dealId, toast]);
  const fetchDealData = async () => {
    if (!dealId) return;
    try {
      // Fetch deal information
      const {
        data: dealData,
        error: dealError
      } = await supabase.from('deals').select('name, target_close_date, buyer_name, buyer_email, seller_name, seller_email, buyer_legal_name, buyer_legal_email, seller_legal_name, seller_legal_email').eq('id', dealId).single();
      if (dealError) throw dealError;
      setDealName(dealData.name);
      setTargetCloseDate(dealData.target_close_date);
      setDealParties({
        buyerName: dealData.buyer_name,
        buyerEmail: dealData.buyer_email,
        sellerName: dealData.seller_name,
        sellerEmail: dealData.seller_email,
        buyerLegalName: dealData.buyer_legal_name,
        buyerLegalEmail: dealData.buyer_legal_email,
        sellerLegalName: dealData.seller_legal_name,
        sellerLegalEmail: dealData.seller_legal_email
      });

      // Fetch categories with their tasks and specialists
      const {
        data: categoriesData,
        error: categoriesError
      } = await supabase.from('deal_categories').select(`
            id,
            title,
            category_code,
            category_order
          `).eq('deal_id', dealId).order('category_order');
      if (categoriesError) throw categoriesError;

      // Fetch tasks for all categories
      const categoryIds = categoriesData.map(cat => cat.id);
      const {
        data: tasksData,
        error: tasksError
      } = await supabase.from('deal_tasks').select('*').in('category_id', categoryIds).order('task_order');
      if (tasksError) throw tasksError;

      // Fetch specialists for all categories
      const {
        data: specialistsData,
        error: specialistsError
      } = await supabase.from('deal_specialists').select('*').in('category_id', categoryIds);
      if (specialistsError) throw specialistsError;

      // Map specialists with category names for display and sort by category order (A-N)
      const specialistsList = specialistsData.map(specialist => {
        const category = categoriesData.find(cat => cat.id === specialist.category_id);
        return {
          id: specialist.id,
          name: specialist.name,
          email: specialist.email,
          role: specialist.role,
          category: category?.title || 'Unknown',
          categoryId: specialist.category_id,
          categoryOrder: category?.category_order || 999,
          categoryCode: category?.category_code || 'Z'
        };
      }).sort((a, b) => a.categoryOrder - b.categoryOrder);
      setSpecialists(specialistsList);

      // Store available categories for the add specialist form
      setAvailableCategories(categoriesData.map(cat => ({
        id: cat.id,
        title: cat.title,
        code: cat.category_code
      })));

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
            checked: task.checked
          }))
        };
      });
      setCategories(categoriesWithTasks);

      // Fetch documents count
      const {
        count: docsCount,
        error: docsError
      } = await supabase.from('deal_documents').select('*', {
        count: 'exact',
        head: true
      }).eq('deal_id', dealId);
      if (!docsError && docsCount !== null) {
        setDocumentsCount(docsCount);
      }

      // Fetch core team members
      const {
        data: coreTeamData,
        error: coreTeamError
      } = await supabase.from('deal_team_members').select('*').eq('deal_id', dealId);
      if (!coreTeamError && coreTeamData) {
        setCoreTeam(coreTeamData);
      }
    } catch (error) {
      const { message } = handleError("fetching deal data", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const allTasks = categories.flatMap(cat => cat.tasks);
  const completedTasks = allTasks.filter(t => t.checked).length;
  const totalTasks = allTasks.length || 1; // Prevent division by zero
  const readinessScore = Math.round(completedTasks / totalTasks * 100);
  const openTasks = allTasks.filter(t => !t.checked).length;
  const highPriorityTasks = allTasks.filter(t => t.priority === "high" && !t.checked).length;
  const specialistsAssigned = new Set(allTasks.filter(t => t.assignedName).map(t => t.assignedEmail)).size;

  // Calculate days until close (comparing dates without time)
  const daysUntilClose = targetCloseDate ? (() => {
    const target = new Date(targetCloseDate);
    const today = new Date();
    // Reset both to start of day for accurate day comparison
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  })() : null;
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading deal data...</div>
        </div>
      </div>;
  }
  const handleTaskUpdate = async (taskId: string, partialUpdates: {
    checked?: boolean;
    status?: "pending" | "in-progress" | "completed";
    priority?: "high" | "medium" | "low";
    assignedName?: string;
    assignedEmail?: string;
    dueDate?: string | null;
    hasAttachment?: boolean;
  }) => {
    // Map UI field names to database column names
    const dbUpdates: any = {};
    if ("checked" in partialUpdates) dbUpdates.checked = partialUpdates.checked;
    if ("status" in partialUpdates) dbUpdates.status = partialUpdates.status;
    if ("priority" in partialUpdates) dbUpdates.priority = partialUpdates.priority;
    if ("assignedName" in partialUpdates) dbUpdates.assigned_to = partialUpdates.assignedName;
    if ("assignedEmail" in partialUpdates) dbUpdates.assigned_email = partialUpdates.assignedEmail;
    if ("dueDate" in partialUpdates) dbUpdates.due_date = partialUpdates.dueDate;
    if ("hasAttachment" in partialUpdates) dbUpdates.has_attachment = partialUpdates.hasAttachment;

    // Optimistic update - update UI immediately
    setCategories(prevCategories => prevCategories.map(category => ({
      ...category,
      tasks: category.tasks.map(task => task.id === taskId ? {
        ...task,
        ...partialUpdates
      } : task)
    })));

    // Also update selectedCategory if the task is in it
    setSelectedCategory(prevSelected => {
      if (!prevSelected) return prevSelected;
      return {
        ...prevSelected,
        tasks: prevSelected.tasks.map(task => task.id === taskId ? {
          ...task,
          ...partialUpdates
        } : task)
      };
    });
    try {
      const {
        error
      } = await supabase.from('deal_tasks').update(dbUpdates).eq('id', taskId);
      if (error) throw error;
    } catch (error) {
      const { message } = handleError("updating task", error);
      // Revert on error
      await fetchDealData();
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };
  const handleAddSpecialist = async (specialist: {
    name: string;
    email: string;
    role: string;
    categoryId: string;
  }) => {
    logDebug("handleAddSpecialist", "called with", specialist);
    
    if (!dealId) {
      logDebug("handleAddSpecialist", "No dealId found");
      return;
    }

    // Validate specialist input
    const validationResult = validateInput(specialistSchema, specialist);
    if (validationResult.success === false) {
      toast({
        title: "Validation Error",
        description: validationResult.errors[0] || "Invalid input",
        variant: "destructive"
      });
      return;
    }

    const validatedData = validationResult.data;

    try {
      logDebug("handleAddSpecialist", "Inserting specialist into database");
      const {
        error
      } = await supabase.from('deal_specialists').insert({
        deal_id: dealId,
        category_id: validatedData.categoryId,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role || 'Specialist'
      });
      if (error) {
        throw error;
      }
      logDebug("handleAddSpecialist", "Specialist added successfully");
      toast({
        title: "Specialist Added",
        description: `${validatedData.name} has been added as a specialist.`
      });

      // Refresh data to get the new specialist
      logDebug("handleAddSpecialist", "Refreshing deal data");
      await fetchDealData();

      // Assign the newly added specialist to the task
      if (selectedTaskForAssignment) {
        logDebug("handleAddSpecialist", "Assigning specialist to task", selectedTaskForAssignment);
        await handleTaskUpdate(selectedTaskForAssignment, {
          assignedName: validatedData.name,
          assignedEmail: validatedData.email
        });
      }
    } catch (error) {
      const { message } = handleError("adding specialist", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };
  const handleAssignSpecialist = async (specialist: {
    name: string;
    email: string;
  }) => {
    if (!selectedTaskForAssignment) return;
    await handleTaskUpdate(selectedTaskForAssignment, {
      assignedName: specialist.name,
      assignedEmail: specialist.email
    });
  };
  const handleCloseDateChange = async (date: Date | undefined) => {
    if (!dealId || !date) return;
    const formattedDate = format(date, 'yyyy-MM-dd');

    // Optimistic update
    setTargetCloseDate(formattedDate);
    setCloseDateDialogOpen(false);
    try {
      const {
        error
      } = await supabase.from('deals').update({
        target_close_date: formattedDate
      }).eq('id', dealId);
      if (error) throw error;
      toast({
        title: "Date Updated",
        description: `Target close date set to ${format(date, 'PPP')}`
      });
    } catch (error) {
      const { message } = handleError("updating close date", error);
      // Revert on error
      await fetchDealData();
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  };
  const handleTaskFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedTaskForUpload || !dealId) return;
    setUploadingTaskId(selectedTaskForUpload.taskId);
    try {
      const file = files[0];
      const fileName = `${dealId}/${Date.now()}-${file.name}`;

      // Upload file to storage
      const {
        error: uploadError
      } = await supabase.storage.from('deal-documents').upload(fileName, file);
      if (uploadError) throw uploadError;

      // Get current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      // Get category code for the document category
      const categoryLabel = `${selectedTaskForUpload.categoryCode} - ${selectedTaskForUpload.categoryName}`;

      // Get task title for notes
      const task = categories.flatMap(c => c.tasks).find(t => t.id === selectedTaskForUpload.taskId);

      // Save document metadata to database with task reference
      const {
        error: dbError
      } = await supabase.from('deal_documents').insert({
        deal_id: dealId,
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        file_type: file.type || null,
        uploaded_by: user?.id,
        category: categoryLabel,
        notes: task ? `Uploaded from task: ${task.title} (${task.code})` : null,
        task_id: selectedTaskForUpload.taskId
      });
      if (dbError) throw dbError;

      // Update task to show it has attachment
      await handleTaskUpdate(selectedTaskForUpload.taskId, {
        hasAttachment: true
      });

      // Update documents count
      setDocumentsCount(prev => prev + 1);
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded to this task.`
      });

      // Reset
      if (taskFileInputRef.current) {
        taskFileInputRef.current.value = '';
      }
      setSelectedTaskForUpload(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document.",
        variant: "destructive"
      });
    } finally {
      setUploadingTaskId(null);
    }
  };
  const getCategoryCompletion = (category: Category) => {
    const completed = category.tasks.filter(t => t.checked).length;
    return Math.round(completed / category.tasks.length * 100);
  };
  const getOpenTasksCount = (category: Category) => {
    return category.tasks.filter(t => !t.checked).length;
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
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>;
      case "pending":
        return <Badge className="bg-muted/50 text-muted-foreground border-border/50">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>;
      default:
        return null;
    }
  };
  return <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Hidden file input for task document uploads */}
      <input ref={taskFileInputRef} type="file" className="hidden" onChange={handleTaskFileUpload} accept="*" />
      
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
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <SignOutButton />
          </div>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-36 sm:w-44 h-auto" />
          <PageNavigation items={[{
          to: "/welcome",
          label: "Home"
        }, {
          to: "/deals",
          label: "Deals"
        }, {
          to: `/deals/${dealId}/dashboard`,
          label: dealName,
          isActive: true
        }]} />
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
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - readinessScore / 100)}`} className="text-primary transition-all duration-500" strokeLinecap="round" />
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

            <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow" onClick={() => setSpecialistsModalOpen(true)}>
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
            <Card className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl cursor-pointer hover:shadow-2xl transition-shadow" onClick={() => setCloseDateDialogOpen(true)}>
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      {daysUntilClose !== null && <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`} className="text-accent transition-all duration-500" strokeLinecap="round" />}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      {daysUntilClose !== null ? <span className={`text-2xl font-bold ${daysUntilClose < 0 ? 'text-destructive' : ''}`}>
                          {daysUntilClose < 0 ? `+${Math.abs(daysUntilClose)}` : daysUntilClose}
                        </span> : <span className="text-sm font-semibold text-muted-foreground">N/A</span>}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      {daysUntilClose !== null && daysUntilClose < 0 ? 'Days Overdue' : 'Days Until Close'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target: {targetCloseDate ? new Date(targetCloseDate).toLocaleDateString() : 'Not set'}
                    </p>
                    <Button variant="link" className="text-xs p-0 h-auto mt-1">
                      Change Date
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Close Date Dialog */}
            <Dialog open={closeDateDialogOpen} onOpenChange={setCloseDateDialogOpen}>
              <DialogContent className="w-[90vw] sm:w-[70vw] lg:w-[50vw] max-w-none p-0 overflow-hidden backdrop-blur-2xl bg-background/80 border-border/50 shadow-2xl">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                    <div className="flex flex-col">
                      <DialogTitle className="font-bold text-lg">Change Target Close Date</DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Select a new target close date for this deal
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center justify-center p-6 sm:p-8">
                    <CalendarComponent mode="single" selected={targetCloseDate ? new Date(targetCloseDate) : undefined} onSelect={handleCloseDateChange} disabled={date => date < new Date() || date > new Date("2035-12-31")} initialFocus className="p-3 pointer-events-auto bg-card/60 backdrop-blur-xl rounded-lg border border-border/30" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl cursor-pointer hover:shadow-2xl transition-shadow" onClick={() => setCoreTeamModalOpen(true)}>
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-8">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * 0.25}`} className="text-accent transition-all duration-500" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">
                        {coreTeam.length + (dealParties.buyerName ? 1 : 0) + (dealParties.sellerName ? 1 : 0) + (dealParties.buyerLegalName ? 1 : 0) + (dealParties.sellerLegalName ? 1 : 0)}
                      </span>
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

            <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow" onClick={() => setDocumentsModalOpen(true)}>
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
        <DocumentsModal open={documentsModalOpen} onOpenChange={open => {
        setDocumentsModalOpen(open);
        if (!open) {
          // Refresh documents count when modal closes
          fetchDealData();
        }
      }} dealId={dealId!} />

        {/* Core Team Modal */}
        <Dialog open={coreTeamModalOpen} onOpenChange={setCoreTeamModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Core Deal <span className="text-red-500">Team</span></DialogTitle>
              <DialogDescription>
                View all core team members and deal parties for this deal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {/* Deal Parties Section */}
              {(dealParties.buyerName || dealParties.sellerName) && <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Deal Parties</h3>
                  
                  {/* Buyer */}
                  {dealParties.buyerName && <Card className="border-border/50 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{dealParties.buyerName}</h3>
                            <p className="text-sm text-muted-foreground">Buyer</p>
                            {dealParties.buyerEmail && <p className="text-sm mt-2">
                                <span className="text-muted-foreground">Email:</span> {dealParties.buyerEmail}
                              </p>}
                          </div>
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Buyer</Badge>
                        </div>
                      </CardContent>
                    </Card>}

                  {/* Buyer Legal Party */}
                  {dealParties.buyerLegalName && <Card className="border-border/50 bg-blue-500/5 ml-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{dealParties.buyerLegalName}</h3>
                            <p className="text-sm text-muted-foreground">Buyer's Legal Representative</p>
                            {dealParties.buyerLegalEmail && <p className="text-sm mt-2">
                                <span className="text-muted-foreground">Email:</span> {dealParties.buyerLegalEmail}
                              </p>}
                          </div>
                          <Badge variant="outline" className="text-blue-500 border-blue-500/50">Legal Party</Badge>
                        </div>
                      </CardContent>
                    </Card>}

                  {/* Seller */}
                  {dealParties.sellerName && <Card className="border-border/50 bg-primary/5">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{dealParties.sellerName}</h3>
                            <p className="text-sm text-muted-foreground">Seller</p>
                            {dealParties.sellerEmail && <p className="text-sm mt-2">
                                <span className="text-muted-foreground">Email:</span> {dealParties.sellerEmail}
                              </p>}
                          </div>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Seller</Badge>
                        </div>
                      </CardContent>
                    </Card>}

                  {/* Seller Legal Party */}
                  {dealParties.sellerLegalName && <Card className="border-border/50 bg-green-500/5 ml-4">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{dealParties.sellerLegalName}</h3>
                            <p className="text-sm text-muted-foreground">Seller's Legal Representative</p>
                            {dealParties.sellerLegalEmail && <p className="text-sm mt-2">
                                <span className="text-muted-foreground">Email:</span> {dealParties.sellerLegalEmail}
                              </p>}
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500/50">Legal Party</Badge>
                        </div>
                      </CardContent>
                    </Card>}
                </div>}

              {/* Core Team Members Section */}
              {coreTeam.length > 0 && <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Core Team Members</h3>
                  {coreTeam.map((member, index) => <Card key={index} className="border-border/50">
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
                    </Card>)}
                </div>}

              {/* Empty State */}
              {coreTeam.length === 0 && !dealParties.buyerName && !dealParties.sellerName && <div className="text-center py-8 text-muted-foreground">
                  No core team members or deal parties have been added yet
                </div>}
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
              <Button variant={showAddSpecialistForm ? "secondary" : "default"} size="sm" onClick={() => setShowAddSpecialistForm(!showAddSpecialistForm)}>
                {showAddSpecialistForm ? "Cancel" : "Add New"}
              </Button>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {/* Add Specialist Form - Collapsible */}
              {showAddSpecialistForm && <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="text-sm font-semibold text-primary mb-3">Add New Specialist</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Name" value={newSpecialist.name} onChange={e => setNewSpecialist(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} className="bg-background/50" />
                      <Input placeholder="Email" type="email" value={newSpecialist.email} onChange={e => setNewSpecialist(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} className="bg-background/50" />
                      <Select value={newSpecialist.role} onValueChange={value => setNewSpecialist(prev => ({
                    ...prev,
                    role: value
                  }))}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border/50 max-h-[300px]">
                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Legal & Regulatory</SelectLabel>
                            <SelectItem value="Legal Advisor">Legal Advisor</SelectItem>
                            <SelectItem value="M&A Lawyer">M&A Lawyer</SelectItem>
                            <SelectItem value="Corporate Lawyer">Corporate Lawyer</SelectItem>
                            <SelectItem value="Contract Specialist">Contract Specialist</SelectItem>
                            <SelectItem value="Regulatory Specialist">Regulatory Specialist</SelectItem>
                            <SelectItem value="Compliance Officer">Compliance Officer</SelectItem>
                            <SelectItem value="Governance & Risk Advisor">Governance & Risk Advisor</SelectItem>
                            <SelectItem value="Intellectual Property Lawyer">Intellectual Property Lawyer</SelectItem>
                            <SelectItem value="Data Privacy Officer">Data Privacy Officer</SelectItem>
                            <SelectItem value="Labour Law Specialist">Labour Law Specialist</SelectItem>
                            <SelectItem value="Environmental & Sustainability Legal Specialist">Environmental & Sustainability Legal Specialist</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Financial & Deal Structuring</SelectLabel>
                            <SelectItem value="Financial Advisor">Financial Advisor</SelectItem>
                            <SelectItem value="Corporate Finance Analyst">Corporate Finance Analyst</SelectItem>
                            <SelectItem value="Valuation Specialist">Valuation Specialist</SelectItem>
                            <SelectItem value="Investment Banker">Investment Banker</SelectItem>
                            <SelectItem value="Financial Modelling Specialist">Financial Modelling Specialist</SelectItem>
                            <SelectItem value="Tax Specialist">Tax Specialist</SelectItem>
                            <SelectItem value="Commercial Due Diligence Analyst">Commercial Due Diligence Analyst</SelectItem>
                            <SelectItem value="Audit & Assurance Specialist">Audit & Assurance Specialist</SelectItem>
                            <SelectItem value="Forensic Accountant">Forensic Accountant</SelectItem>
                            <SelectItem value="Treasury & Cashflow Specialist">Treasury & Cashflow Specialist</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Operations & Business</SelectLabel>
                            <SelectItem value="Operations Consultant">Operations Consultant</SelectItem>
                            <SelectItem value="Business Analyst">Business Analyst</SelectItem>
                            <SelectItem value="Process Improvement Specialist">Process Improvement Specialist</SelectItem>
                            <SelectItem value="KPI Analyst">KPI Analyst</SelectItem>
                            <SelectItem value="Procurement Specialist">Procurement Specialist</SelectItem>
                            <SelectItem value="Supply Chain Advisor">Supply Chain Advisor</SelectItem>
                            <SelectItem value="Business Continuity Specialist">Business Continuity Specialist</SelectItem>
                            <SelectItem value="Integration & Post-Merger Specialist">Integration & Post-Merger Specialist</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Technology & Systems</SelectLabel>
                            <SelectItem value="IT Specialist">IT Specialist</SelectItem>
                            <SelectItem value="Cybersecurity Specialist">Cybersecurity Specialist</SelectItem>
                            <SelectItem value="Cloud Architect">Cloud Architect</SelectItem>
                            <SelectItem value="Systems Integration Consultant">Systems Integration Consultant</SelectItem>
                            <SelectItem value="Software Compliance Specialist">Software Compliance Specialist</SelectItem>
                            <SelectItem value="Data Migration Specialist">Data Migration Specialist</SelectItem>
                            <SelectItem value="Technical Due Diligence Analyst">Technical Due Diligence Analyst</SelectItem>
                            <SelectItem value="Infrastructure Engineer">Infrastructure Engineer</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Human Capital</SelectLabel>
                            <SelectItem value="HR Specialist">HR Specialist</SelectItem>
                            <SelectItem value="HR Compliance Lead">HR Compliance Lead</SelectItem>
                            <SelectItem value="Organisational Development Consultant">Organisational Development Consultant</SelectItem>
                            <SelectItem value="Talent Acquisition Lead">Talent Acquisition Lead</SelectItem>
                            <SelectItem value="Compensation & Benefits Analyst">Compensation & Benefits Analyst</SelectItem>
                            <SelectItem value="Culture & Transformation Specialist">Culture & Transformation Specialist</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Industry-Specific Specialists</SelectLabel>
                            <SelectItem value="Healthcare Compliance Specialist">Healthcare Compliance Specialist</SelectItem>
                            <SelectItem value="Real Estate Valuer">Real Estate Valuer</SelectItem>
                            <SelectItem value="Engineering Consultant">Engineering Consultant</SelectItem>
                            <SelectItem value="Manufacturing Efficiency Consultant">Manufacturing Efficiency Consultant</SelectItem>
                            <SelectItem value="Retail Operations Specialist">Retail Operations Specialist</SelectItem>
                            <SelectItem value="FinTech Regulatory Advisor">FinTech Regulatory Advisor</SelectItem>
                            <SelectItem value="Telecommunications Engineer">Telecommunications Engineer</SelectItem>
                            <SelectItem value="Energy Sector Analyst">Energy Sector Analyst</SelectItem>
                            <SelectItem value="Mining Compliance Expert">Mining Compliance Expert</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Strategic & Management</SelectLabel>
                            <SelectItem value="Strategic Advisor">Strategic Advisor</SelectItem>
                            <SelectItem value="Board Consultant">Board Consultant</SelectItem>
                            <SelectItem value="Change Management Specialist">Change Management Specialist</SelectItem>
                            <SelectItem value="Project Manager">Project Manager</SelectItem>
                            <SelectItem value="Risk Management Consultant">Risk Management Consultant</SelectItem>
                            <SelectItem value="ESG Specialist">ESG Specialist</SelectItem>
                          </SelectGroup>

                          <SelectGroup>
                            <SelectLabel className="font-bold text-destructive">Other</SelectLabel>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <Select value={newSpecialist.categoryId} onValueChange={value => setNewSpecialist(prev => ({
                    ...prev,
                    categoryId: value
                  }))}>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border/50 max-h-60">
                          {availableCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>
                              {cat.code}. {cat.title}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="mt-3 w-full" onClick={async () => {
                  if (!newSpecialist.name || !newSpecialist.email || !newSpecialist.categoryId) return;
                  setAddingSpecialist(true);
                  await handleAddSpecialist({
                    name: newSpecialist.name,
                    email: newSpecialist.email,
                    role: newSpecialist.role,
                    categoryId: newSpecialist.categoryId
                  });
                  setNewSpecialist({
                    name: '',
                    email: '',
                    role: '',
                    categoryId: ''
                  });
                  setShowAddSpecialistForm(false);
                  setAddingSpecialist(false);
                }} disabled={addingSpecialist || !newSpecialist.name || !newSpecialist.email || !newSpecialist.categoryId}>
                      {addingSpecialist ? "Adding..." : "Add Specialist"}
                    </Button>
                  </CardContent>
                </Card>}

              {/* Specialists List */}
              {specialists.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  No specialists have been assigned yet
                </div> : specialists.map((specialist, index) => <Card key={specialist.id || index} className="border-border/50">
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
                  </Card>)}
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
                {selectedCategory && <>
                    {selectedCategory.tasks.filter(t => t.checked).length} completed · {" "}
                    {selectedCategory.tasks.filter(t => !t.checked).length} remaining
                  </>}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 overflow-y-auto pr-2 max-h-[calc(80vh-12rem)] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
              {selectedCategory?.tasks.map(task => <Card key={task.id} className="backdrop-blur-xl bg-card/40 border border-border/40 hover:bg-card/60 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox for completion */}
                      <Checkbox checked={task.checked} onCheckedChange={checked => {
                    const isChecked = checked === true;
                    handleTaskUpdate(task.id, {
                      checked: isChecked,
                      status: isChecked ? 'completed' : 'pending'
                    });
                  }} className="mt-1 rounded-full data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />

                      {/* Priority Flag */}
                      <div className="flex-shrink-0 mt-0.5">
                        <Popover open={openFlagPopover === task.id} onOpenChange={open => setOpenFlagPopover(open ? task.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Flag className={`h-4 w-4 ${task.priority === 'high' ? 'text-red-500 fill-red-500' : task.priority === 'medium' ? 'text-yellow-500 fill-yellow-500' : task.priority === 'low' ? 'text-green-500 fill-green-500' : 'text-muted-foreground'}`} />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2">
                            <div className="space-y-1">
                              <Button variant="ghost" className="w-full justify-start gap-2 text-red-500 hover:text-red-500" onClick={() => {
                            handleTaskUpdate(task.id, {
                              priority: 'high'
                            });
                            setOpenFlagPopover(null);
                          }}>
                                <Flag className="h-4 w-4 fill-red-500" />
                                High Priority
                              </Button>
                              <Button variant="ghost" className="w-full justify-start gap-2 text-yellow-500 hover:text-yellow-500" onClick={() => {
                            handleTaskUpdate(task.id, {
                              priority: 'medium'
                            });
                            setOpenFlagPopover(null);
                          }}>
                                <Flag className="h-4 w-4 fill-yellow-500" />
                                Medium Priority
                              </Button>
                              <Button variant="ghost" className="w-full justify-start gap-2 text-green-500 hover:text-green-500" onClick={() => {
                            handleTaskUpdate(task.id, {
                              priority: 'low'
                            });
                            setOpenFlagPopover(null);
                          }}>
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
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => {
                        console.log("Assign button clicked for task:", task.id);
                        setSelectedTaskForAssignment(task.id);
                        setAssignModalOpen(true);
                      }}>
                            <User className="h-3 w-3" />
                            {task.assignedName ? task.assignedName : 'Assign'}
                          </Button>

                          {/* Due Date */}
                          <Popover open={openDatePopover === task.id} onOpenChange={open => setOpenDatePopover(open ? task.id : null)}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'Set Due Date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                              <CalendarComponent mode="single" selected={task.dueDate ? new Date(task.dueDate) : undefined} onSelect={date => {
                            if (date) {
                              handleTaskUpdate(task.id, {
                                dueDate: format(date, 'yyyy-MM-dd')
                              });
                              setOpenDatePopover(null);
                            }
                          }} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>

                          {/* Upload Document */}
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={uploadingTaskId === task.id} onClick={() => {
                        setSelectedTaskForUpload({
                          taskId: task.id,
                          categoryCode: selectedCategory?.id || '',
                          categoryName: selectedCategory?.title || ''
                        });
                        taskFileInputRef.current?.click();
                      }}>
                            <Upload className="h-3 w-3" />
                            {uploadingTaskId === task.id ? 'Uploading...' : 'Upload'}
                          </Button>

                          {task.hasAttachment && <Badge variant="outline" className="h-7 gap-1 text-xs">
                              <Paperclip className="h-3 w-3" />
                              Attachment
                            </Badge>}
                        </div>

                        {task.assignedEmail && <div className="text-xs text-muted-foreground">
                            {task.assignedEmail}
                          </div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </DialogContent>
        </Dialog>

        {/* Category Panels - Split into two cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-start">
          {/* First Half - Categories 1-7 */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (1-7):</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {categories.slice(0, 7).map(category => {
                const completion = getCategoryCompletion(category);
                const openTasksCount = getOpenTasksCount(category);
                const completedTasksCount = category.tasks.filter(t => t.checked).length;
                return <Card key={category.id} className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg overflow-hidden" onClick={() => {
                  setSelectedCategory(category);
                  setCategoryModalOpen(true);
                }}>
                      <CardContent className="p-2.5 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs sm:text-base">{category.id}</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-xs sm:text-sm truncate">{category.title}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {completedTasksCount}/{category.tasks.length} done
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right pl-1">
                            <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">{completion}%</div>
                            <Progress value={completion} className="w-10 sm:w-20 h-1.5 sm:h-2 mt-0.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
              })}
              </div>
            </CardContent>
          </Card>

          {/* Second Half - Categories 8-14 */}
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 px-3 sm:px-6">
              <CardTitle className="text-base sm:text-xl font-bold">
                Due Diligence <span className="text-primary">Categories (8-14):</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {categories.slice(7).map(category => {
                const completion = getCategoryCompletion(category);
                const openTasksCount = getOpenTasksCount(category);
                const completedTasksCount = category.tasks.filter(t => t.checked).length;
                return <Card key={category.id} className="backdrop-blur-xl bg-background/40 border-2 border-border/50 cursor-pointer hover:bg-background/60 transition-all hover:shadow-lg overflow-hidden" onClick={() => {
                  setSelectedCategory(category);
                  setCategoryModalOpen(true);
                }}>
                      <CardContent className="p-2.5 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-bold text-xs sm:text-base">{category.id}</span>
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-semibold text-xs sm:text-sm truncate">{category.title}</div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                              {completedTasksCount}/{category.tasks.length} done
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right pl-1">
                            <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">{completion}%</div>
                            <Progress value={completion} className="w-10 sm:w-20 h-1.5 sm:h-2 mt-0.5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>;
              })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Specialist Assignment Modal */}
      <SpecialistAssignmentModal open={assignModalOpen} onOpenChange={setAssignModalOpen} specialists={specialists} categories={availableCategories} onAssign={handleAssignSpecialist} onAddNew={handleAddSpecialist} currentAssignment={selectedTaskForAssignment ? allTasks.find(t => t.id === selectedTaskForAssignment) ? {
      name: allTasks.find(t => t.id === selectedTaskForAssignment)!.assignedName,
      email: allTasks.find(t => t.id === selectedTaskForAssignment)!.assignedEmail
    } : undefined : undefined} />
    </div>;
};
export default DealDashboard;