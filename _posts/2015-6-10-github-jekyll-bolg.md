---
layout: post
title: Github+jekyll搭建博客
tag: codes
---

上个礼拜没有更新，并不是忘了。只是突然一下不知道写什么，而且打算改变一下写博客的形式。更Geek一点.
大半个月前就一直在接触git，有一个初步的了解，主要就是一下几行代码：

1. git init 初始化当前文件夹为 git库
2. git add . 将修改后的文件夹提交
3. git commit -m “” 提交加入本地库
4. git remote add origin https://github.com/username/**** 本地仓库和github上远程仓库关联。
5. git push origin master 提交推送合并，更新远程库。
6. git pull origin master 本地库与远程库同步

之后就是jekyll的操作。

jekyll使用ruby写的，所以要用上gem下载安装。但是天朝的政策，gem的软件源都被墙了，所以需要修改默认的软件源。

{% highlight c %}
gem sources --remove https://rubygems.org/
gem sources -a https://ruby.taobao.org/
{% endhighlight %}

然后执行 gem install jekyll 

新建一个jekyll的文件夹 jekyll new file_name 

再把新建的文件夹弄成git库，就可以提交到github上了。

这些都不是关键，关键是做出一个自己喜欢的blog布局真难。

几乎花了1个多礼拜才搞清楚jekyll做静态blog是怎么回事。

jkyll利用了liquid的模板语言，事先做好几个default，post，page等等的html模板，html+css+js顺带嵌套着liquid的语言。初看真看不懂是什么鬼。做好模板是一回事，理清各个模板之间的关系又是一回事。利用这些，一个静态的blog就出来了。正在尝试利用Bootstrap框架建一个自己喜欢的blog。项目地址:github.com/noneface/noneface.github.io,也可以直接访问noneface.github.io，这就是我新的blog地址。

差不多就是这样。

尽量的写吧。
