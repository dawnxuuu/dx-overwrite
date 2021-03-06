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
    try {
      // executer会立即执行，传入resolve,reject两个函数参数
      executer(this.resolve, this.reject)
    } catch (error) {
      // 有错误直接执行reject
      this.reject(error)
    }
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
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => {throw reason};

    // 为了链式调用，创建一个新的MyPromise实例，并在最后 return 出去
    const anotherPromise = new MyPromise((resolve, reject) => {

      const fulfilledMicrotask = () => {
        // 创建一个微任务，等待 anotherPromise 完成初始化再执行then回调
        queueMicrotask(() => {
          try {
            // 成功回调函数执行得到的返回结果，若无return值则默认undefined
            const result = onFulfilled(this.value)
            // 统一处理then中的回调函数执行结果
            handleResult(anotherPromise, result, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      const rejectedMicrotask = () => {
        // 创建一个微任务，等待 anotherPromise 完成初始化再执行then回调
        queueMicrotask(() => {
          try {
            // 若是失败状态，调用失败回调，并传参失败原因
            const result = onRejected(this.reason)
            handleResult(anotherPromise, result, resolve, reject)
          } catch (error) {
            reject(error)
          }
        })
      }

      // 这里的内容会立即执行
      if (this.status === FULFILLED) {
        fulfilledMicrotask()
      } else if (this.status === REJECTED) {
        rejectedMicrotask()
      } else if (this.status === PENDING) {
          // 如果是pending状态，先把所有回调函数存储，
          // 等到resolve或reject函数执行时再调用
          // 这里会向回调数组中推入一个函数，等待执行器中异步任务完成后resolve函数被调用时，就会拿出此函数进行调用，
          this.onFulfilledCallbacks.push(fulfilledMicrotask)
          this.onRejectedCallbacks.push(rejectedMicrotask)
      }
    })

    return anotherPromise
  }

  // resolve 静态方法
  static resolve (parameter) {
    // 如果传入的是MyPromise直接返回
    if (parameter instanceof MyPromise) {
      return parameter
    }

    // 转成常规方式
    return new MyPromise(resolve => {
      resolve(parameter)
    })
  }

  // reject 静态方法
  static reject (reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }
}

// anotherPromise是为了then可链式调用而生成的一个新实例
// result是then中两个回调函参执行返回的结果，默认为undefined
// resolve是新实例的执行器函数中resolve形参
// reject是新实例的执行器函数中reject形参
function handleResult (anotherPromise, result, resolve, reject) {
  // 如果相等，说明then回调return的是自己，抛出类型错误并返回
  if (anotherPromise === result) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  if (typeof result === 'object' || typeof result === 'function') {
    if (result === null) {
      return resolve(result)
    }

    let then
    try {
      then = result.then
    } catch (error) {
      return reject(error)
    }

    if (typeof then === 'function') {
      let called = false
      try {
        then.call(
          result,
          y => {
            if (called) return
            called = true
            handleResult(anotherPromise, y, resolve, reject)
          },
          r => {
            if (called) return
            called = true
            reject(r)
          }
          )
      } catch (error) {
        if (called) return
        reject(error)
      }
    } else {
      resolve(result)
    }
  } else {
    // 调用resolve并传入返回结果，这样下个链式调用的then就能得到此结果
    resolve(result)
  }
}

// 单元测试配置代码
MyPromise.deferred = function () {
  var result = {}
  result.promise = new MyPromise(function (resolve, reject) {
    result.resolve = resolve
    result.reject = reject
  })

  return result
}

module.exports = MyPromise
