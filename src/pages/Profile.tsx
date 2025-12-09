import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { EnergyBar } from "@/components/EnergyBar";

interface Profile {
  name: string;
  level: number;
  points: number;
}

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEnergy, setUserEnergy] = useState<UserEnergy | null>(null);
  const [email, setEmail] = useState("");
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, level, points")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Buscar conquistas
      const { data: allAchievements } = await supabase
        .from("achievements")
        .select("*");

      if (allAchievements) {
        setAchievements(allAchievements);
      }

      const { data: userAchievementsData } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", session.user.id);

      if (userAchievementsData) {
        setUnlockedAchievements(new Set(userAchievementsData.map(ua => ua.achievement_id)));
      }

      const { data: energyData } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energyData) {
        setUserEnergy(energyData);
      }

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", session.user.id);

      const { data: challengesData } = await supabase
        .from("challenges_public")
        .select("id");

      if (progressData && challengesData) {
        const completed = progressData.filter(p => p.completed).length;
        setCompletedChallenges(completed);
        setTotalChallenges(challengesData.length);
      }
    };

    fetchData();
  }, [navigate]);

  if (!profile || !userEnergy) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const progressPercentage = totalChallenges > 0 
    ? (completedChallenges / totalChallenges) * 100 
    : 0;

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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <EnergyBar
            currentEnergy={userEnergy.current_energy}
            maxEnergy={userEnergy.max_energy}
            className="mb-6"
          />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card className="p-6 bg-card">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Nível
              </h3>
              <p className="text-3xl font-bold text-primary">{profile.level}</p>
            </Card>
            <Card className="p-6 bg-card">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Pontos (XP)
              </h3>
              <p className="text-3xl font-bold text-accent">{profile.points || 0}</p>
            </Card>
            <Card className="p-6 bg-card">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Desafios Completos
              </h3>
              <p className="text-3xl font-bold text-success">
                {completedChallenges}
              </p>
            </Card>
            <Card className="p-6 bg-card">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                Energia Atual
              </h3>
              <p className="text-3xl font-bold text-warning">
                {userEnergy.current_energy}/
                {userEnergy.max_energy}
              </p>
            </Card>
          </div>

          <Card className="p-6 bg-card mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Progresso Geral
            </h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Desafios completos</span>
              <span className="font-semibold">{completedChallenges}/{totalChallenges}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </Card>

          {/* Conquistas */}
          <Card className="p-6 bg-card">
            <h3 className="text-lg font-bold text-foreground mb-4">
              Conquistas
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {achievements.map((achievement) => {
                const isUnlocked = unlockedAchievements.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isUnlocked
                        ? "bg-success/10 border-success"
                        : "bg-muted/50 border-border opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">
                          {achievement.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                      {isUnlocked && (
                        <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
