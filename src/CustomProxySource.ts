import { Base64, requestPromise } from 'rsn-express-core';

export const getSpysMeProxies = async () => {
  const proxies = [];

  try {
    const result = await requestPromise('http://spys.me/proxy.txt', {});

    const regex = /[0-9]+(?:\.[0-9]+){3}:[0-9]+/gm;
    let m: RegExpExecArray;
    const bodyRes = await result.text();
    while ((m = regex.exec(bodyRes)) !== null) {
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      m.map(ip => {
        const spl = ip.split(":");
        const ipAddress = spl[0];
        const port = +spl[1];
        proxies.push({ ipAddress, port, protocols: ['http'], source: 'spys.me' });
      });
    }
  } catch (err) {
    return [];
  }
  return proxies;
}

export const getFreeProxyCzProxies = async () => {
  const proxies = [];
  try {
    const result = await requestPromise('http://free-proxy.cz/ru', {});

    const regExp = /<tr>.*?<\/tr>/gm;
    const regExpM = /Base64.decode\("([a-zA-Z\d=]*).*?fport.*?>([\d]*).*?https/gmi;
    const bodyText = await result.text();
    const matches = bodyText.match(regExp);
    if (matches) {
      for (var i = 0; i < matches.length; i++) {
        const m = regExpM.exec(matches[i]);
        if (!!m && m.length > 1) {
          // var ipAddress = atob(m[1]);
          const ipAddress = (await Base64.decode(m[1])).toString();
          const port = m[2];
          proxies.push({ ipAddress, port, source: 'http://free-proxy.cz/ru', protocols: ['https'] })
        }
      }
    }
    return proxies;
  } catch (err) {
    return [];
  }

}
