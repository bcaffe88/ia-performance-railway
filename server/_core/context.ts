import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { User } from "../../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { COOKIE_NAME } from "../../../shared/const";

export interface IContext {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<IContext> {
  let user: User | null = null;
  const openId = req.cookies[COOKIE_NAME];

  if (openId) {
    user = await getUserByOpenId(openId);
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
