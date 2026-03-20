import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

export async function POST(request: Request): Promise<Response> {
    try {
        const formData = await request.formData();
        const drawing = formData.get('drawing');

        if (drawing === null || !(drawing instanceof Blob)) {
            return Response.json({ valid: true });
        }

        if (drawing.size > MAX_FILE_SIZE) {
            return Response.json({ valid: false, reason: 'file too large' });
        }

        const arrayBuffer = await drawing.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const aiCall = anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 10,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/png',
                                data: base64,
                            },
                        },
                        {
                            type: 'text',
                            text: 'Does this drawing look like a star? Reply with only YES or NO.',
                        },
                    ],
                },
            ],
        });

        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000),
        );

        const result = await Promise.race([aiCall, timeout]);

        const firstBlock = result.content[0];
        if (firstBlock?.type !== 'text') {
            return Response.json({ valid: true });
        }

        const valid = firstBlock.text.toUpperCase().includes('YES');
        return Response.json({ valid });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[validate-drawing]', error);
        return Response.json({ valid: true });
    }
}
