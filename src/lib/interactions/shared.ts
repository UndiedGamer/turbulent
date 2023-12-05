import { Collection } from '@discordjs/collection';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { Command } from '../structures/Command';
import type { NonNullObject } from '@sapphire/utilities';

export const restrictedGuildIdRegistry = new Collection<typeof Command<Command.Options>, readonly string[]>();

export function RestrictGuildIds<Options extends Command.Options = Command.Options>(guildIds: readonly string[]) {
	return function decorate(target: typeof Command<Options>) {
		restrictedGuildIdRegistry.set(target, guildIds);
	};
}

export const chatInputCommandRegistry = new Collection<typeof Command<Command.Options>, RESTPostAPIChatInputApplicationCommandsJSONBody>();

export const contextMenuCommandRegistry = new Collection<typeof Command<Command.Options>, RESTPostAPIContextMenuApplicationCommandsJSONBody[]>();

const linkSymbol = Symbol('decorated-command.method.link');

export function link<T extends NonNullObject>(object: T, name: string): T {
	Object.defineProperty(object, linkSymbol, { value: name });
	return object;
}

export function getMethod(object: NonNullObject): string | null {
	return Reflect.get(object, linkSymbol) ?? null;
}
