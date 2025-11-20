import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import unisynLogo from "@/assets/unisyn-logo.png";

const CreateDeal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    dealName: "",
    buyer: "",
    seller: "",
    dealValue: "",
    timeline: undefined as Date | undefined,
    industry: "",
    dealStage: "",
    leadAdvisor: "",
    confidentialityLevel: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Deal created:", formData);
    // Navigate to checklist page with deal ID (for now using a placeholder)
    navigate("/deals/new-deal/checklist");
  };

  const handleChange = (field: string, value: string | Date | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center">
          <img src={unisynLogo} alt="UniSyn Technology" className="w-32 h-auto" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">
              New <span className="text-primary">Deal</span>
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Enter the details for your new M&A transaction
            </p>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Two Column Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Deal Name */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="dealName" className="text-sm font-medium">
                    Deal Name <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="dealName"
                    placeholder="e.g., TechCorp Acquisition"
                    value={formData.dealName}
                    onChange={(e) => handleChange("dealName", e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Buyer */}
                <div className="space-y-2">
                  <Label htmlFor="buyer" className="text-sm font-medium">
                    Buyer <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="buyer"
                    placeholder="Buyer company name"
                    value={formData.buyer}
                    onChange={(e) => handleChange("buyer", e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Seller */}
                <div className="space-y-2">
                  <Label htmlFor="seller" className="text-sm font-medium">
                    Seller <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="seller"
                    placeholder="Seller company name"
                    value={formData.seller}
                    onChange={(e) => handleChange("seller", e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Deal Value */}
                <div className="space-y-2">
                  <Label htmlFor="dealValue" className="text-sm font-medium">
                    Deal Value <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="dealValue"
                    placeholder="e.g., R 50,000,000"
                    value={formData.dealValue}
                    onChange={(e) => handleChange("dealValue", e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <Label htmlFor="timeline" className="text-sm font-medium">
                    Timeline <span className="text-primary">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background/50 border-border/50 hover:bg-background/70",
                          !formData.timeline && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.timeline ? format(formData.timeline, "PPP") : <span>Select target date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 backdrop-blur-xl bg-card/95 border-border/50 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.timeline}
                        onSelect={(date) => handleChange("timeline", date)}
                        disabled={(date) =>
                          date < new Date() || date > new Date("2035-12-31")
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry" className="text-sm font-medium">
                    Industry <span className="text-primary">*</span>
                  </Label>
                  <Select value={formData.industry} onValueChange={(value) => handleChange("industry", value)} required>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="energy">Energy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deal Stage */}
                <div className="space-y-2">
                  <Label htmlFor="dealStage" className="text-sm font-medium">
                    Deal Stage <span className="text-primary">*</span>
                  </Label>
                  <Select value={formData.dealStage} onValueChange={(value) => handleChange("dealStage", value)} required>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="initial">Initial Contact</SelectItem>
                      <SelectItem value="nda">NDA Signed</SelectItem>
                      <SelectItem value="due-diligence">Due Diligence</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closing">Closing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Lead Advisor */}
                <div className="space-y-2">
                  <Label htmlFor="leadAdvisor" className="text-sm font-medium">
                    Lead Advisor <span className="text-primary">*</span>
                  </Label>
                  <Input
                    id="leadAdvisor"
                    placeholder="Advisor name"
                    value={formData.leadAdvisor}
                    onChange={(e) => handleChange("leadAdvisor", e.target.value)}
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>

                {/* Confidentiality Level */}
                <div className="space-y-2">
                  <Label htmlFor="confidentialityLevel" className="text-sm font-medium">
                    Confidentiality Level <span className="text-primary">*</span>
                  </Label>
                  <Select value={formData.confidentialityLevel} onValueChange={(value) => handleChange("confidentialityLevel", value)} required>
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="confidential">Confidential</SelectItem>
                      <SelectItem value="highly-confidential">Highly Confidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6 border-t border-border/50">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-semibold shadow-lg hover:shadow-xl transition-all rounded-2xl"
                >
                  Continue to Checklist
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDeal;
