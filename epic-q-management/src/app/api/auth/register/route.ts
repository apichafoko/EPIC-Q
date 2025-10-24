import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, name, role, hospitalId } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json(
        { message: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 3600000); // 7 days

    // Create user
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        password: '', // Will be set when user sets their password
        role: role as 'admin' | 'coordinator',
        hospitalId: hospitalId || null,
        resetToken: invitationToken,
        resetTokenExpiry: tokenExpiry,
        isActive: true,
      },
    });

    // Send invitation email
    const setPasswordUrl = `${process.env.NEXTAUTH_URL}/auth/set-password?token=${invitationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'EPIC-Q - Invitation to Join',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to EPIC-Q</h2>
          <p>Hello ${name},</p>
          <p>You have been invited to join the EPIC-Q Management System as a ${role}.</p>
          <p>Click the button below to set your password and get started:</p>
          <a href="${setPasswordUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Set Password & Join
          </a>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact the system administrator.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            EPIC-Q Management System<br>
            Estudio Perioperatorio Integral de Cuidados Quirúrgicos
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { 
        message: 'User created successfully and invitation sent',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('User registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
