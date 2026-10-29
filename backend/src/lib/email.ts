import { env } from "./env.js";

/**
 * Placeholder email service — logs instead of sending.
 *
 * No real provider is wired up yet (see PENDING.md). This exists so every
 * call site in the codebase already goes through one interface, shaped to
 * match how Resend's SDK is called (`{ from, to, subject, html }`), so
 * swapping in the real thing later is a one-file change:
 *
 *   import { Resend } from "resend";
 *   const resend = new Resend(env.RESEND_API_KEY);
 *   export const sendEmail = (msg) => resend.emails.send({ from: env.EMAIL_FROM, ...msg });
 *
 * Until then, calling this does NOT deliver anything — treat console output
 * as the only record of what "would have" been sent.
 */

export interface EmailMessage {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

export const sendEmail = async (message: EmailMessage): Promise<{ delivered: false }> => {
	console.log(
		`\n✉️  [email:placeholder] Not actually sent — no provider configured yet.\n` +
			`    From:    ${env.EMAIL_FROM}\n` +
			`    To:      ${message.to}\n` +
			`    Subject: ${message.subject}\n` +
			`    Body:\n${message.text ?? message.html.replace(/<[^>]+>/g, " ").trim()}\n`,
	);
	return { delivered: false };
};

// ─── Templates used across the app ─────────────────────────────
// Kept plain (no templating engine) on purpose — there's only a handful of
// these; reach for a real template system if/when that stops being true.

export const emailTemplates = {
	verifyEmail: (params: { url: string }) => ({
		subject: "Verify your email — My Dubai Broker",
		html: `
			<p>Confirm your email address to finish setting up your account.</p>
			<p><a href="${params.url}">Verify email</a></p>
		`,
	}),

	resetPassword: (params: { url: string }) => ({
		subject: "Reset your password — My Dubai Broker",
		html: `
			<p>We received a request to reset your password.</p>
			<p><a href="${params.url}">Choose a new password</a></p>
			<p>If you didn't request this, you can safely ignore this email.</p>
		`,
	}),

	invitation: (params: { companyName: string; role: string; inviteUrl: string }) => ({
		subject: `You're invited to join ${params.companyName} on My Dubai Broker`,
		html: `
			<p>You've been invited to join <strong>${params.companyName}</strong> on My Dubai Broker as a <strong>${params.role.replace("_", " ")}</strong>.</p>
			<p><a href="${params.inviteUrl}">Accept your invitation</a> to set up your account.</p>
			<p>This link expires in 7 days.</p>
		`,
	}),

	companyStatusChanged: (params: {
		companyName: string;
		status: string;
		reason?: string;
	}) => ({
		subject: `Update on your ${params.companyName} application`,
		html: `
			<p>Your company application for <strong>${params.companyName}</strong> is now <strong>${params.status.replace("_", " ")}</strong>.</p>
			${params.reason ? `<p>${params.reason}</p>` : ""}
		`,
	}),

	listingStatusChanged: (params: {
		listingTitle: string;
		status: string;
		reason?: string;
	}) => ({
		subject: `Update on your listing "${params.listingTitle}"`,
		html: `
			<p>Your listing <strong>${params.listingTitle}</strong> is now <strong>${params.status.replace("_", " ")}</strong>.</p>
			${params.reason ? `<p>${params.reason}</p>` : ""}
		`,
	}),

	newLead: (params: { listingTitle: string; customerName: string; leadUrl: string }) => ({
		subject: `New enquiry: ${params.listingTitle}`,
		html: `
			<p><strong>${params.customerName}</strong> enquired about <strong>${params.listingTitle}</strong>.</p>
			<p><a href="${params.leadUrl}">View the enquiry</a>.</p>
		`,
	}),
};
