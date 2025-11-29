import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mercado Pago envia notificações via query params
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const dataId = url.searchParams.get('data.id');

    console.log('Webhook received - Type:', type, 'ID:', dataId);

    // Só processar notificações de pagamento
    if (type === 'payment') {
      // Buscar informações do pagamento no Mercado Pago
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${dataId}`,
        {
          headers: {
            'Authorization': `Bearer ${mercadoPagoToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        throw new Error(`Failed to fetch payment: ${paymentResponse.status}`);
      }

      const payment = await paymentResponse.json();
      console.log('Payment status:', payment.status);

      // Processar apenas pagamentos aprovados
      if (payment.status === 'approved') {
        try {
          const externalReference = JSON.parse(payment.external_reference);
          const { user_id, item_type, item_value } = externalReference;

          console.log('Processing approved payment for user:', user_id);

          // Atualizar energia do usuário
          if (item_type === 'energy') {
            const { data: energyData } = await supabase
              .from('user_energy')
              .select('current_energy, max_energy')
              .eq('user_id', user_id)
              .single();

            if (energyData) {
              const newEnergy = Math.min(
                energyData.current_energy + item_value,
                energyData.max_energy
              );

              await supabase
                .from('user_energy')
                .update({ 
                  current_energy: newEnergy,
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user_id);

              console.log('Energy updated:', newEnergy);
            }
          } else if (item_type === 'energy_full') {
            await supabase
              .from('user_energy')
              .update({ 
                current_energy: item_value,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user_id);

            console.log('Energy restored to full');
          }
        } catch (error) {
          console.error('Error processing payment:', error);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mercado-pago-webhook:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
