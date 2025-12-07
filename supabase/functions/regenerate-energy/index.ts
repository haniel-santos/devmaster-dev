import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET for security
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.error('Unauthorized: Invalid or missing CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting energy regeneration process...')

    // Get all users with less than max energy who haven't regenerated recently
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    
    const { data: usersToRegenerate, error: fetchError } = await supabase
      .from('user_energy')
      .select('id, user_id, current_energy, max_energy, last_regeneration_at')
      .lt('current_energy', supabase.from('user_energy').select('max_energy'))
      .lt('last_regeneration_at', tenMinutesAgo)

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      throw fetchError
    }

    if (!usersToRegenerate || usersToRegenerate.length === 0) {
      console.log('No users need energy regeneration')
      return new Response(
        JSON.stringify({ message: 'No users need energy regeneration', regenerated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${usersToRegenerate.length} users needing energy regeneration`)

    // Regenerate energy for each user
    let regeneratedCount = 0
    for (const user of usersToRegenerate) {
      const minutesSinceLastRegen = Math.floor(
        (Date.now() - new Date(user.last_regeneration_at).getTime()) / (60 * 1000)
      )
      
      // Calculate how many energy points to add (1 per 10 minutes)
      const energyToAdd = Math.floor(minutesSinceLastRegen / 10)
      
      if (energyToAdd > 0) {
        const newEnergy = Math.min(user.current_energy + energyToAdd, user.max_energy)
        
        const { error: updateError } = await supabase
          .from('user_energy')
          .update({
            current_energy: newEnergy,
            last_regeneration_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (updateError) {
          console.error(`Error updating energy for user ${user.user_id}:`, updateError)
        } else {
          regeneratedCount++
          console.log(`Regenerated ${energyToAdd} energy for user ${user.user_id}`)
        }
      }
    }

    console.log(`Energy regeneration complete. Regenerated for ${regeneratedCount} users`)

    return new Response(
      JSON.stringify({ 
        message: 'Energy regeneration completed',
        regenerated: regeneratedCount,
        checked: usersToRegenerate.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in regenerate-energy function:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
