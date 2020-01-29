import BaseService from 'rsn-express-core/services/BaseService';
import ProxyListService from './ProxyListService';
import { proxyRequest } from './ProxyRequest';
import ServiceRegistry from 'rsn-express-core/services/ServiceContainer';
import { ProxyItem } from '@/entities/ProxyItem';


export class ProxyPlatform extends BaseService {

  public async updateProxyListAndValidate (deleteInvalid = true) {
    const proxiesFromSource = await ServiceRegistry.getService(ProxyListService).geyProxiesFromSource();
    await ServiceRegistry.getService(ProxyListService).saveOrUpdateProxyList(proxiesFromSource);
    //FIXME: Надо брать сначала ранее верифицированные по дате, чтобы быстрее их верифицировать и протуъшие они не попали в запрос клиентам
    const proxiesFormDb = await ServiceRegistry.getService(ProxyListService).getProxies();
    await this.validateList(proxiesFormDb, deleteInvalid);
  }

  public async validateAll (deleteInvalid = true) {
    const proxiesFormDb = await ServiceRegistry.getService(ProxyListService).getProxies();
    this.validateList(proxiesFormDb, deleteInvalid);
  }

  public async validateList (proxyList: ProxyItem[], deleteInvalid = true) {
    for (const iterProxy of proxyList) {
      // await this.validate(iterProxy, deleteInvalid);
    }

    const promiseSequense = proxyList.map(iterProxy => this.validate(iterProxy, deleteInvalid));
    await Promise.all(promiseSequense);
  }

  //FIXME: Ссылка в параметр и в контроллер
  private async validate (proxyItem: ProxyItem, deleteInvalid: boolean) {
    const request = proxyRequest(
      {
        timeout: 6000,
        method: 'GET',
        uri: 'http://sergeyryzhkov.github.io'
      }, proxyItem);

    try {
      const hrstart = process.hrtime();
      await request;
      const hrend = process.hrtime(hrstart);
      proxyItem.proxyListResponseTime = hrend[0] * 1e3 + hrend[1] / 1e6;
      proxyItem.proxyListVerifyDate = new Date(Date.now()).toUTCString();
      ServiceRegistry.getService(ProxyListService).saveOrUpdateProxy(proxyItem);
      return true;
    } catch (error) {
      if (deleteInvalid) {
        ServiceRegistry.getService(ProxyListService).deleteProxy(proxyItem.proxyListIpAddress);
      }
      return false;
    }
  }
}