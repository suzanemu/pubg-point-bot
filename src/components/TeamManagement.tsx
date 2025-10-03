import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Team } from "@/types/tournament";

interface TeamManagementProps {
  teams: Team[];
  onAddTeam: (teamName: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onClose: () => void;
}

const TeamManagement = ({ teams, onAddTeam, onDeleteTeam, onClose }: TeamManagementProps) => {
  const [newTeamName, setNewTeamName] = useState("");

  const handleAddTeam = () => {
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim());
      setNewTeamName("");
      toast.success(`Team "${newTeamName}" added successfully!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto border-primary/30">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Team Management
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Add Team Form */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter team name..."
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
              className="flex-1 bg-input border-border"
            />
            <Button
              onClick={handleAddTeam}
              disabled={!newTeamName.trim()}
              className="bg-gradient-primary hover:shadow-glow"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Teams List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Teams ({teams.length})
            </h3>
            {teams.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No teams added yet
              </p>
            ) : (
              <div className="space-y-2">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.matchesPlayed} matches • {team.totalPoints} points
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        onDeleteTeam(team.id);
                        toast.success(`Team "${team.name}" deleted`);
                      }}
                      className="hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TeamManagement;
