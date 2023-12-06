import { Store } from '@sapphire/pieces';
import { Command } from './Command';
import { Collection } from '@discordjs/collection';
import { ApplicationCommandType, type APIApplicationCommandInteraction } from 'discord-api-types/v10';
import { Result } from '@sapphire/result';

export class CommandStore extends Store<Command, 'commands'> {
	public contextMenuCommands = new Collection<string, Command>();
	public constructor() {
		super(Command, { name: 'commands' });
	}

	public async runApplicationCommand(interaction: APIApplicationCommandInteraction) {
		const command =
			interaction.data.type === ApplicationCommandType.ChatInput
				? this.get(interaction.data.name)
				: this.contextMenuCommands.get(interaction.data.name);
		if (!command) return new Response('Unknown command', { status: 404 });
		const method = this.routeCommandMethodName(command, interaction.data);
		if (!method) return new Response('Unknown method', { status: 404 });
		const result = await Result.fromAsync(() => this.runMethod(command, method, interaction));
		// implement listeners?
		let response: unknown;
		result.inspect((value) => (response = value));
		if (response instanceof Response) return response;
		return new Response('Command successfully executed', { status: 200 });
	}

	private runMethod(command: Command, method: string, interaction: unknown) {
		return Reflect.apply(Reflect.get(command, method), command, [interaction]);
	}

	// @ts-expect-error what
	private routeCommandMethodName(command: Command, data: any) {
		switch (data.type) {
			case ApplicationCommandType.ChatInput: {
				// eslint-disable-next-line @typescript-eslint/dot-notation
				return command['routeChatInputInteraction'](data);
			}
			case ApplicationCommandType.User:
			case ApplicationCommandType.Message: {
				// eslint-disable-next-line @typescript-eslint/dot-notation
				return command['routeContextMenuInteraction'](data);
			}
		}
	}
}
