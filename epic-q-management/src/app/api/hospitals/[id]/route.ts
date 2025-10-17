import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = params.id;

    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        details: true,
        contacts: true,
        progress: true
      }
    });

    if (!hospital) {
      return NextResponse.json(
        { error: 'Hospital no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hospitalId = params.id;
    const body = await request.json();
    const { required_periods } = body;

    // Validar que required_periods sea un número válido
    if (required_periods !== undefined && (typeof required_periods !== 'number' || required_periods < 1 || required_periods > 10)) {
      return NextResponse.json(
        { error: 'El número de períodos debe ser entre 1 y 10' },
        { status: 400 }
      );
    }

    const updatedHospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: {
        required_periods: required_periods
      },
      include: {
        details: true,
        contacts: true,
        progress: true
      }
    });

    return NextResponse.json({
      success: true,
      hospital: updatedHospital
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
