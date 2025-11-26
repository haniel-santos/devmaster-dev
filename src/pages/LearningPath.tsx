import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  order_index: number;
}

interface UserProgress {
  challenge_id: string;
  completed: boolean;
}

const LearningPath = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load challenges
      const { data: challengesData } = await supabase
        .from("challenges")
        .select("*")
        .order("order_index");

      if (challengesData) {
        setChallenges(challengesData);
      }

      // Load user progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("challenge_id, completed")
        .eq("user_id", session.user.id);

      if (progressData) {
        setProgress(progressData);
        const completed = progressData.filter(p => p.completed).length;
        setTotalCompleted(completed);
      }
    };

    loadData();
  }, [navigate]);

  const isCompleted = (challengeId: string) => {
    return progress.some(p => p.challenge_id === challengeId && p.completed);
  };

  const isUnlocked = (orderIndex: number) => {
    if (orderIndex === 1) return true;
    const previousChallenge = challenges.find(c => c.order_index === orderIndex - 1);
    return previousChallenge ? isCompleted(previousChallenge.id) : false;
  };

  const progressPercentage = challenges.length > 0 
    ? (totalCompleted / challenges.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Trilha de Aprendizagem</CardTitle>
            <CardDescription>
              Complete os desafios na ordem para desbloquear os próximos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso Total</span>
                <span className="font-semibold text-foreground">
                  {totalCompleted}/{challenges.length} desafios
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {challenges.map((challenge) => {
            const completed = isCompleted(challenge.id);
            const unlocked = isUnlocked(challenge.order_index);

            return (
              <Card
                key={challenge.id}
                className={`transition-all ${
                  !unlocked ? "opacity-60" : "hover:shadow-card-lg"
                } ${completed ? "border-success border-2" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Desafio {challenge.order_index}
                        </span>
                        {completed && (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        )}
                        {!unlocked && (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-xl mt-1">{challenge.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {challenge.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate("/challenges")}
                    disabled={!unlocked}
                    variant={completed ? "outline" : "default"}
                  >
                    {completed ? "Revisar" : unlocked ? "Começar" : "Bloqueado"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LearningPath;
