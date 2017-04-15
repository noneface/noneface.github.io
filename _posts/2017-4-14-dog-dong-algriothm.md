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

### Question 1

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


### Question 2

##### 问题描述

小明同学要参加一场考试，考试一共有n道题目，小明必须做对至少60%的题目才能通过考试。考试结束后，小明估算出每题做对的概率，p1,p2,...,pn。你能帮他算出他通过考试的概率吗？

##### 要求

###### 输入

输入第一行一个数n（1<=n<=100），表示题目的个数。第二行n个整数，p1,p2,...,pn。表示小明有pi%的概率做对第i题。（0<=pi<=100）

###### 输出

小明通过考试的概率，最后结果四舍五入，保留小数点后五位。

###### 样例输入

4

50 50 50 50

###### 样例输出

0.31250


##### 当时的思路

根据题目给的 hint，最开始是想用排列组合来解决这个问题，但是用 python 还没有做过排列组合，所以也就放弃了。

最后只能交卷 GG...

##### 解析

这可以理解成是一道 动态规划 问题。

和 0-1 背包问题可以类比一下。

背包问题中的 背包剩余容量==当前可答对题数，每个物品==每道题目

最后的数学模型：

                1   if i=0 and j=0
    f(i, j) =   0   if i=0 and j>0
                f(i-1, j)*(1-pi)    if j=0
                f(i-1,j-1)*pi + f(i-1, j)*(1-pi)    if j>0

前两个式子倒是好理解：
    
    如果当前题目为 0，可答对题数为 0，那么概率肯定是 1。
    如果当前题目为 0，可答对题目数为 j>0，那么没有题目给你去回答，概率也就是 0。 

后面两个式子：
    
    如果当前可答对的题目数为 0，那么当前这道题目 i 只能选在答错，所以在当前情况下的概率就为 f(i-1, j)*(1-pi)，其中 f(i-1, j) 为上一题的总概率。
    如果当前可答对题目数 j>0，那么当前这道题目也就有两种情况，选择答对这道题目或者答错。


例子：
    
    n = 4   p = [0.5, 0.5, 0.5, 0.5]

        0   1   2   3   4
    0   1   0   0   0   0
    1   
    2
    3
    4

    当前 计算 f(1, 0) 的概率，那么就是计算第 1 题在可答对题数为 0 下的概率，也就是 j=0，当前这题必须答错，所以 f(1, 0) = 1*(1-0.5) = 0.5

    计算 f(1, 1) 的概率，那么就是计算第 1 题在可答对题数为 1 下的概率，也就是 j=0，这道题可以选择答对或者答错，所以 f(1, 1) = f(0, 0)*0.5 + f(0, 1)*(1-0.5)=0.5。其实可以直接理解为这道题只能答对，因为当前题目为 1，又必须答对 1 题。

    计算 f(1,2) 的概率，同理 f(1, 2) = f(0, 1)*0.5 + f(0, 2)*(1-0.5) = 0
    ....

    所以最后的矩阵就为：
            0       1       2       3       4
    0       1       0       0       0       0
    1       0.5     0.5     0       0       0
    2       0.25    0.5     0.25    0       0
    3       0.125   0.375   0.375   0.125   0
    4       0.0625  0.25    0.375   0.25    0.0625
    
    必须答对 m = 0.6*n  向上取整  或者用 m = 0.6*(n+4)
    最后 ans = sum(f(n, i))  for i from m to n
             = 0.3125


##### 正确代码

{% highlight python %}

# -*- coding: utf-8 -*-

import math

def main():
    n = int(raw_input())

    p_string = raw_input().split(" ")

    P = [float(x)/100 for x in p_string]

    probability_mat = [[0]*(n+1) for i in range(n+1)]

    probability_mat[0][0] = 1.0
    for i in range(1, n+1):
        probability_mat[0][i] = 0.0

    for i in range(1, n+1):
        for j in range(n+1):
            if j == 0:
                probability_mat[i][j] = probability_mat[i-1][j] * (1-P[i-1])
            else:
                probability_mat[i][j] = probability_mat[i-1][j-1] * P[i-1] + probability_mat[i-1][j] * (1-P[i-1])

    for x in probability_mat:
        print x
    ans = probability_mat[n]
    print "{0:.5f}".format(sum(ans[int(math.ceil(0.6*n)):]))

if __name__ == '__main__':
    main()


{% endhighlight %}

### Summary

哎~ 好气呀。看着某个群里的人陆续接到 offer 通知。

看看自己弱弱的样子...