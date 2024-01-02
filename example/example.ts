import { Request, ContentType } from '../dist/index';
import { AppResponse, AppRequestConfig, AppResponseData } from './types'

// 请求成功时的拦截器
const requestInterceptors = (config: AppRequestConfig<any>)  => {
  config.headers = config.headers ?? {};

  // 可以添加权限验证的请求头
  config.headers['Authorization'] = 'token';

  if (!config.loading) {
    return config;
  }

  // 打开请求加载服务
  return config;
};

// 请求失败时的拦截器
const requestInterceptorsCatch = (error: any) => {
  return Promise.reject(error);
};

// 响应成功时的拦截器
const responseInterceptors = (response: any) => {
  const { data } = response as AppResponse;
  
  if (data.errorInfo && data.errorInfo.errorCode) {
    // handle error
  }

  return response;
};

// 响应失败时的拦截器
const responseInterceptorsCatch = (error: any) => {
  const { response } = error;

  if (response) {
    console.log('error' + response);
  }

  // 取消请求

  return Promise.reject(error);
};

const service = new Request({
  timeout: 1000 * 10,
  retry: 2,
  retryDelay: 1000,
  withCredentials: true,
  headers: {
    'Content-Type': ContentType.JSON,
  }, 
  interceptors: {
    requestInterceptors: (requestInterceptors as any), // 一直报错，先这样处理
    requestInterceptorsCatch,
    responseInterceptors,
    responseInterceptorsCatch,
  },
});

export const request = <D, R>(config: AppRequestConfig<D, R>): Promise<AppResponseData<R>> => {
  const { method = 'GET' } = config;

  if (method === 'GET') {
    config.params = config.data;
  }

  return service.request<AppResponseData<R>>(config);
};