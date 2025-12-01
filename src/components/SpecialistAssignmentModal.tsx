import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
                  <Input
                    id="role"
                    value={newSpecialist.role}
                    onChange={(e) => setNewSpecialist({ ...newSpecialist, role: e.target.value })}
                    placeholder="e.g., Legal Advisor"
                    className="mt-1.5"
                  />
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
