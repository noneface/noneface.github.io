---
layout: post
title: Nginx (Upgrading Executable on the Fly)
tag: codes
---

### Nginx

    Upgrading Executable on the Fly，开着飞机换引擎。

这个礼拜由于一些线上问题，需要重新编译Nginx，然后对线上Nginx做平滑升级。

BUT，升级过程总会出点问题。


### Nginx 平滑升级

Nginx 进行升级步骤其实很简单，主要为以下：

1. wget https://nginx.org/download/nginx-1.14.0.tar.gz  && tar -zxf nginx-1.14.0.tar.gz
2. cd nginx-1.14.0
3. ./configure  --with-xxxx  (编译配置, 需要附加的模块)
4. make  (在当前目录下有： objs，其中包含编译后的nginx可执行文件)
5. 不进行 make install !!!!! 
6. mv /usr/local/nginx/sbin/nginx /usr/local/nginx/sbin/nginx.bak  (configure 过程中使用默认路径，备份旧版本的nginx)
7. cp objs/nginx /usr/local/nginx/sbin/ (将新版本的nginx 移动到执行路径下)
8. /usr/local/nginx/sbin/nginx -V (查看更新后的版本) ps: 到此步骤，旧版的nginx 依旧在运行
9. kill -USR2 \`cat /usr/local/nginx/logs/nginx.pid\` 
    /usr/local/nginx/logs/nginx.pid 此文件保存的内容为：当前运行的nginx进程pid
    
    当发送 -USR2 到 nginx 进程时 官方解释（After that USR2 signal should be sent to the master process. The master process first renames its file with the process ID to a new file with the .oldbin suffix, e.g. /usr/local/nginx/logs/nginx.pid.oldbin, then starts a new executable file that in turn starts new worker processes）大意就是，先回将老的进程pid 备份到  /usr/local/nginx/logs/nginx.pid.oldbin, 然后开启一个新的 nginx 进程（升级后的版本，执行文件为 /usr/local/nginx/sbin/nginx 和旧版本nginx为同一路径）
10. 执行 -USR2 命令，相当于同时跑着两个nginx进程，同时处理所有的请求。
11. 当旧版本nginx进程处理完所有请求，执行 kill -WINCH \`cat /usr/local/nginx/logs/nginx.pid.oldbin\`，此nginx进程的 worker process 会进行 shut down gracefully, 最后会进行 exit。 所有的命令都是 master  process 向 worker process 发送的。
12. 最后结束旧版本nginx进程的 master process  kill -QUIT \`cat /usr/local/nginx/logs/nginx.pid.oldbin\`
13. 从第9-12步，nginx Makefile 中有提供 make upgrade 选项，可以考虑直接操作。但是慎重！！ 因为里面直接 sleep 1 后直接quit 旧版本的 master process。 有的请求不一定 1s 内就可以处理完的话，要考虑进去。

当然，上面只是理想状态下，顺利的平滑升级的过程，然而升级的过程中总是有各种坑的。

### 问题

在执行 第9步 kill -USR2 \`cat /usr/local/nginx/logs/nginx.pid\` 时候，报错无法执行。 查看 /usr/local/nginx/logs/error.log 日志文件，日志显示为：execve() failed while executing new binary process "nginx" (2: No such file or directory)。 

直接提示没有找到该nginx可执行的进程文件？ 怎么可能。

根据提示，找到execve()这个方法 

    int execve(const char *path, char *const argv[], char *const envp[]); 

    函数原型需要传递路径，

    #include <unistd.h>

    int ret;
    char *cmd[] = { "ls", "-l", (char *)0 };
    char *env[] = { "HOME=/usr/home", "LOGNAME=home", (char *)0 };
    ...
    ret = execve ("/bin/ls", cmd, env);

    文档的example里面，路径统一使用的是绝对路径，所以是不是可执行文件路径的问题，导致无法找到nginx呢？

首先排查当前运行的 nginx 执行命令方式，可以判断，nginx在系统环境变量中，所以可以确定，execve()是不会向系统环境变量中搜索命令的。所以在 nginx 接收到 USR2 信号时，无法启动新的nginx 进程。

也就是说，在此情况下，是无法进行平滑升级！！！！！！！

代码分析：
    
    ngx_spawn_process 调用 ngx_execute_proc , ngx_execute_proc 调用 execve, 而其中 ctx 变量来自于 ngx_execute
    ngx_execute 的 ctx 来自于 ngx_exec_new_binary 中的 ctx 变量
    ngx_exec_new_binary 中的 ctx.path 来自于 argv[0]  来自上层函数 ngx_master_process_cycle 的 ngx_argv
    ngx_master_process_cycle 中 ngx_change_binary 执行此处代码块，传递 ngx_argv 参数 
    在 ngx_signal_handler 中，当接收到 USR2 信号时，传递到 ngx_master_process_cycle 主进程执行
    ngx_argv 则为在nginx启动时，传递的命令参数
    


##### 请在运行 nginx 时，使用绝对路径。

### 关键 USR2 怎么做到的！！！！

当 nginx 接受到 USR2 信号后，是怎么做到两个进程，占用同一个端口进行运行的？

可以看到在 error.log 日志中，执行 kill -USR2 有输出一条日志： [notice] 27755#0: using inherited sockets from "6;"

所以，在收到 USR2 信号之后，nginx 并不会用新的可执行文件进行同一个地址和端口的绑定，这样做肯定会出问题。

而nginx的做法是将原来的绑定得到的listen fd保存在名为”NGINX”(宏定义NGINX_VAR)环境变量中，这样在新进程初始化的过程中，通过函数ngx_add_inherited_sockets就可以获取listen fd来使用了，不必再次绑定。

那这个 listen fd 文件描述符到底是怎么通过环境变量进行传递的呢？

ngx_add_inherited_sockets 方法里面，有一处使用了 getenv(NGINX_VAR)，但是并不能从 NGINX_VAR-> 也就是 NGINX 的环境变量中获取任何信息啊？ 难道是和进程运行有关？ 使用结束后立即被销毁了？
    
    ngx_add_inherited_sockets中，获取环境变量中 listen fd的代码

    for (p = inherited, v = p; *p; p++) {
        if (*p == ':' || *p == ';') {
            s = ngx_atoi(v, p - v);
            if (s == NGX_ERROR) {
                ngx_log_error(NGX_LOG_EMERG, cycle->log, 0,
                              "invalid socket number \"%s\" in " NGINX_VAR
                              " environment variable, ignoring the rest"
                              " of the variable", v);
                break;
            }

            v = p + 1;

            ls = ngx_array_push(&cycle->listening);
            if (ls == NULL) {
                return NGX_ERROR;
            }

            ngx_memzero(ls, sizeof(ngx_listening_t));

            ls->fd = (ngx_socket_t) s;
        }
    }

    ngx_exec_new_binary 中， 设置环境变量的地方

    env = ngx_set_environment(cycle, &n);
    var = ngx_alloc(sizeof(NGINX_VAR) 
        + cycle->listening.nelts * (NGX_INT32_LEN + 1) + 2, cycle->log);
    p = ngx_cpymem(var, NGINX_VAR "=", sizeof(NGINX_VAR));
    ls = cycle->listening.elts;
    for (i = 0; i < cycle->listening.nelts; i++) {
        p = ngx_sprintf(p, "%ud;", ls[i].fd);   // save listen fd in foramt "NGINX=3;4;5;"
    }
    *p = '\0';
    
    env[n++] = var;  // save to environment variable
    ctx.envp = (char *const *) env;

    pid = ngx_execute(cycle, &ctx);   // call execute func

明白了。

共享环境变量的方法，并不是说，真的在系统环境变量里面，也就是说在shell 里面执行 echo $NGINX 就能看到对应的 listen fd.

而是在旧的nginx 进程中，把设置的listen fd 放在了一个变量里面 ctx.envp，同时，在执行 execve() 这个函数的第三个参数，ctx.envp-> envp 是子进程读取的环境变量，所以在新的nginx 进程环境变量中，可以读取到 $NGINX 的值，同时，子进程也会继承系统环境变量。

所以，如果提前在系统环境变量中设置 $NGINX=1;2;3， 在执行操作 -USR2 的时候，同样会出现错误。


代码简化一下过程就是

父进程 旧的 NGINX 进程中

{% highlight c %}

#include<stdio.h>
#include<unistd.h>

int main(int arg, char **args)
{
    char *argv[]={"sub",NULL};

    char *envp[]={"NGINX=123"}; //传递给执行文件新的环境变量数组

    execve("/root/sub",argv,envp);

}

{% endhighlight %}

gcc 编译成可执行文件 env_test

子进程 新的 NGINX 进程中

{% highlight c %}

#include <stdio.h>
#include <stdlib.h>

int main (){

   printf("%s\n", getenv("NGINX"));
   return(0);
}

{% endhighlight %}

gcc 编译成指定可执行文件 sub, 让父进程里面可以调用。

在shell 中执行 echo $NGINX, 输出内容为空。

然后在shell 中执行 env_test, 可以看到输出的结果为: 123.

由此证明，在 execve() 中 envp 参数里设置的 NGINX 环境变量，会被子进程 sub 通过 getenv()方法读取。

