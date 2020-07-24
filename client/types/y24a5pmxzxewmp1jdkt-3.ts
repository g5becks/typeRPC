
/**
 * Interface that all generated RpcServices inherit
 *
 * @interface RpcService
 */
export interface RpcService {
  /**
   * Used for error handling inside of generated
   * fastify handler functions
   *
   * @param {Error} err error that occurred when calling api
   * @returns {T} T
   * @memberof RpcService
   */
  handleErr<T>(err: Error): T;
}
