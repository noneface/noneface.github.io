---
layout: post
title: matlab/python | 图像多特征融合检索/图像检索(2)
tag: codes
---

<h3>图像检索</h3>

在上一篇blog中，已经提取好了图片的GIST特征和BOvW特征。接下来，做的就是根据提取到的特征进行检索。
用到的相似度度量是余弦距离。
针对提取出来的每张图的特征，都是一个向量，所以用余弦距离来检测是否为相似图片是最简单的方法。
举个例子。例如BOvW特征，每张图片经过聚类词频统计后，得到的是一个4600维的向量。
两张图片(x,y)之间的余弦距离可以用它们之间的夹角表示：
<img src="/images/cos.gif" >
这样，cos值的大小，就是图片之间相似性度量的一个值。
在此次检索中，BOvW的词数设为500。由于是计算现有图像的图像库中的相似图片，只需要获取特征进行计算就行了。
<h3>python实现检索代码如下:</h3>

{% highlight python %}
#coding:utf8
import os
import numpy as np
import re
def load_features():  #  载入对应的图片特征
	path = "features_vectors\\bow500-after-l2"  #  特征所在文件夹
	ls = os.listdir(path)
	im_features = []
	for l in ls:
		filename = path+'\\'+l
		fobj = open(filename)
		im_feature = []
		for line in fobj:
			line = line.rstrip()
			line = line.split()		
			for l in line:
				im_feature.append(float(l))
		fobj.close()
		im_features.append(im_feature)
	im_features = np.array(im_features)
	return im_features  #  所有图像库中的图像特征，一个二维矩阵。
def get_query(query_img): #  获取当前查询图像的特征。
	Allimg = 'AllimgName.txt'
	path = "features_vectors\\bow500-after-l2"
	AllimgName = {}
	fobj = open(Allimg)
	for line in fobj:
		line = line.rstrip()		
		name = path+"\\"+line
		fname = re.sub(r'.tif','.bow',name)
		AllimgName[line] = fname
	fobj.close()
	query_name = AllimgName[query_img]
	query_feature  = []
	fobj = open(query_name)
	for line in fobj:
		line = line.rstrip()
		line = line.split()	
		for l in line:
			query_feature.append(float(l))
	query = np.array(query_feature)
	return query_feature #  返回查询图像的特征。
def match(query_feature,im_features): #  计算图片的相似度
	score = np.dot(query_feature, im_features.T)
	rank_ID = np.argsort(-score)  #  根据计算结果进行排序
	return rank_ID #  返回排序后的下标
def get_img_id():
	filename = "AllimgName.txt"
	fobj = open(filename)
	AllimgName = []
	for line in fobj:
		line = line.rstrip()
		AllimgName.append(line)
	return AllimgName
def match_all(): #  计算出图像库中每张图片对应的检索结果
	im_features = load_features()  #  载入所有特征
	AllimgName = get_img_id()  #  将所有图片的名字载入到一个list中，方便用下标检索对应图片。
	path = "result_name\\result500_25"
	###  每张图片作为检索图片，作对应的检索结果。
	for name in AllimgName:
		n = re.sub(r'.tif','.txt',name)  #  构造当前图片检索结果的文件名
		fname = path+'\\'+n		
		fobj = open(fname,"w")
		query_feature = get_query(name)  #  获取当前图片的特征
		rank_ID = match(query_feature,im_features) #  计算相似度
		for i in rank_ID[0:25]:  # 取检索结果的前25张下标。
			fobj.write(AllimgName[i]+'\n') #  写入当前图片检索结果的文件  写入的内容为检索结果的图像名
if __name__ == '__main__':
	match_all()
{% endhighlight %}

以BOvW特征为例，以下是检索结果。
<img src="/images/bow_result.png">

<h3>平均检索准确率计算</h3>

在判断提取的特征是否能够很好的进行检索，利用到平均检索准确率来进行计算。
平均检索准确率，是指，在检索结果中，(检索结果中的同类图片数)/(检索结果图片数)。
又因为这里用到的图像库是一个已经分类好的图像库，图像名的命名也是根据类+数字来命名的。这样只需要根据之前
检索出来的结果，进行正则匹配就行了。
<h3>python实现检索代码如下:</h3>

{% highlight python%}
#coding:utf8
import os
import re
def evaluate(path,n=25.0):
	ls = os.listdir(path)  
	score = [] 
	for l in ls:   #  逐个打开文件夹下的检索结果文件。
		cur_name = l
		fname = path+'\\'+cur_name 
		fobj = open(fname)
		cur_name = re.sub(r'\d\d.txt',"",cur_name)     #  正则匹配名字
		count = 0
		for line in fobj:
			line = line.rstrip()
			result_name = re.sub(r'\d\d.tif',"",line)	
			if(cur_name == result_name):  #  判断类名是否相同。
				count += 1
		score.append((count/n))
	all_score = 0
	for s in score:
		all_score += s
	return all_score/2100.0   #  图像库中共有2100张图片，计算总的平均检索准确率。
if __name__ == '__main__':
	score500 = evaluate("result_name\\result500",)  #  检索结果文件存放文件夹名
	print u"词典数为：500，平均检索准确率为：",score500
{% endhighlight %}

<code>update 2016/3/8</code>

{% highlight python%}
#coding:utf8
import os
import re

def evaluate(path,n=10.0):
	ls = os.listdir(path)

	score = []

	for l in ls:
		cur_name = l
		fname = path+'\\'+cur_name
		fobj = open(fname)
		cur_name = re.sub(r'\d\d.txt',"",cur_name)
		count = 1
		right_count = 0
		s = 0
		for line in fobj:
			line = line.rstrip()
			result_name = re.sub(r'\d\d.tif',"",line)
			if(cur_name == result_name):
				right_count += 1
				s += (right_count/(count*1.0))
			count += 1
		score.append(s*1.0/right_count)
	
	all_score = 0
	for s in score:
		all_score += s

	return all_score/2100.0
if __name__ == '__main__':

	score500 = evaluate("D:\\img\\image-Retrieval\\Graph_fusion\\result_name\\bow",)
	print u"bow，mAP：",score500
{% endhighlight %}

mAP计算方法参考来自:http://yongyuan.name/blog/evaluation-of-information-retrieval.html

到这里，图像的检索以及平均检索准确率的计算已经完成。

EOF
