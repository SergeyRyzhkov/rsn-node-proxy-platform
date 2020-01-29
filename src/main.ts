
import ExpressApplication from 'rsn-express-core/ExpressApplication';
import { ProxyItem } from './entities/ProxyItem';
import ProxyController from './controllers/ProxyController';
import ServiceRegistry from 'rsn-express-core/services/ServiceContainer';
import { ProxyPlatform } from './services/ProxyPlatform';
import ProxyListService from './services/ProxyListService';

// tslint:disable-next-line:max-classes-per-file
class ExampleApp {

  public async start () {

    ServiceRegistry.register(ProxyListService).register(ProxyPlatform);

    const entities: any[] = [ProxyItem];
    const controllers = [ProxyController];
    const app: ExpressApplication = new ExpressApplication();
    app.addOrmEntityModelMetadata(entities);
    app.addAppControllers(controllers);
    await app.start();
  }
}

(async () => {
  new ExampleApp().start();
}
)()

