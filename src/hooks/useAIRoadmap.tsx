import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RoadmapRequest {
  goal: string;
  timeline_weeks: number;
  available_hours_per_week: number;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
}

interface RoadmapResponse {
  success: boolean;
  study_plan: any;
  plan_items: any[];
  ai_insights: {
    reasoning: string;
    weekly_schedule: string;
    total_estimated_hours: number;
  };
}

export const useAIRoadmap = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const generateRoadmap = async (request: RoadmapRequest): Promise<RoadmapResponse | null> => {
    if (!session?.access_token) {
      setError('Authentication required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-roadmap', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      return data;
    } catch (err: any) {
      console.error('Error generating roadmap:', err);
      setError(err.message || 'Failed to generate AI roadmap');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateRoadmap,
    loading,
    error,
  };
};