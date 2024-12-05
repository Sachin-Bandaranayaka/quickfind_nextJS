import express from 'express';
import Report from '../models/Report';
import Advertisement from '../models/Advertisement';
import { sendEmail } from '../config/email';
import { emailTemplates } from '../templates/email';

const router = express.Router();

// Submit a report
router.post('/', async (req, res) => {
  try {
    const { advertisementId, reason, description } = req.body;
    const userId = req.user?._id; // Assuming you have authentication middleware

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if advertisement exists
    const advertisement = await Advertisement.findById(advertisementId)
      .populate('user', 'email name');
    
    if (!advertisement) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }

    // Check if user has already reported this ad
    const existingReport = await Report.findOne({
      advertisement: advertisementId,
      reporter: userId
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this advertisement' });
    }

    // Create report
    const report = new Report({
      advertisement: advertisementId,
      reporter: userId,
      reason,
      description
    });

    await report.save();

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const emailHtml = emailTemplates.reportReceived({
        adTitle: advertisement.title,
        adId: advertisement._id,
        reason,
        description,
        reporterName: req.user?.name || 'Anonymous',
        advertiserName: advertisement.user.name,
        advertiserEmail: advertisement.user.email
      });

      await sendEmail(
        adminEmail,
        'New Advertisement Report Received',
        emailHtml
      );
    }

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports for an advertisement (admin only)
router.get('/advertisement/:advertisementId', async (req, res) => {
  try {
    const { advertisementId } = req.params;
    // TODO: Add admin check middleware

    const reports = await Report.find({ advertisement: advertisementId })
      .populate('reporter', 'name')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update report status (admin only)
router.patch('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const adminId = req.user?._id; // TODO: Add admin check middleware

    const report = await Report.findByIdAndUpdate(
      reportId,
      {
        status,
        adminNotes,
        reviewedAt: new Date(),
        reviewedBy: adminId
      },
      { new: true }
    ).populate('advertisement');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // If report is resolved and status is spam/fraud, update advertisement status
    if (status === 'resolved' && ['spam', 'fraud'].includes(report.reason)) {
      await Advertisement.findByIdAndUpdate(report.advertisement._id, {
        status: 'removed',
        removedReason: report.reason
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 