import Discord, {
	ApplicationIntegrationType,
	InteractionContextType,
	ApplicationCommandType
} from 'discord.js';
import { GatewayIntentBits } from 'discord.js';
import { env } from '$env/dynamic/private';
import { env as PublicEnv } from '$env/dynamic/public';
import { getProfileById, setProfileById } from '$lib/leaf/profile';
import { leafClient } from '$lib/leaf';

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
		interaction.user.send(
			`Please go to this link to authenticate: ${PublicEnv.PUBLIC_URL}/app/discord_bot_authenticator?q=${interaction.user.id}`
		);
		interaction.reply({
			content: 'I have sent you a DM with the link to authenticate.',
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
		const discord_tokens = JSON.parse(
			(await leafClient.get_local_secret('discord_tokens')) ?? '{}'
		);
		const userId = Object.keys(discord_tokens).find(
			(key) => discord_tokens[key] === interaction.user.id
		);
		const sendNeedsAuthenticateMessage = () =>
			interaction.reply({
				content: 'You need to authenticate first. Use the command `/weird_auth` to authenticate.',
				ephemeral: true
			});
		if (!userId) {
			sendNeedsAuthenticateMessage();
			return;
		}
		let profile = await getProfileById(userId);
		if (!profile) {
			sendNeedsAuthenticateMessage();
			return;
		}
		let edited = false;
		for (let list of profile['lists']) {
			if (list.label === 'discord_links') {
				list.links = [...list.links, ...links.map((link) => ({ url: link }))];
				edited = true;
			}
		}
		if (!edited) {
			profile['lists'].push({
				label: 'discord_links',
				links: links.map((link) => ({ url: link }))
			});
		}
		try {
			await setProfileById(userId, profile!);
		} catch (e) {
			console.log('error', e);
		}
		interaction.reply({
			content: `Links imported successfully (http://${PublicEnv.PUBLIC_DOMAIN}/${profile.username}/discord_links):\n${links.join('\n')}`,
			ephemeral: true
		});
	}
});

export const client_login = async () => {
	try {
		await rest.put(Discord.Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body: commands });
		await client.login(env.DISCORD_TOKEN);
	} catch (e) {
		console.error(`Error logging in discord bot: ${e}`);
	}
};
