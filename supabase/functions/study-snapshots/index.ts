import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser, Document } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

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
    const action = url.searchParams.get('action') || 'generate';

    switch (action) {
      case 'generate':
        return await handleSnapshotGeneration(supabaseClient, user, req);
      case 'download':
        return await handleSnapshotDownload(supabaseClient, user, req);
      case 'share':
        return await handleSnapshotSharing(supabaseClient, user, req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in study-snapshots function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Generate study snapshot
async function handleSnapshotGeneration(supabaseClient, user, req) {
  const {
    snapshot_type = 'comprehensive',
    include_progress = true,
    include_plans = true,
    include_calendar = true,
    date_range = 'week'
  } = await req.json();

  // Get user's data based on snapshot type
  const snapshotData = await generateSnapshotData(
    supabaseClient,
    user.id,
    snapshot_type,
    include_progress,
    include_plans,
    include_calendar,
    date_range
  );

  // Generate HTML content for the snapshot
  const htmlContent = await generateSnapshotHTML(snapshotData, user);

  // Create PDF using a PDF generation service (would need external service in production)
  const pdfBuffer = await generatePDF(htmlContent);

  // Store snapshot in database
  const { data: snapshot, error: snapshotError } = await supabaseClient
    .from('snapshots')
    .insert({
      user_id: user.id,
      title: `${snapshot_type.charAt(0).toUpperCase() + snapshot_type.slice(1)} Study Snapshot - ${new Date().toLocaleDateString()}`,
      snapshot_data: snapshotData,
      generated_at: new Date().toISOString(),
      is_exported: true
    })
    .select()
    .single();

  if (snapshotError) {
    console.error('Error storing snapshot:', snapshotError);
    throw new Error('Failed to store snapshot');
  }

  // In production, you'd upload the PDF to cloud storage and get a URL
  // For now, we'll return the HTML content
  return new Response(
    JSON.stringify({
      success: true,
      snapshot: snapshot,
      download_url: `/api/snapshots/download/${snapshot.id}`,
      html_content: htmlContent,
      metadata: {
        generation_time: Date.now(),
        data_points: countDataPoints(snapshotData),
        snapshot_type,
        date_range
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle snapshot download
async function handleSnapshotDownload(supabaseClient, user, req) {
  const url = new URL(req.url);
  const snapshotId = url.pathname.split('/').pop();

  if (!snapshotId) {
    return new Response(
      JSON.stringify({ error: "Snapshot ID required" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Get snapshot data
  const { data: snapshot, error: snapshotError } = await supabaseClient
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .eq('user_id', user.id)
    .single();

  if (snapshotError || !snapshot) {
    return new Response(
      JSON.stringify({ error: "Snapshot not found" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  // Generate HTML content
  const htmlContent = await generateSnapshotHTML(snapshot.snapshot_data, user);

  // Return HTML content as downloadable file
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="study-snapshot-${snapshotId}.html"`
    }
  });
}

// Handle snapshot sharing
async function handleSnapshotSharing(supabaseClient, user, req) {
  const { snapshot_id, share_type = 'link' } = await req.json();

  if (!snapshot_id) {
    return new Response(
      JSON.stringify({ error: "Snapshot ID required" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Verify snapshot ownership
  const { data: snapshot, error: snapshotError } = await supabaseClient
    .from('snapshots')
    .select('*')
    .eq('id', snapshot_id)
    .eq('user_id', user.id)
    .single();

  if (snapshotError || !snapshot) {
    return new Response(
      JSON.stringify({ error: "Snapshot not found" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  let shareUrl = '';
  let shareData = {};

  if (share_type === 'link') {
    // Generate shareable link (would need URL shortening service in production)
    shareUrl = `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/shared/snapshot/${snapshot_id}`;
    shareData = {
      share_type: 'link',
      share_url: shareUrl,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
  } else if (share_type === 'pdf') {
    // Generate PDF for sharing
    const htmlContent = await generateSnapshotHTML(snapshot.snapshot_data, user);
    const pdfBuffer = await generatePDF(htmlContent);

    // In production, upload PDF and return URL
    shareData = {
      share_type: 'pdf',
      download_url: `/api/snapshots/download/${snapshot_id}`,
      file_size: pdfBuffer.length
    };
  }

  // Store share information
  await supabaseClient
    .from('snapshots')
    .update({
      metadata: { ...snapshot.metadata, share_data: shareData }
    })
    .eq('id', snapshot_id);

  return new Response(
    JSON.stringify({
      success: true,
      share_data: shareData,
      message: `Snapshot shared successfully via ${share_type}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Generate comprehensive snapshot data
async function generateSnapshotData(supabaseClient, userId, snapshotType, includeProgress, includePlans, includeCalendar, dateRange) {
  const data = {
    generated_at: new Date().toISOString(),
    snapshot_type: snapshotType,
    date_range: dateRange,
    user_id: userId,
    sections: {}
  };

  // Calculate date range
  const now = new Date();
  let startDate;

  switch (dateRange) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Progress section
  if (includeProgress) {
    const { data: progressLogs } = await supabaseClient
      .from('progress_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    data.sections.progress = {
      total_sessions: progressLogs?.length || 0,
      average_correctness: calculateAverage(progressLogs?.map(p => p.correctness) || []),
      average_confidence: calculateAverage(progressLogs?.map(p => p.confidence_after) || []),
      topics_studied: [...new Set(progressLogs?.map(p => p.concept_id).filter(Boolean) || [])],
      recent_activities: progressLogs?.slice(0, 10) || []
    };
  }

  // Study plans section
  if (includePlans) {
    const { data: studyPlans } = await supabaseClient
      .from('study_plans')
      .select(`
        *,
        plan_items (
          id,
          title,
          status,
          confidence_level,
          completed_at
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    data.sections.study_plans = {
      active_plans: studyPlans?.length || 0,
      total_plan_items: studyPlans?.reduce((sum, plan) => sum + (plan.plan_items?.length || 0), 0) || 0,
      completed_items: studyPlans?.reduce((sum, plan) =>
        sum + (plan.plan_items?.filter(item => item.status === 'completed').length || 0), 0) || 0,
      plans: studyPlans || []
    };
  }

  // Calendar section (mock data for now)
  if (includeCalendar) {
    data.sections.calendar = {
      upcoming_sessions: 5,
      completed_sessions: 12,
      study_streaks: 7,
      weekly_goal_progress: 85
    };
  }

  return data;
}

// Generate HTML content for snapshot
async function generateSnapshotHTML(snapshotData, user) {
  const progressSection = snapshotData.sections.progress ? `
    <section class="snapshot-section">
      <h2>📊 Study Progress</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Total Sessions</h3>
          <p class="metric-value">${snapshotData.sections.progress.total_sessions}</p>
        </div>
        <div class="metric-card">
          <h3>Average Correctness</h3>
          <p class="metric-value">${Math.round(snapshotData.sections.progress.average_correctness * 100)}%</p>
        </div>
        <div class="metric-card">
          <h3>Average Confidence</h3>
          <p class="metric-value">${snapshotData.sections.progress.average_confidence.toFixed(1)}/5</p>
        </div>
        <div class="metric-card">
          <h3>Topics Studied</h3>
          <p class="metric-value">${snapshotData.sections.progress.topics_studied.length}</p>
        </div>
      </div>
    </section>
  ` : '';

  const plansSection = snapshotData.sections.study_plans ? `
    <section class="snapshot-section">
      <h2>📋 Study Plans</h2>
      <div class="plans-summary">
        <p><strong>Active Plans:</strong> ${snapshotData.sections.study_plans.active_plans}</p>
        <p><strong>Plan Items:</strong> ${snapshotData.sections.study_plans.total_plan_items}</p>
        <p><strong>Completed:</strong> ${snapshotData.sections.study_plans.completed_items}</p>
        <p><strong>Completion Rate:</strong> ${snapshotData.sections.study_plans.total_plan_items > 0 ?
          Math.round((snapshotData.sections.study_plans.completed_items / snapshotData.sections.study_plans.total_plan_items) * 100) : 0}%</p>
      </div>
    </section>
  ` : '';

  const calendarSection = snapshotData.sections.calendar ? `
    <section class="snapshot-section">
      <h2>📅 Study Calendar</h2>
      <div class="calendar-metrics">
        <p><strong>Upcoming Sessions:</strong> ${snapshotData.sections.calendar.upcoming_sessions}</p>
        <p><strong>Completed Sessions:</strong> ${snapshotData.sections.calendar.completed_sessions}</p>
        <p><strong>Current Streak:</strong> ${snapshotData.sections.calendar.study_streaks} days</p>
        <p><strong>Weekly Goal:</strong> ${snapshotData.sections.calendar.weekly_goal_progress}%</p>
      </div>
    </section>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Study Snapshot - ${user.email}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                line-height: 1.6;
            }
            .snapshot-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            .snapshot-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px;
                text-align: center;
            }
            .snapshot-header h1 {
                margin: 0 0 10px 0;
                font-size: 2.5rem;
                font-weight: 300;
            }
            .snapshot-header p {
                margin: 0;
                opacity: 0.9;
                font-size: 1.1rem;
            }
            .snapshot-content {
                padding: 40px;
            }
            .snapshot-section {
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 1px solid #eee;
            }
            .snapshot-section:last-child {
                border-bottom: none;
            }
            .snapshot-section h2 {
                color: #667eea;
                margin-bottom: 20px;
                font-size: 1.5rem;
            }
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .metric-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                border-left: 4px solid #667eea;
            }
            .metric-card h3 {
                margin: 0 0 10px 0;
                color: #666;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .metric-value {
                margin: 0;
                font-size: 2rem;
                font-weight: bold;
                color: #333;
            }
            .plans-summary {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 8px;
                border-left: 4px solid #764ba2;
            }
            .plans-summary p {
                margin: 8px 0;
                font-size: 1.1rem;
            }
            .calendar-metrics {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 8px;
                border-left: 4px solid #4CAF50;
            }
            .calendar-metrics p {
                margin: 8px 0;
                font-size: 1.1rem;
            }
            .snapshot-footer {
                background: #f8f9fa;
                padding: 20px 40px;
                text-align: center;
                color: #666;
                font-size: 0.9rem;
            }
            @media (max-width: 600px) {
                body {
                    padding: 20px;
                }
                .snapshot-header {
                    padding: 30px 20px;
                }
                .snapshot-content {
                    padding: 30px 20px;
                }
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="snapshot-container">
            <div class="snapshot-header">
                <h1>📚 Study Snapshot</h1>
                <p>Generated on ${new Date(snapshotData.generated_at).toLocaleDateString()}</p>
                <p>Snapshot Type: ${snapshotData.snapshot_type} | Period: ${snapshotData.date_range}</p>
            </div>
            <div class="snapshot-content">
                ${progressSection}
                ${plansSection}
                ${calendarSection}
            </div>
            <div class="snapshot-footer">
                <p>Generated by StudyForge - AI-Powered Study Planning & Tracking</p>
                <p>Export your progress and share your learning journey</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Generate PDF from HTML (mock implementation)
async function generatePDF(htmlContent) {
  // In production, this would use a PDF generation service like Puppeteer or Playwright
  // For now, we'll return a mock buffer
  console.log('PDF generation would happen here in production');
  return new Uint8Array(1000); // Mock PDF buffer
}

// Helper functions
function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

function countDataPoints(snapshotData) {
  let count = 0;
  if (snapshotData.sections.progress) {
    count += snapshotData.sections.progress.total_sessions +
             snapshotData.sections.progress.topics_studied.length;
  }
  if (snapshotData.sections.study_plans) {
    count += snapshotData.sections.study_plans.active_plans +
             snapshotData.sections.study_plans.total_plan_items;
  }
  return count;
}
