'use server'
import nodemailer from "nodemailer";

  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // App password if 2FA is enabled
    },
  });

// Send invitation email with beautiful template
export async function sendInvitationEmail(
  recipientEmail: string,
  token: string,
  organizationName: string,
  inviterName?: string
): Promise<boolean> {
  
  if (!recipientEmail || !token || !organizationName) {
    throw new Error("Missing required parameters: recipientEmail, token, organizationName");
  }
  try {
    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${token}`;

    // Email template with modern, responsive design
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to ${organizationName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .email-wrapper {
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          
          .email-header {
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
            padding: 30px 20px;
            text-align: center;
          }
          
          .email-header img {
            max-width: 150px;
            margin-bottom: 15px;
          }
          
          .email-header h1 {
            color: white;
            font-weight: 600;
            font-size: 24px;
            margin: 0;
          }
          
          .email-body {
            padding: 40px 30px;
          }
          
          .email-body p {
            margin-bottom: 20px;
            font-size: 16px;
            color: #4B5563;
          }
          
          .email-body strong {
            color: #111827;
          }
          
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(107, 114, 255, 0.25);
          }
          
          .button:hover {
            box-shadow: 0 6px 16px rgba(107, 114, 255, 0.35);
            transform: translateY(-2px);
          }
          
          .secondary-link {
            display: block;
            text-align: center;
            margin-top: 16px;
            color: #6B7280;
            font-size: 14px;
          }
          
          .email-footer {
            padding: 25px 30px;
            background-color: #F9FAFB;
            text-align: center;
            border-top: 1px solid #E5E7EB;
          }
          
          .email-footer p {
            color: #6B7280;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .social-links {
            margin: 15px 0;
          }
          
          .social-link {
            display: inline-block;
            margin: 0 8px;
          }
          
          @media only screen and (max-width: 600px) {
            .email-body {
              padding: 30px 20px;
            }
            
            .email-header {
              padding: 25px 15px;
            }
            
            .email-header h1 {
              font-size: 22px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-wrapper">
            <div class="email-header">
              <!-- Replace with your actual logo URL -->
              <img src="${process.env.NEXT_PUBLIC_BASE_URL}/assets/logo.png" alt="${organizationName} Logo" />
              <h1>You've been invited to join ${organizationName}!</h1>
            </div>
            
            <div class="email-body">
              <p>Hi there,</p>
              
              <p>${inviterName ? `<strong>${inviterName}</strong> has invited you` : "You have been invited"} to join <strong>${organizationName}</strong> workspace. Join the team to start collaborating!</p>
              
              <div class="button-container">
                <a href="${acceptUrl}" class="button">Accept Invitation</a>
              </div>
              
              <p>This invitation link will expire in ${process.env.INVITATION_EXPIRY_DAYS || 7} days. If you have any questions, please contact us at <a href="mailto:${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}">${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}</a>.</p>
              
              <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
              <p style="text-align: center; word-break: break-all;"><a href="${acceptUrl}">${acceptUrl}</a></p>
              
              <p>Best regards,<br>The ${organizationName} Team</p>
            </div>
            
            <div class="email-footer">
              <p>&copy; ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
              <p>Our address: ${process.env.COMPANY_ADDRESS || "123 Main St, City, Country"}</p>
              
              <div class="social-links">
                <!-- Replace with your actual social media links -->
                <a href="${process.env.SOCIAL_TWITTER || "#"}" class="social-link">Twitter</a>
                <a href="${process.env.SOCIAL_LINKEDIN || "#"}" class="social-link">LinkedIn</a>
                <a href="${process.env.SOCIAL_INSTAGRAM || "#"}" class="social-link">Instagram</a>
              </div>
              
              <p><small>If you didn't request this invitation, please ignore this email.</small></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Text-only version as fallback
    // const textVersion = `
    //   Invitation to join ${organizationName}
      
    //   Hi there,
      
    //   ${inviterName ? `${inviterName} has invited you` : "You have been invited"} to join ${organizationName} workspace. Join the team to start collaborating!
      
    //   Accept the invitation by visiting:
    //   ${acceptUrl}
      
    //   This invitation link will expire in ${process.env.INVITATION_EXPIRY_DAYS || 7} days.
      
    //   If you have any questions, please contact us at ${process.env.SUPPORT_EMAIL || process.env.EMAIL_USER}.
      
    //   Best regards,
    //   The ${organizationName} Team
      
    //   © ${new Date().getFullYear()} ${organizationName}. All rights reserved.
    // `;

    // Send the email
    const info = await transporter.sendMail({
      from: `"${organizationName}" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `You've been invited to join ${organizationName}`,
      // text: textVersion,
      html: htmlTemplate,
    });

    console.log(info)
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return false;
  }
}
