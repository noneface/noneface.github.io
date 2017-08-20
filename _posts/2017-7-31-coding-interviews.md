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

### Question 15 链表中倒数第 k 个结点
	
	输入一个链表，输出该链表中倒数第 K 个结点。例如一个链表有 6 个结点，从头结点开始它们的值依次是1、2、3、4、5、6，这个链表的倒数第 3 个结点是值为 4 的结点。

一个链表的倒数 k 个结点，正常的解法，需要先走到尾端，然后从末尾回溯，但是单向链表怎么回溯呢？再简单一点的解法，应该就是遍历一遍记住链表长度，再遍历一遍根据 k 确定位置。

效率更高的方法，应该是先初始化一个变量 p 指向为链表的头，在每走一步的情况下，一个计数器 +1，当计数器为 K 的时候，初始化一个指向链表头的变量 q，之后两个变量同时移动，当 p 到链表末尾时，q 就是倒数第 k 个结点。

{% highlight python %}

#coding: utf-8

class node(object):
	def __init__(self, value, next_node):
		
		self.value = value
		self.next = next_node

	def show_link(self):

		p = self.head.next
		while p is not None:
			print p.value
			p = p.next

def find_k(link, k):
	p = link
	q = None
	count = 1

	while p != None:
		if q is not None:
			q = q.next

		if q is None and count == k:
			q = link
		p = p.next
		count += 1

	return q

if __name__ == '__main__':
	e = node('5', None)
	d = node('4', e)
	c = node('3', d)
	b = node('2', c)
	a = node('1', b)

	print find_k(a, 2).value

{% endhighlight %}

类似的问题还有
	
	1. 求链表的中间结点，两个变量，一个变量每次走一个结点，一个变量每次走两个结点。当走到末尾时，慢的结点就是链表中间结点。
	2. 判断单向链表是否成环，同样是两个变量，一个每次走一步，一个每次走两步，看快的结点能否追上慢的结点。

### Question 16 反转链表

	定义一个函数，输入一个链表的头结点，反转该链表并输出反转后链表的头结点。

{% highlight python %}

#coding: utf-8

class node(object):
	def __init__(self, value, next_node):
		
		self.value = value
		self.next = next_node

	def show_link(self):

		p = self.next
		while p is not None:
			print p.value
			p = p.next

def reverser_link(link):
	p = link
	q = link.next
	p.next = None
	while q != None:
		temp = q.next
		q.next = p.next
		p.next = q

		q = temp

	return p

if __name__ == '__main__':
	e = node('5', None)
	d = node('4', e)
	c = node('3', d)
	b = node('2', c)
	a = node('1', b)

	head = node(None, a)

	head.show_link()

	reverse_head = reverser_link(head)
	reverse_head.show_link()

{% endhighlight %}

这种反转也称为原地反转。前提条件是链表的头结点不存放内容，如果考虑头结点存放内容的话，反转就需要再考虑其他的因素。

考虑头结点存放内容的话：

{% highlight python %}

#coding: utf-8

class node(object):
	def __init__(self, value, next_node):
		
		self.value = value
		self.next = next_node

	def show_link(self):

		p = self
		while p is not None:
			print p.value
			p = p.next


def reverse_link(link):
	p_reverse_head = None
	p_node = link
	p_prev = None

	while p_node is not None:
		p_next = p_node.next

		if p_next is None:
			p_reverse_head = p_node

		p_node.next = p_prev

		p_prev = p_node
		p_node = p_next
	return p_reverse_head


if __name__ == '__main__':
	e = node('5', None)
	d = node('4', e)
	c = node('3', d)
	b = node('2', c)
	a = node('1', b)


	a.show_link()
	print '-----'
	a_reverse = reverse_link(a)
	a_reverse.show_link()

{% endhighlight %}

### Question 17 合并两个排序的链表

	输入两个递增排序的链表，合并这两个链表并使新链表中的结点仍然是按照递增排序的。

{% highlight python %}

#coding: utf-8

class node(object):
	def __init__(self, value, next_node):
		
		self.value = value
		self.next = next_node

	def show_link(self):

		p = self
		while p is not None:
			print p.value
			p = p.next


def merge(link_a, link_b):
	
	if link_a is None:
		return link_b

	if link_b is None:
		return link_a

	merge_link = node(None, None)

	if link_a.value > link_b.value:
		merge_link = link_b
		merge_link.next = merge(link_a, link_b.next)
	else:
		merge_link = link_a
		merge_link.next = merge(link_a.next, link_b)	
	return merge_link


if __name__ == '__main__':
	
	f = node(9, None)
	e = node(7, f)
	d = node(6, e)

	c = node(8, None)
	b = node(2, c)
	a = node(1, b)

	merge_link = merge(a, d)

	merge_link.show_link()

{% endhighlight %}

这是利用递归的思想，将问题拆分成各个子问题。

### Question 18 树的子结构

	输入两棵二叉树 A 和 B，判断 B 是不是 A 的子结构。

思路也是利用递归的思想，先从 B 的根结点出发，遍历 A 的结点，找到相同的之后，从左右子结点开始递归遍历。

{% highlight python %}
#coding: utf-8

class BinaryTree(object):
	def __init__(self, value, left, right):
		self.value = value
		self.left = left
		self.right = right


def has_sub_tree(tree_a, tree_b):
	result = False

	if tree_a is not None and tree_b is not None:
		if tree_a.value == tree_b.value:
			result = does_treea_have_treeb(tree_a, tree_b)
		if not result:
			result = has_sub_tree(tree_a.left, tree_b)
		if not result:
			result = has_sub_tree(tree_a, tree_b.left)
	return result

def does_treea_have_treeb(tree_a, tree_b):
	if tree_b is None:
		return True
	if tree_a is None:
		return False

	if tree_a.value != tree_b.value:
		return False

	return does_treea_have_treeb(tree_a.left, tree_b.left) \
			and does_treea_have_treeb(tree_a.right, tree_b.right)

if __name__ == '__main__':
	
	a_4 = BinaryTree(4, None, None)
	a_7 = BinaryTree(7, None, None)
	a_2 = BinaryTree(2, a_4, a_7)

	a_9 = BinaryTree(9, None, None)

	a_8 = BinaryTree(8, a_9, a_2)
	a_7 = BinaryTree(7, None, None)
	a_root = BinaryTree(8, a_8, a_7)

	b_9 = BinaryTree(9, None, None)
	b_2 = BinaryTree(2, None, None)
	b_root = BinaryTree(8, b_9, b_2)

	print has_sub_tree(a_root, b_root)

{% endhighlight %}

### Question 19 二叉树的镜像

	请完成一个函数，输入一个二叉树，该函数输出她的镜像

{% highlight python %}
#coding: utf-8

class BinaryTree(object):
	def __init__(self, value, left, right):
		self.value = value
		self.left = left
		self.right = right

	def show(self):
		p = self
		if p is not None:
			print p.value

		if p.left:
			self.left.show()
		if p.right:
			self.right.show()

def trans_tree(tree):

	if tree is None:
		return
	if tree.left is None and tree.right is None:
		return 

	temp = tree.left
	tree.left = tree.right
	tree.right = temp

	if tree.left:
		trans_tree(tree.left)
	if tree.right:
		trans_tree(tree.right)
if __name__ == '__main__':
	
	a_4 = BinaryTree(4, None, None)
	a_7 = BinaryTree(7, None, None)
	a_2 = BinaryTree(2, a_4, a_7)

	a_9 = BinaryTree(9, None, None)

	a_8 = BinaryTree(8, a_9, a_2)
	a_7 = BinaryTree(7, None, None)
	a_root = BinaryTree(8, a_8, a_7)

	b_9 = BinaryTree(9, None, None)
	b_2 = BinaryTree(2, None, None)
	b_root = BinaryTree(8, b_9, b_2)

	a_root.show()
	trans_tree(a_root)
	print '----'
	a_root.show()	

{% endhighlight %}

同样是把问题划分成子问题解决。


### Question 29 数组中出现次数超过一半的数字

	数组中有一个数字出现的次数超过数组长度的一半，请找出这个数字。例如输入一个长度为 9 的数组 {1， 2， 3， 2， 2， 2， 5，4，2}。由于数字 2 在数组张出现了 5 次，超过数组长度的一半，因此输出2。

有两种解法，一种是基于快排里面的 Partition，选定一个数，如果这个数字的下标刚刚好是 n/2，那么因为已经将数进行分块，所有比 这个数小的数字，都在其左边，比这个数字大的，都在右边，再加上重复出现次数超过数组的一半，所以中间这个数一定是出现次数超过一半的数字。

还有一种解法，因为数组有一个数字出现的次数超过数组长度的一半，也就是说它出现的次数比其他所有数字出现的次数的和还要多。因此我们可以考虑在遍历数组的时候保存两个值：一个是数组中的数字，一个是次数。当我们遍历到下一个数字的时候，如果下一个数字和我们之前保存的数字相同，则次数加 1 ，如果下一个数字和我们之前保存的数字不同，则次数减 1，如果次数为 0，我们需要保存一下个数字，并把次数设为 1。最后的数字，就是我们需要找到的次数。

具体实现：

{% highlight python %}

# coding: utf-8

def more_than_half(num):
	result = num[0]
	count = 1

	for i in num[1:]:
		if count == 0:
			result = i
			continue

		if i == result:
			count += 1
		else:
			count -= 1
	return result

if __name__ == '__main__':
	
	a = [1, 2, 3, 2, 2, 2, 5, 4, 2, 4, 4, 4, 4, 4, 4, 4, 4]
	num = more_than_half(a)
	print num

{% endhighlight %}

### Question 30 最小的 k 个数

	输入 n 个整数，找出其中最小的 k 个数，例如输入 4，5，1，6，2，7，3，8 这 8 个数字，则最小的 4 个数字是 1，2，3，4

一个时间复杂度为 O(nlogk) 的解法。

使用一个大小为 k 的容器来存储最小的 k 个数字，对于每次输入的数，如过容器中数字少于 k 个，则直接把输入的数放入容器，如果容器中已经有 k 个数，则从容器中取出最大数，与输入数比比较，如果输入的数大于容器中最大数，则丢弃输入的数，否则替换容器中的最大数。

在这个方法中，比较重要的一点就是实现一个容器，便于我们取出容器中的最大数。

{% highlight python %}

# coding: utf-8

import heapq

if __name__ == '__main__':
	a = [4,5,1,6,2,7,3,8]

	print heapq.nsmallest(3, a)

{% endhighlight %}

### Question 31 连续子数组的最大和

	输入一个整型数组，数组里面有正数也有负数，数组中一个或连续的多个整数组成一个子数组。求所有子数组的和的最大值。要求时间复杂度为 O(n)

可以使用动态规划来解决这个问题。
			
			pData[i] i=0 or f(i-1)<=0
	f(i) = 
			f(i-1) + pData[i] i!=0 and f(i-1)>0

简单的理解为，要求 n 个数字的数组的最大子数组，那么可以先求 n-1 个数字的数组的最大子数组，这样不断递推下去。

{% highlight python %}
# coding: utf-8

# coding: utf-8


def sum_max(num):

	result = [0] * len(num)

	for i in range(len(num)):
		if i == 0 or result[i-1] <= 0:
			result[i] = num[i]
		if i != 0 and result[i-1] > 0:
			result[i] = result[i-1] + num[i]
	return result

if __name__ == '__main__':
	a = [1, -2, 3, 10, -4, 7, 2, -5]

	b = sum_max(a)

	max_i = 0
	for i in range(len(b)):
		if b[i] > b[max_i]:
			max_i = i
	print b[max_i]  # 子数组最大

	max_num = b[max_i]

	list_s = []
	while max_num != 0:
		max_num -= a[max_i]
		list_s.append(a[max_i])
		max_i -= 1
	print list_s  # 构成最大子数组的数组

{% endhighlight %}