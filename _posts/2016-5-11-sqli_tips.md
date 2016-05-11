---
layout: post
title: SQLi--tips
tag: codes
---

记录在学习SQLi中的怪异tips。

<h3>Less-24</h3>

在sqli-labs里面。Less-24用到了类似于xss的一个二次注入利用。

首先，在登录框试试登录绕过是没有用的。

在后台，用了mysql_real_escape_string()来检测输入的字符。

所以只有猥琐一点了，反正我是没有想出来。

首先注册一个账号，注册的时候，username很特别。

username设为：admin'#,密码随便设置，但是记住。

<img src="/images/tips_1.png" alt="">

登录之后可以看到，直接到了重新设置密码上面，然后输入新的密码。

将新的密码设置成123123。到这里，并没有发现有什么用。

回到mysql里面看看users表里的内容。

<img src="/images/tips_2.png" alt="">

明明修改的是admin’# 这个账号的密码，为什么admin的密码也被修改成了123123？

首先分析一下执行过程。

在注册的时候会创建用户，成了：

insert into users ( username, password) values("admin\\'#", "123")

但是在写入mysql的时候，单个\是不会被mysql写入的，\表示转义字符。

所以在users表里面会插入一条记录，为 admin'#,123

然后在修改密码的时候，最后的语句为：

UPDATE users SET PASSWORD='123123' where username='admin'#' and password='123'

所以，最后执行的语句会将admin的密码修改为123123。

但是你不能建立一个账号叫：‘ or 1=1 #

它会被识别为： \’ or 1=1 #

在做创建的时候，是会写入一条账号的的记录，是’ or 1=1 #,

但是你在登录的时候,同理的你的输入也会被转义特殊字符。就成了这样：

SELECT * FROM users WHERE username='\\' or 1=1 #' and password='123'

在username=‘\’，这个是不能被mysql成功执行的。

看下面的例子：

<img src="/images/tips_3.png" alt="">

<img src="/images/tips_4.png" alt="">

每一个'都会被转义成 \'，那么在登录的时候，语句就无法被正常执行。