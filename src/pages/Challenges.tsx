import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EnergyBar } from "@/components/EnergyBar";
import { ArrowLeft, Play, CheckCircle2, XCircle } from "lucide-react";
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
  const [energy, setEnergy] = useState<UserEnergy>({ current_energy: 7, max_energy: 7 });
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Load challenges
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

      // Load energy
      const { data: energyData } = await supabase
        .from("user_energy")
        .select("current_energy, max_energy")
        .eq("user_id", session.user.id)
        .single();

      if (energyData) {
        setEnergy(energyData);
      }
    };

    loadData();
  }, [navigate]);

  const runCode = async () => {
    if (!selectedChallenge || energy.current_energy <= 0) {
      toast.error("Sua energia acabou! Volte mais tarde.");
      return;
    }

    setIsRunning(true);

    try {
      // Consume energy
      const newEnergy = energy.current_energy - 1;
      await supabase
        .from("user_energy")
        .update({ current_energy: newEnergy })
        .eq("user_id", userId);

      setEnergy({ ...energy, current_energy: newEnergy });

      // Run the code
      const testFunction = new Function(code + "\n" + selectedChallenge.test_code);
      testFunction();

      // Success! Give back energy
      const restoredEnergy = Math.min(newEnergy + 1, energy.max_energy);
      await supabase
        .from("user_energy")
        .update({ current_energy: restoredEnergy })
        .eq("user_id", userId);

      setEnergy({ ...energy, current_energy: restoredEnergy });

      // Update progress
      const { data: existingProgress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", selectedChallenge.id)
        .single();

      if (existingProgress) {
        await supabase
          .from("user_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            attempts: existingProgress.attempts + 1,
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

      toast.success("Parabéns! Você acertou! 🎉", {
        icon: <CheckCircle2 className="w-5 h-5 text-success" />,
      });
    } catch (error: any) {
      toast.error(error.message || "Código incorreto. Tente novamente!", {
        icon: <XCircle className="w-5 h-5 text-destructive" />,
      });

      // Update attempts even if wrong
      const { data: existingProgress } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("challenge_id", selectedChallenge.id)
        .single();

      if (existingProgress) {
        await supabase
          .from("user_progress")
          .update({ attempts: existingProgress.attempts + 1 })
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
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <EnergyBar 
            currentEnergy={energy.current_energy} 
            maxEnergy={energy.max_energy}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenges List */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">Desafios</h2>
            {challenges.map((challenge) => (
              <Card
                key={challenge.id}
                className={`cursor-pointer transition-all ${
                  selectedChallenge?.id === challenge.id
                    ? "border-2 border-primary shadow-card-lg"
                    : "hover:shadow-card"
                }`}
                onClick={() => {
                  setSelectedChallenge(challenge);
                  setCode(challenge.template_code || "");
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Challenge Details and Editor */}
          {selectedChallenge && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedChallenge.title}</CardTitle>
                  <CardDescription>{selectedChallenge.description}</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Editor de Código</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-sm min-h-[300px]"
                    placeholder="Escreva seu código aqui..."
                  />
                  <Button
                    onClick={runCode}
                    disabled={isRunning || energy.current_energy <= 0}
                    className="w-full"
                  >
                    {isRunning ? (
                      "Executando..."
                    ) : energy.current_energy <= 0 ? (
                      "Sem energia!"
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Rodar Código
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
