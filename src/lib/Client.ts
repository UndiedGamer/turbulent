import { container } from '@sapphire/pieces';
import { InteractionType, type APIInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { Router, type Route, type RouterType } from 'itty-router';
import nacl from 'tweetnacl';
import { CommandStore } from './structures/CommandStore';

container.stores.register(new CommandStore());
export class Client {
	public router: RouterType<Route, any>;
	#publicKey: string;
	public constructor(options: any = {}) {
		this.router = Router();
		const discordPublicKey = options.discordPublicKey ?? process.env.DISCORD_PUBLIC_KEY;
		if (!discordPublicKey) throw new Error('Missing Discord public key.');
		this.#publicKey = discordPublicKey;
	}

	public listen() {
		this.router.get('/', (_request: Request, env: typeof process.env) => {
			return new Response(`${env.DISCORD_APPLICATION_ID}`);
		});
		this.router.post('/', async (request: Request) => {
			return this.handleInteraction(request);
		});
	}

	public async load(options: { baseUserDirectory?: string | null } = {}) {
		// Register the user directory if not null:
		if (options.baseUserDirectory !== null) {
			container.stores.registerPath(options.baseUserDirectory);
		}

		await container.stores.load();
	}

	public async handleInteraction(request: Request) {
		const { interaction, isValid } = await this.verifyRequest(request);
		if (!isValid || !interaction) return new Response('Bad request signature', { status: 401 });
		switch (interaction.type) {
			case InteractionType.Ping:
				return () =>
					new Response(JSON.stringify({ type: InteractionResponseType.Pong }), {
						status: 200,
						headers: {
							'Content-Type': 'application/json'
						}
					});
			case InteractionType.ApplicationCommand:
				return container.stores.get('commands').runApplicationCommand(interaction);
			case InteractionType.MessageComponent:
			case InteractionType.ApplicationCommandAutocomplete:
			case InteractionType.ModalSubmit:
				return console.log('Not implemented yet');
		}
	}

	private async verifyRequest(request: Request) {
		const signature = request.headers.get('X-Signature-Ed25519');
		const timestamp = request.headers.get('X-Signature-Timestamp');
		const body = await request.text();
		const isValidRequest = signature && timestamp && this.verifyKey(body, signature, timestamp, this.#publicKey);
		if (!isValidRequest) {
			return { isValid: false };
		}

		return { interaction: JSON.parse(body) as APIInteraction, isValid: true };
	}

	private verifyKey(
		rawBody: Uint8Array | ArrayBuffer | Buffer | string,
		signature: Uint8Array | ArrayBuffer | Buffer | string,
		timestamp: Uint8Array | ArrayBuffer | Buffer | string,
		clientPublicKey: Uint8Array | ArrayBuffer | Buffer | string
	): boolean {
		try {
			const timestampData = this.valueToUint8Array(timestamp);
			const bodyData = this.valueToUint8Array(rawBody);
			const message = this.concatUint8Arrays(timestampData, bodyData);

			const signatureData = this.valueToUint8Array(signature, 'hex');
			const publicKeyData = this.valueToUint8Array(clientPublicKey, 'hex');
			return nacl.sign.detached.verify(message, signatureData, publicKeyData);
		} catch (ex) {
			return false;
		}
	}

	private concatUint8Arrays(arr1: Uint8Array, arr2: Uint8Array): Uint8Array {
		const merged = new Uint8Array(arr1.length + arr2.length);
		merged.set(arr1);
		merged.set(arr2, arr1.length);
		return merged;
	}

	private valueToUint8Array(value: Uint8Array | ArrayBuffer | Buffer | string, format?: string): Uint8Array {
		if (value === null) {
			return new Uint8Array();
		}
		if (typeof value === 'string') {
			if (format === 'hex') {
				const matches = value.match(/.{1,2}/g);
				if (matches === null) {
					throw new Error('Value is not a valid hex string');
				}
				const hexVal = matches.map((byte: string) => parseInt(byte, 16));
				return new Uint8Array(hexVal);
			}
			return new TextEncoder().encode(value);
		}
		try {
			if (Buffer.isBuffer(value)) {
				return new Uint8Array(value);
			}
		} catch (ex) {
			// Runtime doesn't have Buffer
		}
		if (value instanceof ArrayBuffer) {
			return new Uint8Array(value);
		}
		if (value instanceof Uint8Array) {
			return value;
		}
		throw new Error('Unrecognized value type, must be one of: string, Buffer, ArrayBuffer, Uint8Array');
	}
}
