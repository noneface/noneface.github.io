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

### Linear regression with multiple variables

#### 题目介绍

In this part, you will implement linear regression with multiple variables to
predict the prices of houses. Suppose you are selling your house and you
want to know what a good market price would be. One way to do this is to
first collect information on recent houses sold and make a model of housing
prices.

The file ex1data2.txt contains a training set of housing prices in Port-
land, Oregon. The first column is the size of the house (in square feet), the
second column is the number of bedrooms, and the third column is the price
of the house.

通过房屋面积，房间数量，拟合一个房价模型，预测房价。

#### Code

{% highlight python %}
#-*-coding:utf-8 -*-

import numpy as np

# Linear Regression in Gradient Descent

def computeCost(X, y, theta=[[0], [0], [0]]):
	m = y.size
	J = 0

	h = X.dot(theta)

	J = 1.0/(2*m)*np.sum(np.square(h-y))

	return J

def gradientDescent(X, y, theta=[[0], [0], [0]], alpha=0.09, num_iters=10000):
	m = y.size
	J_history = np.zeros(num_iters)

	for iter in np.arange(num_iters):
		h = X.dot(theta)
		J_history[iter] = computeCost(X, y, theta)
		theta = theta - alpha*(1.0/m)*(X.T.dot(h-y))
	return theta, J_history

def loadData():
	data = np.loadtxt('ex1data2.txt', delimiter=',')

	X = np.c_[np.ones(data.shape[0]), data[:, 0]/1000.0, data[:, 1]]
	y = np.c_[data[:, 2]/10000.0]    #  数据值偏大，会导致cost值很大，所以将数据缩放

	return X, y

def predict(theta):

	size = float(raw_input("input the size of house:"))
	bedrooms = int(raw_input("input the number of bedroom:"))
	data = [1, size, bedrooms]

	print "%f *1000 feet, %d bedrooms,predict price: %f" %(size, bedrooms, theta.T.dot(data)*10000)

if __name__ == '__main__':
	X, y = loadData()

	initCost = computeCost(X, y)

	print "the init Cost J is :", initCost

	theta, Cost_J = gradientDescent(X, y)

	print "the function is: y = %f + %f*X1+ %f*X2" %(theta[0], theta[1], theta[2])
	print "the Cost is :",Cost_J[-1]

	predict(theta)
{% endhighlight %}

#### 结果

由于是多维变量的拟合，对应的图像数据就难以展示了，但是原理和一个变量是一致的。

预测结果：

<img src="/images/LR_multiple.png">