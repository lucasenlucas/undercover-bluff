import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, User } from "lucide-react";
import RoundTransition from "@/components/RoundTransition";

interface Game {
  id: string;
  code: string;
  host_id: string;
  topic: string;
  item: string;
  imposters: any;
  current_round: number;
}

interface Player {
  id: string;
  name: string;
}

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingNewRound, setStartingNewRound] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  const gameCode = searchParams.get("code");
  const playerName = searchParams.get("name");
  const isHost = searchParams.get("host") === "true";

  useEffect(() => {
    if (!gameCode) {
      navigate("/");
      return;
    }

    loadResults();
  }, [gameCode]);

  useEffect(() => {
    if (!game) return;

    // Subscribe to game changes for non-host players
    const channel = supabase
      .channel(`game-results-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload: any) => {
          if (payload.new.status === "playing") {
            setShowTransition(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game]);

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

  const startNewRound = async () => {
    if (!game) return;

    setStartingNewRound(true);

    try {
      // Get random topic and item
      const { data: allTopics } = await supabase.from("game_data").select("*");

      if (!allTopics || allTopics.length === 0) {
        throw new Error("No game data found");
      }

      const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
      const randomItem = randomTopic.items[Math.floor(Math.random() * randomTopic.items.length)];

      // Select imposters based on player count
      const imposterCount = players.length === 3 ? 1 : 2;
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      const imposterIds = shuffledPlayers.slice(0, imposterCount).map((p) => p.id);

      // Update game with new round
      await supabase
        .from("games")
        .update({
          status: "playing",
          topic: randomTopic.topic,
          item: randomItem,
          imposters: imposterIds,
          current_round: game.current_round + 1,
        })
        .eq("id", game.id);

      // Show transition
      setShowTransition(true);
    } catch (error) {
      console.error("Error starting new round:", error);
      toast({
        title: "Fout bij starten",
        variant: "destructive",
      });
      setStartingNewRound(false);
    }
  };

  const closeGame = async () => {
    if (!game) return;

    try {
      await supabase
        .from("games")
        .delete()
        .eq("id", game.id);

      toast({
        title: "Spel gesloten",
        description: "Het spel is succesvol beëindigd",
      });

      navigate("/");
    } catch (error) {
      console.error("Error closing game:", error);
      toast({
        title: "Fout",
        description: "Kon spel niet sluiten",
        variant: "destructive",
      });
    }
  };

  const handleTransitionComplete = () => {
    navigate(`/game?code=${gameCode}&name=${playerName}&host=${isHost}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showTransition && game) {
    return (
      <RoundTransition 
        round={game.current_round + 1} 
        onComplete={handleTransitionComplete} 
      />
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

        <div className="space-y-3">
          {isHost && (
            <>
              <Button 
                onClick={startNewRound} 
                disabled={startingNewRound}
                className="w-full" 
                size="lg"
              >
                {startingNewRound ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Voorbereiden...
                  </>
                ) : (
                  "Nieuwe Ronde 🔄"
                )}
              </Button>
              <Button 
                onClick={closeGame} 
                variant="destructive" 
                className="w-full" 
                size="lg"
              >
                Spel Sluiten
              </Button>
            </>
          )}
          {!isHost && (
            <Button onClick={() => navigate("/")} className="w-full" size="lg">
              Nieuw Spel 🎮
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Results;
