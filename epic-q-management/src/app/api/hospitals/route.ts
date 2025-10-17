import { NextRequest, NextResponse } from 'next/server';
import { SimpleAuthService } from '@/lib/auth/simple-auth-service';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SimpleAuthService.verifyToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hospitals = await prisma.hospital.findMany({
      select: {
        id: true,
        name: true,
        province: true,
        city: true,
        status: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ hospitals });
  } catch (error) {
    console.error('Failed to fetch hospitals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hospitals' },
      { status: 500 }
    );
  }
}
