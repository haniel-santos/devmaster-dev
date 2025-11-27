import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal } from "lucide-react";

interface RankingEntry {
  id: string;
  name: string;
  level: number;
  completedChallenges: number;
  currentEnergy: number;
}

const Ranking = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("user_id")
      .eq("completed", true);

    const challengeCounts = progressData?.reduce((acc, item) => {
      acc[item.user_id] = (acc[item.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, level");

    const { data: energyData } = await supabase
      .from("user_energy")
      .select("user_id, current_energy");

    const rankingsData: RankingEntry[] = profiles?.map((profile) => ({
      id: profile.id,
      name: profile.name,
      level: profile.level || 1,
      completedChallenges: challengeCounts?.[profile.id] || 0,
      currentEnergy: energyData?.find((e) => e.user_id === profile.id)?.current_energy || 0,
    })) || [];

    rankingsData.sort((a, b) => {
      if (b.completedChallenges !== a.completedChallenges) {
        return b.completedChallenges - a.completedChallenges;
      }
      return b.level - a.level;
    });

    setRankings(rankingsData);
  };

  const getMedalIcon = (position: number) => {
    if (position === 0) return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-500" />;
    if (position === 1) return <Medal className="w-6 h-6 text-gray-400 fill-gray-400" />;
    if (position === 2) return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
              <p className="text-sm text-muted-foreground">
                Veja os melhores jogadores
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {rankings.map((entry, index) => (
            <Card
              key={entry.id}
              className={`p-4 transition-all hover:shadow-lg ${
                index < 3 ? "border-primary/50 bg-primary/5" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {getMedalIcon(index) || (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{entry.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Nível {entry.level}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {entry.completedChallenges}
                  </p>
                  <p className="text-xs text-muted-foreground">Desafios</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-success">
                    {entry.currentEnergy}/7
                  </p>
                  <p className="text-xs text-muted-foreground">Energia</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Ranking;
