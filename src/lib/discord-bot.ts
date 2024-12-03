import Discord, {
	ApplicationIntegrationType,
	InteractionContextType,
	ApplicationCommandType
} from 'discord.js';
import { env } from '$env/dynamic/private';
import { env as PublicEnv } from '$env/dynamic/public';
import {
	getProfile,
	profileLinkById as getProfileLinkById,
	appendSubpath,
	WebLinks
} from '$lib/leaf/profile';
import { getDiscordUserRauthyId } from '$lib/leaf/discord';
import { leafClient } from '$lib/leaf';
import { Name } from 'leaf-proto/components';
import { redis } from '$lib/redis';
import { usernames } from '$lib/usernames';

const REDIS_PREFIX = 'weird:discord-login-links:';

export const createDiscordLoginLinkId = async (discordId: string): Promise<string> => {
	const linkid = crypto.randomUUID();
	// Create a login link that is valid for 10 minutes
	await redis.set(REDIS_PREFIX + linkid, discordId, { EX: 10 * 60 * 1000 });
	return linkid;
};

export const getDiscordIdForLoginLink = async (linkId: string): Promise<string | undefined> => {
	const discordId = await redis.get(REDIS_PREFIX + linkId);
	if (discordId) await redis.del(linkId);
	return discordId || undefined;
};

const LOGIN_CMD = 'weird-login';
const IMPORT_LINKS_CMD = 'Import links to Weird profile';
const commands = [
	{
		name: LOGIN_CMD,
		description: 'Connect your Discord account to your Weird profile.',
		type: ApplicationCommandType.ChatInput,
		integration_types: [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		],
		contexts: [
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		]
	},
	{
		name: IMPORT_LINKS_CMD,
		type: ApplicationCommandType.Message,
		integration_types: [
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		],
		contexts: [InteractionContextType.Guild, InteractionContextType.PrivateChannel]
	}
];

const rest = new Discord.REST({ version: '10' }).setToken(env.DISCORD_TOKEN);
const client = new Discord.Client({ intents: [] });

client.on('ready', () => {
	console.log(`Discord bot logged in as ${client.user!.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	if (interaction.commandName === 'ping') {
		await interaction.reply('Pong!');
	}
});

client.on('interactionCreate', async function (interaction) {
	if (interaction.isChatInputCommand() && interaction.commandName === LOGIN_CMD) {
		const linkId = await createDiscordLoginLinkId(interaction.user.id);
		interaction.reply({
			content: `Please go to this link to authenticate: ${PublicEnv.PUBLIC_URL}/connect/discord/${linkId}`,
			ephemeral: true
		});
	} else if (
		interaction.isMessageContextMenuCommand() &&
		interaction.commandName == IMPORT_LINKS_CMD
	) {
		const links = interaction.targetMessage.content
			.split(/[\s\(\)]/)
			.filter((x) => URL.canParse(x));
		if (links.length == 0) {
			interaction.reply({
				content: 'No links found in the message. 🤷',
				ephemeral: true
			});
			return;
		}
		const userId = await getDiscordUserRauthyId(interaction.user.id);
		if (!userId) {
			interaction.reply({
				content: 'You need to authenticate first. Use the command `/weird-login` to authenticate.',
				ephemeral: true
			});
			return;
		}
		const profileLink = await getProfileLinkById(userId);
		const profile = await getProfile(profileLink);
		if (!profile) {
			interaction.reply({
				content:
					'The Weird user linked to your Discord account no longer exists. Use the `/weird-login` command to login to a new Weird account.',
				ephemeral: true
			});
			return;
		}

		const discordListLink = appendSubpath(profileLink, 'discord-links');
		const ent = await leafClient.get_components(discordListLink, WebLinks);
		const webLinks = ent?.get(WebLinks)?.value || [];
		for (const link of links) {
			webLinks.push({ url: link });
		}
		await leafClient.add_components(discordListLink, [
			new Name('Discord Links'),
			new WebLinks(webLinks)
		]);

		interaction.reply({
			content: `Links imported successfully (http://${PublicEnv.PUBLIC_DOMAIN}/${await usernames.getByRauthyId(userId)}/discord-links):\n${links.join('\n')}`,
			ephemeral: true
		});
	}
});

export const client_login = async () => {
	if (env.DISCORD_CLIENT_ID) {
		try {
			await rest.put(Discord.Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands });
			await client.login(env.DISCORD_TOKEN);
		} catch (e) {
			console.error(`Error logging in discord bot: ${e}`);
		}
	}
};
