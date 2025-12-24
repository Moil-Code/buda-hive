import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendLicenseActivationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();

    // Validate emails array
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Valid email addresses are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json(
        { error: 'Access denied. Admin account required.' },
        { status: 403 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [] as string[],
      licenses: [] as any[],
    };

    // Process each email
    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Validate email format
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        results.failed++;
        results.errors.push(`Invalid email format: ${email}`);
        continue;
      }

      // Check if license already exists for this email
      const { data: existingLicense } = await supabase
        .from('licenses')
        .select('*')
        .eq('email', trimmedEmail)
        .eq('admin_id', user.id)
        .single();

      if (existingLicense) {
        results.failed++;
        results.errors.push(`License already exists for: ${trimmedEmail}`);
        continue;
      }

      // Create new license
      const { data: license, error: licenseError } = await supabase
        .from('licenses')
        .insert({
          admin_id: user.id,
          email: trimmedEmail,
          business_name: '', // Will be filled during activation
          business_type: '', // Will be filled during activation
          is_activated: false,
        })
        .select()
        .single();

      if (licenseError) {
        results.failed++;
        results.errors.push(`Failed to create license for ${trimmedEmail}: ${licenseError.message}`);
        continue;
      }

      results.success++;
      results.licenses.push({
        id: license.id,
        email: license.email,
        isActivated: license.is_activated,
        createdAt: license.created_at,
      });

      // Send activation email
      const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://business.moilapp.com'}/register?licenseId=${license.id}&ref=budaHive&org=buda-hive`;
      
      const emailResult = await sendLicenseActivationEmail({
        email: license.email,
        activationUrl,
        adminName: `${adminData.first_name} ${adminData.last_name}`,
      });

      if (emailResult.success) {
        results.emailsSent++;
      } else {
        results.emailsFailed++;
        console.error(`Failed to send email to ${trimmedEmail}:`, emailResult.error);
      }
    }

    return NextResponse.json(
      { 
        message: `Processed ${emails.length} emails: ${results.success} licenses added, ${results.emailsSent} emails sent, ${results.failed} failed`,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Add multiple licenses error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
