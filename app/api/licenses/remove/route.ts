import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: Request) {
  try {
    const { licenseId } = await request.json();

    if (!licenseId) {
      return NextResponse.json(
        { error: 'License ID is required' },
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

    // Delete the license
    const { error: deleteError } = await supabase
      .from('licenses')
      .delete()
      .eq('id', licenseId)
      .eq('admin_id', user.id);

    if (deleteError) {
      console.error('License deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete license' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'License removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove license error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
