# ARM 链接文件

在一般的 STM32 项目中，有一个 ARM 链接脚本，用于提示链接器程序的各个段（代码、变量等）位于 Flash 的什么位置。对于 STM32 来说，这个文件决定了中断向量表、代码、各种变量、堆栈等的具体地址。

下面，以 STM32F411 系列芯片的启动文件 `STM32F411XX_FLASH.ld` 为例介绍。

> 需要注意的是，在 Keil 编译器中，起到这个作用的是分散加载文件（`.sct`）。链接文件 `.ld` 是在 GCC 系列编译器下使用的。

## 入口点

文件开头是入口说明，指定程序的入口：

```ld
/* Entry Point */  
ENTRY(Reset_Handler)
```

这指定了在 MCU 上电后，应当从 `Reset_Handler` 开始运行。这个函数在启动文件中定义。

## Memory 定义

```ld
MEMORY
{
RAM (xrw)      : ORIGIN = 0x20000000, LENGTH = 128K
FLASH (rx)     : ORIGIN = 0x8000000, LENGTH = 512K
}
```

这指定了 RAM 和 FLASH 内存的大小和权限。`RAM (xrw)` 表示其可以被执行（x，executable）、读取（r，readable）、写入（w，writable）。`ORIGIN = 0x20000000, LENGTH = 128K` 表示 RAM 的地址从 `0x20000000` 开始，大小为 128k，FLASH 的同理。

## 栈定义

接下来是关于栈顶地址 `_estack` 的定义：

```ld
/* Highest address of the user mode stack */  
_estack = ORIGIN(RAM) + LENGTH(RAM);    /* end of RAM */  
_sstack = _estack - _Min_Stack_Size;  
/* Generate a link error if heap and stack don't fit into RAM */  
_Min_Heap_Size = 0x200;      /* required amount of heap  */  
_Min_Stack_Size = 0x400; /* required amount of stack */
```

这段代码表示，`_estack` 的值为 `ORIGIN(RAM) + LENGTH(RAM)`，即在 RAM 的最后面。`_sstack` 表示栈底，也就是可以用的最低的地址。其大小为在栈顶的基础上减去了一个最小的栈大小。

现在可以解决在 [Cortex-M 启动文件](Cortex-M%20启动文件.md) 中的一个问题：当上电时，启动文件中的 Reset_Handler 设定 SP 地址为 _estack。这个值就是在链接文件中定义的。

后面两行定义了最小的栈和堆的大小。

> 栈用于存储局部变量、函数调用和中断现场等，是 FILO 结构；堆用于 `malloc()` 分配空间，是不连续寻址（随机）的。


## 段地址定义

接下来的内容决定了每个段（Section）的地址等设置：

```ld
/* Define output sections */  
SECTIONS  
{
 /* ... */
}
```

### 中断向量表

其中首先是中断向量表 `.isr_vector`：

```ld
.isr_vector :  
{  
  . = ALIGN(4);  
  KEEP(*(.isr_vector)) /* Startup code */  
  . = ALIGN(4);  
} >FLASH
```

其定义了一个段 `.isr_vector`，这个段位于 FLASH 中：`>FLASH`。而 `.=ALIGN(4)` 意为在当前位置（`.`）将地址对齐到 4 字节，用于确保中断向量表从 4 字节对齐的地址开始。

中间 `KEEP(*(.isr_vector))` 意为所有属于 `.isr_vector` 的段（`*`表示通配符）都要被保留，不受编译选项的限制。如使用 `gc_section` 时，没有使用的段会被垃圾回收（GC）。这段代码保证中断向量表即使没有直接被代码引用（通常如此），也会被插入到 Flash 中。

> 对齐 4 字节意为地址可以被 4 整除。

### 代码段

接下来是 `.text` 段的设置。这个段通常被用于存储代码函数、只读数据等。

```ld
/* The program code and other data goes into FLASH */  
.text :  
{  
  . = ALIGN(4);  
  *(.text)           /* .text sections (code) */  
  *(.text*)          /* .text* sections (code) */  
  *(.glue_7)         /* glue arm to thumb code */  
  *(.glue_7t)        /* glue thumb to arm code */  
  *(.eh_frame)  
  
  KEEP (*(.init))  
  KEEP (*(.fini))  
  
  . = ALIGN(4);  
  _etext = .;        /* define a global symbols at end of code */  
} >FLASH
```

注释解释了每行代码的具体作用。`*(.text)` 用于匹配输出文件中所有的 `.text` 段，`*(.text*)` 用于匹配带后缀的段，如 `.text.something`，通常链接库等会使用这种命名。接下来的 `glue*` 为胶水代码，从 ARM 和 Thumb 代码之间链接，`eh_frame` 为异常处理和异常栈展开的段。

`.init` 和 `.fini` 为运行前后的构造、析构部分。`_etext = .` 定义了符号 `_etext` 表示当前 `.text` 段的结束地址。

### 只读数据

接下来是只读数据（rodata，Read Only Data）的段：

```ld
.rodata :  
{  
  . = ALIGN(4);  
  *(.rodata)         /* .rodata sections (constants, strings, etc.) */  
  *(.rodata*)        /* .rodata* sections (constants, strings, etc.) */  
  . = ALIGN(4);  
} >FLASH
```

下面的一大段均为 C/C++ 初始化和异常处理的数据端，放置在 Flash 中。

### 异常表

```ld
.ARM.extab (READONLY) : 
{  
  . = ALIGN(4);  
  *(.ARM.extab* .gnu.linkonce.armextab.*)  
  . = ALIGN(4);  
} >FLASH
```

这段代码用于异常处理，GCC 通常利用段 `.ARM.extab*` 保存异常处理相关信息。`(READONLY)` 表示只读。CPU 并不直接使用它，C++ Runtime 或者 libgcc 会用来 Unwind 栈。

### 异常索引表

```ld
.ARM (READONLY) :
{
    . = ALIGN(4);
    __exidx_start = .;
    *(.ARM.exidx*)
    __exidx_end = .;
    . = ALIGN(4);
} >FLASH
```

这一段用于设定异常索引表，即 `.ARM.exidx`。C++ 在处理异常时，需要知道函数的栈布局，即函数目前调用在哪一个栈中。`__exidx_start` 和 `__exidx_end` 标志了这个段的起始和结束。

异常表和异常索引表（`extab` 和 `exidx`）的结合使 C++ Runtime 可以处理异常。

> C++ Runtime 是支撑 C++ 语言特性在程序运行期间正常工作的底层代码和机制。其主要包括全局/静态对象的初始化（在程序启动时，会遍历 `.preinit_array` 和 `.init_array`，并调用全局对象的构造函数。程序退出时，会遍历 `fini_array` 调用析构函数）、异常处理、RTTI（Run Time Type Information）、库函数支持等。在裸机 STM32 上，由于没有操作系统，Runtime 的工作由编译器+启动文件+链接文件提供。

### 早期初始化

```ld
.preinit_array (READONLY) :
{
    . = ALIGN(4);
    PROVIDE_HIDDEN (__preinit_array_start = .);
    KEEP (*(.preinit_array*))
    PROVIDE_HIDDEN (__preinit_array_end = .);
    . = ALIGN(4);
} >FLASH
```

用于更早期的初始化函数，在 `init_array` 之前，在 C++ 全局构造函数之前。`PROVIDE_HIDDEN` 为定义符号，但是该符号对于外部链接文件是隐藏的。

### 初始化

```ld
.init_array (READONLY) :
{
    . = ALIGN(4);
    PROVIDE_HIDDEN (__init_array_start = .);
    KEEP (*(SORT(.init_array.*)))
    KEEP (*(.init_array*))
    PROVIDE_HIDDEN (__init_array_end = .);
    . = ALIGN(4);
} >FLASH
```

用于 C++ 全局对象构造，其将每个全局对象的构造函数放入 `.init_array.*`。程序启动时，启动文件的 `__libc_init_array()` 会调用这些构造函数。`SORT()` 保证构造顺序。

### 对象析构

```ld
.fini_array (READONLY) :
{
    . = ALIGN(4);
    PROVIDE_HIDDEN (__fini_array_start = .);
    KEEP (*(SORT(.fini_array.*)))
    KEEP (*(.fini_array*))
    PROVIDE_HIDDEN (__fini_array_end = .);
    . = ALIGN(4);
} >FLASH
```

用于 C++ 全局对象析构，当程序结束时被调用。在 STM32 上通常不起作用，保留是为了兼容其他 C/C++ 库。

### 数据段

```ld
/* used by the startup to initialize data */  
_sidata = LOADADDR(.data);  
  
/* Initialized data sections goes into RAM, load LMA copy after code */  
.data :  
{  
  . = ALIGN(4);  
  _sdata = .;        /* create a global symbol at data start */  
  *(.data)           /* .data sections */  
  *(.data*)          /* .data* sections */  
  *(.RamFunc)        /* .RamFunc sections */  
  *(.RamFunc*)       /* .RamFunc* sections */  
  
  . = ALIGN(4);  
} >RAM AT> FLASH
```

在嵌入式系统中，已经初始化的全局变量在运行时需要将存储在 FLASH 中的值移动到 RAM 中供其读写。`_sidata = LOADADDR(.data);` 可以获取当前 `.data` 段在 FLASH 中的起始地址，启动代码会根据这个地址将数据拷贝到 RAM：
```asm
  ldr r0, =_sdata  
  ldr r1, =_edata  
  ldr r2, =_sidata  
  movs r3, #0  
  b LoopCopyDataInit  
  
CopyDataInit:  
  ldr r4, [r2, r3]  
  str r4, [r0, r3]  
  adds r3, r3, #4
```

可以看到，其遍历的范围从 r2 开始，即 `_sidata`。

链接文件中 `>RAM AT >FLASH` 指示运行时变量所在地址在 RAM 中，变量实际烧录在 FLASH 中。

### 线程本地存储段

```ld
.tdata : ALIGN(4)  
{  
  *(.tdata .tdata.* .gnu.linkonce.td.*)  
  . = ALIGN(4);  
  _edata = .;        /* define a global symbol at data end */  
  PROVIDE(__data_end = .);  
  PROVIDE(__tdata_end = .);  
} >RAM AT> FLASH
```

```ld
/* Uninitialized data section */  
.tbss (NOLOAD) : ALIGN(4)  
{  
   /* This is used by the startup in order to initialize the .bss secion */  
  _sbss = .;         /* define a global symbol at bss start */  
  __bss_start__ = _sbss;  
  *(.tbss .tbss.*)  
  . = ALIGN(4);  
  PROVIDE( __tbss_end = . );  
} >RAM
```

`tdata` 包含已经初始化的线程本地变量。和 `.data` 一样，其在 FLASH 中存储，运行时移动到 RAM 中。`tbss` 为未初始化的的线程本地变量。`(NOLAND)` 标记表示不占用 FLASH 空间，只在 RAM 中预留并清零。

> 线程本地存储（TLS）允许每个线程拥有自己独立的变量副本，避免多个线程同时修改造成竞态条件（Race Condition），造成内存安全问题。

### 堆栈占位符号

```ld
._user_heap_stack (NOLOAD) :  
{  
  . = ALIGN(8);  
  PROVIDE ( end = . );  
  PROVIDE ( _end = . );  
  . = . + _Min_Heap_Size;  
  . = . + _Min_Stack_Size;  
  . = ALIGN(8);  
} >RAM
```

这部分主要用于在 RAM 的剩余空间中占位，用于确保程序有足够的堆栈空间，防止内存溢出等。

### 清理

最后是 `/DISCARD/` 部分：

```ld
/DISCARD/ :  
{  
  libc.a:* ( * )  
  libm.a:* ( * )  
  libgcc.a:* ( * )  
}
```

这个段用于显式的清理不需要的输入段或者库文件内容。`libc.a:* ( * )` 用于丢弃来自标准 C 库（libc）所有没有被引用的段，`libm` 为数学库，`libgcc` 为 GCC 辅助库。这些库的相关冗余均会被删除。

## 总结

在编译时，ARM Compiler 会将相关的 C 文件生成 `.o` 文件。之后，链接器会根据链接文件，将这些内容映射到芯片真实的地址之上，体现在生成的二进制文件中，这些内容中就包括启动文件的部分，尤其是其中的中断向量表和复位向量。链接器会将这段复位代码的物理地址放置在向量表预定的偏移位置。当芯片上电，硬件逻辑根据链接脚本划定的基地址读取到这个跳转目标后，程序指针（PC）便指向了启动文件中的 `Reset_Handler`。

此时，FLASH 中的内容开始被“激活”。启动文件并不直接操作变量，而是利用链接器在链接阶段通过链接脚本计算并填充进来的绝对数值——即以 `_sdata`、`_edata`、`_sidata` 命名的符号地址。在生成的机器码中，这些符号已经变成了具体的内存地址（如 `0x20000000`）。启动文件执行的循环指令，本质上是根据链接脚本确定的“从 Flash 的某个偏移地址拷贝指定长度数据到 RAM 某个地址”的指令序列。

对于 TLS 段，链接器同样在二进制文件中预留了 `.tdata` 的初始镜像副本。如果是多线程环境，RTOS 的初始化代码会像启动文件处理全局变量那样，参考链接脚本中 `__tls_size` 和 `__tdata_source` 的数值，在 RAM 中为新创建的线程动态预留出一块私有空间。

最终，这个二进制文件不仅包含了执行逻辑，还包含了一套完整的构建过程。链接脚本将芯片的物理特性（Flash，RAM）转化为这个过程中的参数，启动文件则作为执行者，在 RAM 中建立起 `.data` 的初值、清空 `.bss` 的脏数据、并拉起堆栈顶部的指针（SP）。至此，二进制文件中的机器码才真正具备了访问 C 语言中全局变量、调用函数以及进行线程切换的能力，程序也由此正式从汇编环境跃迁到了 `main` 函数所代表的 C 运行时环境。

## 附录：`STM32F411XX_FLASH.ld` 

```ld
/*  
******************************************************************************  
**  
  
**  File        : LinkerScript.ld  
**  
**  Author     : STM32CubeMX  
**  
**  Abstract    : Linker script for STM32F411RETx series  
**                512Kbytes FLASH and 128Kbytes RAM  
**  
**                Set heap size, stack size and stack location according  
**                to application requirements.  
**  
**                Set memory bank area and size if external memory is used.  
**  
**  Target      : STMicroelectronics STM32  
**  
**  Distribution: The file is distributed “as is,” without any warranty  
**                of any kind.  
**  
*****************************************************************************  
** @attention  
**  
** <h2><center>&copy; COPYRIGHT(c) 2025 STMicroelectronics</center></h2>  
**  
** Redistribution and use in source and binary forms, with or without modification,  
** are permitted provided that the following conditions are met:  
**   1. Redistributions of source code must retain the above copyright notice,  
**      this list of conditions and the following disclaimer.  
**   2. Redistributions in binary form must reproduce the above copyright notice,  
**      this list of conditions and the following disclaimer in the documentation  
**      and/or other materials provided with the distribution.  
**   3. Neither the name of STMicroelectronics nor the names of its contributors  
**      may be used to endorse or promote products derived from this software  
**      without specific prior written permission.  
**  
** THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"  
** AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE  
** IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE  
** DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE  
** FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL  
** DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR  
** SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER  
** CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,  
** OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE  
** OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.  
**  
*****************************************************************************  
*/  
  
/* Entry Point */  
ENTRY(Reset_Handler)  
  
/* Specify the memory areas */  
MEMORY  
{  
RAM (xrw)      : ORIGIN = 0x20000000, LENGTH = 128K  
FLASH (rx)      : ORIGIN = 0x8000000, LENGTH = 512K  
}  
  
/* Highest address of the user mode stack */  
_estack = ORIGIN(RAM) + LENGTH(RAM);    /* end of RAM */  
_sstack = _estack - _Min_Stack_Size;  
/* Generate a link error if heap and stack don't fit into RAM */  
_Min_Heap_Size = 0x200;      /* required amount of heap  */  
_Min_Stack_Size = 0x400; /* required amount of stack */  
  
/* Define output sections */  
SECTIONS  
{  
  /* The startup code goes first into FLASH */  
  .isr_vector :  
  {  
    . = ALIGN(4);  
    KEEP(*(.isr_vector)) /* Startup code */  
    . = ALIGN(4);  
  } >FLASH  
  
  /* The program code and other data goes into FLASH */  
  .text :  
  {  
    . = ALIGN(4);  
    *(.text)           /* .text sections (code) */  
    *(.text*)          /* .text* sections (code) */  
    *(.glue_7)         /* glue arm to thumb code */  
    *(.glue_7t)        /* glue thumb to arm code */  
    *(.eh_frame)  
  
    KEEP (*(.init))  
    KEEP (*(.fini))  
  
    . = ALIGN(4);  
    _etext = .;        /* define a global symbols at end of code */  
  } >FLASH  
  
  /* Constant data goes into FLASH */  
  .rodata :  
  {  
    . = ALIGN(4);  
    *(.rodata)         /* .rodata sections (constants, strings, etc.) */  
    *(.rodata*)        /* .rodata* sections (constants, strings, etc.) */  
    . = ALIGN(4);  
  } >FLASH  
  
  .ARM.extab (READONLY) : /* The "READONLY" keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */  
  {  
    . = ALIGN(4);  
    *(.ARM.extab* .gnu.linkonce.armextab.*)  
    . = ALIGN(4);  
  } >FLASH  
  
  .ARM (READONLY) : /* The "READONLY" keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */  
  {  
    . = ALIGN(4);  
    __exidx_start = .;  
    *(.ARM.exidx*)  
    __exidx_end = .;  
    . = ALIGN(4);  
  } >FLASH  
  
  .preinit_array (READONLY) : /* The "READONLY" keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */  
  {  
    . = ALIGN(4);  
    PROVIDE_HIDDEN (__preinit_array_start = .);  
    KEEP (*(.preinit_array*))  
    PROVIDE_HIDDEN (__preinit_array_end = .);  
    . = ALIGN(4);  
  } >FLASH  
  
  .init_array (READONLY) : /* The "READONLY" keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */  
  {  
    . = ALIGN(4);  
    PROVIDE_HIDDEN (__init_array_start = .);  
    KEEP (*(SORT(.init_array.*)))  
    KEEP (*(.init_array*))  
    PROVIDE_HIDDEN (__init_array_end = .);  
    . = ALIGN(4);  
  } >FLASH  
  
  .fini_array (READONLY) : /* The "READONLY" keyword is only supported in GCC11 and later, remove it if using GCC10 or earlier. */  
  {  
    . = ALIGN(4);  
    PROVIDE_HIDDEN (__fini_array_start = .);  
    KEEP (*(SORT(.fini_array.*)))  
    KEEP (*(.fini_array*))  
    PROVIDE_HIDDEN (__fini_array_end = .);  
    . = ALIGN(4);  
  } >FLASH  
  
  /* used by the startup to initialize data */  
  _sidata = LOADADDR(.data);  
  
  /* Initialized data sections goes into RAM, load LMA copy after code */  
  .data :  
  {  
    . = ALIGN(4);  
    _sdata = .;        /* create a global symbol at data start */  
    *(.data)           /* .data sections */  
    *(.data*)          /* .data* sections */  
    *(.RamFunc)        /* .RamFunc sections */  
    *(.RamFunc*)       /* .RamFunc* sections */  
  
    . = ALIGN(4);  
  } >RAM AT> FLASH  
  
 /* Initialized TLS data section */  
  .tdata : ALIGN(4)  
  {  
    *(.tdata .tdata.* .gnu.linkonce.td.*)  
    . = ALIGN(4);  
    _edata = .;        /* define a global symbol at data end */  
    PROVIDE(__data_end = .);  
    PROVIDE(__tdata_end = .);  
  } >RAM AT> FLASH  
  
  PROVIDE( __tdata_start = ADDR(.tdata) );  
  PROVIDE( __tdata_size = __tdata_end - __tdata_start );  
  
  PROVIDE( __data_start = ADDR(.data) );  
  PROVIDE( __data_size = __data_end - __data_start );  
  
  PROVIDE( __tdata_source = LOADADDR(.tdata) );  
  PROVIDE( __tdata_source_end = LOADADDR(.tdata) + SIZEOF(.tdata) );  
  PROVIDE( __tdata_source_size = __tdata_source_end - __tdata_source );  
  
  PROVIDE( __data_source = LOADADDR(.data) );  
  PROVIDE( __data_source_end = __tdata_source_end );  
  PROVIDE( __data_source_size = __data_source_end - __data_source );  
  /* Uninitialized data section */  
  .tbss (NOLOAD) : ALIGN(4)  
  {  
     /* This is used by the startup in order to initialize the .bss secion */  
    _sbss = .;         /* define a global symbol at bss start */  
    __bss_start__ = _sbss;  
    *(.tbss .tbss.*)  
    . = ALIGN(4);  
    PROVIDE( __tbss_end = . );  
  } >RAM  
  
  PROVIDE( __tbss_start = ADDR(.tbss) );  
  PROVIDE( __tbss_size = __tbss_end - __tbss_start );  
  PROVIDE( __tbss_offset = ADDR(.tbss) - ADDR(.tdata) );  
  
  PROVIDE( __tls_base = __tdata_start );  
  PROVIDE( __tls_end = __tbss_end );  
  PROVIDE( __tls_size = __tls_end - __tls_base );  
  PROVIDE( __tls_align = MAX(ALIGNOF(.tdata), ALIGNOF(.tbss)) );  
  PROVIDE( __tls_size_align = (__tls_size + __tls_align - 1) & ~(__tls_align - 1) );  
  PROVIDE( __arm32_tls_tcb_offset = MAX(8, __tls_align) );  
  PROVIDE( __arm64_tls_tcb_offset = MAX(16, __tls_align) );  
  
  .bss (NOLOAD) : ALIGN(4)  
  {  
    *(.bss)  
    *(.bss*)  
    *(COMMON)  
  
      . = ALIGN(4);  
    _ebss = .;         /* define a global symbol at bss end */  
    __bss_end__ = _ebss;  
      PROVIDE( __bss_end = .);  
  } >RAM  
  PROVIDE( __non_tls_bss_start = ADDR(.bss) );  
  
  PROVIDE( __bss_start = __tbss_start );  
  PROVIDE( __bss_size = __bss_end - __bss_start );  
  
  /* User_heap_stack section, used to check that there is enough RAM left */  
  ._user_heap_stack (NOLOAD) :  
  {  
    . = ALIGN(8);  
    PROVIDE ( end = . );  
    PROVIDE ( _end = . );  
    . = . + _Min_Heap_Size;  
    . = . + _Min_Stack_Size;  
    . = ALIGN(8);  
  } >RAM  
  
  
  
  /* Remove information from the standard libraries */  
  /DISCARD/ :  
  {  
    libc.a:* ( * )  
    libm.a:* ( * )  
    libgcc.a:* ( * )  
  }  
  
}
```