---
layout: post
title: Visualization of Site Map
tag: codes
---

### About

最近在鼓捣一个小东西。

起初是做了一个基于 Cerlery 的站点爬虫，后来想着可以给这个爬虫做一点扩展。

类似于站点地图、基于指纹的识别以及站内外链检测等等功能。

所以就做出了这么一个东西。


### Design

爬虫模块，使用了 Celery 做并发的调度，对新建站点任务使用独立进程进行运行。

每个爬虫采用了多线程的结构进行实现，保证一定的速度。

在后台方面，采用了 Django + Django REST Framework + DRF Mongoengine

前后端分离的策略，来实现这么一套系统。

不过在前端方面的实现上。。本来打算用 React 做的，目前接触来看，需要一段时间适应才能熟悉。

所以暂时使用了 HTML + jQuery 来进行前端页面的演示。

### Performance

在爬虫性能上，采用 5 个线程，同环境下，自己搭建一个 Python Doc 的页面，能在 3S 内爬完 500+ 页面。

不过在一些站点下，例如 http://www.sec-wiki.com ，也能在 3 min 内爬完 3000+ 页面

在指纹识别上，目前采用 Github 开源提供的一些指纹，目前识别的效果在 30% 左右。

### Show

一些界面数据的演示。


![show](/images/Site_eye_1.png)
![show](/images/Site_eye_2.png)
![show](/images/Site_eye_3.png)
![show](/images/Site_eye_4.png)
