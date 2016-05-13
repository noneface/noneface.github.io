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

那能不能建立一个 username=' or 1=1#的账号呢？

这是可以的。

首先在创建用户的过程中：首先是检测是否存在用户

select count(*) from users where username='\\' or 1=1#'

就会创建一个 ' or 1=1#的用户。

然后在登录时

SELECT * FROM users WHERE username='\\' or 1=1#' and password='123'

最后在执行密码更新的时候：

由于username是直接从session里面获取的，那么username=' or 1=1#

到最后执行的update语句就会是：

UPDATE users SET PASSWORD='123123' where username='' or 1=1#' and password='123'

之后mysq里面所有的密码都变成了123123。

<img src="/images/tips_3.png" alt="">