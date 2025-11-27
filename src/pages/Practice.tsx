import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Code, Play } from "lucide-react";
import { toast } from "sonner";

const Practice = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('// Escreva seu código aqui\nfunction exemplo() {\n  console.log("Modo treino - teste à vontade!");\n}\n\nexemplo();');
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const runCode = () => {
    setIsRunning(true);
    setOutput("");

    try {
      // Capturar console.log
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(arg => String(arg)).join(" "));
      };

      // Executar código
      const func = new Function(code);
      const result = func();
      
      // Restaurar console.log
      console.log = originalLog;

      // Mostrar output
      const outputText = logs.length > 0 ? logs.join("\n") : (result !== undefined ? String(result) : "Código executado com sucesso!");
      setOutput(outputText);
      
      toast.success("Código executado!");
    } catch (error: any) {
      setOutput(`Erro: ${error.message}`);
      toast.error("Erro ao executar código");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-5xl mx-auto">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <Code className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Modo Treino</h1>
              <p className="text-sm text-muted-foreground">
                Pratique livremente sem gastar energia
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-muted-foreground">
              ⚠️ No modo treino: Não consome energia • Não ganha XP • Não desbloqueia conquistas
            </p>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6 bg-card">
            <h3 className="font-semibold mb-3 text-foreground">Editor</h3>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[400px] bg-muted/50"
              placeholder="Escreva seu código aqui..."
            />
            <Button
              onClick={runCode}
              disabled={isRunning}
              className="mt-4 w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {isRunning ? "Executando..." : "Executar Código"}
            </Button>
          </Card>

          <Card className="p-6 bg-card">
            <h3 className="font-semibold mb-3 text-foreground">Console</h3>
            <div className="bg-muted/50 rounded-lg p-4 min-h-[400px] font-mono text-sm">
              <pre className="whitespace-pre-wrap text-muted-foreground">
                {output || "// Aguardando execução..."}
              </pre>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Practice;
