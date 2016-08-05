---
layout: post
title: Machine Learning--Linear Regression
tag: codes
---

## 背景

基于Coursera上的Machine Learning课程，

用python实践里面exercise中的题目的代码。

## Linear Regression

线性回归是机器学习里面最简单、基础的一个模型。

通过训练数据，去拟合出最符合训练数据的函数模型。

基础的知识就不再介绍了。

## Exercise 

### Linear Regression with one variable

#### 题目介绍

In this part of this exercise, you will implement linear regression with one
variable to predict profits for a food truck. Suppose you are the CEO of a
restaurant franchise and are considering different cities for opening a new
outlet. The chain already has trucks in various cities and you have data for
profits and populations from the cities.

You would like to use this data to help you select which city to expand
to next.

The file ex1data1.txt contains the dataset for our linear regression prob-
lem. The first column is the population of a city and the second column is
the profit of a food truck in that city. A negative value for profit indicates a
loss.

大致就是说通过一个城市的人口数据，和盈利情况，去判断去哪个城市扩展。

#### Code

{% highlight python %}
# -*- coding:utf-8 -*-

import numpy as np

data = np.loadtxt('ex1data1.txt', delimiter=',')  # 读取训练数据

X = np.c_[np.ones(data.shape[0]),data[:,0]]
y = np.c_[data[:,1]]

def computeCost(X, y, theta=[[0],[0]]): # Cost function 计算
    m = y.size
    J = 0
    
    h = X.dot(theta)
    
    J = 1.0/(2*m)*np.sum(np.square(h-y))
    
    return(J)

def gradientDescent(X, y, theta=[[0],[0]], alpha=0.01, num_iters=20000):  # Gradient Descent
    m = y.size
    J_history = np.zeros(num_iters)
    
    for iter in np.arange(num_iters):
        h = X.dot(theta)
        J_history[iter] = computeCost(X, y, theta)
        theta = theta - alpha*(1.0/m)*(X.T.dot(h-y))
        
    return(theta, J_history)

if __name__ == '__main__':
	theta , Cost_J = gradientDescent(X, y)
	print('theta: ',theta.ravel())

	print 'Predict profit for a city with population of 40000:',theta.T.dot([1, 4])*10000

{% endhighlight %}

#### 结果

计算预测结果：

<img src="/images/LR.png">

拟合数据图像：

<img src="/images/LR_plot.png">