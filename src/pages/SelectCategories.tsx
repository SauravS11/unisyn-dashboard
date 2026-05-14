import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, X, CheckCheck, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageNavigation } from "@/components/PageNavigation";
import { SignOutButton } from "@/components/SignOutButton";
import { DealProgressStepper } from "@/components/DealProgressStepper";
import { DEAL_CATEGORIES } from "@/lib/dealCategories";
import { cn } from "@/lib/utils";

const SelectCategories = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dealName, setDealName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(DEAL_CATEGORIES.map((c) => c.id)));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("deals")
          .select("name, selected_categories")
          .eq("id", id)
          .single();
        if (error) throw error;
        setDealName(data.name);
        if (data.selected_categories && data.selected_categories.length > 0) {
          setSelected(new Set(data.selected_categories));
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Could not load deal.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, toast]);

  const toggle = (catId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(DEAL_CATEGORIES.map((c) => c.id)));
  const clearAll = () => setSelected(new Set());

  const handleContinue = async () => {
    if (selected.size === 0) {
      toast({ title: "Select at least one category", description: "Pick the categories you want to include for this deal.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const ordered = DEAL_CATEGORIES.filter((c) => selected.has(c.id)).map((c) => c.id);
      const { error } = await supabase
        .from("deals")
        .update({ selected_categories: ordered })
        .eq("id", id);
      if (error) throw error;
      navigate(`/deals/${id}/checklist`);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not save your selection.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-center relative">
          <div className="absolute top-3 sm:top-4 left-4 sm:left-6">
            <SignOutButton />
          </div>
          <PageNavigation
            items={[
              { to: "/deals", label: "Deals" },
              { to: `/deals/${id}/team`, label: "Core Team" },
              { to: `/deals/${id}/categories`, label: "Categories", isActive: true },
              { to: `/deals/${id}/checklist`, label: "Checklist" },
            ]}
          />
        </div>
        <div className="container mx-auto px-4 pb-4">
          <DealProgressStepper current="categories" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        <div className="mb-6 sm:mb-8 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/deals")}
            className="absolute -top-2 right-0 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 pr-10">
            Select <span className="text-red-500">Categories</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground text-lg">
            Choose which of the 14 due-diligence categories should apply to this deal. You can include or exclude any of them — only the selected ones will appear in the checklist.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">Deal: {dealName}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{selected.size}</span> of {DEAL_CATEGORIES.length} selected
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              <CheckCheck className="h-4 w-4 mr-2" /> Select all
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <Square className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          {DEAL_CATEGORIES.map((cat, idx) => {
            const isSelected = selected.has(cat.id);
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.02 }}
              >
                <button
                  type="button"
                  onClick={() => toggle(cat.id)}
                  className="w-full text-left focus:outline-none"
                >
                  <Card
                    className={cn(
                      "transition-all cursor-pointer h-full border-2",
                      isSelected
                        ? "border-red-500 bg-red-500/5 shadow-[0_0_0_3px_hsl(0_84%_60%/0.1)]"
                        : "border-border/50 hover:border-red-500/40 hover:bg-muted/30",
                    )}
                  >
                    <CardContent className="p-4 flex gap-3 items-start">
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 mt-0.5 transition-colors",
                          isSelected ? "bg-red-500 border-red-500 text-white" : "border-border",
                        )}
                      >
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-red-500">{cat.id}</span>
                          <h3 className="font-semibold text-sm sm:text-base truncate">{cat.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/deals/${id}/team`)}
            className="border-border/50 px-6 sm:px-8 font-semibold w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Core Team
          </Button>
          <Button onClick={handleContinue} disabled={isSaving} size="lg" className="w-full sm:w-auto">
            {isSaving ? "Saving..." : "Continue to Pre-Due Diligence Checklist"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectCategories;
