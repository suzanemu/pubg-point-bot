import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GamepadIcon } from "lucide-react";
import { Team } from "@/types/tournament";
import { getPlacementPoints } from "@/types/tournament";
import { toast } from "sonner";

interface MatchInputProps {
  teams: Team[];
  onAddMatch: (match: {
    teamId: string;
    placement: number;
    kills: number;
    placementPoints: number;
    matchNumber: number;
  }) => void;
}

const MatchInput = ({ teams, onAddMatch }: MatchInputProps) => {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [placement, setPlacement] = useState("");
  const [kills, setKills] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeamId || !placement || !kills) {
      toast.error("Please fill in all fields");
      return;
    }

    const placementNum = parseInt(placement);
    const killsNum = parseInt(kills);

    if (placementNum < 1 || placementNum > 16) {
      toast.error("Placement must be between 1 and 16");
      return;
    }

    if (killsNum < 0) {
      toast.error("Kills cannot be negative");
      return;
    }

    const placementPoints = getPlacementPoints(placementNum);
    const totalMatchPoints = placementPoints + killsNum;

    const selectedTeam = teams.find((t) => t.id === selectedTeamId);
    const matchNumber = (selectedTeam?.matches || 0) + 1;

    onAddMatch({
      teamId: selectedTeamId,
      placement: placementNum,
      kills: killsNum,
      placementPoints,
      matchNumber,
    });

    toast.success(
      `Match added: ${selectedTeam?.name} - ${totalMatchPoints} points (${placementPoints} placement + ${killsNum} kills)`
    );

    setPlacement("");
    setKills("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GamepadIcon className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Add Match Result</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="team" className="text-foreground">
              Team
            </Label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placement" className="text-foreground">
              Placement (1-16)
            </Label>
            <Input
              id="placement"
              type="number"
              min="1"
              max="16"
              placeholder="e.g., 1"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kills" className="text-foreground">
              Kills
            </Label>
            <Input
              id="kills"
              type="number"
              min="0"
              placeholder="e.g., 5"
              value={kills}
              onChange={(e) => setKills(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
        </div>

        <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
          Add Match Result
        </Button>
      </form>

      {/* Point System Reference */}
      <div className="mt-6 p-4 bg-secondary/30 border border-border rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-2">Point System Reference:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
          <div>1st: 10 pts</div>
          <div>2nd: 6 pts</div>
          <div>3rd: 5 pts</div>
          <div>4th: 4 pts</div>
          <div>5th: 3 pts</div>
          <div>6th: 2 pts</div>
          <div>7-8th: 1 pt</div>
          <div>9-16th: 0 pts</div>
        </div>
        <div className="mt-2 text-sm text-accent font-medium">Each Kill = 1 Point</div>
      </div>
    </div>
  );
};

export default MatchInput;
