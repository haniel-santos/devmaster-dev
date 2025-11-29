import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, Battery, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface ShopItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  value: number;
  type: string;
}

const EnergyShop = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUser();

    // Verificar status do pagamento na URL
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success("Pagamento aprovado!", {
        description: "Sua energia foi restaurada",
      });
      // Limpar parâmetros da URL
      window.history.replaceState({}, '', '/energy-shop');
    } else if (paymentStatus === 'failure') {
      toast.error("Pagamento recusado", {
        description: "Tente novamente ou use outro método",
      });
      window.history.replaceState({}, '', '/energy-shop');
    } else if (paymentStatus === 'pending') {
      toast.info("Pagamento pendente", {
        description: "Aguardando confirmação",
      });
      window.history.replaceState({}, '', '/energy-shop');
    }
  }, []);

  const shopItems: ShopItem[] = [
    {
      id: "energy_1",
      title: "+1 Energia",
      description: "Recupere 1 ponto de energia",
      icon: <Zap className="w-8 h-8 text-warning" />,
      value: 1,
      type: "energy",
    },
    {
      id: "energy_full",
      title: "Energia Máxima",
      description: "Recupere toda sua energia (7/7)",
      icon: <Battery className="w-8 h-8 text-success" />,
      value: 7,
      type: "energy_full",
    },
    {
      id: "buff_regen",
      title: "Regeneração Rápida",
      description: "Dobra a velocidade de regeneração por 24h",
      icon: <Clock className="w-8 h-8 text-primary" />,
      value: 24,
      type: "buff",
    },
  ];

  const handlePurchase = async (item: ShopItem) => {
    if (!userId) return;

    try {
      toast.loading("Processando pagamento...");

      // Definir preços para cada item
      const prices = {
        energy_1: 5.00,
        energy_full: 15.00,
        buff_regen: 20.00,
      };

      const price = prices[item.id as keyof typeof prices] || 10.00;

      // Criar preferência de pagamento no Mercado Pago
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          item_type: item.type,
          item_value: item.value,
          title: item.title,
          description: item.description,
          price: price,
        },
      });

      if (error) throw error;

      // Redirecionar para checkout do Mercado Pago
      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não recebido');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error("Erro ao processar pagamento", {
        description: (error as Error).message || "Tente novamente mais tarde",
      });
    }
  };

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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Loja de Energia</h1>
              <p className="text-sm text-muted-foreground">
                Recupere sua energia e continue aprendendo
              </p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => (
            <Card key={item.id} className="p-6 bg-card hover:shadow-lg transition-all">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                </div>
                <Button
                  onClick={() => handlePurchase(item)}
                  className="w-full"
                >
                  Adquirir
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4 mt-6 bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            💳 Pagamentos processados via Mercado Pago de forma segura.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default EnergyShop;
