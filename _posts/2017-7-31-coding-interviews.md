---
layout: post
title: Coding interviews for Python
tag: codes
---

### About

刷刷题，积累积累些知识准备秋招。

### Question 1 实现 Singleton 模式

单例模式，传统意义上来讲就是只能生成一个实例的类。

在 Python pattern 中，实现 Singleton 模式有不同的方法。

下面有两种不同的解法。

#### 解法 1 传统方法，使用类变量

{% highlight python %}

class Singleton(object):
	_instance = None
	def __new__(cls, *args, **kw):
		if not cls._instance:
			cls._instance = super(Singleton, cls).__new__(cls, *args, **kw)
		return cls._instance

class MyClass(Singleton):
    pass

{% endhighlight %}

类变量，在新建对象的时候检查实例对象是否存在，若存在就直接返回。

这里不能用 __init__ 方法，需要了解:

__new__ 方法在对象创建前调用

__init__ 方法在对象创建成功后调用

只能存在一个实例对象，所以按照顺序，只能够使用 __new__ 方法。

#### 解法 2 Borg  Share states

{% highlight python %}

class Borg:
    _shared_state = {}
    def __init__(self):
        self.__dict__ = self._shared_state

class Singleton(Borg):
    def __init__(self, arg):
        Borg.__init__(self)
        self.val = arg
    def __str__(self): 
 		return self.val

{% endhighlight %}

在这个方法中，由于 Python 所有的属性，都存放在默认的 __dict__中，那么只要让 self.__dict__ 共用同一变量，就能够实现所有新建的对象都是同一个对象的状态。

#### 解法 3 Decorator

{% highlight python %}

def singleton(class_):
    instances = {}
    def getinstance(*args, **kwargs):
        if class_ not in instances:
            instances[class_] = class_(*args, **kwargs)
        return instances[class_]
    return getinstance

@singleton
class MyClass(BaseClass):
    pass

{% endhighlight %}

在装饰器中，相当于存在一个 cache 对象，来存储是否存在当前类的实例对象。


#### 解法 4 Metaclass

{% highlight python %}

class Singleton(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]

#Python2
class MyClass(BaseClass):
    __metaclass__ = Singleton

#Python3
class MyClass(BaseClass, metaclass=Singleton):
    pass

{% endhighlight %}

在使用元类的情况下，让新的类在生成的时候做判断。

元类中, "__new__" 会在你定义类的时候执行, 只执行一次

__call__ 会在你每次实例化的时候调用

https://segmentfault.com/q/1010000007818814  相关参考


### Question 2 二维数组中的查找
	
	在一个二位数组中，每一行都按照从左到右递增的顺序排序，每一列都按照从上到下递增的顺序排序。请完成一个函数，输入这样的一个二维数组和一个整数，判断数组中是否含有该整数。

{% highlight python %}
# -*- coding:utf-8 -*-

def find(m, num):
	row = 0
	col = len(m[0]) - 1

	while row < len(m) and col > 0:
		if m[row][col] == num:
			return True
			break
		elif m[row][col] > num:
			col -= 1
		else:
			row += 1
	return False


if __name__ == '__main__':

	m = [
			[1, 2, 8, 9],
			[2, 4, 9, 12],
			[4, 7, 10, 13],
			[6, 8, 11, 15]
		]

	print find(m, 16)  # False
	print find(m, 7)	# True


{% endhighlight %}

不需要蛮力遍历，因为数组是有规律的。

可以从右上角作为出发点，在右上角下面，都是比当前大的；在右下角左边，都是比右上角小的。（只考虑同行/同列）

所以，比如说查找 7，在数组从 m[0][3] 开始，9 比 7 要大，所以 9 所在的列不可能存在 7，排除第四列（列号为 3）。

在剩下的 m[0..3][0..2] 中查找，也就是从 m[0][2]，开始。同样 8 比 7 大，所以 8 所在的列不能，排除第三列。

在剩下的 m[0..3][0..1] 中查找，也就是从 m[0][1]，开始，2 比 7 小，所以 2 所在的行已经不可能，排除第一行。

在剩下的 m[1..3][0..1] 中查找，也就是从 m[1][1]，开始，4 比 7 小，所以 4 所在的行不可能，排除第二行。

在剩下的 m[2..3][0..1] 中查找，也就是从 m[2][1]，开始，7 等于 7，查找结束。

统计下来，只需要比较 5 次，既可以判断存不存在，最差的情况下，也就只需要比较 8 次左右。