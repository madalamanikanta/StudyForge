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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'dashboard';

    switch (action) {
      case 'dashboard':
        return await handleBillingDashboard(supabaseClient, user);
      case 'smart-reminders':
        return await handleSmartReminders(supabaseClient, user, req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in billing-smart-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Handle billing dashboard
async function handleBillingDashboard(supabaseClient, user) {
  // Mock billing data - in production, this would integrate with Stripe/PayPal
  const mockBillingHistory = [
    {
      id: 'bill_1',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'StudyForge Premium - Monthly',
      amount: 9.99,
      status: 'paid',
      invoice_url: '/invoices/bill_1.pdf'
    },
    {
      id: 'bill_2',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'StudyForge Premium - Monthly',
      amount: 9.99,
      status: 'paid',
      invoice_url: '/invoices/bill_2.pdf'
    }
  ];

  // Mock usage data
  const usageData = {
    ai_requests_this_month: 245,
    ai_requests_limit: 1000,
    study_plans_created: 12,
    study_plans_limit: 50,
    storage_used_mb: 15,
    storage_limit_mb: 100,
    peer_sessions_joined: 8,
    peer_sessions_limit: 20
  };

  const currentPlan = {
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    billing_cycle: 'monthly',
    next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    features: [
      'Unlimited AI study plans',
      'Advanced progress analytics',
      'Peer study rooms',
      'Offline access',
      'Priority support'
    ]
  };

  return new Response(
    JSON.stringify({
      success: true,
      billing: {
        current_plan: currentPlan,
        billing_history: mockBillingHistory,
        usage_data: usageData,
        total_spent_this_year: 119.88,
        days_until_next_billing: 30
      },
      recommendations: {
        upgrade_suggestions: [],
        cost_saving_tips: [
          'Consider annual billing to save 20%',
          'Your AI usage is at 24% - you have plenty of capacity',
          'Storage usage is low - no immediate need to upgrade'
        ]
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle smart reminders
async function handleSmartReminders(supabaseClient, user, req) {
  const { reminder_type = 'escalation' } = await req.json();

  // Get user's pending study items
  const { data: pendingItems, error: itemsError } = await supabaseClient
    .from('plan_items')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (itemsError) {
    console.error('Error fetching pending items:', itemsError);
    throw new Error('Failed to fetch pending items');
  }

  // Get user's study patterns from progress logs
  const { data: recentProgress, error: progressError } = await supabaseClient
    .from('progress_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (progressError) {
    console.error('Error fetching progress:', progressError);
  }

  // Analyze study patterns
  const studyPatterns = analyzeStudyPatterns(recentProgress || []);

  // Generate smart reminders
  const smartReminders = generateSmartReminders(pendingItems || [], studyPatterns, reminder_type);

  // Store reminder analytics
  await supabaseClient
    .from('progress_logs')
    .insert({
      user_id: user.id,
      concept_id: 'smart_reminder_system',
      activity_type: 'reminder_generated',
      notes: `Generated ${smartReminders.length} smart reminders`,
      metadata: {
        reminder_type,
        patterns_analyzed: studyPatterns,
        pending_items_count: pendingItems?.length || 0
      }
    });

  return new Response(
    JSON.stringify({
      success: true,
      reminders: smartReminders,
      analysis: {
        total_pending_items: pendingItems?.length || 0,
        optimal_study_times: studyPatterns.optimal_times,
        study_streaks: studyPatterns.current_streak,
        recommendations: studyPatterns.recommendations
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Analyze user's study patterns
function analyzeStudyPatterns(progressLogs) {
  if (progressLogs.length === 0) {
    return {
      optimal_times: ['9:00 AM', '2:00 PM', '7:00 PM'],
      study_streaks: 0,
      preferred_subjects: [],
      average_session_length: 30,
      recommendations: ['Start with short 15-minute sessions to build momentum']
    };
  }

  // Extract study times
  const studyTimes = progressLogs.map(log => {
    const date = new Date(log.created_at);
    return date.getHours();
  });

  // Find most common study hours
  const hourCounts = {};
  studyTimes.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const sortedHours = Object.entries(hourCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`);

  // Calculate study streaks
  const dates = progressLogs.map(log => new Date(log.created_at).toDateString());
  const uniqueDates = [...new Set(dates)];
  const currentStreak = calculateCurrentStreak(uniqueDates);

  // Analyze preferred subjects
  const subjectCounts = {};
  progressLogs.forEach(log => {
    if (log.concept_id) {
      subjectCounts[log.concept_id] = (subjectCounts[log.concept_id] || 0) + 1;
    }
  });

  const preferredSubjects = Object.entries(subjectCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([subject]) => subject);

  // Calculate average session length
  const totalTime = progressLogs.reduce((sum, log) => sum + (log.time_taken_minutes || 30), 0);
  const averageSessionLength = Math.round(totalTime / progressLogs.length);

  return {
    optimal_times: sortedHours,
    study_streaks: currentStreak,
    preferred_subjects: preferredSubjects,
    average_session_length: averageSessionLength,
    recommendations: generateStudyRecommendations(studyTimes, currentStreak, averageSessionLength)
  };
}

// Calculate current study streak
function calculateCurrentStreak(uniqueDates) {
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const currentDate = new Date(today);

  for (let i = 0; i < 30; i++) { // Check last 30 days
    const dateStr = currentDate.toDateString();
    if (uniqueDates.includes(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Generate study recommendations
function generateStudyRecommendations(studyTimes, streak, avgSession) {
  const recommendations = [];

  if (streak === 0) {
    recommendations.push('Start a study streak with a 10-minute session today');
  } else if (streak > 7) {
    recommendations.push('Great streak! Consider increasing session length gradually');
  }

  if (avgSession < 15) {
    recommendations.push('Try extending sessions to 25-30 minutes for better retention');
  } else if (avgSession > 60) {
    recommendations.push('Consider breaking long sessions into focused 45-minute blocks');
  }

  // Time-based recommendations
  const morningStudies = studyTimes.filter(h => h >= 6 && h <= 11).length;
  const eveningStudies = studyTimes.filter(h => h >= 18 && h <= 23).length;

  if (morningStudies > eveningStudies) {
    recommendations.push('Your morning focus is excellent - maintain this productive time');
  } else {
    recommendations.push('Consider scheduling important topics during your peak focus hours');
  }

  return recommendations;
}

// Generate smart reminders with escalation
function generateSmartReminders(pendingItems, studyPatterns, reminderType) {
  const reminders = [];
  const now = new Date();

  pendingItems.forEach((item, index) => {
    const itemDate = new Date(item.created_at);
    const daysOverdue = Math.floor((now - itemDate) / (24 * 60 * 60 * 1000));

    const reminder = {
      id: `reminder_${item.id}`,
      item_id: item.id,
      title: item.title,
      topic: item.topic,
      priority: calculatePriority(item, daysOverdue, studyPatterns),
      suggested_time: suggestOptimalTime(studyPatterns.optimal_times),
      escalation_level: 1
    };

    // Apply escalation based on how overdue and reminder type
    if (reminderType === 'escalation') {
      if (daysOverdue > 3) {
        reminder.escalation_level = 2;
        reminder.message = `⚠️ Urgent: ${item.title} is ${daysOverdue} days overdue`;
        reminder.suggested_actions = [
          'Schedule immediately for next available slot',
          'Break into smaller 15-minute micro-sessions',
          'Set a reminder for tomorrow morning'
        ];
      } else if (daysOverdue > 1) {
        reminder.escalation_level = 1;
        reminder.message = `📅 Reminder: ${item.title} needs attention`;
        reminder.suggested_actions = [
          'Review for 20 minutes today',
          'Practice related problems',
          'Update confidence level after review'
        ];
      } else {
        reminder.escalation_level = 0;
        reminder.message = `🎯 Suggested: ${item.title}`;
        reminder.suggested_actions = [
          'Perfect time for this topic',
          'Expected time: 30 minutes',
          'Related topics will be easier after this'
        ];
      }
    } else {
      // Standard reminder
      reminder.message = `Study reminder: ${item.title}`;
      reminder.suggested_actions = [
        'Review the material',
        'Practice exercises',
        'Update your progress'
      ];
    }

    reminders.push(reminder);
  });

  // Sort by priority and escalation level
  return reminders.sort((a, b) => {
    if (a.escalation_level !== b.escalation_level) {
      return b.escalation_level - a.escalation_level;
    }
    return b.priority - a.priority;
  });
}

// Calculate priority score for an item
function calculatePriority(item, daysOverdue, studyPatterns) {
  let priority = 1;

  // Base priority on confidence level (lower confidence = higher priority)
  const confidenceScore = (6 - (item.confidence_level || 3)) / 5;
  priority += confidenceScore * 3;

  // Factor in how overdue it is
  if (daysOverdue > 0) {
    priority += Math.min(daysOverdue * 0.5, 3);
  }

  // Boost priority if it's a preferred subject
  if (studyPatterns.preferred_subjects.includes(item.topic)) {
    priority += 1;
  }

  // Consider study streak
  if (studyPatterns.study_streaks > 5) {
    priority += 1; // Higher priority when on a streak
  }

  return Math.min(priority, 5);
}

// Suggest optimal study time
function suggestOptimalTime(optimalTimes) {
  const now = new Date();
  const currentHour = now.getHours();

  // Find the next optimal time
  for (const timeStr of optimalTimes) {
    const hour = parseInt(timeStr.split(':')[0]);
    const isAM = timeStr.includes('AM');

    let studyHour = hour;
    if (isAM && hour === 12) studyHour = 0;
    else if (!isAM && hour !== 12) studyHour = hour;

    if (studyHour > currentHour) {
      return timeStr;
    }
  }

  // If all optimal times have passed, suggest the first one for tomorrow
  return optimalTimes[0];
}
