---
layout: post
title: Crawler Framework
tag: codes
---

## About

> 经常需要爬取一些网站上的数据

> 然而每次使用python都需要把多线程任务重新实现一遍。

> 于是就萌发了构建一个微型爬虫框架的想法。


## Implements

一个微型的爬虫框架，只需要给出几个相关配置信息，例如爬虫起始页地址、数据库存放配置信息和爬取所需内容的正则表达式，就可以自动的获取所需数据，并且保存。

考虑到网站存在反爬虫以及前端页面框架的使用，所以可以通过继承 Parser 类，将 ParseNext()，也就是在页面中提取下一个爬取页面的方法，重新根据有规律的页面进行重写。

## Test

{% highlight python %}

# -*- coding: utf-8 -*-

from Crawler import Cralwer
import Queue
from threads.Parser import Parser
import json
import urllib2
import re
from utils.logger import logger


class CustomParser(Parser):

    def parseNext(self, htmlTask):

        baseUrl = "http://www.shixiseng.com/interns?k=%s&p=%d"
        if htmlTask['urlTask']['deep'] == 0:

            jobContent = re.findall(r'''manages\s=\s(.+),''', htmlTask['html'])
            jobContent = json.loads(jobContent[0])
            for jobType in jobContent:
                jobTag = jobContent[jobType]
                for job in jobTag:
                    urlTask = htmlTask['urlTask']
                    urlTask['urlTag'] = job['name']

                    jobName = urllib2.quote(job['name'].encode('utf-8'))
                    url = baseUrl % (jobName, 0)
                   
                
                    child = job['child']
                    for jb in child:
                        urlTask['urlSubcls'] = jb['name']

                        jobName = urllib2.quote(jb['name'].encode('utf-8'))
                        url = baseUrl % (jobName, 0)
                        
                        self.addURL(set([url]), urlTask)

        elif htmlTask['urlTask']['deep'] == 1:
            urls = set()
            pagecount = re.findall(r'''"page_count":\s(\d+),''', htmlTask['html'])

            pagecount = int(pagecount[0])
            urlTask = htmlTask['urlTask']

            for i in range(1, pagecount+1):
                url = re.sub(r'p=(\d+)', "p="+str(i), htmlTask['urlTask']['url'])
                urls.add(url)

            self.addURL(urls, urlTask)
        else:
            joburl = set(re.findall(r'''(/intern/[^"']+)''', htmlTask['html']))

            checkedUrl = self.checkoutURL(htmlTask['urlTask']['url'], joburl)
            urlTask = htmlTask['urlTask']
            urlTask['deep'] += 1
            self.addURL(checkedUrl, urlTask)



if __name__ == '__main__':

    patterns = {
        "job_name": r'''class="job_name"\stitle="([^\s]+)"''',
        "daymoney": r'''class="daymoney">\n([^/丨]+)''',
        "city": r'''class="city"\stitle="([^\s"]+)''',
        "education": r'''class="education">([^\s]+)''',
        "days": r'''<span \sclass="days">([^\n]+)''',
        "month": r'''class="month">([^<]+)''',
        "company": r'''class="jb_det_right_top">\n.+\n<p><a href=.+>(.+)</a>''',
        "company_class": r'''class="pin".+>\n(.+)'''
    }

    pythonDocstartUpConfig = {
            "url": 'http://127.0.0.1:8000/',
            "deep": 0,
            "fetchTimes": 0,
            "urltag" : "index",
            "urlSubcls": "mainPage"
    }


    startUpConfig = {
            "url": 'http://www.shixiseng.com/',
            "deep": 0,
            "fetchTimes": 0,
            "urlTag" : "index",
            "urlSubcls": None,
    }

    dbConfig = {
            "host": "localhost",
            "port": 27017,
            "database": "shixiseng",
            "collection": "jobs"
    }

    test = Cralwer(startUpConfig, CustomParser, patterns, dbConfig)
    test.start()

{% endhighlight %}

最后用实习僧这个网站练了一遍手。

分析了一些数据。

<img src="/images/shixiseng.png" alt="">
