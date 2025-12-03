import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Paperclip, ChevronLeft, ChevronRight, X, Upload, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import unisynLogo from "@/assets/unisyn-logo.png";
import { toast as sonnerToast } from "sonner";
import { SignOutButton } from "@/components/SignOutButton";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  notes: string;
  uploadedFiles: { name: string; path: string }[];
}

interface SectionSpecialist {
  name: string;
  email: string;
  role: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: string[];
}

const checklistData: ChecklistSection[] = [
  {
    id: "A",
    title: "HISTORICAL FINANCIALS",
    items: [
      "Audited financial statements for the last 3 years",
      "Management accounts for the current year",
      "Breakdown of revenue streams",
      "Debtors and creditors analysis",
      "Fixed asset register",
      "Inventory schedule",
      "Bank statements (12 months)",
      "Tax returns and assessments",
      "SARS compliance status",
      "Depreciation and amortisation schedules",
      "Cashflow statements",
      "Any financial restatements or adjustments",
    ],
  },
  {
    id: "B",
    title: "FORECASTING & FINANCIAL MODELS",
    items: [
      "Financial forecast model (3–5 years)",
      "Assumptions used in the forecast",
      "Sensitivity analysis",
      "Capital expenditure plans",
      "Working capital projections",
      "Risk analysis or downside scenarios",
    ],
  },
  {
    id: "C",
    title: "LEGAL, CORPORATE & COMPLIANCE",
    items: [
      "Company registration documents",
      "Memorandum of Incorporation (MOI)",
      "Shareholder agreements",
      "Share certificate register",
      "Directors' appointments & resignations",
      "Company organogram",
      "CIPC annual returns & compliance documents",
      "Tax compliance & VAT registration",
      "Outstanding legal notices",
      "Minutes of board meetings (12 months)",
      "Corporate governance policies",
      "Power-of-attorney documentation",
      "BEE Certificate",
      "Competition Commission filings (if applicable)",
    ],
  },
  {
    id: "D",
    title: "ASSETS",
    items: [
      "List of owned assets",
      "Lease agreements",
      "Title deeds",
      "Vehicle ownership documents",
      "Asset valuations",
      "Depreciation reports",
      "Asset maintenance logs",
      "Photos or evidence of physical assets",
    ],
  },
  {
    id: "E",
    title: "BORROWINGS & LIABILITIES",
    items: [
      "Bank loan agreements",
      "Third-party financing agreements",
      "Facility letters",
      "Security documents",
      "Guarantees and indemnities",
      "Overdrafts and credit lines",
      "Contingent liabilities",
      "Debt repayment schedules",
      "Loan covenants & compliance status",
    ],
  },
  {
    id: "F",
    title: "MATERIAL CONTRACTS",
    items: [
      "Customer contracts (top 20)",
      "Supplier contracts (top 20)",
      "Distribution agreements",
      "Franchise agreements",
      "Joint venture agreements",
      "Service level agreements",
      "Outsourcing contracts",
      "NDA/Confidentiality agreements",
      "Termination or renewal notices",
      "Any contract under dispute",
    ],
  },
  {
    id: "G",
    title: "EMPLOYEES",
    items: [
      "Full employee list",
      "Employee contracts",
      "Salary structure",
      "Employee benefits & allowances",
      "Incentive schemes",
      "Leave records",
      "HR policies and manuals",
      "Disciplinary records",
      "Union agreements",
      "Organisational chart",
      "Key employee CVs",
    ],
  },
  {
    id: "H",
    title: "INTELLECTUAL PROPERTY",
    items: [
      "Trademark registrations",
      "Copyright documentation",
      "Patent registrations",
      "Licensing agreements",
      "IP ownership proofs",
      "Domain registrations",
      "Software ownership documents",
      "Confidential information handling policies",
    ],
  },
  {
    id: "I",
    title: "INSURANCE",
    items: [
      "Insurance policies (all)",
      "Policy schedules",
      "Premium payment proof",
      "List of insurance claims (5 years)",
      "Broker agreements",
      "Claims procedures",
    ],
  },
  {
    id: "J",
    title: "OPERATIONS & PROCESSES",
    items: [
      "Standard operating procedures",
      "Quality control processes",
      "Health & safety policies",
      "ISO certifications",
      "Supplier relationships",
      "Production schedules",
      "Logistics & distribution",
      "Technology systems overview",
      "Software licenses & subscriptions",
      "Website analytics",
    ],
  },
  {
    id: "K",
    title: "CUSTOMER & REVENUE",
    items: [
      "Customer concentration analysis",
      "Customer retention rates",
      "Customer satisfaction data",
      "Marketing strategy",
      "Sales pipeline analysis",
      "Pricing strategy documentation",
      "Product roadmap",
      "Competitive analysis",
    ],
  },
  {
    id: "L",
    title: "LITIGATION & DISPUTES",
    items: [
      "List of ongoing litigation",
      "Legal threats or disputes",
      "Arbitration proceedings",
      "Regulatory investigations",
      "Settlement agreements",
      "Letters of demand",
    ],
  },
  {
    id: "M",
    title: "TAX & STATUTORY",
    items: [
      "Corporate income tax returns (3 years)",
      "VAT returns",
      "PAYE compliance records",
      "UIF & SDL returns",
      "Skills development levy",
      "BEE compliance documents",
      "Tax clearance certificate",
      "Transfer pricing documentation",
    ],
  },
  {
    id: "N",
    title: "ENVIRONMENTAL & SOCIAL",
    items: [
      "Environmental impact assessments",
      "Water use licenses",
      "Waste management permits",
      "Carbon footprint reporting",
      "Sustainability initiatives",
      "CSR programmes",
    ],
  },
];

const DueDiligenceChecklist = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: dealId } = useParams<{ id: string }>();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [savingDraft, setSavingDraft] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [checklist, setChecklist] = useState<Record<string, ChecklistItem>>(() => {
    const initial: Record<string, ChecklistItem> = {};
    checklistData.forEach((section) => {
      section.items.forEach((item, index) => {
        const id = `${section.id}-${index}`;
        initial[id] = {
          id,
          text: item,
          checked: false,
          notes: "",
          uploadedFiles: [],
        };
      });
    });
    return initial;
  });

  const [sectionSpecialists, setSectionSpecialists] = useState<Record<string, SectionSpecialist>>(() => {
    const initial: Record<string, SectionSpecialist> = {};
    checklistData.forEach((section) => {
      initial[section.id] = {
        name: "",
        email: "",
        role: "",
      };
    });
    return initial;
  });

  const currentSection = checklistData[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === checklistData.length - 1;
  const progressPercentage = ((currentSectionIndex + 1) / checklistData.length) * 100;

  // Check authentication and load existing draft data
  useEffect(() => {
    const initializeChecklist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        sonnerToast.error("Please sign in to access the checklist");
        navigate("/");
        return;
      }

      if (!dealId) {
        setLoadingDraft(false);
        return;
      }

      try {
        // Load existing categories
        const { data: categories } = await supabase
          .from('deal_categories')
          .select('*')
          .eq('deal_id', dealId);

        if (categories && categories.length > 0) {
          const categoryMap = new Map(categories.map(cat => [cat.category_code, cat.id]));

          // Load existing tasks
          const categoryIds = categories.map(c => c.id);
          const { data: tasks } = await supabase
            .from('deal_tasks')
            .select('*')
            .in('category_id', categoryIds);

          if (tasks && tasks.length > 0) {
            // Load documents for file attachments
            const { data: documents } = await supabase
              .from('deal_documents')
              .select('*')
              .eq('deal_id', dealId);

            setChecklist(prev => {
              const updated = { ...prev };
              tasks.forEach(task => {
                if (updated[task.task_code]) {
                  // Find files for this task
                  const taskFiles = documents?.filter(doc => 
                    doc.notes?.includes(updated[task.task_code].text)
                  ).map(doc => ({
                    name: doc.file_name,
                    path: doc.file_path
                  })) || [];

                  updated[task.task_code] = {
                    ...updated[task.task_code],
                    checked: task.checked,
                    notes: task.notes || "",
                    uploadedFiles: taskFiles,
                  };
                }
              });
              return updated;
            });
          }

          // Load existing specialists
          const { data: specialists } = await supabase
            .from('deal_specialists')
            .select('*')
            .eq('deal_id', dealId);

          if (specialists && specialists.length > 0) {
            setSectionSpecialists(prev => {
              const updated = { ...prev };
              specialists.forEach(spec => {
                const category = categories.find(c => c.id === spec.category_id);
                if (category) {
                  updated[category.category_code] = {
                    name: spec.name,
                    email: spec.email,
                    role: spec.role,
                  };
                }
              });
              return updated;
            });
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setLoadingDraft(false);
      }
    };

    initializeChecklist();
  }, [navigate, dealId]);

  const goToNextSection = () => {
    if (!isLastSection) {
      setCurrentSectionIndex((prev) => prev + 1);
      // Scroll both the window and the content area to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const goToPreviousSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex((prev) => prev - 1);
      // Scroll both the window and the content area to top
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (contentRef.current) {
        contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleCheckChange = (id: string, checked: boolean) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: { ...prev[id], checked },
    }));
  };

  const handleFieldChange = (id: string, field: keyof ChecklistItem, value: string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSectionSpecialistChange = (sectionId: string, field: keyof SectionSpecialist, value: string) => {
    setSectionSpecialists((prev) => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [field]: value },
    }));
  };

  const handleSaveDraft = async () => {
    if (!dealId) {
      toast({
        title: "Error",
        description: "Deal ID is missing.",
        variant: "destructive",
      });
      return;
    }

    setSavingDraft(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save the draft.",
          variant: "destructive",
        });
        return;
      }

      // Batch insert all categories
      const categories = checklistData.map((section, index) => ({
        deal_id: dealId,
        title: section.title,
        category_code: section.id,
        category_order: index + 1,
      }));

      const { data: categoryData, error: categoryError } = await supabase
        .from('deal_categories')
        .upsert(categories, {
          onConflict: 'deal_id,category_code',
        })
        .select();

      if (categoryError) throw categoryError;

      const categoryMap = new Map(
        categoryData.map(cat => [cat.category_code, cat.id])
      );

      // Batch insert all specialists
      const specialists = checklistData
        .map(section => {
          const specialist = sectionSpecialists[section.id];
          const categoryId = categoryMap.get(section.id);
          
          if (specialist.name && specialist.email && categoryId) {
            return {
              deal_id: dealId,
              category_id: categoryId,
              name: specialist.name,
              email: specialist.email,
              role: specialist.role || 'Specialist',
            };
          }
          return null;
        })
        .filter(Boolean);

      if (specialists.length > 0) {
        // Insert specialists - skip if already exists with same email in same category
        for (const spec of specialists) {
          if (!spec) continue;
          const { data: existing } = await supabase
            .from('deal_specialists')
            .select('id')
            .eq('deal_id', spec.deal_id)
            .eq('category_id', spec.category_id)
            .eq('email', spec.email)
            .maybeSingle();
          
          if (!existing) {
            const { error: specialistError } = await supabase
              .from('deal_specialists')
              .insert(spec);
            if (specialistError) throw specialistError;
          }
        }
      }

      // Batch insert all tasks
      const tasks = checklistData.flatMap((section) => 
        section.items.map((item, itemIndex) => {
          const itemId = `${section.id}-${itemIndex}`;
          const checklistItem = checklist[itemId];
          const categoryId = categoryMap.get(section.id);

          return {
            category_id: categoryId,
            title: checklistItem.text,
            task_code: itemId,
            task_order: itemIndex + 1,
            checked: checklistItem.checked,
            notes: checklistItem.notes || null,
            has_attachment: checklistItem.uploadedFiles.length > 0,
            status: checklistItem.checked ? 'completed' : 'pending',
            priority: itemIndex < 3 ? 'high' : 'medium',
          };
        })
      );

      const { error: taskError } = await supabase
        .from('deal_tasks')
        .upsert(tasks, {
          onConflict: 'category_id,task_code',
        });

      if (taskError) throw taskError;

      // Update deal status to in_progress
      const { error: dealError } = await supabase
        .from('deals')
        .update({ status: 'in_progress' })
        .eq('id', dealId);

      if (dealError) throw dealError;

      toast({
        title: "Draft saved",
        description: "Your checklist progress has been saved.",
      });
      
      navigate('/deals');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    if (!dealId) {
      toast({
        title: "Error",
        description: "Deal ID is missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit the checklist.",
          variant: "destructive",
        });
        return;
      }

      // Batch insert all categories
      const categories = checklistData.map((section, index) => ({
        deal_id: dealId,
        title: section.title,
        category_code: section.id,
        category_order: index + 1,
      }));

      const { data: categoryData, error: categoryError } = await supabase
        .from('deal_categories')
        .upsert(categories, {
          onConflict: 'deal_id,category_code',
        })
        .select();

      if (categoryError) throw categoryError;

      // Create a map of category codes to IDs
      const categoryMap = new Map(
        categoryData.map(cat => [cat.category_code, cat.id])
      );

      // Batch insert all specialists
      const specialists = checklistData
        .map(section => {
          const specialist = sectionSpecialists[section.id];
          const categoryId = categoryMap.get(section.id);
          
          if (specialist.name && specialist.email && categoryId) {
            return {
              deal_id: dealId,
              category_id: categoryId,
              name: specialist.name,
              email: specialist.email,
              role: specialist.role || 'Specialist',
            };
          }
          return null;
        })
        .filter(Boolean);

      if (specialists.length > 0) {
        // Insert specialists - skip if already exists with same email in same category
        for (const spec of specialists) {
          if (!spec) continue;
          const { data: existing } = await supabase
            .from('deal_specialists')
            .select('id')
            .eq('deal_id', spec.deal_id)
            .eq('category_id', spec.category_id)
            .eq('email', spec.email)
            .maybeSingle();
          
          if (!existing) {
            const { error: specialistError } = await supabase
              .from('deal_specialists')
              .insert(spec);
            if (specialistError) throw specialistError;
          }
        }
      }

      // Batch insert all tasks
      const tasks = checklistData.flatMap((section, sectionIndex) => 
        section.items.map((item, itemIndex) => {
          const itemId = `${section.id}-${itemIndex}`;
          const checklistItem = checklist[itemId];
          const categoryId = categoryMap.get(section.id);

          return {
            category_id: categoryId,
            title: checklistItem.text,
            task_code: itemId,
            task_order: itemIndex + 1,
            checked: checklistItem.checked,
            notes: checklistItem.notes || null,
            has_attachment: checklistItem.uploadedFiles.length > 0,
            status: checklistItem.checked ? 'completed' : 'pending',
            priority: itemIndex < 3 ? 'high' : 'medium',
          };
        })
      );

      const { error: taskError } = await supabase
        .from('deal_tasks')
        .upsert(tasks, {
          onConflict: 'category_id,task_code',
        });

      if (taskError) throw taskError;

      // Update deal status to active (submitted)
      await supabase
        .from('deals')
        .update({ status: 'active' })
        .eq('id', dealId);

      toast({
        title: "Checklist submitted",
        description: "Your due diligence checklist has been submitted successfully.",
      });
      
      navigate(`/deals/${dealId}/dashboard`);
    } catch (error) {
      console.error('Error submitting checklist:', error);
      toast({
        title: "Error",
        description: "Failed to submit checklist. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  const handleFileChange = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles((prev) => ({ ...prev, [id]: true }));

    try {
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${dealId}/${id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save document metadata to database
      await supabase
        .from('deal_documents')
        .insert({
          deal_id: dealId!,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type || null,
          uploaded_by: user?.id,
          category: 'Checklist',
          notes: `Uploaded for task: ${checklist[id].text}`,
        });

      // Add file to checklist item
      setChecklist((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          uploadedFiles: [
            ...prev[id].uploadedFiles,
            { name: file.name, path: fileName },
          ],
        },
      }));

      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [id]: false }));
      // Reset the input
      if (fileInputRefs.current[id]) {
        fileInputRefs.current[id]!.value = '';
      }
    }
  };

  const handleFileRemove = async (itemId: string, filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('deal-documents')
        .remove([filePath]);

      if (error) throw error;

      setChecklist((prev) => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          uploadedFiles: prev[itemId].uploadedFiles.filter((f) => f.path !== filePath),
        },
      }));

      toast({
        title: "File removed",
        description: "The file has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing file:', error);
      toast({
        title: "Remove failed",
        description: "There was an error removing the file. Please try again.",
        variant: "destructive",
      });
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative">
          <Breadcrumb>
...
          </Breadcrumb>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-24 h-auto" />
          <div className="absolute top-4 left-6">
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">
                  Pre–Due Diligence <span className="text-primary">Checklist</span>
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Complete all required documentation and assign specialists to each section
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">
                  Section {currentSectionIndex + 1} of {checklistData.length}
                </div>
                <Progress value={progressPercentage} className="w-32 h-2" />
              </div>
            </div>

            {/* Current Section Header */}
            <div className="flex items-center gap-3 pt-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">{currentSection.id}</span>
              </div>
              <div>
                <h2 className="font-semibold text-2xl">{currentSection.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentSection.items.length} items to complete
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8" ref={contentRef}>
            {/* Section Items - Natural scrolling flow with specialist at top */}
            <div className="space-y-4">
              {/* Section Specialist Assignment - Now part of natural flow */}
              <div className="backdrop-blur-xl bg-primary/5 border-2 border-primary/20 rounded-lg p-5">
                <Label className="text-sm font-semibold text-primary mb-4 block">Section Specialist</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`section-${currentSection.id}-name`} className="text-xs">
                      Name
                    </Label>
                    <Input
                      id={`section-${currentSection.id}-name`}
                      placeholder="Specialist name"
                      value={sectionSpecialists[currentSection.id].name}
                      onChange={(e) => handleSectionSpecialistChange(currentSection.id, "name", e.target.value)}
                      className="bg-background/50 border-border/40 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`section-${currentSection.id}-email`} className="text-xs">
                      Email
                    </Label>
                    <Input
                      id={`section-${currentSection.id}-email`}
                      type="email"
                      placeholder="email@example.com"
                      value={sectionSpecialists[currentSection.id].email}
                      onChange={(e) => handleSectionSpecialistChange(currentSection.id, "email", e.target.value)}
                      className="bg-background/50 border-border/40 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`section-${currentSection.id}-role`} className="text-xs">
                      Role
                    </Label>
                    <Select
                      value={sectionSpecialists[currentSection.id].role}
                      onValueChange={(value) => handleSectionSpecialistChange(currentSection.id, "role", value)}
                    >
                      <SelectTrigger className="bg-background/50 border-border/40 text-sm">
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
                  </div>
                </div>
              </div>
              {currentSection.items.map((item, index) => {
                const itemId = `${currentSection.id}-${index}`;
                const itemData = checklist[itemId];

                return (
                  <div
                    key={itemId}
                    className="backdrop-blur-xl bg-card/80 border-2 border-border/60 rounded-lg p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Hidden file input */}
                    <input
                      ref={(el) => (fileInputRefs.current[itemId] = el)}
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileChange(itemId, e)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                    />

                    {/* Item Header with Checkbox */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={itemId}
                        checked={itemData.checked}
                        onCheckedChange={(checked) => handleCheckChange(itemId, checked as boolean)}
                        className="mt-1"
                      />
                      <Label htmlFor={itemId} className="flex-1 text-sm font-medium leading-relaxed cursor-pointer">
                        {item}
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/50"
                        onClick={() => handleFileUpload(itemId)}
                        disabled={uploadingFiles[itemId]}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFiles[itemId] ? "Uploading..." : "Upload"}
                      </Button>
                    </div>

                    {/* Uploaded Files List */}
                    {itemData.uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Uploaded Files</Label>
                        <div className="space-y-2">
                          {itemData.uploadedFiles.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="flex items-center justify-between bg-background/50 border border-border/40 rounded-md px-3 py-2"
                            >
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4 text-primary" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleFileRemove(itemId, file.path)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes Field */}
                    <div className="space-y-2">
                      <Label htmlFor={`${itemId}-notes`} className="text-xs text-muted-foreground">
                        Notes
                      </Label>
                      <Textarea
                        id={`${itemId}-notes`}
                        placeholder="Add notes or comments..."
                        value={itemData.notes}
                        onChange={(e) => handleFieldChange(itemId, "notes", e.target.value)}
                        className="bg-background/50 border-border/40 min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                className="border-border/50 flex-1 sm:flex-none touch-manipulation"
                onClick={goToPreviousSection}
                disabled={isFirstSection}
              >
                <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Previous Section</span>
                <span className="sm:hidden">Previous</span>
              </Button>

              <Button 
                variant="outline" 
                className="border-border/50 flex-1 sm:flex-none touch-manipulation"
                onClick={handleSaveDraft}
                disabled={savingDraft || loadingDraft}
              >
                <span className="hidden sm:inline">{savingDraft ? "Saving..." : "Save Draft"}</span>
                <span className="sm:hidden">{savingDraft ? "Saving..." : "Save"}</span>
              </Button>

              {isLastSection ? (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-8 font-semibold shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none touch-manipulation"
                  onClick={handleSubmit}
                >
                  <span className="hidden sm:inline">Submit Checklist</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              ) : (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all flex-1 sm:flex-none touch-manipulation"
                  onClick={goToNextSection}
                >
                  <span className="hidden sm:inline">Next Section</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DueDiligenceChecklist;
