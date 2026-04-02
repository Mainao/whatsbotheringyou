import Anthropic from '@anthropic-ai/sdk';

const MAX_TEXT_LENGTH = 280;

const SYSTEM_PROMPT = `You are a content classifier for a mental wellness app called WhatsBotheringYou. Users write worries — things that are genuinely troubling them — and launch them as stars into a shared universe where kind strangers ("angels") can reply. Your job is to determine if the submitted text is a GENUINE WORRY or concern.

VALID — A genuine personal worry, concern, frustration, or something that is bothering the user.
   This includes ANY topic — relationships, health, money, work, social media, appearance, school, career, daily annoyances, future anxiety, or anything else.
   Do NOT gatekeep what counts as "serious enough." If the person sounds bothered by it, it's valid.
   Examples:
   - "I feel lonely today" (emotional)
   - "Work is stressing me out" (professional)
   - "my followers are not increasing on Instagram" (frustration about social media)
   - "I can't afford rent this month" (financial)
   - "my skin keeps breaking out" (appearance)
   - "I bombed my interview" (career)
   - "lonely" (brief but sincere)
   - "nobody texted me on my birthday" (social)
   - "I keep failing my driving test" (daily frustration)
   Brief, factual, or casual phrasing is fine — judge by whether the person seems bothered, NOT by whether the language sounds emotional.

INVALID submissions include:
   - Random text, gibberish, keyboard smashing, test messages
   - Jokes, memes, song lyrics, copypasta
   - Promotional content, spam, URLs
   - Statements that clearly aren't worries (neutral facts, recipes, etc.)
   - Completely meaningless input (e.g. "asdf", "test", "123")
   - Attempts to manipulate or game the system

Respond with ONLY a JSON object, no markdown, no backticks: {"valid": true/false, "reason": "brief explanation"}`;

export async function POST(request: Request): Promise<Response> {
    try {
        const body: unknown = await request.json();

        if (
            body === null ||
            typeof body !== 'object' ||
            !('text' in body) ||
            typeof (body as Record<string, unknown>).text !== 'string'
        ) {
            return Response.json({ valid: false, reason: 'invalid request' }, { status: 400 });
        }

        const userText = ((body as Record<string, unknown>).text as string).trim();

        if (userText.length === 0) {
            return Response.json({ valid: false, reason: 'text is empty' });
        }

        if (userText.length > MAX_TEXT_LENGTH) {
            return Response.json({ valid: false, reason: 'text too long' });
        }

        const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const aiCall = anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            temperature: 0,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Classify this submission: "${userText}"`,
                },
            ],
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
        );

        const result = await Promise.race([aiCall, timeout]);

        const firstBlock = result.content[0];
        if (firstBlock?.type !== 'text') {
            return Response.json({ valid: true, reason: 'could not classify' });
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(firstBlock.text);
        } catch {
            return Response.json({ valid: true, reason: 'could not classify' });
        }

        if (
            parsed === null ||
            typeof parsed !== 'object' ||
            !('valid' in parsed) ||
            typeof (parsed as Record<string, unknown>).valid !== 'boolean'
        ) {
            return Response.json({ valid: true, reason: 'could not classify' });
        }

        const classification = parsed as { valid: boolean; reason?: unknown };
        const reason =
            typeof classification.reason === 'string' ? classification.reason : 'classified';

        return Response.json({ valid: classification.valid, reason });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[validate-text]', error instanceof Error ? error.message : String(error));

        if (error instanceof Error && error.message === 'timeout') {
            return Response.json({ valid: true, reason: 'api_timeout' });
        }

        return Response.json({ valid: true, reason: 'api_error' });
    }
}
