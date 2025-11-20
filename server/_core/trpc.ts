import { initTRPC, TRPCError } from "@trpc/server";
import { IContext } from "./context";

const t = initTRPC.context<IContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(opts => {
  const { user } = opts.ctx;

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Você precisa estar logado para realizar esta ação.",
    });
  }

  return opts.next({ ctx: { ...opts.ctx, user } });
});
