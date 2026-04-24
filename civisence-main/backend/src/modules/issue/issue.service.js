const Issue = require('./issue.model');
const notificationService = require('../notification/notification.service');
const userService = require('../user/user.service');

class IssueService {
    async createIssue(data) {
        const issue = await Issue.create({
            title: data.title?.trim(),
            category: data.category?.trim(),
            description: data.description?.trim(),
            location: data.location?.trim(),
            ward: data.ward?.trim(),
            lat: data.lat,
            lng: data.lng,
            severity: data.severity,
            department: data.department?.trim(),
            imageUrl: data.imageUrl,
            createdBy: data.createdBy,
            confirmCount: 0,
            resolvedConfirmCount: 0,
            timeline: [{ label: 'Reported', date: new Date().toISOString(), done: true }],
        });

        // Trigger Notification to Authorities
        try {
            const authorities = await userService.getUsersByRole('authority');
            const notifications = authorities.map(auth => ({
                userId: auth._id,
                type: 'new_issue',
                title: 'New Issue Reported',
                message: `A new ${issue.category} issue was reported in ${issue.location || 'your area'}.`,
                meta: { issueId: issue._id }
            }));

            // Fire and forget
            Promise.all(notifications.map(n => notificationService.createNotification(n))).catch(console.error);
        } catch (err) {
            console.error('Failed to notify authorities of new issue:', err);
        }

        return issue;
    }

    async getIssues(query) {
        const { status, sort = 'latest', page = 1, limit = 10 } = query;
        let filter = {};
        if (status) filter.status = status;
        let sortObj = { reportedAt: -1 };
        if (sort === 'trending') sortObj = { trendingScore: -1, confirmCount: -1, reportedAt: -1 };
        else if (sort === 'latest') sortObj = { reportedAt: -1 };

        return await Issue.find(filter)
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(Number(limit));
    }

    async getIssueById(id) {
        return await Issue.findById(id);
    }

    async updateStatus(id, status) {
        if (!['open', 'in_progress', 'resolved', 'rejected'].includes(status)) {
            throw new Error('Invalid status.');
        }
        const issue = await Issue.findByIdAndUpdate(id, { status }, { new: true });
        if (!issue) throw new Error('Issue not found.');

        // Trigger Notification to the original reporter
        try {
            let title = 'Issue Status Updated';
            let message = `Your issue "${issue.title}" is now ${status.replace('_', ' ')}.`;
            let type = 'issue_update';

            if (status === 'resolved') {
                title = 'Issue Resolved';
                message = `Your issue "${issue.title}" has been successfully resolved!`;
                type = 'resolution';
            }

            notificationService.createNotification({
                userId: issue.createdBy,
                type,
                title,
                message,
                meta: { issueId: issue._id }
            }).catch(console.error);
        } catch (err) {
            console.error('Failed to notify status update', err);
        }

        return issue;
    }

    async getMyReports(userId) {
        return await Issue.find({ createdBy: userId });
    }
}

module.exports = new IssueService();
