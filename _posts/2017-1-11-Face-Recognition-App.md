---
layout: post
title: Face Recognition App — TrackMe
tag: notes
---

> TrackMe - 探秘 An Android Application

### TrackMe

最初的想法是：在学校范围内，根据一位陌生同学的照片就可以识别出对应的信息。这样要是哪天在图书馆遇见一个心仪的女生，万一不敢迈出第一步，好歹可以留下点信息，不会石沉大海。

不过最后经过设计开发，才知道这个想法太荒诞了。毕竟现在做的人脸识别是基于人脸数据库的，也就是说，我还得有全校学生的图片，虽然学校的App上有同学们入学时采集信息拍下的证件照，但那是证件照啊。。。像素那么渣。。

没办法，就只能强拉着寝室的同学拍照，构造人脸数据库。

最后，到数据库中也就只有10个人，每人10张照片也就100张。其实后来想想，本来也没有在检索结果上二次优化，为什么要取10张照片呢，还不如直接返回匹配度最高的一张照片就可以了。

### Implement

关于Android的开发，这里就不过多的叙述了，也就是几个Activity，加上一些数据库操作和网络传输。就连什么Service和Broadcast都没用上。。都不好意思和老师说做的是Android项目。

主要花了点功夫在后台Server搭建上，用的是<b>Ubuntu+Flask+Caffe</b>

用Ubuntu的原因只是因为：只在Ubuntu上配置过Caffe，而又需要用Caffe去运行CNN进行特征提取。

选择Flask是因为觉得这个框架用来做RESTful API十分的方便，几行代码就可以搭起一个Web服务。后端的业务处理代码用python写也十分的顺手，配合Caffe提供的pycaffe接口。

大体的框架以及整体流程：

<img src="/images/trackme.png">

大概的描述下人脸识别的过程：首先是对目标图片进行人脸检测，判断目标图片是否包含人脸。第二，对目标图片检测出的人脸区域进行扣取，利用CNN模型进行特征提取，将目标图片的特征与数据库中的特征进行相似度计算，返回所有

### Detection

第一步是人脸检测。有去粗略的了解过目前主流的人脸检测算法。从opencv里面的cart算法，到Adaboost算法，以及目前最火的CNN里面的R-CNN，fast R-CNN，faster R-CNN[1]。

对后面CNN里面的方法比较感兴趣，目前来说应该是 the faster R-CNN 这种方法的效果和速度最好。更有趣的是这种方法是基于caffe来实现的。但是又限于目前设备原因，没有办法去复现论文里面的实验环境。就算实现了，到了后面的人脸识别上进行特征提取的话，就需要在电脑上运行两个CNN模型了。就以目前同学的电脑配置来说，一个模型就已经够呛，所以也就只能放弃这种方法。。。没钱没设备看来真的不适合搞科研。

然而其他的人脸检测算法一时半会也摸不到门道，只能退而求其次。人脸检测看来是不能在自己的Server上实现。不过还好Face Plus提供的人脸检测的结果还是比较满意的，以及免费提供的API接口，最后妥协的在牺牲了一定的响应速度情况下，提高人脸检测的结果。

#### Reference

1.<a href="https://arxiv.org/pdf/1606.03473v1.pdf">Face Detection with the Faster R-CNN</a>

### Recognition 

第二步也就是根据检测到的人脸部分进行识别了。按照常理来说，一般的CNN模型最后的结果直接输出的就是结果了。但是根据我们目前收集到的人脸照片和当前Server配置，第一是因为显存不足，第二是目前的照片太少，训练出的模型不具有泛化能力。所以利用到了一个 pre-trained model[1]。

这样就不能直接使用模型最后的输出结果，而是使用模型中间层次输出的高层次特征，例如FC7什么的。然后把特征进行再次的优化组成人脸特征库，最后是基于这个人脸特征库去进行相似度检索。

#### Reference

1.<a href="http://www.robots.ox.ac.uk/~vgg/publications/2015/Parkhi15/parkhi15.pdf">Deep Face Recognition</a>

### Summary

最后在人脸识别上还是有比较不错的结果。可识别的人脸有限，可能会随证人脸特征库的增大，会相应的影响的一些结果，但是只是作为一个小玩具来用的话，也能勉强接受。

演示视频：

http://v.youku.com/v_show/id_XMjcwOTc5MzcyNA==.html?spm=a2h3j.8428770.3416059.1

居然忘记多试几个其他人的识别情况，然而 Server 在同学的笔记本上，同学已经离校了。。。
