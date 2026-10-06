import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

export const browseSearch = z.object({
  q: fallback(z.string(), "").default(""),
  tags: fallback(z.string().array(), []).default([]),
});
