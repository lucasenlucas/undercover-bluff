import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createGame = async () => {
    if (!name.trim()) {
      toast({
        title: "Vul je naam in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const code = generateCode();
      const hostId = crypto.randomUUID();

      const { data, error } = await supabase
        .from("games")
        .insert({
          code,
          host_id: hostId,
          status: "lobby",
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/lobby?code=${code}&name=${encodeURIComponent(name)}&host=true`);
    } catch (error) {
      console.error("Error creating game:", error);
      toast({
        title: "Kon geen game maken",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async () => {
    if (!name.trim() || !joinCode.trim()) {
      toast({
        title: "Vul je naam en game code in",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("code", joinCode.toUpperCase())
        .single();

      if (error || !data) {
        toast({
          title: "Game niet gevonden",
          description: "Controleer de code en probeer opnieuw",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data.status !== "lobby") {
        toast({
          title: "Game al gestart",
          description: "Je kunt niet meer joinen",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      navigate(
        `/lobby?code=${joinCode.toUpperCase()}&name=${encodeURIComponent(name)}&host=false`
      );
    } catch (error) {
      console.error("Error joining game:", error);
      toast({
        title: "Kon niet joinen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <Card className="w-full max-w-md p-8 space-y-8 relative z-10 animate-float-slow shadow-2xl border-primary/20">
        <div className="text-center space-y-4">
          <div className="animate-float">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-3">
              Undercover Talk
            </h1>
          </div>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Wie is de imposter? 😈🤔
          </p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Je naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg transition-all duration-300 focus:scale-105 focus:shadow-lg"
            disabled={loading}
          />

          <Button
            onClick={createGame}
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-105 transition-all duration-300"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Maken...
              </>
            ) : (
              "Maak Nieuw Spel"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Of</span>
            </div>
          </div>

          <Input
            placeholder="Game Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            className="text-lg text-center font-mono transition-all duration-300 focus:scale-105 focus:shadow-lg"
            disabled={loading}
            maxLength={6}
          />

          <Button
            onClick={joinGame}
            disabled={loading}
            variant="secondary"
            className="w-full hover:shadow-xl hover:scale-105 transition-all duration-300"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joinen...
              </>
            ) : (
              "Join Spel"
            )}
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>🎯 Minimaal 3 spelers nodig</p>
          <p>😈 2 imposters per game</p>
        </div>
      </Card>
    </div>
  );
};

export default Index;
