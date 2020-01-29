
import { Response } from 'express';
import { JsonController, Get, Res, Post, Put } from 'routing-controllers';
import { BaseController } from 'rsn-express-core/controllers/BaseController';
import ProxyListService from '@/services/ProxyListService';
import ServiceRegistry from 'rsn-express-core/services/ServiceContainer';
import { ProxyPlatform } from '@/services/ProxyPlatform';


@JsonController('/platform')
export default class ProxyController extends BaseController {
  @Get('/proxy/list')
  public async getProxies (@Res() response: Response) {
    const result = await ServiceRegistry.getService(ProxyListService).getProxies();
    return BaseController.createSuccessResponse(result, response);
  }

  @Put('/proxy/list')
  public async updateProxyListAndValidate (@Res() response: Response) {
    ServiceRegistry.getService(ProxyPlatform).updateProxyListAndValidate();
    return BaseController.createSuccessResponse({}, response);
  }

}