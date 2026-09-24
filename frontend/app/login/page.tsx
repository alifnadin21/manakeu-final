'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    BarChart3,
    Check,
    Eye,
    EyeOff,
    ShieldCheck
} from 'lucide-react';
import { api } from '@/lib/api';
export default function Login() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [visible, setVisible] = useState(false);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError('');
        const form = new FormData(event.currentTarget);
        try {
            await api('/api/session', {
                method: 'POST',
                body: JSON.stringify({
                    Email: form.get('Email'),
                    Password: form.get('Password')
                })
            });
            router.replace('/dashboard');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="login-page">
            <section className="login-story">
                <div className="brand">
                    <span className="brand-mark">
                        <BarChart3 size={22} />
                    </span>
                    manakeu.
                </div>
                <div className="story-content">
                    <span className="login-kicker">
                        FINANCIAL CLARITY, TOGETHER
                    </span>
                    <h1>
                        Good decisions
                        <br />
                        start with a<br />
                        <em>clear picture.</em>
                    </h1>
                    <p>
                        Bring your projects, transactions, and approvals into
                        one thoughtful workspace.
                    </p>
                    <div className="story-points">
                        {[
                            'One place for every project',
                            'A clear trail for every transaction',
                            'The right access for every teammate'
                        ].map((v) => (
                            <span key={v}>
                                <Check size={15} />
                                {v}
                            </span>
                        ))}
                    </div>
                </div>
                <span className="story-footer">
                    Built for the way your business works.
                </span>
            </section>
            <main className="login-form-area">
                <div className="login-form">
                    <span className="eyebrow">YOUR FINANCIAL WORKSPACE</span>
                    <h2>Welcome back.</h2>
                    <p>Sign in to pick up where you left off.</p>
                    <form onSubmit={submit}>
                        <label>
                            Email address
                            <input
                                name="Email"
                                type="email"
                                autoComplete="username"
                                placeholder="you@company.com"
                                required
                                maxLength={255}
                            />
                        </label>
                        <label>
                            Password
                            <div className="password-field">
                                <input
                                    name="Password"
                                    type={visible ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="icon-button"
                                    aria-label={
                                        visible
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                    onClick={() => setVisible(!visible)}
                                >
                                    {visible ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </label>
                        {error && (
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                        )}
                        <button
                            className="button primary login-submit"
                            disabled={busy}
                        >
                            {busy ? 'Signing in...' : 'Sign in to workspace'}
                            <ArrowRight size={17} />
                        </button>
                    </form>
                    <p className="login-help">
                        Need an account? Ask your workspace administrator.
                    </p>
                    <div className="login-security">
                        <ShieldCheck size={16} />
                        Your workspace. Securely connected.
                    </div>
                </div>
                <div className="login-copyright">
                    Copyright {new Date().getFullYear()} Manakeu
                </div>
            </main>
        </div>
    );
}
