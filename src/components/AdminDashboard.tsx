import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TeamManagement from "./TeamManagement";
import Standings from "./Standings";
import { Team } from "@/types/tournament";

interface AdminDashboardProps {
  userId: string;
}

const AdminDashboard = ({ userId }: AdminDashboardProps) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [showTeamManagement, setShowTeamManagement] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, created_at");

    if (teamsError) {
      console.error("Error fetching teams:", teamsError);
      return;
    }

    if (teamsData) {
      // Fetch match data for each team
      const { data: matchData, error: matchError } = await supabase
        .from("match_screenshots")
        .select("team_id, placement, kills, points");

      if (matchError) {
        console.error("Error fetching match data:", matchError);
      }

      const teamsWithStats: Team[] = teamsData.map((team) => {
        const teamMatches = matchData?.filter((m) => m.team_id === team.id) || [];
        const totalPoints = teamMatches.reduce((sum, m) => sum + (m.points || 0), 0);
        const totalKills = teamMatches.reduce((sum, m) => sum + (m.kills || 0), 0);

        return {
          id: team.id,
          name: team.name,
          totalPoints,
          totalKills,
          matchesPlayed: teamMatches.length,
        };
      });

      setTeams(teamsWithStats);
    }
  };

  const handleAddTeam = async (teamName: string) => {
    const { error } = await supabase
      .from("teams")
      .insert({ name: teamName, created_by: userId });

    if (error) {
      console.error("Error adding team:", error);
      return;
    }

    fetchTeams();
  };

  const handleDeleteTeam = async (teamId: string) => {
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId);

    if (error) {
      console.error("Error deleting team:", error);
      return;
    }

    setTeams(teams.filter((t) => t.id !== teamId));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage teams and view standings</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-border"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Quick Actions */}
        <Button
          onClick={() => setShowTeamManagement(true)}
          className="bg-gradient-primary hover:shadow-glow"
          size="lg"
        >
          Manage Teams
        </Button>

        {/* Standings */}
        {teams.length > 0 ? (
          <Standings teams={teams} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No teams added yet. Start by adding teams.</p>
          </div>
        )}

        {/* Team Management Modal */}
        {showTeamManagement && (
          <TeamManagement
            teams={teams}
            onAddTeam={handleAddTeam}
            onClose={() => {
              setShowTeamManagement(false);
              fetchTeams();
            }}
            onDeleteTeam={handleDeleteTeam}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
