---
layout: post
tag: codes
title: pytesseract 验证码
---

<h3>用 python + google OCR 进行验证码识别</h3>

<h6>   1.安装 pytesseract</h6>

<code> 
pip install pytesseract
</code>

<h6>   2.安装 google ocr</h6>

<code>
apt-get install tesseract-ocr
</code>

此外,pytesseract要用到PIL库里面的Image,这个也要安装.

<h6> 3.测试代码如下 </h6>

{% highlight python %}
#!/usr/bin/env python
#coding:utf-8
import Image
import pytesseract
im = Image.open('captcha.gif')
text = pytesseract.image_to_string(im)
print text
{% endhighlight %}

<img src='/images/captcha.gif'>
<br>
<br>
<img src='/images/pytesseract_1.png'>

<h6>4. for windows </h6>

windows 下直接执行这个命令会出现split()错误.
google之后,解决方法是:
im=Image.open('xxx')之后,使用:
im.load()
im.split()

这样就可以使用了.


<h6>5. cloudsight</h6>
对了,还可以利用cloudsight提供的api进行图片识别.

比较两种方法.
cloudsight识别准确率很高,不过耗时很长,并且cloudsight只免费提供1000次的识别.

<img src='/images/47j17b.gif'>

<img src='/images/pytesseract_2.png'>

这次存在误差,最后的b被识别为了8.
用tesseract的话,速度快,但是识别不能很准确.存在问题,应该有提高准确的方法.

能识别图片是因为安装了tesseract-ocr.pytesseract依赖于这个应用.
有时间来研究googel的ocr,tesseract这个软件.
