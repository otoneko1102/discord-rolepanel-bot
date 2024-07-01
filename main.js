const { Client, Collection, MessageEmbed } = require('discord.js');
const options = { intents: [3276543] };
const client = new Client(options);
const fs = require("fs-extra");
const config = require('./config');

client.commands = new Collection();
client.slashes = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const slashFiles = fs.readdirSync('./slashes').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
  console.log(`commands/${file} ready!`)
}

for (const file of slashFiles) {
  const command = require(`./slashes/${file}`);
  client.slashes.set(command.name, command);
  console.log(`slashes/${file} ready!`)
}

client.on('ready', async () => {
  console.log(`OK!`);
});

client.on('messageCreate', async message => {
  const prefix = config.prefix;
  
  if (!message.content.startsWith(prefix) || message.guild.id !== guildId || message.author.bot) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  
  try {
    command.execute(client, message, args, config);
  } catch (e) {
    console.error(e);
  };
});

client.on('interactionCreate', async int => {
  if (!int.isCommand() || int.guild.id !== guildId) return;
  
  const options = int.options;

  const command = client.slashes.get(int.commandName);

  if (!command) return;
  
  try {
    command.execute(client, int, options, config);
  } catch (e) {
    console.error(e);
  };
});

// rolepanel
client.on("interactionCreate", async int => {
  if (int.isCommand()) return;
  // ロールパネルを選択
  if (int.isMessageContextMenu()) {
    try {
      if (int.commandName === 'ロールパネルを選択') {
        const filePath = "./selectrolepanel.json";
        const selectedRolePanel = fs.readJsonSync(filePath);
        const message = int.options.getMessage('message');
        if (message.member.id === client.user.id) {
          if (message?.embeds[0]?.title !== 'ロールパネルヘルプ' && message?.embeds[0]?.title?.includes('ロールパネル') && message?.embeds[0]?.color != 15548997) {
            selectedRolePanel[`${int.member.id}_${int.guild.id}`] = { message_id: message.id, channel_id: message.channel.id }
            console.log(selectedRolePanel[`${int.member.id}_${int.guild.id}`])
            fs.writeFileSync(filePath, JSON.stringify(selectedRolePanel, null, 2));
            await int.reply({ content: `${config.check} ロールパネルを選択しました`, ephemeral: true });
            return;
          } else {
            await int.reply({ content: '❌ ロールパネルではありません', ephemeral: true });
            return;
          }
        } else {
          await int.reply({ content: '❌ ロールパネルではありません', ephemeral: true });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  // normal
  if (int.customId === 'rp') {
    const guildId = int.guild.id;
    const err_embed = new MessageEmbed();
    try {
      await int.update({
        components: int.message.components.map(row => {
          return {
            type: 'ACTION_ROW',
            components: row.components.map(component => {
              if (component.customId === int.customId) {
                component.options.forEach(option => option.default = false);
              }
              return component;
            })
          }
        })
      });
      const roleId = int.values[0];
      const role = await int.guild.roles.cache.get(roleId);
      if (!role) {
        err_embed.setDescription(`❌ ロールが存在しません`).setColor('RED');
        const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })
        setTimeout(() => {
          reply.delete();
        }, 3000)
        return;
      };
      
      const member = int.guild.members.cache.get(int.user.id);
      
      const hasRole = member.roles.cache.some(role => role.id === roleId);
      const embed = new MessageEmbed()
        .setColor(config.color);
      if (hasRole) {
        try {
          await member.roles.remove(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を剥奪しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      } else {
        try {
          await member.roles.add(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を付与しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      };
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
      setTimeout(async () => {
        await reply.delete();
      }, 3000)  
    }
  };
  
  // single
  if (int.customId === 'single-rp') {
    const guildId = int.guild.id;
    const err_embed = new MessageEmbed();
    try {
      await int.update({
        components: int.message.components.map(row => {
          return {
            type: 'ACTION_ROW',
            components: row.components.map(component => {
              if (component.customId === int.customId) {
                component.options.forEach(option => option.default = false);
              }
              return component;
            })
          }
        })
      });
      const roleId = int.values[0];
      const role = await int.guild.roles.cache.get(roleId);
      if (!role) {
        err_embed.setDescription(`❌ ロールが存在しません`).setColor('RED');
        const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })
        setTimeout(() => {
          reply.delete();
        }, 3000)
        return;
      };
      
      const member = int.guild.members.cache.get(int.user.id);
      
      const hasRole = member.roles.cache.some(role => role.id === roleId);
      const embed = new MessageEmbed()
        .setColor(config.color);
      if (hasRole) {
        try {
          await member.roles.remove(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を剥奪しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        };
      } else {
        try {
          const rembed = int.message.embeds[0];
          const rdescription = rembed.description;
          const rroleIds = rdescription.replace(/<@&|>/g,'').split('\n');
          const rmember = int.member;
          const removedRoleIds = [];
          
          for (const rroleId of rroleIds) {
            try {
              if (removedRoleIds.includes(rroleId)) continue;
              const rrole = int.guild.roles.cache.get(rroleId);
              if (rrole) {
                await rmember.roles.remove(rrole);
                removedRoleIds.push(rroleId);
              }
            } catch (e) {
              console.error(e);
            }
          }
          
          await member.roles.add(role);
          const reply = await int.channel.send({ content: `${int.member}` ,embeds: [embed.setDescription(`${role} を付与しました`)]});
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        } catch (e) {
          console.error(e);
          err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
          const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
          setTimeout(async () => {
            await reply.delete();
          }, 3000)
        }
      }
    } catch (e) {
      console.error(e);
      err_embed.setDescription(`❌ エラーが発生しました`).setColor('RED');
      const reply = await int.channel.send({ content: `${int.member}`, embeds: [err_embed] })   
      setTimeout(async () => {
        await reply.delete();
      }, 3000)
    }
  }
})

client.login(config.token);