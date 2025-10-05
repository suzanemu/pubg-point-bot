import { Card } from "@/components/ui/card";
import { Trophy, Target, Crosshair, Award } from "lucide-react";
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

  // Split teams into two columns
  const midPoint = Math.ceil(sortedTeams.length / 2);
  const leftColumn = sortedTeams.slice(0, midPoint);
  const rightColumn = sortedTeams.slice(midPoint);

  const TeamRow = ({ team, rank }: { team: Team; rank: number }) => (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-card/50 hover:bg-card/80 transition-colors border-b border-border/50">
      {/* Rank */}
      <div className="col-span-1 flex items-center justify-center">
        <span className="font-bold text-lg">{rank}</span>
      </div>

      {/* Team Name */}
      <div className="col-span-4 flex items-center">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2">
          <Trophy className="h-3 w-3 text-primary" />
        </div>
        <span className="font-bold text-sm truncate">{team.name}</span>
      </div>

      {/* Matches */}
      <div className="col-span-1 flex items-center justify-center">
        <span className="font-semibold text-sm">{team.matchesPlayed}</span>
      </div>

      {/* Place Points */}
      <div className="col-span-2 flex items-center justify-center gap-1">
        <Award className="h-3 w-3 text-yellow-500" />
        <span className="font-semibold text-sm">{team.placementPoints}</span>
      </div>

      {/* Elims/Kills */}
      <div className="col-span-2 flex items-center justify-center">
        <span className="font-semibold text-sm">{team.totalKills}</span>
      </div>

      {/* Total Points */}
      <div className="col-span-2 flex items-center justify-center">
        <span className="font-bold text-base text-primary-glow">{team.totalPoints}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-2">
          OVERALL STANDINGS
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column */}
        <Card className="p-0 border-primary/30 bg-card/80 backdrop-blur overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-1 text-center">Matches</div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Award className="h-3 w-3" />
              <span className="hidden sm:inline">Place</span>
            </div>
            <div className="col-span-2 text-center">Elims</div>
            <div className="col-span-2 text-center">Total</div>
          </div>

          {/* Teams */}
          <div>
            {leftColumn.map((team, index) => (
              <TeamRow key={team.id} team={team} rank={index + 1} />
            ))}
          </div>
        </Card>

        {/* Right Column */}
        <Card className="p-0 border-primary/30 bg-card/80 backdrop-blur overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-4">Team</div>
            <div className="col-span-1 text-center">Matches</div>
            <div className="col-span-2 text-center flex items-center justify-center gap-1">
              <Award className="h-3 w-3" />
              <span className="hidden sm:inline">Place</span>
            </div>
            <div className="col-span-2 text-center">Elims</div>
            <div className="col-span-2 text-center">Total</div>
          </div>

          {/* Teams */}
          <div>
            {rightColumn.map((team, index) => (
              <TeamRow key={team.id} team={team} rank={midPoint + index + 1} />
            ))}
          </div>
        </Card>
      </div>

      {/* Mobile View - Single Column */}
      <Card className="lg:hidden p-0 border-primary/30 bg-card/80 backdrop-blur overflow-hidden mt-4">
        {/* Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-4">Team</div>
          <div className="col-span-1 text-center">M</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-1">
            <Award className="h-3 w-3" />
          </div>
          <div className="col-span-2 text-center">E</div>
          <div className="col-span-2 text-center">Pts</div>
        </div>

        {/* All Teams */}
        <div>
          {sortedTeams.map((team, index) => (
            <TeamRow key={team.id} team={team} rank={index + 1} />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Standings;
