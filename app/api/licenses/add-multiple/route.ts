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

    // Get user's team membership and team info
    const { data: teamMember } = await supabase
      .from('team_members')
      .select(`
        team_id,
        team:teams (
          id,
          purchased_license_count
        )
      `)
      .eq('admin_id', user.id)
      .single();

    const teamId = teamMember?.team_id;
    const team = teamMember?.team as unknown as { id: string; purchased_license_count: number } | null;

    // Check available licenses for team
    let availableLicenses = Infinity; // Unlimited for solo admins
    if (teamId && team) {
      const { count: assignedCount } = await supabase
        .from('licenses')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      availableLicenses = (team.purchased_license_count || 0) - (assignedCount || 0);
      
      if (availableLicenses <= 0) {
        return NextResponse.json(
          { error: 'No available licenses. Please purchase more licenses.' },
          { status: 400 }
        );
      }

      if (emails.length > availableLicenses) {
        return NextResponse.json(
          { error: `Only ${availableLicenses} license(s) available. You're trying to add ${emails.length}.` },
          { status: 400 }
        );
      }
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

      // Check if license already exists for this email (team-wide if in a team)
      let existingLicenseQuery = supabase
        .from('licenses')
        .select('*')
        .eq('email', trimmedEmail);
      
      if (teamId) {
        existingLicenseQuery = existingLicenseQuery.eq('team_id', teamId);
      } else {
        existingLicenseQuery = existingLicenseQuery.eq('admin_id', user.id);
      }

      const { data: existingLicense } = await existingLicenseQuery.single();

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
          team_id: teamId || null,
          performed_by: user.id,
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

    // Log activity
    if (teamMember?.team_id && results.success > 0) {
      await supabase.rpc('log_activity', {
        p_team_id: teamMember.team_id,
        p_admin_id: user.id,
        p_activity_type: 'license_added',
        p_description: `Added ${results.success} license${results.success > 1 ? 's' : ''}`,
        p_metadata: { 
          count: results.success,
          emails_sent: results.emailsSent 
        }
      });
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
