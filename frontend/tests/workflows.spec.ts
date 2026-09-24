import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
const account = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '../../.local-test/preview-account.json'),
        'utf8'
    )
);
const stamp = Date.now();
const project = 'Browser project ' + stamp;
async function login(page: any) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Sign in to workspace' }).click();
    await expect(page).toHaveURL(/dashboard/);
}
test('real financial workflow, report, filters, mobile, and sign out', async ({
    page
}) => {
    await login(page);
    await page.goto('/projects');
    await page
        .getByRole('button', { name: 'New project', exact: true })
        .first()
        .click();
    await page.getByLabel('Project name').fill(project);
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(
        page.getByText('Project saved.', { exact: true })
    ).toBeVisible();
    const projects = await (
        await page.request.get(
            '/api/backend/projects?search=' + encodeURIComponent(project)
        )
    ).json();
    const id = projects.data[0].ID_Project;
    for (const [type, amount, description] of [
        ['Pemasukan', '1000000', 'Funding ' + stamp],
        ['Pengeluaran', '250000', 'Supplies ' + stamp]
    ]) {
        await page.goto('/transactions');
        await page
            .getByRole('button', { name: 'New transaction', exact: true })
            .first()
            .click();
        await page
            .getByRole('dialog')
            .getByLabel('Project', { exact: true })
            .selectOption(String(id));
        await page.getByLabel('Transaction type').selectOption(type);
        await page.getByLabel('Amount (IDR)', { exact: true }).fill(amount);
        await page.getByLabel('Description', { exact: true }).fill(description);
        await page.getByRole('button', { name: 'Save transaction' }).click();
        await expect(
            page.getByText('Transaction saved.', { exact: true })
        ).toBeVisible();
    }
    await page.getByLabel('Search transactions').fill('Supplies ' + stamp);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    const txs = await (
        await page.request.get('/api/backend/transaksi?ID_Project=' + id)
    ).json();
    const expense = txs.data.find(
        (r: any) => r.Jenis_Transaksi === 'Pengeluaran'
    );
    await page.goto('/budgets');
    await page.getByLabel('Project', { exact: true }).selectOption(String(id));
    await page
        .getByRole('row')
        .filter({ hasText: 'Supplies ' + stamp })
        .getByRole('button', { name: 'Adjust amount' })
        .click();
    await page.getByLabel('New amount (IDR)').fill('200000');
    await page
        .getByLabel('Reason for adjustment')
        .fill('Corrected supplier invoice');
    await page.getByRole('button', { name: 'Save adjustment' }).click();
    await expect(
        page.getByText('Adjustment saved and recorded in the activity log.')
    ).toBeVisible();
    await page.goto('/receipts');
    await page
        .getByRole('button', { name: 'New receipt', exact: true })
        .first()
        .click();
    await page.getByLabel('Transaction ID').fill(String(expense.ID_Transaksi));
    await page
        .getByLabel('Receipt file name or document reference')
        .fill('Invoice ' + stamp);
    await page.getByRole('button', { name: 'Save receipt' }).click();
    await expect(
        page.getByText('Receipt saved.', { exact: true })
    ).toBeVisible();
    await page.goto('/approvals');
    await page
        .getByRole('row')
        .filter({ hasText: 'Invoice ' + stamp })
        .getByRole('button', { name: 'Approve', exact: true })
        .click();
    await page.getByRole('button', { name: 'Confirm decision' }).click();
    await expect(
        page.getByText('Receipt approved.', { exact: true })
    ).toBeVisible();
    await page.goto('/reports?project=' + id);
    await page.getByRole('button', { name: 'Generate report' }).click();
    await expect(
        page.getByRole('heading', { name: project, exact: true })
    ).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByText(/800.000/)).toBeVisible();
    await page.screenshot({
        path: 'test-results/report-desktop.png',
        fullPage: true,
        animations: 'disabled'
    });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Good/ })).toBeVisible();
    await page.screenshot({
        path: 'test-results/dashboard-desktop.png',
        fullPage: true,
        animations: 'disabled'
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
        page.getByRole('button', { name: 'Open navigation' })
    ).toBeVisible();
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.screenshot({
        path: 'test-results/dashboard-mobile.png',
        fullPage: true,
        animations: 'disabled'
    });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
        .getByRole('link', { name: 'Activity logs', exact: true })
        .click();
    await expect(page.locator('tbody tr').first()).toBeVisible();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/login/);
});
test('session boundary and failed login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/login/);
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign in to workspace' }).click();
    await expect(page.locator('.form-error')).toBeVisible();
    expect((await page.request.get('/api/backend/projects')).status()).toBe(
        401
    );
});

test('users, RBAC, pagination, recovery, profile and cookie security', async ({
    page,
    browser
}) => {
    await login(page);
    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'manakeu_session')?.httpOnly).toBe(
        true
    );
    await page.goto('/users');
    await page
        .getByRole('button', { name: 'New user', exact: true })
        .first()
        .click();
    await page
        .getByLabel('Full name')
        .fill(
            'Browser Member ' +
                String(stamp).replace(/\d/g, (d) =>
                    String.fromCharCode(97 + Number(d))
                )
        );
    await page
        .getByLabel('Email address')
        .fill('member' + stamp + '@example.test');
    await page.getByLabel('Password', { exact: true }).fill('MemberPass123');
    await page.getByRole('button', { name: 'Save user' }).click();
    await expect(page.getByText('User saved.', { exact: true })).toBeVisible();
    const member = await browser.newContext();
    const mp = await member.newPage();
    await mp.goto('http://localhost:3001/login');
    await mp
        .getByLabel('Email address')
        .fill('member' + stamp + '@example.test');
    await mp.getByLabel('Password', { exact: true }).fill('MemberPass123');
    await mp.getByRole('button', { name: 'Sign in to workspace' }).click();
    await expect(mp).toHaveURL(/dashboard/);
    await expect(mp.getByRole('link', { name: 'Users & roles' })).toHaveCount(
        0
    );
    await mp.goto('http://localhost:3001/users');
    await expect(mp.getByText('This area is for administrators')).toBeVisible();
    expect(
        (
            await mp.request.get('http://localhost:3001/api/backend/users')
        ).status()
    ).toBe(403);
    await mp.goto('http://localhost:3001/projects');
    await expect(mp.getByText('Your projects start here')).toBeVisible();
    await mp.goto('http://localhost:3001/settings');
    await mp
        .getByLabel('Full name')
        .fill(
            'Browser Updated ' +
                String(stamp).replace(/\d/g, (d) =>
                    String.fromCharCode(97 + Number(d))
                )
        );
    await mp.getByRole('button', { name: 'Save profile' }).click();
    await expect(mp.getByText('Your profile has been updated.')).toBeVisible();
    await member.close();
    for (let i = 0; i < 11; i++) {
        const r = await page.request.post('/api/backend/projects', {
            headers: { Origin: 'http://localhost:3001' },
            data: {
                Nama_Project: 'Pagination ' + stamp + ' ' + i,
                Status: 'Active'
            }
        });
        expect(r.ok()).toBe(true);
    }
    await page.goto('/projects');
    await page.getByLabel('Search projects').fill('Pagination ' + stamp);
    await expect(page.locator('.pagination')).toContainText('11 records');
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await page.route('**/api/backend/projects?**', (route) =>
        route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Test service interruption' })
        })
    );
    await page.getByRole('button', { name: 'Refresh records' }).click();
    await expect(page.getByText('Test service interruption')).toBeVisible();
    await page.unroute('**/api/backend/projects?**');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(1);
    const csrf = await page.request.post('/api/backend/projects', {
        headers: { Origin: 'https://other.example' },
        data: { Nama_Project: 'Blocked' }
    });
    expect(csrf.status()).toBe(403);
    await page.goto('/dashboard');
    await expect(page.locator('.loading')).toHaveCount(0);
    await page.screenshot({
        path: 'test-results/dashboard-desktop.png',
        fullPage: true,
        animations: 'disabled'
    });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
        )
    ).toBe(true);
    await page.screenshot({
        path: 'test-results/dashboard-mobile.png',
        fullPage: true,
        animations: 'disabled'
    });
});

test.afterAll(async () => {
    const mysql = require('mysql2/promise');
    const db = await mysql.createConnection({
        host: '127.0.0.1',
        port: 33317,
        user: 'root',
        password: '',
        database: 'manakeu_preview'
    });
    try {
        const [projects] = await db.query(
            'SELECT ID_Project FROM project WHERE Nama_Project=? OR Nama_Project LIKE ?',
            [project, 'Pagination ' + stamp + ' %']
        );
        for (const p of projects) {
            await db.query(
                'DELETE a FROM approval a JOIN nota n ON n.ID_Nota=a.ID_Nota JOIN transaksi t ON t.ID_Transaksi=n.ID_Transaksi WHERE t.ID_Project=?',
                [p.ID_Project]
            );
            await db.query(
                'DELETE n FROM nota n JOIN transaksi t ON t.ID_Transaksi=n.ID_Transaksi WHERE t.ID_Project=?',
                [p.ID_Project]
            );
            await db.query('DELETE FROM transaksi WHERE ID_Project=?', [
                p.ID_Project
            ]);
            await db.query('DELETE FROM project WHERE ID_Project=?', [
                p.ID_Project
            ]);
        }
        const [users] = await db.query(
            'SELECT ID_User FROM user WHERE Email=?',
            ['member' + stamp + '@example.test']
        );
        for (const u of users) {
            await db.query('DELETE FROM log_aktivitas WHERE ID_User=?', [
                u.ID_User
            ]);
            await db.query('DELETE FROM user WHERE ID_User=?', [u.ID_User]);
        }
    } finally {
        await db.end();
    }
});
