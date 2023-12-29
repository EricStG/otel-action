import { Logger } from './logger'

export class LocalLogger implements Logger {
  debug = (message: string): void => console.debug(message)
  error = (message: string | Error): void => console.error(message)
  warning = (message: string | Error): void => console.warn(message)
  notice = (message: string | Error): void => console.info(message)
  info = (message: string): void => console.info(message)
}
