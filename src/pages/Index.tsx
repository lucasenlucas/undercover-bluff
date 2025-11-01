import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      
      <Card className="w-full max-w-md p-8 space-y-8 shadow-lg border">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-bold text-foreground">
            The Imposter Challenge
          </h1>
          <p className="text-muted-foreground">
            Wie is de imposter? 😈🤔
          </p>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Je naam"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-lg"
            disabled={loading}
          />

          <Button
            onClick={createGame}
            disabled={loading}
            className="w-full"
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
            className="text-lg text-center font-mono"
            disabled={loading}
            maxLength={6}
          />

          <Button
            onClick={joinGame}
            disabled={loading}
            variant="secondary"
            className="w-full"
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

      </Card>
    </div>
  );
};

export default Index;
