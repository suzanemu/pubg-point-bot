import { Card } from "@/components/ui/card";
import { Trophy, Target, Crosshair } from "lucide-react";
import { Team } from "@/types/tournament";

interface StandingsProps {
  teams: Team[];
}

const Standings = ({ teams }: StandingsProps) => {
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return b.totalKills - a.totalKills;
  });

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-orange-600/20 to-orange-700/20 border-orange-600/50";
      default:
        return "bg-card border-border";
    }
  };

  return (
    <Card className="p-6 border-primary/30">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Overall Standings
          </h2>
          <Trophy className="h-8 w-8 text-primary-glow" />
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-16 gap-3 px-4 py-2 bg-muted/50 rounded-lg font-semibold text-sm">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Team</div>
          <div className="col-span-2 text-center">Matches</div>
          <div className="col-span-2 text-center">Place Pts</div>
          <div className="col-span-2 text-center">Kill Pts</div>
          <div className="col-span-2 text-center">Kills</div>
          <div className="col-span-3 text-center">Total</div>
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {sortedTeams.map((team, index) => {
            const rank = index + 1;
            return (
              <Card
                key={team.id}
                className={`p-4 transition-all hover:scale-[1.02] ${getRankStyle(rank)}`}
              >
                <div className="grid grid-cols-12 md:grid-cols-16 gap-3 items-center">
                  {/* Rank */}
                  <div className="col-span-2 md:col-span-1">
                    <div className="flex items-center justify-center">
                      {rank <= 3 ? (
                        <Trophy
                          className={`h-6 w-6 ${
                            rank === 1
                              ? "text-yellow-500"
                              : rank === 2
                              ? "text-gray-400"
                              : "text-orange-600"
                          }`}
                        />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          #{rank}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Team Name */}
                  <div className="col-span-10 md:col-span-4">
                    <p className="font-bold text-lg">{team.name}</p>
                  </div>

                  {/* Stats - Mobile */}
                  <div className="col-span-12 md:hidden grid grid-cols-5 gap-2 mt-2">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Matches</p>
                      <p className="font-bold">{team.matchesPlayed}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Trophy className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                      <p className="text-xs text-muted-foreground">Place Pts</p>
                      <p className="font-bold">{team.placementPoints}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Crosshair className="h-4 w-4 mx-auto mb-1 text-accent" />
                      <p className="text-xs text-muted-foreground">Kill Pts</p>
                      <p className="font-bold">{team.killPoints}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <Crosshair className="h-4 w-4 mx-auto mb-1 text-accent" />
                      <p className="text-xs text-muted-foreground">Kills</p>
                      <p className="font-bold">{team.totalKills}</p>
                    </div>
                    <div className="text-center p-2 bg-primary/20 rounded border border-primary/30">
                      <Trophy className="h-4 w-4 mx-auto mb-1 text-primary-glow" />
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-primary-glow text-lg">
                        {team.totalPoints}
                      </p>
                    </div>
                  </div>

                  {/* Stats - Desktop */}
                  <div className="hidden md:block col-span-2 text-center">
                    <p className="font-semibold">{team.matchesPlayed}</p>
                  </div>
                  <div className="hidden md:block col-span-2 text-center">
                    <p className="font-semibold text-yellow-500">{team.placementPoints}</p>
                  </div>
                  <div className="hidden md:block col-span-2 text-center">
                    <p className="font-semibold text-accent">{team.killPoints}</p>
                  </div>
                  <div className="hidden md:block col-span-2 text-center">
                    <p className="font-semibold">{team.totalKills}</p>
                  </div>
                  <div className="hidden md:block col-span-3 text-center">
                    <p className="font-bold text-xl text-primary-glow">
                      {team.totalPoints}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default Standings;
