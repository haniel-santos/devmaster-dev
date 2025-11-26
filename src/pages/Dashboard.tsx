import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EnergyBar } from "@/components/EnergyBar";
import { Code2, Trophy, BookOpen, User, LogOut } from "lucide-react";
import { toast } from "sonner";

interface UserEnergy {
  current_energy: number;
  max_energy: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [energy, setEnergy] = useState<UserEnergy>({ current_energy: 7, max_energy: 7 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUserName(profile.name);
      }

      // Get user energy
      const { data: energyData } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energyData) {
        setEnergy(energyData);
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* Header with Energy */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Olá, {userName}! 👋</h1>
              <p className="text-muted-foreground">Pronto para aprender hoje?</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
          <EnergyBar 
            currentEnergy={energy.current_energy} 
            maxEnergy={energy.max_energy}
          />
        </div>

        {/* Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className="hover:shadow-card-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary"
            onClick={() => navigate("/challenges")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-success-gradient flex items-center justify-center">
                  <Code2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">Desafios</h3>
                  <p className="text-sm text-muted-foreground">
                    Resolva problemas e aprenda programando
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-card-lg transition-all cursor-pointer border-2 border-transparent hover:border-secondary"
            onClick={() => navigate("/learning-path")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">Trilha de Aprendizagem</h3>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe seu progresso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-card-lg transition-all cursor-pointer border-2 border-transparent hover:border-accent opacity-60"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">Ranking</h3>
                  <p className="text-sm text-muted-foreground">
                    Em breve...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="hover:shadow-card-lg transition-all cursor-pointer border-2 border-transparent hover:border-primary"
            onClick={() => navigate("/profile")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">Perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Veja suas estatísticas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
