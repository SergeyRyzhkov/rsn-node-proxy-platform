import { ServiceRegistry, ExpressApplication, logger, AppConfig } from 'rsn-express-core';
import ProxyListService from './services/ProxyListService';
import { ProxyPlatform } from './services/ProxyPlatform';
import { ProxyItem } from './entities/ProxyItem';
import { ProxyController } from './controllers/ProxyController';

(async () => {

  ServiceRegistry.register(ProxyListService).register(ProxyPlatform);

  const entities: any[] = [ProxyItem];
  const controllers = [ProxyController];
  const app: ExpressApplication = new ExpressApplication();

  app.addOrmEntityModelMetadata(entities);
  app.addAppControllers(controllers);
  app.initialize();

  if (process.argv.some((iter) => iter === 'server')) {
    app.start();
  }

  const isUpdate = process.argv.some((iter) => iter === 'update');
  const isValidate = process.argv.some((iter) => iter === 'validate');

  if (isValidate || isUpdate) {
    ServiceRegistry.getService(ProxyPlatform).proxyValidateOptions.deleteInvalid = AppConfig.proxyPlatform.deleteInvalid;
    ServiceRegistry.getService(ProxyPlatform).proxyValidateOptions.validateUrl = AppConfig.proxyPlatform.validateUrl;
    ServiceRegistry.getService(ProxyPlatform).proxyValidateOptions.parallelRequestsCount = AppConfig.proxyPlatform.parallelRequestsCount;

    if (isValidate && !isUpdate) {
      ServiceRegistry.getService(ProxyPlatform).updateProxyList();
    }
    if (isValidate && !isUpdate) {
      ServiceRegistry.getService(ProxyPlatform).validateAll();
    }
    if (isValidate && isUpdate) {
      ServiceRegistry.getService(ProxyPlatform).updateProxyListAndValidate();
    }
  }

  process.on('uncaughtException', (err) => {
    logger.error(err);
    process.exit(1);
  })
}
)()

