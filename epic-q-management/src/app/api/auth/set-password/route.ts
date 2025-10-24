import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { message: 'Token, password, and confirm password are required' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Find user with valid reset token (used for invitation)
    const user = await prisma.users.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired invitation token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Password set successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
