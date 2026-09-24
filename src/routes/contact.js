// ===== Contact Form Route =====
// Validates the contact submission, stores it in the database, and emails a
// notification. Extracted verbatim from server.js; mounted at /api.
const express = require('express');

module.exports = function createContactRouter({ loadDB, saveDB, transporter, EMAIL_USER, EMAIL_PASS }) {
  const router = express.Router();

  router.post('/contact', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Please enter your name.' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email.' });
      }
      if (!subject) {
        return res.status(400).json({ success: false, message: 'Please select a subject.' });
      }
      if (!message || message.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
      }

      // Save to database
      const db = loadDB();
      if (!db.messages) db.messages = [];

      const newMessage = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
        createdAt: new Date().toISOString()
      };

      db.messages.push(newMessage);
      saveDB(db);

      // Send email notification
      if (EMAIL_PASS && EMAIL_PASS !== 'YOUR_APP_PASSWORD_HERE') {
        try {
          await transporter.sendMail({
            from: `"Digital Bridges Zambia" <${EMAIL_USER}>`,
            to: EMAIL_USER,
            replyTo: email,
            subject: `[Contact Form] ${subject} - from ${name}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <table style="border-collapse:collapse;width:100%;max-width:600px;">
                <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Name</td><td style="padding:8px;border-bottom:1px solid #ddd;">${name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Email</td><td style="padding:8px;border-bottom:1px solid #ddd;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Subject</td><td style="padding:8px;border-bottom:1px solid #ddd;">${subject}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #ddd;">Message</td><td style="padding:8px;border-bottom:1px solid #ddd;">${message.replace(/\n/g, '<br>')}</td></tr>
              </table>
              <p style="color:#888;font-size:12px;margin-top:20px;">Sent from Digital Bridges Zambia contact form.</p>
            `
          });
          console.log(`Email sent: ${subject} from ${name} (${email})`);
        } catch (emailErr) {
          console.error('Email send error:', emailErr.message);
        }
      } else {
        console.log(`Message saved (email not configured): ${subject} from ${name} (${email})`);
      }

      res.json({ success: true, message: 'Message sent successfully!' });
    } catch (err) {
      console.error('Contact form error:', err);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
  });

  return router;
};
