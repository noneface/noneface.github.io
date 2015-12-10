---
layout: post
title: matlab/python | 图像多特征融合检索/特征提取(1)
tag: codes
---

<h3>特征提取</h3>

对于图像的特征提取，matlab能提供的库远比python的库全面而且有效。
在此次检索中，用到了两大不同类型的特征：全局特征，局部特征。全局特征，提取的是GIST特征。局部特征，提取的是SIFT特征进行构造BOW。

<h3>GIST特征</h3>

GIST特征的简介:http://www.cnblogs.com/justany/archive/2012/12/06/2804211.html
GIST特征的matlab实现:http://people.csail.mit.edu/torralba/code/spatialenvelope/

在LMgist中，文档写的已经十分清楚了，利用LMgist函数，计算出每张图片的特征向量。经过测试，产生的特征是512维的向量。
由于对matlab不是十分熟悉，一边看着作者提供的文档，一边百度一些matlab的语法问题。写了一个matlab的函数，能够提取传入图片的特征，并保持成文件。检索的工作，就全部放在python中完成。

matlab提取GIST特征代码如下:

{% highlight matlab %}
function  get_gist(imgname)
% Load image
img = imread(imgname);
% GIST Parameters:
clear param
param.orientationsPerScale = [8 8 8 8]; % number of orientations per scale (from HF to LF)
param.numberBlocks = 4;
param.fc_prefilt = 4;
% Computing gist:
gist = LMgist(img, '', param);
disp(gist);
resultName = 'D:\img\image-Retrieval\';
imgname = regexp(imgname,'\','split');
imgname = imgname(3);
resultName = strcat(resultName,imgname);
resultName =regexprep(resultName,'.tif','.gist');
resultName = char(resultName);
fid = fopen(resultName,'w');
for i=1:512
   fprintf(fid,'%d ',gist(i));
end
fclose(fid);
end
{% endhighlight %}

接下来的工作就是将图像库中的图片特征提取出来。又是一个批量化操作的工作，就交给ptyhon来实现。
因为matlab支持在cmd中以命令行的形式调用matlab commond line来运行matlab程序。那么就可以用一行命令来实现matlab的GIST特征提取。
如:matlab -nojvm -nosplash -r "gist_m(''//参数图片名字)；exit"  -nojvm  不运行matlab的图形界面 -nosplash 不显示matlab打开时的图像 -r ""  传入在matlab commond line 里面运行的代码， get_gsit()所写好的提取GIST特征代码，exit运行结束后关闭matlab commond line。

这种自动化的工作，交给python吧。

{% highlight python %}
#coding:utf8
import os
import datetime
import time
def get_all_img():	  #获取所有图片的文件名
	fobj = open("imgName.txt","r")
	AllImg = []
	for line in fobj:
		line = line.rstrip()
		AllImg.append(line)
	return AllImg
def call_matlab(AllImg):  #  利用os.system() 执行cmd中的命令。
	cmmd = 'matlab -nojvm -nosplash -r "'
	get_gist = "get_gist"
	i = 0
	for img in AllImg:
		cmmd +=get_gist+"('"+img+"');"
		if i==10:
			cmmd +='exit"'
			os.system(cmmd)
			time.sleep(4)
			i = 0
			cmmd = 'matlab -nojvm -nosplash -r "'
		i += 1
def main():
	starttime = datetime.datetime.now()
	AllImg = get_all_img()
	call_matlab(AllImg)
	endtime = datetime.datetime.now()
	print endtime-starttime
if __name__ == '__main__':
	main()
{% endhighlight %}

<h3>SIFT特征</h3>

SIFT特征的简介:http://blog.csdn.net/abcjennifer/article/details/7639681
SIFT特征的matlab实现:http://www.vlfeat.org/
在vlfeat中，有matlab的接口，能够提供SIFT特征的提取。
SIFT特征提取的工作就和GIST特征的过程一样了。构造matlab的SIFT特征提取函数，再用python调用cmd中的命令行，调用matlab commond line。
获取到SIFT特征后，接下来就是构造词袋，统计词频做BOvW特征。

<h3>BOvW特征</h3>
由于用SIFT特征提取出来的特征是一个128*keypoints的矩阵。每张图片的keypoints数不固定，对图片相似度计算也有难度。于是引入了BOvW特征，利用kmeans聚类构造词典，统计每张图像的特征词频，对产生的词频进行相似度计算。
python也有提供一个强大的机器学习库，scikit-learn:http://scikit-learn.org/stable/，其中提供了kmeans聚类方法。

实现kmeans聚类代码如下:

{% highlight python %}
#coding:utf8
import os
import numpy as np
from scipy.cluster.vq import *  # 引入scikit learn 中的kmean算法
########  载入之前提取好的每张图的SIFT特征，存入des #############
path = 'sift'
ls = os.listdir(path)
des = []
for l in ls:
	d = []
	fname = path+"\\"+l
	fobj = open(fname)
	for line in fobj:
		line = line.rstrip()
		line = line.split()
		num = []
		for n in line:
			num.append(float(n))
		d.append(num)
	d = np.array(d)
	d = d.T  #  转置矩阵 成为keypoints*128的矩阵
	des.append(d)
print "read file done!"
##############################################################
###############  将des转成numpy中的矩阵，方便构造矩阵计算 #######################
des = np.array(des)
numWords = 1000  #  构建词典词数
descriptors = des[0]
for descriptor in des[1:]:
	descriptors = np.vstack((descriptors,descriptor)) # 构造kmeans计算矩阵
##############################################################################
print "create descriptors done!"
print "Start k-means: %d words, %d key points" %(numWords,descriptors.shape[0])
voc, variance = kmeans(descriptors, numWords, 1) #  开始进行聚类。返回的voc为词典
print "create voc done!"
fname = "voc1000.txt"    #  将词典写入文件
fobj = open(fname,'w')
for row in voc:
	for col in row:
		fobj.write(str(col)+" ")
	fobj.write("\n") 
{% endhighlight %} 

*  到此，词典已经有了，接下来就是对每张图片的词频进行统计，构造bow特征。
*  实现代如下:
{% highlight python %}
#coding:utf8
import os
import numpy as np
import re
from scipy.cluster.vq import *
from sklearn import preprocessing
def load_des(): #  载入每张图片的SIFT特征
	path = 'sift'
	ls = os.listdir(path)
	des = []
	for l in ls:
		d = []
		fname = path+"\\"+l
		fobj = open(fname)
		for line in fobj:
			line = line.rstrip()
			line = line.split()
			num = []
			for n in line:
				num.append(float(n))
			d.append(num)
		d = np.array(d)
		d = d.T  #  转置矩阵 成为keypoints*128的矩阵
		des.append(d)
	print "read file done!"
	return des
def load_voc():  #  载入词典
	fname = "voc1000.txt"
	voc = []
	fobj = open(fname,'r')
	for line in fobj:
		line = line.rstrip()
		line = line.split()
		v = []
		for l in line:
			v.append(float(l))
		voc.append(v)
	voc = np.array(voc)
	return voc
def BOW_imfeatures(voc,des):  # 统计词频
	for x in range(2100):  #  图库中共2100张图片
		im_features = np.zeros((2100,numWords), "float32")
		words, distance = vq(des[x],voc)  # scikit learn中和kmeans配套的算法，http://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.vq.vq.html 计算出在字典中的特征。
		for w in words:
			im_features[x][w] += 1  #  进行对应词的词频统计
	return im_features
def cal_idf_l2(im_features):  #  tf-idf，以及L2归一化方便之后的相似度计算
	nbr_occurences = np.sum( (im_features > 0) * 1, axis = 0)
	idf = np.array(np.log((1.0*2100+1) / (1.0*nbr_occurences + 1)), 'float32')
	im_features = im_features*idf   #  tf-idf
	im_features = preprocessing.normalize(im_features, norm='l2') # 归一化
	return im_features 
if __name__ == '__main__':
	path = "bow"
	des = load_des()
	voc = load_voc()
	im_features = BOW_features(des,voc)
	im_features = cal_idf_l2(im_features)
{% endhighlight %}

综上，图像的特征提取已经完成。
EOF

