import {
  GeneratePodcastInput,
  GeneratePodcastInputSchema,
  GeneratedPodcastScript,
  GeneratedPodcastScriptSchema,
  PodcastDialogueTurn,
} from '../types/podcast';

export const SYSTEM_PODCAST_PROMPT_TEMPLATE = `
You are a master Islamic Studies scholar and AI podcast producer creating a NotebookLM-style 2-host audio commentary script.

SCHOLARLY GUARDRAILS & ROLES:
1. Host A (Scholar/Anchor):
   - Tone: Professional, deeply respectful, academically grounded, serene.
   - Function: Provides classical historical context, authentic Hadith chains (Isnad), verse citations, and explains Arabic terms (e.g. Niyyah, Ihsan, Zuhd, Athar).
2. Host B (Inquirer/Learner):
   - Tone: Curious, warm, reflective, articulate.
   - Function: Asks clarifying questions a modern listener would ask, connects classical wisdom to contemporary daily life, and highlights practical takeaways.
3. Strict Theological Accuracy:
   - NEVER fabricate narrations, Hadith, or historical events.
   - Accurately reflect the grade (Sahih, Hasan, or Athar) and scholars mentioned in the source material.
   - Maintain the utmost reverence for Allah (SWT), Prophet Muhammad (ﷺ), the Companions (RA), and classical scholars.

OUTPUT INSTRUCTIONS:
Transform the provided source narration into a structured 2-host podcast dialogue script adhering strictly to the JSON schema.
Ensure alternating, natural dialogue turns between Host A and Host B with estimated timestamp ranges.
`.trim();

export class PodcastScriptGenerator {
  private apiKey: string | undefined;
  private modelName: string;
  private allowFallback: boolean;

  constructor(options?: { apiKey?: string; modelName?: string; allowFallback?: boolean }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    this.modelName = options?.modelName || process.env.OPENAI_MODEL || 'gpt-4.1-mini';
    this.allowFallback = options?.allowFallback ?? process.env.NODE_ENV !== 'production';
  }

  /**
   * Generates a NotebookLM-style 2-host podcast script from classical Islamic text input.
   */
  async generateScript(input: GeneratePodcastInput): Promise<GeneratedPodcastScript> {
    const validatedInput = GeneratePodcastInputSchema.parse(input);

    if (this.apiKey) {
      try {
        return await this.callLLM(validatedInput);
      } catch (error) {
        console.warn('LLM API call failed, falling back to deterministic synthesis:', error);
      }
    }

    if (!this.allowFallback) {
      throw new Error('Podcast generation failed and deterministic fallback is disabled in production');
    }
    return this.synthesizeFallbackScript(validatedInput);
  }

  private async callLLM(input: GeneratePodcastInput): Promise<GeneratedPodcastScript> {
    const promptPayload = {
      systemPrompt: SYSTEM_PODCAST_PROMPT_TEMPLATE,
      userPayload: {
        category: input.category,
        referenceUrl: input.referenceUrl,
        scholarSpeaker: input.scholarSpeaker || 'Shaykh Saleh Ale ash-Shaykh',
        sourceContent: input.sourceText,
      },
      expectedOutputFormat: {
        storyId: 'string-slug',
        title: 'string',
        titleAr: 'string',
        category: input.category,
        referenceUrl: input.referenceUrl,
        scholarSpeaker: 'string',
        summary: 'string',
        keyTakeaways: ['string'],
        dialogueTurns: [
          {
            speaker: 'host_a | host_b',
            text: 'string',
            arabicTerms: ['string'],
            startMs: 'number',
            endMs: 'number',
          },
        ],
        totalDurationMs: 'number',
      },
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: promptPayload.systemPrompt },
          {
            role: 'user',
            content: `Generate a structured 2-host podcast script for the following input:\n${JSON.stringify(
              promptPayload.userPayload,
              null,
              2,
            )}`,
          },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const rawJson = JSON.parse(data.choices[0]!.message.content);
    return GeneratedPodcastScriptSchema.parse(rawJson);
  }

  private synthesizeFallbackScript(input: GeneratePodcastInput): GeneratedPodcastScript {
    const title = input.title || 'Abdullah ibn Mas’ud on Knowledge & Intention';
    const titleAr = input.titleAr || 'عبد الله بن مسعود: فضل العلم وإخلاص النية';
    const scholar = input.scholarSpeaker || 'Shaykh Saleh Ale ash-Shaykh';

    const dialogueTurns: PodcastDialogueTurn[] = [
      {
        id: 'turn-1',
        speaker: 'host_a',
        text: `Assalamu Alaikum and welcome to NotebookLM Islamic Wisdom. Today we discuss a profound transmission regarding ${title}.`,
        arabicTerms: ['Assalamu Alaikum', 'Isnad'],
        startMs: 0,
        endMs: 12000,
      },
      {
        id: 'turn-2',
        speaker: 'host_b',
        text: `Wa Alaikum Assalam! This narration is particularly compelling. How does classical scholarship contextualize this statement?`,
        arabicTerms: ['Wa Alaikum Assalam'],
        startMs: 12000,
        endMs: 24000,
      },
      {
        id: 'turn-3',
        speaker: 'host_a',
        text: `The core passage emphasizes: "${input.sourceText.slice(0, 120)}...". Classical scholars note that authentic knowledge is inseparable from Niyyah (sincere intention) and active implementation.`,
        arabicTerms: ['Niyyah', 'Ilm', 'Amal'],
        startMs: 24000,
        endMs: 45000,
      },
      {
        id: 'turn-4',
        speaker: 'host_b',
        text: 'That directly challenges modern habits of collecting information without personal transformation! How can a believer apply this today?',
        arabicTerms: ['Tazkiyah'],
        startMs: 45000,
        endMs: 60000,
      },
      {
        id: 'turn-5',
        speaker: 'host_a',
        text: 'By renewing one’s intention before seeking knowledge, acting upon even a single authentic Hadith learned, and maintaining utmost humility before Allah.',
        arabicTerms: ['Ikhlas', 'Ihsan'],
        startMs: 60000,
        endMs: 78000,
      },
    ];

    return GeneratedPodcastScriptSchema.parse({
      storyId: 'gleaning-ibn-masud-generated',
      title,
      titleAr,
      category: input.category,
      referenceUrl: input.referenceUrl,
      scholarSpeaker: scholar,
      summary:
        'A two-host conversational analysis of the classical narration on knowledge, action, and sincere intention.',
      keyTakeaways: [
        'Knowledge without sincere practice is an incomplete trust.',
        'Niyyah (intention) converts intellectual study into heavy spiritual worship.',
        'True scholarship is manifested through humility and character.',
      ],
      dialogueTurns,
      totalDurationMs: 78000,
    });
  }
}

export default new PodcastScriptGenerator();
