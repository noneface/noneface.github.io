---
title: Python class inheritance — C3 Method Resolution Order
layout: post
tag: codes
---

### About

Python 是一门支持多继承的语言。也就说一个子类，可以由多个父类继承而来。

那么在父类的继承方式上，又有不同的特性。

在 Python 2.2 版本及以前，其继承方式为 “深度优先，从左至右”。但是这种方式在某种情况上是会导致子类继承顺序存在[问题](https://mail.python.org/pipermail/python-dev/2002-October/029035.html)。

于是在 Python 2.3 新的版本中，Michele Simionato 提出了一种新的顺序来继承父类，既 C3 Method Resolution Order。

### The C3 Method Resolution Order

#### Problem

![image](/images/MRO-1.png)

{% highlight python %}

o = object
class F(o): pass
class E(o): pass
class D(o): pass
class C(D, F): pass
class B(D, E): pass
class A(B, C): pass

{% endhighlight%}

从 F...A，那么最后A是一个怎么样的继承顺序呢？

#### Inheritance 

##### 1. How to linerazation 

- 首先需要定义 object 的线性化结果：L[object] = obejct
- 那么对于一个继承自 B 的类 F: L[F] = F + merge(L[B], B) = F + L[B]
- 如果这个 B 是 object，那么 L[F] = [Fo]
- 对于一个多继承自 B1B2...BN 的类 C: L[C] = C + merge(L[B1]...L[Bn], B1...BN)

其中取父类线性化结果也是按照一个 从左至右的顺序。

抽象一点这就是一个不断递归的过程，针对当前类是多继承还是单继承，选择不同的线性化方式进行计算。

那么在上面的例子中，相应的线性化结果应该是：

<code>
	L[F] = F + merge(L[o], o) = F + L[o] = [Fo]
	L[E] = E + merge(L[o], o) = E + L[o] = [Eo]
	L[D] = D + merge(L[o], o) = D + L[o] = [Do]
</code>

<code>
	L[C] = C + merge(L[D], L[F], DF) = C + merge(Do, Fo, DF)
	L[B] = B + merge(L[D], L[E], DE) = B + merge(Do, Eo, DE)
	L[A] = A + merget(L[B], L[C], BC) = B + merge( [B + merge(Do, Eo, DE)], [B + merge(Do, Eo, DE)], BC)
</code>

##### 2. How to Merge

- 定义：

	1. 列表中的头：即序列中的第一个元素，如 L[F] 中的第一个元素为 F
	2. 列表中的尾：即序列中的一个元素以后的所有元素， 如 L[F] 中的 o

- 取出 merge 中的第一个列表的头，如果这个元素不在任何列表的尾部，那么将结果加到子类的线性化结果中，并将该元素在其他列表中删除；否则查找下一个列表，判断列表的头是否满足上述条件。重复操作就可以得到最后的线性化结果。

例如：

<code>
	L[C] = C + merge(Do, Fo, DF)  
		// 取出第一个列表 [Do]，那么这个列表的头：D，没有出现在其他列表的尾部
		// 将其加入线性化结果中，并删除在其他列表中包含的 D
		 = C + D + merge(o, Fo, F) 
		// 取出第一个列表 [o]，那么这个列表的头：o，有出现在第二个列表中
		// 那么查找下一个列表 [Fo]，列表的头为：F，没有出现在其他列表的尾部，则加入线性化的结果中，并删除相关元素
		 = C + D + F + merge(o, o)
		// 接下来就是相同的操作，这里需要注意的是：当前取的并不是第一个列表，那么等到有 头 加入到线性化结果中时，下一次选取的仍然是第一个列表
		 = [CDFo]
	L[B] = [BDEo]
</code>

最后在 A 上对 BC 的线性化结果进行 Merge

<code>
	L[A] = A + merge(BDEo,CDFo,BC)  // 取出第一个列表的头 B 进行判断，加入线性化表并且进行删除
	     = A + B + merge(DEo,CDFo,C)  // 第一次尝试取出 D，
	     // 但是第二个列表的尾部包含D，则取下一个列表中的头进行尝试，对 C 进行判断，加入表并删除
	     = A + B + C + merge(DEOo,DFo) // 回到第一个列表，取出D，进行判断，加入表后删除
	     = A + B + C + D + merge(Eo,Fo) // 取出第一个表头：E，判断并添加后删除
	     = A + B + C + D + E + merge(o,Fo)  // 取出 o，但是第二个列表的尾部包含 o，则取出下一个列表中的头 F
	     = A + B + C + D + E + F + merge(o,o) // 取出 o，加入线性化列表
	     = A B C D E F 0
</code>

### Summary

MRO 算是一个 Python 中比较重要的特性，在多类的继承上是最基础的知识。

### Reference

1.[The Python 2.3 Method Resolution Order](The Python 2.3 Method Resolution Order)
2.[[Python-Dev] perplexed by mro](https://mail.python.org/pipermail/python-dev/2002-October/029035.html)
