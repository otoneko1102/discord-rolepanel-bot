const { Client } = require("discord.js");
const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes, ApplicationCommandType } = require('discord-api-types/v10');
const options = { intents: [3243773] };
const client = new Client(options);
const config = require('./config');
const rest = new REST({ version: '10' }).setToken(config.token);

const allowedUser = config.ownerId;

client.on("ready", () => {
  console.log(`slash.js OK!`);
});

const Slash = SlashCommandBuilder;

client.on('messageCreate', async message => {
  if (message.content === `${config.prefix}reload` && message.author.id === allowedUser) {
    const commands = [
      // ロールパネルを選択
      new ContextMenuCommandBuilder()
        .setName('ロールパネルを選択')
        .setType(ApplicationCommandType.Message),
      // rolemembers
      new Slash()
        .setName('rolemembers')
        .setDescription('ロールの人数を見れます')
        .addRoleOption(
          option =>
          option
            .setName('role')
            .setDescription('ロールを選択してください')
            .setRequired(true)
        ),
      // rolepanel
      new Slash()
        .setName('rolepanel')
        .setDescription('ロールパネルを操作します')
        .addSubcommand(
          cmd =>
          cmd
            .setName('help')
            .setDescription('ロールパネルのヘルプを表示します')
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('create')
            .setDescription('ロールパネルを作成します')
            .addStringOption(
              option =>
              option
                .setName('type')
                .setDescription('タイプを選択してください')
                .setRequired(true)
                .addChoices(
                  { name: 'normal', value: 'normal' },
                  { name: 'single', value: 'single' }
                )
            )
            .addStringOption(
              option =>
              option
                .setName('roles')
                .setDescription('ロールを空白で区切って入力してください')
                .setRequired(true)
            )
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('add')
            .setDescription('ロールパネルにロールを追加します')
            .addStringOption(
              option =>
              option
                .setName('roles')
                .setDescription('ロールを空白で区切って入力してください')
                .setRequired(true)
            )
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('remove')
            .setDescription('ロールパネルからロールを削除します')
            .addStringOption(
              option =>
              option
                .setName('roles')
                .setDescription('ロールを空白で区切って入力してください')
                .setRequired(true)
            )
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('copy')
            .setDescription('ロールパネルをコピーします')
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('change')
            .setDescription('ロールパネルのタイプを変更します')
        )
        .addSubcommand(
          cmd =>
          cmd
            .setName('refresh')
            .setDescription('ロールパネルを整理します')
        ),
    ];
    
    async function main(){
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      )
    }
    
    main()
      .catch(err => {console.log('❌ エラーが発生しました'); console.error(err); return})
      .then(() => {console.log('✅ スラッシュコマンドを更新しました')})
  }
})

client.login(config.token);