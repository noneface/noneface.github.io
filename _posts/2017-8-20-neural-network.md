---
layout: post
title: Neural Network in Python
tag: codes
---

### About

Nerual Network，神经网络模型。在机器学习中，是一个比较重要的模型，其中深度学习就是以此为基础。

### 推导

![show](/images/nn1.png)

在图中，这个神经网络模型包含了三层，其中第一层为输入层，中间层为隐藏层，最后一层为输出层。

层与层之间通过权重连接，在每一个神经元节点，都是用一个 sigmoid 函数作为线性变化，让最后结果满足 0-1 之间，并且符合概率的要求。

与之前接触过的线性回归，逻辑回归问题类似，在拟合模型，是 cost 最小化的过程中，使用到的都是梯度下降。

与其他不同的是，在神经网络中，涉及到前向传播和反向传播两种情况。

前向传播：将输入的样本，进行按层计算，最终得到输出层的结果。

反向传播：通过前向传播，得到模型输出结果与真实结果进行计算，得出 cost 在每一个权重上的残差，对权重进行一轮的更新迭代。


主要公式：

![show](/images/nn0.png)

通过计算 cost，然后进行残差计算，正对每一个权重计算占比进行更新。


### BP 算法推导

1. 针对输出层：

![show](/images/nn2.png)

这个推导过程是：

![show](/images/nn3.png)

2. 正对隐藏层：

![show](/images/nn4.png)

推导过程：

![show](/images/nn5.png)

![show](/images/nn6.png)

最后，对参数进行更新就得出了这个方程：

![show](/images/nn7.png)

### 实现

这里使用 Machine Learning（Andrew NG）课程中的神经网络章节，提供的练习题数据。也就是 MNIST 手写数字数据。

编写环境使用的是 jupyter notebook

{% highlight python %}

import numpy as np
import scipy.io
import random
import scipy.optimize
import itertools
from scipy.special import expit

# 载入数据

datafile = 'ex4data1.mat'
mat = scipy.io.loadmat( datafile )
X, y = mat['X'], mat['y']
X = np.insert(X,0,1,axis=1)
print "'y' shape: %s. Unique elements in y: %s"%(mat['y'].shape,np.unique(mat['y']))
print "'X' shape: %s. X[0] shape: %s"%(X.shape,X[0].shape)

# 'y' shape: (5000, 1). Unique elements in y: [ 1  2  3  4  5  6  7  8  9 10]
# 'X' shape: (5000, 401). X[0] shape: (401,)

# 设置网络模型结构

input_layer_size = 400  # 图像大小为 20*20
hidden_layer_size = 25  # 隐藏层包含 25 个神经元，不包括 bias 节点
output_layer_size = 10  # 输出层为 10，对应 0-9
n_training_samples = X.shape[0]  # 训练数据集

# 对 weights 参数进行变化，方便计算  矩阵 ==》 列表
# 列表 ==》 举证

def flattenParams(thetas_list):
    """
    Hand this function a list of theta matrices, and it will flatten it
    into one long (n,1) shaped numpy array
    """
    flattened_list = [ mytheta.flatten() for mytheta in thetas_list ]
    combined = list(itertools.chain.from_iterable(flattened_list))
    assert len(combined) == (input_layer_size+1)*hidden_layer_size + \
                            (hidden_layer_size+1)*output_layer_size
    return np.array(combined).reshape((len(combined),1))

def reshapeParams(flattened_array):
    theta1 = flattened_array[:(input_layer_size+1)*hidden_layer_size] \
            .reshape((hidden_layer_size,input_layer_size+1))
    theta2 = flattened_array[(input_layer_size+1)*hidden_layer_size:] \
            .reshape((output_layer_size,hidden_layer_size+1))
    
    return [ theta1, theta2 ]

def flattenX(myX):
    return np.array(myX.flatten()).reshape((n_training_samples*(input_layer_size+1),1))

def reshapeX(flattenedX):
    return np.array(flattenedX).reshape((n_training_samples,input_layer_size+1))

# 计算 cost， 其中包含了正则化方程，防止过拟合

def computeCost(mythetas_flattened, myX_flattened, myy, mylambda=0):
    mythetas = reshapeParams(mythetas_flattened)
    myX = reshapeX(myX_flattened)
    
    total_cost = 0.
    m = n_training_samples
    
    for irow in xrange(m):
        myrow = myX[irow]
        
        myhs = propagateForward(myrow, mythetas)[-1][1]  # 进行前向计算
        tmpy = np.zeros((10, 1))
        tmpy[myy[irow]-1] = 1  # myy 为样本正确结果，1-10 对应了真实数字 0-9，所以进行映射。
        
        mycost = -tmpy.T.dot(np.log(myhs))-(1-tmpy.T).dot(np.log(1-myhs))  # 计算 cost
        total_cost += mycost

    total_cost = float(total_cost) / m
    
    total_reg = 0.
    for mytheta in mythetas:
        total_reg += np.sum(mytheta*mytheta)
    total_reg *= float(mylambda)/(2*m)
    
    return total_cost + total_reg

# 前向计算， 使用权重参数，对每个元节点之间进行计算连接

def propagateForward(row, Thetas):
    
    features = row
    zs_as_per_layer = []
    for i in xrange(len(Thetas)):
        Theta = Thetas[i]
        z = Theta.dot(features).reshape(Theta.shape[0], 1)
        a = expit(z)
        
        zs_as_per_layer.append((z, a))
        if i == len(Thetas)-1:
            return np.array(zs_as_per_layer)
        a = np.insert(a, 0, 1)
        features = a  # 将当前层的输出结果（隐含层输出结果） 作为下一层的输入数据

# sigmoid 函数的求导 

def sigmoidGradient(z):
    dummy = expit(z)
    return dummy*(1-dummy)

# 初始化权重参数

def genRandThetas():
    epsilon_init = 0.12
    theta1_shape = (hidden_layer_size, input_layer_size+1)
    theta2_shape = (output_layer_size, hidden_layer_size+1)
    rand_thetas = [ np.random.rand( *theta1_shape ) * 2 * epsilon_init - epsilon_init, \
                    np.random.rand( *theta2_shape ) * 2 * epsilon_init - epsilon_init]
    return rand_thetas

# 反向传播

def backPropagate(mythetas_flattened, myX_flattened, myy, mylambda=0.):
    mythetas = reshapeParams(mythetas_flattened)
    myX = reshapeX(myX_flattened)
    
    Delta1 = np.zeros((hidden_layer_size, input_layer_size+1))
    Delta2 = np.zeros((output_layer_size, hidden_layer_size+1))
    
    m = n_training_samples
    for irow in xrange(m):
        myrow = myX[irow]
        a1 = myrow.reshape((input_layer_size+1, 1))
        
        temp = propagateForward(myrow, mythetas)
        
        z2 = temp[0][0]
        a2 = temp[0][1]
        z3 = temp[1][0]
        a3 = temp[1][1]
        
        tmpy = np.zeros((10,1))
        tmpy[myy[irow]-1] = 1
        
        delta3 = a3 - tmpy  # 输出层残差
        delta2 = mythetas[1].T[1:,:].dot(delta3)*sigmoidGradient(z2)  # 隐含层残差
        a2 = np.insert(a2, 0, 1, axis=0)
        
        Delta1 += delta2.dot(a1.T)
        Delta2 += delta3.dot(a2.T)  # 所有 权重的一个残差
    
    D1 = Delta1/float(m)
    D2 = Delta2/float(m)  # 计算均值
    
    #Regularization:
    D1[:,1:] = D1[:,1:] + (float(mylambda)/m)*mythetas[0][:,1:]
    D2[:,1:] = D2[:,1:] + (float(mylambda)/m)*mythetas[1][:,1:]        
    return flattenParams([D1, D2]).flatten()


def trainNN(mylambda=0.):
    """
    Function that generates random initial theta matrices, optimizes them,
    and returns a list of two re-shaped theta matrices
    """

    randomThetas_unrolled = flattenParams(genRandThetas())
    result = scipy.optimize.fmin_cg(computeCost, x0=randomThetas_unrolled, fprime=backPropagate, \
                               args=(flattenX(X),y,mylambda),maxiter=50,disp=True,full_output=True)
    return reshapeParams(result[0])

# 上面这个训练，是用到了 scipy 中的 fmin_cg 函数，也就是共轭梯度，库函数，得到的最后结果精度在 97.2% 

# 下面是自己设置 learning rate 进行的一个梯度下降，收敛速度比较慢，需要经过 2000 次的迭代后，才得到 85.9% 的一个结果。

def trainNN_self(mylambda=0.):
    learning_rate =  0.05
    
    randomThetas_unrolled = flattenParams(genRandThetas())
    for i in xrange(2000):
        cost = computeCost(randomThetas_unrolled,flattenX(X),y,0.)
        print '{} iter, cost {}'.format(i, cost)
        d = backPropagate(randomThetas_unrolled,flattenX(X),y,0.)
        d = d.reshape((d.shape[0], 1))
        randomThetas_unrolled -= d*learning_rate
    return randomThetas_unrolled

def predictNN(row,Thetas):
    """
    Function that takes a row of features, propagates them through the
    NN, and returns the predicted integer that was hand written
    """
    classes = range(1,10) + [10]
    output = propagateForward(row,Thetas)
    #-1 means last layer, 1 means "a" instead of "z"
    return classes[np.argmax(output[-1][1])] 

def computeAccuracy(myX,myThetas,myy):
    """
    Function that loops over all of the rows in X (all of the handwritten images)
    and predicts what digit is written given the thetas. Check if it's correct, and
    compute an efficiency.
    """
    n_correct, n_total = 0, myX.shape[0]
    for irow in xrange(n_total):
        if int(predictNN(myX[irow],myThetas)) == int(myy[irow]): 
            n_correct += 1
    print "Training set accuracy: %0.1f%%"%(100*(float(n_correct)/n_total))

{% endhighlight %}

通过修改隐藏层的神经元数量/隐藏层层数，都可以将模型进行变化，得到不同的结果。

![show](/images/nn8.png)


### Reference

1. http://feiyang.li/2017/05/06/Coursera-ML-8-Neural-Networks-Learning/index.html
2. https://github.com/kaleko/CourseraML/blob/master/ex4/ex4.ipynb
3. http://yongyuan.name/blog/back-propagtion.html