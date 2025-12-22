import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * POST endpoint to complete license purchase
 * Called by payment page after successful Stripe payment
 * Requires authenticated user
 */
export async function POST(request: Request) {
  try {
    const { licenseCount } = await request.json();

    const licenseCountNum = parseInt(licenseCount, 10);
    if (isNaN(licenseCountNum) || licenseCountNum < 1) {
      return NextResponse.json(
        { error: 'Invalid license count' },
        { status: 400 }
      );
    }

    // Get current authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Update the purchased license count
    const newLicenseCount = (admin.purchased_license_count || 0) + licenseCountNum;
    
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ purchased_license_count: newLicenseCount })
      .eq('id', user.id)
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
      message: 'License purchase completed successfully',
      licenses_added: licenseCountNum,
      total_licenses: updatedAdmin.purchased_license_count,
    }, { status: 200 });

  } catch (error) {
    console.error('Purchase completion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
