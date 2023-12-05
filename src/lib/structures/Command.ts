import { Piece } from '@sapphire/pieces';
import type { CommandOptions, CommandJSON } from '../types/CommandTypes';
import { Collection } from '@discordjs/collection';
import {
	type APIChatInputApplicationCommandInteractionData,
	ApplicationCommandOptionType,
	type APIContextMenuInteractionData
} from 'discord-api-types/v10';
import { chatInputCommandRegistry, contextMenuCommandRegistry } from '../interactions/shared';
import type { CommandStore } from './CommandStore';

export class Command<Options extends Command.Options = Command.Options> extends Piece<Options, 'commands'> {
	public description: string;
	private chatInputRouter = new Collection<string, string | Collection<string, string>>();
	private contextMenuRouter = new Collection<string, string>();
	public constructor(context: Command.LoaderContext, options: Command.Options = {} as Command.Options) {
		super(context);
		this.description = options.description ?? '';
	}

	public override onLoad() {
		this.populateChatInputRouter();
		this.populateContextMenuRouter();
	}

	protected routeChatInputInteraction(data: APIChatInputApplicationCommandInteractionData): string | null {
		if (!data.options?.length) return 'chatInputRun';

		const [firstOption] = data.options;
		if (firstOption.type === ApplicationCommandOptionType.Subcommand) {
			const possible = this.chatInputRouter.get(firstOption.name);
			return typeof possible === 'string' ? possible : null;
		}

		if (firstOption.type === ApplicationCommandOptionType.SubcommandGroup) {
			const possibleGroup = this.chatInputRouter.get(firstOption.name);
			if (!(possibleGroup instanceof Collection)) return null;

			const [firstSubOption] = firstOption.options;
			const possible = possibleGroup.get(firstSubOption.name);
			return possible ?? null;
		}

		return 'chatInputRun';
	}

	protected routeContextMenuInteraction(data: APIContextMenuInteractionData): string | null {
		const possible = this.contextMenuRouter.get(data.name);
		return typeof possible === 'string' ? possible : null;
	}

	private populateChatInputRouter() {
		const data = chatInputCommandRegistry.get(this.constructor as typeof Command);
		if (!data?.options?.length) return;

		for (const option of data.options) {
			if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
				// If a subcommand group has no subcommands, skip:
				if (!option.options?.length) continue;

				// If a subcommand group already existed, throw an error:
				if (this.chatInputRouter.has(option.name)) throw new Error(`Duplicated chat input SubcommandGroup named "${option.name}"`);

				const subcommands = new Collection<string, string>();
				for (const subOption of option.options) {
					const method = Reflect.get(subOption, Symbol('decorated-command.method.link'));
					if (method && typeof Reflect.get(this, method) === 'function') {
						subcommands.set(subOption.name, method);
					} else {
						throw new Error(
							`Chat input subcommand named "${option.name}" (inside SubcommandGroup named "${option.name}") is not linked to a method`
						);
					}
				}

				this.chatInputRouter.set(option.name, subcommands);
			} else if (option.type === ApplicationCommandOptionType.Subcommand) {
				// If a subcommand group already existed, throw an error:
				if (this.chatInputRouter.has(option.name)) throw new Error(`Duplicated Subcommand named "${option.name}"`);

				const method = Reflect.get(option, Symbol('decorated-command.method.link'));
				if (method && typeof Reflect.get(this, method) === 'function') this.chatInputRouter.set(option.name, method);
				else throw new Error(`Chat input subcommand named "${option.name}" is not linked to a method`);
			}
		}
	}

	private populateContextMenuRouter() {
		const entries = contextMenuCommandRegistry.get(this.constructor as typeof Command);
		if (!entries?.length) return;

		for (const entry of entries) {
			const method = Reflect.get(entry, Symbol('decorated-command.method.link'));
			if (method && typeof Reflect.get(this, method) === 'function') {
				this.contextMenuRouter.set(entry.name, method);
				(this.store as CommandStore).contextMenuCommands.set(entry.name, this);
			} else {
				throw new Error(`Context menu command named "${entry.name}" is not linked to a method`);
			}
		}
	}
}

export namespace Command {
	export type Options = CommandOptions;
	export type JSON = CommandJSON;
	export type LoaderContext = Piece.LoaderContext;
}
