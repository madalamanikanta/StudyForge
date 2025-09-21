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
    const action = url.searchParams.get('action') || 'match';

    switch (action) {
      case 'match':
        return await handlePeerMatching(supabaseClient, user, req);
      case 'create_room':
        return await handleCreateRoom(supabaseClient, user, req);
      case 'join_room':
        return await handleJoinRoom(supabaseClient, user, req);
      case 'leave_room':
        return await handleLeaveRoom(supabaseClient, user, req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in peer-study-rooms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Handle peer matching
async function handlePeerMatching(supabaseClient, user, req) {
  const { topics = [], max_wait_time = 300 } = await req.json(); // 5 minutes default

  // Get user's study preferences
  const { data: userProfile, error: profileError } = await supabaseClient
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error('Failed to fetch user preferences');
  }

  // Find compatible peers
  const compatiblePeers = await findCompatiblePeers(
    supabaseClient,
    user.id,
    topics,
    userProfile?.timezone || 'UTC',
    userProfile?.study_times || []
  );

  if (compatiblePeers.length === 0) {
    return new Response(
      JSON.stringify({
        success: true,
        matches: [],
        message: 'No compatible peers found at this time. Try again later or adjust your preferences.',
        wait_time: max_wait_time
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create a micro-study room
  const roomId = generateRoomId();
  const roomExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

  const roomData = {
    id: roomId,
    created_by: user.id,
    topic: topics[0] || 'General Study',
    max_participants: 4,
    current_participants: 1,
    status: 'waiting',
    expires_at: roomExpiry,
    privacy_settings: {
      allow_screen_share: true,
      allow_voice_chat: true,
      require_approval: false,
      ephemeral: true
    },
    participant_preferences: {
      [user.id]: {
        topics: topics,
        goals: userProfile?.study_goals || [],
        skill_level: userProfile?.skill_level || 'intermediate'
      }
    }
  };

  const { data: createdRoom, error: roomError } = await supabaseClient
    .from('study_rooms')
    .insert(roomData)
    .select()
    .single();

  if (roomError) {
    console.error('Error creating study room:', roomError);
    throw new Error('Failed to create study room');
  }

  // Add user to room participants
  await supabaseClient
    .from('room_participants')
    .insert({
      room_id: roomId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      status: 'active'
    });

  return new Response(
    JSON.stringify({
      success: true,
      room: createdRoom,
      matches: compatiblePeers.slice(0, 3),
      message: 'Study room created! Share this room ID with peers: ' + roomId
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle room creation
async function handleCreateRoom(supabaseClient, user, req) {
  const { topic, max_participants = 4, privacy_settings = {} } = await req.json();

  const roomId = generateRoomId();
  const roomExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const defaultPrivacy = {
    allow_screen_share: true,
    allow_voice_chat: true,
    require_approval: false,
    ephemeral: true,
    hide_grades: true,
    anonymous_participation: false
  };

  const roomData = {
    id: roomId,
    created_by: user.id,
    topic: topic || 'General Study',
    max_participants: max_participants,
    current_participants: 1,
    status: 'waiting',
    expires_at: roomExpiry,
    privacy_settings: { ...defaultPrivacy, ...privacy_settings }
  };

  const { data: createdRoom, error: roomError } = await supabaseClient
    .from('study_rooms')
    .insert(roomData)
    .select()
    .single();

  if (roomError) {
    throw new Error('Failed to create study room');
  }

  // Add creator to participants
  await supabaseClient
    .from('room_participants')
    .insert({
      room_id: roomId,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      status: 'active'
    });

  return new Response(
    JSON.stringify({
      success: true,
      room: createdRoom,
      message: 'Study room created successfully! Room ID: ' + roomId
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle joining a room
async function handleJoinRoom(supabaseClient, user, req) {
  const { room_id } = await req.json();

  if (!room_id) {
    return new Response(
      JSON.stringify({ error: "Room ID is required" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Check if room exists and is joinable
  const { data: room, error: roomError } = await supabaseClient
    .from('study_rooms')
    .select('*')
    .eq('id', room_id)
    .single();

  if (roomError || !room) {
    return new Response(
      JSON.stringify({ error: "Room not found or expired" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  }

  if (room.status === 'ended' || room.current_participants >= room.max_participants) {
    return new Response(
      JSON.stringify({ error: "Room is full or has ended" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
    );
  }

  // Check if user is already in room
  const { data: existingParticipant } = await supabaseClient
    .from('room_participants')
    .select('*')
    .eq('room_id', room_id)
    .eq('user_id', user.id)
    .single();

  if (existingParticipant) {
    return new Response(
      JSON.stringify({
        success: true,
        message: "Already in room",
        room: room
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Add user to room
  const { error: joinError } = await supabaseClient
    .from('room_participants')
    .insert({
      room_id: room_id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      status: 'active'
    });

  if (joinError) {
    throw new Error('Failed to join room');
  }

  // Update room participant count
  await supabaseClient
    .from('study_rooms')
    .update({
      current_participants: room.current_participants + 1,
      status: room.current_participants + 1 >= 2 ? 'active' : 'waiting'
    })
    .eq('id', room_id);

  return new Response(
    JSON.stringify({
      success: true,
      message: "Successfully joined room!",
      room: { ...room, current_participants: room.current_participants + 1 }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle leaving a room
async function handleLeaveRoom(supabaseClient, user, req) {
  const { room_id } = await req.json();

  if (!room_id) {
    return new Response(
      JSON.stringify({ error: "Room ID is required" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }

  // Remove user from room
  const { error: leaveError } = await supabaseClient
    .from('room_participants')
    .delete()
    .eq('room_id', room_id)
    .eq('user_id', user.id);

  if (leaveError) {
    throw new Error('Failed to leave room');
  }

  // Update room status if needed
  const { data: room } = await supabaseClient
    .from('study_rooms')
    .select('current_participants, created_by')
    .eq('id', room_id)
    .single();

  if (room && room.current_participants <= 1) {
    await supabaseClient
      .from('study_rooms')
      .update({ status: 'ended' })
      .eq('id', room_id);
  } else if (room) {
    await supabaseClient
      .from('study_rooms')
      .update({ current_participants: room.current_participants - 1 })
      .eq('id', room_id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "Successfully left the room"
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Find compatible peers based on topics, timezone, and availability
async function findCompatiblePeers(supabaseClient, userId, topics, userTimezone, userStudyTimes) {
  // Get users looking for study partners
  const { data: availableUsers, error: usersError } = await supabaseClient
    .from('user_preferences')
    .select('user_id, study_goals, skill_level, timezone, study_times, topics')
    .neq('user_id', userId)
    .not('looking_for_partners', 'is', null)
    .eq('looking_for_partners', true);

  if (usersError) {
    console.error('Error fetching available users:', usersError);
    return [];
  }

  const compatiblePeers = [];

  for (const peer of availableUsers || []) {
    const compatibilityScore = calculateCompatibility(
      topics,
      userTimezone,
      userStudyTimes,
      peer.topics || [],
      peer.timezone || 'UTC',
      peer.study_times || []
    );

    if (compatibilityScore >= 0.6) { // 60% compatibility threshold
      const { data: userData } = await supabaseClient.auth.admin.getUserById(peer.user_id);
      compatiblePeers.push({
        user_id: peer.user_id,
        email: userData.user?.email,
        compatibility_score: compatibilityScore,
        common_topics: findCommonTopics(topics, peer.topics || []),
        timezone_match: userTimezone === peer.timezone
      });
    }
  }

  return compatiblePeers
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .slice(0, 5); // Return top 5 matches
}

// Calculate compatibility score between two users
function calculateCompatibility(userTopics, userTimezone, userStudyTimes, peerTopics, peerTimezone, peerStudyTimes) {
  let score = 0;

  // Topic compatibility (40% weight)
  const commonTopics = findCommonTopics(userTopics, peerTopics);
  const topicScore = commonTopics.length / Math.max(userTopics.length, peerTopics.length, 1);
  score += topicScore * 0.4;

  // Timezone compatibility (30% weight)
  if (userTimezone === peerTimezone) {
    score += 0.3;
  } else {
    // Partial credit for close timezones (within 3 hours)
    const tzDiff = Math.abs(timezoneDiffHours(userTimezone, peerTimezone));
    if (tzDiff <= 3) {
      score += 0.15;
    }
  }

  // Study time compatibility (30% weight)
  const timeOverlap = calculateTimeOverlap(userStudyTimes, peerStudyTimes);
  score += timeOverlap * 0.3;

  return Math.min(1.0, score);
}

// Calculate time overlap between two users' study schedules
function calculateTimeOverlap(userTimes, peerTimes) {
  if (!userTimes.length || !peerTimes.length) return 0;

  let maxOverlap = 0;

  for (const userTime of userTimes) {
    for (const peerTime of peerTimes) {
      const overlap = calculateOverlapHours(userTime, peerTime);
      maxOverlap = Math.max(maxOverlap, overlap);
    }
  }

  return maxOverlap / 8; // Normalize to 0-1 (8 hours being perfect overlap)
}

// Calculate overlap hours between two time ranges
function calculateOverlapHours(time1, time2) {
  const start1 = new Date(`1970-01-01T${time1.start}:00`);
  const end1 = new Date(`1970-01-01T${time1.end}:00`);
  const start2 = new Date(`1970-01-01T${time2.start}:00`);
  const end2 = new Date(`1970-01-01T${time2.end}:00`);

  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart >= overlapEnd) return 0;

  return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
}

// Find common topics between two arrays
function findCommonTopics(topics1, topics2) {
  return topics1.filter(topic => topics2.includes(topic));
}

// Generate a unique room ID
function generateRoomId() {
  return 'room_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Calculate timezone difference in hours
function timezoneDiffHours(tz1, tz2) {
  // This is a simplified calculation - in production you'd want a proper timezone library
  const timezoneOffsets = {
    'UTC': 0, 'EST': -5, 'PST': -8, 'CST': -6, 'MST': -7,
    'GMT': 0, 'CET': 1, 'JST': 9, 'IST': 5.5
  };

  const offset1 = timezoneOffsets[tz1] || 0;
  const offset2 = timezoneOffsets[tz2] || 0;

  return offset1 - offset2;
}
