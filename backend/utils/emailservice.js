const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendTicketEmail = async (toEmail, ticketData) => {
    const { ticketnum, eventname, eventstart, eventend, type, regfee, participantName } = ticketData;

    const qrDataUrl = await QRCode.toDataURL(ticketnum);
    const qrBase64 = qrDataUrl.split(',')[1];

    const mailOptions = {
        from: `"Felicity Events" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `Registration Confirmed - ${eventname}`,
        html: `
            <h2>Registration Confirmed!</h2>
            <p>Hi ${participantName},</p>
            <p>You have successfully registered for <strong>${eventname}</strong>.</p>
            <table>
                <tr><td><strong>Ticket ID:</strong></td><td>${ticketnum}</td></tr>
                <tr><td><strong>Event Type:</strong></td><td>${type}</td></tr>
                <tr><td><strong>Event Date:</strong></td><td>${new Date(eventstart).toLocaleDateString()} - ${new Date(eventend).toLocaleDateString()}</td></tr>
                <tr><td><strong>Fee:</strong></td><td>${regfee ? '₹' + regfee : 'Free'}</td></tr>
            </table>
            <p>Your QR Code ticket:</p>
            <img src="cid:qrcode" alt="QR Code" />
            <p>Show this QR code at the event entrance.</p>
            <br/>
            <p>- Felicity Event Management</p>
        `,
        attachments: [{
            filename: 'ticket-qr.png',
            content: qrBase64,
            encoding: 'base64',
            cid: 'qrcode'
        }]
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendTicketEmail };
