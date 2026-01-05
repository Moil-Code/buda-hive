import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendLicenseActivationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user's team and team info
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    // Skip header row
    const dataLines = lines.slice(1);

    // Check available licenses for team before importing
    if (teamId && team) {
      const { count: assignedCount } = await supabase
        .from('licenses')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teamId);

      const availableLicenses = (team.purchased_license_count || 0) - (assignedCount || 0);
      
      if (dataLines.length > availableLicenses) {
        return NextResponse.json({
          error: `Only ${availableLicenses} license(s) available. You're trying to import ${dataLines.length}.`
        }, { status: 400 });
      }
    }
    
    const results = {
      success: 0,
      failed: 0,
      emailsSent: 0,
      emailsFailed: 0,
      errors: [] as string[],
    };

    for (const line of dataLines) {
      const [email] = line.split(',').map(field => field.trim());
      
      if (!email) continue;

      // Validate email
      if (!email.includes('@')) {
        results.failed++;
        results.errors.push(`Invalid email: ${email}`);
        continue;
      }

      // Check if license already exists (team-wide if in a team)
      let existingQuery = supabase
        .from('licenses')
        .select('id')
        .eq('email', email.toLowerCase());

      if (teamId) {
        existingQuery = existingQuery.eq('team_id', teamId);
      } else {
        existingQuery = existingQuery.eq('admin_id', user.id);
      }

      const { data: existing } = await existingQuery.single();

      if (existing) {
        results.failed++;
        results.errors.push(`License already exists for: ${email}`);
        continue;
      }

      // Insert license (business info will be added during activation)
      const { data: license, error: insertError } = await supabase
        .from('licenses')
        .insert({
          email: email.toLowerCase(),
          admin_id: user.id,
          business_name: '',
          business_type: '',
          is_activated: false,
          team_id: teamId || null,
          performed_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        results.failed++;
        results.errors.push(`Failed to add ${email}: ${insertError.message}`);
      } else {
        results.success++;
        
        // Send activation email
        const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://business.moilapp.com'}/register?licenseId=${license.id}&ref=budaHive&org=buda-hive`;
        
        const emailResult = await sendLicenseActivationEmail({
          email: license.email,
          activationUrl,
          adminName: `${admin.first_name} ${admin.last_name}`,
        });

        if (emailResult.success) {
          results.emailsSent++;
        } else {
          results.emailsFailed++;
          console.error(`Failed to send email to ${email}:`, emailResult.error);
        }
      }
    }

    // Log activity
    if (teamMember?.team_id && results.success > 0) {
      await supabase.rpc('log_activity', {
        p_team_id: teamMember.team_id,
        p_admin_id: user.id,
        p_activity_type: 'licenses_imported',
        p_description: `Imported ${results.success} licenses from CSV`,
        p_metadata: { 
          success_count: results.success, 
          failed_count: results.failed,
          emails_sent: results.emailsSent 
        }
      });
    }

    return NextResponse.json({
      message: `Import complete: ${results.success} licenses added, ${results.emailsSent} emails sent, ${results.failed} failed`,
      results,
    }, { status: 200 });

  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
