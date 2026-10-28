
import { TechnitiumServer } from "../technitium-dns/server.js";

const defaults: {[name: string]: string} = {
	'TECHNITIUM_EXPORTER_REQUIRE_AUTHENTICATION': 'false',
	'TECHNITIUM_EXPORTER_PORT': '8080'
}

function get_env(name: string): string {
	if(name in process.env) {
		return process.env[name] as string;
	}
	if(name in defaults) {
		return defaults[name];
	}
	throw Error("No value provided for environment variable " + name);
}

function get_env_uint(name: string): number {
	let repr = get_env(name);
	let res = Number(repr);
	if(Number.isNaN(res) || !Number.isFinite(res) || !Number.isInteger(res) || res < 0) {
		throw Error("Bad unsigned integer provided for environment variable " + name);
	}
	return res;
}


const ENV_VAR_REG = /^TECHNITIUM_API_([0-9A-Z_-]+)_BASE_URL/;

function read_servers_from_env(): TechnitiumServer[] {
	let res: TechnitiumServer[] = []
	for(const env_var of Object.keys(process.env)) {
		const match = ENV_VAR_REG.exec(env_var);
		if(match === null) {
			continue;
		}
		const server_id = match[1];
		const server_url = process.env[env_var]!;
		const server_token_var = `TECHNITIUM_API_${server_id}_TOKEN`;
		if(!(server_token_var in process.env)) {
			console.warn(`Missing environment variable ${server_token_var} for server at ${server_url} (skipping)`);
			continue;
		}
		let server_label = server_id.toLowerCase();
		const server_label_var = `TECHNITIUM_API_${server_id}_LABEL`;
		if(server_label_var in process.env) {
			server_label = process.env[server_label_var]!;
		}
		res.push(new TechnitiumServer(server_label, server_url, process.env[server_token_var]!));
	}
	if(res.length === 0) {
		throw Error('Found no valid server definition');
	}
	return res;
}


export const REQUIRE_AUTHENTICATION = (get_env('TECHNITIUM_EXPORTER_REQUIRE_AUTHENTICATION') === 'true');
export const PORT                   = get_env_uint('TECHNITIUM_EXPORTER_PORT');
export const SERVERS                = read_servers_from_env();
