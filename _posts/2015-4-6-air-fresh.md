---
layout: post
title: air fresh
tag: codes
---
*  上个礼拜特别忙，昨天刚考完期中考试。吃完午饭来更一篇。
*  参加了学院的网页制作比赛，周末花了两天时间赶了出来。
*  讲讲主要的设计思路。网页分成了几块。设计有缺陷，对一个理工生不要要求那么高。
*  第一个部分主要是获取天气和pm2.5的数据。这个纠结了我很久，一度想要放弃。
*  不过还是有问题。在ie8以下的浏览器访问，无法getjson的数据，也就是无法跨域访问。
*  解决这个问题的代码如下:
{% highlight javascript %}
$.getJSON("http://query.yahooapis.com/v1/public/yql", {
q: "select * from json where url=\"http://api.lib360.net/open/pm2.5.json?city=南昌\"",
format: "json"
}, function(data){
var pm25 = data.query.results.json.pm25;
document.getElementById("pm25").innerHTML=pm25 + "AQI" ;
});
{% endhighlight %}
*  api 获取pm2.5实时数据
*  第二部分我觉得算是满高大上的地方了。NASA的数据有没有！百度GOOGLE了好久才搜索到。不过这样看地球的晚上还是很迷人的。
*  第三部分主要是一个科普，空气污染的组成。一笔带过。
*  第四部分。用了一个js的幻灯片插件。一点防治的tips。
*  是不是看起来有点没头没尾的。我也这么觉得。获奖没戏。最后说一下自适应的问题，由于时间很仓促，没有用bootstrap的框架做开发。所以不是响应式的布局，用手机访问上述的网站就是团渣混在了一起。看暑假有没有时间，花点时间用bootstrap框架重写一遍。
