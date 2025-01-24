import slugify from 'slugify';
import * as z from 'zod';

export const PageData = z.object({
	name: z.string().min(1),
	markdown: z.string(),
	wiki: z.boolean()
});

export const Page = PageData.extend({
	slug: z
		.string()
		.min(1)
		.transform((x) => slugify(x, { strict: true, lower: true }))
});
export type Page = z.infer<typeof Page>;

export const PageSaveReq = Page.omit({ markdown: true }).extend({
	loroSnapshot: z.string().base64()
});

export type PageData = z.infer<typeof PageData>;
export type PageSaveReq = z.infer<typeof PageSaveReq>;
