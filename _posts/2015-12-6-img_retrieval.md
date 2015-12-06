---
layout: post
title: matlab/python | 图像多特征融合检索/特征检索结果融合(3)
tag: codes
---

<h3>检索结果构建Graph</h3>

*  之前，已经将两种特征的检索结果存储为文件。现在只需要载入文件，构建rknn的Graph就足够了。

*  <h3>Graph</h3>
*  简介:http://www.research.rutgers.edu/~shaoting/paper/ECCV12-retrieval.pdf
*  在这篇论文中，作者提出了一种构建Graph的方法。在构建rknn的时候，同时对检索结果进行重排。然后在两种特征下的Graph进行融合，得出最后的结果。
*  代码：http://www.research.rutgers.edu/~shaoting/image_search.html
*  作者已经给出Graph构建的代码，只需要稍作修改就可以。

*  首先，构建Graph是根据图片对应的下标。只需要将检索出来的结果，进行转换，转换成id就行。
{% highlight python %}

	#coding:utf8

import os

def set_id():
	fname = 'AllimgName.txt'
	fobj = open(fname,"r")
	count = 0
	Img_id = {}
	for line in fobj:
		line = line.rstrip()
		Img_id[line] = count
		count += 1
	return Img_id

def process_result(Img_id):
	path = "result_name\\result500_100"

	path1 = "result_id\\result500_100"
	ls = os.listdir(path)

	for l in ls:
		fname = path+"\\"+l

		fobj = open(fname)
		fname1 = path1+'\\'+l

		fobj1 = open(fname1,"w")
		for line in fobj:
			line = line.rstrip()

			fobj1.write(str(Img_id[line]))
			fobj1.write(" ")
		fobj1.close()
		fobj.close()

if __name__ == '__main__':
	Img_id = set_id()
	process_result(Img_id)


{% endhighlight %}

*  将所有的图片的文件名写入到一个AllimgName的文件中，然后在进行下标转换的时候，所用文件名都存入一个list中，list对应的下标，就能找到对应的文件名。
*  然后进行构建Graph。

{% highlight python %}

	import numpy
import cPickle
import re
import os

def load_data(fn_result):
    print "Load data"
    path = fn_result
    ls = os.listdir(path)
   
    img_name = []
    result_idx = []
    for l in ls:
        fname = path+'\\'+l
        fd_stdin = open(fname)
        img_name.append(l)
        idx = []
        for line in fd_stdin:
            line = line.rstrip()
            line = line.split()
            for l in line:
            	idx.append(int(l))

	    result_idx.append(idx)
        fd_stdin.close()
	result_length = len(result_idx)
    
    return img_name, result_idx, result_length

def find_reciprocal_neighbors(img_name, result_idx, result_length, fn_result_reranking, fn_folder_graph, search_region, kNN, retri_amount, feature_type):
    print "Find reciprocal neighbors"
    
    # build a reciprocal neighbor graph for each image
    for i in range(result_length): 
        result_graph = {}
        fname = re.sub(r'.tif','.txt',img_name[i])
        fname = fn_result_reranking+'\\'+fname
        fd_stdin_result = open(fname, 'w')

        # 1st layer: choose reciprocal neighbors only
        qualified_list = []
        true_label = result_idx[i][0]
        qualified_list.append(true_label)
        result_graph[result_idx[i][0]] = [[result_idx[i][0], 1.0]]

        for j in range(search_region):
            cur_id = result_idx[i][j+1]
            cur_id_kNN = result_idx[cur_id][1:kNN]
            if result_idx[i][0] in cur_id_kNN:
                qualified_list.append(cur_id)
                
                (result_graph[result_idx[i][0]]).append([cur_id, 1.0])
                result_graph[cur_id] = [[result_idx[i][0], 1.0]]

        # 2nd layer: choose neighbors of reciprocal neighbors
        for j in range(1,len(qualified_list)):
            cur_id = qualified_list[j]
            cur_id_kNN = result_idx[cur_id][0:kNN]
            common_set = set(cur_id_kNN) & set(qualified_list)
            diff_set = set(cur_id_kNN) - set(qualified_list)
            union_set = set(cur_id_kNN) | set(qualified_list)
            # (rule 1: at least half of the close set) or (rule 2: bring less unknown)
            weight = float(len(common_set))/len(union_set) 
            #if (len(common_set)-1) >= (len(qualified_list)-1)/2.0 or len(diff_set) <= (len(common_set)-1):
            if weight > 0.3: # works for 0.1-0.4
                for k in range(1,len(cur_id_kNN)):
                    if cur_id_kNN[k] not in result_graph.keys():
                        result_graph[cur_id_kNN[k]] = [[cur_id, weight]]
                    else:
                        result_graph[cur_id_kNN[k]].append([cur_id, weight])
                    if cur_id_kNN[k] not in qualified_list:
                        qualified_list.append(cur_id_kNN[k])

        # add more images if the candidates are less than the threshold. store them in results_graph[-1]
        if len(qualified_list) <= retri_amount:
            for j in range(1, retri_amount):
                cur_id = result_idx[i][j]
                if cur_id not in qualified_list:
                    qualified_list.append(cur_id)
                    if -1 not in result_graph.keys():
                        result_graph[-1] = [cur_id]
                    else:
                        result_graph[-1].append(cur_id)

        # save the reranking results, same format as the input
        for cur_id in qualified_list:
            fd_stdin_result.write(str(cur_id) + ' ')
        fd_stdin_result.close()
        
        # save graph files for each image
        #img_name_tmp = (img_name[i].split('/'))[-1]
        img_name_tmp = re.sub(r'.txt','',img_name[i])
        fn_graph = fn_folder_graph + img_name_tmp + feature_type
        cPickle.dump(result_graph, open(fn_graph, 'wb'))

if __name__ == '__main__':
   
    search_region = 50
    kNN = 30
    retri_amount = 100
    
    feature_type = '.bow'
    #feature_type = '.gist'

    fn_folder_graph = 'graph\\'

    fn_result_reranking = 'result_id\\result500_100_rerank'
    img_name, result_idx, result_length = load_data("result_id\\result500_100")

    #fn_result_reranking = 'result_id\\result_gist_100_rerank'
    #img_name, result_idx, result_length = load_data("result_id\\result_gist_100")

    find_reciprocal_neighbors(img_name, result_idx, result_length, fn_result_reranking, fn_folder_graph, search_region, kNN, retri_amount, feature_type)


{% endhighlight %}

*  针对原论文作者提供的代码，做了两点修改。
*  1.在原论文中，所有图片的检索结果都存储在同一个文件中，那么只需要读取一次就足够。但是这里由于用到的平均检索准确率的计算，需要保存每张图片检索结果的文件名，并不能直接使用id进行保存。所以，需要一个一个文件去读取检索结果。在这里，将所有的检索结果都利用了load()函数，将结果存入一个result_idx的二维数组里面，每一行是一张图片的检索结果。
*  2.find_reciprocal_neighbors()函数和论文中的保持一致。只是将每一张图片的检索结果，经过rknn计算后重排的产生结果存为一个单一文件，便于之后计算平均检索准确率。
*  这里需要提到几个参数。
*  1.因为我们用到的是融合检索结果，那么所提供的基数，也就是每张图片的GIST特征和BOvW特征的检索结果需要足够的大，然后融合出来的结果会比较满意。
*  2. search_region，这个参数是确定相互近邻的范围，首先在这个范围里面寻找相互近邻。
*  3. knn,这个参数是指在已经确定的每个相互近邻的检索结果里面，去计算与查询图片是相似的图片，这里利用到了Jaccard 系数。

*  这里用到了每种特征检索结果的前100张，在前50张中寻找相互近邻，在每个相互近邻的检索结果的前30张中，去计算Jaccard 系数。
*  之后利用构建的Graph进行融合。

{% highlight python %}


import numpy
import cPickle
import re
import copy

class GraphFusion:

    ########### Method 1: PageRank algorithm centered at the query image.###########
    def Fusion_Graph_Laplacian(self, graph_list, num_ranks, retri_amount, ground_truth):

        # merge all graphs
        initial_graph = graph_list[0]
        for i in range(1, num_ranks):
            cur_graph = graph_list[i]
            cur_keys = cur_graph.keys()
            initial_keys = initial_graph.keys()
            for j in cur_keys:
                if j not in initial_keys:
                    initial_graph[j] = cur_graph[j]
                else:
                    nodes = cur_graph[j]
                    for k in nodes:
                        initial_graph[j].append(k)

        # build Laplacian matrix
        all_keys = initial_graph.keys()
        sorted_keys = list(numpy.sort(all_keys))
        if -1 in sorted_keys:
            sorted_keys.remove(-1) # one key is -1
        matrix_size = numpy.size(sorted_keys) 
        Laplacian = numpy.zeros([matrix_size, matrix_size])
        for cur_key in sorted_keys:
            if cur_key == -1:
                continue
            cur_weights = initial_graph[cur_key]
            neighbors = []
            neighbor_weights = []
            for weight in cur_weights:
                neighbors.append(weight[0])
                neighbor_weights.append(weight[1])
            #neighbors = numpy.unique(neighbors)
            for each_neighbor, each_weight in zip(neighbors, neighbor_weights):
                if sorted_keys.index(cur_key) != sorted_keys.index(each_neighbor):
                    # M[i,j], i is current index, j is i's neighbor
                    Laplacian[sorted_keys.index(cur_key), sorted_keys.index(each_neighbor)] += each_weight #1

        # normalize Laplacian matrix
        for i in range(matrix_size):
            if sum(Laplacian[i,:]) != 0:
            	Laplacian[i,:] = Laplacian[i,:] / sum(Laplacian[i,:])
        rank_vector = numpy.matrix([1.0/matrix_size] * matrix_size)
        rank_vector = numpy.transpose(rank_vector)
        Laplacian = numpy.transpose(Laplacian)
        for i in range(10):
            rank_vector = Laplacian * rank_vector
        rank_set = {}
        idx = 0
        for value in rank_vector:
            rank_set[idx] = value
            idx += 1

        # Solve pagerank, graph Laplacian
        selected_images_tmp = []
        for idx in sorted(rank_set, key=rank_set.get, reverse=True):
            selected_images_tmp.append(sorted_keys[idx])

        selected_images = []
        selected_images.append(ground_truth)
        selected_images_tmp.remove(ground_truth)
        selected_images.extend(selected_images_tmp)

        # Post-process. Add extra results if there is no enough candidate. use voc since it is usually better
        if len(selected_images) < retri_amount:
            voc_candidate = graph_list[1]
            voc_candidate = voc_candidate[-1]
            for i in voc_candidate:
                selected_images.append(i)

        return selected_images[0:retri_amount]

        
    ########### Method 2: find the weighted maximum density subgraph ###########
    def Fusion_Density_Subgraph(self, graph_list, num_ranks, retri_amount):

        # merge all graphs
        initial_graph = copy.deepcopy(graph_list[0])

        for i in range(1, num_ranks):
            cur_graph = graph_list[i]
            cur_keys = cur_graph.keys()
            initial_keys = initial_graph.keys()
            for j in cur_keys:
                if j not in initial_keys:
                    initial_graph[j] = cur_graph[j]
                else:
                    nodes = cur_graph[j]
                    for k in nodes:
                        initial_graph[j].append(k)

        # compute the sum of weights for each vertex
        all_keys = initial_graph.keys()
        weight_sum = {}
        for cur_key in all_keys:
            if cur_key == -1:
                continue
            cur_weights = initial_graph[cur_key]
            for weight in cur_weights:
                if cur_key not in weight_sum.keys():
                    weight_sum[cur_key] = weight[1]
                else:
                    weight_sum[cur_key] += weight[1]

        # select vertices as per the sum of weights
        selected_images = []
        for vertex in sorted(weight_sum, key=weight_sum.get, reverse=True):
            selected_images.append(vertex)

        # Post-process. Add extra results if there is no enough candidate.
        if len(selected_images) < retri_amount:
            voc_candidate = graph_list[1] # 0: hsv or 1000d. 1: voc
            voc_candidate = voc_candidate[-1]
            for i in voc_candidate:
                if i not in selected_images:
                    selected_images.append(i)

        return selected_images[0:retri_amount]

def get_name():
    fname = 'AllimgName.txt'

    fobj = open(fname,"r")


    Img_id = []

    for line in fobj:
        line = line.rstrip()
        Img_id.append(line)

    return Img_id
                
#########################################################
    
if __name__ == "__main__":

    fn_graph_list = 'graph_list.txt'  #  将所有图片构建的Graph文件名写入一个文件。
    fd_stdin = open(fn_graph_list)

    all_graph = []
    for line in fd_stdin:
        line = line.rstrip()
        all_graph.append(line)

    fd_stdin.close()

    path = "result_id\\result_fusion"
    Img_name = get_name()
    
    count = 1
    
    allCount = 0

    for name in Img_name:
        fn_fusion_result = re.sub(r'.tif','.txt',name)
        fn_fusion_result = path+'\\'+fn_fusion_result
        fd_stdin_fusion = open(fn_fusion_result, 'w')

        graphfusion = GraphFusion()

        num_ranks = 2 # in this case, just 2 types of ranks, i.e., voc and hsv
        retri_amount = 10  #  只取融合后的前10张图片
        graph_list = []
        while count < 3:

            path1 = 'graph'
            fn_graph = path1+"\\"+all_graph[allCount]

            if numpy.mod(count, num_ranks) != 0:  #  每张图片有两个graph，需要全部载入进行融合。
                graph_list.append(cPickle.load(open(fn_graph, 'rb')))
                allCount += 1
                count += 1
                continue
            else:
                graph_list.append(cPickle.load(open(fn_graph, 'rb')))
                allCount += 1
                count += 1
            
        graph_list_copy = copy.deepcopy(graph_list)
        selected_images = graphfusion.Fusion_Density_Subgraph(graph_list_copy, num_ranks, retri_amount)
            # Uncomment the next line to use PageRank-based method, but keep the above line as well. We need "selected_images[0]" to define the center of the graph
            #selected_images = graphfusion.Fusion_Graph_Laplacian(graph_list, num_ranks, retri_amount, selected_images[0]) 

        for img_id in selected_images:
            fd_stdin_fusion.write(str(img_id) + ' ') #  写入结果。
        fd_stdin_fusion.close()
        
        graph_list = [] 
        count = 1

{% endhighlight %}

*  到这一步，已经获得了经过融合后的检索结果id，只需要再将id转换成图片名字就可以进行平均检索准确率的计算。

{% highlight python %}

	#coding:utf8

import os

def set_id():
	fname = 'AllimgName.txt'
	fobj = open(fname,"r")
	Img_id = []
	for line in fobj:
		line = line.rstrip()
		Img_id.append(line)	
	return Img_id

def get_name(Img_id):

	path = "result_id\\result_fusion"
	path1 = "result_name\\result_fusion"
	ls = os.listdir(path)

	for l in ls:
		fname = path+'\\'+l

		fname1 = path1+'\\'+l
		fobj1 = open(fname1,"w")
		fobj = open(fname)

		for line in fobj:
			line = line.rstrip()
			line = line.split()
			for l in line:
				fobj1.write(Img_id[int(l)])
				fobj1.write("\n")
        fobj.close()
        fobj1.close()

if __name__ == '__main__':
	Img_id = set_id()
	get_name(Img_id)
            


{% endhighlight %}

*  最后，比较BOvW特征/Gist特征/融合检索三种方法的平均检索准确率。
*  用到上一篇提到的代码。
*  计算结果如下：
*  <img src="/images/fusion_result.png" >

*  EOF