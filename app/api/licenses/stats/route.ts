import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin and get their license stats
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, email, purchased_license_count, active_purchased_license_count')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      purchased_license_count: admin.purchased_license_count,
      active_purchased_license_count: admin.active_purchased_license_count,
      available_licenses: admin.purchased_license_count - admin.active_purchased_license_count,
    }, { status: 200 });

  } catch (error) {
    console.error('License stats error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
