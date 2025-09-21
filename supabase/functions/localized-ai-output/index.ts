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

    const {
      prompt,
      output_language = 'en',
      output_level = 'intermediate',
      verify_mode = false,
      context = ''
    } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing localized AI request:', {
      output_language,
      output_level,
      verify_mode,
      prompt_length: prompt.length
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build system prompt based on parameters
    const systemPrompt = buildSystemPrompt(output_language, output_level, verify_mode, context);

    // Generate AI response
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: verify_mode ? 0.1 : 0.3, // Lower temperature in verify mode
        max_tokens: 4000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const responseContent = openAIData.choices[0].message.content;

    // Parse response if it's structured JSON
    let parsedResponse = responseContent;
    try {
      parsedResponse = JSON.parse(responseContent);
    } catch (parseError) {
      // Response is plain text, keep as is
    }

    // Store request for analytics and debugging
    const { error: logError } = await supabaseClient
      .from('progress_logs')
      .insert({
        user_id: user.id,
        concept_id: 'ai_localized_response',
        activity_type: 'ai_interaction',
        notes: `Localized AI request: ${output_language}/${output_level}, verify: ${verify_mode}`,
        metadata: {
          request_params: { output_language, output_level, verify_mode },
          prompt_length: prompt.length,
          response_length: responseContent.length,
          model_used: 'gpt-4o-mini'
        }
      });

    if (logError) {
      console.error('Error logging AI interaction:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: parsedResponse,
        metadata: {
          output_language,
          output_level,
          verify_mode,
          processing_time: Date.now(),
          tokens_used: openAIData.usage?.total_tokens || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in localized-ai-output function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Build system prompt based on user preferences
function buildSystemPrompt(language, level, verifyMode, context) {
  const languageInstructions = getLanguageInstructions(language);
  const levelInstructions = getLevelInstructions(level);
  const verifyInstructions = getVerifyInstructions(verifyMode);

  const prompt = `You are an expert AI assistant that provides ${level}-level educational content in ${language}.

${languageInstructions}

${levelInstructions}

${verifyInstructions}

${context ? `Context: ${context}` : ''}

Always structure your response in a clear, educational format.`;

  return prompt;
}

// Get language-specific instructions
function getLanguageInstructions(language) {
  const instructions = {
    'en': 'Respond in clear, natural English.',
    'es': 'Responde en español claro y natural.',
    'fr': 'Réponds en français clair et naturel.',
    'de': 'Antworte auf Deutsch klar und natürlich.',
    'zh': '用清晰自然的中文回答。',
    'ja': '明確で自然な日本語で答えてください。',
    'ko': '명확하고 자연스러운 한국어로 답변하세요.',
    'hi': 'स्पष्ट और प्राकृतिक हिंदी में उत्तर दें।',
    'simple': 'Use simple, easy-to-understand language suitable for beginners or non-native speakers.',
    'technical': 'Use precise, technical terminology appropriate for advanced learners.',
    'academic': 'Use formal, academic language with proper citations when relevant.'
  };

  return instructions[language] || instructions['en'];
}

// Get level-specific instructions
function getLevelInstructions(level) {
  const instructions = {
    'beginner': `Provide explanations at a beginner level:
    - Use simple language and analogies
    - Break down complex concepts into basic steps
    - Include examples from everyday life
    - Avoid jargon or explain it when used
    - Focus on fundamental understanding`,

    'intermediate': `Provide explanations at an intermediate level:
    - Assume basic knowledge of the subject
    - Use some technical terminology
    - Include practical examples and applications
    - Connect concepts to show relationships
    - Encourage deeper understanding`,

    'advanced': `Provide explanations at an advanced level:
    - Use precise technical terminology
    - Include theoretical background
    - Discuss edge cases and advanced applications
    - Reference related research or methodologies
    - Challenge the user to think critically`
  };

  return instructions[level] || instructions['intermediate'];
}

// Get verification instructions
function getVerifyInstructions(verifyMode) {
  if (!verifyMode) {
    return `Provide helpful, informative responses. While accuracy is important, focus on clarity and usefulness.`;
  }

  return `VERIFICATION MODE ENABLED: You must ensure maximum accuracy and provide verifiable information.
  Requirements:
  1. Include specific source references when making factual claims
  2. Cite reputable sources (textbooks, academic papers, official documentation)
  3. Provide URLs or specific references when possible
  4. If information cannot be verified, clearly state this limitation
  5. Use precise, factual language and avoid speculation
  6. Structure responses with clear evidence-based reasoning

  When providing explanations:
  - Start with verified facts
  - Explain the reasoning behind each point
  - Reference sources for key claims
  - Note confidence levels for uncertain information`;
}

// Utility function to detect user language preference
function detectLanguage(text) {
  // Simple language detection based on common words
  const languagePatterns = {
    'es': ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'se', 'no'],
    'fr': ['le', 'la', 'de', 'et', 'à', 'un', 'il', 'être', 'et'],
    'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit'],
    'zh': ['的', '一', '是', '在', '我', '有', '他', '这', '个'],
    'ja': ['の', 'に', 'は', 'を', 'た', 'が', 'て', 'で', 'と'],
    'ko': ['의', '에', '는', '을', '를', '이', '가', '와', '한']
  };

  const words = text.toLowerCase().split(/\s+/);
  const scores = {};

  for (const [lang, patterns] of Object.entries(languagePatterns)) {
    scores[lang] = patterns.filter(pattern => words.includes(pattern)).length;
  }

  const bestMatch = Object.entries(scores).sort(([,a], [,b]) => b - a)[0];
  return bestMatch[1] > 0 ? bestMatch[0] : 'en';
}
