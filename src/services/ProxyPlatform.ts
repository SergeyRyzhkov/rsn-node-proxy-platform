import ProxyListService from './ProxyListService';
import { ProxyItem } from '@/entities/ProxyItem';
import { BaseService, ServiceRegistry, allSettledSeries, requestPromise } from 'rsn-express-core';
import { ProxyValidateOptions, RequestOptions } from '@/Options';

export class ProxyPlatform extends BaseService {

  public proxyValidateOptions: ProxyValidateOptions = new ProxyValidateOptions();

  public async updateProxyListAndValidate () {
    await this.updateProxyList();
    const proxiesFormDb = await ServiceRegistry.getService(ProxyListService).getProxies();
    this.validateList(proxiesFormDb);
  }

  public async updateProxyList () {
    const proxiesFromSource = await ServiceRegistry.getService(ProxyListService).geyProxiesFromSource();
    await ServiceRegistry.getService(ProxyListService).saveOrUpdateProxyList(proxiesFromSource);
    await ServiceRegistry.getService(ProxyListService).deleteDuplacate();
  }

  public async validateAll () {
    const proxiesFormDb = await ServiceRegistry.getService(ProxyListService).getProxies();
    await this.validateList(proxiesFormDb);
  }

  public async doRequest (options: RequestOptions) {
    const first = async (promises: Promise<any>[]) => {
      for (const promise of promises) {
        try {
          const res = await promise;
          if (res.success) {
            return res;
          }
        } catch (err) { }
      }
    }

    const proxies = await ServiceRegistry.getService(ProxyListService).getRandomValidProxy(options.maxParallelProxiesCount);
    const promises = proxies.map((proxy) => this.httpGetPromise(proxy, options));
    return await first(promises);
  }


  private async validateList (proxyList: ProxyItem[]) {
    await allSettledSeries(proxyList, this.validate.bind(this), this.proxyValidateOptions.parallelRequestsCount, null);
    if (this.proxyValidateOptions.deleteInvalid) {
      ServiceRegistry.getService(ProxyListService).deleteInvalidProxy();
    }
  }

  private async httpGetPromise (proxyItem: ProxyItem, options: RequestOptions) {
    try {
      const hrstart = process.hrtime();
      const response = await requestPromise(options.url, options.requestOptions, proxyItem);
      const hrend = process.hrtime(hrstart);
      const result: any = {};
      result.responseTime = hrend[0] * 1e3 + hrend[1] / 1e6;
      result.usedProxy = proxyItem;
      result.success = true;
      result.body = await response.text();
      result.response = response;
      return result;
    } catch (error) {
      error.usedProxy = proxyItem;
      error.success = false;
      return error;
    }
  }


  private async validate (proxyItem: ProxyItem) {
    proxyItem.proxyListVerifyDate = new Date(Date.now()).toUTCString();
    proxyItem.proxyListResponseTime = null;

    try {
      const hrstart = process.hrtime();
      const result = await requestPromise(this.proxyValidateOptions.validateUrl, this.proxyValidateOptions.requestOptions, proxyItem);

      // FIXME:  РКН может быть!
      if (!!result && result.ok && result.status < 400) {
        const hrend = process.hrtime(hrstart);
        proxyItem.proxyListResponseTime = hrend[0] * 1e3 + hrend[1] / 1e6;
        return true;
      }
    } catch (error) {
      return false;
    } finally {
      ServiceRegistry.getService(ProxyListService).saveOrUpdateProxy(proxyItem);
    }
  }
}