import { useEffect, useState, useRef } from "react";
import * as React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Paperclip, AlertCircle, CheckCircle2, Clock, FileText, Flag, User, UserPlus, Calendar, Upload, ClipboardList, CircleAlert, Timer } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/customClient";
import { useToast } from "@/hooks/use-toast";
import { DocumentsModal } from "@/components/DocumentsModal";
import { SpecialistAssignmentModal } from "@/components/SpecialistAssignmentModal";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { PageNavigation } from "@/components/PageNavigation";
import { PageHeaderActions } from "@/components/PageHeaderActions";
import { specialistSchema, validateInput } from "@/lib/validation";
import { handleError, logDebug } from "@/lib/errorHandler";
import { getProgressColors } from "@/lib/progressColors";
import { isFundingWorkspace, workspaceCategories } from "@/lib/fundingChecklist";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";

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
  const [fundingWorkspace, setFundingWorkspace] = useState(false);
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
      } = await supabase.from('deals').select('name, target_close_date, buyer_name, buyer_email, seller_name, seller_email, buyer_legal_name, buyer_legal_email, seller_legal_name, seller_legal_email, source_intake_id, client_type').eq('id', dealId).single();
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
      let {
        data: categoriesData,
        error: categoriesError
      } = await supabase.from('deal_categories').select(`
            id,
            title,
            category_code,
            category_order
          `).eq('deal_id', dealId).order('category_order');
      if (categoriesError) throw categoriesError;

      // Auto-seed from source intake if this deal has no categories yet
      if ((!categoriesData || categoriesData.length === 0) && (dealData as any).source_intake_id) {
        const { error: seedErr } = await (supabase as any).rpc('seed_deal_from_intake', {
          p_deal_id: dealId,
          p_intake_id: (dealData as any).source_intake_id,
        });
        if (!seedErr) {
          const refetch = await supabase.from('deal_categories')
            .select('id, title, category_code, category_order')
            .eq('deal_id', dealId).order('category_order');
          categoriesData = refetch.data ?? [];
        }
      }

      const funding = isFundingWorkspace(dealData, categoriesData ?? []);
      setFundingWorkspace(funding);
      categoriesData = workspaceCategories(categoriesData ?? [], funding);

      // Fetch tasks only for the current workspace categories.
      const categoryIds = (categoriesData ?? []).map(cat => cat.id);
      categoriesData = categoriesData ?? [];
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
  // Summary tiles + right-rail lists (funder-style layout)
  const highPriorityList = categories
    .flatMap((cat) => cat.tasks.filter((t) => t.priority === "high" && !t.checked).map((task) => ({ category: cat, task })))
    .slice(0, 6);
  const outstandingCategories = categories.filter((cat) => getOpenTasksCount(cat) > 0);
  const summaryCards: Array<{
    icon: any;
    label: string;
    value: string | number;
    tone?: string;
    onClick?: () => void;
  }> = [
    {
      icon: ClipboardList,
      label: fundingWorkspace ? "Workspace Completion" : "Deal Completion",
      value: `${readinessScore}%`,
      tone: getProgressColors(readinessScore).text,
    },
    {
      icon: CircleAlert,
      label: "Open Items",
      value: openTasks,
      tone: openTasks > 0 ? "text-amber-600 dark:text-amber-500" : "text-green-600 dark:text-green-500",
    },
    {
      icon: Flag,
      label: "High Priority",
      value: highPriorityTasks,
      tone: highPriorityTasks > 0 ? "text-red-700 dark:text-red-500" : "text-green-600 dark:text-green-500",
    },
    {
      icon: User,
      label: "Specialists Assigned",
      value: specialistsAssigned,
      onClick: () => setSpecialistsModalOpen(true),
    },
    {
      icon: FileText,
      label: "Documents",
      value: documentsCount,
      onClick: () => setDocumentsModalOpen(true),
    },
    {
      icon: Timer,
      label: daysUntilClose !== null && daysUntilClose < 0 ? "Days Overdue" : "Days Until Close",
      value: daysUntilClose === null ? "—" : Math.abs(daysUntilClose),
      tone: daysUntilClose !== null && daysUntilClose < 0 ? "text-red-700 dark:text-red-500" : undefined,
      onClick: () => setCloseDateDialogOpen(true),
    },
  ];

  return <PageShell>
      {/* Hidden file input for task document uploads */}
      <input ref={taskFileInputRef} type="file" className="hidden" onChange={handleTaskFileUpload} accept="*" />

      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <PageHeaderActions />
          <img src={unisynLogo} alt="UniSyn Technology" className="w-36 sm:w-44 h-auto" />
          <PageNavigation items={[{
          to: fundingWorkspace ? "/incubator" : "/welcome",
          label: "Home"
        }, {
          to: fundingWorkspace ? "/incubator/applications" : "/deals",
          label: fundingWorkspace ? "Applications" : "Deals"
        }, {
          to: `/deals/${dealId}/dashboard`,
          label: dealName,
          isActive: true
        }]} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="glass-surface-strong p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
                {fundingWorkspace ? "Funding Workspace" : "Deal Workspace"}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight">{dealName}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>
                  {categories.length} {fundingWorkspace ? "document sections" : "categories"}
                </span>
                <span>
                  {targetCloseDate
                    ? `Target close ${new Date(targetCloseDate).toLocaleDateString()}`
                    : "No target close date"}
                </span>
                <Badge variant="outline" className={`rounded-full ${getProgressColors(readinessScore).text}`}>
                  {getProgressColors(readinessScore).label}
                </Badge>
              </div>
            </div>
            <div className="min-w-[220px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Overall Completion</p>
              <div className="flex items-center gap-3">
                <Progress value={readinessScore} className="h-2" />
                <span className="font-semibold tabular-nums">{readinessScore}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {completedTasks} of {totalTasks} items completed
              </p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {summaryCards.map((c) => (
            <div
              key={c.label}
              onClick={c.onClick}
              className={`glass-surface p-4 ${c.onClick ? "cursor-pointer lift-hover" : ""}`}
            >
              <GlassIcon icon={c.icon} tone="neutral" size="sm" />
              <p className={`text-2xl font-semibold tabular-nums mt-3 ${c.tone ?? ""}`}>{c.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Close Date Dialog */}
        <Dialog open={closeDateDialogOpen} onOpenChange={setCloseDateDialogOpen}>
          <DialogContent className="w-[90vw] sm:w-[70vw] lg:w-[50vw] max-w-none p-0 overflow-hidden glass-surface-strong">
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50">
                <div className="flex flex-col">
                  <DialogTitle className="font-display text-xl">Change Target Close Date</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Select a new target close date for this deal
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center justify-center p-6 sm:p-8">
                <CalendarComponent mode="single" selected={targetCloseDate ? new Date(targetCloseDate) : undefined} onSelect={handleCloseDateChange} disabled={date => date < new Date() || date > new Date("2035-12-31")} initialFocus className="p-3 pointer-events-auto rounded-lg" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
                  }))} className="bg-field" />
                      <Input placeholder="Email" type="email" value={newSpecialist.email} onChange={e => setNewSpecialist(prev => ({
                    ...prev,
                    email: e.target.value
                  }))} className="bg-field" />
                      <Select value={newSpecialist.role} onValueChange={value => setNewSpecialist(prev => ({
                    ...prev,
                    role: value
                  }))}>
                        <SelectTrigger className="bg-field">
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
                        <SelectTrigger className="bg-field">
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

        {/* Sections + right rail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl">
              {fundingWorkspace ? "Document Sections" : "Due Diligence Categories"}
            </h2>
            {categories.map((category) => {
              const completion = getCategoryCompletion(category);
              const openTasksCount = getOpenTasksCount(category);
              const completedTasksCount = category.tasks.filter(t => t.checked).length;
              const colors = getProgressColors(completion);
              return (
                <div key={category.id} className="glass-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="glass-tile h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className={`font-display text-xl ${colors.text}`}>{category.id}</span>
                      </span>
                      <div>
                        <p className="font-display text-lg leading-tight">
                          {category.id} — {category.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {completedTasksCount}/{category.tasks.length} items completed · {openTasksCount} outstanding
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`rounded-full ${colors.text}`}>
                      {colors.label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Progress value={completion} className="h-1.5" />
                    <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{completion}%</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-2"
                      onClick={() => {
                        setSelectedCategory(category);
                        setCategoryModalOpen(true);
                      }}
                    >
                      <ClipboardList className="h-4 w-4" /> View & Tick Items
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setDocumentsModalOpen(true)}>
                      <Upload className="h-4 w-4" /> Upload Document
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setSpecialistsModalOpen(true)}>
                      <User className="h-4 w-4" /> Specialists
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">Next Steps</h3>
              <Button variant="outline" className="w-full rounded-full gap-2 mb-3" onClick={() => setDocumentsModalOpen(true)}>
                <FileText className="h-4 w-4" /> View & Upload Documents
              </Button>
              <Button variant="outline" className="w-full rounded-full gap-2 mb-3" onClick={() => setCoreTeamModalOpen(true)}>
                <User className="h-4 w-4" /> Core Deal Team
              </Button>
              <Button variant="outline" className="w-full rounded-full gap-2 mb-3" onClick={() => setSpecialistsModalOpen(true)}>
                <UserPlus className="h-4 w-4" /> Assign Specialists
              </Button>
              <Button variant="outline" className="w-full rounded-full gap-2" onClick={() => setCloseDateDialogOpen(true)}>
                <Calendar className="h-4 w-4" /> Change Target Close Date
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Tick items inside a section to move completion forward. The workspace moves to Completed automatically at 100%.
              </p>
            </div>

            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">Outstanding Items</h3>
              {outstandingCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
              ) : (
                <ul className="space-y-3">
                  {outstandingCategories.map((c) => (
                    <li key={c.id} className="text-sm">
                      <button
                        className="text-left hover:text-primary transition-colors"
                        onClick={() => {
                          setSelectedCategory(c);
                          setCategoryModalOpen(true);
                        }}
                      >
                        <p className="font-medium">
                          {c.id} — {c.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getOpenTasksCount(c)} items outstanding
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">High Priority Flags</h3>
              {highPriorityList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No high-priority items outstanding.</p>
              ) : (
                <ul className="space-y-3">
                  {highPriorityList.map(({ category, task }) => (
                    <li key={task.id} className="text-sm">
                      <button
                        className="text-left hover:text-primary transition-colors"
                        onClick={() => {
                          setSelectedCategory(category);
                          setCategoryModalOpen(true);
                        }}
                      >
                        <p>{task.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {category.id} · {task.code}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Specialist Assignment Modal */}
      <SpecialistAssignmentModal open={assignModalOpen} onOpenChange={setAssignModalOpen} specialists={specialists} categories={availableCategories} onAssign={handleAssignSpecialist} onAddNew={handleAddSpecialist} currentAssignment={selectedTaskForAssignment ? allTasks.find(t => t.id === selectedTaskForAssignment) ? {
      name: allTasks.find(t => t.id === selectedTaskForAssignment)!.assignedName,
      email: allTasks.find(t => t.id === selectedTaskForAssignment)!.assignedEmail
    } : undefined : undefined} />
    </PageShell>;
};
export default DealDashboard;