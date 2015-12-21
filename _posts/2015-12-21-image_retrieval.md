---
layout: post
title: matlab/python | 图像多特征融合检索/特征检索结果融合——Adaptive Fusion(4)
tag: codes
---

<h3>Adaptive Fusion</h3>

简介：http://www.liangzheng.com.cn/CVPR15_query.pdf

该论文作者提出了一种query-adaptive fusion方法。

我对这种方法的理解为：将不同特征检索后的结果曲线，通过一些无关图像对其进行normalize，然后计算每一种特征曲线normalize后的曲线下面积，分配权重，根据权重来组成新的检索结果分数曲线。

论文作者在其论文中描述的比上面我所描述的更为清晰。

该作者提供了实现这一方法的matlab代码，对于matlab并不是很熟悉，于是我就把作者的代码重写成了python的代码。可能会存在一些误差。

作者代码：http://www.liangzheng.com.cn/Project/project_fusion.html

{% highlight python %}
#coding:utf8

import numpy as np 
import os
import re
from sklearn import preprocessing

def allImgName():  #  所有文件名
	fname = 'AllimgName.txt'
	fobj = open(fname)
	Name = []
	for line in fobj:
		line = line.rstrip() 

		Name.append(line)

	return Name

def load_score(path):  #  读取所有检索分数曲线  未排序的结果
	ls = os.listdir(path)
	score = []
	for l in ls:
		query_score = []
		fname = path +'\\'+ l
		fobj = open(fname)
		for line in fobj:
			line = line.rstrip()
			line = line.split()

			for n in line:
				query_score.append(float(n))
		score.append(query_score)
		fobj.close()

	return score

def load_ref(fname):

	ref_score = []

	fobj = open(fname)
	for line in fobj:
		line = line.rstrip()
		line = line.split()
		cur_ref = []
		for n in line:
			cur_ref.append(float(n))
		ref_score.append(cur_ref)

	return ref_score

def dist2(x,c):
	ndata, dimx = x.shape
	ncentres, dimc= c.shape


	if dimx != dimc:
		print 'error'
		os.exit()
	ones1 = []
	ones1.append(np.ones(ncentres))
	ones1 = np.array(ones1)
	ones1 = ones1.T

	ones2 = []
	ones2.append(np.ones(ndata))
	ones2 = np.array(ones2)
	
	sum1 = []
	sum1.append(np.sum(x**2,axis= 1 ))
	sum1 = np.array(sum1)
	sum1 = sum1.T

	sum2 = []
	sum2.append(np.sum(c**2,axis= 1 ))
	sum2 = np.array(sum2)
	sum2 = sum2.T

	n2 = (ones1*sum1).T + (ones2*sum2).T - (np.dot(x,c.T))*2  #  计算reference score和特征检索分数曲线的距离

	return n2

def normalize(score_sorted,ref,topN):

	sn = []
	sn.append(score_sorted)
	sn = np.array(sn)

	score_norm = sn - ref

	s = score_norm[0]
	mins = s[:topN].min()
	maxs = s[:topN].max()
	score_norm = (score_norm - mins  + 0.0000000001)/(maxs-mins+0.0000000001)

	return score_norm  #  分数曲线normalize

if __name__ == '__main__':
	
	topN = 400
	minN = 1
	knn = 10
#	num_Ref = 1000

	#  load bow and gist score
	bow_score = load_score('score\\bow_score')
	bow_score = np.array(bow_score)
	bow_score = preprocessing.normalize(bow_score,norm="l2")

	gist_score = load_score('score\\gist_score')
	gist_score = np.array(gist_score)

	#	load bow and gist reference score
	ref_bow = load_ref('score\\ref_bow_score.txt')
	ref_bow = np.array(ref_bow)

	ref_gist = load_ref('score\\ref_gist_score.txt')
	ref_gist = np.array(ref_gist)

	imgName = allImgName()
	path = 'score\\fusion_score\\'

	for i in range(2100):
		score1 = []
		score1.append(bow_score[i])
		score1 = np.array(score1)

		score2 = []
		score2.append(gist_score[i])
		score2 = np.array(score2)

		score1_sorted = np.sort(-score1)*(-1)
		score2_sorted = np.sort(-score2)*(-1)
		
		dist2_bow = []
		dist2_bow.append(score1_sorted[0,minN:topN])
		dist2_bow = np.array(dist2_bow)

		dist2_gist = []
		dist2_gist.append(score2_sorted[0,minN:topN])
		dist2_gist = np.array(dist2_gist)

		distance1 = dist2(dist2_bow, ref_bow[:,minN-1:topN-1])
		distance2 = dist2(dist2_gist, ref_gist[:,minN-1:topN-1])

		i1 = np.argsort(distance1)
		i2 = np.argsort(distance2)

		ref_bow1 = ref_bow[(i2[0,0])]
		for k in range(1,knn):
			ref_bow1 = np.vstack((ref_bow1,ref_bow[(i2[0,k])]))

		ref_gist1 = ref_gist[(i2[0,0])]
		for k in range(1,knn):
			ref_gist1 = np.vstack((ref_gist1,ref_gist[(i2[0,k])]))

		ref_bow_final = []
		ref_bow_final.append(np.mean(ref_bow1,axis=0))
		ref_bow_final = np.array(ref_bow_final)

		ref_gist_final = []
		ref_gist_final.append(np.mean(ref_gist1, axis=0))
		ref_gist_final = np.array(ref_gist_final)

		norm_bow = []
		norm_bow.append(score1[0,1:])
		norm_bow = np.array(norm_bow)

		norm_gist = []
		norm_gist.append(score2[0,1:])
		norm_gist = np.array(norm_gist)

		score1_normed = normalize(score1_sorted[0,1:],ref_bow_final,topN)	
		score2_normed = normalize(score2_sorted[0,1:],ref_gist_final,topN)	
		
		area1 = np.sum(score1_normed[0,minN:topN]) + 0.000000000001
		area2 = np.sum(score2_normed[0,minN:topN]) + 0.000000000001

		a = [0,0]

		a[0] = (1.0/area1)/(1.0/area1+1.0/area2)
		a[1] = (1.0/area2)/(1.0/area1+1.0/area2)

		print a[0],a[1]
		score = (score1**a[0]) * (score2**a[1])
		

		fname = path + imgName[i]
		fname = re.sub('.tif','.txt',fname)
		fobj = open(fname,'w')

		for s in score[0]:
			fobj.write(str(s)+' ')

		fobj.close()
{% endhighlight %}

由于matlab中，任何数据貌似都是一个矩阵，所以在python中，需要用numpy进行某些转换。

在对LULC这个图像库进行检索的时候，用的reference score是论文作者提供的。

得出融合后的分数后，再进行排序。选出top 10。

最后结果为:

<img src="/images/adaptive-fusion.png" >

融合结果和graph fusion的结果类似。