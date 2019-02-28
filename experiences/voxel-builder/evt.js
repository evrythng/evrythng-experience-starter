'use strict';

import evt from 'evrythng-extended';
import settings from './settings';

evt.setup({
  apiUrl: settings.apiUrl,
  authorization: settings.key,
  geolocation: false
});

evt.app = new evt.App(settings.key);
evt.subscribe = function subscribe(config, fn) {
  const path = config.url;
  const key = settings.key;
  const url = `${settings.mqttUrl}:443${path}?access_token=${key}`;
  const socket = new WebSocket(url);

  return new Promise(res => {
    socket.addEventListener('message', function(message) {
      fn(JSON.parse(message.data));
    });

    socket.addEventListener('open', res);
  }); 
}

export default evt;


