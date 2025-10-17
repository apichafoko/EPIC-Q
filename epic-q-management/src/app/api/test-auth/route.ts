import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: 'Auth test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      { error: 'Auth test failed' },
      { status: 500 }
    );
  }
}
