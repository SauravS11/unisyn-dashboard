import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Plus, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Specialist {
  id?: string;
  name: string;
  email: string;
  role: string;
  category: string;
  categoryId?: string;
  categoryCode?: string;
}

interface SpecialistAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialists: Specialist[];
  categories: Array<{ id: string; title: string; code: string }>;
  onAssign: (specialist: Specialist) => void;
  onAddNew: (specialist: { name: string; email: string; role: string; categoryId: string }) => Promise<void>;
  currentAssignment?: { name: string; email: string };
}

export function SpecialistAssignmentModal({
  open,
  onOpenChange,
  specialists,
  categories,
  onAssign,
  onAddNew,
  currentAssignment,
}: SpecialistAssignmentModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSpecialist, setNewSpecialist] = useState({
    name: "",
    email: "",
    role: "",
    categoryId: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddNewSpecialist = async () => {
    console.log("handleAddNewSpecialist called", newSpecialist);
    
    if (!newSpecialist.name || !newSpecialist.email || !newSpecialist.categoryId) {
      console.log("Validation failed", { 
        hasName: !!newSpecialist.name, 
        hasEmail: !!newSpecialist.email, 
        hasCategoryId: !!newSpecialist.categoryId 
      });
      return;
    }

    setIsAdding(true);
    try {
      console.log("Calling onAddNew with:", newSpecialist);
      await onAddNew(newSpecialist);
      console.log("onAddNew completed successfully");
      setNewSpecialist({ name: "", email: "", role: "", categoryId: "" });
      setShowAddForm(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding specialist:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectSpecialist = (specialist: Specialist) => {
    onAssign(specialist);
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setShowAddForm(false);
          setNewSpecialist({ name: "", email: "", role: "", categoryId: "" });
        }
      }}
    >
      <DialogContent className="backdrop-blur-xl bg-background/95 border-border/50 shadow-2xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Assign Specialist
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!showAddForm ? (
            <>
              {/* Existing Specialists List */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Select Existing Specialist</Label>
                <ScrollArea className="h-[300px] rounded-md border border-border/50 p-2">
                  <div className="space-y-2">
                    {specialists.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No specialists added yet
                      </div>
                    ) : (
                      specialists.map((specialist, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectSpecialist(specialist)}
                          className="w-full p-4 rounded-lg border border-border/50 bg-card/60 hover:bg-card/80 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {specialist.name}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{specialist.email}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                  {specialist.categoryCode || specialist.category}
                                </span>
                                {specialist.role && (
                                  <span className="text-xs text-muted-foreground">{specialist.role}</span>
                                )}
                              </div>
                            </div>
                            {currentAssignment?.email === specialist.email && (
                              <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Add New Button */}
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Specialist
              </Button>
            </>
          ) : (
            <>
              {/* Add New Specialist Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={newSpecialist.name}
                    onChange={(e) => setNewSpecialist({ ...newSpecialist, name: e.target.value })}
                    placeholder="Enter specialist name"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSpecialist.email}
                    onChange={(e) => setNewSpecialist({ ...newSpecialist, email: e.target.value })}
                    placeholder="Enter specialist email"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role
                  </Label>
                  <Select
                    value={newSpecialist.role}
                    onValueChange={(value) => setNewSpecialist({ ...newSpecialist, role: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border/50 max-h-[300px]">
                      <SelectGroup>
                        <SelectLabel>Legal & Regulatory</SelectLabel>
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
                        <SelectLabel>Financial & Deal Structuring</SelectLabel>
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
                        <SelectLabel>Operations & Business</SelectLabel>
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
                        <SelectLabel>Technology & Systems</SelectLabel>
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
                        <SelectLabel>Human Capital</SelectLabel>
                        <SelectItem value="HR Specialist">HR Specialist</SelectItem>
                        <SelectItem value="HR Compliance Lead">HR Compliance Lead</SelectItem>
                        <SelectItem value="Organisational Development Consultant">Organisational Development Consultant</SelectItem>
                        <SelectItem value="Talent Acquisition Lead">Talent Acquisition Lead</SelectItem>
                        <SelectItem value="Compensation & Benefits Analyst">Compensation & Benefits Analyst</SelectItem>
                        <SelectItem value="Culture & Transformation Specialist">Culture & Transformation Specialist</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Industry-Specific Specialists</SelectLabel>
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
                        <SelectLabel>Strategic & Management</SelectLabel>
                        <SelectItem value="Strategic Advisor">Strategic Advisor</SelectItem>
                        <SelectItem value="Board Consultant">Board Consultant</SelectItem>
                        <SelectItem value="Change Management Specialist">Change Management Specialist</SelectItem>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="Risk Management Consultant">Risk Management Consultant</SelectItem>
                        <SelectItem value="ESG Specialist">ESG Specialist</SelectItem>
                      </SelectGroup>

                      <SelectGroup>
                        <SelectLabel>Other</SelectLabel>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={newSpecialist.categoryId}
                    onValueChange={(value) => setNewSpecialist({ ...newSpecialist, categoryId: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border/50">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.code} - {category.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewSpecialist({ name: "", email: "", role: "", categoryId: "" });
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isAdding}
                >
                  Back
                </Button>
                <Button
                  onClick={handleAddNewSpecialist}
                  className="flex-1"
                  disabled={!newSpecialist.name || !newSpecialist.email || !newSpecialist.categoryId || isAdding}
                >
                  {isAdding ? "Adding..." : "Add & Assign"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
