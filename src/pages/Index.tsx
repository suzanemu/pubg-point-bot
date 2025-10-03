import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Plus } from "lucide-react";
import TeamManager from "@/components/TeamManager";
import MatchInput from "@/components/MatchInput";
import StandingsTable from "@/components/StandingsTable";
import { Team, Match } from "@/types/tournament";

const Index = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const addTeam = (teamName: string) => {
    const newTeam: Team = {
      id: Date.now().toString(),
      name: teamName,
      totalPoints: 0,
      placementPoints: 0,
      killPoints: 0,
      matches: 0,
    };
    setTeams([...teams, newTeam]);
  };

  const removeTeam = (teamId: string) => {
    setTeams(teams.filter((team) => team.id !== teamId));
    setMatches(matches.filter((match) => match.teamId !== teamId));
  };

  const addMatch = (match: Omit<Match, "id">) => {
    const newMatch: Match = {
      ...match,
      id: Date.now().toString(),
    };
    setMatches([...matches, newMatch]);

    // Update team points
    setTeams(
      teams.map((team) => {
        if (team.id === match.teamId) {
          const placementPoints = match.placementPoints;
          const killPoints = match.kills;
          return {
            ...team,
            totalPoints: team.totalPoints + placementPoints + killPoints,
            placementPoints: team.placementPoints + placementPoints,
            killPoints: team.killPoints + killPoints,
            matches: team.matches + 1,
          };
        }
        return team;
      })
    );
  };

  const resetTournament = () => {
    setMatches([]);
    setTeams(
      teams.map((team) => ({
        ...team,
        totalPoints: 0,
        placementPoints: 0,
        killPoints: 0,
        matches: 0,
      }))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-primary via-primary-glow to-accent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary-foreground" />
            <div>
              <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
                PUBG Mobile Esports
              </h1>
              <p className="text-sm text-primary-foreground/80">Point Table Manager</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Team Management */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border shadow-lg">
          <TeamManager teams={teams} onAddTeam={addTeam} onRemoveTeam={removeTeam} />
        </Card>

        {teams.length > 0 && (
          <>
            {/* Match Input */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border shadow-lg">
              <MatchInput teams={teams} onAddMatch={addMatch} />
            </Card>

            {/* Standings */}
            <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Current Standings
                </h2>
                {matches.length > 0 && (
                  <Button variant="destructive" onClick={resetTournament} size="sm">
                    Reset Tournament
                  </Button>
                )}
              </div>
              <StandingsTable teams={teams} />
            </Card>
          </>
        )}

        {teams.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground">Add teams to start tracking tournament points</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
