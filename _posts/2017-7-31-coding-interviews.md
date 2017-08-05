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



### Question 3 替换空格

	请实现一个函数，把字符串的每个空格替换成“%20”。例如输入“We are happy”，则输出“We%20are%20happy”。

这个题目用 Python 做起来就十分简单了，如果写的代码比较 Pythonic 的话就是：

{% highlight python %}
# -*- coding:utf-8 -*-

def replace(input_str):
	return input_str.replace(' ', '%20')


if __name__ == '__main__':
	print replace("We are happy")


{% endhighlight %}

因为在 Python 里面，str 类型的数据是 immutable ，一旦对象产生之后就无法进行修改。

所以，不能以操作数组的方式操作 str 对象的每个字符。

###### 貌似用 Python 做《剑指 Offer》上面的题目，感觉都没有涉及到很多基础的，所以部分题目考虑跳过。


### Question 8 旋转数组的最小数字

	把一个数组最开始的若干个元素搬到数组的末尾，我们称之为数组的旋转。输入一个递增排序的数组的一个旋转，输出旋转数组的最小元素。例如数组{3, 4, 5, 1, 2}为{1, 2, 3, 4, 5}的过一个旋转，该数组的最小值为 1。

其实这就是一个 二分查找 的变异。

因为原数组是一个递增有序的，所以在旋转之后，分割成两部分也会是有序的，

分割成两部分的子数组，前部分数组一定会大于后部分的数组。所以，这样首先缩小范围，再利用二分进行查找。

{% highlight python %}

# -*- coding:utf-8 -*-

def min(trans_list):
	min_index = 0
	max_index = len(trans_list) - 1

	while min_index <= max_index:
		if max_index - min_index == 1:
			mid_index = max_index
			break
		
		mid_index = (min_index+max_index)/2

		if(trans_list[min_index] <= trans_list[mid_index]):
			min_index = mid_index
		else:
			max_index = mid_index
	return trans_list[mid_index]

if __name__ == '__main__':
	a = [7, 8, 6]
	print min(a)

{% endhighlight %}

和书上的思路有点不一样，中间元素，只可能存在于前面的数组，或者后面部分的数组。

如果中间元素大于 min_index 那么，那么中间元素就是前面部分递增数组的一个数，最小值只会在后面部分，初步估计只能是 中间元素之后，

如果中间元素小于 min_index，那么中间元素不是前面部分的递增数组，中间元素就一定也会大于 max_index。


### Question 9 斐波那契数列

	写一个函数，输入 n，求斐波那契数列的第 n 项。

这个题目很简单，最常见的解法就是递归

{% highlight python %}

# -*- coding:utf-8 -*-

def fib(i):
    if i < 2: return i
    return fib(i-1) + fib(i-2)

if __name__ == '__main__':
	print fib(10)

{% endhighlight %}

但是这样的解法，虽然简单，计算 n 比较大的时候，会因为函数调用栈深度太大，从而影响结果以及最后的输出。

利用动态规划的思路，可以将已经计算过的值进行 cache 存储，这样有利于提高计算速度。

{% highlight python %}

# -*- coding:utf-8 -*-

from functools import wraps

def memo(func):
    cache = {}

    @wraps(func)
    def wrap(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrap

@memo
def fib(i):
	if i < 2: return i
	return fib(i-1) + fib(i-2)

if __name__ == '__main__':
	print fib(10)

{% endhighlight %}

这样执行起来，速度就会非常的快，利用空间换取时间效率。 

可以比较两者在计算 fib(100) 的时间差异。

### Question 11 数值的整数次方

	实现一个函数 f(base, exponent)，求 base 的 exponent 的次方。不得使用库函数。

想到的方法是用二分法来解决，例如求一个 32 次方的数，那么只需要求 16 次方，再进行平方就可以了，以此类推。

最后算法的时间复杂度会是 O(lg(n))。

{% highlight python %}

#coding: utf-8

def power(base, exponent):
	if exponent == 0:
		return 1
	if exponent == 1:
		return base

	result = power(base, exponent/2)
	result *= result

	if (exponent % 2 ==1):
		result *= base

	return result

if __name__ == '__main__':
	print power(2, 5)


{% endhighlight %}

这样，在时间效率上得到了有效的提升。

### Question 12 打印 1 到最大的 n 位数

	输入数字 n，按顺序打印出从 1 到最大的 n 位十进制数。比如输入 3，则打印出 1、2、3 一直到最大的 3 位数即 999。

如果直接根据题目来，这道题目非常简单，但是再考虑大数的情况下，最合适的方法并不是直接用整数作为输出，而是依靠字符串拼接。

{% highlight python %}
#coding: utf-8

from __future__ import print_function

def print_num(number):
	if len(number) == 1:
		print(number)
	else:
		for i in range(len(number)):
			if number[i] != '0':
				break
		print(number[i:])


def print_to_max(count, n, number=''):
	if n <= 0:
		print_num(number)
		return number[:count-n-1]

	for i in '0123456789':
		number += i
		number = print_to_max(count , n-1, number)

	return number[:count-n-1]

if __name__ == '__main__':
	print_to_max(3, 3)

{%  endhighlight %}

利用 print_to_max() 递归的技巧，实现了排列组合，这里主要依靠返回对应长度的字符串，并且适当的时候输出。

其实，更 pythonic 的写法应该是：

{% highlight python %}
#coding: utf-8

from itertools import combinations_with_replacement

if __name__ == '__main__':
	for i in combinations_with_replacement('0123456789', 3):
		print i

{% endhighlight%}

不得不说，

life is short, i need python


### Question 13 在 O(1) 的时间删除链表结点

	给定单向链表的头指针和一个结点指针，定义一个函数在 O(1) 时间删除该节点。

这里描述的指针，就直接可以理解为是一个对象就可以了。

首先用 python 实现一个链表的数据结构。

链表的头结点默认为不存放内容。

{% highlight python %}
#coding: utf-8

class node(object):
	def __init__(self, value, next_node):
		
		self.value = value
		self.next = next_node

def show_link(head):

	p = head.next
	while p is not None:
		print p.value
		p = p.next

def delete_node(head, node):

	if head.next is None:
		return

	if node.next is not None:
		n_next = node.next
		node.value = n_next.value
		node.next = n_next.next
	else:
		p = head.next
		while(p.next != node):
			p = p.next
		p.next = None


if __name__ == '__main__':
	
	e = node('e', None)
	d = node('d', e)
	c = node('c', d)
	b = node('b', c)
	a = node('a', b)
	head = node(None, a)
	show_link(head)
	print '-------------'
	# to delete c in O(1)
	delete_node(head, e)
	show_link(head)

{% endhighlight %}

这里的思路，使用的是直接替换当前需要删除结点的内容，利用当前结点能找到的下一个结点。

需要考虑特殊情况，如果待删除的结点为最后一个结点的话，还是需要遍历一遍链表，找到待删除结点的前一个结点才能解决。

### Question 14 调整数组的顺序使奇数位于偶数前面
	
	输入一个整数数组，实现一个函数来调整该数组中数组的顺序，使得所有奇数位于数组的前半部分，所有偶数位于数组的后半部分。

{% highlight python %}
#coding: utf-8

def swap(num_list):
	i = 0
	j = len(num_list) - 1

	while i < j:
		if num_list[i] % 2 == 0:
			if num_list[j] % 2 == 1:
				num_list[i], num_list[j] = num_list[j], num_list[i]
			else:
				j -= 1
		else:
			i += 1
	return num_list

if __name__ == '__main__':
	a = [1,3,2,4,5]

	b = swap(a)
	print b

{% endhighlight %}

考虑可扩展性，例如要求数组分成两部的条件为，前部分为能被 3 整除，后半部分不能被 3 整除。

这样，将判断条件单独抽象为一个函数。

{% highlight python %}

#coding: utf-8

def divide_2(num):
	if num % 2 == 0:
		return True
	else:
		return False

def divide_3(num):
	if num % 3 == 0:
		return True
	else:
		return False

def swap(num_list, bool_function):
	i = 0
	j = len(num_list) - 1

	while i < j:
		if bool_function(num_list[i]):
			if not bool_function(num_list[j]):
				num_list[i], num_list[j] = num_list[j], num_list[i]
			else:
				j -= 1
		else:
			i += 1
	return num_list

if __name__ == '__main__':
	a = [1,3,4,2,5]

	b = swap(a, divide_2)
	print b

	c = swap(a, divide_3)
	print c

{% endhighlight %}

这样情况下就可以根据不同的条件，对数组进行调整。