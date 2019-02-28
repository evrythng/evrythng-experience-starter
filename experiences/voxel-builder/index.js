import evt from './evt';
import { initCurrentUser } from './user';
import app from './app';
import settings from './settings';

main();

////////////////////////////////////////////////

async function main() {
  const user = await initCurrentUser();
  const product = await user.product(settings.id).read();
  
  app.init(product);
  evt.subscribe({
    url: `/products/${settings.id}/properties/workbench`
  }, ([update]) => {
    app.reconstruct(update.value);
  });

  app.on('workbench-update', workbench => {
    user.product(settings.id).property('workbench').update({
      value: workbench
    });
  });
}