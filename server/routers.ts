import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getConversations, getMessagesByConversation, getMetrics, getMessagesPerDay, getAllAppointments, createAppointment, updateAppointmentStatus, deleteAppointment } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  conversations: router({
    list: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          search: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const filters: any = {};
        if (input.startDate) filters.startDate = new Date(input.startDate);
        if (input.endDate) filters.endDate = new Date(input.endDate);
        if (input.search) filters.search = input.search;
        return getConversations(filters);
      }),
  }),

  messages: router({
    byConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => getMessagesByConversation(input.conversationId)),
  }),

  metrics: router({
    summary: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const startDate = input.startDate ? new Date(input.startDate) : undefined;
        const endDate = input.endDate ? new Date(input.endDate) : undefined;
        return getMetrics(startDate, endDate);
      }),

    perDay: protectedProcedure
      .input(
        z.object({
          startDate: z.string(),
          endDate: z.string(),
        })
      )
      .query(({ input }) => {
        return getMessagesPerDay(new Date(input.startDate), new Date(input.endDate));
      }),
  }),

  appointments: router({
    list: protectedProcedure.query(() => getAllAppointments()),
    create: protectedProcedure
      .input(
        z.object({
          clientName: z.string(),
          clientPhone: z.string(),
          clientEmail: z.string().optional(),
          service: z.string(),
          scheduledAt: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => {
        return createAppointment({
          ...input,
          scheduledAt: new Date(input.scheduledAt),
        });
      }),
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "cancelled", "completed"]) }))
      .mutation(({ input }) => updateAppointmentStatus(input.id, input.status)),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(({ input }) => deleteAppointment(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
