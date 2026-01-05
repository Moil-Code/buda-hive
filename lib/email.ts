import { Resend } from 'resend';
import { LicenseActivationEmail } from '../emails/license-activation';
import { TeamInvitationEmail } from '../emails/team-invitation';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Buda Hive <onboarding@resend.dev>';

export interface LicenseActivationData {
  email: string;
  activationUrl: string;
  adminName: string;
}

export interface TeamInvitationData {
  email: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role: string;
}

export async function sendLicenseActivationEmail(data: LicenseActivationData) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'Your Buda Hive License Has Been Activated! 🎉',
      react: LicenseActivationEmail({
        email: data.email,
        activationUrl: data.activationUrl,
        adminName: data.adminName,
      }),
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('License activation email sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending license activation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendTeamInvitationEmail(data: TeamInvitationData) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `You've been invited to join ${data.teamName} on Buda Hive! 🤝`,
      react: TeamInvitationEmail({
        email: data.email,
        inviterName: data.inviterName,
        teamName: data.teamName,
        inviteUrl: data.inviteUrl,
        role: data.role,
      }),
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('Team invitation email sent:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Error sending team invitation email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
