import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { challengeId, userCode } = await req.json();

    if (!challengeId || typeof userCode !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing challengeId or userCode' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating code for challenge ${challengeId} by user ${user.id}`);

    // Use service role to fetch test_code (not exposed to client)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: challenge, error: challengeError } = await supabaseAdmin
      .from('challenges')
      .select('id, test_code')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      console.error('Challenge not found:', challengeError);
      return new Response(
        JSON.stringify({ error: 'Challenge not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute user code + test code in a sandboxed way
    let isCorrect = false;
    let errorMessage = '';

    try {
      // Create a function that combines user code and test code
      const combinedCode = `
        ${userCode}
        ${challenge.test_code}
      `;
      
      // Use Function constructor to execute code
      const testFunc = new Function(combinedCode);
      const result = testFunc();
      
      isCorrect = result === true;
      console.log(`Code execution result: ${result}, isCorrect: ${isCorrect}`);
    } catch (execError: unknown) {
      const error = execError as Error;
      console.error('Code execution error:', error.message);
      errorMessage = error.message || 'Erro na execução do código';
      isCorrect = false;
    }

    return new Response(
      JSON.stringify({ 
        success: isCorrect,
        error: errorMessage || undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in validate-code function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
