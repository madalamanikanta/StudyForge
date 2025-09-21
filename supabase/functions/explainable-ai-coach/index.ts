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

    const { topic, current_level = 'beginner', target_level = 'intermediate', time_available_hours = 10 } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating explainable AI coaching for:', { topic, current_level, target_level, time_available_hours });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user's progress history for this topic
    const { data: progressHistory, error: progressError } = await supabaseClient
      .from('progress_logs')
      .select('*')
      .eq('user_id', user.id)
      .ilike('concept_id', `%${topic.toLowerCase()}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (progressError) {
      console.error('Error fetching progress history:', progressError);
    }

    // Analyze user's current state
    const userAnalysis = analyzeUserProgress(progressHistory);

    // Generate AI coaching response
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert AI study coach that provides explainable, traceable coaching with clear reasoning.
            Create detailed, actionable learning paths with transparent reasoning for each recommendation.

            Response format should be a JSON object with:
            {
              "topic_analysis": {
                "current_level_assessment": "Assessment of user's current knowledge level",
                "knowledge_gaps": ["gap1", "gap2"],
                "strengths": ["strength1", "strength2"],
                "learning_style_recommendation": "visual|auditory|kinesthetic|reading"
              },
              "mastery_path": {
                "overall_strategy": "High-level strategy explanation",
                "estimated_total_time": "Total estimated hours",
                "difficulty_progression": "beginner->intermediate->advanced explanation",
                "steps": [
                  {
                    "step_number": 1,
                    "title": "Step title",
                    "description": "What to do in this step",
                    "reasoning": "Why this step is important and how it builds on previous",
                    "estimated_time": "Time estimate with justification",
                    "difficulty_level": "beginner|intermediate|advanced",
                    "prerequisites": ["prereq1", "prereq2"],
                    "success_criteria": ["criterion1", "criterion2"],
                    "resources": [
                      {
                        "title": "Resource title",
                        "type": "video|article|book|course|practice",
                        "url": "URL if available",
                        "reasoning": "Why this specific resource"
                      }
                    ],
                    "practice_activities": [
                      {
                        "activity": "Specific practice task",
                        "time_estimate": "minutes",
                        "difficulty": "easy|medium|hard"
                      }
                    ]
                  }
                ]
              },
              "personalized_adjustments": {
                "based_on_history": "How recommendations were adjusted based on user history",
                "pace_adjustments": "Recommendations for pacing",
                "focus_areas": "Areas needing extra attention"
              },
              "progress_tracking": {
                "milestones": ["milestone1", "milestone2"],
                "checkpoints": ["checkpoint1", "checkpoint2"],
                "success_metrics": ["metric1", "metric2"]
              }
            }`
          },
          {
            role: 'user',
            content: `Create a detailed, explainable coaching plan for learning "${topic}".
            User context: ${JSON.stringify(userAnalysis)}
            Current level: ${current_level}
            Target level: ${target_level}
            Available time: ${time_available_hours} hours

            Please provide:
            1. Clear reasoning for each recommendation
            2. A 3-step path to mastery with specific, actionable items
            3. Resource recommendations with explanations
            4. Practice activities for each step
            5. Success criteria for progression
            6. Adjustments based on user's learning history

            Make the reasoning transparent and traceable - explain WHY each step is recommended and HOW it contributes to mastery.`
          }
        ],
        temperature: 0.3, // Lower temperature for more focused, explainable responses
        max_tokens: 4000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const coachingContent = openAIData.choices[0].message.content;

    let coachingData;
    try {
      coachingData = JSON.parse(coachingContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', coachingContent);
      throw new Error('Invalid response format from AI coach');
    }

    // Store coaching session for future reference
    const { data: coachingSession, error: sessionError } = await supabaseClient
      .from('progress_logs')
      .insert({
        user_id: user.id,
        concept_id: topic,
        activity_type: 'ai_coaching_session',
        notes: `AI Coaching session for ${topic}`,
        metadata: {
          coaching_data: coachingData,
          user_analysis: userAnalysis,
          request_params: { current_level, target_level, time_available_hours }
        }
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error storing coaching session:', sessionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        coaching_data: coachingData,
        user_analysis: userAnalysis,
        session_id: coachingSession?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in explainable-ai-coach function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Analyze user's progress history
function analyzeUserProgress(progressHistory) {
  if (!progressHistory || progressHistory.length === 0) {
    return {
      total_sessions: 0,
      average_correctness: 0,
      average_confidence: 3,
      time_trend: 'no_data',
      topics_mastered: [],
      struggling_topics: [],
      learning_pace: 'moderate',
      preferred_activities: []
    };
  }

  const recent = progressHistory.slice(0, 10);
  const older = progressHistory.slice(10);

  const average_correctness = recent.reduce((sum, p) => sum + (p.correctness || 0), 0) / recent.length;
  const average_confidence = recent.reduce((sum, p) => sum + (p.confidence_after || 3), 0) / recent.length;

  const recent_avg_correctness = recent.reduce((sum, p) => sum + (p.correctness || 0), 0) / recent.length;
  const older_avg_correctness = older.length > 0 ?
    older.reduce((sum, p) => sum + (p.correctness || 0), 0) / older.length : recent_avg_correctness;

  const correctness_trend = recent_avg_correctness > older_avg_correctness ? 'improving' :
                           recent_avg_correctness < older_avg_correctness ? 'declining' : 'stable';

  // Analyze activity types
  const activityCounts = {};
  recent.forEach(p => {
    if (p.activity_type) {
      activityCounts[p.activity_type] = (activityCounts[p.activity_type] || 0) + 1;
    }
  });
  const preferred_activities = Object.entries(activityCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([activity]) => activity);

  // Determine learning pace
  const average_time = recent.reduce((sum, p) => sum + (p.time_taken_minutes || 30), 0) / recent.length;
  const learning_pace = average_time < 20 ? 'fast' : average_time > 45 ? 'slow' : 'moderate';

  return {
    total_sessions: progressHistory.length,
    average_correctness: Math.round(average_correctness * 100) / 100,
    average_confidence: Math.round(average_confidence * 10) / 10,
    correctness_trend,
    time_trend: correctness_trend,
    topics_mastered: extractTopics(progressHistory, 'mastered'),
    struggling_topics: extractTopics(progressHistory, 'struggling'),
    learning_pace,
    preferred_activities
  };
}

// Extract topics based on performance criteria
function extractTopics(progressHistory, criteria) {
  const topicPerformance = {};

  progressHistory.forEach(p => {
    if (p.concept_id) {
      if (!topicPerformance[p.concept_id]) {
        topicPerformance[p.concept_id] = {
          total: 0,
          correct: 0,
          confidence: 0,
          count: 0
        };
      }

      topicPerformance[p.concept_id].total++;
      topicPerformance[p.concept_id].correct += p.correctness || 0;
      topicPerformance[p.concept_id].confidence += p.confidence_after || 3;
      topicPerformance[p.concept_id].count++;
    }
  });

  const topics = Object.entries(topicPerformance)
    .map(([topic, data]) => ({
      topic,
      accuracy: data.correct / data.total,
      average_confidence: data.confidence / data.count,
      sessions: data.total
    }))
    .filter(t => t.sessions >= 3); // Only consider topics with sufficient data

  if (criteria === 'mastered') {
    return topics.filter(t => t.accuracy >= 0.8 && t.average_confidence >= 4).map(t => t.topic);
  } else if (criteria === 'struggling') {
    return topics.filter(t => t.accuracy < 0.6 || t.average_confidence < 3).map(t => t.topic);
  }

  return [];
}
