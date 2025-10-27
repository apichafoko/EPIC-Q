import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple templates API called');
    
    // Devolver datos mock para probar
    const mockTemplates = [
      {
        id: '1',
        name: 'Test Template',
        description: 'Template de prueba',
        type: 'internal',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      templates: mockTemplates
    });

  } catch (error) {
    console.error('Error in simple templates API:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
