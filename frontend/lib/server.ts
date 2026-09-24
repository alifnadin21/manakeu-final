import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
export const cookieName = 'manakeu_session';
export const backend = (
    process.env.MANAKEU_API_URL || 'http://127.0.0.1:3000'
).replace(/\/$/, '');
export function checkOrigin(req: NextRequest) {
    const origin = req.headers.get('origin');
    return (
        !!origin &&
        origin === (process.env.MANAKEU_WEB_ORIGIN || req.nextUrl.origin)
    );
}
export const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 86400
};
export async function upstream(path: string, options: RequestInit = {}) {
    return fetch(backend + '/api/' + path, {
        ...options,
        cache: 'no-store',
        redirect: 'manual',
        signal: AbortSignal.timeout(12000)
    });
}
export async function sessionToken() {
    return (await cookies()).get(cookieName)?.value;
}
export function unavailable() {
    return NextResponse.json(
        { error: 'The financial service is unavailable. Please try again.' },
        { status: 503 }
    );
}
