# Simulink 生成代码调用

Simulink 支持生成 C/C++ 代码并利用传统方式进行调用。本文记录了一种生成代码、暴露接口并调用其中方法/对象的方式。

首先，针对需要封装为功能（方法）的部分建立子系统（Subsystem），并对该子系统按照算法功能命名。如下图所示。

![](assets/Pasted%20image%2020260719221830.png)

设置各输入输出信号为基于工作空间的信号变量。需要在属性中建立与该信号同名的数据，并设定其类型为double，以及代码生成后该数据的类型（如全局变量 ExportGlobal）。

![](assets/Pasted%20image%2020260719221842.png)

![](assets/Pasted%20image%2020260719221856.png)

![](assets/Pasted%20image%2020260719221904.png)

![](assets/Pasted%20image%2020260719221912.png)

![](assets/Pasted%20image%2020260719221920.png)

对于该模型，用以上方式设置 `in_1` 、`in_2`、`out_1`。此后，工作区中会出现设置好的 Signal 变量。可以通过 `save <filename>`  保存为 `.mat` 文件。如下图所示。

![](assets/Pasted%20image%2020260719221929.png)

点击 Ctrl+E 打开模型参数设置。在求解器（Solver）栏目中设置求解器为定步长。在硬件实现（Hardware Implementation）中可以设置生成代码支持的目标硬件板。在代码生成（Code Generation）中，可以设置为支持的工具链、目标文件等。（如嵌入式系统可以设置系统目标文件为 `ert.tlc` ）。此处选择如下。

![](assets/Pasted%20image%2020260719230842.png)

![](assets/Pasted%20image%2020260719230643.png)

右键该子系统，选择编译该子系统。

![](assets/Pasted%20image%2020260719221944.png)

其生成了如下代码：

![](assets/Pasted%20image%2020260719230725.png)

在实际使用时，需要将所有的 `.c/.h` 文件拷贝下来，并在 `CMakeLists.txt`  下引入：

```c
cmake_minimum_required(VERSION 3.20)

project(calcPoly LANGUAGES C)

add_executable(calcPoly
    main.c
    src/calcPoly.c
)
```

查看主要文件 `calcPoly.c` ，其存在下列内容，这便是我们定义为 ExportedGlobal 的信号：

```c
/* Exported block signals */
real_T in_1;                           /* '<Root>/in_1' */
real_T in_2;                           /* '<Root>/in_2' */
real_T out_1;                          /* '<S1>/Add' */
```

可以查看 `calcPoly.h` 查看其文件组成：

```c
/*
 * Exported Global Signals
 *
 * Note: Exported global signals are block signals with an exported global
 * storage class designation.  Code generation will declare the memory for
 * these signals and export their symbols.
 *
 */
extern real_T in_1;                    /* '<Root>/in_1' */
extern real_T in_2;                    /* '<Root>/in_2' */
extern real_T out_1;                   /* '<S1>/Add' */

/* Model entry point functions */
extern void calcPoly_initialize(void);
extern void calcPoly_step(void);
extern void calcPoly_terminate(void);

/* Real-time Model object */
extern RT_MODEL_calcPoly_T *const calcPoly_M;
```

可以看到其定义了三个函数，用于初始化、步进、停止。

调用方式可以在 `ert_main.c` 中了解到：

```c
#include <stddef.h>
#include <stdio.h>            /* This example main program uses printf/fflush */
#include "calcPoly.h"                  /* Model header file */

void rt_OneStep(void);
void rt_OneStep(void)
{
  static boolean_T OverrunFlag = false;

  /* Disable interrupts here */

  /* Check for overrun */
  if (OverrunFlag) {
    rtmSetErrorStatus(calcPoly_M, "Overrun");
    return;
  }

  OverrunFlag = true;

  /* Save FPU context here (if necessary) */
  /* Re-enable timer or interrupt here */
  /* Set model inputs here */

  /* Step the model */
  calcPoly_step();

  /* Get model outputs here */

  /* Indicate task complete */
  OverrunFlag = false;

  /* Disable interrupts here */
  /* Restore FPU context here (if necessary) */
  /* Enable interrupts here */
}

int_T main(int_T argc, const char *argv[])
{
  /* Unused arguments */
  (void)(argc);
  (void)(argv);

  /* Initialize model */
  calcPoly_initialize();

  /* Attach rt_OneStep to a timer or interrupt service routine with
   * period 0.2 seconds (base rate of the model) here.
   * The call syntax for rt_OneStep is
   *
   *  rt_OneStep();
   */
  printf("Warning: The simulation will run forever. "
         "Generated ERT main won't simulate model step behavior. "
         "To change this behavior select the 'MAT-file logging' option.\n");
  fflush((NULL));
  while (rtmGetErrorStatus(calcPoly_M) == (NULL)) {
    /*  Perform application tasks here */
  }

  /* Terminate model */
  calcPoly_terminate();
  return 0;
}
```

当然有更加简单的方式（类似的）：

```c
#include "src/calcPoly.h"
#include <stdio.h>

int main() {
  calcPoly_initialize();
  in_1 = 5, in_2 = 10;

  calcPoly_step();
  calcPoly_terminate();

  printf("Value of out_1: %f.\n", out_1);

  return 0;
}
```

链接、编译、运行，发现现象符合预期。

![](assets/Pasted%20image%2020260719231058.png)

参考来源：https://www.bilibili.com/video/BV1TQ4y1Q7jh