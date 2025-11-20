import { publicProcedure, router } from "./trpc";
import { z } from "zod";
import { supabase } from "../../../client/src/lib/supabase";
import { COOKIE_NAME } from "../../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { upsertUser } from "../db";
import { ENV } from "./env";

export const systemRouter = router({
  auth: publicProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(input.code);

      if (error) {
        throw new Error(`Erro ao trocar código por sessão: ${error.message}`);
      }

      const { session, user: supabaseUser } = data;

      if (!session || !supabaseUser) {
        throw new Error("Sessão ou usuário do Supabase não encontrados.");
      }

      const openId = `${supabaseUser.app_metadata.provider}|${supabaseUser.id}`;
      const name = supabaseUser.user_metadata.full_name || supabaseUser.email;
      const email = supabaseUser.email;
      const loginMethod = supabaseUser.app_metadata.provider;

      await upsertUser({
        openId,
        name,
        email,
        loginMethod,
        lastSignedIn: new Date(),
        role: openId === ENV.ownerOpenId ? 'admin' : 'user',
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, openId, cookieOptions);

      return { success: true };
    }),
});
