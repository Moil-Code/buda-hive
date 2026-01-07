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
  teamId: string;
  inviteUrl: string;
  signupUrl: string;
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

    // Get EDC info for this email
    const edcInfo = getEdcInfoForEmail(data.email, data.edc);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: `You've been invited to join ${data.teamName} on ${edcInfo.programName}! 🤝`,
      react: TeamInvitationEmail({
        email: data.email,
        inviterName: data.inviterName,
        teamName: data.teamName,
        teamId: data.teamId,
        inviteUrl: data.inviteUrl,
        signupUrl: data.signupUrl,
        role: data.role,
        edc: edcInfo,
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

export interface BatchLicenseActivationData {
  licenses: Array<{
    email: string;
    activationUrl: string;
    licenseId: string;
  }>;
  adminName: string;
  adminEmail?: string;
  edc?: EdcEmailInfo;
}

export async function sendBatchLicenseActivationEmails(data: BatchLicenseActivationData) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    if (data.licenses.length === 0) {
      return { success: true, results: [], sent: 0, failed: 0 };
    }

    // Get EDC info for this batch
    const edcInfo = getEdcInfoForEmail(data.adminEmail, data.edc);

    // Use Resend's batch.send API (max 100 emails per batch)
    const batchSize = 100;

    // Process in batches using functional programming
    const batches = data.licenses.reduce<typeof data.licenses[]>((acc, license, index) => {
      const batchIndex = Math.floor(index / batchSize);
      if (!acc[batchIndex]) acc[batchIndex] = [];
      acc[batchIndex].push(license);
      return acc;
    }, []);

    // Send each batch using resend.batch.send
    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        try {
          // Prepare batch email data
          const batchEmails = batch.map(license => ({
            from: FROM_EMAIL,
            to: [license.email],
            subject: `Welcome to ${edcInfo.programName}! 🎉`,
            react: LicenseActivationEmail({
              email: license.email,
              activationUrl: license.activationUrl,
              adminName: data.adminName,
              edc: edcInfo,
            }),
          }));

          // Send batch
          const result = await resend.batch.send(batchEmails);

          if (result.error) {
            // If batch fails, mark all as failed
            return batch.map(license => ({
              email: license.email,
              licenseId: license.licenseId,
              success: false as const,
              error: result.error?.message || 'Batch send failed',
            }));
          }

          // Map successful results back to licenses
          // Resend batch.send returns an array of email IDs
          const batchData = Array.isArray(result.data) ? result.data : [];
          return batch.map((license, index) => ({
            email: license.email,
            licenseId: license.licenseId,
            success: true as const,
            messageId: typeof batchData[index] === 'object' && batchData[index] !== null 
              ? (batchData[index] as any).id 
              : undefined,
          }));
        } catch (error) {
          // If batch throws error, mark all as failed
          return batch.map(license => ({
            email: license.email,
            licenseId: license.licenseId,
            success: false as const,
            error: error instanceof Error ? error.message : 'Unknown error',
          }));
        }
      })
    );

    // Flatten results
    const flatResults = batchResults.flat();
    const sent = flatResults.filter(r => r.success).length;
    const failed = flatResults.filter(r => !r.success).length;

    console.log(`Batch email sending complete: ${sent} sent, ${failed} failed`);
    return { success: true, results: flatResults, sent, failed };
  } catch (error) {
    console.error('Error sending batch license activation emails:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      results: [],
      sent: 0,
      failed: data.licenses.length
    };
  }
}

export async function getEmailDeliveryStatus(messageId: string) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    const email = await resend.emails.get(messageId);
    
    if (email.error) {
      return { success: false, error: email.error.message, status: 'unknown' };
    }

    // Get status from last_event field
    const status = email.data?.last_event || 'sent';
    return { 
      success: true, 
      status: status as string,
      data: email.data
    };
  } catch (error) {
    console.error('Error getting email delivery status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'unknown'
    };
  }
}

export async function getBatchEmailStatuses(messageIds: string[]) {
  try {
    if (!process.env.RESEND_API) {
      throw new Error('RESEND_API environment variable is not configured.');
    }

    // Fetch status for each message ID in parallel
    const statusPromises = messageIds.map(async (messageId) => {
      try {
        const email = await resend.emails.get(messageId);
        if (email.error) {
          return { messageId, status: 'unknown' };
        }
        return { 
          messageId, 
          status: email.data?.last_event || 'sent' 
        };
      } catch (error) {
        return { messageId, status: 'unknown' };
      }
    });

    const results = await Promise.all(statusPromises);
    
    // Create a map of messageId to status
    const statusMap: Record<string, string> = {};
    results.forEach(({ messageId, status }) => {
      statusMap[messageId] = status;
    });

    return { 
      success: true, 
      statuses: statusMap
    };
  } catch (error) {
    console.error('Error getting batch email statuses:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      statuses: {}
    };
  }
}
