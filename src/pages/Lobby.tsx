import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Users, Crown } from "lucide-react";

interface Player {
  id: string;
  name: string;
  is_connected: boolean;
}

interface Game {
  id: string;
  code: string;
  host_id: string;
  status: string;
}

const Lobby = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const gameCode = searchParams.get("code");
  const playerName = searchParams.get("name");
  const isHost = searchParams.get("host") === "true";

  useEffect(() => {
    if (!gameCode || !playerName) {
      navigate("/");
      return;
    }

    initializeLobby();
  }, [gameCode, playerName]);

  const initializeLobby = async () => {
    try {
      // Get game
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("code", gameCode)
        .single();

      if (gameError || !gameData) {
        toast({
          title: "Game niet gevonden",
          description: "Deze game bestaat niet meer.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setGame(gameData);

      // Add player if not already in game
      const { data: existingPlayers } = await supabase
        .from("players")
        .select("*")
        .eq("game_id", gameData.id)
        .eq("name", playerName);

      let playerId = "";

      if (!existingPlayers || existingPlayers.length === 0) {
        const { data: newPlayer, error: playerError } = await supabase
          .from("players")
          .insert({
            game_id: gameData.id,
            name: playerName,
          })
          .select()
          .single();

        if (playerError || !newPlayer) {
          toast({
            title: "Kon niet joinen",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        playerId = newPlayer.id;
      } else {
        playerId = existingPlayers[0].id;
      }

      setCurrentPlayerId(playerId);
      loadPlayers(gameData.id);
      subscribeToChanges(gameData.id);
      setLoading(false);
    } catch (error) {
      console.error("Error initializing lobby:", error);
      navigate("/");
    }
  };

  const loadPlayers = async (gameId: string) => {
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", gameId)
      .order("created_at", { ascending: true });

    if (data) {
      setPlayers(data);
    }
  };

  const subscribeToChanges = (gameId: string) => {
    // Subscribe to game changes
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status === "playing") {
            navigate(`/game?code=${gameCode}&name=${playerName}`);
          }
        }
      )
      .subscribe();

    // Subscribe to player changes
    const playersChannel = supabase
      .channel(`players-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          loadPlayers(gameId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gameChannel);
      supabase.removeChannel(playersChannel);
    };
  };

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode || "");
    toast({
      title: "Code gekopieerd!",
      description: "Deel de code met je vrienden",
    });
  };

  const startGame = async () => {
    if (!game || players.length < 3) {
      toast({
        title: "Te weinig spelers",
        description: "Je hebt minimaal 3 spelers nodig om te starten",
        variant: "destructive",
      });
      return;
    }

    setStarting(true);

    try {
      // Get random topic and item
      const { data: allTopics } = await supabase.from("game_data").select("*");

      if (!allTopics || allTopics.length === 0) {
        throw new Error("No game data found");
      }

      const randomTopic = allTopics[Math.floor(Math.random() * allTopics.length)];
      const randomItem = randomTopic.items[Math.floor(Math.random() * randomTopic.items.length)];

      // Select imposters based on player count (1 for 3 players, 2 for 4+)
      const imposterCount = players.length === 3 ? 1 : 2;
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      const imposterIds = shuffledPlayers.slice(0, imposterCount).map((p) => p.id);

      // Update game
      await supabase
        .from("games")
        .update({
          status: "playing",
          topic: randomTopic.topic,
          item: randomItem,
          imposters: imposterIds,
        })
        .eq("id", game.id);
    } catch (error) {
      console.error("Error starting game:", error);
      toast({
        title: "Fout bij starten",
        variant: "destructive",
      });
      setStarting(false);
    }
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
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-foreground">The Imposter Challenge</h1>
          <div className="flex items-center justify-center gap-2 p-4 bg-primary/10 rounded-lg">
            <p className="text-3xl font-mono text-primary font-bold">{gameCode}</p>
            <Button variant="ghost" size="sm" onClick={copyCode}>
              <Copy className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Spelers ({players.length})</span>
          </div>

          {players.map((player) => (
            <Card
              key={player.id}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    player.is_connected ? "bg-secondary" : "bg-muted"
                  }`}
                />
                <span className="text-foreground font-medium">{player.name}</span>
              </div>
              {game?.host_id === player.id && (
                <Crown className="h-5 w-5 text-primary" />
              )}
            </Card>
          ))}
        </div>

        {players.length < 3 && (
          <p className="text-sm text-center text-muted-foreground">
            Wacht op meer spelers... (minimaal 3 nodig)
          </p>
        )}

        {isHost && (
          <Button
            onClick={startGame}
            disabled={players.length < 3 || starting}
            className="w-full"
            size="lg"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Starten...
              </>
            ) : (
              "Start Game 🚀"
            )}
          </Button>
        )}

        {!isHost && (
          <p className="text-center text-muted-foreground text-sm">
            Wachten tot de host het spel start...
          </p>
        )}
      </Card>
    </div>
  );
};

export default Lobby;
