import slugify from 'slugify';
import * as z from 'zod';

export const Page = z.object({
	slug: z
		.string()
		.min(1)
		.transform((x) => slugify(x, { strict: true, lower: true })),
	display_name: z.string().min(1),
	markdown: z.string(),
	links: z.array(z.object({ label: z.optional(z.string()), url: z.string() })),
	wiki: z.boolean()
});

export type Page = z.infer<typeof Page>;
