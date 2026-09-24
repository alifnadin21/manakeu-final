'use client';
import { useCallback, useEffect, useState } from 'react';
export type User = {
    ID_User: number;
    Nama: string;
    Email: string;
    Role: 'Admin' | 'User';
    Status?: string;
};
export type Row = Record<string, string | number | null>;
export type PageData = {
    data: Row[];
    pagination: { page: number; limit: number; total: number; pages: number };
};
export class ApiError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
    }
}
export async function api<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(
        path.startsWith('/api/') ? path : '/api/backend/' + path,
        {
            ...options,
            headers: { 'Content-Type': 'application/json', ...options.headers },
            cache: 'no-store'
        }
    );
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401)
            window.dispatchEvent(new Event('session-expired'));
        throw new ApiError(
            data.error || data.message || 'The request could not be completed.',
            response.status
        );
    }
    return data;
}
export function useResource<T>(path: string | null) {
    const [data, setData] = useState<T>();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(0);
    const reload = useCallback(() => setVersion((v) => v + 1), []);
    useEffect(() => {
        if (!path) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        setError('');
        setData(undefined);
        api<T>(path, { signal: controller.signal })
            .then(setData)
            .catch((e) => {
                if (!controller.signal.aborted) setError(e.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [path, version]);
    return { data, error, loading, reload };
}
export const currency = (value: unknown) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 2
    }).format(Number(value || 0));
export const dateLabel = (value: unknown) =>
    value
        ? new Intl.DateTimeFormat('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
          }).format(new Date(String(value).slice(0, 10) + 'T12:00:00'))
        : '-';
export const today = () => new Date().toLocaleDateString('en-CA');
export function downloadCsv(name: string, rows: Record<string, unknown>[]) {
    if (!rows.length) return;
    const cols = Object.keys(rows[0]);
    const cell = (v: unknown) => {
        let s = String(v ?? '');
        if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
        return '"' + s.replaceAll('"', '""') + '"';
    };
    const text = [
        cols.map(cell).join(','),
        ...rows.map((r) => cols.map((k) => cell(r[k])).join(','))
    ].join('\r\n');
    const url = URL.createObjectURL(
        new Blob(['\ufeff' + text], { type: 'text/csv;charset=utf-8' })
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = name + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}
