const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js");
const fs = require("fs-extra");

module.exports = {
  name: 'rolepanel',
  async execute(client, int, options, config) {
    const err_embed = new MessageEmbed()
      .setTitle('ロールパネル');
    const embed = new MessageEmbed()
      .setColor(config.color)
    if (!int.member.permissions.has("ADMINISTRATOR")) {
      err_embed.setDescription(`❌ 管理者権限が必要です`).setColor('RED');
      await int.reply({ embeds: [err_embed], ephemeral: true });
      return;
    }
    
    let prefix = config.prefix;
    const guildId = int.guild.id;
    
    try {
      const mode = options.getSubcommand();
      const selectedRolePanel = fs.readJsonSync("./selectrolepanel.json");
      const messageId = selectedRolePanel[`${int.member.id}_${int.guild.id}`]?.message_id || null;
      const channelId = selectedRolePanel[`${int.member.id}_${int.guild.id}`]?.channel_id || null;
        
      const replied = { messageId, channelId };
      
      // help
      if (mode === 'help') {
        const helpContents = [
          {
            usage: 'help',
            description: 'ロールパネルのヘルプを表示します'
          },
          {
            usage: 'create {type} {roles...}',
            description: 'ロールパネルを作成します (type: `normal, single`)'
          },
          {
            usage: 'add {roles...}',
            description: 'ロールパネルにロールを追加します {+reply/select}'
          },
          {
            usage: 'remove {roles...}',
            description: 'ロールパネルからロールを削除します {+reply/select}'
          },
          {
            usage: 'copy',
            description: 'ロールパネルをコピーします {+reply/select}'
          },
          {
            usage: 'change',
            description: 'ロールパネルのタイプを変更します {+reply/select}'
          },
          {
            usage: 'refresh',
            description: 'ロールパネルを整理します {+reply/select}'
          }
        ];
        const helpDescription = helpContents.map(content => `**${prefix}rolepanel ${content.usage}** ${content.description ?? '説明がありません'}`).join('\n')
        embed.setTitle('ロールパネルヘルプ');
        embed.setDescription(helpDescription);
        embed.setFooter({ text: `prefix => ${prefix} | {} => required, () => optional` });
        await int.reply({ embeds: [embed] });
        return;
      };
      
      await int.deferReply({ ephemeral: true });
      
      // create
      if (mode === 'create') {
        const type = options.getString('type');
        const data = options.getString('roles').split(/ +/);
        if (data.length > 10) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await int.editReply({ embeds: [err_embed], ephemeral: true });
          return;
        } 
        const roles = [];
        for (const role of data) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = await int.guild.roles.cache.get(roleId);
          if (isExist) roles.push(roleId);
        }
        const panelDescription = roles.map(role => `<@&${role}>`).join('\n');
        const opts = [];
        for (const role of roles) {
          const roleName = await int.guild.roles.cache.get(role).name;
          opts.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const customId = type === 'single' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(opts).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single' ? 'ロールパネル (複数選択不可)' : 'ロールパネル');
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await int.channel.send({ embeds: [embed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;
      }
      
      if (!replied) {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
      
      let repliedMessage;
      try {
        repliedMessage = await int.guild.channels.cache.get(replied.channelId).messages.fetch(replied.messageId);
      } catch {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
      
      if (repliedMessage.member.id !== client.user.id || !repliedMessage.embeds[0]?.title?.includes('ロールパネル') || repliedMessage.embeds[0]?.color == 15548997) {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
      
      if (repliedMessage.embeds[0]?.title === 'ロールパネルヘルプ') {
        err_embed.setDescription(`❌ ロールパネルを選択してください`).setColor('RED');
        await int.editReply({ embeds: [err_embed], ephemeral: true });
        return;
      }
      
      // add
      else if (mode === 'add') {
        const type = repliedMessage.embeds[0].footer.text;
        const roles = options.getString('roles').split(/ +/);
        if (roles.length < 1) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await int.editReply({ embeds: [err_embed], ephemeral: true });
          return;
        }
        const oldPanel = repliedMessage.embeds[0].description;
        const roleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const oldRoleIdsLength = roleIds.length;
        for (const role of roles) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = await int.guild.roles.cache.get(roleId) && !roleIds.includes(roleId);
          if (isExist) roleIds.push(roleId);
        }
        if (oldRoleIdsLength == roleIds.length || roleIds.length > 10) {
          err_embed.setDescription(`❌ 値が不正です`).setColor('RED');
          await int.editReply({ embeds: [err_embed], ephemeral: true });
          return;
        }
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const opts = [];
        for (const role of roleIds) {
          const roleName = await int.guild.roles.cache.get(role).name;
          opts.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(opts).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;
      }
      
      // remove
      else if (mode === 'remove') {
        const type = repliedMessage.embeds[0].footer.text;
        const roles = options.getString('roles').split(/ +/);
        const oldPanel = repliedMessage.embeds[0].description;
        const oldRoleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const removeRoles = [];
        for (const role of roles) {
          const roleId = role.replace(/<@&|>/g,'');
          const isExist = oldRoleIds.includes(roleId);
          if (isExist) removeRoles.push(roleId);
        }
        const roleIds = oldRoleIds.filter(roleId => !removeRoles.includes(roleId));
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const opts = [];
        for (const role of roleIds) {
          const roleName = await int.guild.roles.cache.get(role).name;
          opts.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        if (opts.length == 0) {
          await repliedMessage.delete();
          await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
          return;
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(opts).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;
      }
      
      // copy
      else if (mode === 'copy') {
        const embed = repliedMessage.embeds[0];
        const menu = repliedMessage.components[0];
        await int.channel.send({ embeds: [embed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;
      }
      
      // change
      else if (mode === 'change') {
        const panelEmbed = repliedMessage.embeds[0];
        const type = panelEmbed.footer.text;
        const customId = type !== 'single-rp' ? 'single-rp' : 'rp';
        panelEmbed.setTitle(type !== 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        panelEmbed.setFooter(customId);
        const oldPanel = repliedMessage.embeds[0].description;
        const roleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const opts = [];
        for (const role of roleIds) {
          const roleName = await int.guild.roles.cache.get(role).name;
          opts.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(opts).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        await repliedMessage.edit({ embeds: [panelEmbed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;  
      }
      
      // refresh
      else if (mode === 'refresh') {
        const type = repliedMessage.embeds[0].footer.text;
        const oldPanel = repliedMessage.embeds[0].description;
        const oldRoleIds = oldPanel.replace(/<@&|>/g,'').split('\n');
        const removeRoles = [];
        for (const roleId of oldRoleIds) {
          const isExist = int.guild.roles.cache.get(roleId);
          if (!isExist) removeRoles.push(roleId);
        }
        const roleIds = oldRoleIds.filter(roleId => !removeRoles.includes(roleId));
        const panelDescription = roleIds.map(role => `<@&${role}>`).join('\n');
        const opts = [];
        for (const role of roleIds) {
          const roleName = await int.guild.roles.cache.get(role).name;
          opts.push(
            {
              label: roleName,
              value: role
            }
          )
        }
        if (opts.length == 0) {
          await repliedMessage.delete();
          await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
          return;
        }
        const customId = type === 'single-rp' ? 'single-rp' : 'rp';
        const row = new MessageSelectMenu().setCustomId(customId).setPlaceholder('ロールを選択してください').addOptions(opts).setMinValues(1).setMaxValues(1);
        const menu = new MessageActionRow()
          .addComponents(row);
        embed.setTitle(type === 'single-rp' ? 'ロールパネル (複数選択不可)' : 'ロールパネル')
        embed.setDescription(panelDescription);
        embed.setFooter(customId);
        await repliedMessage.edit({ embeds: [embed], components: [menu] });
        await int.editReply({ content: `${config.check} 成功しました`, ephemeral: true })
        return;
      }
    } catch (e) {
      console.error(e);
      err_embed.setDescription('❌ エラーが発生しました').setColor('RED');
      await int.editReply({ embeds: [err_embed], ephemeral: true });
    }
  },
}