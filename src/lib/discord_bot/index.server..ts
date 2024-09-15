import Discord from 'discord.js';
import {GatewayIntentBits} from 'discord.js';
import { env } from '$env/dynamic/private';
import {env as PublicEnv} from '$env/dynamic/public';
import { getProfileById, setProfileById } from '$lib/leaf/profile';
import { leafClient } from '$lib/leaf';

const client = new Discord.Client({intents: [GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent]});

client.on('ready', () => {
    console.log(`Logged in as ${client.user!.tag}!`);
});

const ExtractUrlName = (url: string) => {
    return url.split('/').slice(-1)[0];
}

client.on("messageCreate", async function (message) {
    if (message.content === "/weird_auth") {
        message.author.send(`Please go to this link to authenticate: ${env.APP_URL}/app/discord_bot_authenticator?q=${message.author.id}`);
        message.reply("I have sent you a DM with the link to authenticate.");
    } else if (message.content.startsWith("/weird_import_links")){
        const links = message.content.split(" ").slice(1);
        const discord_tokens = JSON.parse(await leafClient.get_local_secret("discord_tokens") ?? "{}");
        const userId = Object.keys(discord_tokens).find(key => discord_tokens[key] === message.author.id) as string;
        let profile = await getProfileById(userId);
        if(!profile){
            message.reply("You need to authenticate first. Use the command `/weird_auth` to authenticate.");
            return;
        }
        let edited = false;
        for(let list of profile['lists']){
            if(list.label === 'discord_links'){
                list.links = [...list.links, ...links.map((link) => ({label: ExtractUrlName(link), url: link}))];
                edited = true;
            }
        }
        if(!edited){
            profile['lists'].push({label: 'discord_links', links: links.map((link) => ({label: ExtractUrlName(link), url: link}))});
        }
        try{
            await setProfileById(userId, profile!);
       }catch(e){
            console.log('error', e)
        }
        message.reply(`Links imported successfully (http://${PublicEnv.PUBLIC_DOMAIN}/u/${profile.username}/discord_links).`);
    }
});


export const client_login = () => client.login(env.DISCORD_TOKEN);

client.on('messageCreate', msg => console.log(msg.content));