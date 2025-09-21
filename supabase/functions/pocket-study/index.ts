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

    const { start_date, end_date, min_gap_minutes = 15 } = await req.json();

    if (!start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "Start date and end date are required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user's active study plans
    const { data: studyPlans, error: plansError } = await supabaseClient
      .from('study_plans')
      .select(`
        id,
        title,
        goal,
        plan_items (
          id,
          title,
          description,
          topic,
          estimated_duration_minutes,
          difficulty_level,
          status,
          confidence_level
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (plansError) {
      console.error('Error fetching study plans:', plansError);
      throw new Error('Failed to fetch study plans');
    }

    // Get existing calendar events (mock implementation - would integrate with Google Calendar, Outlook, etc.)
    const existingEvents = await getExistingEvents(supabaseClient, user.id, start_date, end_date);

    // Find available time slots
    const availableSlots = findAvailableSlots(start_date, end_date, existingEvents, min_gap_minutes);

    // Generate micro-lessons for available slots
    const microLessons = await generateMicroLessons(
      supabaseClient,
      studyPlans,
      availableSlots,
      user.id
    );

    // Create micro-lesson items in database
    const createdLessons = [];
    for (const lesson of microLessons) {
      const { data: createdLesson, error: lessonError } = await supabaseClient
        .from('plan_items')
        .insert({
          study_plan_id: lesson.study_plan_id,
          title: lesson.title,
          description: lesson.description,
          topic: lesson.topic,
          estimated_duration_minutes: lesson.duration,
          difficulty_level: lesson.difficulty,
          status: 'pending',
          order_index: 999, // High order to distinguish micro-lessons
          confidence_level: lesson.confidence_level
        })
        .select()
        .single();

      if (!lessonError) {
        createdLessons.push(createdLesson);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        available_slots_found: availableSlots.length,
        micro_lessons_created: createdLessons.length,
        lessons: createdLessons,
        analysis: {
          total_available_time: availableSlots.reduce((sum, slot) => sum + slot.duration, 0),
          recommended_sessions: availableSlots.length,
          topics_covered: [...new Set(createdLessons.map(l => l.topic))]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pocket-study function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Mock function to get existing calendar events
// In production, this would integrate with Google Calendar API, Outlook API, etc.
async function getExistingEvents(supabaseClient, userId, startDate, endDate) {
  // For now, return mock events
  // TODO: Implement actual calendar integration
  return [
    {
      start: new Date(startDate).toISOString(),
      end: new Date(new Date(startDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour meeting
      title: "Team Meeting"
    },
    {
      start: new Date(new Date(startDate).getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 AM next day
      end: new Date(new Date(startDate).getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9 AM next day
      title: "Class"
    }
  ];
}

// Find available time slots between existing events
function findAvailableSlots(startDate, endDate, existingEvents, minGapMinutes) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Sort existing events by start time
  const sortedEvents = existingEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

  let currentTime = new Date(start);

  // Skip events before start date
  while (sortedEvents.length > 0 && new Date(sortedEvents[0].start) < currentTime) {
    sortedEvents.shift();
  }

  // Find gaps between events
  for (const event of sortedEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    if (eventStart > currentTime) {
      const gapDuration = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60); // minutes

      if (gapDuration >= minGapMinutes) {
        // Split large gaps into smaller slots
        const maxSlotDuration = 60; // Max 60 minutes per slot
        let remainingGap = gapDuration;

        while (remainingGap >= minGapMinutes) {
          const slotDuration = Math.min(remainingGap, maxSlotDuration);
          slots.push({
            start: new Date(currentTime),
            end: new Date(currentTime.getTime() + slotDuration * 60 * 1000),
            duration: slotDuration
          });
          remainingGap -= slotDuration;
          currentTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
        }
      }
    }

    currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
  }

  // Check for gap after last event until end date
  const remainingGap = (end.getTime() - currentTime.getTime()) / (1000 * 60);
  if (remainingGap >= minGapMinutes) {
    let remaining = remainingGap;
    while (remaining >= minGapMinutes) {
      const slotDuration = Math.min(remaining, 60);
      slots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + slotDuration * 60 * 1000),
        duration: slotDuration
      });
      remaining -= slotDuration;
      currentTime = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
    }
  }

  return slots;
}

// Generate micro-lessons for available slots
async function generateMicroLessons(supabaseClient, studyPlans, availableSlots, userId) {
  const microLessons = [];

  // Get pending study items from active plans
  const allPendingItems = [];
  for (const plan of studyPlans) {
    for (const item of plan.plan_items || []) {
      if (item.status === 'pending') {
        allPendingItems.push({
          ...item,
          study_plan_id: plan.id,
          plan_title: plan.title
        });
      }
    }
  }

  if (allPendingItems.length === 0) {
    return microLessons;
  }

  // Sort items by priority (confidence level, difficulty, etc.)
  const sortedItems = allPendingItems.sort((a, b) => {
    // Prioritize items with lower confidence first
    const confidenceDiff = (a.confidence_level || 3) - (b.confidence_level || 3);
    if (confidenceDiff !== 0) return confidenceDiff;

    // Then by difficulty (easier first for micro-lessons)
    const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
    const aDiff = difficultyOrder[a.difficulty_level] || 2;
    const bDiff = difficultyOrder[b.difficulty_level] || 2;
    return aDiff - bDiff;
  });

  // Create micro-lessons for available slots
  for (const slot of availableSlots.slice(0, 10)) { // Limit to 10 lessons per request
    const originalItem = sortedItems[microLessons.length % sortedItems.length];
    const microLesson = createMicroLesson(originalItem, slot.duration);
    if (microLesson) {
      microLessons.push(microLesson);
    }
  }

  return microLessons;
}

// Create a micro-lesson from an original study item
function createMicroLesson(originalItem, slotDuration) {
  const maxDuration = Math.min(slotDuration, 30); // Max 30 minutes for micro-lessons
  const isFullLesson = slotDuration >= originalItem.estimated_duration_minutes;

  if (isFullLesson) {
    return {
      study_plan_id: originalItem.study_plan_id,
      title: `📚 ${originalItem.title}`,
      description: `Complete study session: ${originalItem.description}`,
      topic: originalItem.topic,
      duration: originalItem.estimated_duration_minutes,
      difficulty: originalItem.difficulty_level,
      confidence_level: originalItem.confidence_level,
      is_micro: false
    };
  }

  // Create a focused micro-lesson
  const microTitle = originalItem.title.length > 50
    ? originalItem.title.substring(0, 47) + "..."
    : originalItem.title;

  return {
    study_plan_id: originalItem.study_plan_id,
    title: `⚡ ${microTitle}`,
    description: `Quick review: ${originalItem.description?.substring(0, 100)}${originalItem.description?.length > 100 ? '...' : ''}`,
    topic: originalItem.topic,
    duration: maxDuration,
    difficulty: originalItem.difficulty_level,
    confidence_level: originalItem.confidence_level,
    is_micro: true
  };
}
