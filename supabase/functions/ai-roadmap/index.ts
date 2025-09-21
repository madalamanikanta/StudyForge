import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { goal, timeline_weeks, available_hours_per_week, difficulty_level = 'intermediate' } = await req.json();

    if (!goal || !timeline_weeks || !available_hours_per_week) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: goal, timeline_weeks, available_hours_per_week" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Generating AI roadmap for:', { goal, timeline_weeks, available_hours_per_week, difficulty_level });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create AI roadmap using OpenAI
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
            content: `You are an expert study planner that creates detailed, actionable study roadmaps. 
            Create a comprehensive study plan with specific learning items, time estimates, and clear progression.
            Always include prerequisite topics and difficulty progression.
            
            Response format should be a JSON object with:
            {
              "title": "Study Plan Title",
              "description": "Brief description of the plan",
              "total_estimated_hours": number,
              "difficulty_level": "beginner|intermediate|advanced",
              "items": [
                {
                  "title": "Item title",
                  "description": "Detailed description",
                  "topic": "Main topic/subject",
                  "estimated_duration_minutes": number,
                  "difficulty_level": "beginner|intermediate|advanced",
                  "prerequisites": ["topic1", "topic2"],
                  "order_index": number,
                  "confidence_level": 1-5,
                  "reasoning": "Why this item is important and how it fits in the plan",
                  "estimated_time": "Duration with justification",
                  "source_links": ["relevant learning resource URLs"]
                }
              ],
              "reasoning": "Overall explanation of the study plan structure and progression",
              "weekly_schedule": "Suggested weekly time distribution"
            }`
          },
          {
            role: 'user',
            content: `Create a detailed study roadmap for:
            Goal: ${goal}
            Timeline: ${timeline_weeks} weeks
            Available hours per week: ${available_hours_per_week}
            Difficulty level: ${difficulty_level}
            
            Total available hours: ${timeline_weeks * available_hours_per_week} hours
            
            Please create a roadmap with specific, actionable study items that progress logically from basics to advanced topics.
            Include reasoning for each item and how they connect to achieve the overall goal.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const roadmapContent = openAIData.choices[0].message.content;

    let roadmapData;
    try {
      roadmapData = JSON.parse(roadmapContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', roadmapContent);
      throw new Error('Invalid response format from AI');
    }

    // Create study plan in database
    const { data: studyPlan, error: planError } = await supabaseClient
      .from('study_plans')
      .insert({
        user_id: user.id,
        title: roadmapData.title,
        description: roadmapData.description,
        goal: goal,
        timeline_days: timeline_weeks * 7,
        hours_per_week: available_hours_per_week,
        difficulty_level: roadmapData.difficulty_level,
        ai_generated: true,
        status: 'active'
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating study plan:', planError);
      throw new Error('Failed to create study plan');
    }

    // Create plan items
    const planItems = roadmapData.items.map((item: any) => ({
      study_plan_id: studyPlan.id,
      title: item.title,
      description: item.description,
      topic: item.topic,
      estimated_duration_minutes: item.estimated_duration_minutes || 30,
      difficulty_level: item.difficulty_level || difficulty_level,
      prerequisites: item.prerequisites || [],
      order_index: item.order_index || 0,
      confidence_level: item.confidence_level || 3,
      status: 'pending'
    }));

    const { data: createdItems, error: itemsError } = await supabaseClient
      .from('plan_items')
      .insert(planItems)
      .select();

    if (itemsError) {
      console.error('Error creating plan items:', itemsError);
      throw new Error('Failed to create plan items');
    }

    console.log('Successfully created study plan with', createdItems.length, 'items');

    return new Response(
      JSON.stringify({
        success: true,
        study_plan: studyPlan,
        plan_items: createdItems,
        ai_insights: {
          reasoning: roadmapData.reasoning,
          weekly_schedule: roadmapData.weekly_schedule,
          total_estimated_hours: roadmapData.total_estimated_hours
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-roadmap function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});