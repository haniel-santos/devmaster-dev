import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Zap, Battery, Clock, Crown, Check, Sparkles } from "lucide-react";
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

  const premiumBenefits = [
    "Energia ilimitada",
    "Regeneração 2x mais rápida",
    "+50% de XP em desafios",
    "Acesso antecipado a novos módulos",
    "Badge exclusivo de Premium",
  ];

  const handlePurchase = async (item: ShopItem) => {
    if (!userId) return;

    try {
      toast.loading("Processando pagamento...");

      const prices = {
        energy_1: 5.00,
        energy_full: 15.00,
        buff_regen: 20.00,
      };

      const price = prices[item.id as keyof typeof prices] || 10.00;

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

  const handleSubscribe = async () => {
    if (!userId) return;

    try {
      toast.loading("Preparando assinatura...");

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          item_type: "subscription",
          item_value: 30,
          title: "Dev Master Premium",
          description: "Assinatura mensal com benefícios exclusivos",
          price: 29.90,
        },
      });

      if (error) throw error;

      if (data?.init_point) {
        window.location.href = data.init_point;
      } else {
        throw new Error('Link de pagamento não recebido');
      }
    } catch (error) {
      console.error('Erro ao processar assinatura:', error);
      toast.error("Erro ao processar assinatura", {
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

        {/* Premium Plan Card */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-2 border-amber-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-orange-400/20 to-transparent rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">Dev Master Premium</h2>
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Desbloqueie todo o potencial da plataforma
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-3">
                {premiumBenefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-amber-500" />
                    </div>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center bg-card/50 rounded-xl p-6">
                <span className="text-sm text-muted-foreground mb-1">Por apenas</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-amber-500">R$29</span>
                  <span className="text-xl text-amber-500/70">,90</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <Button 
                  onClick={handleSubscribe}
                  className="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                  size="lg"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Assinar Agora
                </Button>
                <span className="text-xs text-muted-foreground mt-2">Cancele quando quiser</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6 bg-card/80 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Loja de Energia</h1>
              <p className="text-sm text-muted-foreground">
                Compras avulsas para recuperar energia
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
