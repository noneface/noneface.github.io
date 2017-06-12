---
layout: post
title: Font & Encoding In anti-spider and anti-anti-spider
tag: codes
---

### About

上个礼拜想写一篇数据分析类的文章，数据以前已经爬取过了，只不过时间太久，数据的时效性早已经过了。不过好在代码还有保留，还能正常运行，所以偷了个懒，就没去看网站有没有做细节的修改。

中途看了一眼数据库，发现有点不对劲，里面的数据居然有奇怪的编码。

![error](/images/font_1.png)

到对应的页面一看，果然存在很多问题：

![web_page](/images/font_2.png)

其对应的源码是这样的：

![source_page](/images/font_3.png)

还少了很多数字数据没有抓取到。

### Analysis

从源代码里面看到：

![source_page](/images/font_4.png)

在浏览器渲染显示的内容和通过源码读取到的数据，显示的是不一样的。

在源代码中，所有的数字字段，看起来都被编码过了一遍。

其特征是所有编码后的数据前缀都是： &#x，那么这个特殊的前缀是否有其他含义呢？

https://www.zhihu.com/question/21390312

可以参考这个回答，其实 &#x 开头的前缀并不是一种编码方式，这个只是一种转义序列。

比如说： ‘2’ 所对应的 unicode 为 '\u0032'。如果是这样的情况：

![example_page](/images/font_5.png)

就会这样进行显示：

![example_page](/images/font_6.png)

这是因为在浏览器中，通过 unicode 字符集寻找到了对应 '\u0032'。

正常情况下，由服务端产生的数据通过传输由浏览器进行处理，得到的数据再经过浏览器进行渲染。

在当前这种情况下，是源代码无法显示正常的数据，反而在浏览器中得到了正确的渲染结果。

再通过观察这个页面源代码，发现了几处问题：

![example_html](/images/font_7.png)

使用了转义序列的内容上，都使用了一个自定义的 CSS 样式，一种 font 格式。

其对应的样式定义为：

![example_html](/images/font_8.png)

![example_html](/images/font_9.png)

在 src 中，使用了 base64 编码，写入了一段 16 进制的数据。

通过对这段数据进行解码，分析数据内容：

![example_html](/images/font_10.png)

从解码后的内容可以看到，woff 样式的内容，其代表了一种字体格式，Web Open Font Format。

### WOFF

关于 WOFF 文件内容格式，可以参考：

https://en.wikipedia.org/wiki/Web_Open_Font_Format 

https://www.w3.org/TR/WOFF/

通过阅读字体相关的资料，可以知道，字体其也是通过表进行相应的映射，通过特定的一个 unicode 字符代表一个文字内容
，以及对字体样式的具体设计。

接着分析这个字体文件。

![example_html](/images/font_11.png)

可以看到，数字 2 ，其在 unicode 中编码为 '\u0032'。但在这个字体中，其对应的 unicode 被编码成了 '\uf748'，不过其 glyph 的编码依然为标准的 unicode。

正常情况下，字体格式中的 unicode 会与 glyph 一致。

接下来就能够解释，为什么在浏览器中能看到的正确的解析，而在源代码查看中并不能。

这是因为浏览器在渲染过程中，使用了网站提供的字体文件，使得在该情况下，通过字体去解析不是标准的 unicode 字符集，使用字体文件设计的样式，并且得到正确的结果，然而在开发者工具栏里面，其字体并不会主动使用网站提供的字体，所以无法正常显示。

有点像是，通过浏览器字体渲染出的结果，其显示的内容并不是正常的字符，而是一些特殊的图片。

### Decode

因为在字体文件中，glyph 依旧使用的是标准的 unicode，所以就可以理解为 unicode 和 glyph 产生了对应关系。

当要解析一个 特殊的编码的时候：'\uf748'，只需要得到这个编码所对应的 glyph '\u0032'，然后得到的 glyph就是其真实的编码内容。

如何得到 unicode 和 glyph 在当前这个字体的映射关系？

#### Fonttools

这是一个基于 Python 的 字体处理库，https://github.com/fonttools/fonttools。

安装后，使用 ttx -l xxx.woff，可以得出当前字体文件包含什么表内容。

![example_html](/images/font_12.png)

再使用 ttx -t cmap xxx.woff，将所需要的 unicode 和 glyph 表解析出来。

得到一个 xml 文件，里面就包含了当前字体的所有 unicode 和 glyph 的映射。

![example_html](/images/font_13.png)

接下来就可以通过这个 xml 文件进行解码。

{% highlight python %}

# -*- coding: utf-8 -*-
import xml.etree.ElementTree as ET
import sys
import re

def load_map(filename):
    tree = ET.parse(filename)
    root = tree.getroot()
    map_code = root.findall('.//map')

    map_dict = {}

    for charater in map_code:
        attribute = charater.attrib
        name = attribute['name'][3:]

        if len(name) < 4:
            name = '\u' + (4-len(name))*'0' + name
        else:
            name = '\u' + name

        name = eval("u"+"\"" + name + "\"")

        map_dict[attribute['code'][2:]] = name
    return map_dict

if __name__ == '__main__':

    args = sys.argv[1:]

    if len(args) < 2:
        print "Error, useage python fontDecode.py FontFile source"
    filename = args[0]
    map_dict = load_map(filename)
    source = args[1]

    match = re.findall(r"&#x(\w*)", source)
    origin = source.replace("&#x", '')

    for m in match:
        origin = origin.replace(m, map_dict[m])

    print 'source:', source
    print 'decode:', origin


{% endhighlight %}

![example_html](/images/font_14.png)

### Summary

这种的反爬虫思路倒是比较新颖，但是如果只是假设爬虫无法获取正确的数据下，就会停止对该网站的数据爬取是大错特错的。更何况这样只是做了一遍简单的编码。

后来我倒是又想了想，他们开发人员这样做算不算是在进行反爬虫。

如果是为了设计新的字体样式，为什么在字体的设计里面，不按照标准的 unicode 进行设计？而且在字体文件中，只是对部分字体进行了设计。

如果是为了反爬虫，这样的策略下，自己在向浏览器发送响应的时候，需要将数据通过字体文件中的映射表，将标准的 unicode 转换成 表中对应的 glyph，同时又为了让浏览器能够正常渲染，需要提供字体文件。这样就等同于，向对方发送了加密信息，并且提供了加密字典，这不是多此一举么？