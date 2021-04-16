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
  // 存储成功回调函数
  onFulfilledCallbacks = []
  // 存储失败回调函数
  onRejectedCallbacks= []

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
      // 将所有成功回调拿出来执行
      while (this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.shift()(value)
      }
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
      // 将所有失败回调拿出来执行
      while (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()(reason)
      }
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
    } else if (this.status === PENDING) {
        // 如果是pending状态，先把所有回调函数存储，
        // 等到resolve或reject函数执行时再调用
        this.onFulfilledCallbacks.push(onFulfilled)
        this.onRejectedCallbacks.push(onRejected)
    }
  }
}