import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, Upload, ChevronLeft, File, X } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import unisynLogo from "@/assets/unisyn-logo.png";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  notes: string;
  assignedName: string;
  assignedEmail: string;
  assignedRole: string;
  uploadedFiles: { name: string; path: string }[];
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
      "Outstanding claims",
      "Coverage gaps",
      "Key-man insurance (if applicable)",
    ],
  },
  {
    id: "J",
    title: "REGULATORY & LICENCES",
    items: [
      "Industry-specific licences",
      "Operational permits",
      "Health & safety compliance",
      "Environmental compliance",
      "Industry regulatory filings",
      "Non-compliance notices",
      "Expired or pending renewals",
    ],
  },
  {
    id: "K",
    title: "LITIGATION & DISPUTES",
    items: [
      "Current litigation matters",
      "Previous legal disputes (5 years)",
      "Settlement agreements",
      "Legal opinions obtained",
      "Threatened or pending litigation",
      "Regulatory investigations",
      "Internal investigations",
      "Correspondence with legal counsel",
    ],
  },
  {
    id: "L",
    title: "TECHNOLOGY",
    items: [
      "Full technology stack overview",
      "Software & system licences",
      "IT infrastructure documentation",
      "Cybersecurity policies",
      "Data protection compliance (POPIA)",
      "Backup & recovery procedures",
      "System architecture diagrams",
      "Vendor contracts (IT services)",
      "Admin access list",
      "Technology risks or issues",
    ],
  },
  {
    id: "M",
    title: "OTHER",
    items: [
      "Marketing materials",
      "Branding assets",
      "Market reports",
      "Business plans",
      "Operational manuals",
      "Product documentation",
      "Press releases",
      "Customer testimonials",
      "Industry certifications",
    ],
  },
  {
    id: "N",
    title: "ADDITIONAL INFORMATION",
    items: [
      "Any relevant documents not covered above",
      "Any red flags identified by the seller",
      "Any buyer-requested documents",
      "Additional explanation notes",
      "Future plans or projections",
    ],
  },
];

const DueDiligenceChecklist = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
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
          assignedName: "",
          assignedEmail: "",
          assignedRole: "",
          uploadedFiles: [],
        };
      });
    });
    return initial;
  });

  const currentSection = checklistData[currentSectionIndex];
  const isFirstSection = currentSectionIndex === 0;
  const isLastSection = currentSectionIndex === checklistData.length - 1;
  const progressPercentage = ((currentSectionIndex + 1) / checklistData.length) * 100;

  const goToNextSection = () => {
    if (!isLastSection) {
      setCurrentSectionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPreviousSection = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleSubmit = () => {
    // Save checklist data and navigate to dashboard
    toast({
      title: "Checklist submitted",
      description: "Your due diligence checklist has been submitted successfully.",
    });
    navigate("/deals/new-deal/dashboard");
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
      const fileName = `${id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Add file to checklist item
      setChecklist((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          uploadedFiles: [
            ...prev[id].uploadedFiles,
            { name: file.name, path: filePath },
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
                <BreadcrumbPage className="text-foreground font-medium">Due Diligence Checklist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-24 h-auto" />
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

          <CardContent className="pt-8">
            {/* Section Items */}
            <div className="space-y-4">
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

                    {/* Assign Specialist Section */}
                    <div className="border-t border-border/40 pt-4">
                      <Label className="text-xs text-muted-foreground mb-3 block">Assign Specialist</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`${itemId}-name`} className="text-xs">
                            Name
                          </Label>
                          <Input
                            id={`${itemId}-name`}
                            placeholder="Specialist name"
                            value={itemData.assignedName}
                            onChange={(e) => handleFieldChange(itemId, "assignedName", e.target.value)}
                            className="bg-background/50 border-border/40 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${itemId}-email`} className="text-xs">
                            Email
                          </Label>
                          <Input
                            id={`${itemId}-email`}
                            type="email"
                            placeholder="email@example.com"
                            value={itemData.assignedEmail}
                            onChange={(e) => handleFieldChange(itemId, "assignedEmail", e.target.value)}
                            className="bg-background/50 border-border/40 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`${itemId}-role`} className="text-xs">
                            Role
                          </Label>
                          <Select
                            value={itemData.assignedRole}
                            onValueChange={(value) => handleFieldChange(itemId, "assignedRole", value)}
                          >
                            <SelectTrigger className="bg-background/50 border-border/40 text-sm">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/50">
                              <SelectItem value="financial-advisor">Financial Advisor</SelectItem>
                              <SelectItem value="legal-advisor">Legal Advisor</SelectItem>
                              <SelectItem value="tax-specialist">Tax Specialist</SelectItem>
                              <SelectItem value="compliance-officer">Compliance Officer</SelectItem>
                              <SelectItem value="it-specialist">IT Specialist</SelectItem>
                              <SelectItem value="hr-specialist">HR Specialist</SelectItem>
                              <SelectItem value="environmental-consultant">Environmental Consultant</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                className="border-border/50"
                onClick={goToPreviousSection}
                disabled={isFirstSection}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous Section
              </Button>

              <Button variant="outline" className="border-border/50">
                Save Draft
              </Button>

              {isLastSection ? (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={handleSubmit}
                >
                  Submit Checklist
                </Button>
              ) : (
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all"
                  onClick={goToNextSection}
                >
                  Next Section
                  <ChevronRight className="h-4 w-4 ml-2" />
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
