import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, Paperclip, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.png";

interface Task {
  id: string;
  code: string;
  title: string;
  priority: "high" | "medium" | "low";
  assignedName: string;
  assignedEmail: string;
  status: "pending" | "in-progress" | "completed";
  dueDate: string;
  hasAttachment: boolean;
}

interface Category {
  id: string;
  title: string;
  tasks: Task[];
}

// Mock data - in real app this would come from the checklist
const categories: Category[] = [
  {
    id: "A",
    title: "HISTORICAL FINANCIALS",
    tasks: [
      {
        id: "A-1",
        code: "A1",
        title: "Audited financial statements for the last 3 years",
        priority: "high",
        assignedName: "John Smith",
        assignedEmail: "john@example.com",
        status: "completed",
        dueDate: "2025-12-15",
        hasAttachment: true,
      },
      {
        id: "A-2",
        code: "A2",
        title: "Management accounts for the current year",
        priority: "high",
        assignedName: "Sarah Johnson",
        assignedEmail: "sarah@example.com",
        status: "in-progress",
        dueDate: "2025-12-20",
        hasAttachment: false,
      },
      {
        id: "A-3",
        code: "A3",
        title: "Breakdown of revenue streams",
        priority: "medium",
        assignedName: "",
        assignedEmail: "",
        status: "pending",
        dueDate: "2025-12-25",
        hasAttachment: false,
      },
    ],
  },
  {
    id: "B",
    title: "FORECASTING & FINANCIAL MODELS",
    tasks: [
      {
        id: "B-1",
        code: "B1",
        title: "Financial forecast model (3–5 years)",
        priority: "high",
        assignedName: "Mike Chen",
        assignedEmail: "mike@example.com",
        status: "pending",
        dueDate: "2025-12-18",
        hasAttachment: false,
      },
    ],
  },
];

const DealDashboard = () => {
  const dealName = "TechCorp Acquisition";
  
  // Calculate stats
  const allTasks = categories.flatMap((cat) => cat.tasks);
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const totalTasks = allTasks.length;
  const readinessScore = Math.round((completedTasks / totalTasks) * 100);
  const openTasks = allTasks.filter((t) => t.status !== "completed").length;
  const highPriorityTasks = allTasks.filter((t) => t.priority === "high" && t.status !== "completed").length;
  const specialistsAssigned = new Set(allTasks.filter((t) => t.assignedName).map((t) => t.assignedEmail)).size;

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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/welcome" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="/deals" className="text-muted-foreground hover:text-foreground transition-colors">
                  Deals
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-24 h-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Top Summary Section */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Deal Name & Readiness Score */}
          <Card className="md:col-span-2 backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                <span className="text-foreground">{dealName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative w-24 h-24">
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
                <div>
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
            <CardContent className="flex items-center justify-center min-h-[120px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{openTasks}</div>
                <div className="text-sm text-muted-foreground">Open Tasks</div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl">
            <CardContent className="flex items-center justify-center min-h-[120px]">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{highPriorityTasks}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-xl md:col-start-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{specialistsAssigned}</div>
                <div className="text-sm text-muted-foreground">Specialists Assigned</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Panels */}
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-2xl font-bold">
              Due Diligence <span className="text-primary">Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Accordion type="multiple" className="space-y-4">
              {categories.map((category) => {
                const completion = getCategoryCompletion(category);
                const openTasksCount = getOpenTasksCount(category);

                return (
                  <AccordionItem
                    key={category.id}
                    value={category.id}
                    className="backdrop-blur-xl bg-background/40 border-2 border-border/50 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:bg-background/60 transition-colors hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{category.id}</span>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold text-base">{category.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {openTasksCount} open tasks
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
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="space-y-2 pt-4">
                        {category.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="backdrop-blur-xl bg-card/40 border border-border/40 rounded-lg p-4 hover:bg-card/60 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              {/* Priority Dot */}
                              <div className={`w-3 h-3 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />

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
                                      <span>Attachment</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DealDashboard;
