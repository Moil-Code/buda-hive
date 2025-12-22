import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendLicenseActivationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
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

    // Check if license already exists for this email
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('*')
      .eq('email', email)
      .eq('admin_id', user.id)
      .single();

    if (existingLicense) {
      return NextResponse.json(
        { error: 'A license for this email already exists' },
        { status: 400 }
      );
    }

    // Create new license (business info will be added during activation)
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        admin_id: user.id,
        email: email.toLowerCase(),
        business_name: '', // Will be filled during activation
        business_type: '', // Will be filled during activation
        is_activated: false,
      })
      .select()
      .single();

    if (licenseError) {
      console.error('License creation error:', licenseError);
      return NextResponse.json(
        { error: 'Failed to create license' },
        { status: 500 }
      );
    }

    // Send activation email
    const activationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://business.moilapp.com'}/register?licenseId=${license.id}&ref=budaHive&org=buda-hive`;
    
    const emailResult = await sendLicenseActivationEmail({
      email: license.email,
      activationUrl,
      adminName: `${adminData.first_name} ${adminData.last_name}`,
    });

    if (!emailResult.success) {
      console.error('Failed to send activation email:', emailResult.error);
      // License was created but email failed - still return success with warning
    }

    return NextResponse.json(
      { 
        message: emailResult.success 
          ? 'License added and activation email sent successfully' 
          : 'License added but failed to send activation email',
        emailSent: emailResult.success,
        license: {
          id: license.id,
          email: license.email,
          isActivated: license.is_activated,
          createdAt: license.created_at,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add license error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
