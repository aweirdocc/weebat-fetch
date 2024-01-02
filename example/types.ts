import { AxiosResponse, Method } from 'axios';
import type { RequestConfig } from '../dist/index';

/**
 * 响应结构
 */
export interface AppResponseData<T> {
  errorInfo: ErrorInfo;
  result: T;
}

/**
 * D: 请求参数
 * R: 响应参数
 */
export interface AppRequestConfig<D = any, R = any> extends RequestConfig<AppResponseData<R>> {
  method?: Method;
  loading?: boolean;
  data?: D;
}

export interface ErrorInfo {
  errorCode?: string | number;
  errorMsg?: string;
}


export interface AppResponse<T = any> extends AxiosResponse<AppResponseData<T>, any> {
  [key: string]: any;
}

