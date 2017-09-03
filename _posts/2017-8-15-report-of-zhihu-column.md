---
layout: post
title: Report of Zhihu Column
tag: codes
---

### About

近期针对我们知乎专栏 《安全大事件》做了一次数据分析。

在分析上，顺便造了一个轮子，自动分析专栏，然后用 echarts 进行 HTML 的图表展示。


### Design

首先确定需要获取的数据：
	
	1. 专栏概况：文章赞同数量、专栏关注数量、文章评论数量
	2. 专栏作者/文章信息
	3. Top 文章排行：赞同数最多、评论最多
	4. Top 读者：读者点赞最多、读者评论最多
	5. 打赏过的读者

这些数据，在知乎专栏里面都是开放的，在获取数据的时候直接使用 API 接口就可以直接的实现。

在获取到数据之后，就是进行一轮的统计分析。

从统计的角度出发，用不同的视角去分析专栏目前运营的情况。


### Show

![show](/images/dashijian_report.png)

以上，是目前专栏的分析数据。

随后，也有分析统计了目前知乎大多数推荐专栏的概况。

整体的数据在：

http://www.noneface.com/images/zhihu_columns_report.zip

### Open Source

关于这个专栏分析工具，近期将会整理开源到 GitHub 上。

有需要的也可以直接 email 我。