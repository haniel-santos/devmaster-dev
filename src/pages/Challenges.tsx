import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Lightbulb, Calendar, Zap } from "lucide-react";
import { EnergyBar } from "@/components/EnergyBar";
import { EnergyDepletedModal } from "@/components/EnergyDepletedModal";
import { AchievementNotification } from "@/components/AchievementNotification";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  template_code: string;
  hints?: string[];
}

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dailyChallengeId = searchParams.get("daily");
  
  const [userId, setUserId] = useState<string>("");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("");
  const [userEnergy, setUserEnergy] = useState<UserEnergy | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<any>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [isDailyChallenge, setIsDailyChallenge] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Fetch challenges without test_code and solution (security)
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("id, title, description, template_code, hints, order_index")
        .order("order_index");

      if (challengesData) {
        setChallenges(challengesData);
        
        // Se vier com daily param, seleciona o desafio diário
        if (dailyChallengeId) {
          const dailyChallenge = challengesData.find(c => c.id === dailyChallengeId);
          if (dailyChallenge) {
            setSelectedChallenge(dailyChallenge);
            setCode(dailyChallenge.template_code || "");
            setIsDailyChallenge(true);
          }
        } else if (challengesData.length > 0) {
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
  }, [navigate, dailyChallengeId]);

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

      // Validate code on the server (secure)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke('validate-code', {
        body: {
          challengeId: selectedChallenge.id,
          userCode: code,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao validar código');
      }

      const { success, error: codeError } = response.data;

      if (success) {
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

        // Atualizar streak do usuário
        await supabase.rpc('update_user_streak', { p_user_id: userId });

        // Se for desafio diário, dar +1 energia extra
        if (isDailyChallenge && dailyChallengeId) {
          const today = new Date().toISOString().split('T')[0];
          
          // Verificar se já completou o desafio diário hoje
          const { data: dailyProgress } = await supabase
            .from("user_daily_progress")
            .select("completed")
            .eq("user_id", userId)
            .eq("challenge_date", today)
            .maybeSingle();

          if (!dailyProgress?.completed) {
            // Marcar como completo
            await supabase
              .from("user_daily_progress")
              .upsert({
                user_id: userId,
                challenge_date: today,
                completed: true,
                completed_at: new Date().toISOString(),
              });

            // Dar +1 energia bônus
            const { data: currentEnergy } = await supabase
              .from("user_energy")
              .select("current_energy, max_energy")
              .eq("user_id", userId)
              .single();

            if (currentEnergy) {
              const newEnergy = Math.min(currentEnergy.current_energy + 1, currentEnergy.max_energy);
              await supabase
                .from("user_energy")
                .update({ current_energy: newEnergy })
                .eq("user_id", userId);

              setUserEnergy({ ...currentEnergy, current_energy: newEnergy });

              toast.success("Desafio Diário Completo! 🎉", {
                description: "Você ganhou +25 XP e +1 energia bônus!",
              });
            }
          } else {
            toast.success("Desafio concluído!", {
              description: "Você ganhou +25 XP e +1 energia!",
            });
          }
        } else {
          toast.success("Desafio concluído!", {
            description: "Você ganhou +25 XP e +1 energia!",
          });
        }

        await checkAchievements(true, 1);
      } else {
        throw new Error(codeError || "Teste falhou");
      }
    } catch (error: unknown) {
      const err = error as Error;
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
        description: err.message || "Você perdeu 5 XP. Tente novamente!",
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

  const revealHint = async () => {
    if (!selectedChallenge || !userId || !selectedChallenge.hints) return;

    if (!userEnergy || userEnergy.current_energy <= 0) {
      setShowEnergyModal(true);
      return;
    }

    if (revealedHints >= selectedChallenge.hints.length) {
      toast.info("Não há mais dicas disponíveis!");
      return;
    }

    // Consumir energia
    await supabase
      .from("user_energy")
      .update({ current_energy: userEnergy.current_energy - 1 })
      .eq("user_id", userId);

    setUserEnergy({ ...userEnergy, current_energy: userEnergy.current_energy - 1 });
    setRevealedHints(revealedHints + 1);

    toast.success("Dica revelada!", {
      description: selectedChallenge.hints[revealedHints],
    });
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
                  setRevealedHints(0);
                  setIsDailyChallenge(challenge.id === dailyChallengeId);
                }}
              >
                <h3 className="font-semibold text-foreground">{challenge.title}</h3>
              </Card>
            ))}
          </div>

          {selectedChallenge && (
            <div className="space-y-4">
              <Card className="p-6 bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedChallenge.title}
                  </h2>
                  {isDailyChallenge && (
                    <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                      <Calendar className="h-3 w-3 mr-1" />
                      Desafio do Dia
                      <Zap className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">
                  {selectedChallenge.description}
                </p>
                
                {selectedChallenge.hints && selectedChallenge.hints.length > 0 && (
                  <div className="mt-4">
                    <Button
                      onClick={revealHint}
                      variant="outline"
                      size="sm"
                      disabled={!userEnergy || userEnergy.current_energy <= 0 || revealedHints >= selectedChallenge.hints.length}
                      className="mb-3"
                    >
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Ver Dica ({revealedHints}/{selectedChallenge.hints.length}) - 1 energia
                    </Button>
                    
                    {revealedHints > 0 && (
                      <div className="space-y-2">
                        {selectedChallenge.hints.slice(0, revealedHints).map((hint, index) => (
                          <div key={index} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                            <p className="text-sm text-foreground flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                              <span>{hint}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
