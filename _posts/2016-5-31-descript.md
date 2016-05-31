---
layout: post
title: 简单的js解密
tag: codes
---

在idf的在线训练营里面做了一道js解密的题目。

不算是很难。

{% highlight javascript %}
/**
 * Pseudo md5 hash function
 * @param {string} string
 * @param {string} method The function method, can be 'ENCRYPT' or 'DECRYPT'
 * @return {string}
 */
function pseudoHash(string, method) {
  // Default method is encryption
  if (!('ENCRYPT' == method || 'DECRYPT' == method)) {
    method = 'ENCRYPT';
  }
  // Run algorithm with the right method
  if ('ENCRYPT' == method) {
    // Variable for output string
    var output = '';
    // Algorithm to encrypt
    for (var x = 0, y = string.length, charCode, hexCode; x < y; ++x) {
      charCode = string.charCodeAt(x);
      if (128 > charCode) {
        charCode += 128;
      } else if (127 < charCode) {
        charCode -= 128;
      }
      charCode = 255 - charCode;
      hexCode = charCode.toString(16);
      if (2 > hexCode.length) {
        hexCode = '0' + hexCode;
      }
      
      output += hexCode;
    }
    // Return output
    return output;
  } else if ('DECRYPT' == method) {
    // DECODE MISS
    // Return ASCII value of character
    return string;
  }
}
document.getElementById('password').value = pseudoHash(
'491d1e4e4f474a1d4847474b4f4846494c191a4f1a47461c4946461e484c4649', 'DECRYPT');
{% endhighlight %}

pseudoHash是将md5再进行了一次编码。题目里面只提供了编码的函数，而解码的函数miss了。

按照题目里面的思路，简单的写一下DECRYPT。

首先，理解是怎么加密的。

读取string里面的每个字符，假设当前为x，然后将当前x字符转成ascii码

接下来判断ascii码的大小，然后进行加减。在基础的ascii表里面，最大值到了127

题目里面又说了是md5，那就不用管其他的ascii码了。

再把加减后的ascii码用255减去自己。最后在转成16进制。

得出以下的解密js：

{% highlight javascript%}
var output='';
for(var index=0;index<string.length;index+=2){
        hexCode = string.slice(index,index+2);

        charCode = parseInt(hexCode,16);

        charCode = 255-charCode;
        if (charCode>128)
        	charCode -= 128;

        output += String.fromCharCode(charCode);
}
{% endhighlight %}

上面提到了，在基础的ascii表里面，只到127,所以在加密的时候，

也就是用到了 charCode += 128,解密的时候在对应的地方，减去就可以了。

找了半天怎么提交。。

原来是在当前页面输入解密出来的md5，然后页面就会跳转Get flag。

<img src="/images/script.png" alt="">

EOF