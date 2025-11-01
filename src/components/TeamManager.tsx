import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Tournament } from "@/types/tournament";

interface Team {
  id: string;
  name: string;
  access_code?: string;
}

export default function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchTeams();
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error);
      return;
    }

    setTournaments(data || []);
    if (data && data.length > 0 && !selectedTournament) {
      setSelectedTournament(data[0].id);
    }
  };

  const fetchTeams = async () => {
    if (!selectedTournament) return;

    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("tournament_id", selectedTournament);

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return;
    }

    // Fetch access codes for each team
    const { data: codesData } = await supabase
      .from("access_codes")
      .select("team_id, code")
      .eq("role", "player")
      .eq("tournament_id", selectedTournament);

    const teamsWithCodes = teamsData.map((team) => ({
      ...team,
      access_code: codesData?.find((code) => code.team_id === team.id)?.code,
    }));

    setTeams(teamsWithCodes);
  };

  const generateAccessCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTournament) {
      toast.error("Please select a tournament first");
      return;
    }

    if (!newTeamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setLoading(true);

    try {
      // Create team
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .insert({ name: newTeamName.trim(), tournament_id: selectedTournament })
        .select()
        .single();

      if (teamError) {
        toast.error("Failed to create team");
        return;
      }

      // Generate access code for the team
      const accessCode = generateAccessCode();
      const { error: codeError } = await supabase
        .from("access_codes")
        .insert({
          code: accessCode,
          role: "player",
          team_id: teamData.id,
          tournament_id: selectedTournament,
        });

      if (codeError) {
        toast.error("Team created but failed to generate access code");
        return;
      }

      toast.success(`Team created! Access code: ${accessCode}`);
      setNewTeamName("");
      fetchTeams();
    } catch (error) {
      console.error("Error adding team:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team?")) {
      return;
    }

    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      toast.error("Failed to delete team");
      return;
    }

    toast.success("Team deleted");
    fetchTeams();
  };

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Access code copied!");
  };

  if (tournaments.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Please create a tournament first before adding teams.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Select Tournament</h2>
        <Select value={selectedTournament} onValueChange={setSelectedTournament}>
          <SelectTrigger>
            <SelectValue placeholder="Select a tournament" />
          </SelectTrigger>
          <SelectContent>
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                {tournament.name} ({tournament.total_matches} matches)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Add New Team</h2>
        <form onSubmit={handleAddTeam} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team-name">Team Name</Label>
            <Input
              id="team-name"
              type="text"
              placeholder="Enter team name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            {loading ? "Creating..." : "Create Team"}
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Teams & Access Codes</h2>
        <div className="space-y-3">
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No teams yet. Create your first team above.
            </p>
          ) : (
            teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{team.name}</h3>
                  {team.access_code && (
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {team.access_code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyAccessCode(team.access_code!)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteTeam(team.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
