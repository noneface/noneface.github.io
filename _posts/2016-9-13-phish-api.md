---
layout: post
title: python API for phishing test
tag: codes
---

### About

搜索了一下目前互联网上所有提供网站检测的api。

大致有：

- Google  safe browsing API
(https://developers.google.com/safe-browsing/v4/)

- 金山网址云
(http://code.ijinshan.com/api/devmore4.html#md24)

- phishTank
(https://www.phishtank.com/)

- 腾讯电脑管家  
(http://guanjia.qq.com/online_server/webindex.html)

- 阿里大于
(https://api.alidayu.com/docs/api.htm?apiId=26582)

稍微的简述一下

Google：能够检测网站是否包含恶意软件，

以及检测社会工程学的攻击，其中就包含了钓鱼网站。

金山网址云：可以对网址是否包含恶意内容进行检测。

phishTank：这是一个搜集了很多恶意网址，通过人为处理将恶意网址写入数据库，提供api接口可以做查询。

最后两个api目前还不知道如何使用。

### Python Implements

api接口的调用实现起来也十分的简单。

无非就是http的一些get或者post发生数据，按照api文档的描述提供key或者secret一类的。

这里贴出金山网址云的python api实现。

{% highlight python %}
class jinshan(object):

    """
        jinshan api for phish 

        self.phishes values:
                Unknown   (default)
                not phish 
                phish

    """

    def __init__(self, key, secret):

        self.appkey = key
        self.secret = secret   
        self.signatureString = "/phish/?appkey=%s&q=%s&timestamp=%s"
        self.phishes = "Unknown"

    def verified(self, url):
        requestURL = "http://open.pc120.com/phish/"

        q = base64.b64encode(url)[:-1]
        timestamp = str(time.time())

        sign = self.signatureString % (self.appkey, q, timestamp)

        m = hashlib.md5()
        m.update(sign+self.secret)
        sign = m.hexdigest()     # signature string
        # reference http://code.ijinshan.com/api/devmore4.html#md3

        parameter = {
            "q": q,
            "appkey": self.appkey,
            "timestamp": timestamp,
            "sign": sign
        }

        try:
            res = requests.get(requestURL, params=parameter)
            self.result = json.loads(res.content)
        except Exception, e:
            print "Request Error"
            raise e

    def parse(self):

        """
            respones will look like:
                1.  {"success": 1, "phish":$phish}    1 for success
                2.  {"success": 0, "errno": $errno, "msg": $msg}   0 for error
        """

        result = self.result
        try:
            if result['success'] == 0:
                self.phishes = False
            else:
                if result['phish'] == -1:   
                    self.phishes = "Unknown"
                elif result['phish'] == 0:
                    self.phishes = "not phish"
                else:
                    self.phishes = "phish"
        except Exception, e:
            print "Parse Error"
            raise e

    def test(self):

        self.verified("http://www.vieabcps.com/pe.php")
        self.parse()
        print self.phishes

{% endhighlight %}

金山网址云的api接口主要需要提供key和secret，

可以在上面申请一个账号作为测试。

在signature的处理上就有点坑了。

首先需要进行一个base64的编码，之后还需要对结果进行一个md5的加密。。

神逻辑。。详细的描述可以看官方的文档。

在做几个api测试的时候，手头并没有大量的钓鱼网址做测试，多数都是在phishTank上面找的已检测出的钓鱼网址。

发现一个规律就是，国外的api对国外的网址比较敏感能够识别出来。而对国内的就支持的并不是很好。

如果需要做出大规模的检测的话，可能就需要使用一些其他手段了。

### Test

使用一个国外的钓鱼页面进行测试

"http://www.vieabcps.com/pe.php"

最后提取返回的结果，处理后得到的是Unknown。