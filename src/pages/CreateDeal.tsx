import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarIcon, X, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SignOutButton } from "@/components/SignOutButton";
import { PageNavigation } from "@/components/PageNavigation";

const CreateDeal = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  const creatingRef = useRef(false);
  const [formData, setFormData] = useState({
    dealName: "",
    buyer: "",
    buyerEmail: "",
    seller: "",
    sellerEmail: "",
    buyerLegalName: "",
    buyerLegalEmail: "",
    sellerLegalName: "",
    sellerLegalEmail: "",
    dealValue: "",
    timeline: undefined as Date | undefined,
    industry: "",
    dealStage: "",
    leadAdvisor: "",
    confidentialityLevel: "",
  });

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to create a deal");
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const buildDealPayload = () => ({
    name: formData.dealName,
    target_close_date: formData.timeline ? format(formData.timeline, 'yyyy-MM-dd') : null,
    buyer_name: formData.buyer || null,
    buyer_email: formData.buyerEmail || null,
    seller_name: formData.seller || null,
    seller_email: formData.sellerEmail || null,
    buyer_legal_name: formData.buyerLegalName || null,
    buyer_legal_email: formData.buyerLegalEmail || null,
    seller_legal_name: formData.sellerLegalName || null,
    seller_legal_email: formData.sellerLegalEmail || null,
  });

  // Auto-create the deal as soon as the user types a name, then auto-update on changes
  useEffect(() => {
    const trimmedName = formData.dealName.trim();
    if (!trimmedName) return;

    const timer = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!dealId && !creatingRef.current) {
        creatingRef.current = true;
        const { data, error } = await supabase
          .from("deals")
          .insert({
            ...buildDealPayload(),
            deal_code: '',
            user_id: user.id,
            status: 'in_progress',
          })
          .select()
          .single();
        creatingRef.current = false;
        if (error) {
          console.error("Auto-save create error:", error);
          return;
        }
        setDealId(data.id);
      } else if (dealId) {
        const { error } = await supabase
          .from("deals")
          .update(buildDealPayload())
          .eq("id", dealId);
        if (error) console.error("Auto-save update error:", error);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, dealId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to create a deal");
        navigate("/");
        return;
      }

      let activeDealId = dealId;

      if (activeDealId) {
        // Already auto-saved — just push the latest values and continue
        const { error } = await supabase
          .from("deals")
          .update(buildDealPayload())
          .eq("id", activeDealId);
        if (error) {
          console.error("Error updating deal:", error);
          toast.error("Failed to save deal");
          return;
        }
      } else {
        const { data: deal, error } = await supabase
          .from("deals")
          .insert({
            ...buildDealPayload(),
            deal_code: '',
            user_id: user.id,
            status: 'in_progress',
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating deal:", error);
          toast.error("Failed to create deal");
          return;
        }
        activeDealId = deal.id;
        setDealId(deal.id);
      }

      toast.success("Deal saved!");
      navigate(`/deals/${activeDealId}/team`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating the deal");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
            <SignOutButton />
          </div>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-36 sm:w-44 h-auto" />
          <PageNavigation
            items={[
              { to: "/welcome", label: "Home" },
              { to: "/deals", label: "Deals" },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/deals")}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
          <CardHeader className="border-b border-border/50 pb-3 sm:pb-6 px-3 sm:px-6 pr-12">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
              New <span className="text-primary">Deal</span>
            </CardTitle>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Enter the details for your new M&A transaction
            </p>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-8 px-3 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
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

                {/* Buyer Section */}
                <div className="md:col-span-2 space-y-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <h3 className="font-semibold text-sm text-primary">Buyer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer" className="text-sm font-medium">
                        Buyer Name <span className="text-primary">*</span>
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
                    <div className="space-y-2">
                      <Label htmlFor="buyerEmail" className="text-sm font-medium">
                        Buyer Email
                      </Label>
                      <Input
                        id="buyerEmail"
                        type="email"
                        placeholder="buyer@company.com"
                        value={formData.buyerEmail}
                        onChange={(e) => handleChange("buyerEmail", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyerLegalName" className="text-sm font-medium">
                        Buyer Legal Party Name
                      </Label>
                      <Input
                        id="buyerLegalName"
                        placeholder="Legal representative name"
                        value={formData.buyerLegalName}
                        onChange={(e) => handleChange("buyerLegalName", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyerLegalEmail" className="text-sm font-medium">
                        Buyer Legal Party Email
                      </Label>
                      <Input
                        id="buyerLegalEmail"
                        type="email"
                        placeholder="legal@buyercompany.com"
                        value={formData.buyerLegalEmail}
                        onChange={(e) => handleChange("buyerLegalEmail", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Seller Section */}
                <div className="md:col-span-2 space-y-4 p-4 rounded-lg bg-muted/30 border border-border/30">
                  <h3 className="font-semibold text-sm text-primary">Seller Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="seller" className="text-sm font-medium">
                        Seller Name <span className="text-primary">*</span>
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
                    <div className="space-y-2">
                      <Label htmlFor="sellerEmail" className="text-sm font-medium">
                        Seller Email
                      </Label>
                      <Input
                        id="sellerEmail"
                        type="email"
                        placeholder="seller@company.com"
                        value={formData.sellerEmail}
                        onChange={(e) => handleChange("sellerEmail", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellerLegalName" className="text-sm font-medium">
                        Seller Legal Party Name
                      </Label>
                      <Input
                        id="sellerLegalName"
                        placeholder="Legal representative name"
                        value={formData.sellerLegalName}
                        onChange={(e) => handleChange("sellerLegalName", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sellerLegalEmail" className="text-sm font-medium">
                        Seller Legal Party Email
                      </Label>
                      <Input
                        id="sellerLegalEmail"
                        type="email"
                        placeholder="legal@sellercompany.com"
                        value={formData.sellerLegalEmail}
                        onChange={(e) => handleChange("sellerLegalEmail", e.target.value)}
                        className="bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
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
                  <Button
                    variant="outline"
                    onClick={() => setCalendarOpen(true)}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background/50 border-border/50 hover:bg-background/70 transition-all duration-200",
                      !formData.timeline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.timeline ? format(formData.timeline, "PPP") : <span>Select target date</span>}
                  </Button>
                  <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <DialogContent className="w-[90vw] sm:w-[70vw] lg:w-[50vw] max-w-none p-0 overflow-hidden backdrop-blur-2xl bg-background/80 border-border/50 shadow-2xl">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                          <div className="flex flex-col">
                            <DialogTitle className="font-bold text-lg">Select Target Date</DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground">
                              Choose the target close date for this deal
                            </DialogDescription>
                          </div>
                        </div>
                        <div className="flex items-center justify-center p-6 sm:p-8">
                          <Calendar
                            mode="single"
                            selected={formData.timeline}
                            onSelect={(date) => {
                              handleChange("timeline", date);
                              setCalendarOpen(false);
                            }}
                            disabled={(date) =>
                              date < new Date() || date > new Date("2035-12-31")
                            }
                            initialFocus
                            className={cn("p-3 pointer-events-auto bg-card/60 backdrop-blur-xl rounded-lg border border-border/30")}
                          />
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
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
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 sm:pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/deals")}
                  className="border-border/50 px-6 sm:px-8 font-semibold transition-all rounded-2xl w-full sm:w-auto touch-manipulation"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Deals
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 font-semibold shadow-lg hover:shadow-xl transition-all rounded-2xl w-full sm:w-auto touch-manipulation"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Deal..." : "Continue to Core Team"}
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
