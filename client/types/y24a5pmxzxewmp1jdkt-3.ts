
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

export const isValidHttpUrl = (urlString: string) => {
  let url: URL

  try {
    // eslint-disable-next-line node/no-unsupported-features/node-builtins
    url = new URL(urlString)
  } catch (_) {
    return false
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
}
