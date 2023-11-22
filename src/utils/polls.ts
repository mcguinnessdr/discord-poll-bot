import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    ComponentType,
    ButtonInteraction,
    ChatInputCommandInteraction,
    userMention,
    User,
    Interaction,
    ModalSubmitInteraction,
} from 'discord.js';
const { choiceCount } = require("../../config.json");

export type Poll =
    {
        id: string;
        author: User;
        question: string;
        choices: string[];
        votes: { [username: string]: string[] };
        winner: string;
    }

export type Vote =
    {
        user: string;
        choices: string[];
    }

export const polls: { [id: string]: Poll | undefined } = {};

export const choiceArray: string[] = [];
for (let i = 0; i < choiceCount; i++) {
    choiceArray[i] = `choice-${i + 1}`;
}

export const runPoll = async (interaction: ChatInputCommandInteraction | ModalSubmitInteraction, question: string, user: User, choices: string[]) => {
    const row = new ActionRowBuilder<ButtonBuilder>()
    row.addComponents(
        new ButtonBuilder()
            .setCustomId("vote")
            .setLabel("Vote")
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId("close")
            .setLabel("Close")
            .setStyle(ButtonStyle.Secondary),
    );

    const pollUuid = uuidv4();
    const currentPoll: Poll = {
        id: pollUuid,
        author: user,
        question: question,
        choices: choices,
        votes: {},
        winner: "",
    }
    polls[pollUuid] = currentPoll;
let response;
    if (interaction.replied)
{
    response = await interaction.followUp({
        embeds: [buildEmbed(currentPoll)],
        components: [row],
        fetchReply: true,
    });
} else {
    response = await interaction.reply({
        embeds: [buildEmbed(currentPoll)],
        components: [row],
        fetchReply: true,
    });
}


    const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 604_800_000 })
    collector.on("collect", async (i: ButtonInteraction) => {
        const userId = i.member?.user.id as string;
        if (i.customId !== "vote") {
            if (i.member?.user.id !== currentPoll.author.id) {
                i.reply({ content: "only the owner can close a poll", ephemeral: true });
                return;
            }
            collector.stop();
            return;
        } else {
            currentPoll.votes[userId] = [];
        }
        const completedVote = await sendNextVotePrompt(i, currentPoll);
        if (completedVote) {
            if (polls[pollUuid] === undefined) {
                return;
            }
            currentPoll.winner = getWinner(currentPoll);
            i.message.edit({
                embeds: [buildEmbed(currentPoll)],
                components: [row],
            })
        }
    });

    collector.on("end", async () => {
        await (await interaction.fetchReply()).edit({ components: [] });
        delete polls[pollUuid];
    })
};

const sendNextVotePrompt = async (i: ButtonInteraction, currentPoll: Poll): Promise<boolean> => {
    const user = i.member?.user;
    let votes = currentPoll.votes[user?.id as string];
    if (votes == undefined) {
        votes = [];
    }
    const remainingChoices = currentPoll.choices.filter(x => !votes.includes(x));
    if (remainingChoices.length <= 0) {
        await i.update({ content: "Thank you for voting!", components: [] });
        return true;
    }
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let index = 0; index < remainingChoices.length; index++) {
        const element = remainingChoices[index];
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(element)
                .setLabel(element)
                .setStyle(ButtonStyle.Primary)
        );
    }

    var response;
    const reply = {
        content: `## Pick you #${votes.length + 1} choice for "${currentPoll.question}".`,
        components: [row],
        fetchReply: true,
    }

    if (i.customId === "vote") {
        response = await i.reply({
            ...reply,
            ephemeral: true,
        });
    } else {
        response = await i.update(reply);
    }

    try {
        const confirmation = await response.awaitMessageComponent({ time: 60000 });
        const username = confirmation.member?.user.id as string;
        let votes = currentPoll.votes[username];
        votes.push(confirmation.customId);
        if (votes.length === currentPoll.choices.length - 1) {
            const remainingChoices = currentPoll.choices.filter(x => !votes.includes(x));
            votes.push(remainingChoices[0]);
        }
        currentPoll.votes[username] = votes;
        if (polls[currentPoll.id] === undefined) {
            i.editReply({ content: 'The poll has closed', components: [] })
            return false;
        }
        polls[currentPoll.id] = currentPoll;
        return sendNextVotePrompt(confirmation as ButtonInteraction, currentPoll);
    } catch (e) {
        console.log(e)
        await i.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
        return false;
    }
}

const getWinner = (currentPoll: Poll): string => {
    const votes = currentPoll.votes;
    const voteArray = Object.keys(votes).map(x => votes[x]);
    return tallyVotes(voteArray, currentPoll.choices);
}

const tallyVotes = (voteArray: string[][], choices: string[]): string => {
    const choiceCount = choices.length;
    const firstChoiceVotes: number[] = Array.from({ length: choiceCount }, () => 0);
    for (let index = 0; index < choiceCount; index++) {
        const choice = choices[index];
        for (let j = 0; j < voteArray.length; j++) {
            const userVotes = voteArray[j];
            if (userVotes[0] === choice) {
                firstChoiceVotes[index]++;
            }
        }
    }

    let losers: number[] = [0];
    for (let index = 0; index < firstChoiceVotes.length; index++) {
        const element = firstChoiceVotes[index];
        if (element < firstChoiceVotes[losers[0]]) {
            losers = [index];
        } else if (element === firstChoiceVotes[losers[0]]) {
            losers.push(index);
        }
    }

    const loser = losers[Math.floor(Math.random() * losers.length)];

    for (let index = 0; index < voteArray.length; index++) {
        const element = voteArray[index];
        voteArray[index] = element.filter(x => x !== choices[loser]);
    }

    const remainingChoices = choices.toSpliced(loser, 1);

    if (remainingChoices.length === 1) {
        return remainingChoices[0];
    }

    return tallyVotes(voteArray, remainingChoices);
}

const buildEmbed = (currentPoll: Poll) => {
    const voters = Object.keys(currentPoll.votes).map(x => userMention(x));
    let fields: string = voters.join(", ");
    if (fields.length < 1) {
        fields = "No votes yet";
    }

    let winner = currentPoll.winner;
    if (winner.length < 1) {
        winner = "No winner";
    }

    const choices = currentPoll.choices.join(", ");

    const embed = new EmbedBuilder()
        .setAuthor({ name: currentPoll.author.username, iconURL: currentPoll.author.displayAvatarURL() })
        .setTitle(currentPoll.question)
        .addFields({ name: "Winner", value: winner })
        .addFields({ name: "Choices", value: choices })
        .addFields({ name: "Voters", value: fields })
        .setTimestamp()
        .setFooter({ text: currentPoll.id });

    return embed;
};

const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
};