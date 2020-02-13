export class ProxyValidateOptions {
  validateUrl = 'https://yandex.ru';
  parallelRequestsCount = 25;
  deleteInvalid = false;
  requestOptions?: RequestInit;
}

export class RequestOptions {
  url: string;
  maxParallelProxiesCount: 25;
  requestOptions?: RequestInit;
}