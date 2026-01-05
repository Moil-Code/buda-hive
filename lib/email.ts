import { Resend } from 'resend';
import { LicenseActivationEmail } from '../emails/license-activation';
import { TeamInvitationEmail } from '../emails/team-invitation';
import { getEdcByEmail, getDefaultEdc, type PartnerEdc } from './partnerEdcs';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'Buda Hive <onboarding@resend.dev>';

export interface EdcEmailInfo {
  programName: string;
  fullName: string;
  logoInitial: string;
  primaryColor: string;
  supportEmail: string;
  licenseDuration: string;
  jobPosts?: number;
}

export interface LicenseActivationData {
  email: string;
  activationUrl: string;
  adminName: string;
  adminEmail?: string; // Used to determine which EDC the admin belongs to
  edc?: EdcEmailInfo; // Optional: pass EDC info directly
}

export interface TeamInvitationData {
  email: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  role: string;
  edc?: EdcEmailInfo;
}

/**
 * Convert a PartnerEdc to EdcEmailInfo for email templates
 */
function edcToEmailInfo(edc: PartnerEdc): EdcEmailInfo {
  return {
    programName: edc.programName,
    fullName: edc.fullName,
    logoInitial: edc.logoInitial,
    primaryColor: edc.primaryColor,
    supportEmail: edc.supportEmail,
    licenseDuration: edc.licenseDuration,
    jobPosts: edc.features.jobPosts,
  };
}

/**
 * Get EDC info for email based on admin email or provided EDC
 */
function getEdcInfoForEmail(adminEmail?: string, providedEdc?: EdcEmailInfo): EdcEmailInfo {
  if (providedEdc) {
    return providedEdc;
  }
  
  if (adminEmail) {
    const edc = getEdcByEmail(adminEmail);
    if (edc) {
      return edcToEmailInfo(edc);
    }
  }
  
  // Default to Buda Hive
  return edcToEmailInfo(getDefaultEdc());
}

export async function sendLicenseActivationEmail(data: LicenseActivationData) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    // Get EDC info for this email
    const edcInfo = getEdcInfoForEmail(data.adminEmail, data.edc);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Welcome to ${edcInfo.programName}! 🎉`,
      react: LicenseActivationEmail({
        email: data.email,
        activationUrl: data.activationUrl,
        adminName: data.adminName,
        edc: edcInfo,
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
