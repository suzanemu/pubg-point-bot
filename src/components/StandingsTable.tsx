import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Team } from "@/types/tournament";
import { Trophy, Target, Crosshair } from "lucide-react";

interface StandingsTableProps {
  teams: Team[];
}

const StandingsTable = ({ teams }: StandingsTableProps) => {
  const sortedTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

  const getRankColor = (index: number) => {
    if (index === 0) return "text-accent font-bold";
    if (index === 1) return "text-primary font-bold";
    if (index === 2) return "text-muted-foreground font-semibold";
    return "text-foreground";
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-accent" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-primary" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-muted-foreground" />;
    return null;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-semibold">Rank</TableHead>
            <TableHead className="text-muted-foreground font-semibold">Team</TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-4 w-4" />
                Total
              </div>
            </TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-4 w-4" />
                Placement
              </div>
            </TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">
              <div className="flex items-center justify-center gap-1">
                <Crosshair className="h-4 w-4" />
                Kills
              </div>
            </TableHead>
            <TableHead className="text-center text-muted-foreground font-semibold">Matches</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((team, index) => (
            <TableRow
              key={team.id}
              className={`border-border ${
                index === 0 ? "bg-accent/10" : index === 1 ? "bg-primary/10" : "hover:bg-secondary/50"
              }`}
            >
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {getRankIcon(index)}
                  <span className={getRankColor(index)}>#{index + 1}</span>
                </div>
              </TableCell>
              <TableCell className={`font-semibold ${getRankColor(index)}`}>{team.name}</TableCell>
              <TableCell className={`text-center font-bold text-lg ${getRankColor(index)}`}>
                {team.totalPoints}
              </TableCell>
              <TableCell className="text-center text-muted-foreground">{team.placementPoints}</TableCell>
              <TableCell className="text-center text-muted-foreground">{team.killPoints}</TableCell>
              <TableCell className="text-center text-muted-foreground">{team.matches}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {sortedTeams.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No match results yet</div>
      )}
    </div>
  );
};

export default StandingsTable;
