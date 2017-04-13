---
title: Dynamic Programming
layout: post
tag: codes
---

### About

规划（Programming）：指完成一组选择。

动态（Dynamic）：其所做的每一个选择都必须依赖于前一个选择。

动态规划（DP）算法：核心其实就是一种高速缓存。在问题的分解上依然使用递归/归纳的那一套方法，但允许子问题之间存在重叠，重复的子问题避免二次计算。

DP 算法通过反转相应的递归函数，使其对某些数据结构进行逐步迭代和填充（某种多维数组）。


### Fibonacci

Fib(0) = 1

Fib(1) = 1

Fib(n) = Fib(n-1) + Fib(n-2)

斐波那契数列这个问题十分经典，在计算方式上，使用递归看起来很方便的就实现。

例如：

{% highlight python %}

# -*- coding: utf-8 -*-


def fib(i):
    if i < 2: return i
    return fib(i-1) + fib(i-2)

{% endhighlight %}


但是在这个计算过程中，里面进行了多次的重复计算，例如在计算 fib(10) 的时候：

![image](/images/dp_1.png)

如果使用一个缓存记录所需要的数据，那么计算过程也就会快很多，对于 fib(100) 也能够得出相应的结果。

例如：

{% highlight python %}

# -*- coding: utf-8 -*-

from functools import wraps


def memo(func):
    cache = {}

    @wraps(func)
    def wrap(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrap

{% endhighlight %}

这样就能把已经计算过的 fib(i) 记录在 cache 中，需要使用的时候直接从 cache 中获取。

这种解决方案为记忆体化方式来解决问题。

### 0-1 Backpack

知道前面 DP 算法的通常解法后，那么就可以尝试着解决 0-1 背包问题。

问题：设前 k 个对象的最大价值为：m(k, r)，其中 r 为剩余背包容量。

解决问题模型：

	1. m(k, r) = 0  if k=0 or r=0
	2. 判断当前是否容纳最后一个对象 i。
		- 若不容纳，则 m(k, r) = m(k-1, r)
		- 若容纳，则 m(k, r) = v[i] + m(k-1, r-w[i])
	3. 由于自行根据容量选择是否要将对象纳入背包，所以两种情况都进行尝试，选用结果值最大的一个。
	4. 综合： 
		.........	0     if k=0 or r=0
		m(k, r) =   m(k-1, r)  if  w[i]>r
		.........	max(m(k-1, r), v[i] + m(k-1, r-w[i])  if w[i]<=r

在整个解决问题的过程中，会重复的用到 m(k, r) 中的一个计算结果。在一定程度上可以利用一个记忆体/迭代计算的方法来解决这个问题。

记忆体方法： 利用 cache 保存 m(k, r) 已经计算过的值。需要用到时直接取出。

迭代方法：构造一个二维数组 m，从 m(0, 0) 开始计算，不断迭代计算出 m(0, 1) ... m(k, r)

下面这是一个迭代的方式： 

{% highlight python %}

# -*- coding: utf-8 -*-

def knapsack(w, v, c):
    n = len(w)
    m = [[0]*(c+1) for i in range(n+1)]
    p = [[False]*(c+1) for i in range(n+1)]
    for k in range(1, n+1):
        i = k-1
        for r in range(1, c+1):
            m[k][r] = drop = m[k-1][r]
            if w[i] > r:
                continue
            keep = v[i] + m[k-1][r-w[i]]
            m[k][r] = max(drop, keep)
            p[k][r] = keep > drop
    return m, p

{% endhighlight %}


这样就将一个类似于递归求解的问题，简化成了一个迭代求值问题。

假设：

	w = [2, 2, 6, 5, 5]
	v = [6, 3, 5, 4, 6]
	c = 10

那么就会产生一个存储价值的矩阵：

![image](/images/dp_2.png)

当前要计算 m(1, 1) 的值，根据算法的定义:
	
	w[1-1]=2， r=1
	则 w[i]>r， m(1, 1)=m(0, 1)=0

计算 m(1, 2) 的值：
	
	w[1-1]=2，r=2
	则 w[i]=r，m(1, 2)=max(m(k-1, r), v[i] + m(k-1, r-w[i])
	..................=max(m(1-1, 2), v[1-1] + m(1-1, 2-2))
	..................=max(0, 6 + 0)
	..................=6
	则 m(1, 2) = 6

....

剩余的值计算结果类似。

最后得出的结果：

	0	0	0	0	0	0	0	0	0	0	0
	0	0	6	6	6	6	6	6	6	6	6
	0	0	6	6	9	9	9	9	9	9	9
	0	0	6	6	9	9	9	9	11	11	14
	0	0	6	6	9	9	9	10	11	13	14
	0	0	6	6	9	9	9	12	12	15	15

也就是说当前背包能够取得的最大价值为：15

再通过回溯找到选择的对象既可，或者利用 knapsack() 函数的返回值 p。

{% highlight python %}

    m, p = knapsack(w, v, c)
    k, r, items = len(w), c, set()

    while k > 0 and r > 0:
        i = k-1
        if p[k][r]:
            items.add(i)
            r -= w[i]

        k -= 1
    print items

{% endhighlight %}

或者可以这样回溯：

{% highlight python %}

   k, r, items = len(w), c, set()
    while k > 0 and r > 0:
        if m[k][r] > m[k-1][r]:
            items.add(k-1)
            r = r - w[k-1]
        k = k - 1

    print items

{% endhighlight %}


### Reference

-《Python 算法》

### Summary

上周末 JD 的在线笔试被虐了一道 DP 算法的问题，当时还一脸懵逼的不知道什么是 DP 算法...

结果周一的第一节课就是 算法分析与设计/刚好讲的就是 动态规划 问题....

多看书，多学习新知识... :)