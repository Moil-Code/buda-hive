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

    // Verify user is an admin
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('id, email')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get license stats from licenses table
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('id, is_activated')
      .eq('admin_id', user.id);

    if (licensesError) {
      console.error('License stats fetch error:', licensesError);
      return NextResponse.json({ error: 'Failed to fetch license stats' }, { status: 500 });
    }

    const total = licenses?.length || 0;
    const activated = licenses?.filter(l => l.is_activated).length || 0;
    const pending = total - activated;

    return NextResponse.json({
      total,
      activated,
      pending,
      // Legacy field names for backward compatibility
      purchased_license_count: total,
      active_purchased_license_count: activated,
      available_licenses: pending,
    }, { status: 200 });

  } catch (error) {
    console.error('License stats error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
