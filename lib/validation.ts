import { z } from "zod";

const ratingSchema = z.number().int().min(1).max(5);
const npsSchema = z.number().int().min(0).max(10);

export const evaluationSchema = z.object({
  mesa: z.number().int().min(1).max(200).nullable().optional(),
  produtos: ratingSchema,
  atendimento: ratingSchema,
  limpeza: ratingSchema,
  espera: ratingSchema,
  nps: npsSchema,
  comentario: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  nome: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  contato: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((value) => (value && value.length > 0 ? value : null)),
  website: z.string().max(200).optional().nullable(),
});

export type EvaluationInput = z.infer<typeof evaluationSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4).max(200),
});
