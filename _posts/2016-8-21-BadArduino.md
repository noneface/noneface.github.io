---
layout: post
title: HID Attacks--BadArduino
tag: codes
---

# 关于HID Attacks

HID(Human InterfaceDevice),人机交互设备，例如键盘，鼠标等。从HID衍生出来的攻击方式目前有可以分为三大类。包括TEENSY，USB RUBBER DUCKY以及近年来曝光率最高的BadUSB。本质上来讲，这三种攻击方式，都是将设备伪装成键盘，并且执行存储在设备中指令或者远程下载服务器上的恶意程序，达到控制目标机器。

# 基于Arduino的实现

在这里采用的是Arduino UNO这块开发板，看起来很难伪装，无奈只有UNO。将就着用呗 : (，在Arduino系列中，有一种leonardo开发版，能够更好的实现keyboard操作，相比于BadUSB实现HID攻击，设备制作上会更加简便。Arduino leonardo直接用Arduino IDE烧录代码即可完成。

# 步骤

http://magikh0e.ihtb.org/pubHardwareHacking/ArduinoHIDDevice.html

以下参考自链接。

因为Arduino UNO原本并不支持keyboard操作，但是可以通过dfu更新固件程序的方式，来重写设置。

操作环境为Linux。

#### Step 1

首先需要将UNO上靠近DIGITAL插口的，左上角的一个接口与GND相接触一下既可以进入DFU模式。

如图

<img src="/images/arduino.jpg" alt="">

在终端下依次输入以下命令。

1.dfu-programmer atmega16u2 erase

2.dfu-programmer atmega16u2 flash --debug Arduino-usbserial-atmega16u2-Uno-Rev3.hex

3.dfu-programmer atmega16u2 reset

#### Step 2

烧入代码之前，电脑是无法识别到Arduino的，所以需要重新插拔USB接口。
将所需要的执行代码，烧入进Arduino。

Demo
<code>
uint8_t buf[8] = { 0 }; 

void setup() {
	Serial.begin(9600);
	randomSeed(analogRead(0));
	delay(200);
}

void loop() {
	delay(5000);
	buf[0] = 0;
	buf[2] = 0x10; // letter M - http://www.freebsddiary.org/APC/usb_hid_usages.php
	Serial.write(buf, 8);
	releaseKey();
}

void releaseKey() {
	buf[0] = 0;
	buf[2] = 0;
	Serial.write(buf, 8); 
}
</code>

这个例子将会输出'm'。

#### Step 3

重新进入DFU模式
重复step 1 的步骤，但是将hex文件换成 Arduino-keyboard.hex。
即可完成操作。

重新连接电脑，就可以看到效果了。

一个在Linux下的栗子：

http://v.youku.com/v_show/id_XMTY5MDExMTY1Mg==.html