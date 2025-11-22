import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, UserPlus } from "lucide-react";
import { PageNavigation } from "@/components/PageNavigation";

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  role: string;
  permission_level: string;
}

const CoreDealTeam = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [dealName, setDealName] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    contact_number: "",
    role: "",
    custom_role: "",
    permission_level: "",
  });

  useEffect(() => {
    if (id) {
      fetchDeal();
      fetchTeamMembers();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("name")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDealName(data.name);
    } catch (error) {
      console.error("Error fetching deal:", error);
      toast({
        title: "Error",
        description: "Failed to load deal information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("deal_team_members")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  const handleAddOrUpdateMember = async () => {
    if (!formData.full_name || !formData.email || !formData.contact_number || !formData.permission_level) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const finalRole = formData.role === "Other" ? formData.custom_role : formData.role;
    if (!finalRole) {
      toast({
        title: "Missing role",
        description: "Please select or enter a role",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingMember) {
        const { error } = await supabase
          .from("deal_team_members")
          .update({
            full_name: formData.full_name,
            email: formData.email,
            contact_number: formData.contact_number,
            role: finalRole,
            permission_level: formData.permission_level,
          })
          .eq("id", editingMember.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Team member updated successfully",
        });
        setEditingMember(null);
      } else {
        const { error } = await supabase.from("deal_team_members").insert({
          deal_id: id,
          full_name: formData.full_name,
          email: formData.email,
          contact_number: formData.contact_number,
          role: finalRole,
          permission_level: formData.permission_level,
        });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Team member added successfully",
        });
      }

      setFormData({
        full_name: "",
        email: "",
        contact_number: "",
        role: "",
        custom_role: "",
        permission_level: "",
      });
      fetchTeamMembers();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast({
        title: "Error",
        description: "Failed to save team member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    const isCustomRole = ![
      "Deal Owner",
      "Legal Lead",
      "Finance Lead",
      "HR Lead",
      "Compliance Lead",
      "Technical Lead",
      "Junior Analyst",
      "Admin Support",
    ].includes(member.role);

    setFormData({
      full_name: member.full_name,
      email: member.email,
      contact_number: member.contact_number,
      role: isCustomRole ? "Other" : member.role,
      custom_role: isCustomRole ? member.role : "",
      permission_level: member.permission_level,
    });
    setEditingMember(member);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from("deal_team_members").delete().eq("id", memberId);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Team member removed",
      });
      fetchTeamMembers();
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const handleContinue = () => {
    navigate(`/deals/${id}/checklist`);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <PageNavigation items={[
            { to: "/deals", label: "Deals" },
            { to: `/deals/${id}/team`, label: "Core Team", isActive: true },
            { to: `/deals/${id}/checklist`, label: "Checklist" },
          ]} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Add Core Deal Team</h1>
          <p className="text-muted-foreground text-lg">
            Assign the primary team members who will oversee and manage this transaction. Core Team members will receive deal updates, dashboard access, and visibility across tasks.
          </p>
          <p className="text-sm text-muted-foreground mt-2">Deal: {dealName}</p>
        </div>

        {/* Add Team Member Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingMember ? "Edit Team Member" : "Add Team Member"}
            </CardTitle>
            <CardDescription>
              {editingMember ? "Update team member information" : "Enter team member details"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Deal Owner">Deal Owner</SelectItem>
                    <SelectItem value="Legal Lead">Legal Lead</SelectItem>
                    <SelectItem value="Finance Lead">Finance Lead</SelectItem>
                    <SelectItem value="HR Lead">HR Lead</SelectItem>
                    <SelectItem value="Compliance Lead">Compliance Lead</SelectItem>
                    <SelectItem value="Technical Lead">Technical Lead</SelectItem>
                    <SelectItem value="Junior Analyst">Junior Analyst</SelectItem>
                    <SelectItem value="Admin Support">Admin Support</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "Other" && (
                <div className="space-y-2">
                  <Label htmlFor="custom_role">Custom Role *</Label>
                  <Input
                    id="custom_role"
                    value={formData.custom_role}
                    onChange={(e) => setFormData({ ...formData, custom_role: e.target.value })}
                    placeholder="Enter custom role"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="permission_level">Permission Level *</Label>
                <Select
                  value={formData.permission_level}
                  onValueChange={(value) => setFormData({ ...formData, permission_level: value })}
                >
                  <SelectTrigger id="permission_level">
                    <SelectValue placeholder="Select permission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Access">Full Access</SelectItem>
                    <SelectItem value="Standard Access">Standard Access</SelectItem>
                    <SelectItem value="View Only">View Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddOrUpdateMember} disabled={isSubmitting} className="bg-destructive hover:bg-destructive/90">
                {editingMember ? "Update Team Member" : "Add Team Member"}
              </Button>
              {editingMember && (
                <Button variant="outline" onClick={() => {
                  setEditingMember(null);
                  setFormData({
                    full_name: "",
                    email: "",
                    contact_number: "",
                    role: "",
                    custom_role: "",
                    permission_level: "",
                  });
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Members List */}
        {teamMembers.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
              <CardDescription>Manage your core deal team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="bg-muted/50">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{member.full_name}</h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {member.permission_level}
                            </span>
                          </div>
                          <div className="grid md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Email:</span> {member.email}
                            </div>
                            <div>
                              <span className="font-medium">Phone:</span> {member.contact_number}
                            </div>
                            <div>
                              <span className="font-medium">Role:</span> {member.role}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMember(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteMember(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        <Button onClick={handleContinue} size="lg" className="w-full">
          Continue to Pre-Due Diligence Checklist
        </Button>
      </div>
    </div>
  );
};

export default CoreDealTeam;
