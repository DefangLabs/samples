import { z } from "zod";

export function itemLimit(maximum: number) {
  return z
    .union([z.number(), z.string().regex(/^\d+$/)])
    .pipe(z.coerce.number<string | number>().int().min(1).max(maximum))
    .optional();
}
