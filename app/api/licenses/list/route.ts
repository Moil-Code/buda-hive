import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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

    // Get all licenses for this admin
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (licensesError) {
      console.error('Licenses fetch error:', licensesError);
      return NextResponse.json(
        { error: 'Failed to fetch licenses' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const total = licenses.length;
    const activated = licenses.filter(l => l.is_activated).length;
    const pending = total - activated;

    // Format licenses for response
    const formattedLicenses = licenses.map(license => ({
      id: license.id,
      email: license.email,
      isActivated: license.is_activated,
      activatedAt: license.activated_at,
      createdAt: license.created_at,
      businessName: license.business_name,
      businessType: license.business_type,
    }));

    return NextResponse.json(
      { 
        licenses: formattedLicenses,
        statistics: {
          total,
          activated,
          pending,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List licenses error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
