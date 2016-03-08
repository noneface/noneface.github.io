---
layout: post
title: matlab/python | 图像多特征融合检索/CNN特征(5)
tag: codes
---

<h3>MatconvNet</h3>

[MatConvNet](http://www.vlfeat.org/matconvnet/)是一款基于matlab开源的卷积神经网络工具包，并且提供了多种pre—trained models。更多详细资料，自己google。

<h3>关于MatConvNet的配置</h3>

[请参考](http://yongyuan.name/blog/image-retrieval-using-MatconvNet-and-pre-trained-imageNet.html)

[或者官网](http://www.vlfeat.org/matconvnet/quick/)

<h3>pre-traine models选取</h3>

1.imagenet-googlenet-dag.mat
2.imagenet-vgg-m.mat
3.imagenet-vgg-verydeep-16.mat

<h3>特征提取</h3>

因为需要利用到之前完成的两种特征融合，所以将所有图片的特征保存到同一文件中，方便使用。

<h5>imagenet-vgg-m.mat</h5>

{% highlight matlab %}
run ./matconvnet-1.0-beta17/matlab/vl_setupnn
net = load('imagenet-vgg-m.mat');
addpath('LULC');
imgFiles = dir('LULC');
imgNamList = {imgFiles(~[imgFiles.isdir]).name};
imgNamList = imgNamList';
numImg = length(imgNamList);
feat = [];
for i =1:numImg
   img = imread(imgNamList{i, 1});

   if size(img, 3) == 3
       im_ = single(img) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = im_ - net.meta.normalization.averageImage ;
       res = vl_simplenn(net, im_) ;
       % viesion: matconvnet-1.0-beta17
       featVec = res(17).x;
       featVec = featVec(:);
       feat = [feat; featVec'];
   else
       im_ = single(repmat(img,[1 1 3])) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = im_ - net.meta.normalization.averageImage ;
       res = vl_simplenn(net, im_) ;
       
       % viesion: matconvnet-1.0-beta17
       featVec = res(17).x;
       featVec = featVec(:);
       feat = [feat; featVec'];
   end

end
resultName = 'D:\img\image-Retrieval\cnn\vgg_m.txt';
fid = fopen(resultName,'w');
[r,c] = size(feat);
for k = 1:r
    for j = 1:c
        fprintf(fid,'%f ',feat(k,j));
    
    end
    fprintf(fid,'\n');
end
{% endhighlight %}

<h5>imagenet-googlenet-dag.mat</h5>

{% highlight matlab %}
run ./matconvnet-1.0-beta17/matlab/vl_setupnn
modelPath = 'imagenet-googlenet-dag.mat' ;
net = dagnn.DagNN.loadobj(load(modelPath)) ;
addpath('LULC');
imgFiles = dir('LULC');
imgNamList = {imgFiles(~[imgFiles.isdir]).name};
imgNamList = imgNamList';
numImg = length(imgNamList);
feat = [];
for i =1:numImg
   img = imread(imgNamList{i, 1});

   if size(img, 3) == 3
       im_ = single(img) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = im_ - net.meta.normalization.averageImage ;
       net.eval({'data', im_}) ;
       % viesion: matconvnet-1.0-beta17
       featVec = net.vars(152).value;
       featVec = featVec(:);
       feat = [feat; featVec'];
   else
       im_ = single(repmat(img,[1 1 3])) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = im_ - net.meta.normalization.averageImage ;
       net.eval({'data', im_}) ;
       % viesion: matconvnet-1.0-beta17
       featVec = net.vars(152).value;
       featVec = featVec(:);
       feat = [feat; featVec'];
   end
end
resultName = 'D:\img\image-Retrieval\cnn\googlenet.txt';
fid = fopen(resultName,'w');
[r,c] = size(feat);
for k = 1:r
    for j = 1:c
        fprintf(fid,'%f ',feat(k,j));
    
    end
    fprintf(fid,'\n');
end

{% endhighlight %}

<h5>imagenet-vgg-verydeep-16.mat</h5>

{% highlight matlab %}
run ./matconvnet-1.0-beta17/matlab/vl_setupnn
net = load('imagenet-vgg-verydeep-16.mat');
addpath('LULC');
imgFiles = dir('LULC');
imgNamList = {imgFiles(~[imgFiles.isdir]).name};
imgNamList = imgNamList';
numImg = length(imgNamList);
feat = [];
for i =1:numImg
   img = imread(imgNamList{i, 1});
    fprintf('%s is extract cnn.\n',imgNamList{i,1});
   if size(img, 3) == 3
       im_ = single(img) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = bsxfun(@minus,im_,net.meta.normalization.averageImage) ;
       res = vl_simplenn(net, im_) ;
       % viesion: matconvnet-1.0-beta17
       featVec = res(33).x;
       featVec = featVec(:);
       feat = [feat; featVec'];
   else
       im_ = single(repmat(img,[1 1 3])) ; % note: 255 range
       im_ = imresize(im_, net.meta.normalization.imageSize(1:2)) ;
       im_ = bsxfun(@minus,im_,net.meta.normalization.averageImage) ;
       res = vl_simplenn(net, im_) ;
       
       % viesion: matconvnet-1.0-beta17
       featVec = res(33).x;
       featVec = featVec(:);
       feat = [feat; featVec'];
   end
end
resultName = 'D:\img\image-Retrieval\cnn\vgg_vd.txt';
fid = fopen(resultName,'w');
[r,c] = size(feat);
for k = 1:r
    for j = 1:c
        fprintf(fid,'%f ',feat(k,j));
    
    end
    fprintf(fid,'\n');
end

{% endhighlight %}

<h3>检索</h3>

{% highlight python %}
#coding:utf8
import os
import numpy as np
import re
from sklearn import preprocessing

def load_features():

	fobj = open('vgg_vd.txt')
	im_features = []
	for line in fobj:
		line = line.rstrip()
		line = line.split()	
		
		im_feature = []
		for l in line:
			im_feature.append(float(l))
		
		im_features.append(im_feature)

	im_features = np.array(im_features)
	im_features = preprocessing.normalize(im_features, norm='l2')
	return im_features

def match_all(query_feature,im_features):
	score = np.dot(query_feature, im_features.T)
	rank_ID = np.argsort(-score)
	return rank_ID

def get_img_id():

	filename = "AllimgName.txt" # 所有图片文件名的txt文件
	fobj = open(filename)
	AllimgName = []
	for line in fobj:
		line = line.rstrip()
		AllimgName.append(line)
	return AllimgName

if __name__ == '__main__':
	path = 'result'
	AllimgName = get_img_id()
	feat = load_features()
	im_features = feat
	a = 0
	for im in feat:
		rank_ID = match_all(im,im_features)
		name = AllimgName[a]
		real_name = re.sub(r'.tif','.txt',name)
		id_name = re.sub(r'.tif','_id.txt',name)

		real_name = path+'\\'+ 'vgg_vd\\'+'name' +'\\'+ real_name
		id_name = path +'\\'+ 'vgg_vd\\'+'id' +'\\'+ id_name
		fobj1 = open(real_name,"w")
		fobj2 = open(id_name,"w")

		for i in rank_ID:
			 fobj1.write(AllimgName[i]+'\n')
			 fobj2.write(str(i)+' ')
		fobj1.close()
		fobj2.close()
		a += 1
{% endhighlight %}

由于之后需要用到Graph融合，而Graph融合需要用到照片的id，所以顺便把id也保存下来。
关于其他模型的检索，直接修改载入的模型和最后结果的保存路径就ok了。

**结果**

<img src="/images/cnn1.png" alt="">

<h3>融合</h3>

基于之前的融合代码，进行Graph和adaptive融合。

<img src="/images/cnn2.png" alt="">

<h3>微调</h3>

<h5>1.对自己的数据构建imdb.mat</h5>

在matconvnet中，官方指定的一种文件格式。
然而在matconvnet中的examples中，看不懂它是如何生成了imdb.mat文件。
之后google到了一篇相关的[论文](http://www.cc.gatech.edu/~hays/compvision/proj6/)，找到了生成方法。

{% highlight matlab %}
function imdb =setup_data(averageImage)
%code for Computer Vision, Georgia Tech by James Hays

%This path is assumed to contain 'test' and 'train' which each contain 15
%subdirectories. The train folder has 100 samples of each category and the
%test has an arbitrary amount of each category. This is the exact data and
%train/test split used in Project 4.
SceneJPGsPath = 'data/LULC/';

num_train_per_category = 80;
num_test_per_category  = 20; %can be up to 110
total_images = 21*num_train_per_category + 21 * num_test_per_category;

image_size = [224 224]; %downsampling data for speed and because it hurts
% accuracy surprisingly little

imdb.images.data   = zeros(image_size(1), image_size(2), 1, total_images, 'single');
imdb.images.labels = zeros(1, total_images, 'single');
imdb.images.set    = zeros(1, total_images, 'uint8');
image_counter = 1;

categories = {'agricultural', 'airplane', 'baseballdiamond', 'beach', ...
              'buildings', 'chaparral', 'denseresidential', ...
              'forest', 'freeway', 'golfcourse', 'harbor', ...
              'intersection', 'mediumresidential', 'mobilehomepark', 'overpass',...
              'parkinglot','river','runway','sparseresidential','storagetanks','tenniscourt'};
          
sets = {'train', 'test'};

fprintf('Loading %d train and %d test images from each category\n', ...
          num_train_per_category, num_test_per_category)
fprintf('Each image will be resized to %d by %d\n', image_size(1),image_size(2));

%Read each image and resize it to 224x224
for set = 1:length(sets)
    for category = 1:length(categories)
        cur_path = fullfile( SceneJPGsPath, sets{set}, categories{category});
        cur_images = dir( fullfile( cur_path,  '*.tif') );
        
        if(set == 1)
            fprintf('Taking %d out of %d images in %s\n', num_train_per_category, length(cur_images), cur_path);
            cur_images = cur_images(1:num_train_per_category);
        elseif(set == 2)
            fprintf('Taking %d out of %d images in %s\n', num_test_per_category, length(cur_images), cur_path);
            cur_images = cur_images(1:num_test_per_category);
        end

        for i = 1:length(cur_images)

            cur_image = imread(fullfile(cur_path, cur_images(i).name));
            cur_image = single(cur_image);
            cur_image = imresize(cur_image, image_size);
            
            %cur_image = bsxfun(@minus,cur_image,averageImage) ;
            cur_image = cur_image - averageImage;
            
            if(size(cur_image,3) > 1)
                fprintf('color image found %s\n', fullfile(cur_path, cur_images(i).name));
                cur_image = rgb2gray(cur_image);
                
            end
           
            
            % Stack images into a large 224 x 224 x 1 x total_images matrix
            % images.data
            imdb.images.data(:,:,1,image_counter) = cur_image; 
            
            imdb.images.labels(  1,image_counter) = category;
            imdb.images.set(     1,image_counter) = set; %1 for train, 2 for test (val?)
            
            image_counter = image_counter + 1;
        end
    end
end

{% endhighlight %}

将函数返回的imdb保存就ok了。

<h5>2.fine tune</h5>

关于对pre-trained models进行fine tune，目前只完成了对imagenet-vgg-verydeep-16.mat和imagenet-vgg-m.mat两种模型的微调，对应googlenet这个模型，任然存在问题。

{% highlight matlab %}
function [net,info] = fine_tune()
run ./matconvnet-1.0-beta17/matlab/vl_setupnn;

imdb = load('imdb.mat');
net = load('imagenet-vgg-verydeep-16.mat');
opts.train.expDir = fullfile('data','vd0.005') ;

net.layers = net.layers(1:end-2);
net.layers{end+1} = struct('type', 'conv', ...
'weights', {{0.005*randn(1,1,4096,102, 'single'), zeros(1,102,'single')}}, ...
'learningRate', [0.005,0.002], ...
'stride', [1 1], ...
'pad', [0 0 0 0]) ;

opts.train.batchSize = 20 ;
opts.train.learningRate = logspace(-4, -5.5, 300) ;
opts.trian.numEpochs = numel(opts.train.learningRate) ;
opts.train.continue = true ;

net.layers{end+1} = struct('type', 'softmaxloss') ;
    
[net, info] = cnn_train(net, imdb, @getBatch, ...
    opts.train,...
    'val', find(imdb.images.set == 2)) ;
save('fine_tune.mat','-struct', 'net')
end

function [im, labels] = getBatch(imdb, batch)
%getBatch is called by cnn_train.
im = imdb.images.data(:,:,:,batch) ;

labels = imdb.images.labels(1,batch) ;
end

{% endhighlight %}

更多fine tune 信息[请参考](https://github.com/vlfeat/matconvnet/issues/218)

<h5>结果</h5>

<img src="/images/cnn3.png" alt="">

相对来说，微调结果的提升幅度并没有adaptive fusion产生的结果好。

<h3>总结</h3>

<h5>关于两种融合</h5>

就我对两种融合方法的理解，认为adaptive fusion这种方法更适合进行mAP计算标准的结果融合，从最后结果来看也是一致的。

在Graph fusion中，存在最致命的一点就是，在融合过程中，需要对两种或多种的融合结果进行一次公共子图的计算，那么在这次寻找过程中，必然不会包括对所有图片(2100幅图片)的排序(由于mAP是对相关图片分散在整个检索结果中的排序有关，[关于mAP请参考](http://yongyuan.name/blog/evaluation-of-information-retrieval.html))。这样就一定程度的限制了它的mAP结果。

<h5>之后</h5>

对于图像检索这一块做的也差不多了，就差一个关于googlenet模型微调没完成，目前已经提交了一个issues到了github上，还没有回复。

做完这些我能利用它们来干点什么？

<h6>自己有想着利用空闲时间来做一个小项目:提交一张照片，然后告诉你图像里面的内容是什么。</h6>

<h6>相关的知识:</h6>

估计首先得获取到一定量的已经标记好了的图片，比如从wikipedia或者百度百科中爬取足够多的数据，然后对图片数据进行特征提取，构建成自己的数据库。

然后有空也对这些写好的代码进行review和重写，目前写的代码的可读性依旧很差，隔一段时间就看不懂自己写的代码。

EOF