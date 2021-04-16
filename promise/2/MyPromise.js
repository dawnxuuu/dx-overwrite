// 定义三个状态常量
const PENDING = 'pending',
      FULFILLED = 'fulfilled',
      REJECTED = 'rejected';

class MyPromise {
  // 存储状态，初始为pending
  status = PENDING
  // 成功后的值
  value = null
  // 失败后的值
  reason = null

  constructor (executer) {
    // executer会立即执行，传入resolve,reject两个函数参数
    executer(this.resolve, this.reject)
  }

  // 使用箭头函数保证this指向当前实例对象
  // 执行器中传入的resolve函数，用来将状态变为fulfilled
  resolve = (value) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态改为成功
      this.status = FULFILLED
      // 保存成功后的值
      this.value = value
    }
  }

  // 执行器中传入的reject函数，用来将状态变为rejected
  reject = (reason) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态改为失败
      this.status = REJECTED
      // 保存失败后的值
      this.reason = reason
    }
  }

  then (onFulfilled, onRejected) {
    // 判断状态
    if (this.status === FULFILLED) {
      // 若是成功状态，调用成功回调，并传参返回值
      onFulfilled(this.value)
    } else if (this.status === REJECTED) {
      // 若是失败状态，调用失败回调，并传参失败原因
      onRejected(this.reason)
    }
  }
}