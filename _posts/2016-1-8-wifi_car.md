---
layout: post
title: wifi智能小车
tag: codes
---

本应该是去年填的坑，留到了今年来总结。

2015年年底，利用arduino+esp8266+l298n自己DIY了一辆wifi智能小车。上位机控制端利用的是python django搭建的一个web app，相比于传统的android app 和 ios app，web app具有更加便捷的开发，轻轻松松跨平台进行对小车的控制。

这里需要多提到一点的就是esp8266这块芯片，貌似是我买的这块芯片存在缺陷，首先是在串口模式下，发送AT指令，比特率和淘宝卖家说的不在同一个波段，其次就是小车和电脑的django server端进行tcp收发数据时，2字节的数据都会在传输或者是esp8266接收时产生误差。

<a href="https://github.com/noneface/wifi_car">https://github.com/noneface/wifi_car</a>已将小车的arduino和django server代码push到github上。
