**该模块的具体使用说明可能需要结合 S32K1xx Reference Manual。**

该模块提供了对于整体端口（Port）的初始化功能。许多端口及其引脚的映射、定义等工作在这里完成，包括但不限于：

- GPIO
- ADC
- SPI
- PWM
- CAN
- Etc.

> 查看芯片端口资源的方法：
> 
> 打开 Reference Manual，找到附件：`S32K1xx_IO_Signal_Description_Input_Multiplexing.xlsx`，选择 Sheet：`IO Signal Table` 即可查看。

定义引脚的功能有三种方式，B、C 两种在此不再赘述，用 UM 中的描述代之：

![](/attachments/Pasted%20image%2020260124171557.png)

需要注意的是，为了调试， JTAG 相关的引脚需要被设定为 UnTouchedPortPin。EB tresos Studio 29 在 新建项目时提供了相关的模板，可以预先完成此项设置。

下面对必要的设置项逐一说明。

# General

## NotUsedPortPin

该部分对没有使用（设置）的引脚进行定义，即当某个引脚没有进行特定设置/映射时的表现。

### PortPin Mode

引脚模式，包括 GPIO（通用输入输出）、Disabled（禁用）两种模式。

### PortPin Direction

设置引脚方向，该设置仅对 GPIO 模式有效。可以选择 OUT、IN、HIGH_Z（部分芯片不支持）模式。

### PortPin DSE

选择该引脚的电平驱动强度为高/低。类似于AF/OD。

### PortPin PE

选择该引脚是否采用上/下拉模式。

### PortPin PS

如果 PortPin PE 选项设为 PullEnabled，该项用于选择是上拉还是下拉。

## PortGeneral

### Port SetPinDirection Api

是否开放设置引脚方向的 API：`Port_SetPinDirection()`

### Port SetPinMode Api

因为某些安全设定，该选项不会被实现（not supported by the safety implementation）。

# PortContainer

该部分包含了所有端口引脚的设置。可以新建一个或多个容器用于存放这些引脚的设置。

## General / PortNumerOfPortPins

制定在该 Container 容器中设置的端口数量。

## PortPin

该处用于单个引脚的设置。

如果想启用某个引脚的功能，可以在 PortPin 栏目中添加。

对于每个引脚的设置：

### PortPin Id

这个值是由软件指定的。生成代码时，由用户设定的 Name 字段将会被宏定义为该值。

### PortPin Pcr

Pcr 即 Port Configuration Register。该值可以由以下公式计算：

> 规定 A-E 映射为 0-4，将该值设为 x；则PTx_y 的 Pcr 值为：32*x+y。

如 PTC7 的 Pcr 值为：32*2+7=71。

具体的 PTx_y 值请参考 IO Signal Table。

### PortPin Initial Mode

该参数不可用，但是按照 AUTOSAR_EcucParamDef.arxml 文件的要求保留。

### Other Conf

其余内容与 NotUsedPortPin 中所诠释的相同。