import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ChevronRight, Upload } from "lucide-react";
import { useState } from "react";
import unisynLogo from "@/assets/unisyn-logo.png";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  notes: string;
  assignedName: string;
  assignedEmail: string;
  assignedRole: string;
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
        };
      });
    });
    return initial;
  });

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

  const handleFileUpload = (id: string) => {
    // File upload logic here
    console.log("Upload file for:", id);
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
            <CardTitle className="text-3xl font-bold tracking-tight">
              Pre–Due Diligence <span className="text-primary">Checklist</span>
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Complete all required documentation and assign specialists to each section
            </p>
          </CardHeader>
          <CardContent className="pt-8">
            <Accordion type="multiple" className="space-y-4">
              {checklistData.map((section) => (
                <AccordionItem
                  key={section.id}
                  value={section.id}
                  className="backdrop-blur-xl bg-background/40 border border-border/50 rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-background/60 transition-colors hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold">{section.id}</span>
                      </div>
                      <span className="font-semibold text-lg">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-6 pt-4">
                      {section.items.map((item, index) => {
                        const itemId = `${section.id}-${index}`;
                        const itemData = checklist[itemId];

                        return (
                          <div
                            key={itemId}
                            className="backdrop-blur-xl bg-card/40 border border-border/40 rounded-lg p-4 space-y-4"
                          >
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
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                            </div>

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
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              <Button variant="outline" className="border-border/50">
                Save Draft
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
                Submit Checklist
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DueDiligenceChecklist;
