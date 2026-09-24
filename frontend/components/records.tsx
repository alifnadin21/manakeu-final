'use client';
import { useEffect, useState } from 'react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Download,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    FolderClosed,
    Check,
    Undo2
} from 'lucide-react';
import {
    api,
    currency,
    dateLabel,
    downloadCsv,
    PageData,
    Row,
    today,
    useResource
} from '@/lib/api';
import {
    Badge,
    Empty,
    ErrorState,
    Forbidden,
    Loading,
    Modal,
    Notice,
    PageHeader,
    Pagination
} from './ui';
import { useSession } from './session';
type Field = {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    options?: string[];
    max?: number;
};
type Kind =
    | 'projects'
    | 'transactions'
    | 'receipts'
    | 'users'
    | 'activity'
    | 'approvals';
const configs: Record<
    Kind,
    {
        title: string;
        description: string;
        endpoint: string;
        key: string;
        label: string;
        columns: [string, string, string?][];
        fields: Field[];
        filter?: [string, string[]];
    }
> = {
    projects: {
        title: 'Projects',
        description:
            'A home for every project, from the first transaction to the final report.',
        endpoint: 'projects',
        key: 'ID_Project',
        label: 'project',
        columns: [
            ['Nama_Project', 'Project'],
            ['Status', 'Status', 'badge'],
            ['Tanggal_Mulai', 'Start date', 'date'],
            ['Tanggal_Selesai', 'End date', 'date']
        ],
        fields: [
            { key: 'Nama_Project', label: 'Project name', required: true },
            {
                key: 'Deskripsi',
                label: 'Description',
                type: 'textarea',
                max: 10000
            },
            {
                key: 'Status',
                label: 'Status',
                type: 'select',
                options: ['Active', 'Deactive'],
                required: true
            },
            { key: 'Tanggal_Mulai', label: 'Start date', type: 'date' },
            { key: 'Tanggal_Selesai', label: 'End date', type: 'date' }
        ],
        filter: ['Status', ['Active', 'Deactive']]
    },
    transactions: {
        title: 'Transactions',
        description:
            'Every income and expense, with a clear record of where it belongs.',
        endpoint: 'transaksi',
        key: 'ID_Transaksi',
        label: 'transaction',
        columns: [
            ['Keterangan', 'Transaction'],
            ['ID_Project', 'Project'],
            ['Jenis_Transaksi', 'Type', 'badge'],
            ['Tanggal_Transaksi', 'Date', 'date'],
            ['Jumlah', 'Amount', 'money']
        ],
        fields: [
            {
                key: 'ID_Project',
                label: 'Project',
                type: 'project',
                required: true
            },
            {
                key: 'Jenis_Transaksi',
                label: 'Transaction type',
                type: 'select',
                options: ['Pengeluaran', 'Pemasukan'],
                required: true
            },
            {
                key: 'Jumlah',
                label: 'Amount (IDR)',
                type: 'number',
                required: true
            },
            {
                key: 'Tanggal_Transaksi',
                label: 'Transaction date',
                type: 'date',
                required: true
            },
            {
                key: 'Keterangan',
                label: 'Description',
                type: 'textarea',
                max: 10000
            }
        ],
        filter: ['Jenis_Transaksi', ['Pemasukan', 'Pengeluaran']]
    },
    receipts: {
        title: 'Receipts',
        description:
            'Keep supporting documents and their approval status in one place.',
        endpoint: 'nota',
        key: 'ID_Nota',
        label: 'receipt',
        columns: [
            ['File_Nota', 'Receipt reference'],
            ['ID_Transaksi', 'Transaction'],
            ['Status_Verifikasi', 'Status', 'badge'],
            ['Tanggal_Unggah', 'Submitted', 'date']
        ],
        fields: [
            {
                key: 'ID_Transaksi',
                label: 'Transaction ID',
                type: 'number',
                required: true
            },
            {
                key: 'File_Nota',
                label: 'Receipt file name or document reference',
                required: true
            },
            {
                key: 'Tanggal_Unggah',
                label: 'Submission date',
                type: 'date',
                required: true
            }
        ],
        filter: ['Status_Verifikasi', ['Pending', 'Approved', 'Rejected']]
    },
    users: {
        title: 'Users & roles',
        description:
            'Give every teammate the right access to your financial workspace.',
        endpoint: 'users',
        key: 'ID_User',
        label: 'user',
        columns: [
            ['Nama', 'Team member'],
            ['Email', 'Email'],
            ['Role', 'Role'],
            ['Status', 'Account status', 'badge']
        ],
        fields: [
            { key: 'Nama', label: 'Full name', required: true, max: 50 },
            {
                key: 'Email',
                label: 'Email address',
                type: 'email',
                required: true
            },
            {
                key: 'Role',
                label: 'Role',
                type: 'select',
                options: ['User', 'Admin'],
                required: true
            },
            {
                key: 'Status',
                label: 'Account status',
                type: 'select',
                options: ['Active', 'Inactive'],
                required: true
            },
            { key: 'Password', label: 'Password', type: 'password', max: 20 }
        ],
        filter: ['Status', ['Active', 'Inactive']]
    },
    activity: {
        title: 'Activity logs',
        description: 'A chronological record of changes across your workspace.',
        endpoint: 'logs',
        key: 'ID_Log',
        label: 'activity',
        columns: [
            ['Aksi', 'Activity'],
            ['ID_User', 'User'],
            ['Tanggal_Aksi', 'Date', 'date']
        ],
        fields: []
    },
    approvals: {
        title: 'Approvals',
        description:
            'Review supporting receipts and keep financial decisions moving.',
        endpoint: 'nota',
        key: 'ID_Nota',
        label: 'approval',
        columns: [
            ['File_Nota', 'Receipt reference'],
            ['ID_Transaksi', 'Transaction'],
            ['Status_Verifikasi', 'Status', 'badge'],
            ['Tanggal_Unggah', 'Submitted', 'date']
        ],
        fields: [],
        filter: ['Status_Verifikasi', ['Pending', 'Approved', 'Rejected']]
    }
};
export function ProjectSelect({
    value,
    onChange,
    name = 'ID_Project',
    required = false,
    all = false
}: {
    value?: string;
    onChange?: (v: string) => void;
    name?: string;
    required?: boolean;
    all?: boolean;
}) {
    const [search, setSearch] = useState('');
    const { data, error, loading, reload } = useResource<PageData>(
        'projects?limit=100&search=' + encodeURIComponent(search)
    );
    return (
        <div className="project-picker">
            <input
                aria-label="Find project"
                placeholder="Find a project..."
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <select
                aria-label="Project"
                name={name}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                required={required}
            >
                <option value="">
                    {loading
                        ? 'Loading projects...'
                        : all
                          ? 'All projects'
                          : 'Choose a project'}
                </option>
                {value &&
                    !data?.data.some((r) => String(r.ID_Project) === value) && (
                        <option value={value}>Project #{value}</option>
                    )}
                {data?.data.map((r) => (
                    <option key={r.ID_Project} value={String(r.ID_Project)}>
                        {r.Nama_Project}
                    </option>
                ))}
            </select>
            {error && (
                <span className="form-error">
                    {error}{' '}
                    <button type="button" onClick={reload}>
                        Retry
                    </button>
                </span>
            )}
            {data && data.pagination.total > 100 && (
                <span className="form-note">
                    Search to narrow {data.pagination.total} projects.
                </span>
            )}
        </div>
    );
}
export function Records({ kind }: { kind: Kind }) {
    const config = configs[kind];
    const { user } = useSession();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState(kind === 'approvals' ? 'Pending' : '');
    const [project, setProject] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [edit, setEdit] = useState<Row | null | undefined>();
    const [remove, setRemove] = useState<Row>();
    const [review, setReview] = useState<{ row: Row; action: string }>();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const isEditing = Boolean(edit?.[config.key]);
    const restricted =
        ['users', 'approvals'].includes(kind) && user.Role !== 'Admin';
    const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        search: query
    });
    if (config.filter && filter) params.set(config.filter[0], filter);
    if (project) params.set('ID_Project', project);
    if (start) params.set('start_date', start);
    if (end) params.set('end_date', end);
    const resource = useResource<PageData>(
        restricted ? null : config.endpoint + '?' + params
    );
    const projects = useResource<PageData>(
        kind === 'transactions' ? 'projects?limit=100' : null
    );
    useEffect(() => {
        const t = setTimeout(() => {
            setQuery(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);
    useEffect(() => {
        if (new URLSearchParams(window.location.search).get('new') === '1')
            setEdit(null);
    }, []);
    const close = () => {
        if (busy) return;
        setEdit(undefined);
        setRemove(undefined);
        setReview(undefined);
        setError('');
    };
    async function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError('');
        const form = new FormData(event.currentTarget);
        const body = Object.fromEntries(form.entries());
        if (!body.Password) delete body.Password;
        try {
            if (remove) {
                await api(config.endpoint + '/' + remove[config.key], {
                    method: 'DELETE'
                });
                setMessage(
                    kind === 'users'
                        ? 'Account deactivated.'
                        : 'Record deleted.'
                );
            } else if (review) {
                await api(
                    review.action === 'Pending'
                        ? 'complex/nota-revision-request'
                        : 'approval/approve',
                    {
                        method: review.action === 'Pending' ? 'PUT' : 'POST',
                        body: JSON.stringify(
                            review.action === 'Pending'
                                ? {
                                      nota_ids: [review.row.ID_Nota],
                                      catatan_revisi: body.Catatan
                                  }
                                : {
                                      ID_Nota: review.row.ID_Nota,
                                      Status_Approval: review.action,
                                      Catatan: body.Catatan
                                  }
                        )
                    }
                );
                setMessage(
                    review.action === 'Pending'
                        ? 'Receipt returned for revision.'
                        : 'Receipt ' + review.action.toLowerCase() + '.'
                );
            } else {
                await api(
                    config.endpoint +
                        (isEditing ? '/' + edit![config.key] : ''),
                    {
                        method: isEditing ? 'PUT' : 'POST',
                        body: JSON.stringify(body)
                    }
                );
                setMessage(
                    config.label[0].toUpperCase() +
                        config.label.slice(1) +
                        ' saved.'
                );
            }
            setEdit(undefined);
            setRemove(undefined);
            setReview(undefined);
            resource.reload();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }
    if (restricted) return <Forbidden />;
    return (
        <>
            <PageHeader
                title={config.title}
                description={config.description}
                action={
                    <>
                        {resource.data?.data.length ? (
                            <button
                                className="button"
                                onClick={() =>
                                    downloadCsv(
                                        kind + '-page-' + page,
                                        resource.data!.data
                                    )
                                }
                            >
                                <Download size={15} />
                                Export page
                            </button>
                        ) : null}
                        {config.fields.length > 0 && (
                            <button
                                className="button primary"
                                onClick={() => {
                                    setError('');
                                    setEdit(null);
                                }}
                            >
                                <Plus size={16} />
                                New {config.label}
                            </button>
                        )}
                    </>
                }
            />
            <Notice message={message} />
            <div className="card">
                <div className="toolbar">
                    <div className="search">
                        <Search size={15} />
                        <input
                            aria-label={'Search ' + config.title.toLowerCase()}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                'Search ' + config.title.toLowerCase() + '...'
                            }
                        />
                    </div>
                    {config.filter && (
                        <select
                            aria-label="Filter status or type"
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">
                                All{' '}
                                {kind === 'transactions' ? 'types' : 'statuses'}
                            </option>
                            {config.filter[1].map((v) => (
                                <option key={v} value={v}>
                                    {v === 'Pemasukan'
                                        ? 'Income'
                                        : v === 'Pengeluaran'
                                          ? 'Expense'
                                          : v}
                                </option>
                            ))}
                        </select>
                    )}
                    {kind === 'transactions' && (
                        <>
                            <input
                                type="number"
                                min="1"
                                aria-label="Filter project ID"
                                placeholder="Project ID"
                                className="filter-project"
                                value={project}
                                onChange={(e) => {
                                    setProject(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <input
                                type="date"
                                aria-label="From date"
                                value={start}
                                onChange={(e) => {
                                    setStart(e.target.value);
                                    setPage(1);
                                }}
                            />
                            <input
                                type="date"
                                aria-label="To date"
                                value={end}
                                onChange={(e) => {
                                    setEnd(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </>
                    )}
                    <button
                        className="icon-button"
                        title="Refresh"
                        aria-label="Refresh records"
                        onClick={resource.reload}
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
                {resource.loading ? (
                    <Loading />
                ) : resource.error ? (
                    <div className="card-body">
                        <ErrorState
                            message={resource.error}
                            retry={resource.reload}
                        />
                    </div>
                ) : resource.data?.data.length ? (
                    <>
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        {config.columns.map(([key, label]) => (
                                            <th key={key}>{label}</th>
                                        ))}
                                        {kind !== 'activity' && (
                                            <th>
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {resource.data.data.map((row) => (
                                        <tr key={row[config.key]}>
                                            {config.columns.map(
                                                ([key, , type], i) => (
                                                    <td
                                                        key={key}
                                                        className={
                                                            type === 'money'
                                                                ? 'money'
                                                                : ''
                                                        }
                                                    >
                                                        {type === 'badge' ? (
                                                            <Badge
                                                                value={row[key]}
                                                            />
                                                        ) : type === 'money' ? (
                                                            currency(row[key])
                                                        ) : type === 'date' ? (
                                                            dateLabel(row[key])
                                                        ) : i === 0 ? (
                                                            <div className="row-main">
                                                                <span className="row-icon">
                                                                    {kind ===
                                                                    'projects' ? (
                                                                        <FolderClosed
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : row.Jenis_Transaksi ===
                                                                      'Pemasukan' ? (
                                                                        <ArrowDownLeft
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <ArrowUpRight
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    )}
                                                                </span>
                                                                <div>
                                                                    <strong>
                                                                        {row[
                                                                            key
                                                                        ] ||
                                                                            config.label +
                                                                                ' #' +
                                                                                row[
                                                                                    config
                                                                                        .key
                                                                                ]}
                                                                    </strong>
                                                                    <small>
                                                                        #
                                                                        {
                                                                            row[
                                                                                config
                                                                                    .key
                                                                            ]
                                                                        }
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        ) : key ===
                                                          'ID_Project' ? (
                                                            projects.data?.data.find(
                                                                (p) =>
                                                                    p.ID_Project ===
                                                                    row.ID_Project
                                                            )?.Nama_Project ||
                                                            'Project #' +
                                                                row[key]
                                                        ) : key.startsWith(
                                                              'ID_'
                                                          ) ? (
                                                            '#' + row[key]
                                                        ) : (
                                                            row[key] || '-'
                                                        )}
                                                    </td>
                                                )
                                            )}
                                            {kind !== 'activity' && (
                                                <td>
                                                    <div className="row-actions">
                                                        {kind ===
                                                        'approvals' ? (
                                                            row.Status_Verifikasi ===
                                                            'Pending' ? (
                                                                <>
                                                                    <button
                                                                        className="button small"
                                                                        onClick={() =>
                                                                            setReview(
                                                                                {
                                                                                    row,
                                                                                    action: 'Approved'
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        <Check
                                                                            size={
                                                                                13
                                                                            }
                                                                        />
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="button small"
                                                                        onClick={() =>
                                                                            setReview(
                                                                                {
                                                                                    row,
                                                                                    action: 'Rejected'
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button
                                                                    className="button small"
                                                                    onClick={() =>
                                                                        setReview(
                                                                            {
                                                                                row,
                                                                                action: 'Pending'
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    <Undo2
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    Request
                                                                    revision
                                                                </button>
                                                            )
                                                        ) : (
                                                            <>
                                                                <button
                                                                    className="icon-button"
                                                                    aria-label={
                                                                        'Edit ' +
                                                                        config.label +
                                                                        ' ' +
                                                                        row[
                                                                            config
                                                                                .key
                                                                        ]
                                                                    }
                                                                    onClick={() => {
                                                                        setError(
                                                                            ''
                                                                        );
                                                                        setEdit(
                                                                            row
                                                                        );
                                                                    }}
                                                                >
                                                                    <Pencil
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </button>
                                                                <button
                                                                    className="icon-button"
                                                                    aria-label={
                                                                        (kind ===
                                                                        'users'
                                                                            ? 'Deactivate '
                                                                            : 'Delete ') +
                                                                        config.label +
                                                                        ' ' +
                                                                        row[
                                                                            config
                                                                                .key
                                                                        ]
                                                                    }
                                                                    onClick={() => {
                                                                        setError(
                                                                            ''
                                                                        );
                                                                        setRemove(
                                                                            row
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2
                                                                        size={
                                                                            14
                                                                        }
                                                                    />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            {...resource.data.pagination}
                            onPage={setPage}
                        />
                    </>
                ) : (
                    <Empty
                        title={
                            query || filter || project || start || end
                                ? 'No matching records'
                                : 'Your ' +
                                  config.title.toLowerCase() +
                                  ' start here'
                        }
                        message={
                            query || filter || project || start || end
                                ? 'Try a different search or filter.'
                                : kind === 'activity'
                                  ? 'Changes you make in the workspace will be recorded here.'
                                  : 'Create your first ' +
                                    config.label +
                                    ' to get started.'
                        }
                        action={
                            config.fields.length > 0 ? (
                                <button
                                    className="button small"
                                    onClick={() => setEdit(null)}
                                >
                                    <Plus size={14} />
                                    New {config.label}
                                </button>
                            ) : undefined
                        }
                    />
                )}
            </div>
            {edit !== undefined && (
                <Modal
                    title={(isEditing ? 'Edit ' : 'New ') + config.label}
                    onClose={close}
                >
                    <form onSubmit={save}>
                        <div className="form-grid">
                            {config.fields.map((field) => (
                                <label
                                    className={
                                        ['textarea', 'project'].includes(
                                            field.type || ''
                                        )
                                            ? 'full'
                                            : ''
                                    }
                                    key={field.key}
                                >
                                    {field.label}
                                    {field.type === 'project' ? (
                                        <ProjectSelect
                                            value={String(
                                                edit?.ID_Project || ''
                                            )}
                                            onChange={(value) =>
                                                setEdit((old) => ({
                                                    ...old,
                                                    ID_Project: value
                                                }))
                                            }
                                            required
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            name={field.key}
                                            defaultValue={String(
                                                edit?.[field.key] ||
                                                    field.options?.[0] ||
                                                    ''
                                            )}
                                            required={field.required}
                                        >
                                            {field.options?.map((v) => (
                                                <option value={v} key={v}>
                                                    {v === 'Pemasukan'
                                                        ? 'Income'
                                                        : v === 'Pengeluaran'
                                                          ? 'Expense'
                                                          : v}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        <textarea
                                            name={field.key}
                                            defaultValue={String(
                                                edit?.[field.key] || ''
                                            )}
                                            maxLength={field.max}
                                        />
                                    ) : (
                                        <input
                                            name={field.key}
                                            type={field.type || 'text'}
                                            defaultValue={String(
                                                edit?.[field.key] ??
                                                    (field.type === 'date'
                                                        ? today()
                                                        : '')
                                            )}
                                            required={
                                                field.required ||
                                                (field.type === 'password' &&
                                                    !edit?.ID_User)
                                            }
                                            min={
                                                field.type === 'number'
                                                    ? field.key === 'Jumlah'
                                                        ? '0.01'
                                                        : '1'
                                                    : undefined
                                            }
                                            step={
                                                field.key === 'Jumlah'
                                                    ? '0.01'
                                                    : field.type === 'number'
                                                      ? '1'
                                                      : undefined
                                            }
                                            maxLength={field.max || 255}
                                            minLength={
                                                field.type === 'password'
                                                    ? 8
                                                    : undefined
                                            }
                                            autoComplete={
                                                field.type === 'password'
                                                    ? 'new-password'
                                                    : undefined
                                            }
                                        />
                                    )}
                                </label>
                            ))}
                        </div>
                        {kind === 'receipts' && (
                            <p className="form-note">
                                Add the reference for your supporting document.
                                Approval is handled separately by an
                                administrator.
                            </p>
                        )}
                        {kind === 'users' && (
                            <p className="form-note">
                                Use a full name with at least two words.
                                Passwords need 8-20 characters, uppercase,
                                lowercase, and a number.
                                {edit
                                    ? ' Leave the password empty to keep it unchanged.'
                                    : ''}
                            </p>
                        )}
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
                                onClick={close}
                            >
                                Cancel
                            </button>
                            <button className="button primary" disabled={busy}>
                                {busy ? 'Saving...' : 'Save ' + config.label}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {remove && (
                <Modal
                    title={
                        kind === 'users'
                            ? 'Deactivate account?'
                            : 'Delete ' + config.label + '?'
                    }
                    onClose={close}
                >
                    <form onSubmit={save}>
                        <p className="form-note">
                            {kind === 'users'
                                ? 'The account will lose access. Existing financial records will remain intact.'
                                : 'This removes the selected record. Records linked to financial history may be protected from deletion.'}
                        </p>
                        {error && (
                            <p className="form-error" role="alert">
                                {error}
                            </p>
                        )}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="button"
                                onClick={close}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button className="button danger" disabled={busy}>
                                {busy
                                    ? 'Working...'
                                    : kind === 'users'
                                      ? 'Deactivate account'
                                      : 'Delete record'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {review && (
                <Modal
                    title={
                        review.action === 'Pending'
                            ? 'Request receipt revision'
                            : review.action === 'Approved'
                              ? 'Approve receipt'
                              : 'Reject receipt'
                    }
                    onClose={close}
                >
                    <form onSubmit={save}>
                        <p className="form-note">
                            Receipt #{review.row.ID_Nota} -{' '}
                            {review.row.File_Nota}
                        </p>
                        <label>
                            {review.action === 'Pending'
                                ? 'Revision instructions'
                                : 'Review note'}
                            <textarea
                                name="Catatan"
                                required={review.action !== 'Approved'}
                                maxLength={2000}
                            />
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
                                onClick={close}
                                disabled={busy}
                            >
                                Cancel
                            </button>
                            <button className="button primary" disabled={busy}>
                                {busy ? 'Saving...' : 'Confirm decision'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
