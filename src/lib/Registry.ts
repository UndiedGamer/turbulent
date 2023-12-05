import { REST } from '@discordjs/rest';
import { container } from '@sapphire/pieces';
import { Routes } from 'discord-api-types/v10';
import { chatInputCommandRegistry } from './interactions/shared';

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
}
