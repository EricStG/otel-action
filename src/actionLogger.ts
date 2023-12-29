import * as core from '@actions/core'

import { Logger } from './logger'

export class ActionLogger implements Logger {
  debug = (message: string): void => core.debug(message)
  error = (message: string | Error): void => core.error(message)
  warning = (message: string | Error): void => core.warning(message)
  notice = (message: string | Error): void => core.notice(message)
  info = (message: string): void => core.info(message)
}
