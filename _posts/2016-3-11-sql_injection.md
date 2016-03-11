---
layout: post
title: sql注入
tag: codes
---

<h2>sql注入</h2>

好不容易找到一点方法，开始入门了，从sql注入开始学习。

在github上有一个开源的sql注入学习框架，[sqli-labs](https://github.com/Audi-1/sqli-labs)，利用的是PHP+Mysql。
clone框架到了woobuntu上，并且配置好环境(apache2+php+mysql)。
正好可以学习一点php和mysql的知识。

<h2>开始</h2>

<h4>GET - Error based - Single quotes - String</h4>

进入网页，提示input the id as parameter。

那么就在url后面加上?id=1。

结果返回：

<img src="/images/sql_1.png">

这是正常提交数据的结果，而题目说Single quotes，那么我们在后面加上一个" ' "单引号。

提交数据：?id=1'

结果返回：

<img src="/images/sql_2.png">

报错。
<code> ''1'' LIMIT 0,1'	</code>
根据报错来看，是多加了一个引号导致语句提前闭合。第一个和最后一个引号为报错时自动提供的，第二个和第四个引号为php处理加上的，第三个引号为提交上去的。

可以根据php代码来看，构成sql语句的代码为<code>$sql="SELECT * FROM users WHERE id='$id' LIMIT 0,1";</code>,在提交数据后，完整的语句应该是<code>SELECT * FROM users WHERE id='1'' LIMIT 0,1</code>。

想要正确的执行这条语句，那么必须去掉后面多余的语句。既然没有做任何的过滤，那么就能够提交'#'或者'--'，这两个符号在mysql中，都是表示注释到行尾。但在url中，不能直接提交'#'符号，需要经过urlencode，也就是提交'%23'。'--'在mysql中的限制就是至少在这个符号前面或后面得有空格。

那现在可以提交数据：?id=1'%23 

结果返回：

<img src="/images/sql_1.png">

<h5>利用</h5>

这样，我们就可以绕过sql语句的限制，插入我们想要的语句。
比如：?id=1'%23 union select 1,2,3
先找出表字段有几个。之后再用：?id=1' union select 1,2,table_name from information_schema.tables%23，以及：?id=1' union select 1,2,column_name from information_schema.columns%23，理论上这样表名和列名都能获取了。不过在这个例子中，php代码里面有做限制，只能读取mysql语句执行后返回结果的第一条记录，我们可以这样做修改：

{% highlight php %}

while($row = mysql_fetch_array($result)){

	echo "<font size='5' color= '#99FF00'>";
	echo 'Your Login name:'. $row['username'];
	echo "<br>";
	echo 'Your Password:' .$row['password'];
	echo "<br>";
	echo "</font>";
}

	if(!$row)
	{
	echo '<font color= "#FFFF00">';
	print_r(mysql_error());
	echo "</font>"; 
	}

{% endhighlight %}

由于$row = mysql_fetch_array($result)只取出返回结果的一条记录，所以用循环来控制将所有的结果返回。

根据表名和列名构造最后的语句:?id=1' union select 1,username,password from users%23

<img src="/images/sql_3.png">

EOF