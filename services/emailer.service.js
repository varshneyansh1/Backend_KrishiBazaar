import nodemailer from "nodemailer";
// Use nodemailer to send emails
export const sendEmail = async (params) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.NODE_MAIL,
      pass: process.env.NODE_PASS,  // Use environment variables for security
    },
  });

  const mailOptions = {
    from: process.env.NODE_MAIL,
    to: params.email,
    subject: params.subject,
    html: params.body,  // Using HTML to send clickable links
  };

  await transporter.sendMail(mailOptions);
};
