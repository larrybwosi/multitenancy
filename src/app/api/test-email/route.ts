// pages/api/send-email.ts
import { NextRequest, NextResponse } from "next/server";

import FormData from "form-data"; // form-data v4.0.1
import Mailgun from "mailgun.js"; // mailgun.js v11.1.0
import { sendInvitationEmail } from "@/actions/emails";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const headerlist = await req.headers;
  try {
    const session = await auth.api.getSession({ headers: headerlist });
    console.log(session)
    // const response = await sendInvitationEmail('rodneybwosi@gmail.com','some-token','Organisation Name','Larry Dean');

    return NextResponse.json({
      message: "Email sent successfully!",
      data: session,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({
      error: "Failed to send email",
    });
  }
}

async function sendSimpleMessage() {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: "api",
    key: process.env.MAIL_GUN_KEY || "API_KEY",
    // When you have an EU-domain, you must specify the endpoint:
    // url: "https://api.eu.mailgun.net"
  });
  try {
    const data = await mg.messages.create(
      "sandbox8dd4b33409e145a39b5ac450c3aa49d4.mailgun.org",
      {
        from: "Mailgun Sandbox <postmaster@sandbox8dd4b33409e145a39b5ac450c3aa49d4.mailgun.org>",
        to: ["Larry Dean <rodneybwosi@gmail.com>"],
        subject: "Hello Larry Dean",
        text: "Congratulations Larry Dean, you just sent an email with Mailgun! You are truly awesome!",
      }
    );

    console.log(data); // logs response data
  } catch (error) {
    console.log(error); //logs any error
  }
}