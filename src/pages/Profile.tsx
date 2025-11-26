import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EnergyBar } from "@/components/EnergyBar";
import { ArrowLeft, Trophy, Target, Zap } from "lucide-react";

interface Profile {
  name: string;
  level: number;
}

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ name: "", level: 1 });
  const [energy, setEnergy] = useState<UserEnergy>({ current_energy: 7, max_energy: 7 });
  const [email, setEmail] = useState("");
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, level")
        .eq("id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Load energy
      const { data: energyData } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energyData) {
        setEnergy(energyData);
      }

      // Load progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", session.user.id);

      const { data: challengesData } = await supabase
        .from("challenges")
        .select("id");

      if (progressData && challengesData) {
        const completed = progressData.filter(p => p.completed).length;
        setTotalCompleted(completed);
        setTotalChallenges(challengesData.length);
      }
    };

    loadData();
  }, [navigate]);

  const progressPercentage = totalChallenges > 0 
    ? (totalCompleted / totalChallenges) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="shadow-card-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-success-gradient flex items-center justify-center text-3xl font-bold text-white">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <EnergyBar 
              currentEnergy={energy.current_energy} 
              maxEnergy={energy.max_energy}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">Nível {profile.level}</p>
                      <p className="text-xs text-muted-foreground">Seu nível atual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <Target className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
                      <p className="text-xs text-muted-foreground">Desafios completos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{energy.current_energy}</p>
                      <p className="text-xs text-muted-foreground">Energia atual</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progresso Geral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Desafios completos</span>
                  <span className="font-semibold text-foreground">
                    {totalCompleted}/{totalChallenges}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
