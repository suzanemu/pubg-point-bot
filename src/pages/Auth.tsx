import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      toast.error("Please enter an access code");
      return;
    }

    setLoading(true);

    try {
      // Sign in anonymously first
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) {
        toast.error("Authentication failed");
        return;
      }

      if (!authData.user) {
        toast.error("Authentication failed");
        return;
      }

      // Validate access code using secure server-side function
      const { data: codeData, error: codeError } = await supabase
        .rpc("validate_access_code", { input_code: accessCode.trim().toUpperCase() })
        .single();

      if (codeError || !codeData) {
        await supabase.auth.signOut();
        toast.error("Invalid access code");
        return;
      }

      // Create session
      const { error: sessionError } = await supabase
        .from("sessions")
        .insert({
          user_id: authData.user.id,
          code_used: accessCode.trim().toUpperCase(),
          role: codeData.role,
          team_id: codeData.team_id,
        });

      if (sessionError) {
        await supabase.auth.signOut();
        toast.error("Failed to create session");
        return;
      }

      toast.success(`Welcome ${codeData.role}!`);
      navigate("/");
    } catch (error) {
      console.error("Access code error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 border-primary/30">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            PUBG MOBILE
          </h1>
          <p className="text-muted-foreground">Esports Point Tracker</p>
        </div>

        <form onSubmit={handleAccessCode} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="access-code">Access Code</Label>
            <Input
              id="access-code"
              type="text"
              placeholder="Enter your access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              required
              className="bg-input border-border uppercase text-center text-lg tracking-widest"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the access code provided by your admin
            </p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary hover:shadow-glow"
          >
            {loading ? "Validating..." : "Enter"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
