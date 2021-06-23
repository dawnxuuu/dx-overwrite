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
    // 为了链式调用，创建一个新的MyPromise实例，并在最后 return 出去
    var otherPromise = new MyPromise((resolve, reject) => {
      // 这里的内容会立即执行
      if (this.status === FULFILLED) {
        // 成功回调函数执行得到的返回结果，若无return值则默认undefined
        const result = onFulfilled(this.value) || undefined
        // 统一方法处理。传入otherPromise实例以判断是否与result相等
        handleResult(otherPromise, result, resolve, reject)
      } else if (this.status === REJECTED) {
        // 若是失败状态，调用失败回调，并传参失败原因
        onRejected(this.reason)
      } else if (this.status === PENDING) {
          // 如果是pending状态，先把所有回调函数存储，
          // 等到resolve或reject函数执行时再调用
          // 这里会向回调数组中推入一个函数，等待执行器中异步任务完成后resolve函数被调用时，就会拿出此函数进行调用，
          this.onFulfilledCallbacks.push(() => {
            const result = onFulfilled(this.value) || undefined
            handleResult(result, resolve, reject)
          })

          this.onRejectedCallbacks.push(onRejected)
      }
    })

    return otherPromise
  }
}

function handleResult (otherPromise, result, resolve, reject) {
  // 如果相等，说明then回调return的是自己，抛出类型错误并返回
  if (otherPromise === result) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  // 判断返回结果是不是MyPromise实例
  if (result instanceof MyPromise) {
    // 调用MyPromise实例的then方法，
    result.then(resolve, reject)
  } else {
    // 调用resolve并传入返回结果，这样下个链式调用的then就能得到此结果
    resolve(result)
  }
}