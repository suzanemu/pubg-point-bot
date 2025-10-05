import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Trophy, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@/types/tournament";

interface TournamentManagerProps {
  onTournamentSelect?: (tournamentId: string | null) => void;
}

const TournamentManager = ({ onTournamentSelect }: TournamentManagerProps) => {
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [newTournament, setNewTournament] = useState({
    name: "",
    description: "",
    total_matches: 6,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

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
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTournament.name.trim()) {
      toast({
        title: "Error",
        description: "Tournament name is required",
        variant: "destructive",
      });
      return;
    }

    if (newTournament.total_matches < 1) {
      toast({
        title: "Error",
        description: "Total matches must be at least 1",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("tournaments").insert([
      {
        name: newTournament.name,
        description: newTournament.description,
        total_matches: newTournament.total_matches,
      },
    ]);

    if (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      setNewTournament({ name: "", description: "", total_matches: 6 });
      fetchTournaments();
    }

    setLoading(false);
  };

  const handleDeleteTournament = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This will delete all teams, access codes, and match data associated with this tournament.`)) {
      return;
    }

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId);

    if (error) {
      console.error("Error deleting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to delete tournament",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Tournament and all associated data deleted",
      });
      fetchTournaments();
      if (onTournamentSelect) {
        onTournamentSelect(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Create Tournament
          </CardTitle>
          <CardDescription>Set up a new tournament with match limits</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTournament} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tournament Name</label>
              <Input
                type="text"
                placeholder="Enter tournament name"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
              <Textarea
                placeholder="Enter tournament description"
                value={newTournament.description}
                onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Total Matches</label>
              <Input
                type="number"
                min="1"
                value={newTournament.total_matches}
                onChange={(e) => setNewTournament({ ...newTournament, total_matches: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Tournament"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Existing Tournaments</CardTitle>
          <CardDescription>Manage your tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No tournaments created yet
            </p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{tournament.name}</h3>
                    </div>
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {tournament.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {tournament.total_matches} matches
                      </span>
                      <span>
                        Created {new Date(tournament.created_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteTournament(tournament.id, tournament.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentManager;
