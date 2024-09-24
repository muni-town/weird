import { BorshSchema, Component, type ExactLink, type PathSegment } from 'leaf-proto';
import { CommonMark } from 'leaf-proto/components';
import { instance_link, leafClient } from '.';

export const DISCORD_PREFIX: PathSegment = { String: 'discord_users' };

export class RauthyUserId extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'RauthyUserId';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new CommonMark('The Rauthy auth server user ID associated to this entity.')];
	}
}

export function discordUserLinkById(id: string): ExactLink {
	return instance_link(DISCORD_PREFIX, { String: id });
}

export async function setDiscordUserRauthyId(discordId: string, rauthyId: string) {
	const discordLink = discordUserLinkById(discordId);
	leafClient.add_components(discordLink, [new RauthyUserId(rauthyId)]);
}

export async function getDiscordUserRauthyId(discordId: string): Promise<string | undefined> {
	const discordLink = discordUserLinkById(discordId);
	const ent = await leafClient.get_components(discordLink, RauthyUserId);
	return ent?.get(RauthyUserId)?.value;
}
