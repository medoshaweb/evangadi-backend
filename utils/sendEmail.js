import nodemailer from "nodemailer";

const sendEmail = async (to, subject, htmlContent) => {
  try {
    // Create a reusable transporter object using SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // e.g., smtp.gmail.com, smtp.office365.com
      port: process.env.EMAIL_PORT, // e.g., 587 for TLS, 465 for SSL
      secure: process.env.EMAIL_PORT == 465, // true for port 465, false for others
      auth: {
        user: process.env.EMAIL_USER, //  SMTP email
        pass: process.env.EMAIL_PASS, //  SMTP password or app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // sender address
      to, // recipient
      subject, // email subject
      html: htmlContent, // email content as HTML
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
