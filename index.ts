import axios, { AxiosInstance, CreateAxiosDefaults, InternalAxiosRequestConfig, AxiosRequestConfig, AxiosResponse } from "axios";

// 定义请求类型
export const enum ContentType {
  // json
  JSON = 'application/json;charset=UTF-8',
  // text
  TEXT = 'text/plain;charset=UTF-8',
  // form-data
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  // form-data 上传
  FORM_DATA = 'multipart/form-data;charset=UTF-8',
}

// 定义拦截器
export interface HttpInterceptors<T> {
  // 请求拦截器
  requestInterceptors?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  requestInterceptorsCatch?: (error: any) => any;
  // 响应拦截器
  responseInterceptors?: (response: T) => T;
  responseInterceptorsCatch?: (error: any) => any;
}

// 传入的参数
export interface CreateAxiosConfig<T = AxiosResponse> extends CreateAxiosDefaults {
  interceptors?: HttpInterceptors<T>;
  retry?: number;
  retryDelay?: number;
  __retryCount?: number;
}

export interface RequestConfig<T> extends AxiosRequestConfig {
  interceptors?: HttpInterceptors<T>;
}

/**
 * 请求类
 */
export class Request {
  // axios 实例
  instance: AxiosInstance;
  // 拦截器
  interceptors?: HttpInterceptors<AxiosResponse>;

  abortControllerMap: Map<string, AbortController>;

  constructor(config: CreateAxiosConfig) {
    this.instance = axios.create(config);
    this.interceptors = config.interceptors;
    // 初始化请求取消控制器
    this.abortControllerMap = new Map();

    // 全局请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const controller = new AbortController();
        const url = config.url || '';
        config.signal = controller.signal;
        this.abortControllerMap.set(url, controller);

        return config;
      },
      (err: any) => {
        return err;
      }
    );

    this.instance.interceptors.request.use(
      this.interceptors?.requestInterceptors,
      this.interceptors?.requestInterceptorsCatch
    );

    this.instance.interceptors.response.use(
      this.interceptors?.responseInterceptors,
      this.interceptors?.responseInterceptorsCatch
    );

    // 全局响应拦截器
    this.instance.interceptors.response.use(
      (res: AxiosResponse) => {
        return new Promise((resolve, reject) => {
          const url = res.config.url || '';
          // 移除当前响应的控制器
          this.abortControllerMap.delete(url);

          if (res.status === 200) {
            resolve(res.data);
          } else {
            reject(res.data);
          }
        })
      },
      async (err: any) => {
        const { code = '', config } = err;

        // 没有重连配置的话,直接抛出错误
        if (!config || !config.retry || ['417'].includes(code)) {
          return Promise.reject(err);
        }

        config.__retryCount = config.__retryCount ?? 0;
        if (config.__retryCount >= config.retry) {
          return Promise.reject(err);
        }

        config.__retryCount += 1;
        // 重试延时
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve('retried');
          }, config.retryDelay ?? 50);
        })
        // 发起重连
        return await this.request(config);
      }
    );
  }

  /**
   * 发起请求
   * @param config 请求配置
   * @returns 
   */
  request<T>(config: RequestConfig<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (config?.interceptors?.requestInterceptors) {
        config = config.interceptors.requestInterceptors(config as any);
      }

      this.instance.request<any, T>(config).then((res) => {
        if (config?.interceptors?.responseInterceptors) {
          res = config.interceptors.responseInterceptors(res);
        }

        resolve(res);
      })
        .catch((err: any) => {
          reject(err);
        });
    })
  }

  /**
  * 取消全部请求
  */
  cancelAllRequest() {
    for (const [, controller] of this.abortControllerMap) {
      controller.abort();
    }
    this.abortControllerMap.clear();
  }

  /**
  * 取消指定的请求
  * @param url 待取消的请求URL
  */
  cancelRequest(url: string | string[]) {
    const urlList = Array.isArray(url) ? url : [url];
    
    for (const _url of urlList) {
      this.abortControllerMap.get(_url)?.abort();
      this.abortControllerMap.delete(_url);
    }
  }
}