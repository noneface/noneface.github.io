---
title: Huffman Tree
layout: post
tag: codes
---

### About

Huffman 树，又称最优树，是一类带权路径最短的树。

### 最优二叉树

路径长度：从树的一个结点到另一个结点之间的分支构成这两个点之间的路径，路径上的分支数目称作<b>路径长度</b>。

树的路径长度：从树根到每一个结点的路径长度之和。

带权路径长度：从该节点到树根之间的路径长度与结点上权的乘积。

树的带权路径长度：树中所有叶子结点的带权路径长度之和。

### How to build

	1. 根据现有的 n 个权值 T，构成 n 个叶子结点（也可以称为二叉树）的集合 F。
	2. 在 F 中选取两颗根结点的权值最小的树/结点作为左右子树，构造一颗新的二叉树，且新的二叉树的权值为左右子树之和。
	3. 在 F 中去除这两颗树，并且将新的二叉树加入 F 中。
	4. 重复 2、3，直到 F 中只含有一颗树为止。

### Implement In Python

根据书上类 C 伪代码的思路，用 Python 实现了一遍。

实现过程中，与概念存在一点差异：二叉树是直接存放在了一个 List 中，每个结点为 List 中的一个元素。

这样比较容易找到<b>权值最小的两棵二叉树</b>。

在构建过程中，并没有将找到的权值最小的二叉树从 List 中删除，而只是根据有无 parent 属性进行判断是否可用。

构建 Huffman 树的难点在于：如何根据<b>权值</b>以及<b>parent</b>属性是否为空，找到权值小的两棵二叉树。

:P 其实算不上什么难点....

{% highlight python%}

# -*- coding: utf-8 -*-

from random import randint


class TreeNode(object):
    def __init__(self, data, weight):
        self.weight = weight
        self.data = data
        self.parent = None
        self.left = None
        self.right = None


class HuffmanTree(object):

    def __init__(self, datas, weights):
        all_tree_nodes = []
        for index, data in enumerate(datas):
            all_tree_nodes.append(TreeNode(data, weights[index]))

        self.huffman_tree = all_tree_nodes

        m = len(datas) * 2 - 1
        i = len(datas) + 1
        while i <= m:
            min_index = self.select(self.huffman_tree)

            self.huffman_tree[min_index[0]].parent = i
            self.huffman_tree[min_index[1]].parent = i

            weight = self.huffman_tree[min_index[0]].weight + self.huffman_tree[min_index[1]].weight
            node = TreeNode(None, weight)
            node.left = min_index[0]
            node.right = min_index[1]
            self.huffman_tree.append(node)

            i += 1

    def select(self, nodes):

        i = 0
        min_index = []

        while i < len(nodes):
            if nodes[i].parent is None:
                min_index.append(i)
                if len(min_index) == 2:
                    if nodes[min_index[0]].weight > nodes[i].weight:
                        min_index[0], min_index[1] = min_index[1], min_index[0]
                    i += 1
                    break
            i += 1
        while i < len(nodes):
            if nodes[i].parent is None:
                if nodes[min_index[0]].weight > nodes[i].weight:
                    min_index[1] = min_index[0]
                    min_index[0] = i
                    i += 1
                    continue
                if nodes[min_index[1]].weight > nodes[i]. weight:
                    min_index[1] = i
                    i += 1
                    continue
            i += 1

        return min_index

    def show(self):
        for index, node in enumerate(self.huffman_tree):
            print "index: {}, data: {}, weight: {}, parent: {}, left: {}, right: {}".format(
                index, node.data, node.weight, node.parent, node.left, node.right)

if __name__ == '__main__':
    datas = [x for x in "abcdef"]
    weights = [randint(1, 20) for i in range(1, 7)]
    print datas
    print weights
    test = HuffmanTree(datas, weights)
    test.show()

{% endhighlight %}

### Result

#### 构造用例：

![image](/images/huffman_2.png)

#### 构造结果：

![image](/images/huffman_3.png)

#### 图像展示

![image](/images/huffman_1.png)

:( 为什么没有绘制 二叉树 的工具包...

