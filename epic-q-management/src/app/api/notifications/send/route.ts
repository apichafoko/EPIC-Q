import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '../../../../lib/auth/simple-auth-service';
import { NotificationService } from '../../../../lib/notifications/notification-service';
import { sendEmail } from '../../../../lib/notifications/email-service';
// Push notifications are handled by the send-push endpoint

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, type, sendEmail: shouldSendEmail, sendPush: shouldSendPush } = body;

    // Create notification in database
    const notification = await NotificationService.createNotification({
      userId,
      title,
      message,
      type: type || 'info',
    });

    // Send email if requested
    if (shouldSendEmail && type === 'email') {
      try {
        const { prisma } = await import('../../../../lib/database');
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        });

        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">${title}</h2>
                <p>${message}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px;">
                  Este es un mensaje automático del sistema EPIC-Q.
                </p>
              </div>
            `,
          });
        }
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    // Send push notification if requested
    if (shouldSendPush && type === 'push') {
      try {
        // Call the send-push endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            message,
            data: { userId, type }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to send push notification');
        }
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
