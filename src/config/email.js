// Email Configuration
module.exports = {
    smtp: {
        host: 'sandbox.smtp.mailtrap.io',
        port: 2525,
        secure: false, // true for 465, false for other ports
        auth: {
            user: '5553cdd649cb3e',
            pass: 'cf627578b4736b'
        }
    },
    email: {
        from: 'Divar Crawler',
        to: 'your-email@example.com' // ایمیل شما
    }
};
