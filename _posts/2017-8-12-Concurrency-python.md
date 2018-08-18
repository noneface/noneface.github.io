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


class PoolThreadObject(threading.Thread):
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


### udpate 2018/08/18 multiprocessing.dummy.Pool as ThreadPool

线程池或者进程池这种模型，官方已经有轮子了，不要再重复造轮子了！！！！

这里注意两个Pool方法： close 和 join

close: 执行此方法，表示不再向pool新增任何任务

join: 阻塞主进程程，等待所有运行的子线程运行结束


#### 举个栗子

{% highlight python %}
# -*- coding: utf-8 -*-

import sys
import time
from datetime import datetime
from multiprocessing.dummy import Pool as ThreadPool

def say_hello(name):
    time.sleep(1)
    # print('Hello %s, %s' % (name, datetime.now()))
    # python2 线程安全的输出
    sys.stdout.write('Hello %s, %s\n' % (name, datetime.now()))
    sys.stdout.flush()

def run_in_single(name_list):
    
    for name in name_list:
        say_hello(name)

def run_in_multi(name_list):
    
    pool = ThreadPool(4)
    pool.map(say_hello, name_list)
    pool.close()
    pool.join()

def main():
    
    name_list = ['Tom', 'Ellen', 'Jack', 'Jam']

    # 顺序执行
    print('start run in single')
    run_in_single(name_list)
    print('end run in single')
    print('================')
    print('start run in multi')
    # 多线程
    run_in_multi(name_list)
    print('end run in multi')

if __name__ =='__main__':
    main()


{% endhighlight %}

ps: 多说一句， python2 下的print是非线程安全的，所以在多线程运行下，print输出可能会出现各种怪异的情况， python3 不存在

使用标准库里面的pool的话，会有一个矛盾的问题吧

不管是自己写的，还是网上的各种例子，所有的任务都是一个有限集合 list

并且在运行pool后，需要执行 pool.close和pool.join来阻塞主线程的运行（如果主线程后续还有任务需要等线程池运行完毕的话）

但是在真实的运行环境下，这种线程池应该是不断的运行，等待任务的到来。

所以，更符合真实环境情况下，应该是一种 生产者/消费者模型。

生产者和消费者共享一个线程安全的 Queue, 进行任务的共享传递


{% highlight python %}
# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-

import sys
import time
import threading
from Queue import Queue
from datetime import datetime
from multiprocessing.dummy import Pool as ThreadPool


class Producer(threading.Thread): 
    def __init__(self, queue, consumer_pool_size): 
        threading.Thread.__init__(self)
        self._queue = queue
        self._consumer_pool_size = consumer_pool_size 

    def fake_make_task(self, task_input):
        self._queue.put(task_input)

    def run(self):
        while True: 
            content = raw_input('')
            sys.stdout.write('input: %s\n' % content)
            sys.stdout.flush()
            # 输入：Jack,Tom,Ellen,Test,Allen
            if isinstance(content, str) and content == 'quit':
                self.fake_make_task(content)
                break
            content_list = content.split(',')
            for c in content_list:
                sys.stdout.write('Producer 添加任务: %s, %s\n' % (c, datetime.now()))
                sys.stdout.flush()
                self.fake_make_task(c)
        sys.stdout.write('Producer Bye byes!\n')
        sys.stdout.flush()


def say_hello(name):
    time.sleep(0.3)
    # print('Hello %s, %s' % (name, datetime.now()))
    # python2 线程安全的输出
    sys.stdout.write('consumer say: Hello %s, %s\n' % (name, datetime.now()))
    sys.stdout.flush()


def run_in_multi(name_list, consumer_pool_size):
   
    pool = ThreadPool(consumer_pool_size)
    while True:
        name = name_list.get()
        if isinstance(name, str) and name == 'quit': 
            pool.apply_async(say_hello, args=(name,))
            break
        pool.apply_async(say_hello, args=(name,))
    pool.close()
    pool.join()
    sys.stdout.write('ThreadPool Bye byes!\n')
    sys.stdout.flush()


def run_producer(queue_list, consumer_pool_size):
    producer = Producer(queue_list, consumer_pool_size)
    producer.run()


def main():
    print('start run in multi')
    name_list = Queue()

    consumer_pool_size = 4
    producer = Producer(name_list, consumer_pool_size)
    producer.start()
    
    # 多线程
    pool = run_in_multi(name_list, consumer_pool_size)

    print('\nend run in multi\n')


if __name__ =='__main__':
    main()


{% endhighlight %}

简单解释一下，新启动一个线程 Producer，由窗口输入作为添加的任务。 ThreadPool 作为 Consumer 消费任务

在主线程中，通过共享一个 Queue 进行消息的传递

可以理解为：单独运行的 Producer 线程，向 Queue 里面追加新的任务

主线程作为一个线程池管理的模型 run_in_multi，去读 Queue 中新增任务，向 pool 线程池中不断的 apply_async 任务进去

因为当发起结束信号 quit 时，producer结束线程， PoolThread 同样结束 while 循环。

pool.close 和 pool.join 存在的意义：
	
	由于需要使用 pool.join，前提必要的条件是调用 pool.close (不再有任务产生)
	使用 pool.join 是为了，阻塞主线程之后的执行操作，防止当线程池子线程任务还未运行完毕时，主线程已经结束， 主线程结束，进程也结束，子线程无法继续进行。

是否要执行 producer.join 呢？ 

执行 join 阻塞主线程操作，主要还是根据情况来区分的。

当前例子这种模型下，producer 当 run 方法中结束 while 循环时，所有的操作已经结束，所以也没用必要让 producer 执行 join

（如果需要 producer join， 则需要对执行的步骤进行判断，例如：不能在 run_in_multi 之前运行 join，否则主线程会被 producer 一直阻塞直至 producer 接收到 'quit'）

但是 pool 就不一样了，由于在 say_hello 中有延时 0.3s 操作模拟执行过程

所以当 producer 发出一个 quit 操作，pool 会根据逻辑，直接结束 while 循环，并 apply_async 最后一次任务

当线程池中的线程接收到 ‘quit’ 任务，首先会是在等待 0.3s (线程池中，还有其他正在处理的任务)

如果 run_in_multi 中未添加 pool.join 操作，那么主线程不会等待线程池（新的 ‘quit’ 任务，以及其他正在处理的任务）执行完成，而是直接运行后续代码，直接结束进程。

如果有兴趣可以运行代码，对代码进行修改测试。

![show](/images/thread-3.jpg)
