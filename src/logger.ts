export interface Logger {
  debug: (message: string) => void
  error: (message: string | Error) => void
  warning: (message: string | Error) => void
  notice: (message: string | Error) => void
  info: (message: string) => void
}
