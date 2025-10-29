import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Trophy, User } from "lucide-react";

interface Game {
  id: string;
  code: string;
  topic: string;
  item: string;
  imposters: any;
}

interface Player {
  id: string;
  name: string;
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const gameCode = searchParams.get("code");

  useEffect(() => {
    if (!gameCode) {
      navigate("/");
      return;
    }

    loadResults();
  }, [gameCode]);

  const loadResults = async () => {
    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("code", gameCode)
        .single();

      if (gameError || !gameData) {
        navigate("/");
        return;
      }

      const { data: playersData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id);

      setGame(gameData);
      setPlayers(playersData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading results:", error);
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const impostersList = Array.isArray(game?.imposters) ? game.imposters : [];
  const imposterPlayers = players.filter((p) =>
    impostersList.includes(p.id)
  );
  const regularPlayers = players.filter(
    (p) => !impostersList.includes(p.id)
  );

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      <Card className="w-full max-w-md p-8 space-y-6 relative z-10 animate-float-slow shadow-2xl">
        <div className="text-center space-y-4">
          <Trophy className="h-20 w-20 text-primary mx-auto mb-4 animate-float" />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Game Over!
          </h1>
        </div>

        <div className="space-y-4">
          <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/10 border-2 border-primary/30 hover:scale-105 transition-all duration-300 shadow-xl animate-pulse-glow">
            <p className="text-sm text-muted-foreground mb-3">Onderwerp was:</p>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              {game?.topic}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">Item was:</p>
            <h3 className="text-3xl font-bold text-primary animate-float">{game?.item}</h3>
          </Card>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-imposter flex items-center gap-2 animate-float">
              😈 Imposters
            </h3>
            {imposterPlayers.map((player, index) => (
              <Card
                key={player.id}
                className="p-4 bg-gradient-to-r from-imposter/30 to-imposter/10 border-2 border-imposter/50 hover:scale-105 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-imposter" />
                  <span className="font-semibold text-foreground text-lg">
                    {player.name}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-regular flex items-center gap-2 animate-float">
              🎯 Spelers
            </h3>
            {regularPlayers.map((player, index) => (
              <Card
                key={player.id}
                className="p-4 bg-gradient-to-r from-regular/30 to-regular/10 border-2 border-regular/50 hover:scale-105 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-regular" />
                  <span className="font-semibold text-foreground text-lg">
                    {player.name}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button onClick={() => navigate("/")} className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg" size="lg">
          Nieuw Spel 🎮
        </Button>
      </Card>
    </div>
  );
};

export default Results;
