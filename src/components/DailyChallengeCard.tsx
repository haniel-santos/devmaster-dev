import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: string;
}

interface DailyChallengeCardProps {
  userId: string;
}

export const DailyChallengeCard = ({ userId }: DailyChallengeCardProps) => {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        // Busca o ID do desafio do dia usando a função do banco
        const { data: challengeId, error: funcError } = await supabase
          .rpc('get_or_create_daily_challenge');

        if (funcError) {
          console.error("Error getting daily challenge:", funcError);
          setLoading(false);
          return;
        }

        if (challengeId) {
          // Busca os detalhes do desafio
          const { data: challengeData } = await supabase
            .from("challenges")
            .select("id, title, description, difficulty")
            .eq("id", challengeId)
            .maybeSingle();

          if (challengeData) {
            setChallenge(challengeData);
          }

          // Verifica se o usuário já completou o desafio hoje
          const today = new Date().toISOString().split('T')[0];
          const { data: progress } = await supabase
            .from("user_daily_progress")
            .select("completed")
            .eq("user_id", userId)
            .eq("challenge_date", today)
            .maybeSingle();

          if (progress?.completed) {
            setCompleted(true);
          }
        }
      } catch (error) {
        console.error("Error fetching daily challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDailyChallenge();
    }
  }, [userId]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermediário";
      case "advanced":
        return "Avançado";
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20 animate-pulse">
        <div className="h-20"></div>
      </Card>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <Card className={`p-4 ${completed ? 'bg-green-500/10 border-green-500/30' : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-amber-500" />
          <span className="font-semibold text-foreground">Desafio do Dia</span>
        </div>
        <div className="flex items-center gap-2">
          {completed ? (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Completo
            </Badge>
          ) : (
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
              <Zap className="h-3 w-3 mr-1" />
              +1 Energia
            </Badge>
          )}
        </div>
      </div>

      <h3 className="font-medium text-foreground mb-1">{challenge.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {challenge.description}
      </p>

      <div className="flex items-center justify-between">
        <Badge variant="outline" className={getDifficultyColor(challenge.difficulty || "beginner")}>
          {getDifficultyLabel(challenge.difficulty || "beginner")}
        </Badge>
        
        {!completed && (
          <Button 
            size="sm" 
            onClick={() => navigate(`/challenges?daily=${challenge.id}`)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Clock className="h-4 w-4 mr-1" />
            Jogar Agora
          </Button>
        )}
      </div>
    </Card>
  );
};
