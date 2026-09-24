'use client';
import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { api, currency, PageData, useResource } from '@/lib/api';
import { ProjectSelect } from './records';
import {
    Badge,
    Empty,
    ErrorState,
    Loading,
    Modal,
    Notice,
    PageHeader,
    Pagination
} from './ui';
export default function Budgets() {
    const [project, setProject] = useState('');
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<{ id: number; amount: string }>();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const data = useResource<PageData>(
        project
            ? 'transaksi?limit=10&page=' + page + '&ID_Project=' + project
            : null
    );
    async function save(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setBusy(true);
        setError('');
        const form = new FormData(e.currentTarget);
        try {
            await api('complex/project-budget-adjustment', {
                method: 'PUT',
                body: JSON.stringify({
                    project_id: Number(project),
                    adjustments: [
                        {
                            transaksi_id: selected!.id,
                            jumlah_baru: form.get('amount'),
                            keterangan: form.get('reason')
                        }
                    ]
                })
            });
            setSelected(undefined);
            setMessage('Adjustment saved and recorded in the activity log.');
            data.reload();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Budget adjustments"
                description="Make a considered correction to a project's recorded income or expense."
            />
            <Notice message={message} />
            <div className="card budget-intro">
                <span className="stat-icon">
                    <SlidersHorizontal size={18} />
                </span>
                <div>
                    <h2>Keep the record accurate</h2>
                    <p>
                        Adjust an existing transaction amount with a reason.
                        Approved receipts must go through revision first. This
                        changes the recorded amount, not a separate spending
                        limit.
                    </p>
                </div>
            </div>
            <div className="card">
                <div className="card-body">
                    <label className="project-filter-label">
                        Choose a project
                        <ProjectSelect
                            value={project}
                            onChange={(v) => {
                                setProject(v);
                                setPage(1);
                            }}
                        />
                    </label>
                </div>
                {!project ? (
                    <Empty
                        title="Choose a project to review"
                        message="Its transactions and recorded amounts will appear here."
                    />
                ) : data.loading ? (
                    <Loading />
                ) : data.error ? (
                    <ErrorState message={data.error} retry={data.reload} />
                ) : data.data?.data.length ? (
                    <>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Transaction</th>
                                        <th>Type</th>
                                        <th>Current amount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.data.data.map((row) => (
                                        <tr key={row.ID_Transaksi}>
                                            <td>
                                                <strong>
                                                    {row.Keterangan ||
                                                        'Transaction #' +
                                                            row.ID_Transaksi}
                                                </strong>
                                                <div className="subtle">
                                                    #{row.ID_Transaksi}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge
                                                    value={row.Jenis_Transaksi}
                                                />
                                            </td>
                                            <td className="money">
                                                {currency(row.Jumlah)}
                                            </td>
                                            <td>
                                                <button
                                                    className="button small"
                                                    onClick={() => {
                                                        setError('');
                                                        setSelected({
                                                            id: Number(
                                                                row.ID_Transaksi
                                                            ),
                                                            amount: String(
                                                                row.Jumlah
                                                            )
                                                        });
                                                    }}
                                                >
                                                    Adjust amount
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            {...data.data.pagination}
                            onPage={setPage}
                        />
                    </>
                ) : (
                    <Empty
                        title="No transactions in this project"
                        message="Record income or expenses before making an adjustment."
                    />
                )}
            </div>
            {selected && (
                <Modal
                    title={'Adjust transaction #' + selected.id}
                    onClose={() => !busy && setSelected(undefined)}
                >
                    <form onSubmit={save}>
                        <p className="form-note">
                            Current amount: {currency(selected.amount)}
                        </p>
                        <label>
                            New amount (IDR)
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                defaultValue={selected.amount}
                                required
                            />
                        </label>
                        <label>
                            Reason for adjustment
                            <textarea name="reason" required maxLength={2000} />
                        </label>
                        {error && (
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                        )}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="button"
                                disabled={busy}
                                onClick={() => setSelected(undefined)}
                            >
                                Cancel
                            </button>
                            <button className="button primary" disabled={busy}>
                                {busy ? 'Saving...' : 'Save adjustment'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
