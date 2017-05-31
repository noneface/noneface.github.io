---
layout: post
title: Programming Collective Intelligence(1) Collaborative Filtering
tag: codes
---

	这里是《集体智慧编程》读书笔记系列文章。
	（1） Collaborative Filtering 根据群体偏好，为人们提供推荐。

### Collaborative Filtering

Collaborative Filtering：协作型过滤。通常做法是对一大群人进行搜索，并从中找出与我们品味相近的一群人。算法通过对这些人所偏爱的其他内容进行考查，并将它们组合起来构造出一个经过排名的推荐列表。

也就是说，一个协作型过滤算法就是一个简单的推荐系统。

### Types

#### User-based Collaborative filtering

基于用户的协作型过滤：根据用户查找与其相近的用户，再根据相近用户偏好物品构造一个加权列表。此列表即为推荐列表。

#### Item-based Collaborative filtering

基于物品的协作型过滤：根据用户偏好物品查找与其相近的物品，构造一个加权列表，此列表即为推荐列表。

### General Way

在这里使用一个用户对电影评分的数据。

#### Step 1. Colllecting Preferences

{% highlight python %}

critics = {
    'Lisa Rose': {
        'Lady in the Water': 2.5,
        'Snakes on a Plane': 3.5,
        'Just My Luck': 3.0,
        'Superman Returns': 3.5,
        'You, Me and Dupree': 2.5,
        'The Night Listener': 3.0,
    },
    'Gene Seymour': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 3.5,
        'Just My Luck': 1.5,
        'Superman Returns': 5.0,
        'The Night Listener': 3.0,
        'You, Me and Dupree': 3.5,
    },
    'Michael Phillips': {
        'Lady in the Water': 2.5,
        'Snakes on a Plane': 3.0,
        'Superman Returns': 3.5,
        'The Night Listener': 4.0,
    },
    'Claudia Puig': {
        'Snakes on a Plane': 3.5,
        'Just My Luck': 3.0,
        'The Night Listener': 4.5,
        'Superman Returns': 4.0,
        'You, Me and Dupree': 2.5,
    },
    'Mick LaSalle': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 4.0,
        'Just My Luck': 2.0,
        'Superman Returns': 3.0,
        'The Night Listener': 3.0,
        'You, Me and Dupree': 2.0,
    },
    'Jack Matthews': {
        'Lady in the Water': 3.0,
        'Snakes on a Plane': 4.0,
        'The Night Listener': 3.0,
        'Superman Returns': 5.0,
        'You, Me and Dupree': 3.5,
    },
    'Toby': {
    	'Snakes on a Plane': 4.5,
        'You, Me and Dupree': 1.0,
        'Superman Returns': 4.0
    },
}

{% endhighlight %}

#### Step 2. Finding Similar Users/Items

##### For User-based Collaborative Filtering

如果当前推荐是基于用户的协作型过滤，那么所需要的是根据当前用户的偏好，找到与其相似的用户。

例如在上述例子中，每个用户都有已评价过的电影。通过寻找两个用户共同评论过的电影，根据共同评论过的电影这一偏好，计算两者之间的相似度。

##### For Item-based Collaborative Filtering

如果将上述例子中的数据的 key 和 value 进行交换。也就是这样：

{% highlight python %}

def transform_prefs(prefs):
    result = {}
    for person in prefs:
        for item in prefs[person]:
            result.setdefault(item, {})

            result[item][person] = prefs[person][item]
    return result

{% endhighlight%}

{% highlight python %}

critics = {
	'Lady in the Water': {
		'Lisa Rose': 2.5, 
		'Jack Matthews': 3.0, 
		'Michael Phillips': 2.5, 
		'Gene Seymour': 3.0, 
		'Mick LaSalle': 3.0
	},
	'Snakes on a Plane': {
		'Jack Matthews': 4.0,
		'Mick LaSalle': 4.0, 
		'Claudia Puig': 3.5, 
		'Lisa Rose': 3.5, 
		'Toby': 4.5, 
		'Gene Seymour': 3.5, 
		'Michael Phillips': 3.0
	},
	'Just My Luck': {
		'Claudia Puig': 3.0, 
		'Lisa Rose': 3.0, 
		'Gene Seymour': 1.5, 
		'Mick LaSalle': 2.0
	}, 
	'Superman Returns': {
		'Jack Matthews': 5.0, 
		'Mick LaSalle': 3.0, 
		'Claudia Puig': 4.0, 'Lisa Rose': 3.5, 
		'Toby': 4.0, 
		'Gene Seymour': 5.0, 
		'Michael Phillips': 3.5
	}, 
	'The Night Listener': {
		'Jack Matthews': 3.0, 
		'Mick LaSalle': 3.0, 
		'Claudia Puig': 4.5, 
		'Lisa Rose': 3.0, 
		'Gene Seymour': 3.0, 
		'Michael Phillips': 4.0
	}, 
	'You, Me and Dupree': {
		'Jack Matthews': 3.5, 
		'Mick LaSalle': 2.0, 
		'Claudia Puig': 2.5, 
		'Lisa Rose': 2.5, 
		'Toby': 1.0, 
		'Gene Seymour': 3.5
	}
}

{% endhighlight%}

在两部电影中，寻找共同评论者，对评分向量进行相似度计算。得出与当前物品最相似的物品。

##### How to calculate Simiarity Value

###### Euclidean Distance Score

在坐标轴中，两个点之间的距离：每一个轴向上的差值，求平方后再相加，最后对总和求平方根。

例如：
		Lisa_Rose = [2.5, 3.5, 3.0, 3.5, 2.5, 3.0]
		Gene_Seymour = [3.0, 3.5, 1.5, 5.0, 3.5, 3.0]

		根据用户共同评分过的电影构造向量，计算其之间的欧氏距离

		dis = sqrt(sum((Math.pow(Lisa_Rose[i]-Gene_Seymour[i]),2) for i in range(len(Lisa_Rose))))
			= 2.379
		
		dis = 1/(1 + dis) = 0.294

		在这里需要有一个前提，就是构造的向量是通过两者都有的数据。

这样，计算每一个用户与所有用户的相似度。

#### Step 3. Recommending Items

##### User-based

在基于用户下，需要通过相似的用户，计算一个经过加权的评价值，来给被推荐用户为评价过的一个物品进行评分，而后得出一个根据预估的评分列表，进行推荐。

进行加权计算：

	1. 在相似的用户中，找出相似用户评分过的物品，而该用户未评分过的物品。
	2. 通过用户之间的相似度，以及相似用户对物品的评分，相乘 得出 该用户预计对该物品的评分。
	3. 该用户的相似用户之间可能存在对相同物品进行评分，所有进行加权计算。 将所有的评分/相似用户的相似度值的总和

		评论者	相似度	Night	S.xNight	Lady	S.xLady	Luck	S.xLuck
		Rose	0.99	3.0	2.97	2.5	2.46	3.0	2.97
		Seymourt	0.38	3.0	1.14	3.0	1.14	1.5	0.57
		Puig	0.89	4.5	4.02			3.0	2.68
		Laslle	0.92	3.0	2.77	3.0	2.77	2.0	1.85
		Matthews	0.66	3.0	1.99	3.0	1.99		  
		总计			12.89		8.38		8.07
		Sim.sum			3.84		2.95		3.18
		总计/sim.sum			3.35		2.83		2.53

	所以针对 Night 这一部电影，有相似的用户 Rose/Seymour/Puig/Laslle/Matthews 几个评分过。
	得出的总评分为：12.89，而有这几个相似的用户的相似度总和为：3.84，最后得出的加权平均值则为：3.35

	又比如 Lady 这一部电影，有相似的用户 Rose/Seymour/Laslle/Matthews 评分过。
	所以总评分：8.38， 用户的相似度总和为： 2.95，最后得出的加权平均值为：2.83

得出的推荐列表即为：[('Night', 3.35), ('Lady', 2.83), ('Luck', 2.53)]

##### Item-based

在基于物品的协作型过滤中，与 基于用户的协作型过滤 方法类似。

首先通过计算物品之间的相似度，然后根据用户已评分过的物品，通过用户已评分过的物品，找到相似的物品，进行加权计算，其计算过程和 User-based 类似。

### End

寻找合适的策略记录用户偏好，将用户偏好向量化是一个推荐系统首先需要考虑的问题，而后，才是如何优化协作型过滤算法。使得为用户推荐最合适的。