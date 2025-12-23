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

      // Check if license already exists
      const { data: existing } = await supabase
        .from('licenses')
        .select('id')
        .eq('email', email)
        .eq('admin_id', user.id)
        .single();

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
