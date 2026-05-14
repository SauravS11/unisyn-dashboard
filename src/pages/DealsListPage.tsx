import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderOpen, Calendar, Clock, ChevronRight, MoreVertical, CheckCircle2, Key, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { format } from "date-fns";
import { PageNavigation } from "@/components/PageNavigation";
import { SignOutButton } from "@/components/SignOutButton";
import { NotificationButton } from "@/components/NotificationButton";
import { toast as sonnerToast } from "sonner";
import { PasscodeDialog } from "@/components/PasscodeDialog";

interface Deal {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: string;
  passcode?: string | null;
  deal_code: string;
}

const DealsListPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'completed'>('active');
  const [passcodeDialogOpen, setPasscodeDialogOpen] = useState(false);
  const [selectedDealForPasscode, setSelectedDealForPasscode] = useState<Deal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDealForDelete, setSelectedDealForDelete] = useState<Deal | null>(null);

  const fetchDeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your deals.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeals(data || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [navigate, toast]);

  const handleDealComplete = async (dealId: string, dealName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('deals')
        .update({ status: 'completed' })
        .eq('id', dealId);

      if (error) throw error;

      sonnerToast.success(`${dealName} marked as complete!`);
      
      // Refresh deals list
      fetchDeals();
    } catch (error) {
      console.error('Error marking deal as complete:', error);
      sonnerToast.error("Failed to mark deal as complete");
    }
  };

  const filteredDeals = deals.filter(deal => 
    viewMode === 'active' 
      ? (deal.status === 'active' || deal.status === 'in_progress')
      : deal.status === viewMode
  );
  const completedCount = deals.filter(deal => deal.status === 'completed').length;

  const handleOpenPasscodeDialog = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealForPasscode(deal);
    setPasscodeDialogOpen(true);
  };

  const handleDealClick = async (deal: Deal) => {
    if (deal.status === 'in_progress') {
      // Resume where the user left off: checklist if any tasks saved, otherwise team
      const { data: categories } = await supabase
        .from('deal_categories')
        .select('id')
        .eq('deal_id', deal.id)
        .limit(1);
      if (categories && categories.length > 0) {
        navigate(`/deals/${deal.id}/checklist`);
      } else {
        navigate(`/deals/${deal.id}/team`);
      }
    } else {
      navigate(`/deals/${deal.id}/dashboard`);
    }
  };

  const handleOpenDeleteDialog = (deal: Deal, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDealForDelete(deal);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDeal = async () => {
    if (!selectedDealForDelete) return;

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', selectedDealForDelete.id);

      if (error) throw error;

      sonnerToast.success(`${selectedDealForDelete.name} has been deleted`);
      setDeleteDialogOpen(false);
      setSelectedDealForDelete(null);
      
      // Refresh deals list
      fetchDeals();
    } catch (error) {
      console.error('Error deleting deal:', error);
      sonnerToast.error("Failed to delete deal");
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
            <SignOutButton />
          </div>
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
            <NotificationButton />
          </div>
          <img src={unisynLogo} alt="UniSyn Technology" className="w-32 sm:w-44 h-auto mt-2 sm:mt-0" />
          <PageNavigation
            items={[
              { to: "/welcome", label: "Home" },
              { to: "/deals", label: "Deals", isActive: true },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Your <span className="text-primary">Deals</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track all your M&A deals in one place
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => setViewMode(viewMode === 'active' ? 'completed' : 'active')}
              variant="outline"
              className="bg-background/50 border-border/50 w-full sm:w-auto touch-manipulation"
            >
              {viewMode === 'active' ? `Deal Completed (${completedCount})` : 'Active Deals'}
            </Button>
            <Button 
              onClick={() => navigate("/deals/create")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto touch-manipulation"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Deal
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg">
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {viewMode === 'active' ? 'No active deals' : 'No completed deals'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {viewMode === 'active' 
                  ? 'Get started by creating your first deal'
                  : 'Mark deals as complete to see them here'
                }
              </p>
              {viewMode === 'active' && (
                <Button 
                  onClick={() => navigate("/deals/create")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Deal
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDeals.map((deal) => (
              <Card 
                key={deal.id}
                className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group touch-manipulation"
                onClick={() => handleDealClick(deal)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 touch-manipulation">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="z-50 bg-card border-border">
                          <DropdownMenuItem onClick={(e) => handleDealComplete(deal.id, deal.name, e)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Deal Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleOpenPasscodeDialog(deal, e)}>
                            <Key className="h-4 w-4 mr-2" />
                            {deal.passcode ? "Edit Passcode" : "Add Passcode"}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleOpenDeleteDialog(deal, e)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Deal
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <span className="flex-1 truncate">{deal.name}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {deal.status === 'in_progress' && (
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/30">
                      In Progress
                    </Badge>
                  )}
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">Created {format(new Date(deal.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 shrink-0" />
                    <span className="truncate">Updated {format(new Date(deal.updated_at), 'MMM dd, yyyy')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Passcode Dialog */}
      {selectedDealForPasscode && (
        <PasscodeDialog
          isOpen={passcodeDialogOpen}
          onClose={() => {
            setPasscodeDialogOpen(false);
            setSelectedDealForPasscode(null);
          }}
          dealId={selectedDealForPasscode.id}
          dealCode={selectedDealForPasscode.deal_code}
          dealName={selectedDealForPasscode.name}
          currentPasscode={selectedDealForPasscode.passcode}
          onPasscodeUpdate={fetchDeals}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedDealForDelete?.name}"? This action cannot be undone and will permanently delete the deal and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDealForDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeal}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealsListPage;
