'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowRight,
    ClipboardCheck,
    Download,
    FolderClosed,
    Plus,
    Wallet
} from 'lucide-react';
import { currency, dateLabel, PageData, useResource } from '@/lib/api';
import { useSession } from './session';
import { Badge, Empty, ErrorState, Loading, PageHeader } from './ui';
export type Monthly = {
    status: string;
    data: {
        period: string;
        summary: {
            total_pemasukan: number;
            total_pengeluaran: number;
            total_transaksi: number;
            total_nota: number;
        };
        total_projects: number;
        projects: {
            id_project: number;
            nama_project: string;
            status_project: string;
            statistik: {
                total_pemasukan: number;
                total_pengeluaran: number;
                total_transaksi: number;
                total_nota: number;
                nota_terverifikasi: number;
            };
        }[];
    };
};
export function CashChart({
    projects
}: {
    projects: Monthly['data']['projects'];
}) {
    const rows = projects.slice(0, 8);
    const max = Math.max(
        ...rows.flatMap((p) => [
            p.statistik.total_pemasukan,
            p.statistik.total_pengeluaran
        ]),
        1
    );
    if (!rows.some((p) => p.statistik.total_transaksi))
        return (
            <Empty
                title="Your cash flow will appear here"
                message="Add income and expenses to see how your projects are performing."
            />
        );
    return (
        <div className="chart-body">
            <div className="chart-legend">
                <span>
                    <i />
                    Income
                </span>
                <span>
                    <i />
                    Expenses
                </span>
            </div>
            <div
                className="bar-chart"
                role="img"
                aria-label="Income and expenses by project"
            >
                {rows.map((p) => (
                    <div
                        key={p.id_project}
                        className="bar-group"
                        title={
                            p.nama_project +
                            ': income ' +
                            currency(p.statistik.total_pemasukan) +
                            ', expenses ' +
                            currency(p.statistik.total_pengeluaran)
                        }
                    >
                        <div
                            className="bar"
                            style={{
                                height:
                                    Math.max(
                                        1,
                                        (p.statistik.total_pemasukan / max) *
                                            100
                                    ) + '%'
                            }}
                        />
                        <div
                            className="bar expense"
                            style={{
                                height:
                                    Math.max(
                                        1,
                                        (p.statistik.total_pengeluaran / max) *
                                            100
                                    ) + '%'
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="chart-labels">
                {rows.map((p) => (
                    <span key={p.id_project}>{p.nama_project}</span>
                ))}
            </div>
            {projects.length > 8 && (
                <p className="form-note">
                    Showing the first 8 projects. View reports for all projects.
                </p>
            )}
        </div>
    );
}
export function Stats({
    income,
    expense,
    count,
    pending
}: {
    income: number;
    expense: number;
    count: number;
    pending?: number;
}) {
    return (
        <div className="stats">
            {[
                {
                    title: 'Net cash flow',
                    value: currency(Math.round((income - expense) * 100) / 100),
                    note: 'Income minus expenses',
                    icon: Wallet,
                    featured: true
                },
                {
                    title: 'Total income',
                    value: currency(income),
                    note: 'Money coming into your projects',
                    icon: ArrowDownLeft
                },
                {
                    title: 'Total expenses',
                    value: currency(expense),
                    note: 'Money going out of your projects',
                    icon: ArrowUpRight
                },
                {
                    title:
                        pending === undefined
                            ? 'Transactions'
                            : 'Awaiting approval',
                    value: (pending ?? count).toLocaleString(),
                    note:
                        pending === undefined
                            ? 'Recorded in this period'
                            : count + ' transactions in this period',
                    icon: ClipboardCheck
                }
            ].map((item) => (
                <div
                    key={item.title}
                    className={'card stat ' + (item.featured ? 'featured' : '')}
                >
                    <div className="stat-top">
                        <span>{item.title}</span>
                        <span className="stat-icon">
                            <item.icon size={15} />
                        </span>
                    </div>
                    <div className="stat-value">{item.value}</div>
                    <small>{item.note}</small>
                </div>
            ))}
        </div>
    );
}
export default function Dashboard() {
    const { user } = useSession();
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [year, month] = period.split('-');
    const monthly = useResource<Monthly>(
        'complex/project-monthly?year=' + year + '&month=' + Number(month)
    );
    const pending = useResource<PageData>(
        'nota?Status_Verifikasi=Pending&limit=1'
    );
    const recent = useResource<PageData>('transaksi?limit=5');
    const summary = monthly.data?.data.summary;
    return (
        <>
            <PageHeader
                eyebrow="YOUR FINANCIAL SNAPSHOT"
                title={'Good to see you, ' + user.Nama.split(' ')[0] + '.'}
                description="Here is what is happening across your financial workspace."
                action={
                    <>
                        <Link className="button" href="/reports">
                            <Download size={15} />
                            View reports
                        </Link>
                        <Link
                            className="button primary"
                            href="/transactions?new=1"
                        >
                            <Plus size={16} />
                            New transaction
                        </Link>
                    </>
                }
            />
            <div className="overview-period">
                <span>
                    <span className="live-dot" />
                    Workspace overview
                </span>
                <label className="sr-only" htmlFor="period">
                    Reporting month
                </label>
                <input
                    id="period"
                    aria-label="Reporting month"
                    type="month"
                    value={period}
                    required
                    onChange={(e) =>
                        e.target.value && setPeriod(e.target.value)
                    }
                />
            </div>
            {monthly.loading ? (
                <Loading />
            ) : monthly.error ? (
                <ErrorState message={monthly.error} retry={monthly.reload} />
            ) : (
                summary && (
                    <>
                        <Stats
                            income={summary.total_pemasukan}
                            expense={summary.total_pengeluaran}
                            count={summary.total_transaksi}
                            pending={pending.data?.pagination.total}
                        />
                        <div className="dashboard-grid">
                            <section className="card">
                                <div className="card-heading">
                                    <div>
                                        <h2>Cash flow by project</h2>
                                        <p>
                                            Income and expenses -{' '}
                                            {new Date(
                                                period + '-01T12:00:00'
                                            ).toLocaleDateString('en-GB', {
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className="badge green">IDR</span>
                                </div>
                                <CashChart
                                    projects={monthly.data!.data.projects}
                                />
                            </section>
                            <section className="card">
                                <div className="card-heading">
                                    <div>
                                        <h2>
                                            Your projects{' '}
                                            <span className="count-pill">
                                                {
                                                    monthly.data!.data
                                                        .total_projects
                                                }
                                            </span>
                                        </h2>
                                        <p>
                                            A little context behind the numbers
                                        </p>
                                    </div>
                                    <Link
                                        href="/projects"
                                        aria-label="View all projects"
                                    >
                                        <ArrowUpRight size={15} />
                                    </Link>
                                </div>
                                {monthly.data!.data.projects.length ? (
                                    monthly
                                        .data!.data.projects.slice(0, 4)
                                        .map((p) => (
                                            <Link
                                                href={
                                                    '/reports?project=' +
                                                    p.id_project
                                                }
                                                key={p.id_project}
                                                className="project-mini"
                                            >
                                                <span className="project-symbol">
                                                    <FolderClosed size={16} />
                                                </span>
                                                <div>
                                                    <strong>
                                                        {p.nama_project}
                                                    </strong>
                                                    <p>
                                                        {
                                                            p.statistik
                                                                .total_transaksi
                                                        }{' '}
                                                        transactions this month
                                                    </p>
                                                </div>
                                                <Badge
                                                    value={p.status_project}
                                                />
                                            </Link>
                                        ))
                                ) : (
                                    <Empty
                                        title="Room for your next project"
                                        message="Start a project to keep its finances together."
                                        action={
                                            <Link
                                                href="/projects?new=1"
                                                className="button small"
                                            >
                                                <Plus size={13} />
                                                Create project
                                            </Link>
                                        }
                                    />
                                )}
                            </section>
                        </div>
                    </>
                )
            )}
            {pending.error && (
                <ErrorState
                    message={'Receipt status: ' + pending.error}
                    retry={pending.reload}
                />
            )}
            <section className="card">
                <div className="card-heading">
                    <div>
                        <h2>Recent transactions</h2>
                        <p>Your latest financial activity, across all dates</p>
                    </div>
                    <Link href="/transactions">
                        View all transactions <ArrowRight size={13} />
                    </Link>
                </div>
                {recent.loading ? (
                    <Loading />
                ) : recent.error ? (
                    <ErrorState message={recent.error} retry={recent.reload} />
                ) : recent.data?.data.length ? (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Transaction</th>
                                    <th>Project</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.data.data.map((row) => (
                                    <tr key={row.ID_Transaksi}>
                                        <td>
                                            <div className="row-main">
                                                <span className="row-icon">
                                                    {row.Jenis_Transaksi ===
                                                    'Pemasukan' ? (
                                                        <ArrowDownLeft
                                                            size={14}
                                                        />
                                                    ) : (
                                                        <ArrowUpRight
                                                            size={14}
                                                        />
                                                    )}
                                                </span>
                                                <div>
                                                    <strong>
                                                        {row.Keterangan ||
                                                            'Transaction #' +
                                                                row.ID_Transaksi}
                                                    </strong>
                                                    <small>
                                                        #{row.ID_Transaksi}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {monthly.data?.data.projects.find(
                                                (p) =>
                                                    p.id_project ===
                                                    row.ID_Project
                                            )?.nama_project ||
                                                'Project #' + row.ID_Project}
                                        </td>
                                        <td>
                                            {dateLabel(row.Tanggal_Transaksi)}
                                        </td>
                                        <td>
                                            <Badge
                                                value={row.Jenis_Transaksi}
                                            />
                                        </td>
                                        <td className="money">
                                            {currency(row.Jumlah)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Empty
                        title="A fresh start for your finances"
                        message="Add your first transaction. Every record will be kept in your project's financial history."
                        action={
                            <Link
                                className="button small"
                                href="/transactions?new=1"
                            >
                                <Plus size={14} />
                                Add transaction
                            </Link>
                        }
                    />
                )}
            </section>
        </>
    );
}
