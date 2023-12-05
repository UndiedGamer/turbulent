import { REST } from '@discordjs/rest';
import { container } from '@sapphire/pieces';
import { Routes, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { chatInputCommandRegistry, contextMenuCommandRegistry, restrictedGuildIdRegistry } from './interactions/shared';
import { flattenIterableOfArrays } from './utils/generators';

export class Registry {
	public clientId: string;
	#token: string;
	public constructor(clientId: string, token: string) {
		container.rest = new REST();
		this.#token = token;
		this.clientId = clientId;
	}

	public async register() {
		container.rest.setToken(this.#token);
		try {
			await container.rest.put(Routes.applicationCommands(this.clientId), { body: chatInputCommandRegistry });
			console.log('Successfully registered application commands.');
		} catch (error) {
			console.error(error);
		}
	}

	public get globalCommands(): RESTPostAPIApplicationCommandsJSONBody[] {
		return [
			...chatInputCommandRegistry.filter((_, command) => !restrictedGuildIdRegistry.get(command)?.length).values(),
			...flattenIterableOfArrays(contextMenuCommandRegistry.filter((_, command) => !restrictedGuildIdRegistry.get(command)?.length).values())
		];
	}
}
