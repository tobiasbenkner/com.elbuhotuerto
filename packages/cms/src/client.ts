import {
  createDirectus,
  DirectusClient,
  rest,
  RestClient,
} from "@directus/sdk";
import { Schema } from "./types";
import { DIRECTUS_URL } from "./config";

let _client: DirectusClient<Schema> & RestClient<Schema>;

export function createClient() {
  if (_client) {
    return _client;
  }
  _client = createDirectus<Schema>(DIRECTUS_URL).with(rest());
  return _client;
}
