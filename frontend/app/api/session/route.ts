import { NextRequest, NextResponse } from 'next/server';
import {
    checkOrigin,
    cookieName,
    cookieOptions,
    sessionToken,
    upstream,
    unavailable
} from '@/lib/server';
export async function GET() {
    const token = await sessionToken();
    if (!token)
        return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    try {
        const r = await upstream('auth/me', {
            headers: { Authorization: 'Bearer ' + token }
        });
        const response = NextResponse.json(await r.json(), {
            status: r.status
        });
        if (r.status === 401) response.cookies.delete(cookieName);
        return response;
    } catch {
        return unavailable();
    }
}
export async function POST(req: NextRequest) {
    if (!checkOrigin(req))
        return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
        );
    try {
        const body = await req.json();
        if (typeof body.Email !== 'string' || typeof body.Password !== 'string')
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        const r = await upstream('auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email: body.Email, Password: body.Password })
        });
        const data = await r.json();
        if (!r.ok)
            return NextResponse.json(
                { error: data.error || data.message || 'Sign in failed' },
                { status: r.status }
            );
        const response = NextResponse.json({ user: data.user });
        response.cookies.set(cookieName, data.token, cookieOptions);
        return response;
    } catch {
        return unavailable();
    }
}
export async function DELETE(req: NextRequest) {
    if (!checkOrigin(req))
        return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
        );
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(cookieName);
    return response;
}
