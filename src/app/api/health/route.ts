import { NextResponse } from 'next/server';

export function GET() {
    return NextResponse.json({
        status: 'ok',
        env: process.env.NODE_ENV,
        commit: process.env.RENDER_GIT_COMMIT ?? 'local',
    });
}
