// routes/complexTransactionRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');

const {
    getProjectMonthly,
    projectBudgetAdjustment
} = require('../controllers/financeController');
const {
    getApprovalStats,
    bulkNotaApproval
} = require('../controllers/approvalController');
const {
    getProjectTimeline,
    transferProject
} = require('../controllers/projectController');
const {
    getNotaAnalysis,
    getNotaUser,
    notaRevisionRequest
} = require('../controllers/notaController');
const {
    getTransactionHistory,
    getRecentHistory
} = require('../controllers/historyController');
const {
    createBatchTransactions,
    projectTransactionAnalysis
} = require('../controllers/transaksiController');
const {
    projectSummaryReport,
    userActivityReport
} = require('../controllers/reportController');

// Middleware untuk semua routes
router.use(authMiddleware, require('../middleware/scope').validate);
router.use(require('../middleware/scope').user);
router.use(require('../middleware/scope').project);
router.get('/project-monthly', getProjectMonthly);
router.get('/admin-approval-stats', isAdmin, getApprovalStats);
router.get(
    '/project-timeline/:projectId',
    require('../middleware/scope').project,
    getProjectTimeline
);
router.get('/nota-verification-analysis', isAdmin, getNotaAnalysis);
router.get(
    '/user-transaction-history/:userId',
    require('../middleware/scope').user,
    getTransactionHistory
);
router.get(
    '/user-last-activities/:userId',
    require('../middleware/scope').user,
    getRecentHistory
);
router.get(
    '/user-nota-status/:userId',
    require('../middleware/scope').user,
    getNotaUser
);

router.post('/batch-transaction', createBatchTransactions);
router.post('/transfer-project', transferProject);
router.post('/project-summary-report', projectSummaryReport);
router.post('/project-transaction-analysis', projectTransactionAnalysis);
router.post('/user-activity-report', userActivityReport);

router.put('/bulk-nota-approval', isAdmin, bulkNotaApproval);
router.put('/project-budget-adjustment', projectBudgetAdjustment);
router.put('/nota-revision-request', isAdmin, notaRevisionRequest);

module.exports = router;
