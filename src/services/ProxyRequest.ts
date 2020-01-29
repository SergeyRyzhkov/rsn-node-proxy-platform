import * as request from 'request-promise-native';
import * as ProxyAgent from 'proxy-agent';
import { ProxyItem } from '@/entities/ProxyItem';

export const proxyRequest = (reqOptions: {}, throwProxy?: ProxyItem) => {
  const baseOptions: any = {
    timeout: 3500,
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
      // 'Content-Type': isContentTypeHtml ? 'text/html; charset=UTF-8' : 'application/json; charset=UTF-8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:65.0) Gecko/20100101 Firefox/65.0' + Math.random().toString()
    },
    rejectUnauthorized: false,
    strictSSL: false,
    resolveWithFullResponse: true,
    maxRedirects: 9
  }

  const requestOptions = { ...baseOptions, ...reqOptions };

  if (!!throwProxy) {
    const proxyProtocols = throwProxy.proxyListProtocol.split(',');
    const proxyUri = `${proxyProtocols[0]}://${throwProxy.proxyListIpAddress}:${throwProxy.proxyListPort}`;
    requestOptions.agent = new ProxyAgent(proxyUri);
  }

  return request(requestOptions);

}