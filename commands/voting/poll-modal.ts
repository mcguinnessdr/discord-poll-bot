import { ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder, TextInputStyle } from "discord.js";
import { choiceArray, runPoll } from "../../src/utils/polls";

export const data = new SlashCommandBuilder()
    .setName("poll-modal")
    .setDescription("Create a new poll through a modal.");

export const execute = async (interaction: ChatInputCommandInteraction) => {
    const modal = new ModalBuilder()
        .setCustomId("poll-modal")
        .setTitle("Create Poll");

    const questionInput = new TextInputBuilder()
        .setCustomId("question")
        .setLabel("Question")
        .setStyle(TextInputStyle.Short);
    
    const trimmedChoiceArray = choiceArray.toSpliced(4, choiceArray.length - 4);

    const choiceFields = trimmedChoiceArray.map((x, i) => new ActionRowBuilder<TextInputBuilder>()
        .addComponents(new TextInputBuilder()
            .setCustomId(x)
            .setLabel("Option")
            .setStyle(TextInputStyle.Short)
            .setRequired(i < 2)));

    modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(questionInput));
    modal.addComponents(choiceFields);

    await interaction.showModal(modal);
    const modalSubmit = await interaction.awaitModalSubmit({ time: 360_000 });
    const question = modalSubmit.fields.getTextInputValue("question");
    const user = interaction.user;
    const choices: string[] = [];

    for (let i = 0; i < trimmedChoiceArray.length; i++) {
        const element = trimmedChoiceArray[i];
        const choice = modalSubmit.fields.getTextInputValue(element);
        if (choice) {
            choices.push(choice);
        }
    }

    console.log(choices)

    await runPoll(modalSubmit, question, user, choices);
};