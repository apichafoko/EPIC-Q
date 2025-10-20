const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  try {
    const url = process.env.EMAIL_LOGO_URL || process.env.NEXT_PUBLIC_EMAIL_LOGO_URL;
    if (!url) {
      console.error('❌ EMAIL_LOGO_URL / NEXT_PUBLIC_EMAIL_LOGO_URL no está definido.');
      process.exit(1);
    }

    const templates = await prisma.communication_templates.findMany();
    let count = 0;
    for (const t of templates) {
      if (!t.email_body) continue;
      const updated = t.email_body.replace(/<img[^>]*alt=\"EPIC-Q Logo\"[^>]*>/g, `<img src=\"${url}\" alt=\"EPIC-Q Logo\" class=\"logo\" />`);
      if (updated !== t.email_body) {
        await prisma.communication_templates.update({ where: { id: t.id }, data: { email_body: updated } });
        console.log('✅ Actualizado:', t.name);
        count++;
      }
    }
    console.log(`🎉 Listo. Templates actualizados: ${count}`);
  } catch (e) {
    console.error('❌ Error en migración:', e);
    process.exit(1);
  }
}

run().finally(() => process.exit(0));



