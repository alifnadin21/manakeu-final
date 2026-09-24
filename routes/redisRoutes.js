// routes/redisRoutes.js
const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/auth');
// const { isAdmin } = require('../middleware/roleMiddleware');

const {
    getUserSession,
    getProjectSummary,
    getUserActivities,
    getApprovalStats,
    getTransactionTimeline,
    getNotificationCounter,
    getMonthlyReport,
    getUserDashboard,
    getProjectMembers,
    getSearchResults
} = require('../controllers/redisController');

router.use(require('../middleware/scope').validate);
// User
router.get(
    '/session/:userId',
    require('../middleware/scope').user,
    getUserSession
);
router.get(
    '/user/activities/:userId',
    require('../middleware/scope').user,
    getUserActivities
);
router.get(
    '/user/notifications/:userId',
    require('../middleware/scope').user,
    getNotificationCounter
);
router.get(
    '/user/dashboard/:userId',
    require('../middleware/scope').user,
    getUserDashboard
);

// Project
router.get(
    '/project/summary/:projectId',
    require('../middleware/scope').project,
    getProjectSummary
);
router.get(
    '/project/timeline/:projectId',
    require('../middleware/scope').project,
    getTransactionTimeline
);
router.get(
    '/project/monthly/:projectId',
    require('../middleware/scope').project,
    getMonthlyReport
);
router.get(
    '/project/members/:projectId',
    require('../middleware/scope').project,
    getProjectMembers
);

router.get(
    '/admin/approval-stats/:adminId',
    require('../middleware/roleMiddleware').isAdmin,
    getApprovalStats
);
router.get('/search', getSearchResults);

module.exports = router;
