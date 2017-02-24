---
title: Query-Adaptive Late Fusion for Image Search and Person Re-identification -- Read notes
layout: post
tag: codes
---

### About

《Query-Adaptive Late Fusion for Image Search and Person Re-identification》这篇论文中，实现了一种基于 query score fusion 的方法。这里的 query score 事实上就是当前检索图片在数据集中，将检索图片特征与数据集所有图片的特征进行距离计算（余弦/欧式距离），得出的distance既score。

作者提出：针对一张图片，如果某个特征得出的分数曲线，经过排序后是趋于“L”形的，那么这个特征就是一个 Good Feature。相反，某个特征得出的分数曲线，排序后是缓慢下降的，那么这个特征就是一个 Bad Feature。

<img src="/images/query_adaptive_fusion_1.PNG" alt="">

### Detail

#### How to fusion

如何将一幅图片的不同特征，在数据集中检索得出的 scores/distances 进行融合？

作者使用了 product rule 将不同特征得出的scores 融合在一起。

<img src="/images/query_adaptive_fusion_2.PNG" alt="">

在 Eq. 1中，选取 k 种不同特征，得出每种特征下的 scores 值，既 s(i)，通过计算出的Weights 既w(i)进行计算， i=1,2,...,k 。

#### How to calculate weights for each feature

Weights是根据 normalized curves 面积计算得到的值。也就是说，每一张图片不同特征所占的weight是不同的。

<img src="/images/query_adaptive_fusion_3.PNG" alt="">

在 Eq. 2中，A代表 normalized curves面积，若某特征 normalized curves面积越小时，该曲线应该越是趋于“L”形的，也就是一个good feature。根据表达式，其所占的weight也就更大。

#### How to normalize query score

##### Reference score

通过将图片在不相干数据集中进行检索计算score/distance，得出大量的不相干图片检索得出的曲线。

利用这些无关图片得出的曲线，将原始特征曲线尾部score减小。

<img src="/images/query_adaptive_fusion_4.PNG" alt="">

在 Eq. 3中，s(i)为初始的query score，r(i) 为选取的reference score。

##### How to choose reference score

选择一条或多条合适的reference socre，将有效的将初始的query score的尾部score降低，同样也可以使靠前的错误检索的score降低，从而达到一次重新计算score排序的过程。

<img src="/images/query_adaptive_fusion_5.PNG" alt="">

在 Eq. 4中，R为所有reference score的集合，通过计算initial sorted score s(i)和众多reference scores的欧式距离，选择距离最小的一条或几条曲线。

作者在选取reference score curves中，有用到NN/KNN方法。也就是：选取一条下（NN），直接使用；选取k条（KNN），计算k条曲线的均值。

##### normalize socre

<img src="/images/query_adaptive_fusion_6.PNG" alt="">

使用Eq. 3、Eq. 4得出的中间值，得到最终的normalized score curve。

### Summary

作者通过将query score curve进行normalized后，利用under the area of normalized score curve得出weights，最后将不同的特征检索score/distance根据product rule融合成一个新的score/distance，从而达到提升检索结果。

### Reference

1.[Query-Adaptive Late Fusion for Image Search and Person Re-identification](http://www.liangzheng.com.cn/Project/project_fusion.html)