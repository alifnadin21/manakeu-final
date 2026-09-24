'use client';
import { useState } from 'react';
import { ShieldCheck, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import { useSession } from './session';
import { Badge, Notice, PageHeader } from './ui';
export default function Settings() {
    const { user, refresh } = useSession();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function save(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        const element = e.currentTarget;
        const values = Object.fromEntries(new FormData(element));
        if (!values.Password) {
            delete values.Password;
            delete values.currentPassword;
        }
        try {
            await api('auth/update-profile', {
                method: 'PUT',
                body: JSON.stringify(values)
            });
            setMessage('Your profile has been updated.');
            element.reset();
            refresh();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Profile & settings"
                description="Manage your profile and keep your workspace account secure."
            />
            <Notice message={message} />
            {error && (
                <p className="form-error" role="alert">
                    {error}
                </p>
            )}
            <div className="settings-grid">
                <section className="card">
                    <div className="card-heading">
                        <h2>Profile details</h2>
                        <UserRound size={17} />
                    </div>
                    <div className="card-body">
                        <form onSubmit={save}>
                            <label>
                                Full name
                                <input
                                    name="Nama"
                                    defaultValue={user.Nama}
                                    required
                                    minLength={3}
                                    maxLength={50}
                                />
                            </label>
                            <label>
                                Email address
                                <input value={user.Email} disabled />
                            </label>
                            <p className="form-note">
                                Email and role changes are managed by your
                                administrator.
                            </p>
                            <div className="form-actions">
                                <button
                                    className="button primary"
                                    disabled={busy}
                                >
                                    {busy ? 'Saving...' : 'Save profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
                <section className="card">
                    <div className="card-heading">
                        <h2>Workspace access</h2>
                        <ShieldCheck size={17} />
                    </div>
                    <div className="card-body">
                        <dl className="details-list">
                            <div>
                                <dt>Account</dt>
                                <dd>{user.Email}</dd>
                            </div>
                            <div>
                                <dt>Role</dt>
                                <dd>
                                    <Badge value={user.Role} />
                                </dd>
                            </div>
                            <div>
                                <dt>Access</dt>
                                <dd>
                                    {user.Role === 'Admin'
                                        ? 'Manage workspace finances, approvals, and teammates.'
                                        : 'Manage your own projects, transactions, and receipts.'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>
                <section className="card">
                    <div className="card-heading">
                        <h2>Change password</h2>
                    </div>
                    <div className="card-body">
                        <form onSubmit={save}>
                            <label>
                                Current password
                                <input
                                    name="currentPassword"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                />
                            </label>
                            <label>
                                New password
                                <input
                                    name="Password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    maxLength={20}
                                    required
                                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,20}"
                                />
                            </label>
                            <p className="form-note">
                                Use 8-20 characters, including uppercase,
                                lowercase, and a number.
                            </p>
                            <div className="form-actions">
                                <button
                                    className="button primary"
                                    disabled={busy}
                                >
                                    {busy ? 'Updating...' : 'Update password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </>
    );
}
