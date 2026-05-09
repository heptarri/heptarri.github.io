# Cortex-M 启动文件

本文介绍了 Cortex-M 芯片启动时的芯片动作，以及从上电到进入 main() 函数的过程。这是由启动文件决定的。

## 概述

在 ARM Cortex-M 体系中，启动文件通常是使用汇编（`.s` 文件）编写的。其在编译时被编译器编译为 `.o` 目标文件。接下来，链接器（Linker）根据链接文件（在 GCC 编译器中为链接文件 `.ld`，在 Keil 中为分散加载文件 `.sct`）将其放到镜像地址的最开头，作为芯片上电复位后首先运行的部分。

> 严格来说，其并不是在 Flash 的最开头。具体的分配方案是由链接文件决定的。

下面，以 `startup_stm32f411xe.s` 为例，介绍一个启动文件的组成。

## 汇编语法

在 ARM 汇编中，存在一系列汇编指令（Directives）。他们不运行在 CPU 上，而是给汇编器（Assembler）提供的组织代码、分配内存的符号。文件中用到的有：
- `.word` 用于分配 4 字节的空间。其用于在当前位置分配一个 32 位的内存空间并存入一个值。
- `.section` 用于提示 Assembler 接下来的汇编代码属于内存中的哪个区块。区块的具体定义在链接文件中。
- `.type` 用于指定符号类型，是可执行的函数 `%function` 还是数据对象 `%object`。
- `.weak` 用于指示弱符号。即如果项目中有其他地方定义这个符号，就用那个定义；否则采用当前这个定义。
- `.size` 用于提示 Assembler 这个符号占用了多少字节。

此外，还有一系列汇编指令，是用来给 CPU 运行的：

- `LDR` ：Load Register，从内存加载数据到寄存器。如 `ldr r0, = _sdata` 为把变量的地址加载到 `r0`，`ldr r4, [r2, r3]` 将 `r2+r3` 的值读入 `r4`。
- `STR`：Store Register，将寄存器的数据写入内存。如 `str r4, [r0, r3]` 为把 `r4` 的值存入 `r0+r3` 的内存处。
- `MOV/MOVS`：Move，用于数据传送。如 `movs r3, #0` 为把立即数 0 存入 `r3`。
- `ADDS`：Add，加法运算。
- `CMP`：Compare，比较两个数。
- `B`：Branch，无条件跳转。直接跳转到某个标签执行。
- `BL`：Branch with Link，带返回的跳转，一般用于调用函数。
- `BCC`：Branch if Carry Clear，条件跳转。当进位标志为 0 时跳转。在 `cmp` 比较之后，表示小于则跳转。

## 编译器指令和配置

在代码开头，有一系列声明：

```asm
.syntax unified  
.cpu cortex-m4  
.fpu softvfp  
.thumb
```

这定义了该启动文件对于编译器的配置。`.syntax unified` 表示使用 ARM Thumb 统一的汇编语法；`.cpu cortex-m4` 指示该启动文件面向的核心为 Cortex M4；`.fpu softvfg` 表示使用软件单元提供浮点数计算，`.thumb` 表示使用 Thumb 指令集。

接下来，其使用 `.global` 指令声明全局变量：

```asm
.global  g_pfnVectors  
.global  Default_Handler
```

其中 `g_pfnVectors` 为中断向量表，`Default_Handler` 为默认的中断处理函数。只有设置为全局变量才可以被外部（如链接文件）使用。

## 外部符号声明

之后，其分配了五个外部符号的空间 （`.word`）：`_sidata`，`_sdata`，`_edata`，`_sbss`，`_ebss`。其中，`_sidata` 为 `.data` 段在 Flash 中的存储地址，存储全局变量的初始值；`_sdata` 为 `.data` 段在 RAM 中的起始地址，`_edata` 为 `.data` 段在 RAM 中的起始地址，这个段用于存储在运行时的全局变量值；`bss` 在 RAM 中用于存储没有初始化的变量。这些符号在启动文件中仅作为占位符，其具体定义在链接文件 `.ld` 中。这些定义是用于在启动时确认这些段在 Flash/RAM 中的具体位置。

## 复位处理函数

接下来，其为 `Reset_Handler` 定义了一个段 `.section`，指示下面的代码是只读的（`.text`，在`.ld` 中定义），且为弱符号，可以被重定义，且是函数类型：

```asm
.section  .text.Reset_Handler  
.weak  Reset_Handler  
.type  Reset_Handler, %function
```

紧接着 `Reset_Handler` 的定义：

```asm
Reset_Handler:    
  ldr   sp, =_estack            /* set stack pointer */  
  
/* Call the clock system initialization function.*/  
  bl  SystemInit     
/* Copy the data segment initializers from flash to SRAM */    
ldr r0, =_sdata  
  ldr r1, =_edata  
  ldr r2, =_sidata  
  movs r3, #0  
  b LoopCopyDataInit
```

在这段代码中，其首先利用 `ldr` 将栈顶地址 `_estack` 加载到 `SP` 寄存器。

> C 语言的运行高度依赖栈，用于存放局部变量、函数参数、返回地址等。执行任何跳转之前必须指定栈的位置。

之后，利用带返回的跳转，跳转到 `SystemInit` 用于初始化。这个函数在 `system_stm32f4xx.c` 中，如下：

```c
void SystemInit(void)  
{  
  /* FPU settings ------------------------------------------------------------*/  
  #if (__FPU_PRESENT == 1) && (__FPU_USED == 1)  
    SCB->CPACR |= ((3UL << 10*2)|(3UL << 11*2));  /* set CP10 and CP11 Full Access */  
  #endif  
  
#if defined (DATA_IN_ExtSRAM) || defined (DATA_IN_ExtSDRAM)  
  SystemInit_ExtMemCtl(); #endif /* DATA_IN_ExtSRAM || DATA_IN_ExtSDRAM */  
  
  /* Configure the Vector Table location -------------------------------------*/#if defined(USER_VECT_TAB_ADDRESS)  
  SCB->VTOR = VECT_TAB_BASE_ADDRESS | VECT_TAB_OFFSET; /* Vector Table Relocation in Internal SRAM */  
#endif /* USER_VECT_TAB_ADDRESS */  
}
```

其利用寄存器开启 FPU、初始化外部存储（ExtSRAM，此时未启用）、中断向量表重定向。

之后，其利用 R0、R1 指向 RAM 划定的一块区域，用于存放全局变量，用 R2 指向 Flash 的一个位置，那里存放了变量的初始值。R3 为计数器，从 0 开始。

> R0 R1 R2 R3 是 ARM 的 CPU 内部的通用寄存器，读写速度极快，一般用于逻辑处理。对于 Cortex-M 共有 12 个，从 R0 到 R12，一个为 4 字节宽。根据冯诺依曼架构，CPU 不可以直接从 Flash/RAM 读取数据，所以需要通用寄存器作为中转。 除此之外，还有 R13(SP) 堆栈指针，R14(LR) 链接寄存器存储函数跳回的地址，R15(PC) 程序计数器存储 CPU 当前执行的代码行。

此后，其跳转到 `LoopCopyDataInit`。

需要注意的是，在 SystemInit 之后的代码其实是：

```asm
CopyDataInit:  
  ldr r4, [r2, r3]  
  str r4, [r0, r3]  
  adds r3, r3, #4  
  
LoopCopyDataInit:  
  adds r4, r0, r3  
  cmp r4, r1  
  bcc CopyDataInit
  
/* Zero fill the bss segment. */  
  ldr r2, =_sbss  
  ldr r4, =_ebss  
  movs r3, #0  
  b LoopFillZerobss  
  
FillZerobss:  
  str  r3, [r2]  
  adds r2, r2, #4  
  
LoopFillZerobss:  
  cmp r2, r4  
  bcc FillZerobss  
  
/* Call static constructors */  
    bl __libc_init_array  
/* Call the application's entry point.*/  
  bl  main  
  bx  lr    .size  Reset_Handler, .-Reset_Handler
```

其先要跳转到 `LoopCopyDataInit` ，然后才跳转到 `CopyDataInit`。

> 这里其实是为了提前进行边界检查，开始 `.data` 字节为空的情况也能正常运行。

这部分代码的作用是将在代码（Flash）中的全局变量转化到 RAM 中。在 `CopyDataInit` 中完成了这样的过程：

```asm
CopyDataInit:
  ldr r4, [r2, r3]    /* 从 Flash 读取：地址为 r2(源) + r3(偏移) */
  str r4, [r0, r3]    /* 写入 RAM：地址为 r0(目的) + r3(偏移) */
  adds r3, r3, #4     /* 偏移递增：每次搬运 4 个字节（1个字） */

LoopCopyDataInit:
  adds r4, r0, r3     /* 计算当前写到了 RAM 的哪个位置 */
  cmp r4, r1          /* 比较当前位置与结束位置 r1 (_edata) */
  bcc CopyDataInit    /* 如果当前地址 < 结束地址，继续循环 */
```

接下来，其会将没有初始化的全局变量初始化为 `0`。这是 C 语言标准规定的。

```asm
  ldr r2, =_sbss      /* r2 = .bss 段的起始地址 */
  ldr r4, =_ebss      /* r4 = .bss 段的结束地址 */
  movs r3, #0         /* r3 = 0，准备用来填坑 */
  b LoopFillZerobss   /* 跳到检查环节 */

FillZerobss:
  str  r3, [r2]       /* 将 0 写入当前地址 r2 */
  adds r2, r2, #4     /* 地址自增 4，指向下一个位置 */

LoopFillZerobss:
  cmp r2, r4          /* 检查是否到达 .bss 段末尾 */
  bcc FillZerobss     /* 如果没到，继续填 0 */
```

接下来，启动程序就会跳转到 `main`。

```asm
/* Call static constructors */
  bl __libc_init_array  /* 调用 C++ 的构造函数或 C 的某些初始化库 */

/* Call the application's entry point.*/
  bl  main              /* 调用 main 函数，正式进入用户逻辑 */
  bx  lr                /* 如果 main 意外退出了，返回（卡死） */
```

至此，复位处理函数 `Reset_Handler` 结束。

## 中断管理和处理

接下来是 `Default_Handler`，这是一个“最终”的中断处理程序，体现为一个死循环：

```asm
Default_Handler:
Infinite_Loop:
  b  Infinite_Loop
```

在程序运行过程中，如果有某个硬件中断被触发但是没有书写对应的处理函数，CPU 就会重定向到这个处理函数中。

接下来为 `g_pfnVectors` 中断向量表。其中由多个 `.word` 字段构成，用于给 CPU 提供中断查址服务。

其中，有部分代码带有如下字段，如：

```asm
.weak      USART1_IRQHandler      
.thumb_set USART1_IRQHandler,Default_Handler
```

其中，`.weak` 含义在前文有所陈述，`.thumb_set` 的含义为若用户并未编写该中断函数，则将其重定向到 `Default_Handler`。

另外，在中断向量表之前，有以下代码：

```asm
.section  .isr_vector,"a",%progbits  
.type  g_pfnVectors, %object
```

这为该中断向量表提供了一个名字：`.isr_vector`，这在链接文件 `.ld` 中有所描述。`.ld` 将其放在 Flash 开头，然后按照表的顺序依次为每个中断处理函数的地址分配内存。

> 从执行顺序上，启动文件为真正的 Flash 开头，因为中断向量表是一堆数据。CPU 抓到向量表里的地址后，才会跳到 `Reset_Handler` 所在地，开始跑第一行汇编指令。根据链接文件的定义，启动文件其余的内容的存储位置为中断向量表之后。

中断向量表相当于为每个中断函数的地址指针提供占位。当编译时，编译器会将在其他地方编写的中断函数体转换为汇编/机器码并计算其长度，通过链接脚本 `.ld` 确定将这段机器码放在 Flash 的什么位置，然后在向量表的占位中填入这个位置的地址。

当触发这个中断时，CPU 会首先压栈，然后查找中断向量表找到这个地址，然后将这个值传给 PC，那么程序就跳转到这里执行。这是 CPU 全自动进行的。

## 启动时序

总结来说，当按下复位键或者重新上电时，CPU 会从 `0x00000000` 开始运行。根据 BOOT 引脚的设置，其被映射到 `0x08000000` 地址（这是链接文件决定的）。这里是启动文件的开始。根据启动文件，其会先在这个位置填充中断向量表 `g_pfnVector`。在中断向量表中，其第一个值为 `_estack`，第二个是 `Reset_Handler`。所以此时 0x08000000 的位置为栈顶指针 `_estack`。

此时，这个 `_estack` 代表了 RAM 的末尾地址。由于栈是从高地址（后面）向低地址（前面）生长的，所以可以发挥其最大的空间。这样，变量和栈从前后两侧在 RAM 中生长。之后，SP 指针被自动设置为 `_estack` 的值。之后，其会在硬件电路的控制下继续读取四个字节作为 PC 指针。程序从这里开始运行。这个位置正好是 `Reset_Handler`。之后的内容上文均有所阐述。


## 附录：`startup_stm32f411xe.s` 

```asm
/**  
  ******************************************************************************  
  * @file      startup_stm32f411xe.s  
  * @author    MCD Application Team  
  * @brief     STM32F411xExx Devices vector table for GCC based toolchains.   
  *            This module performs:  
  *                - Set the initial SP  
  *                - Set the initial PC == Reset_Handler,  
  *                - Set the vector table entries with the exceptions ISR address  
  *                - Branches to main in the C library (which eventually  
  *                  calls main()).  
  *            After Reset the Cortex-M4 processor is in Thread mode,  
  *            priority is Privileged, and the Stack is set to Main.  
  ******************************************************************************  
  * @attention  
  *  
  * Copyright (c) 2017 STMicroelectronics.  
  * All rights reserved.  
  *  
  * This software is licensed under terms that can be found in the LICENSE file  
  * in the root directory of this software component.  
  * If no LICENSE file comes with this software, it is provided AS-IS.  
  *  
  ******************************************************************************  
  */  
      
  .syntax unified  
  .cpu cortex-m4  
  .fpu softvfp  
  .thumb  
  
.global  g_pfnVectors  
.global  Default_Handler  
  
/* start address for the initialization values of the .data section.   
defined in linker script */  
.word  _sidata  
/* start address for the .data section. defined in linker script */    
.word  _sdata  
/* end address for the .data section. defined in linker script */  
.word  _edata  
/* start address for the .bss section. defined in linker script */  
.word  _sbss  
/* end address for the .bss section. defined in linker script */  
.word  _ebss  
/* stack used for SystemInit_ExtMemCtl; always internal RAM used */  
  
/**  
 * @brief  This is the code that gets called when the processor first  
 *          starts execution following a reset event. Only the absolutely  
 *          necessary set is performed, after which the application  
 *          supplied main() routine is called.   
 * @param  None  
 * @retval : None  
*/  
  
    .section  .text.Reset_Handler  
  .weak  Reset_Handler  
  .type  Reset_Handler, %function  
Reset_Handler:    
  ldr   sp, =_estack            /* set stack pointer */  
  
/* Call the clock system initialization function.*/  
  bl  SystemInit     
  
/* Copy the data segment initializers from flash to SRAM */    
  ldr r0, =_sdata  
  ldr r1, =_edata  
  ldr r2, =_sidata  
  movs r3, #0  
  b LoopCopyDataInit  
  
CopyDataInit:  
  ldr r4, [r2, r3]  
  str r4, [r0, r3]  
  adds r3, r3, #4  
  
LoopCopyDataInit:  
  adds r4, r0, r3  
  cmp r4, r1  
  bcc CopyDataInit  
    
/* Zero fill the bss segment. */  
  ldr r2, =_sbss  
  ldr r4, =_ebss  
  movs r3, #0  
  b LoopFillZerobss  
  
FillZerobss:  
  str  r3, [r2]  
  adds r2, r2, #4  
  
LoopFillZerobss:  
  cmp r2, r4  
  bcc FillZerobss  
  
/* Call static constructors */  
    bl __libc_init_array  
/* Call the application's entry point.*/  
  bl  main  
  bx  lr      
.size  Reset_Handler, .-Reset_Handler  
  
/**  
 * @brief  This is the code that gets called when the processor receives an   
 *         unexpected interrupt.  This simply enters an infinite loop, preserving  
 *         the system state for examination by a debugger.  
 * @param  None       
 * @retval None         
*/  
    .section  .text.Default_Handler,"ax",%progbits  
Default_Handler:  
Infinite_Loop:  
  b  Infinite_Loop  
  .size  Default_Handler, .-Default_Handler  
/******************************************************************************  
*  
* The minimal vector table for a Cortex M3. Note that the proper constructs  
* must be placed on this to ensure that it ends up at physical address  
* 0x0000.0000.  
*   
*******************************************************************************/  
   .section  .isr_vector,"a",%progbits  
  .type  g_pfnVectors, %object  
      
g_pfnVectors:  
  .word  _estack  
  .word  Reset_Handler  
  .word  NMI_Handler  
  .word  HardFault_Handler  
  .word  MemManage_Handler  
  .word  BusFault_Handler  
  .word  UsageFault_Handler  
  .word  0  
  .word  0  
  .word  0  
  .word  0  
  .word  SVC_Handler  
  .word  DebugMon_Handler  
  .word  0  
  .word  PendSV_Handler  
  .word  SysTick_Handler  
    
  /* External Interrupts */  
  .word     WWDG_IRQHandler                   /* Window WatchDog              */                                          
  .word     PVD_IRQHandler                    /* PVD through EXTI Line detection */                          
  .word     TAMP_STAMP_IRQHandler             /* Tamper and TimeStamps through the EXTI line */              
  .word     RTC_WKUP_IRQHandler               /* RTC Wakeup through the EXTI line */                        
  .word     FLASH_IRQHandler                  /* FLASH                        */                                            
  .word     RCC_IRQHandler                    /* RCC                          */                                              
  .word     EXTI0_IRQHandler                  /* EXTI Line0                   */                          
  .word     EXTI1_IRQHandler                  /* EXTI Line1                   */                            
  .word     EXTI2_IRQHandler                  /* EXTI Line2                   */                            
  .word     EXTI3_IRQHandler                  /* EXTI Line3                   */                            
  .word     EXTI4_IRQHandler                  /* EXTI Line4                   */                            
  .word     DMA1_Stream0_IRQHandler           /* DMA1 Stream 0                */                    
  .word     DMA1_Stream1_IRQHandler           /* DMA1 Stream 1                */                     
  .word     DMA1_Stream2_IRQHandler           /* DMA1 Stream 2                */                     
  .word     DMA1_Stream3_IRQHandler           /* DMA1 Stream 3                */                     
  .word     DMA1_Stream4_IRQHandler           /* DMA1 Stream 4                */                     
  .word     DMA1_Stream5_IRQHandler           /* DMA1 Stream 5                */                     
  .word     DMA1_Stream6_IRQHandler           /* DMA1 Stream 6                */                     
  .word     ADC_IRQHandler                    /* ADC1, ADC2 and ADC3s         */                     
  .word     0                              /* Reserved                      */                           
  .word     0                             /* Reserved                     */                            
  .word     0                                 /* Reserved                     */                            
  .word     0                                 /* Reserved                     */                            
  .word     EXTI9_5_IRQHandler                /* External Line[9:5]s          */                            
  .word     TIM1_BRK_TIM9_IRQHandler          /* TIM1 Break and TIM9          */           
  .word     TIM1_UP_TIM10_IRQHandler          /* TIM1 Update and TIM10        */           
  .word     TIM1_TRG_COM_TIM11_IRQHandler     /* TIM1 Trigger and Commutation and TIM11 */  
  .word     TIM1_CC_IRQHandler                /* TIM1 Capture Compare         */                            
  .word     TIM2_IRQHandler                   /* TIM2                         */                     
  .word     TIM3_IRQHandler                   /* TIM3                         */                     
  .word     TIM4_IRQHandler                   /* TIM4                         */                     
  .word     I2C1_EV_IRQHandler                /* I2C1 Event                   */                            
  .word     I2C1_ER_IRQHandler                /* I2C1 Error                   */                            
  .word     I2C2_EV_IRQHandler                /* I2C2 Event                   */                            
  .word     I2C2_ER_IRQHandler                /* I2C2 Error                   */                              
  .word     SPI1_IRQHandler                   /* SPI1                         */                     
  .word     SPI2_IRQHandler                   /* SPI2                         */                     
  .word     USART1_IRQHandler                 /* USART1                       */                     
  .word     USART2_IRQHandler                 /* USART2                       */                     
  .word     0                              /* Reserved                       */                     
  .word     EXTI15_10_IRQHandler              /* External Line[15:10]s        */                            
  .word     RTC_Alarm_IRQHandler              /* RTC Alarm (A and B) through EXTI Line */                   
  .word     OTG_FS_WKUP_IRQHandler            /* USB OTG FS Wakeup through EXTI line */                         
  .word     0                                 /* Reserved                  */           
  .word     0                                 /* Reserved                   */           
  .word     0                                 /* Reserved                 */  
  .word     0                                 /* Reserved                     */                            
  .word     DMA1_Stream7_IRQHandler           /* DMA1 Stream7                 */                            
  .word     0                                 /* Reserved                     */                     
  .word     SDIO_IRQHandler                   /* SDIO                         */                     
  .word     TIM5_IRQHandler                   /* TIM5                         */                     
  .word     SPI3_IRQHandler                   /* SPI3                         */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */  
  .word     DMA2_Stream0_IRQHandler           /* DMA2 Stream 0                */                     
  .word     DMA2_Stream1_IRQHandler           /* DMA2 Stream 1                */                     
  .word     DMA2_Stream2_IRQHandler           /* DMA2 Stream 2                */                     
  .word     DMA2_Stream3_IRQHandler           /* DMA2 Stream 3                */                     
  .word     DMA2_Stream4_IRQHandler           /* DMA2 Stream 4                */                     
  .word     0                               /* Reserved                     */                     
  .word     0                             /* Reserved                     */                       
  .word     0                             /* Reserved                     */                            
  .word     0                             /* Reserved                     */                            
  .word     0                             /* Reserved                     */                            
  .word     0                             /* Reserved                     */                            
  .word     OTG_FS_IRQHandler                 /* USB OTG FS                   */                     
  .word     DMA2_Stream5_IRQHandler           /* DMA2 Stream 5                */                     
  .word     DMA2_Stream6_IRQHandler           /* DMA2 Stream 6                */                     
  .word     DMA2_Stream7_IRQHandler           /* DMA2 Stream 7                */                     
  .word     USART6_IRQHandler                 /* USART6                       */                      
  .word     I2C3_EV_IRQHandler                /* I2C3 event                   */                            
  .word     I2C3_ER_IRQHandler                /* I2C3 error                   */                            
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                           
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */  
  .word     FPU_IRQHandler                    /* FPU                          */  
  .word     0                                 /* Reserved                     */                     
  .word     0                                 /* Reserved                     */  
  .word     SPI4_IRQHandler                   /* SPI4                         */  
  .word     SPI5_IRQHandler                   /* SPI5                         */    
                      
  
  .size  g_pfnVectors, .-g_pfnVectors  
  
/*******************************************************************************  
*  
* Provide weak aliases for each Exception handler to the Default_Handler.   
* As they are weak aliases, any function with the same name will override   
* this definition.  
*   
*******************************************************************************/  
   .weak      NMI_Handler  
   .thumb_set NMI_Handler,Default_Handler  
    
   .weak      HardFault_Handler  
   .thumb_set HardFault_Handler,Default_Handler  
    
   .weak      MemManage_Handler  
   .thumb_set MemManage_Handler,Default_Handler  
    
   .weak      BusFault_Handler  
   .thumb_set BusFault_Handler,Default_Handler  
  
   .weak      UsageFault_Handler  
   .thumb_set UsageFault_Handler,Default_Handler  
  
   .weak      SVC_Handler  
   .thumb_set SVC_Handler,Default_Handler  
  
   .weak      DebugMon_Handler  
   .thumb_set DebugMon_Handler,Default_Handler  
  
   .weak      PendSV_Handler  
   .thumb_set PendSV_Handler,Default_Handler  
  
   .weak      SysTick_Handler  
   .thumb_set SysTick_Handler,Default_Handler                
    
   .weak      WWDG_IRQHandler                     
   .thumb_set WWDG_IRQHandler,Default_Handler        
                    
   .weak      PVD_IRQHandler        
   .thumb_set PVD_IRQHandler,Default_Handler  
                 
   .weak      TAMP_STAMP_IRQHandler              
   .thumb_set TAMP_STAMP_IRQHandler,Default_Handler  
              
   .weak      RTC_WKUP_IRQHandler                    
   .thumb_set RTC_WKUP_IRQHandler,Default_Handler  
              
   .weak      FLASH_IRQHandler           
   .thumb_set FLASH_IRQHandler,Default_Handler  
                    
   .weak      RCC_IRQHandler        
   .thumb_set RCC_IRQHandler,Default_Handler  
                    
   .weak      EXTI0_IRQHandler           
   .thumb_set EXTI0_IRQHandler,Default_Handler  
                    
   .weak      EXTI1_IRQHandler           
   .thumb_set EXTI1_IRQHandler,Default_Handler  
                       
   .weak      EXTI2_IRQHandler           
   .thumb_set EXTI2_IRQHandler,Default_Handler   
                   
   .weak      EXTI3_IRQHandler           
   .thumb_set EXTI3_IRQHandler,Default_Handler  
                          
   .weak      EXTI4_IRQHandler           
   .thumb_set EXTI4_IRQHandler,Default_Handler  
                    
   .weak      DMA1_Stream0_IRQHandler                 
   .thumb_set DMA1_Stream0_IRQHandler,Default_Handler  
           
   .weak      DMA1_Stream1_IRQHandler                 
   .thumb_set DMA1_Stream1_IRQHandler,Default_Handler  
                    
   .weak      DMA1_Stream2_IRQHandler                 
   .thumb_set DMA1_Stream2_IRQHandler,Default_Handler  
                    
   .weak      DMA1_Stream3_IRQHandler                 
   .thumb_set DMA1_Stream3_IRQHandler,Default_Handler   
                   
   .weak      DMA1_Stream4_IRQHandler                
   .thumb_set DMA1_Stream4_IRQHandler,Default_Handler  
                    
   .weak      DMA1_Stream5_IRQHandler                 
   .thumb_set DMA1_Stream5_IRQHandler,Default_Handler  
                    
   .weak      DMA1_Stream6_IRQHandler                 
   .thumb_set DMA1_Stream6_IRQHandler,Default_Handler  
                    
   .weak      ADC_IRQHandler        
   .thumb_set ADC_IRQHandler,Default_Handler  
              
   .weak      EXTI9_5_IRQHandler     
   .thumb_set EXTI9_5_IRQHandler,Default_Handler  
              
   .weak      TIM1_BRK_TIM9_IRQHandler              
   .thumb_set TIM1_BRK_TIM9_IRQHandler,Default_Handler  
              
   .weak      TIM1_UP_TIM10_IRQHandler              
   .thumb_set TIM1_UP_TIM10_IRQHandler,Default_Handler  
        
   .weak      TIM1_TRG_COM_TIM11_IRQHandler        
   .thumb_set TIM1_TRG_COM_TIM11_IRQHandler,Default_Handler  
        
   .weak      TIM1_CC_IRQHandler     
   .thumb_set TIM1_CC_IRQHandler,Default_Handler  
                    
   .weak      TIM2_IRQHandler              
   .thumb_set TIM2_IRQHandler,Default_Handler  
                    
   .weak      TIM3_IRQHandler              
   .thumb_set TIM3_IRQHandler,Default_Handler  
                    
   .weak      TIM4_IRQHandler              
   .thumb_set TIM4_IRQHandler,Default_Handler  
                    
   .weak      I2C1_EV_IRQHandler     
   .thumb_set I2C1_EV_IRQHandler,Default_Handler  
                       
   .weak      I2C1_ER_IRQHandler     
   .thumb_set I2C1_ER_IRQHandler,Default_Handler  
                       
   .weak      I2C2_EV_IRQHandler     
   .thumb_set I2C2_EV_IRQHandler,Default_Handler  
                    
   .weak      I2C2_ER_IRQHandler     
   .thumb_set I2C2_ER_IRQHandler,Default_Handler  
                             
   .weak      SPI1_IRQHandler              
   .thumb_set SPI1_IRQHandler,Default_Handler  
                          
   .weak      SPI2_IRQHandler              
   .thumb_set SPI2_IRQHandler,Default_Handler  
                    
   .weak      USART1_IRQHandler        
   .thumb_set USART1_IRQHandler,Default_Handler  
                       
   .weak      USART2_IRQHandler        
   .thumb_set USART2_IRQHandler,Default_Handler  
                                    
   .weak      EXTI15_10_IRQHandler                 
   .thumb_set EXTI15_10_IRQHandler,Default_Handler  
                 
   .weak      RTC_Alarm_IRQHandler                 
   .thumb_set RTC_Alarm_IRQHandler,Default_Handler  
              
   .weak      OTG_FS_WKUP_IRQHandler           
   .thumb_set OTG_FS_WKUP_IRQHandler,Default_Handler  
              
   .weak      DMA1_Stream7_IRQHandler                 
   .thumb_set DMA1_Stream7_IRQHandler,Default_Handler  
                       
   .weak      SDIO_IRQHandler              
   .thumb_set SDIO_IRQHandler,Default_Handler  
                       
   .weak      TIM5_IRQHandler              
   .thumb_set TIM5_IRQHandler,Default_Handler  
                       
   .weak      SPI3_IRQHandler              
   .thumb_set SPI3_IRQHandler,Default_Handler  
                       
   .weak      DMA2_Stream0_IRQHandler                 
   .thumb_set DMA2_Stream0_IRQHandler,Default_Handler  
                 
   .weak      DMA2_Stream1_IRQHandler                 
   .thumb_set DMA2_Stream1_IRQHandler,Default_Handler  
                    
   .weak      DMA2_Stream2_IRQHandler                 
   .thumb_set DMA2_Stream2_IRQHandler,Default_Handler  
              
   .weak      DMA2_Stream3_IRQHandler                 
   .thumb_set DMA2_Stream3_IRQHandler,Default_Handler  
              
   .weak      DMA2_Stream4_IRQHandler                 
   .thumb_set DMA2_Stream4_IRQHandler,Default_Handler  
              
   .weak      OTG_FS_IRQHandler        
   .thumb_set OTG_FS_IRQHandler,Default_Handler  
                       
   .weak      DMA2_Stream5_IRQHandler                 
   .thumb_set DMA2_Stream5_IRQHandler,Default_Handler  
                    
   .weak      DMA2_Stream6_IRQHandler                 
   .thumb_set DMA2_Stream6_IRQHandler,Default_Handler  
                    
   .weak      DMA2_Stream7_IRQHandler                 
   .thumb_set DMA2_Stream7_IRQHandler,Default_Handler  
                    
   .weak      USART6_IRQHandler        
   .thumb_set USART6_IRQHandler,Default_Handler  
                          
   .weak      I2C3_EV_IRQHandler     
   .thumb_set I2C3_EV_IRQHandler,Default_Handler  
                          
   .weak      I2C3_ER_IRQHandler     
   .thumb_set I2C3_ER_IRQHandler,Default_Handler  
                          
   .weak      FPU_IRQHandler                    
   .thumb_set FPU_IRQHandler,Default_Handler    
  
   .weak      SPI4_IRQHandler                    
   .thumb_set SPI4_IRQHandler,Default_Handler  
  
   .weak      SPI5_IRQHandler                    
   .thumb_set SPI5_IRQHandler,Default_Handler
```