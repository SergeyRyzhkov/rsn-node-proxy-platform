import * as ProxyLists from 'proxy-lists'
import { ProxyItem } from '@/entities/ProxyItem';
import { TypeOrmManager, ClassTransform } from 'rsn-express-core';
import { BaseService } from 'rsn-express-core';
import { getSpysMeProxies, getFreeProxyCzProxies } from '@/CustomProxySource';


export default class ProxyListService extends BaseService {

  // FIXME: Параметры что забирать как у npm пакета. Протянуть в контроолер и сделать там пост
  public geyProxiesFromSource (options?: any) {
    const mergedOptions = { ...defaultProxyListsOptions, ...options };

    return new Promise(async (resolve) => {
      let proxyList = []

      const proxies = await getSpysMeProxies();
      proxyList = [...proxyList, ...proxies];

      const pr2 = await getFreeProxyCzProxies();
      proxyList = [...proxyList, ...pr2];

      // resolve(proxyList);

      ProxyLists.getProxies(mergedOptions)
        .on('data', async (proxies) => {
          if (!!proxies) {
            proxyList = [...proxyList, ...proxies];
          }
        })
        .once('end', async (proxies) => {
          if (!!proxies) {
            proxyList = [...proxyList, ...proxies];
          }
          resolve(proxyList);
        });
    })
  }

  public async getProxies () {
    const dbResult: [] = await this.getDbViewResult('proxy_list') as [];
    return ClassTransform.plainArrayToClassInstanceArray(dbResult, ProxyItem);
  }

  public async geValidProxies () {
    const dbResult: [] = await this.getDbViewResult('proxy_list where proxy_list_response_time is not null order by proxy_list_response_time desc') as [];
    return ClassTransform.plainArrayToClassInstanceArray(dbResult, ProxyItem);
  }

  public async getRandomValidProxy (count = 20) {
    const dbResult: [] = await this.getDbViewResult(`proxy_list where proxy_list_response_time is not null order by random() limit ${count}`) as [];
    return ClassTransform.plainArrayToClassInstanceArray(dbResult, ProxyItem);
  }

  public async saveOrUpdateProxyList (proxyList: any) {
    let proxyItemList: ProxyItem[] = [];
    const promises = proxyList.map(iterItem => this.saveOrUpdateProxy(this.convertProxyToDbProxyItem(iterItem)));
    proxyItemList = await Promise.all(promises);
    return proxyItemList;
  }

  public async saveOrUpdateProxy (proxyItem: ProxyItem) {
    proxyItem.proxyListAddDate = !!proxyItem.proxyListId && !!proxyItem.proxyListAddDate ? proxyItem.proxyListAddDate : new Date(Date.now()).toUTCString();
    return await TypeOrmManager.EntityManager.save(proxyItem);
  }

  public deleteProxy (proxyIpAddress: string) {
    return this.execNone('DELETE FROM proxy_list WHERE proxy_list_ip_address = $1', [proxyIpAddress])
  }

  public deleteInvalidProxy () {
    return this.execNone('DELETE FROM proxy_list WHERE proxy_list_response_time IS NULL')
  }

  public deleteDuplacate () {
    const sql = "delete from brc_ekoset.proxy_list l  where l.proxy_list_id not in (select min(sl.proxy_list_id) from brc_ekoset.proxy_list sl group by sl.proxy_list_ip_address,sl.proxy_list_port )";
    return this.execNone(sql);
  }

  public deleteAll () {
    return this.execNone('DELETE FROM proxy_list')
  }

  private convertProxyToDbProxyItem (proxy: any) {
    const item: ProxyItem = new ProxyItem();
    item.proxyListAnonymitylevel = proxy.anonymityLevel;
    item.proxyListCountry = proxy.country;
    item.proxyListIpAddress = proxy.ipAddress;
    item.proxyListPort = proxy.port;
    item.proxyListSource = proxy.source;
    item.proxyProtocol = !!proxy.protocols && proxy.protocols.length > 0 ? proxy.protocols[0] : 'http';
    return item;
  }

}

const defaultProxyListsOptions = {
  /*
      The filter mode determines how some options will be used to exclude proxies.

      For example if using this option `anonymityLevels: ['elite']`:
          'strict' mode will only allow proxies that have the 'anonymityLevel' property equal to 'elite'; ie. proxies that are missing the 'anonymityLevel' property will be excluded.
          'loose' mode will allow proxies that have the 'anonymityLevel' property of 'elite' as well as those that are missing the 'anonymityLevel' property.
  */
  filterMode: "loose",

  /*
      Options to pass to puppeteer when creating a new browser instance.
  */
  browser: {
    headless: true,
    slowMo: 0,
    timeout: 10000,
  },

  /*
      Get proxies for the specified countries.

      To get all proxies, regardless of country, set this option to NULL.

      See:
      https://en.wikipedia.org/wiki/ISO_3166-1

      Only USA and Canada:
      ['us', 'ca']
  */
  countries: null,

  /*
      Exclude proxies from the specified countries.

      To exclude Germany and Great Britain:
      ['de', 'gb']
  */
  countriesBlackList: null,

  /*
      Get proxies that use the specified protocols.

      To get all proxies, regardless of protocol, set this option to NULL.
  */
  protocols: ['http', 'https'],
  // protocols: ['http', 'https'],
  // protocols: null,
  /*
      Anonymity level.

      To get all proxies, regardless of anonymity level, set this option to NULL.
  */
  anonymityLevels: ['anonymous', 'elite'],
  // anonymityLevels: null,
  /*
      Include proxy sources by name.

      Only 'freeproxylists':
      ['freeproxylists']
  */
  // sourcesWhiteList: null,

  /*
      Exclude proxy sources by name.

      All proxy sources except 'freeproxylists':
      ['freeproxylists']
  */
  sourcesBlackList: null,

  /*
      Set to TRUE to have all asynchronous operations run in series.
  */
  series: false,

  /*
      Load GeoIp data for these types of IP addresses. Default is only ipv4.

      To include both ipv4 and ipv6:
      ['ipv4', 'ipv6']
  */
  ipTypes: ['ipv4', 'ipv6'],

  /*
      Default request module options. For example you could pass the 'proxy' option in this way.

      See for more info:
      https://github.com/request/request#requestdefaultsoptions
  */
  // defaultRequestOptions: null,

  /*
      Directory from which sources will be loaded.
  */
  // sourcesDir: null,
};
