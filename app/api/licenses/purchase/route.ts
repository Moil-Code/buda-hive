import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * GET endpoint to handle payment gateway redirect
 * Called after successful payment from Stripe
 * Query params: licenseCount, payment, paymentType
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const licenseCount = searchParams.get('licenseCount');
    const payment = searchParams.get('payment');
    const paymentType = searchParams.get('paymentType');

    // Validate payment was successful
    if (payment !== 'successful' || paymentType !== 'license_purchase') {
      return NextResponse.redirect(new URL('/admin/dashboard?error=payment_failed', request.url));
    }

    const licenseCountNum = parseInt(licenseCount || '0', 10);
    if (isNaN(licenseCountNum) || licenseCountNum < 1) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=invalid_license_count', request.url));
    }

    // Get current authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Use service role key to update license count
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current admin data
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, purchased_license_count')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.redirect(new URL('/admin/dashboard?error=admin_not_found', request.url));
    }

    // Update the purchased license count
    const newLicenseCount = (admin.purchased_license_count || 0) + licenseCountNum;
    
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ purchased_license_count: newLicenseCount })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update license count:', updateError);
      return NextResponse.redirect(new URL('/admin/dashboard?error=update_failed', request.url));
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(new URL(`/admin/dashboard?success=purchase_complete&licenses_added=${licenseCountNum}`, request.url));

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.redirect(new URL('/admin/dashboard?error=unexpected_error', request.url));
  }
}

/**
 * POST endpoint to update purchased license count
 * Called by external application
 */
export async function POST(request: Request) {
  try {
    const { adminId, licenseCount } = await request.json();

    // Validate required parameters
    if (!adminId || !licenseCount) {
      return NextResponse.json(
        { error: 'Missing required parameters: adminId and licenseCount' },
        { status: 400 }
      );
    }

    const licenseCountNum = parseInt(licenseCount, 10);
    if (isNaN(licenseCountNum) || licenseCountNum < 1) {
      return NextResponse.json(
        { error: 'Invalid license count' },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS for external application
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin exists
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, email, purchased_license_count')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update the purchased license count
    const newLicenseCount = admin.purchased_license_count + licenseCountNum;
    
    const { data: updatedAdmin, error: updateError } = await supabase
      .from('admins')
      .update({ purchased_license_count: newLicenseCount })
      .eq('id', adminId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update license count:', updateError);
      return NextResponse.json(
        { error: 'Failed to update license count' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'License count updated successfully',
      admin_id: adminId,
      licenses_added: licenseCountNum,
      total_licenses: updatedAdmin.purchased_license_count,
    }, { status: 200 });

  } catch (error) {
    console.error('Purchase update error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
