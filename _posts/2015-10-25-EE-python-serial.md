---
layout: post
title: EE/python读取单片机串口实时数据并绘制图像
tag: codes
---

*  作为一个CS专业的学生，突然帮一位EE专业的同学搞起了单片机串口数据的读取绘图，只是因为python太强大了。

<h3>0.准备工作</h3>
*  首先，我们得获取到单片机的串口，然后才能获取的从单片机发送的数据。
*  python有一个叫做pyserial的库。直接通过串口和单片机进行交互。

<h4>安装pyserial</h4>  
<code>pip install pyserial</code>
<h4>pyserial使用方法</h4>
{% highlight python %}
#!/usr/bin/env python
import serial
ser = serial.Serial(COMN)  #COMN 为你的单片机的串口号
ser.read(data_byte)  #从串口读取数据的大小
ser.flushInput()  #清除缓存区的数据
{% endhighlight %}

*  有这几个方法，我们就已经能够正常的获取到串口发来的数据。

<h4>安装matplotlib</h4>
*  其次，将获取到的数据,绘制成实时的数据。
*  又是一个python的库。 matplotlib，绘图功能强大的库。
*  matplotlib库的安装有点麻烦,需要安装部分辅助的库,过程如下。

<code>pip install numpy</code>
<code>pip install pyparsing</code>
<code>pip install pytz</code>
<code>pip install six</code>
<code>pip install python-dateutil</code>
<code>pip install matplotlib</code>

{% highlight python %}
#!/usr/bin/env python
import matplotlib.pyplot as plt
plt.plot([0,3,1,3])  #plt为一个类，plot为绘制成折线图，其中如果只穿一个参数的话，默认为y轴的数据。x轴数据自动调整。
plt.show()
{% endhighlight %}

*  效果是这样的。

*  <img src="./images/figure1.png">

*  如果我们需要做成动态更新的话，需要使用到plt.pause(time),time为绘图时所需要的一个时间，来给figure有时间显示和绘图。
{% highlight python %}
#!/usr/bin/env python
import numpy as np
import matplotlib.pyplot as plt
plt.ion()  #  开启matplotlib的交互模式
plt.xlim(0,30)  #首先得设置一个x轴的区间 这个是必须的
plt.lim(0,1) # y轴区间 
y = []
while True:
	temp = np.random.random() #产生一个0~1之间的随机数
	y.append(temp)  #存入list里面
	plt.plot(y) #将list传入plot画图
	plt.pause(0.01) # 这个为停顿0.01s，能得到产生实时的效果
{% endhighlight %}
*  <img src="./images/figure2.png" ><img src="./images/figure3.png" >

*  接下来只需要把从串口上读取到的数据，传到绘图功能里面。然后进行实时绘图
*  这里接收到的数据是一个加速度传感器发来的加速度。
{% highlight python %}
#!/usr/bin/env python
import numpy as np
import matplotlib.pyplot as plt
import serial
ser = serial.Serial(2)  # 单片机的串口号为3，这里从0开始
plt.ion()  #  开启matplotlib的交互模式
plt.xlim(0,50)  #首先得设置一个x轴的区间 这个是必须的
plt.ylim(-19.58，19.58) # y轴区间 
acc_speed = []
i = 0  #计数。然x轴能到了初始状态的最大值能进行改变
while True:
	ser.flushInput()
	temp =ser.read(6) #读取传来的6个字符
	acc_speed.append(temp)  #存入list里面
	ser.read(1)  #每次传来数据都伴随一个空格。所以直接丢弃
	i += 1
	if i>50:    #初始状态x轴最大为50
		plt.xlim(i-50,i) #  如果当前坐标x已经超过了50，将x的轴的范围右移。
	plt.plot(y) #将list传入plot画图
	plt.pause(0.01) # 这个为停顿0.01s，能得到产生实时的效果
{% endhighlight %}

*  这里有一个产生随机数，实时绘图的例子
{% highlight python %}
import numpy as np
import matplotlib.pyplot as plt
plt.xlim(0,20)
plt.ylim(0,1)
plt.ion()
y = []
i = 0
while True:
    temp = np.random.random()
    i += 1
    y.append(temp)
    if i>20:
    	plt.xlim(i-20,i)
    plt.plot(y)
    plt.pause(0.1)
{% endhighlight %}

*  折腾了一天，终于搞定了。
*  技能树是越点越歪了。