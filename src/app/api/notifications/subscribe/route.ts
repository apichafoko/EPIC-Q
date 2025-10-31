import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../lib/auth/middleware';
import { prisma } from '../../../../lib/database';
import webpush from 'web-push';

// Configurar VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@epicq.com',
  process.env.VAPID_PUBLIC_KEY || 'BOTJvNXdGDoFNRjk5CO6XvhFPpmtwpedkBL2IBZsKSxZbuRFmMz5XYJg6POUQg7cOkxV9tS6HNoopCSQQ-1pfAI',
  process.env.VAPID_PRIVATE_KEY || '3YM7EhQsSllGBC64GVYNcogc4xdknmhFiqoMvmBYPUw'
);

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar autenticación y obtener usuario
    const { SimpleAuthService } = await import('../../../../lib/auth/simple-auth-service');
    const user = await SimpleAuthService.verifyToken(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    // Guardar suscripción en la base de datos con user_id
    const pushSubscription = await prisma.push_subscriptions.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_id: user.id,
        updated_at: new Date()
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_id: user.id,
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date(),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      subscription: pushSubscription
    });

  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    // Eliminar suscripción de la base de datos
    await prisma.push_subscriptions.deleteMany({
      where: {
        endpoint: endpoint
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully'
    });

  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
