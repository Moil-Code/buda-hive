import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
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
      .select('id')
      .eq('id', user.id)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all licenses for this admin
    const { data: licenses, error: licensesError } = await supabase
      .from('licenses')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (licensesError) {
      return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
    }

    // Generate CSV
    const headers = ['Email', 'Status', 'Date Added', 'Activated At'];
    const rows = licenses.map(license => [
      license.email,
      license.is_activated ? 'Active' : 'Pending',
      new Date(license.created_at).toLocaleDateString(),
      license.activated_at ? new Date(license.activated_at).toLocaleDateString() : 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="buda-hive-licenses-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
