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
    try {
      executer(this.resolve, this.reject)
    } catch (error) {
      this.reject(error)
    }
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
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    const promise2 = new MyPromise((resolve, reject) => {
      // 此处的内容会立即执行

      if (this.status === FULFILLED) {
        // 创建一个微任务等待 promise2 完成初始化
        queueMicrotask(() => {
          try {
            // 获取成功回调函数返回的值
            const returned = onFulfilled(this.value)
            // 传入resolvePromise统一处理
            resolvePromise(promise2, returned, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      } else if (this.status === REJECTED) {
        // 调用失败回调，并传入失败的原因
        queueMicrotask(() => {
          try {
            const returned = onRejected(this.reason)
            resolvePromise(promise2, returned, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      } else if (this.status === PENDING) { // 解决异步问题
        // 调用then时如果此时状态还是pending，说明异步任务还没拿到结果，
        // 暂时先把成功和失败的回调函数存起来，
        // 等到resolve或reject调用时再执行then中的回调。
        this.onFulfilledCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              const returned = onFulfilled(this.value)
              resolvePromise(promise2, returned, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        })

        this.onRejectedCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              const returned = onRejected(this.reason)
              resolvePromise(promise2, returned, resolve, reject)
            } catch (error) {
              reject(error)
            }
          })
        })
      }
    })

    return promise2
  }

  // resolve静态方法
  static resolve (parameter) {
    // 如果传入 MyPromise 实例则直接返回
    if (parameter instanceof MyPromise) {
      return parameter
    }

    return new MyPromise(resolve => {
      resolve(parameter)
    })
  }

  // reject静态方法
  static reject (reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
}

// 处理then中注册的回调函数返回值
function resolvePromise(promiseInstance, returned, resolve, reject) {
  // 如果相等说明return的是自己，抛出类型错误并返回
  if (promiseInstance === returned) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  // 判断returned是不是 MyPromise 实例对象
  if (returned instanceof MyPromise) {
    // 执行returned，调用then方法，目的是将其状态变为fulfilled或rejected
    returned.then(resolve, reject)
  } else {
    resolve(returned)
  }
}