import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Obtener el locale del request
  let locale = await requestLocale;

  // Si no hay locale, usar el default
  if (!locale) {
    locale = 'es';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
