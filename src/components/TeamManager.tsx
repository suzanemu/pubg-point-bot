import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Users } from "lucide-react";
import { Team } from "@/types/tournament";
import { toast } from "sonner";

interface TeamManagerProps {
  teams: Team[];
  onAddTeam: (teamName: string) => void;
  onRemoveTeam: (teamId: string) => void;
}

const TeamManager = ({ teams, onAddTeam, onRemoveTeam }: TeamManagerProps) => {
  const [newTeamName, setNewTeamName] = useState("");

  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }
    if (teams.some((team) => team.name.toLowerCase() === newTeamName.toLowerCase())) {
      toast.error("Team name already exists");
      return;
    }
    onAddTeam(newTeamName);
    setNewTeamName("");
    toast.success(`Team "${newTeamName}" added successfully`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Team Management</h2>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Enter team name..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddTeam()}
          className="flex-1 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={handleAddTeam} className="bg-primary hover:bg-primary-glow">
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      {teams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center justify-between bg-secondary/50 border border-border rounded-lg px-4 py-2 hover:bg-secondary transition-colors"
            >
              <span className="font-medium text-foreground">{team.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onRemoveTeam(team.id);
                  toast.info(`Team "${team.name}" removed`);
                }}
                className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamManager;
