---
layout: post
title: Use Scipy.optimize.minimize to Gradient descent
tag: codes
---

## About

关于 Gradient descent，就是通过一个CostFunction，和一个Alpha变量，

利用现有的数据去在有限的迭代次数中，找到一组CostFunction的参数，

使得CostFunction最小。

通常这种minimize方法，和迭代次数以及Alpha的选用有关。

## Scipy.optimize.minimize

Scipy是python的一个科学计算包，里面包含了许多数学计算的工具，

其中就包括了minimize方法。

### Examples

简单来说，minimize算法就是寻找一个函数的最小值。

在一些简单的函数里，我们可以通过求导的方法，求出最小值，

对于一些高次多元的函数，算起来可能就会比较麻烦，

这样的情况下，就可以利用minimize去计算。

{% highlight python %}
import scipy.optimize as optimize
import math

def f(x):
    return (3*x*x + 6*x +8)

result = optimize.minimize(f, [0])
print result

{% endhighlight%}

### Result

<img src="/images/minimize.png">

例子中，一个简单的一元二次函数，找到了对于最小值x的取值。

## Use minimize in Gradient Descent

那么，接下来就是利用minimize函数，去确定CostFunction的最小值取值。

这样就和普通函数的使用方法不太一样，每次参数减小的量都是通过Alpha*CostFunction,

### Linear Regression with one variable

通过Machine Learning课程中的exercise 1中的题目，

来演示一遍如何使用。

{% highlight python %}
# -*- coding:utf-8 -*-

import numpy as np
import scipy.optimize as optimize

def computeCost(theta, X, y): # Cost function 计算
    m = y.size

    h = X.dot(theta.reshape(-1, 1))

    J = 1.0/(2*m)*np.sum(np.square(h-y))
    
    if np.isnan(J):
        return np.inf
    return J

def gradient(theta, X, y):
    m = y.size

    h = X.dot(theta.reshape(-1,1))

    gradient = (1.0/m)*(X.T.dot(h-y))

    return gradient.flatten()

if __name__ == '__main__':

    data = np.loadtxt('ex1data1.txt', delimiter=',')  # 读取训练数据

    X = np.c_[np.ones(data.shape[0]),data[:,0]]
    y = np.c_[data[:,1]]

    initial_theta = np.zeros(X.shape[1])
    
    res = optimize.minimize(computeCost, initial_theta, args=(X, y), method = 'BFGS', jac=gradient, options={'maxiter':50})
    print res

{% endhighlight%}

### Result

<img src="/images/minimize1.png">

最后算出对应的最小值的参数为结果中的x。

两种方法进行Gradient descent方法最后预测结果上的差别

预测的人口数量为12k。

<img src="/images/minimizie_test.png">