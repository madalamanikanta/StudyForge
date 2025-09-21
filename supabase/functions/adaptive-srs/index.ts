import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { concept_id, topic } = await req.json();

    // Get recent performance history for this concept/topic
    const { data: performanceHistory, error: perfError } = await supabaseClient
      .from('progress_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', concept_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (perfError) {
      console.error('Error fetching performance history:', perfError);
      throw new Error('Failed to fetch performance history');
    }

    // Analyze performance patterns
    const analysis = analyzePerformance(performanceHistory);

    // Get current spaced item
    const { data: currentItem, error: itemError } = await supabaseClient
      .from('spaced_items')
      .select('*')
      .eq('user_id', user.id)
      .eq('concept_id', concept_id)
      .single();

    if (itemError && itemError.code !== 'PGRST116') {
      throw new Error('Failed to fetch current spaced item');
    }

    // Calculate adaptive interval
    const adaptiveInterval = calculateAdaptiveInterval(analysis, currentItem);

    // Update or create spaced item with new interval
    const spacedItemData = {
      user_id: user.id,
      concept_id: concept_id,
      concept_title: topic,
      next_review: new Date(Date.now() + adaptiveInterval * 24 * 60 * 60 * 1000).toISOString(),
      ease_factor: calculateEaseFactor(analysis),
      interval_days: adaptiveInterval,
      repetitions: (currentItem?.repetitions || 0) + 1,
      last_reviewed: new Date().toISOString(),
    };

    const { data: updatedItem, error: updateError } = await supabaseClient
      .from('spaced_items')
      .upsert(spacedItemData, { onConflict: 'user_id,concept_id' })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating spaced item:', updateError);
      throw new Error('Failed to update spaced repetition schedule');
    }

    return new Response(
      JSON.stringify({
        success: true,
        spaced_item: updatedItem,
        analysis: {
          performance_score: analysis.overall_score,
          recommended_interval: adaptiveInterval,
          confidence_trend: analysis.confidence_trend,
          time_efficiency: analysis.time_efficiency,
          next_review_date: updatedItem.next_review
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in adaptive-srs function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Performance analysis functions
function analyzePerformance(performanceHistory) {
  if (!performanceHistory || performanceHistory.length === 0) {
    return {
      overall_score: 0.5,
      confidence_trend: 'neutral',
      time_efficiency: 1.0,
      recent_correctness: 0.5,
      average_confidence: 3,
      performance_variance: 0
    };
  }

  const recent = performanceHistory.slice(0, 5);
  const older = performanceHistory.slice(5);

  const recent_correctness = recent.reduce((sum, p) => sum + (p.correctness || 0), 0) / recent.length;
  const older_correctness = older.length > 0 ?
    older.reduce((sum, p) => sum + (p.correctness || 0), 0) / older.length : recent_correctness;

  const recent_confidence = recent.reduce((sum, p) => sum + (p.confidence_after || 3), 0) / recent.length;
  const older_confidence = older.length > 0 ?
    older.reduce((sum, p) => sum + (p.confidence_after || 3), 0) / older.length : recent_confidence;

  const confidence_trend = recent_confidence > older_confidence ? 'improving' :
                          recent_confidence < older_confidence ? 'declining' : 'stable';

  const average_time = recent.reduce((sum, p) => sum + (p.time_taken_minutes || 30), 0) / recent.length;
  const time_efficiency = Math.max(0.1, Math.min(2.0, 60 / Math.max(average_time, 1)));

  const overall_score = (recent_correctness * 0.6) + (recent_confidence / 5 * 0.3) + (time_efficiency / 2 * 0.1);

  return {
    overall_score: Math.max(0.1, Math.min(1.0, overall_score)),
    confidence_trend,
    time_efficiency,
    recent_correctness,
    average_confidence: recent_confidence,
    performance_variance: calculateVariance(performanceHistory.map(p => p.correctness || 0))
  };
}

function calculateVariance(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateAdaptiveInterval(analysis, currentItem) {
  const baseInterval = currentItem?.interval_days || 1;
  const performance = analysis.overall_score;
  const trend = analysis.confidence_trend;
  const variance = analysis.performance_variance;

  // Base calculation using performance score
  let newInterval = baseInterval;

  if (performance >= 0.8) {
    // High performance: increase interval significantly
    newInterval = Math.min(baseInterval * (2.5 + (performance - 0.8) * 2), 30);
  } else if (performance >= 0.6) {
    // Good performance: moderate increase
    newInterval = baseInterval * (1.5 + (performance - 0.6) * 1.5);
  } else if (performance >= 0.4) {
    // Fair performance: slight increase or maintain
    newInterval = baseInterval * (1.0 + (performance - 0.4) * 0.5);
  } else {
    // Poor performance: decrease interval
    newInterval = Math.max(1, baseInterval * (0.5 + performance * 0.5));
  }

  // Adjust based on confidence trend
  if (trend === 'improving') {
    newInterval *= 1.2;
  } else if (trend === 'declining') {
    newInterval *= 0.8;
  }

  // Adjust based on performance variance (consistency)
  if (variance > 0.3) {
    // High variance: be more conservative
    newInterval *= 0.7;
  } else if (variance < 0.1) {
    // Low variance (consistent): can be more aggressive
    newInterval *= 1.1;
  }

  // Factor in time efficiency (faster learning = longer intervals)
  newInterval *= Math.max(0.8, Math.min(1.5, analysis.time_efficiency));

  return Math.max(1, Math.min(30, Math.round(newInterval)));
}

function calculateEaseFactor(analysis) {
  const performance = analysis.overall_score;
  const trend = analysis.confidence_trend;

  let easeFactor = 2.5; // Default SM-2 ease factor

  if (performance >= 0.8) {
    easeFactor = 2.8 + (performance - 0.8) * 0.5;
  } else if (performance >= 0.6) {
    easeFactor = 2.5 + (performance - 0.6) * 0.3;
  } else if (performance < 0.4) {
    easeFactor = Math.max(1.3, 2.5 - (0.4 - performance) * 2);
  }

  if (trend === 'improving') {
    easeFactor += 0.1;
  } else if (trend === 'declining') {
    easeFactor -= 0.1;
  }

  return Math.max(1.3, Math.min(3.0, easeFactor));
}
