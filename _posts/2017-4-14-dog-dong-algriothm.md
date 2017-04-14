---
title: JD 在线笔试算法题
layout: post
tag: codes
---

### About

上周这个时候，赶着回家晚上参加 狗东 的在线笔试题。

结果在线笔试的算法题做的是一脸懵逼。

总结起来就是自己准备春招实习到现在，根本没有做什么算法题目。

顺便吐槽一下学校，都到大三下学期了还安排这么多课，完全不合理....

### Problem 1

##### 题目描述

公司最近新研发了一种产品，共生产了n件。有m个客户想购买此产品，第i个客户出价Vi元。为了确保公平，公司决定要以一个固定的价格出售产品。每一个出价不低于要价的客户将会得到产品，余下的将会被拒绝购买。请你找出能让公司利润最大化的售价。

##### 要求

###### 输入

输入第一行二个整数n(1<=n<=1000),m(1<=m<=1000)，分别表示产品数和客户数。
接下来第二行m个整数Vi(1<=Vi<=1000000)，分别表示第i个客户的出价。

###### 输出

输出一行一个整数，代表能够让公司利润最大化的售价。

###### 样例输入

5 4
2 8 10 7

###### 样例输出

7

##### 当时思路

根据题目可以知道，商品的定价是在所有客户出价的 [min(V), max(V)]。

有了价格的范围之后就是根据价格进行枚举，选择价值最大的售价输出。

所以当时我是这样做的


{% highlight python%}

string_mn = raw_input()
n = int(string_mn.split(" ")[0])
m = int(string_mn.split(" ")[1])

v_string = raw_input()
Vi = [int(x) for x in v_string.split(" ")]

min_value = min(Vi)
max_value = max(Vi)
value_list = range(min_value, max_value+1)
sale_price = 0
sale_all = 0

for v in value_list:
    product_num = n
    current_total = 0
    for value in Vi:
        if value >= v:
            current_total += v
            product_num -= 1
        if product_num < 0:
            break
    if sale_all < current_total:
        sale_price = v
        sale_all = current_total

print sale_price


{% endhighlight %}


##### 分析

这样做的后果就是时间复杂度为 O(n^2)，不满足时间要求 :(

##### 正确的解法

结束后参考给出的解析，前半部分解法只考虑到了部分，而且在计算满足价格要求的公司上存在问题，一个 O(n) 的问题被我复杂成了 O(n^2)。

在解决有那几个客户可以购买此产品时，可以直接先将 Vi 进行排序。

那么 Vi 就是一个 <b>从大到小</b> 的数组。

因为最后产品定的价格必定是 V 中的某一个值，不需要考虑 [min(V), max(V)]。
 
假设 当前输入 n=5 m=4  输入价格：10 5 1 8

那么你的定价 7 和定价 8 只有 1和4 这两个客户满足要求，而且定价为 8 的利润更高。

所以只需要考虑 所有客户的 出价，从里面挑选。

所以如果当前价格为 Vi，那么从 1~i 之间的客户一定能购买。

但是要考虑客户只有 n 件商品，所以最后的价格 f(i) = Vi * min(i,n)

##### 正确代码

{% highlight python%}

string_mn = raw_input()
n = int(string_mn.split(" ")[0])
m = int(string_mn.split(" ")[1])

v_string = raw_input()
Vi = sorted([int(x) for x in v_string.split(" ")])

sale_price = 0
sale_all = 0

for v in Vi:
    i = Vi.index(v)
    sale_temp = v * min(m-i, n)
    if sale_temp >= sale_all:
        sale_all = sale_temp
        sale_price = v

print sale_price

{% endhighlight %}


### Problem

待更新...


### Summary

哎~ 好气呀。看着某个群里的人陆续接到 offer 通知。

看看自己弱弱的样子...