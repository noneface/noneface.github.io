---
layout: post
title: Retrieval images in Dataset ,Show in Flask 
tag: codes
---

# About

前不久一直在做关于图像检索相关的学习。

从最初的基础特征，SIFT，GIST等等，到特征融合，以及目前最火的CNN。

所以就利用Flask做开发，做了一个Web的检索结果展示页。

# FLask

关于Flask，它是一个micro框架。

关于这一点，通过我之前对的Django的理解，深有体会。

关于Django，它能够直接生成一个项目，

里面直接集成了数据库管理等功能。

比较起来就是：

FLask + flask-script + flask-SQLAlchemy +... == Django

也就是说，如果真的用Flask写一个项目的话，还得加上一些扩展工具。

#　Front

前端的页面写的比较简洁，

功能也就是点击首页随机选择展示的一幅图片，

能够在数据集中之间检索与其COS-distance最小的前10幅图片并展示出来。

<img src="/images/search.png">
<img src="/images/search1.png">

整体流程就像图片展示的，在检索结果中，

如果是相似，也就是同类图片的话，

会用红色边框标注。

# Retrieval

在这个Demo里面，用到的是预先提取好的CNN-features,

pre-trained　model用到的是GoogleNet model。

在这里，并没预先处理每一张图片的检索结果。

而是利用所选中的每一张图片的特征，去整个特征集中做COS-distance的计算。

实时的根据选择的图片进行计算，得出结果。