import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBatchEmailStatuses } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('id', user.id)
      .single();

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: 'Message IDs required' }, { status: 400 });
    }

    // Fetch email statuses from Resend
    const result = await getBatchEmailStatuses(messageIds);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch email statuses' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { statuses: result.statuses },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email status fetch error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
