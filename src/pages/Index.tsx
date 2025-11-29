import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Code2, Zap, Trophy, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10">
      <div className="container max-w-6xl mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-success-gradient flex items-center justify-center shadow-card-lg">
              <Code2 className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              Dev Master
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Aprenda programação de forma divertida e gamificada
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Começar Agora
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Já tenho conta
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="bg-card p-6 rounded-2xl shadow-card text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-xl bg-success-gradient flex items-center justify-center">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Desafios Práticos</h3>
              <p className="text-muted-foreground">
                Resolva problemas reais e aprenda fazendo
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-card text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-xl bg-energy-gradient flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Sistema de Energia</h3>
              <p className="text-muted-foreground">
                Torne o aprendizado um jogo divertido
              </p>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-card text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Trilha Guiada</h3>
              <p className="text-muted-foreground">
                Aprenda no seu ritmo com conteúdo estruturado
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
