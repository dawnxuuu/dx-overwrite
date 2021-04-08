const PENDING = 'pending',
      FULFILLED = 'fulfilled',
      REJECTED = 'rejected';


class MyPromise {
  // 存储状态的变量，初始值是pending
  status = PENDING
  // 成功后的值
  value = null
  // 失败的原因
  reason = null
  // 存储成功的回调
  onFulfilledCallbacks = []
  // 存储失败的回调
  onRejectedCallbacks = []

  constructor(executer) {
    // 立即执行executer，传入两个函数实参
    executer(this.resolve, this.reject)
  }

  // 箭头函数可以保证this指向当前实例对象
  // 更改成功后的状态
  resolve = (value) => {
    // 只有状态是等待，才执行状态修改
    if (this.status === PENDING) {
      // 状态改为成功
      this.status = FULFILLED
      // 保存成功后的值
      this.value = value
      // 多个then注册的成功回调依次调用
      while (this.onFulfilledCallbacks.length) {
        this.onFulfilledCallbacks.shift()(value)
      }
    }
  }

  // 更改失败后的状态
  reject = (reason) => {
    if (this.status === PENDING) {
      // 状态改为失败
      this.status = REJECTED
      // 保存失败后的值
      this.reason = reason
      // 多个then注册的失败回调依次调用
      while (this.onRejectedCallbacks.length) {
        this.onRejectedCallbacks.shift()(reason)
      }
    }
  }

  then(onFulfilled, onRejected) {
    // 状态判断
    if (this.status === FULFILLED) {
      // 调用成功回调，并传入成功后的值
      onFulfilled(this.value)
    } else if (this.status === REJECTED) {
      // 调用失败回调，并传入失败的原因
      onRejected(this.reason)
    } else if (this.status === PENDING) { // 解决异步问题
      // 调用then时如果此时状态还是pending，说明异步任务还没拿到结果，
      // 暂时先把成功和失败的回调函数存起来，
      // 等到resolve或reject调用时再执行then中的回调。
      this.onFulfilledCallbacks.push(onFulfilled)
      this.onRejectedCallbacks.push(onRejected)
    }
  }
}