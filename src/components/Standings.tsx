import { Card } from "@/components/ui/card";
import { Trophy, Target, Crosshair, Award, Drumstick } from "lucide-react";
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
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-3 bg-card/50 hover:bg-card/80 transition-colors border-b border-border/50">
      {/* Rank */}
      <div className="flex items-center justify-center w-12">
        <span className="font-bold text-lg">{rank}</span>
      </div>

      {/* Team Name */}
      <div className="flex items-center min-w-0">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 flex-shrink-0">
          <Trophy className="h-3 w-3 text-primary" />
        </div>
        <span className="font-bold text-sm truncate">{team.name}</span>
      </div>

      {/* Matches */}
      <div className="flex items-center justify-center w-16">
        <span className="font-semibold text-sm">{team.matchesPlayed}</span>
      </div>

      {/* Chicken Dinners */}
      <div className="flex items-center justify-center gap-1 w-16">
        <Drumstick className="h-3 w-3 text-yellow-500" />
        <span className="font-semibold text-sm">{team.firstPlaceWins}</span>
      </div>

      {/* Place Points */}
      <div className="flex items-center justify-center gap-1 w-20">
        <Award className="h-3 w-3 text-yellow-500" />
        <span className="font-semibold text-sm">{team.placementPoints}</span>
      </div>

      {/* Elims/Kills */}
      <div className="flex items-center justify-center w-16">
        <span className="font-semibold text-sm">{team.totalKills}</span>
      </div>

      {/* Total Points */}
      <div className="flex items-center justify-center w-20">
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
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
            <div className="text-center w-12">Rank</div>
            <div className="min-w-0">Team</div>
            <div className="text-center w-16">Matches</div>
            <div className="text-center flex items-center justify-center gap-1 w-16">
              <Drumstick className="h-3 w-3" />
            </div>
            <div className="text-center flex items-center justify-center gap-1 w-20">
              <Award className="h-3 w-3" />
              <span className="hidden sm:inline">Place</span>
            </div>
            <div className="text-center w-16">Elims</div>
            <div className="text-center w-20">Total</div>
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
          <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
            <div className="text-center w-12">Rank</div>
            <div className="min-w-0">Team</div>
            <div className="text-center w-16">Matches</div>
            <div className="text-center flex items-center justify-center gap-1 w-16">
              <Drumstick className="h-3 w-3" />
            </div>
            <div className="text-center flex items-center justify-center gap-1 w-20">
              <Award className="h-3 w-3" />
              <span className="hidden sm:inline">Place</span>
            </div>
            <div className="text-center w-16">Elims</div>
            <div className="text-center w-20">Total</div>
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
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-4 py-3 bg-primary text-primary-foreground font-bold text-xs uppercase">
          <div className="text-center w-8">R</div>
          <div className="min-w-0">Team</div>
          <div className="text-center w-12">M</div>
          <div className="text-center flex items-center justify-center w-10">
            <Drumstick className="h-3 w-3" />
          </div>
          <div className="text-center flex items-center justify-center gap-1 w-12">
            <Award className="h-3 w-3" />
          </div>
          <div className="text-center w-12">E</div>
          <div className="text-center w-14">Pts</div>
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
