import { z } from "zod"

// Add shared Zod schemas here
export const emailSchema = z.string().email("Invalid email address")
