---
layout: post
title: tmux & vim settings for developing environments
tag: codes
---

### About

进入一家新的公司工作，最开始的熟悉环境就很重要。

其中也就包含了 ‘研发环境’。

### Shell 、 Shell or Shell?

刚到 Knownsec 入职的前两天，就开始折腾编程环境。一开始就听说公司比较推荐 *nix+vim 的组合。

或多或少多接触过一点，最多也就是在存活阶段。

在组里大佬的指导下，加上这两天的重新整理，把环境重新整理了一下，顺便做个总结。

### tmux

"tmux - terminal multiplexer"， 终端复用。

由于要连接服务器做开发，但是 ssh 下就只有一个终端。想多开几个终端的话，就会很麻烦。

所以 tmux 就很好的解决了这个问题。

在 tmux.conf 中，主要是对一些快捷键的重新设置。

tmux 默认的快捷键前缀是 Ctrl-b，也可以重新绑定成其他的。

但是最近发现，我原来绑定的 ctrl-a 在 terminal 中是个 bash 下的快捷键，于是乎我又把 ctrl-b 快捷键前缀复原了。

除了一些 tmux 的按键，主要还有一个 tmux status bar，一个状态栏显示些时间、tmux 窗口等信息。

后面的 vim 配置，在 tmux 中会有一些坑。

##### 因为在 tmux 以及 terminal 中的色彩默认不是 256 。

所以在设置一些主题的时候，不仅要让 terminal 的色彩进行修改，同时 tmux 的色彩也要进行修改。

针对 tmux 的修改，在启动时多添加一个参数： tmux -2 就 OK 了。

### vim

vim 的设置，主要是一些常用 Plugin 的安装，我使用了 Vundle 作为包管理插件。

然后主要写 Python，用了下列插件：
    
    - nerdtree  文件树展示
    - indentLine  缩进显示
    - tagbar       函数/变量 显示
    - vim-airline / vim-airline-theme  状态条
    - vim-gitgutter   git 显示插件
    - jedi-vim  python 自动补齐插件

要设置 vim 的色彩为 256，所以在 vimrc 中需要做 <code> set t_Co=256 </code>

### Show

最后的配置效果：
![show](/images/tmux_vim.png)
