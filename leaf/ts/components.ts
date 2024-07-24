import { BorshSchema } from 'borsher';
import { Component, LinkSchema, type Link, type LeafBlob, LeafBlobSchema } from './index';

export class Utf8 extends Component {
	value: string = '';
	constructor(value: string) {
		super();
		this.value = value;
	}
	static componentName(): string {
		return 'UTF-8';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
}

export class Name extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'Name';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new Utf8('The primary, human readable name associated to an Entity.')];
	}
}

export class CommonMark extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'CommonMark';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		// TODO: we should probably inline the commonmark specification, but we need to make
		// typescript not have to hash the whole spec every time schema_id is called first.
		return [new Utf8('See CommonMark specification at https://spec.commonmark.org/0.31.2/')];
	}
}

export class Description extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'Description';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A description of an Entity. Usually this is a short description, but there is no hard limit on length. Longer descriptions may be truncated for display by some clients if it exceeds a preferred length.

The description is often used for things like link-previews or search-engine metadata.

Non-normative examples:

- The description for a chat message might be the entire chat message, or the first line of the message, or the first 300 characters with an ellipsis at the end.
- The description of a blog post might be the first paragraph of the post, or a specifically written description by the author.
- The description for a microblog post would likely be the entire microblog message.`)
		];
	}
}

export class DateCreated extends Component {
	value: bigint;
	constructor(date?: Date) {
		super();
		const timestamp = BigInt((date?.getTime() || Date.now()) / 1000);
		this.value = timestamp;
	}
	static componentName(): string {
		return 'DateCreated';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.u64;
	}
	static specification(): Component[] {
		return [new Utf8(`The time that the entity or what it represents was created.`)];
	}
}

export class DateUpdated extends Component {
	value: bigint;
	constructor(date?: Date) {
		super();
		const timestamp = BigInt(Math.round((date?.getTime() || Date.now()) / 1000));
		this.value = timestamp;
	}
	static componentName(): string {
		return 'DateUpdated';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.u64;
	}
	static specification(): Component[] {
		return [new Utf8(`The time that the entity or what it represents was updated.`)];
	}
	date(): Date {
		return new Date(Number(this.value) * 1000);
	}
}

export class ReplyTo extends Component {
	value: Link;
	constructor(link: Link) {
		super();
		this.value = link;
	}
	static componentName(): string {
		return 'ReplyTo';
	}
	static borshSchema(): BorshSchema {
		return LinkSchema;
	}
	static specification(): Component[] {
		return [
			new CommonMark(`Indicates a reply to some other entity.

For example, it might be used for:

- chat message replies
- comments on blog posts
- threaded forum topic discussions`)
		];
	}
}

export class Embed extends Component {
	value: Link;
	constructor(link: Link) {
		super();
		this.value = link;
	}
	static componentName(): string {
		return 'Embed';
	}
	static borshSchema(): BorshSchema {
		return LinkSchema;
	}
	static specification(): Component[] {
		return [
			new CommonMark(`Links to another entity that is meant to be embedded in this one.

In many cases an entity with an \`Embed\` component will render similar to the entity that is embedded in it. The entity with the \`Embed\` component may still have other components, though, such as it's own \`Name\` or \`Description\` that should take precedence over the embedded component if present, and may warrant other changes in rendering to create a larger distinction between itself and the embedded entity.

Embed could be useful for:

- Adding an entity created by another author to your own digital garden or curated collection.
- Adding an entity created by another other on your own Kanban board, where you can move it between columns by adding your own components to it, without editing the original author's entity.
- Adding embedded entities to rich text using facets.`)
		];
	}
}

export class RawImage extends Component {
	value: { mimeType: string; data: number[] };

	constructor(mimeType: string, data: number[] | Uint8Array) {
		super();
		this.value = {
			mimeType,
			data: [...(data || [])]
		};
	}
	static componentName(): string {
		return 'RawImage';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Struct({
			mimeType: BorshSchema.String,
			data: BorshSchema.Vec(BorshSchema.u8)
		});
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A raw image associated with the entity. This component should be modified later to contain a size field and a lazy-loadable blob id instead of inline image data.

The \`Image\` component usually represents the "feature image", icon, avatar, or other primary image associated to the entity. This image would often be displayed in link previews.

The \`Image\` component might also be used for an entity that is primarily an image, such as an image file in an image in an image gallery.

Multiple \`Image\` components may be added to an entity when there are multiple formats or sizes available for the same image. This can be useful, for example, to allow using a smaller image for a link preview than you would use when displaying a full-sized feature image on a blog post.

In most cases, multiple distinct images should be stored in separate entities or a different component.`)
		];
	}
}
