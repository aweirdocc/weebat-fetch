import { request } from './example';

interface ApiAReq {}
interface ApiARes {}

export default {
  apiA: async (data: ApiAReq): Promise<ApiARes> => {
    try {
      const { result } = await request<ApiAReq, ApiARes>({
        url: '/api/1',
        method: 'GET',
        data,
      });

      return result;
    } catch (error) {
      return error;
    }
  }
}
