// 自定义业务错误 —— 在控制器中 throw，由 errorHandler 统一捕获
export default class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}
