# Discord Poll Bot

Discord Poll Bot is designed to implement [Instant Runoff Voting](https://en.wikipedia.org/wiki/Instant-runoff_voting) in an easy to use Discord bot.

## Usage

To create a poll use either the `/create-vote` or `/poll-modal` commands. Modals are limited to 4 choices.

<img width="885" alt="image" src="https://github.com/mcguinnessdr/discord-poll-bot/assets/2281608/3fd1b71d-9b0b-45e4-8c69-f29d46968f19">
<img width="344" alt="image" src="https://github.com/mcguinnessdr/discord-poll-bot/assets/2281608/8490f240-e386-4146-9f04-0e94f2e78b19">

To vote on a poll simply press the vote button on a poll and you will be presented with a series of messages where you can pick your top choices in order.

<img width="416" alt="image" src="https://github.com/mcguinnessdr/discord-poll-bot/assets/2281608/d1f6668e-849f-42e4-b740-4c608ded2419">

## Self Hosting

This bot requires the [Bun](https://bun.sh/) runtime. 

1. Set up a [Discord Bot Application](https://discord.com/developers/docs/getting-started).
2. Clone the repository.
3. Run `bun install` in the root of the cloned repository.
4. Create a file called `config.json` in the root directory and fill it out with the information from the bot you created in step 1. `choiceCount` is the max amount of choices a user can create for a poll (Modals are limited to 4 choices).

config.json: 

```json
{
    "token": string,
    "clientId": string,
    "choiceCount": number
}
```

5. Run `bun deploy-commands`.
6. Run `bun start` to start the bot.
7. Add your bot's `clientId` to this url and go to it to invite the bot to your server: `https://discord.com/api/oauth2/authorize?client_id=your client id here&permissions=274877908992&scope=bot`.
