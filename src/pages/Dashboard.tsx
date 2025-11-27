import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Code, BookOpen, Trophy, User, Zap } from "lucide-react";
import { EnergyBar } from "@/components/EnergyBar";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [userLevel, setUserLevel] = useState(1);
  const [userEnergy, setUserEnergy] = useState<UserEnergy>({ current_energy: 7, max_energy: 7 });

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, level")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserName(profile.name);
        setUserLevel(profile.level || 1);
      }

      const { data: energy } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energy) {
        setUserEnergy(energy);
      }
    };

    getUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 mb-6 bg-card/80 backdrop-blur shadow-card">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Olá, {userName}!
            </h2>
            <p className="text-muted-foreground">Nível {userLevel} • Pronto para aprender hoje?</p>
          </div>

          <div className="mt-6">
            <EnergyBar
              currentEnergy={userEnergy.current_energy}
              maxEnergy={userEnergy.max_energy}
            />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Button
            onClick={() => navigate("/challenges")}
            className="h-32 text-lg"
            variant="default"
          >
            <Code className="mr-2 h-6 w-6" />
            Desafios
          </Button>
          
          <Button
            onClick={() => navigate("/learning-path")}
            className="h-32 text-lg"
            variant="default"
          >
            <BookOpen className="mr-2 h-6 w-6" />
            Trilha de Aprendizado
          </Button>
          
          <Button
            onClick={() => navigate("/practice")}
            className="h-32 text-lg"
            variant="outline"
          >
            <Code className="mr-2 h-6 w-6" />
            Modo Treino
          </Button>

          <Button
            onClick={() => navigate("/ranking")}
            className="h-32 text-lg"
            variant="outline"
          >
            <Trophy className="mr-2 h-6 w-6" />
            Ranking
          </Button>
          
          <Button
            onClick={() => navigate("/energy-shop")}
            className="h-32 text-lg"
            variant="outline"
          >
            <Zap className="mr-2 h-6 w-6" />
            Loja de Energia
          </Button>
          
          <Button
            onClick={() => navigate("/profile")}
            className="h-32 text-lg"
            variant="outline"
          >
            <User className="mr-2 h-6 w-6" />
            Perfil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
