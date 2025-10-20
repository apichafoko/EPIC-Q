import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthContext } from '@/lib/auth/middleware';
import prisma from '@/lib/db-connection';
import { uploadFile, getSignedFileUrl } from '@/lib/services/s3-service';

async function handler(
  req: NextRequest,
  context: AuthContext,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  if (req.method === 'GET') {
    try {
      const resources = await prisma.project_resources.findMany({
        where: { project_id: projectId, is_active: true },
        orderBy: { order: 'asc' },
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return NextResponse.json({ success: true, data: resources });
    } catch (error) {
      console.error('Error fetching project resources:', error);
      return NextResponse.json({ error: 'Error al cargar recursos' }, { status: 500 });
    }
  }

  if (req.method === 'POST') {
    let title, description, type, file, externalUrl, userId, url, s3Key, fileSize, mimeType;
    
    try {
      const formData = await req.formData();
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      type = formData.get('type') as string;
      file = formData.get('file') as File | null;
      externalUrl = formData.get('externalUrl') as string | null;
      userId = context.user.id;

      url = externalUrl;
      s3Key = null;
      fileSize = null;
      mimeType = null;

      // Si es un archivo, subirlo a S3
      if (file && (type === 'pdf' || type === 'document' || type === 'video_file')) {
        const buffer = Buffer.from(await file.arrayBuffer());
        s3Key = `projects/${projectId}/resources/${Date.now()}-${file.name}`;
        await uploadFile(buffer, s3Key, file.type);
        // Generar URL firmada para acceso seguro
        url = await getSignedFileUrl(s3Key, 7 * 24 * 3600); // 7 días de validez
        fileSize = file.size;
        mimeType = file.type;
      }

      // Validar que tenemos una URL válida
      if (!url) {
        return NextResponse.json({ error: 'URL o archivo requerido' }, { status: 400 });
      }

      const resource = await prisma.project_resources.create({
        data: {
          project_id: projectId,
          title,
          description,
          type,
          url: url,
          s3_key: s3Key,
          file_size: fileSize,
          mime_type: mimeType,
          created_by: userId,
        }
      });

      return NextResponse.json({ success: true, data: resource });
    } catch (error) {
      console.error('Error creating project resource:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        title,
        description,
        type,
        url,
        userId
      });
      return NextResponse.json({ 
        error: 'Error al crear recurso',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(async (req: NextRequest, context: AuthContext) => {
    return handler(req, context, { params });
  })(request);
}
