---
layout: post
title: Concurrency in Python
tag: codes
---

### About

最近一直在思考关于并发编程的一些东西。

自己经常写一些脚本，或多或少会使用一些线程来解决一些问题。

不过 Python 的线程由于 GIL 的原因不是很推荐，但是在一些在网络 I/O 上的阻塞问题，还是可以考虑用线程。

### 线程

线程（英语：thread）是操作系统能够进行运算调度的最小单位。它被包含在进程之中，是进程中的实际运作单位。一条线程指的是进程中一个单一顺序的控制流，一个进程中可以并发多个线程，每条线程并行执行不同的任务。在Unix System V及SunOS中也被称为轻量进程（lightweight processes），但轻量进程更多指内核线程（kernel thread），而把用户线程（user thread）称为线程。

来自 wiki 。

在之前的一些思考之中，经常会遇到两个线程并发的模型：多线程和线程池。

在我的理解下：

	多线程：为每一个任务单独申请/新建一个线程
	线程池：程序运行固定数量的线程池，当有任务时，通过获取线程池中的空闲线程来处理当前任务

在多线程里面，会涉及到每个线程新建/销毁的损耗时间，而且当大量的任务到来时，会新建很多的线程，资源抢占会成为问题。

所以使用线程池，目前会是一个更好的解决方案。

在我之前的学习 Python 多线程编程的时候，看过许多的学习资料，其中大多数都把多线程和线程池混为一谈了。

比如某某教程，说是实现 Python 多线程，实时上则是使用了一个 list / pool 通过 map ，然后共享同一个线程安全的 Queue 进行任务的分发。现在想想，这是有点混淆视听了。

也就是说，目前网上能够搜索到的 Python 多线程编程，大多数都是实现里一个非常简易的线程池。

由于 Python 中的内置对象 Queue 是线程安全的，所以并不需要一个线程池管理对象，来控制任务的分发，只需要为每一个线程共享同一个 Queue 队列，线程不断的从 Queue 中获取任务而已。

简单的模型是这样：

![show](/images/thread-1.png)

Queue 的提供，让开发过程中不用考虑重复读/脏数据的问题。

那么传统意义上的线程池模型是一个这样的流程。

看下图：

![show](/images/thread-2.png)

如何实现线程池向线程分发任务？

首先，所有的子线程必须要保持一个运行状态，也就是在 run 方法中，得不断的循环，这样线程才不会结束。

之后，为了让线程能够获取到线程池分发的任务，所以考虑提供一个 set_task 接口，让线程池管理对象能够为线程设置任务。

最后就是最重要的，如何告诉子线程当前有任务了？

使用一个 Lock，在子线程初始化的时候，就对这个 Lock 进行 acquire，在不断循环的 run 方法中一开始也进行对这个 Lock 的Acquire，这样，run 方法会因为 Lock 在初始状态就被锁住了，进入阻塞状态，并且当前线程是没有任务可以执行的，属于合理情况。

当线程池管理对象为子线程设置任务的时候，这里存在两种情况：
	
	在当前子线程还没有运行过任务：
	
		此时 Lock 的状态为： __init__ 初始化中，被 acquire，后续的 acquire 都会被阻塞，所以在 run 方法中一直被阻塞。
		
		设置好任务后，对 Lock 进行释放，此时的 run 方法也就能够获得锁，后续的代码也就能够执行。但是在 run 方法中不对 Lock 进行 release
		
	当有任务再次被设置时，这就是接下来的第二种情况：

		由于在上一次循环的 run 方法中，只进行了 Lock 的acquire，并没有进行 release 操作，所以 run 还是被阻塞了，当通过 set_task 为子线程设置任务时，又进行了一次 release，所以 run 方法又能够正常运行。

	之后的所有状态，都是第二种情况下的状态变化。


通过简化代码表示：

{% highlight python %}
# -*- coding: utf-8 -*-

import threading


class sub_thread(threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
		self.lock = threading.Lock
		self.lock.acquire()

	def set_task(self, task):
		self.task = task
		self.lock.release()

	def run(self):
		while 1:
			self.lock.acquire()
			....

{% endhighlight %}


Python 提供的 Queue 简化了许多事情，但是当我们需要获取当前子线程运行状态的时候，我们缺少一个可以控制的线程池管理对象，对线程的新增/删除，对任务的控制进行操作会带来许多不便。

