S32DS 基础项目来自于一个配好的在 NXP S32K144 EVB V2.0 开发板上点亮 LED PD0 的示例工程，采用符合 AUTOSAR 4.4.0 标准的 S32DS + EB Tresos Studio 配置流程。

FreeRTOS 集成是来自一个已经配置好的拥有完整目录结构的项目，从其中裁剪 Rte 和 Os 部分到上述示例工程中。项目如下。

![](attachments/RES_Project.zip)

> 该项目的 MCAL 部分配置如 [EB Tresos Mcal 最小系统搭建](EB%20Tresos%20Mcal%20最小系统搭建.md)。

解压，将其中 02_Rte 和 03_Bsw/Os 部分粘贴入现有的项目根目录下，即形成如下目录结构：

![](attachments/Pasted%20image%2020260123155628.png)

打开 Project Settings（右键项目 -> Properties）-> C/C++ Build -> Settings，完成如下操作：

1. 将宏定义 `NUMBER_OF_CORES` 添加到 Standard S32DS C Compiler -> Preprocessor -> Defined Symbols 中；
2. 将如下路径添加到 Standard S32DS C Compiler -> Includes ->Include Paths (-l) 中：
    1. `"${workspace_loc:/${ProjName}/Os/include}"`
    2. `"${workspace_loc:/${ProjName}/Os/portable/GCC/ARM_CM4F}"`
    3. `"${workspace_loc:/${ProjName}/Os/portable/MemMang}"`
    4. `"${workspace_loc:/${ProjName}/Os/config}"`
    5. `"${workspace_loc:/${ProjName}/Rte}"`
3. 添加后点击 Apply and Close。

之后，在左侧 Project Explorer 中完成如下操作：

1. 右键 Os 文件夹 -> Build Path -> Add to -> Debug_FLASH，保证 Os 文件夹中每个子文件夹都是**黑体而非灰色字体**；
2. 对 Rte 文件夹完成相同操作；
3. 对 Rte 文件夹中的 include 和 src 文件夹右键 -> Build Path -> Remove from -> Debug_FLASH，让其变成**灰色字体**。

之后点击 Build，即可编译成功。

> 对于 FreeRTOS 的具体解释，如 [FreeRTOS 源码架构](../FreeRTOS%20学习笔记/FreeRTOS%20源码架构.md)
> 对于 FreeRTOS 的通用移植，如 [FreeRTOS 移植](../FreeRTOS%20学习笔记/FreeRTOS%20移植.md)
> 对于 FreeRTOS 的源码解释，如 [总览](../FreeRTOS%20学习笔记/FreeRTOS%20自实现/源码分析/总览.md)