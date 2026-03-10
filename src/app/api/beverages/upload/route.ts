import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Use JPEG, PNG, WebP o GIF.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo no puede superar 2 MB' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.png';
    const baseName = path.basename(file.name, ext).replace(/[^a-z0-9-_]/gi, '-').toLowerCase() || 'imagen';
    const uniqueName = `${baseName}-${Date.now()}${ext}`;

    const publicDir = path.join(process.cwd(), 'public', 'beverages');
    await mkdir(publicDir, { recursive: true });

    const filePath = path.join(publicDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const imageUrl = `/beverages/${uniqueName}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al subir la imagen' },
      { status: 500 },
    );
  }
}
