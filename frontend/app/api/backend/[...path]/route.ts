import { NextRequest, NextResponse } from 'next/server';
import {
    checkOrigin,
    cookieName,
    sessionToken,
    upstream,
    unavailable
} from '@/lib/server';
type Context = { params: Promise<{ path: string[] }> };
async function proxy(req: NextRequest, context: Context) {
    const { path } = await context.params;
    const allowed = [
        'projects',
        'transaksi',
        'nota',
        'approval',
        'users',
        'logs',
        'complex',
        'redis',
        'auth'
    ];
    if (
        !allowed.includes(path[0]) ||
        path.some((part) => !/^[-a-zA-Z0-9_]+$/.test(part)) ||
        (path[0] === 'auth' && !['me', 'update-profile'].includes(path[1]))
    )
        return NextResponse.json(
            { error: 'Route not available' },
            { status: 404 }
        );
    if (req.method !== 'GET' && !checkOrigin(req))
        return NextResponse.json(
            { error: 'Invalid request origin' },
            { status: 403 }
        );
    const token = await sessionToken();
    if (!token)
        return NextResponse.json({ error: 'Please sign in' }, { status: 401 });
    try {
        const body = req.method === 'GET' ? undefined : await req.text();
        if (body && body.length > 128000)
            return NextResponse.json(
                { error: 'Request too large' },
                { status: 413 }
            );
        const r = await upstream(path.join('/') + req.nextUrl.search, {
            method: req.method,
            headers: {
                Authorization: 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body
        });
        const response = NextResponse.json(await r.json(), {
            status: r.status
        });
        response.headers.set('Cache-Control', 'no-store');
        if (r.status === 401) response.cookies.delete(cookieName);
        return response;
    } catch {
        return unavailable();
    }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
