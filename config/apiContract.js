module.exports = function applyContract(specs) {
    const schemas = (specs.components.schemas ||= {});
    const entities = {
        projects: 'Project',
        transaksi: 'Transaksi',
        nota: 'Nota',
        users: 'User',
        logs: 'LogAktivitas',
        approval: 'Approval'
    };
    schemas.User = {
        type: 'object',
        properties: {
            ID_User: { type: 'integer' },
            Nama: { type: 'string' },
            Email: { type: 'string', format: 'email' },
            Role: { type: 'string', enum: ['Admin', 'User'] },
            Status: { type: 'string', enum: ['Active', 'Inactive'] }
        }
    };
    const filter = (name, type = 'string') => ({
        in: 'query',
        name,
        schema: { type }
    });
    for (const [path, schema] of Object.entries(entities)) {
        schemas[schema] ||= { type: 'object' };
        const resource = (specs.paths['/api/' + path] ||= {});
        const op = (resource.get ||= { summary: 'List ' + path, tags: [path] });
        op.security = [{ bearerAuth: [] }];
        op.description =
            'Authenticated owner-scoped list. Users and approvals require Admin.';
        op.parameters = [
            {
                in: 'query',
                name: 'page',
                schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
                in: 'query',
                name: 'limit',
                schema: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 100,
                    default: 20
                }
            },
            ...(path === 'approval' ? [] : [filter('search')]),
            ...(path === 'transaksi'
                ? [
                      filter('ID_Project', 'integer'),
                      filter('Jenis_Transaksi'),
                      filter('start_date'),
                      filter('end_date')
                  ]
                : []),
            ...(['projects', 'users'].includes(path) ? [filter('Status')] : []),
            ...(path === 'nota' ? [filter('Status_Verifikasi')] : [])
        ];
        op.responses = {
            200: {
                description: 'Paginated records',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                data: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/' + schema
                                    }
                                },
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        total: { type: 'integer' },
                                        pages: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            400: { description: 'Invalid input' },
            401: { description: 'Invalid or inactive token' },
            403: { description: 'Insufficient role or ownership' }
        };
        if (resource.post) {
            resource.post.responses ||= {};
            resource.post.responses[201] = {
                description: 'Created; owner is the authenticated user'
            };
        }
    }
    for (const path of [
        '/api/auth/register',
        '/api/auth/login',
        '/api/auth/google',
        '/api/auth/google/callback',
        '/api/health'
    ])
        for (const op of Object.values(specs.paths[path] || {}))
            if (op && typeof op === 'object') op.security = [];
    const register = specs.paths['/api/auth/register']?.post;
    if (register) {
        register.description =
            'Public registration creates an active User. Admin requests return 403.';
        register.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: ['Nama', 'Email', 'Password'],
                        properties: {
                            Nama: {
                                type: 'string',
                                minLength: 3,
                                maxLength: 50
                            },
                            Email: { type: 'string', format: 'email' },
                            Password: {
                                type: 'string',
                                minLength: 8,
                                maxLength: 20
                            },
                            Role: {
                                type: 'string',
                                enum: ['User'],
                                default: 'User'
                            }
                        }
                    }
                }
            }
        };
    }
    const budget = specs.paths['/api/complex/project-budget-adjustment']?.put;
    if (budget)
        budget.description =
            'Atomically corrects existing transaction amounts and logs changes. No separate planned-budget model. Approved receipts or linked payments block adjustment.';
    for (const [path, method] of Object.entries({
        '/api/payments/create': 'post',
        '/api/payments/status/{orderId}': 'get',
        '/api/payments/notification': 'post'
    })) {
        specs.paths[path] ||= {};
        specs.paths[path][method] = {
            summary: path,
            tags: ['Payments'],
            security: path.endsWith('/notification')
                ? []
                : [{ bearerAuth: [] }],
            responses: {
                200: { description: 'Success' },
                201: { description: 'Created' },
                400: { description: 'Invalid input' },
                401: { description: 'Invalid token or signature' },
                403: { description: 'Not owner/Admin' },
                404: { description: 'Order or transaction missing' },
                409: { description: 'Existing payment or amount mismatch' },
                502: {
                    description:
                        'Provider unavailable; reconcile order before retry'
                },
                503: { description: 'Not configured' }
            }
        };
    }
    specs.paths['/api/payments/create'].post.requestBody = {
        required: true,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['transaksiId'],
                    properties: {
                        transaksiId: { type: 'integer' },
                        paymentMethod: { type: 'string', enum: ['snap'] },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' }
                    }
                }
            }
        }
    };
    specs.paths['/api/payments/status/{orderId}'].get.parameters = [
        {
            in: 'path',
            name: 'orderId',
            required: true,
            schema: { type: 'string' }
        }
    ];
    specs.paths['/api/payments/notification'].post.description =
        'Requires SHA-512(order_id + status_code + gross_amount + server key) signature_key. Fetches authoritative status and checks stored amount.';
    specs.info.description =
        'Manakeu financial API. JWT Bearer authentication, Admin/User roles and record ownership. See README for migrations, pagination, integrations and verification status.';
    return specs;
};
