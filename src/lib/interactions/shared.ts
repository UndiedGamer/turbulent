import { Collection } from '@discordjs/collection';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody, RESTPostAPIContextMenuApplicationCommandsJSONBody } from 'discord-api-types/v10';
import type { Command } from '../structures/Command';
import type { NonNullObject } from '@sapphire/utilities';

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
