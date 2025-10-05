import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Standings from "./Standings";
import { Team } from "@/types/tournament";

interface PlayerDashboardProps {
  userId: string;
}

const PlayerDashboard = ({ userId }: PlayerDashboardProps) => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [matchNumber, setMatchNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  useEffect(() => {
    fetchUserTeam();
    fetchTeams();
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
      .select("id, name, created_at")
      .eq("id", sessionData.team_id)
      .single();

    if (teamError) {
      console.error("Error fetching team details:", teamError);
      return;
    }

    setUserTeam({
      id: teamData.id,
      name: teamData.name,
      totalPoints: 0,
      totalKills: 0,
      matchesPlayed: 0,
    });
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name, created_at");

    if (error) {
      console.error("Error fetching teams:", error);
      return;
    }

    if (data) {
      const teamsData: Team[] = data.map((team) => ({
        id: team.id,
        name: team.name,
        totalPoints: 0,
        totalKills: 0,
        matchesPlayed: 0,
      }));
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
      
      // Refresh teams
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

        {/* Upload Card */}
        <Card className="p-6 border-primary/30">
          <h2 className="text-2xl font-bold mb-4">Upload Match Screenshot</h2>
          {userTeam && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">Your Team</p>
              <p className="font-semibold text-lg">{userTeam.name}</p>
            </div>
          )}
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
                  disabled={!userTeam || uploading || analyzing}
                  className="hidden"
                />
                <label
                  htmlFor="screenshot"
                  className="cursor-pointer flex flex-col items-center gap-2"
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
                        Click to upload screenshots (up to 4)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        AI will automatically extract placement and kills from each
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
