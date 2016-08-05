---
layout: post
title: Extract CNN features from pre-trained model in Caffe
tag: codes
---

# 背景

近期，机器学习的火热程度难以想象，相关的深度学习，卷积神经网络也不例外。

在这里，通过[Caffe](http://caffe.berkeleyvision.org/)这个卷积神经网络的框架，

利用一些pre-trained Model，来提取特征，根据这种特征来进行检索。

# 原理

基于神经网络，一张图片作为输入数据，载入到网络模型中，再进行前向计算，根据每层的权重进行计算，得到每一层的计算数据。

再选择所需要的层次，将前向计算后的数据进行提取。

一般来说，pre-trained model都是经过了十分庞大的数据集训练，并且迭代训练次数N多的模型。

而这种训练，一般是类似于Multi-class Classification，最终的结果是用于分类的。

同样，检索的结果也可以认为是将同类的数据进行排序。

# 准备

1.配置caffe及运行环境
2.编译pycaffe
3.下载pre-trianed model
4.准备测试数据集

测试中，用到了GoogleNet Model，可以在caffe下的models中找到，

不过对应的caffemodel，也就是caffe中模型的weights文件，

需要通过scripts/download_model_from_gist.sh 来下载对应的模型。

# Code

{% highlight python %}
# -*- coding:utf-8 -*-

import numpy as np
import caffe
import os
import sys
caffe.set_mode_gpu()

caffe_root = '/home/noneface/caffe/'

model_def = sys.argv[1]   # 模型deploy文件
model_weights = sys.argv[2]  # 模型caffemodel文件
img = sys.argv[3]			# 图片文件路径
layers = sys.argv[4] 		#  提取模型中层次名
outPut = sys.argv[5]		# 特征输出路径

net = caffe.Net(model_def,      # defines the structure of the model
                model_weights,  # contains the trained weights
                caffe.TEST)     # use test mode (e.g., don't perform dropout)


# create transformer for the input called 'data'
transformer = caffe.io.Transformer({'data': net.blobs['data'].data.shape})

transformer.set_transpose('data', (2,0,1))  # move image channels to outermost dimension
transformer.set_raw_scale('data', 255)      # rescale from [0, 1] to [0, 255]
transformer.set_channel_swap('data', (2,1,0))  # swap channels from RGB to BGR


fobj = open(outPut,'w')


image = caffe.io.load_image(img)

transformed_image = transformer.preprocess('data', image)  #  处理数据

# copy the image data into the memory allocated for the net
net.blobs['data'].data[...] = transformed_image

### perform classification
net.forward()   #  前向计算

feature = net.blobs[layers].data[0].reshape(-1)  # 将多维数据转成一维
print '[*]extract features:', img

fobj.write(feature)
fobj.close()

{% endhighlight%}

# Test

一般来讲，我会直接用一个for循环，来直接遍历提取所有图片的特征。

然后所有图片的特征存储下来，进行下一步的检索计算。

检索结果如下：

<img src="images/cnn.png">

结果存成这样，是为了方便计算mAP。