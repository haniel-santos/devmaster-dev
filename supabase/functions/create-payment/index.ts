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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { item_type, item_value, title, description, price } = await req.json();

    console.log('Creating payment preference for user:', user.id);

    const mercadoPagoToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mercadoPagoToken) {
      throw new Error('Mercado Pago access token not configured');
    }

    // Criar preferência de pagamento no Mercado Pago
    const preference = {
      items: [
        {
          title: title,
          description: description,
          quantity: 1,
          unit_price: price,
          currency_id: 'BRL',
        }
      ],
      back_urls: {
        success: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/energy-shop?payment=success`,
        failure: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/energy-shop?payment=failure`,
        pending: `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/energy-shop?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({
        user_id: user.id,
        item_type: item_type,
        item_value: item_value,
      }),
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`,
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mercadoPagoToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mercado Pago API error:', error);
      throw new Error(`Mercado Pago API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Payment preference created:', data.id);

    // Registrar compra no banco
    await supabase.from('energy_purchases').insert({
      user_id: user.id,
      item_type: item_type,
      item_value: item_value,
    });

    return new Response(
      JSON.stringify({ 
        init_point: data.init_point,
        preference_id: data.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
