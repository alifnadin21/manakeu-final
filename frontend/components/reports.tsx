'use client';
import { useEffect, useState } from 'react';
import { Download, ArrowUpRight } from 'lucide-react';
import {
    api,
    currency,
    dateLabel,
    downloadCsv,
    Row,
    useResource
} from '@/lib/api';
import { Monthly, CashChart, Stats } from './dashboard';
import { ProjectSelect } from './records';
import { Badge, Empty, ErrorState, Loading, PageHeader } from './ui';
type Report = {
    data: {
        summary: Row;
        period: { start: string; end: string };
        transactions: Row[];
    };
};
export default function Reports() {
    const [project, setProject] = useState('');
    const [start, setStart] = useState(
        new Date().toISOString().slice(0, 7) + '-01'
    );
    const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
    const [report, setReport] = useState<Report>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const now = new Date();
    const monthly = useResource<Monthly>(
        'complex/project-monthly?year=' +
            now.getFullYear() +
            '&month=' +
            (now.getMonth() + 1)
    );
    useEffect(() => {
        const p = new URLSearchParams(window.location.search).get('project');
        if (p) setProject(p);
    }, []);
    async function generate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setReport(undefined);
        if (start > end) {
            setError('The end date must be on or after the start date.');
            return;
        }
        setBusy(true);
        try {
            setReport(
                await api<Report>('complex/project-summary-report', {
                    method: 'POST',
                    body: JSON.stringify({
                        project_id: Number(project),
                        start_date: start,
                        end_date: end
                    })
                })
            );
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    const summary = report?.data.summary;
    return (
        <>
            <PageHeader
                eyebrow="INSIGHTS & REPORTING"
                title="The story behind your numbers."
                description="Review project performance and export the records that matter."
                action={
                    report?.data.transactions.length ? (
                        <button
                            className="button"
                            onClick={() =>
                                downloadCsv(
                                    'manakeu-project-' + project + '-' + start,
                                    report.data.transactions
                                )
                            }
                        >
                            <Download size={15} />
                            Export report
                        </button>
                    ) : undefined
                }
            />
            <div className="card card-body report-controls">
                <form onSubmit={generate} className="report-filters">
                    <label>
                        Project
                        <ProjectSelect
                            value={project}
                            onChange={(v) => {
                                setProject(v);
                                setReport(undefined);
                            }}
                            required
                        />
                    </label>
                    <label>
                        From
                        <input
                            type="date"
                            value={start}
                            onChange={(e) => {
                                setStart(e.target.value);
                                setReport(undefined);
                            }}
                            required
                        />
                    </label>
                    <label>
                        To
                        <input
                            type="date"
                            value={end}
                            min={start}
                            onChange={(e) => {
                                setEnd(e.target.value);
                                setReport(undefined);
                            }}
                            required
                        />
                    </label>
                    <button className="button primary" disabled={busy}>
                        {busy ? 'Generating...' : 'Generate report'}
                        <ArrowUpRight size={15} />
                    </button>
                </form>
            </div>
            {error && <ErrorState message={error} />}
            <div className="report-results">
                {busy ? (
                    <Loading />
                ) : summary ? (
                    <>
                        <div className="report-title">
                            <h2>{summary.Nama_Project}</h2>
                            <span>
                                {dateLabel(report!.data.period.start)} -{' '}
                                {dateLabel(report!.data.period.end)}
                            </span>
                        </div>
                        <Stats
                            income={Number(summary.Total_Pemasukan)}
                            expense={Number(summary.Total_Pengeluaran)}
                            count={Number(summary.Total_Transaksi)}
                        />
                        <div className="card">
                            <div className="card-heading">
                                <h2>Transaction detail</h2>
                                <span className="badge">
                                    {Number(summary.Total_Nota)} supporting
                                    receipts
                                </span>
                            </div>
                            {report!.data.transactions.length ? (
                                <div className="table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Description</th>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report!.data.transactions.map(
                                                (row) => (
                                                    <tr key={row.ID_Transaksi}>
                                                        <td>
                                                            <strong>
                                                                {row.Keterangan ||
                                                                    'Transaction #' +
                                                                        row.ID_Transaksi}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            {dateLabel(
                                                                row.Tanggal_Transaksi
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                value={
                                                                    row.Jenis_Transaksi
                                                                }
                                                            />
                                                        </td>
                                                        <td className="money">
                                                            {currency(
                                                                row.Jumlah
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <Empty
                                    title="No activity in this period"
                                    message="Try a different date range for this project."
                                />
                            )}
                        </div>
                    </>
                ) : (
                    <section className="card">
                        <div className="card-heading">
                            <div>
                                <h2>This month at a glance</h2>
                                <p>
                                    All accessible projects - generate a report
                                    above to explore a date range
                                </p>
                            </div>
                        </div>
                        {monthly.loading ? (
                            <Loading />
                        ) : monthly.error ? (
                            <ErrorState
                                message={monthly.error}
                                retry={monthly.reload}
                            />
                        ) : (
                            monthly.data && (
                                <CashChart
                                    projects={monthly.data.data.projects}
                                />
                            )
                        )}
                    </section>
                )}
            </div>
        </>
    );
}
