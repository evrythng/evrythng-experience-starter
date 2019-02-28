import { parse } from './qs';

const settings = parse();

settings.apiUrl = settings.api || 'https://api.evrythng.com';
settings.mqttUrl = settings.mqtt || 'wss://ws.evrythng.com';

export default settings;