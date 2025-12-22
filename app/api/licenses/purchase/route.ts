import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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
