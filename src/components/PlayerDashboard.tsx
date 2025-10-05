import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, LogOut, Loader2, Trophy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Standings from "./Standings";
import { Team, Tournament } from "@/types/tournament";

interface PlayerDashboardProps {
  userId: string;
}

const PlayerDashboard = ({ userId }: PlayerDashboardProps) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matchNumber, setMatchNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadedMatches, setUploadedMatches] = useState<number>(0);

  useEffect(() => {
    fetchUserTeam();
  }, [userId]);

  useEffect(() => {
    if (userTeam?.tournament_id) {
      fetchTeams();
    }
  }, [userTeam?.tournament_id]);

  useEffect(() => {
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchUserTeam();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);

  const fetchUserTeam = async () => {
    // Get user's session to find their team
    const { data: sessionData, error: sessionError } = await supabase
      .from("sessions")
      .select("team_id")
      .eq("user_id", userId)
      .single();

    if (sessionError || !sessionData?.team_id) {
      console.error("Error fetching user team:", sessionError);
      return;
    }

    // Get team details
    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name, created_at, tournament_id")
      .eq("id", sessionData.team_id)
      .single();

    if (teamError) {
      console.error("Error fetching team details:", teamError);
      return;
    }

    // Fetch tournament info if team has one
    if (teamData.tournament_id) {
      const { data: tournamentData } = await supabase
        .from("tournaments")
        .select("*")
        .eq("id", teamData.tournament_id)
        .single();
      
      setTournament(tournamentData);
    }

    // Get team stats from match_screenshots
    const { data: matchData, error: matchError } = await supabase
      .from("match_screenshots")
      .select("placement, kills, points, match_number")
      .eq("team_id", sessionData.team_id);

    let totalPoints = 0;
    let totalKills = 0;
    let placementPoints = 0;
    let killPoints = 0;
    let matchesPlayed = 0;
    let firstPlaceWins = 0;

    if (matchData && !matchError) {
      matchesPlayed = matchData.length;
      setUploadedMatches(matchData.length);
      firstPlaceWins = matchData.filter((m) => m.placement === 1).length;
      
      matchData.forEach((match) => {
        totalKills += match.kills || 0;
        totalPoints += match.points || 0;
        
        // Calculate placement points (total - kills)
        const PLACEMENT_POINTS: Record<number, number> = {
          1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
          9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0,
          17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0,
          25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0,
        };
        placementPoints += PLACEMENT_POINTS[match.placement || 0] || 0;
      });
      killPoints = totalKills; // 1 point per kill
    }

    setUserTeam({
      id: teamData.id,
      name: teamData.name,
      totalPoints,
      placementPoints,
      killPoints,
      totalKills,
      matchesPlayed,
      firstPlaceWins,
      tournament_id: teamData.tournament_id,
    });
  };

  const fetchTeams = async () => {
    if (!userTeam?.tournament_id) return;

    const { data, error } = await supabase
      .from("teams")
      .select("id, name, created_at")
      .eq("tournament_id", userTeam.tournament_id);

    if (error) {
      console.error("Error fetching teams:", error);
      return;
    }

    if (data) {
      // Fetch all match data
      const { data: allMatches } = await supabase
        .from("match_screenshots")
        .select("team_id, placement, kills, points");

      const teamsData: Team[] = data.map((team) => {
        const teamMatches = allMatches?.filter((m) => m.team_id === team.id) || [];
        let totalPoints = 0;
        let totalKills = 0;
        let placementPoints = 0;
        const firstPlaceWins = teamMatches.filter((m) => m.placement === 1).length;

        teamMatches.forEach((match) => {
          totalKills += match.kills || 0;
          totalPoints += match.points || 0;
          
          // Calculate placement points
          const PLACEMENT_POINTS: Record<number, number> = {
            1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
            9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0,
            17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0,
            25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0,
          };
          placementPoints += PLACEMENT_POINTS[match.placement || 0] || 0;
        });

        return {
          id: team.id,
          name: team.name,
          totalPoints,
          placementPoints,
          killPoints: totalKills, // 1 point per kill
          totalKills,
          matchesPlayed: teamMatches.length,
          firstPlaceWins,
        };
      });
      setTeams(teamsData);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0 || !userTeam) {
      toast.error("Unable to identify your team");
      return;
    }

    // Check match limit
    if (tournament && uploadedMatches >= tournament.total_matches) {
      toast.error(`You have reached the maximum number of matches (${tournament.total_matches}) for this tournament`);
      return;
    }

    // Check if adding these files would exceed the limit
    if (tournament && (uploadedMatches + files.length) > tournament.total_matches) {
      const remaining = tournament.total_matches - uploadedMatches;
      toast.error(`You can only upload ${remaining} more screenshot${remaining > 1 ? 's' : ''} for this tournament`);
      return;
    }

    if (files.length > 4) {
      toast.error("You can only upload up to 4 screenshots at once");
      return;
    }

    // Check all files are images
    const invalidFiles = files.filter(file => !file.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error("Please upload only image files");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processing ${i + 1} of ${files.length}...`);

        try {
          // Upload to storage
          const fileExt = file.name.split(".").pop();
          const fileName = `${userId}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("match-screenshots")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("match-screenshots")
            .getPublicUrl(fileName);

          setAnalyzing(true);

          // Analyze screenshot with AI
          const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
            "analyze-screenshot",
            {
              body: { imageUrl: publicUrl },
            }
          );

          setAnalyzing(false);

          if (analysisError) {
            console.error("Analysis error:", analysisError);
            failCount++;
            continue;
          }

          const { placement, kills } = analysisData;

          if (placement === null || kills === null) {
            failCount++;
            continue;
          }

          // Calculate points based on PUBG Mobile scoring
          const PLACEMENT_POINTS: Record<number, number> = {
            1: 10, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 1,
            9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0,
            17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0,
            25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 32: 0,
          };
          const placementPoints = PLACEMENT_POINTS[placement] || 0;
          const points = placementPoints + kills;

          // Save to database
          const { error: dbError } = await supabase
            .from("match_screenshots")
            .insert({
              team_id: userTeam.id,
              player_id: userId,
              match_number: matchNumber + i,
              screenshot_url: publicUrl,
              placement,
              kills,
              points,
              analyzed_at: new Date().toISOString(),
            });

          if (dbError) {
            console.error("Database error:", dbError);
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error("Error processing file:", error);
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} screenshot${successCount > 1 ? 's' : ''}!`);
        setMatchNumber(matchNumber + successCount);
      }
      
      if (failCount > 0) {
        toast.error(`Failed to process ${failCount} screenshot${failCount > 1 ? 's' : ''}`);
      }
      
      // Reset form
      e.target.value = "";
      
      // Refresh data
      fetchUserTeam();
      fetchTeams();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload screenshots");
    } finally {
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress("");
    }
  };

  const canUploadMore = !tournament || uploadedMatches < tournament.total_matches;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Player Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Upload your match screenshots</p>
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

        {/* Tournament Info Card */}
        {tournament && (
          <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-glow" />
              Tournament Info
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{tournament.name}</h3>
                {tournament.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {tournament.description}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">{tournament.total_matches}</p>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/30">
                  <p className="text-sm text-muted-foreground">Uploaded</p>
                  <p className="text-2xl font-bold text-primary">{uploadedMatches}</p>
                </div>
              </div>
              {!canUploadMore && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You have uploaded all {tournament.total_matches} matches for this tournament.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        )}

        {/* Team Stats Card */}
        {userTeam && (
          <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary-glow" />
              Your Team Stats
            </h2>
            <div className="mb-4 p-3 bg-background/50 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Team Name</p>
              <p className="font-semibold text-xl">{userTeam.name}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Matches</p>
                <p className="text-2xl font-bold">{userTeam.matchesPlayed}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border border-yellow-500/30">
                <p className="text-sm text-muted-foreground mb-1">Place Points</p>
                <p className="text-2xl font-bold text-yellow-500">{userTeam.placementPoints}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border border-accent/30">
                <p className="text-sm text-muted-foreground mb-1">Kill Points</p>
                <p className="text-2xl font-bold text-accent">{userTeam.killPoints}</p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">Total Kills</p>
                <p className="text-2xl font-bold">{userTeam.totalKills}</p>
              </div>
              <div className="text-center p-4 bg-primary/20 rounded-lg border border-primary/50">
                <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                <p className="text-3xl font-bold text-primary-glow">{userTeam.totalPoints}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Card */}
        <Card className="p-6 border-primary/30">
          <h2 className="text-2xl font-bold mb-4">Upload Match Screenshot</h2>
          <div className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="matchNumber">Match Number</Label>
              <Input
                id="matchNumber"
                type="number"
                min="1"
                value={matchNumber}
                onChange={(e) => setMatchNumber(parseInt(e.target.value) || 1)}
                className="bg-input border-border max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot">Upload Screenshots (Max 4)</Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={!userTeam || uploading || analyzing || !canUploadMore}
                  className="hidden"
                />
                <label
                  htmlFor="screenshot"
                  className={`${!canUploadMore ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} flex flex-col items-center gap-2`}
                >
                  {uploading || analyzing ? (
                    <>
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-lg font-semibold">
                        {uploadProgress || (uploading ? "Uploading..." : "Analyzing with AI...")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Please wait while we process your screenshots
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-primary" />
                      <p className="text-lg font-semibold">
                        {canUploadMore 
                          ? "Click to upload screenshots (up to 4)"
                          : "Match limit reached"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {canUploadMore 
                          ? "AI will automatically extract placement and kills from each"
                          : "You have uploaded all allowed matches"}
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Standings */}
        {teams.length > 0 && <Standings teams={teams} />}
      </div>
    </div>
  );
};

export default PlayerDashboard;
