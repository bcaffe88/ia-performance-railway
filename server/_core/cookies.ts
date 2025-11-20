import { CookieOptions } from "express";

export function getSessionCookieOptions(req: any): CookieOptions {
  const isHttps = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https";
  return {
    httpOnly: true,
    secure: isHttps,
    path: "/",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
  };
}
