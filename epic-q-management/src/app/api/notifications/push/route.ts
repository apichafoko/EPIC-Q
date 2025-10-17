import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';
import { subscribeUser, unsubscribeUser, getVapidPublicKey } from '@/lib/notifications/push-service';

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error('Failed to get VAPID public key:', error);
    return NextResponse.json(
      { error: 'Failed to get VAPID public key' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, subscription } = body;

    switch (action) {
      case 'subscribe':
        if (!subscription) {
          return NextResponse.json({ error: 'Subscription required' }, { status: 400 });
        }
        await subscribeUser(user.id, subscription);
        break;

      case 'unsubscribe':
        await unsubscribeUser(user.id);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update push subscription' },
      { status: 500 }
    );
  }
}
