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
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border">
        <div className="text-center space-y-3">
          <Trophy className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-4xl font-bold text-foreground">
            Challenge Complete!
          </h1>
        </div>

        <div className="space-y-4">
          <Card className="p-6 bg-primary/10 border-2 border-primary/30">
            <p className="text-sm text-muted-foreground mb-2">Onderwerp was:</p>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              {game?.topic}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">Item was:</p>
            <h3 className="text-2xl font-bold text-primary">{game?.item}</h3>
          </Card>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-imposter flex items-center gap-2">
              😈 Imposters
            </h3>
            {imposterPlayers.map((player) => (
              <Card
                key={player.id}
                className="p-3 bg-imposter/10 border border-imposter/50"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-imposter" />
                  <span className="font-medium text-foreground">
                    {player.name}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-bold text-regular flex items-center gap-2">
              🎯 Spelers
            </h3>
            {regularPlayers.map((player) => (
              <Card
                key={player.id}
                className="p-3 bg-regular/10 border border-regular/50"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-regular" />
                  <span className="font-medium text-foreground">
                    {player.name}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button onClick={() => navigate("/")} className="w-full" size="lg">
          Nieuw Spel 🎮
        </Button>
      </Card>
    </div>
  );
};

export default Results;
