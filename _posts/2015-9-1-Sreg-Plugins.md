---
layout: post
tag: coded
title: Sreg 编辑Plugins文件
---

*  Sreg是 Evi1m0 大牛在github开源的一个python脚本，用来检测是否注册网站。
*  github地址为：
		https://github.com/n0tr00t/Sreg.git

*  以百度为例。

*  通过登录时网站检测用户是否注册，来判断当前输入用户名/邮箱/手机号是否被注册。
*  百度在登录时会出现一个url： https://passport.baidu.com/v2/?regmailcheck&token=cb5018ebf7bf64952515e77956fd7bc6&tpl=mn&apiver
*  =v3&tt=1441107684306&email=956905550%40qq.com&callback=bd__cbs__vyzdpx

*  <img src="/images/sreg_1.png">

*  通过访问url，返回结果如下：

*  <img src="/images/sreg_2.png">

*  然后根据其返回的errInfo：no中的数值1/0来判断是否注册。

*  整个流程大致如此。
*  个别网站存在差别，数据提交的POST/GET方法。
*  不过百度这个网站用python脚本进行访问，会出现系统繁忙。

*  Sreg的plugins还需要慢慢修改。


