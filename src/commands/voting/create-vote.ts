import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { choiceArray, Ids, runPoll } from '../../polls';

export const data = new SlashCommandBuilder()
    .setName("create-vote")
    .setDescription("Create a new vote")
    .addStringOption(option =>
        option
            .setName(Ids.Question)
            .setDescription("What are you voting on")
            .setRequired(true)
    );

for (let i = 0; i < choiceArray.length; i++) {
    data.addStringOption(option => option.setName(choiceArray[i])
        .setDescription("An option to vote on")
        .setRequired(i < 2));
}

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const choices: string[] = [];

    for (let i = 0; i < choiceArray.length; i++) {
        const element = choiceArray[i];
        const choice = interaction.options.getString(element);
        if (choice !== null) {
            choices.push(choice);
        }
    }

    const question = interaction.options.getString(Ids.Question) as string;
    const user = interaction.user;
    await runPoll(interaction, question, user, choices);
};