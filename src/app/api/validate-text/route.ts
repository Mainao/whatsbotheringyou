import Anthropic from '@anthropic-ai/sdk';

const MAX_TEXT_LENGTH = 280;

const WORRY_SYSTEM_PROMPT = `You are a content classifier for a mental wellness app called WhatsBotheringYou. Users write worries — things that are genuinely troubling them — and launch them as stars into a shared universe where kind strangers ("angels") can reply. Your job is to determine if the submitted text is a GENUINE WORRY or concern.

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

const CRISIS_SYSTEM_PROMPT = `Classify this message as "crisis", "harmful", or "safe".

"crisis" means ONLY: the person explicitly expresses intent to end their own life or physically harm themselves.
Examples: "I want to die", "I'm going to kill myself", "I've been cutting myself", "this is my last night alive".

"harmful" means: the message contains violence-related language including threats, intent to harm, or expressions about hitting, punching, slapping, fighting, killing, or hurting others.
Examples: "I want to kill someone", "I want to punch someone", "I would like to slap him", "I want to hit her", "I'm going to hurt her", "people like them should die", "I want to beat him up".

Everything else is "safe". This includes:
- Sadness, anger, frustration, loneliness, anxiety, stress
- Swearing and profanity of any kind and intensity
- Vague hopelessness without suicidal intent
- Anger at others or the world without specific threats of violence
- Metaphorical language ("this is killing me", "I'm dead inside")
- Venting frustration ("I want to punch someone", "I could scream") — vague anger is NOT harmful
- Text that is not clearly in English — return "safe"
- Anger and frustration expressed WITHOUT violence ("I'm so angry", "I hate everything", "fuck this shit", "I can't stand my boss") — anger is safe, violence is not

The difference:
- "I want to die" = crisis  "I want to kill someone" = harmful (threat to others)
- "I want to punch someone" = safe (venting, no real threat)
- "I could kill my boss" = safe (common expression, not a real threat)

The key distinction for "harmful" is SPECIFIC and SERIOUS intent to harm ANOTHER person.
Casual/hyperbolic anger ("I could kill him", "she's dead to me") is always "safe" — these are common expressions, not real threats.

Respond ONLY with: {"result": "safe"} or {"result": "crisis"} or {"result": "harmful"}`;

async function validateWorry(
    anthropic: Anthropic,
    text: string,
): Promise<{ status: 'valid' | 'invalid'; reason: string }> {
    try {
        const aiCall = anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            temperature: 0,
            system: WORRY_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: `Classify this submission: "${text}"` }],
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
        );

        const result = await Promise.race([aiCall, timeout]);
        const firstBlock = result.content[0];

        if (firstBlock?.type !== 'text') {
            return { status: 'valid', reason: 'could not classify' };
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(firstBlock.text);
        } catch {
            return { status: 'valid', reason: 'could not classify' };
        }

        if (
            parsed === null ||
            typeof parsed !== 'object' ||
            !('valid' in parsed) ||
            typeof (parsed as Record<string, unknown>).valid !== 'boolean'
        ) {
            return { status: 'valid', reason: 'could not classify' };
        }

        const classification = parsed as { valid: boolean; reason?: unknown };
        const reason =
            typeof classification.reason === 'string' ? classification.reason : 'classified';

        return { status: classification.valid ? 'valid' : 'invalid', reason };
    } catch {
        return { status: 'valid', reason: 'api_error' };
    }
}

async function detectLanguage(anthropic: Anthropic, text: string): Promise<'english' | 'other'> {
    try {
        const aiCall = anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 20,
            temperature: 0,
            system: 'Is this text in English? Respond ONLY with: {"english": true} or {"english": false}',
            messages: [{ role: 'user', content: text }],
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000),
        );

        const result = await Promise.race([aiCall, timeout]);
        const block = result.content[0];

        if (block?.type !== 'text') return 'english';

        let parsed: unknown;
        try {
            parsed = JSON.parse(block.text);
        } catch {
            return 'english';
        }

        if (
            parsed !== null &&
            typeof parsed === 'object' &&
            'english' in parsed &&
            (parsed as Record<string, unknown>).english === false
        ) {
            return 'other';
        }

        return 'english';
    } catch {
        return 'english';
    }
}

async function checkCrisis(
    anthropic: Anthropic,
    text: string,
): Promise<{ result: 'safe' | 'crisis' | 'harmful' }> {
    try {
        const aiCall = anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 50,
            temperature: 0,
            system: CRISIS_SYSTEM_PROMPT,
            messages: [{ role: 'user', content: `Message: "${text}"` }],
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
        );

        const result = await Promise.race([aiCall, timeout]);
        const firstBlock = result.content[0];

        if (firstBlock?.type !== 'text') {
            return { result: 'crisis' };
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(firstBlock.text);
        } catch {
            return { result: 'crisis' };
        }

        if (parsed !== null && typeof parsed === 'object' && 'result' in parsed) {
            const r = (parsed as Record<string, unknown>).result;
            if (r === 'safe') return { result: 'safe' };
            if (r === 'harmful') return { result: 'harmful' };
        }

        return { result: 'crisis' };
    } catch {
        // Fail safe: errors in crisis detection are treated as crisis.
        // It is better to show a helpline unnecessarily than to miss someone in danger.
        return { result: 'crisis' };
    }
}

export async function POST(request: Request): Promise<Response> {
    try {
        const body: unknown = await request.json();

        if (
            body === null ||
            typeof body !== 'object' ||
            !('text' in body) ||
            typeof (body as Record<string, unknown>).text !== 'string'
        ) {
            return Response.json({ status: 'invalid', reason: 'invalid request' }, { status: 400 });
        }

        const userText = ((body as Record<string, unknown>).text as string).trim();

        if (userText.length === 0) {
            return Response.json({ status: 'invalid', reason: 'text is empty' });
        }

        if (userText.length > MAX_TEXT_LENGTH) {
            return Response.json({ status: 'invalid', reason: 'text too long' });
        }

        // Regex check — free, catches non-ASCII scripts (Hindi, Arabic, CJK, emoji-only, etc.)
        const nonAsciiRatio = (userText.match(/[^\x00-\x7F]/g) ?? []).length / userText.length;
        if (nonAsciiRatio > 0.1) {
            return Response.json({ status: 'invalid', reason: 'non-english' });
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        // Pass 0: Language detection — catches romanized non-English (Hindi, Spanish, French, etc.)
        const lang = await detectLanguage(anthropic, userText);
        if (lang === 'other') {
            return Response.json({ status: 'invalid', reason: 'non-english' });
        }

        // Pass 1: Worry validation
        const worryResult = await validateWorry(anthropic, userText);

        if (worryResult.status === 'invalid') {
            return Response.json({ status: 'invalid', reason: worryResult.reason });
        }

        // Pass 2: Crisis detection — only runs when Pass 1 returns valid
        const crisisResult = await checkCrisis(anthropic, userText);

        if (crisisResult.result === 'crisis') {
            return Response.json({ status: 'crisis', reason: 'needs support' });
        }

        if (crisisResult.result === 'harmful') {
            return Response.json({ status: 'invalid', reason: 'harmful' });
        }

        return Response.json({ status: 'valid', reason: worryResult.reason });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[validate-text]', error instanceof Error ? error.message : String(error));
        return Response.json({ status: 'valid', reason: 'api_error' });
    }
}
