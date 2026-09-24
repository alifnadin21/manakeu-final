'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    ArrowUpRight,
    BarChart3,
    ChevronRight,
    ClipboardCheck,
    FolderClosed,
    LayoutDashboard,
    LogOut,
    Menu,
    ReceiptText,
    Settings2,
    ShieldCheck,
    SlidersHorizontal,
    Users,
    Activity,
    ArrowLeftRight,
    X
} from 'lucide-react';
import { useSession } from './session';
import { api } from '@/lib/api';
const items = [
    ['/dashboard', 'Overview', LayoutDashboard],
    ['/projects', 'Projects', FolderClosed],
    ['/transactions', 'Transactions', ArrowLeftRight],
    ['/budgets', 'Budget adjustments', SlidersHorizontal],
    ['/receipts', 'Receipts', ReceiptText],
    ['/approvals', 'Approvals', ClipboardCheck],
    ['/reports', 'Reports', BarChart3],
    ['/users', 'Users & roles', Users],
    ['/activity', 'Activity logs', Activity],
    ['/settings', 'Settings', Settings2]
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
    const { user } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const active = items.find(([url]) => pathname === url)?.[1] || 'Workspace';
    async function logout() {
        try {
            await api('/api/session', { method: 'DELETE' });
            router.replace('/login');
        } catch (e) {
            setError((e as Error).message);
        }
    }
    return (
        <div className="app-shell">
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            {open && (
                <button
                    className="sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={() => setOpen(false)}
                />
            )}
            <aside className={'sidebar ' + (open ? 'open' : '')}>
                <Link className="brand" href="/dashboard">
                    <span className="brand-mark">
                        <BarChart3 size={22} />
                    </span>
                    manakeu<span className="brand-dot">.</span>
                </Link>
                <div className="workspace">
                    <span className="workspace-icon">M</span>
                    <div>
                        <strong>Financial workspace</strong>
                        <span>Manakeu</span>
                    </div>
                    <ShieldCheck size={15} />
                </div>
                <div className="nav-label">WORKSPACE</div>
                <nav aria-label="Main navigation">
                    {items
                        .filter(
                            ([url]) =>
                                user.Role === 'Admin' ||
                                !['/users', '/approvals'].includes(url)
                        )
                        .map(([url, label, Icon], index) => (
                            <Link
                                onClick={() => setOpen(false)}
                                aria-current={
                                    pathname === url ? 'page' : undefined
                                }
                                className={
                                    (pathname === url ? 'active ' : '') +
                                    (index === 7 ? 'nav-divider' : '')
                                }
                                key={url}
                                href={url}
                            >
                                <Icon size={18} />
                                {label}
                                {pathname === url && (
                                    <span className="nav-dot" />
                                )}
                            </Link>
                        ))}
                </nav>
                <div className="sidebar-bottom">
                    <div className="sidebar-note">
                        <span className="eyebrow">A CLEARER PICTURE</span>
                        <p>Make every rupiah count.</p>
                        <Link href="/reports">
                            Explore your reports <ArrowUpRight size={15} />
                        </Link>
                    </div>
                    <button
                        className="account"
                        onClick={() => router.push('/settings')}
                    >
                        <span className="avatar">
                            {user.Nama.slice(0, 2).toUpperCase()}
                        </span>
                        <span>
                            <strong>{user.Nama}</strong>
                            <small>
                                {user.Role === 'Admin'
                                    ? 'Administrator'
                                    : 'Member'}
                            </small>
                        </span>
                        <ChevronRight size={15} />
                    </button>
                </div>
            </aside>
            <div className="workspace-main">
                <header className="topbar">
                    <div className="breadcrumb">
                        <button
                            className="icon-button mobile-menu"
                            aria-label="Open navigation"
                            onClick={() => setOpen(!open)}
                        >
                            {open ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <span>Workspace</span>
                        <ChevronRight size={14} />
                        <strong>{active}</strong>
                    </div>
                    <div className="topbar-right">
                        <span className="role-tag">
                            <ShieldCheck size={14} />
                            {user.Role === 'Admin'
                                ? 'Admin access'
                                : 'Member access'}
                        </span>
                        <button
                            className="icon-button"
                            aria-label="Sign out"
                            title="Sign out"
                            onClick={logout}
                        >
                            <LogOut size={17} />
                        </button>
                    </div>
                </header>
                <main id="main" className="main-content">
                    {error && (
                        <p role="alert" className="form-error">
                            {error}
                        </p>
                    )}
                    {children}
                </main>
                <footer className="page-footer">
                    <span>Manakeu - Clarity in every transaction.</span>
                    <span>Amounts in Indonesian Rupiah (IDR)</span>
                </footer>
            </div>
        </div>
    );
}
