
import { Response } from 'express';
import { JsonController, Get, Res, Put, QueryParam, Body } from 'routing-controllers';
import { BaseController } from 'rsn-express-core';
import ProxyListService from '@/services/ProxyListService';
import { ServiceRegistry } from 'rsn-express-core';
import { ProxyPlatform } from '@/services/ProxyPlatform';
import { RequestOptions } from '@/Options';


@JsonController('/platform')
export class ProxyController extends BaseController {
  @Get('/proxy/list')
  public async getProxies (
    @QueryParam('update') onlyvalid: true,
    @Res() response: Response) {
    const result = onlyvalid ? await ServiceRegistry.getService(ProxyListService).geValidProxies() : await ServiceRegistry.getService(ProxyListService).getProxies();
    return BaseController.createSuccessResponse(result, response);
  }


  @Get('/proxy/process')
  public async updateProxyListAndValidate (
    @Res() response: Response,
    @QueryParam('update') update: boolean,
    @QueryParam('validate') validate: boolean,
  ) {
    if (update && !validate) {
      ServiceRegistry.getService(ProxyPlatform).updateProxyList();
    }
    if (validate && !update) {
      ServiceRegistry.getService(ProxyPlatform).validateAll();
    }
    if (validate && update) {
      ServiceRegistry.getService(ProxyPlatform).updateProxyListAndValidate();
    }

    return BaseController.createSuccessResponse({}, response);
  }

  // FIXME: Сделаь через пост, возможность указать все параметры (options) для реквест
  @Put('/proxy/request')
  public async doRequest (
    @Res() response: Response,
    @Body() options: RequestOptions) {
    const result = await ServiceRegistry.getService(ProxyPlatform).doRequest(options);
    return BaseController.createSuccessResponse(result, response);
  }

}