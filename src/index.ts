export {run} from '@oclif/command'

export interface RpcService {
  handleErr(err: Error): void | Promise<void> ;
}

