---
title: 糗事百科小爬虫
layout: post
tag: codes
---

已经开始正式的学习python。

life is short，i use python.

几天时间把python的基本语法学习了一遍.一门动态的语言,不需要在声明变量的同时,声明它的类型.

然后早就对爬虫有兴趣的我参照网上的教程写了一个简易爬去糗事百科的小爬虫.

代码如下:

{% highlight python %}
#!/usr/bin/env python
# -*- coding:utf-8 -*-
import urllib2
import re
import os
import time
print "#"*15+"Please wait"+"#"*1
while True:
    fname = time.ctime() + '.txt'
	if os.path.exists(fname):          
		print 'already exists\n'
	else:
		break
user_agent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
headers = { 'User-Agent' : user_agent }
base_url = 'http://www.qiushibaike.com/text/' 

request = urllib2.Request(base_url,headers = headers)
response = urllib2.urlopen(request)
pick_up = re.compile('<div.*?class="content">(.*?)</div>',re.S)
html = response.read()
items = re.findall(pick_up,html)	
print len(items),'stories has been download'
fobj = open(fname,'w')
fobj.writelines(items)
fobj.close()
print 'Done!'
{% endhighlight %}

<h2>Update</h2>

2016/1/16

{% highlight python %}
#coding:utf8
import requests
from bs4 import BeautifulSoup

def open_url(url):
	
	user_agent = 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36'
	header = {'User-Agent' : user_agent}
	response = requests.get(url,headers=header)
	return response

def write(response):
	fname = "test.txt"
	fobj = open(fname,"a")
	soup = BeautifulSoup(response.text,"html.parser")
	t = soup.find_all("div",class_="content")
	for i in t:
		fobj.write(i.text.encode("utf-8"))

	print u"[*]正在爬取当前页面——————"
	fobj.close()

if __name__ == '__main__':
	base_url = "http://www.qiushibaike.com/textnew"
	response = open_url(base_url)
	i = 2
	while i<35:
		write(response)
		next_url = base_url+'/page/'+str(i)
		response = open_url(next_url)
		i += 1

{% endhighlight %}

对了,python还是面向对象的编程语言,现在还不清楚什么是面向对象.只知道python有一个概念叫做类.像是一个封包,给出一个接口,然后可以重复使用,也像是函数的一个父集,里面可以包含了很多的函数.

慢慢学习.
