'use client';
import { useEffect, useRef } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Inbox,
    LoaderCircle,
    X
} from 'lucide-react';
export function Loading() {
    return (
        <div className="loading" role="status">
            <LoaderCircle className="spin" size={22} />
            <span>Loading your workspace...</span>
        </div>
    );
}
export function ErrorState({
    message,
    retry
}: {
    message: string;
    retry?: () => void;
}) {
    return (
        <div className="error-state" role="alert">
            <AlertCircle size={20} />
            <div>
                <strong>We could not load this data</strong>
                <p>{message}</p>
                {retry && (
                    <button className="button small" onClick={retry}>
                        Try again
                    </button>
                )}
            </div>
        </div>
    );
}
export function Empty({
    title = 'Nothing here yet',
    message = 'Your records will appear here.',
    action
}: {
    title?: string;
    message?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="empty">
            <div className="empty-icon">
                <Inbox size={26} />
            </div>
            <h3>{title}</h3>
            <p>{message}</p>
            {action}
        </div>
    );
}
export function Badge({ value }: { value: unknown }) {
    const label = String(value || 'Pending');
    return (
        <span
            className={
                'badge ' +
                (['Active', 'Approved', 'Pemasukan'].includes(label)
                    ? 'green'
                    : [
                            'Rejected',
                            'Inactive',
                            'Deactive',
                            'Pengeluaran'
                        ].includes(label)
                      ? 'muted'
                      : 'amber')
            }
        >
            <span />
            {label === 'Pemasukan'
                ? 'Income'
                : label === 'Pengeluaran'
                  ? 'Expense'
                  : label}
        </span>
    );
}
export function PageHeader({
    eyebrow = 'WORKSPACE',
    title,
    description,
    action
}: {
    eyebrow?: string;
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="page-heading">
            <div>
                <div className="eyebrow">{eyebrow}</div>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            <div className="heading-actions">{action}</div>
        </div>
    );
}
export function Modal({
    title,
    children,
    onClose
}: {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        ref.current?.showModal();
        return () => ref.current?.close();
    }, []);
    return (
        <dialog ref={ref} className="modal" onCancel={onClose}>
            <div className="modal-heading">
                <h2>{title}</h2>
                <button
                    type="button"
                    aria-label="Close dialog"
                    className="icon-button"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>
            {children}
        </dialog>
    );
}
export function Pagination({
    page,
    pages,
    total,
    onPage
}: {
    page: number;
    pages: number;
    total: number;
    onPage: (page: number) => void;
}) {
    return (
        <div className="pagination">
            <span>
                {total.toLocaleString()} record{total === 1 ? '' : 's'}{' '}
                <span className="subtle">
                    / Page {page} of {Math.max(1, pages)}
                </span>
            </span>
            <div>
                <button
                    className="icon-button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => onPage(page - 1)}
                >
                    <ArrowLeft size={16} />
                </button>
                <button
                    className="icon-button"
                    aria-label="Next page"
                    disabled={page >= pages}
                    onClick={() => onPage(page + 1)}
                >
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
export function Notice({ message }: { message: string }) {
    return message ? (
        <div className="notice" role="status">
            {message}
        </div>
    ) : null;
}
export function Forbidden() {
    return (
        <Empty
            title="This area is for administrators"
            message="Your account can access its own projects, transactions, receipts, and reports."
        />
    );
}
