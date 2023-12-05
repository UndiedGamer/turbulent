import type { Piece, AliasPieceJSON } from '@sapphire/pieces';
import type { APIApplicationCommandInteractionDataOption } from 'discord-api-types/v10';

export interface CommandOptions extends Piece.Options {
	description: string;
	options?: APIApplicationCommandInteractionDataOption[];
}

export interface CommandJSON extends AliasPieceJSON {
	description: string;
	category: string | null;
}
