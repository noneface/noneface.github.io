---
title: Learning Docker
layout: post
tag: codes
---

> 笔记本在去年换了 120G的 ssd，于是就导致了一个十分尴尬的局面，硬盘太小装各种 Linux 虚拟机太吃力。
> 那为什么不直接装 Linux？
> 因为笔记本的硬件存在问题！买来的时候偶尔出现了一两次的白屏，以为只是偶然现象。结果过保了，等我安装 Linux 的时候，才发现这是个坑。
> 综合硬盘大小和显示屏硬件问题，也就只有用 Docker 了！

### About

Docker 是一种操作系统层面的虚拟化技术，在容器的基础上，进一步的进行了封装。传统虚拟机是虚拟一套硬件后，在其运行一个完整的操作系统，在该系统上在运行所需要的应用进程。而 Docker 中，所有的应用进程直接运行与宿主的内核，容器没有自己的内核，也没有进行硬件的虚拟。

![传统虚拟机](/images/docker-1.png)
![Docker](/images/docker-2.png)

不过这里依旧还是存在问题的。Windows 下怎么能够 run 一个 Linux 环境呢。。

#### Docker for Windows

Docker for Windows 是 Docker 在 Windows下的平台，实现了关于 Windows 环境下的 Container，同时也使用 MS 自家的 Hyper-v，虚拟了一台 Linux 环境的机器，也就是说，现在的 Docker 在 Windows平台下，可以同时实现 Windows containers 和 Linux containers。

![使用 Linux Host](/images/docker-3.png)
![使用 Windows Host](/images/docker-4.png)

与之前的 Docker ToolBox 不同，Docker ToolBox 是通过 Boot2Docker + VirtualBox 来完成 Linux container。

说到底，还是需要一个 Linux 的虚拟环境，才能使用 Linux container。

### Basic

Docker 中三个基本概念：Image，Container，Repository。

这里的 Container 和上面提到的 containers 还是有所区别的。上面提到的 containers 一般指的是 Docker 所运行的环境，宿主环境。

#### Image

Image - 镜像。

Image 相当于是在运行时需要的使用的文件系统和参数。它没有任何状态，也就不会有任何的改变。

当需要生产或共享一个软件的时候，只需要把打包好的 Image 提供给其他人，其他人就能够根据提供的 Image 快速部署一个运行环境。

#### Container

Container - 容器。

Container 是 Image 运行的一个实例对象。实质是进程，但是有属于自己独立的一套系统。

#### Repository

Repository - 仓库。

每一个 Repository 可以包含多个 Tag，也就是每个标签下就是一个独立的 Iamgea。有相同性质的 Images 共同构成一个 Repository。

Registry，也属于是仓库。不过它集合中的元素是 Repository。一般 Registry 是提供公开服务的仓库，类似于 Docker Hub/ DaoCloud等。

### Use

基础的一些使用都是关于镜像/容器管理。

关于使用可以[参考](https://docs.docker.com/)，没有什么是比官方文档还要详细的！

### Some Problem

1. 关于 Host (宿主机)的思考：

最初对这个 Host 并不是很理解，在原生的 Linux 环境下，安装 Docker 是不需要安装附加虚拟机的。如果你添加一个 Image 或者启动 Container，它只是共享了 Host 里面的 Linux Kernel。

但是在 Mac 或者 Windows 下，所有的 Linux 相关 Container 都是需要基于一台虚拟机的，不管这台虚拟机是利用 Virtual box 还是通过 Hyper-v 产生的。所以在这两个平台下，Docker 的 Host 应该是运行在虚拟环境里面的机器。

那么回到 Liunx Container 这个问题，针对 Linux 有不同发行版本，对应不同的 Kernel 版本。是否会产生，如果 Host 的 kernel 版本低于所要构建的Container kernel 版本？按照目前的理解，应该是会产生影响的。 


### Reference

1.[Docker basics](https://docs.docker.com/engine/getstarted/)

2.[Windows Containers and Docker: The 5 Things You Need to Know](https://blog.sixeyed.com/windows-containers-and-docker-5-things-you-need-to-know/)

3.[Run Linux and Windows Containers on Windows 10](https://stefanscherer.github.io/run-linux-and-windows-containers-on-windows-10/)


EOF