import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface Game {
  id: string;
  code: string;
  host_id: string;
  status: string;
  topic: string;
  item: string;
  imposters: any;
}

interface Player {
  id: string;
  name: string;
}

const Game = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isImposter, setIsImposter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const gameCode = searchParams.get("code");
  const playerName = searchParams.get("name");
  const isHost = searchParams.get("host") === "true";

  useEffect(() => {
    if (!gameCode || !playerName) {
      navigate("/");
      return;
    }

    loadGame();
  }, [gameCode, playerName]);

  const loadGame = async () => {
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

      const { data: playerData } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id)
        .eq("name", playerName)
        .single();

      if (!playerData) {
        navigate("/");
        return;
      }

      setGame(gameData);
      setCurrentPlayer(playerData);
      const impostersList = Array.isArray(gameData.imposters) ? gameData.imposters : [];
      setIsImposter(impostersList.includes(playerData.id));
      setLoading(false);

      subscribeToGameChanges(gameData.id);
    } catch (error) {
      console.error("Error loading game:", error);
      navigate("/");
    }
  };

  const subscribeToGameChanges = (gameId: string) => {
    const channel = supabase
      .channel(`game-updates-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload: any) => {
          if (payload.new.status === "finished") {
            navigate(`/results?code=${gameCode}&name=${playerName}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const endGame = async () => {
    if (!game) return;

    await supabase
      .from("games")
      .update({ status: "finished" })
      .eq("id", game.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-lg border">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {currentPlayer?.name}
          </h1>

          {isImposter ? (
            <div className="space-y-4">
              <div className="p-6 bg-imposter/10 border-2 border-imposter rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Je bent een</p>
                <h2 className="text-4xl font-bold text-imposter mb-4">
                  😈 IMPOSTER
                </h2>
                <div className="space-y-2 bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Je weet alleen:</p>
                  <p className="text-2xl font-bold text-foreground">
                    {game?.topic}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Je kent NIET het specifieke item. Probeer niet op te vallen!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 bg-regular/10 border-2 border-regular rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Je bent een</p>
                <h2 className="text-4xl font-bold text-regular mb-4">
                  🎯 SPELER
                </h2>
                <div className="space-y-2 bg-background/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Jouw item:</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setRevealed(!revealed)}
                  >
                    {revealed ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        <span className="font-bold text-xl">{game?.item}</span>
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Klik om te zien
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Probeer de imposters te vinden zonder het item te verklappen!
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Bespreek in het echt wie de imposters zijn!
          </p>

          {isHost && (
            <Button onClick={endGame} variant="destructive" className="w-full">
              Beëindig Game
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Game;
