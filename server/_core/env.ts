export const ENV = {
  ownerOpenId: process.env.OWNER_OPEN_ID || 'github|1234567', // Substitua pelo seu OpenID real
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  // Adicione outras variáveis de ambiente aqui, se necessário
} as const;
