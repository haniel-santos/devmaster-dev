import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { EnergyBar } from "@/components/EnergyBar";
import { EnergyDepletedModal } from "@/components/EnergyDepletedModal";
import { AchievementNotification } from "@/components/AchievementNotification";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  template_code: string;
  test_code: string;
}

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [userEnergy, setUserEnergy] = useState<UserEnergy | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .order("order_index");

      if (challengesData) {
        setChallenges(challengesData);
        if (challengesData.length > 0) {
          setSelectedChallenge(challengesData[0]);
          setCode(challengesData[0].template_code || "");
        }
      }

      const { data: energyData } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energyData) {
        setUserEnergy(energyData);
      }
    };

    fetchData();
  }, [navigate]);

  const checkAchievements = async (challengeCompleted: boolean, attempts: number) => {
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("level, points")
      .eq("id", userId)
      .single();

    const { data: progress } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    const completedCount = progress?.filter(p => p.completed).length || 0;
    const totalAttempts = progress?.reduce((sum, p) => sum + (p.attempts || 0), 0) || 0;

    const { data: allAchievements } = await supabase
      .from("achievements")
      .select("*");

    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

    for (const achievement of allAchievements || []) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      if (achievement.requirement_type === "challenges_completed" && completedCount >= achievement.requirement_value) {
        shouldUnlock = true;
      } else if (achievement.requirement_type === "total_attempts" && totalAttempts >= achievement.requirement_value) {
        shouldUnlock = true;
      } else if (achievement.requirement_type === "level_reached" && (profile?.level || 1) >= achievement.requirement_value) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        await supabase.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievement.id,
        });
        setUnlockedAchievement(achievement);
      }
    }
  };

  const runCode = async () => {
    if (!selectedChallenge || !userId) return;

    if (!userEnergy || userEnergy.current_energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    setIsRunning(true);

    try {
      // Consumir energia
      await supabase
        .from("user_energy")
        .update({ current_energy: userEnergy.current_energy - 1 })
        .eq("user_id", userId);

      setUserEnergy({ ...userEnergy, current_energy: userEnergy.current_energy - 1 });

      // Executar o código
      const testFunc = new Function(code + "\n" + selectedChallenge.test_code);
      const result = testFunc();

      if (result === true) {
        // Restaurar energia ao completar desafio
        await supabase
          .from("user_energy")
          .update({ 
            current_energy: Math.min(userEnergy.current_energy, userEnergy.max_energy) 
          })
          .eq("user_id", userId);

        setUserEnergy({ 
          ...userEnergy, 
          current_energy: Math.min(userEnergy.current_energy, userEnergy.max_energy) 
        });

        // Adicionar pontos (+25 por desafio completo)
        const { data: profile } = await supabase
          .from("profiles")
          .select("points")
          .eq("id", userId)
          .single();

        const newPoints = (profile?.points || 0) + 25;

        await supabase
          .from("profiles")
          .update({ points: newPoints })
          .eq("id", userId);

        // Marcar progresso como completo
        const { data: existingProgress } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("challenge_id", selectedChallenge.id)
          .maybeSingle();

        if (existingProgress) {
          await supabase
            .from("user_progress")
            .update({
              completed: true,
              completed_at: new Date().toISOString(),
            })
            .eq("id", existingProgress.id);
        } else {
          await supabase
            .from("user_progress")
            .insert({
              user_id: userId,
              challenge_id: selectedChallenge.id,
              completed: true,
              completed_at: new Date().toISOString(),
              attempts: 1,
            });
        }

        toast.success("Desafio concluído!", {
          description: "Você ganhou +25 XP e +1 energia!",
        });

        await checkAchievements(true, 1);
      } else {
        throw new Error("Teste falhou");
      }
    } catch (error: any) {
      // Deduzir pontos por erro (-5)
      const { data: profile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", userId)
        .single();

      const newPoints = Math.max(0, (profile?.points || 0) - 5);

      await supabase
        .from("profiles")
        .update({ points: newPoints })
        .eq("id", userId);

      toast.error("Código incorreto", {
        description: error.message || "Você perdeu 5 XP. Tente novamente!",
      });
    } finally {
      // Incrementar tentativas
      const { data: existingProgress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", selectedChallenge.id)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from("user_progress")
          .update({
            attempts: (existingProgress.attempts || 0) + 1,
          })
          .eq("id", existingProgress.id);
      } else {
        await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            challenge_id: selectedChallenge.id,
            attempts: 1,
          });
      }
      
      await checkAchievements(false, 1);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <AchievementNotification
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />
      <EnergyDepletedModal open={showEnergyModal} onOpenChange={setShowEnergyModal} />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {userEnergy && (
            <EnergyBar
              currentEnergy={userEnergy.current_energy}
              maxEnergy={userEnergy.max_energy}
            />
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground mb-4">Desafios</h2>
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedChallenge?.id === challenge.id
                    ? "border-2 border-primary bg-primary/5"
                    : "hover:shadow-lg"
                }`}
                onClick={() => {
                  setSelectedChallenge(challenge);
                  setCode(challenge.template_code || "");
                }}
              >
                <h3 className="font-semibold text-foreground">{challenge.title}</h3>
              </Card>
            ))}
          </div>

          {selectedChallenge && (
            <div className="space-y-4">
              <Card className="p-6 bg-card">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {selectedChallenge.title}
                </h2>
                <p className="text-muted-foreground">
                  {selectedChallenge.description}
                </p>
              </Card>

              <Card className="p-6 bg-card">
                <h3 className="font-semibold mb-3 text-foreground">
                  Editor de Código
                </h3>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-sm min-h-[400px] bg-muted/50 mb-4"
                  placeholder="Escreva seu código aqui..."
                />
                <Button
                  onClick={runCode}
                  disabled={isRunning || !userEnergy || userEnergy.current_energy <= 0}
                  className="w-full"
                >
                  {isRunning
                    ? "Executando..."
                    : !userEnergy || userEnergy.current_energy <= 0
                    ? "Sem energia!"
                    : "Executar Código"}
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
