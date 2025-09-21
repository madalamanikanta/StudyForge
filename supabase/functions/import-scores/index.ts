import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ImportResult {
  problems_count: number;
  contest_rating: number;
  badges: any[];
  raw_data: any;
}

// --- LeetCode Helper (Mock Data) ---
async function fetchLeetCodeData(username: string): Promise<ImportResult> {
  // LeetCode API is unreliable, using mock data for demonstration
  // In production, this should use a more reliable API or web scraping
  console.log(`Mock LeetCode data for: ${username}`);

  return {
    problems_count: Math.floor(Math.random() * 200) + 50, // Mock 50-250 problems
    contest_rating: Math.floor(Math.random() * 3000) + 1000, // Mock 1000-4000 rating
    badges: [
      { name: 'Top Problem Solver' },
      { name: 'Contest Participant' },
      { name: 'Streak Master' }
    ],
    raw_data: { username, mock: true },
  };
}

// --- HackerRank Helper ---
async function fetchHackerRankData(username: string): Promise<ImportResult> {
  const response = await fetch(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`);
  if (!response.ok) throw new Error(`Failed to fetch HackerRank data for username: ${username}`);
  const data = await response.json();

  return {
    problems_count: data.model.solved_challenges_count || 0,
    contest_rating: 0, // Not available in this endpoint
    badges: data.model.badges?.map((b: any) => ({ name: b.badge_name })) || [],
    raw_data: data.model,
  };
}

// --- Codeforces Helper ---
async function fetchCodeforcesData(username: string): Promise<ImportResult> {
  const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
  if (!response.ok) throw new Error(`Failed to fetch Codeforces data for username: ${username}`);
  const data = await response.json();
  if (data.status !== 'OK') throw new Error(data.comment);

  const user = data.result[0];
  const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`);
  const submissionsData = await submissionsResponse.json();
  if (submissionsData.status !== 'OK') throw new Error(submissionsData.comment);
  const solved = new Set(submissionsData.result.filter((s: any) => s.verdict === 'OK').map((s: any) => s.problem.name));

  return {
    problems_count: solved.size,
    contest_rating: user.rating || 0,
    badges: [{ name: user.rank, value: user.rating }],
    raw_data: {user, submissions: submissionsData.result},
  };
}

// --- CodeChef Helper ---
async function fetchCodeChefData(username: string): Promise<ImportResult> {
    const response = await fetch(`https://www.codechef.com/users/${username}`);
    if (!response.ok) throw new Error(`Failed to fetch CodeChef data for username: ${username}`);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    if (!doc) throw new Error("Failed to parse CodeChef profile page");

    const ratingText = doc.querySelector(".rating-number")?.textContent || "0";
    const problemsText = doc.querySelector(".problems-solved h3")?.textContent || "0";

    const problems_count = parseInt(problemsText.replace(/\D/g, ''), 10) || 0;
    const contest_rating = parseInt(ratingText, 10) || 0;
    const badges = Array.from(doc.querySelectorAll('.badge__title')).map(b => ({ name: b.textContent.trim() }));

    return { problems_count, contest_rating, badges, raw_data: {} };
}


// --- AtCoder Helper ---
async function fetchAtCoderData(username: string): Promise<ImportResult> {
    const response = await fetch(`https://atcoder.jp/users/${username}/history/json`);
    if (!response.ok) throw new Error(`Failed to fetch AtCoder data for username: ${username}`);
    const history = await response.json();

    const rating = history.length > 0 ? history[history.length - 1].NewRating : 0;

    // AtCoder does not provide a simple solved count, so we leave it as 0 for now.
    return {
        problems_count: 0,
        contest_rating: rating,
        badges: [],
        raw_data: history,
    };
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        auth: { persistSession: false },
        global: { headers: { 'Content-Type': 'application/json' } }
      }
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { platform, username } = requestData;
    if (!platform || !username) {
      return new Response(
        JSON.stringify({ error: 'Platform and username are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch data from the appropriate platform
    let result: ImportResult;
    try {
      switch (platform.toLowerCase()) {
        case 'leetcode':
          result = await fetchLeetCodeData(username);
          break;
        case 'hackerrank':
          result = await fetchHackerRankData(username);
          break;
        case 'codeforces':
          result = await fetchCodeforcesData(username);
          break;
        case 'codechef':
          result = await fetchCodeChefData(username);
          break;
        case 'atcoder':
          result = await fetchAtCoderData(username);
          break;
        default:
          return new Response(
            JSON.stringify({ error: 'Platform not supported' }), 
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } catch (error) {
      console.error(`Error fetching data from ${platform}:`, error);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch data from ${platform}`, 
          details: error.message 
        }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save the imported data
    try {
      const { data: importRecord, error: upsertError } = await supabaseClient
        .from('imports')
        .upsert({
          user_id: user.id,
          platform: platform.toLowerCase(),
          username: username,
          problems_count: result.problems_count,
          contest_rating: result.contest_rating,
          badges: result.badges,
          import_data: result.raw_data,
          last_synced: new Date().toISOString(),
          status: 'active',
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id,platform',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Error upserting import data:', upsertError);
        throw new Error('Failed to save import data');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Data imported successfully',
          record: importRecord 
        }), 
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Database operation failed',
          details: error.message 
        }), 
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in import-scores function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
