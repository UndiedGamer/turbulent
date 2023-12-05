import type { REST } from '@discordjs/rest';
import type { CommandStore } from './lib/structures/CommandStore';

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		commands: CommandStore;
	}
	interface Container {
		rest: REST;
	}
}

export * from './lib/structures/Command';
export * from './lib/Client';
export * from './lib/Registry';
export * from './lib/interactions/shared';
export * from './lib/interactions/context-menu/decorators';
export * from './lib/interactions/chat-input/decorators';
export * from './lib/types/CommandTypes';
export { container } from '@sapphire/pieces';
