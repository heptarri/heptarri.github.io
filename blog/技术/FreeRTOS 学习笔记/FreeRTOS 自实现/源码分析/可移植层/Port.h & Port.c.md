该部分针对 ARMCM内核（ARM Cortex-M）进行了适配。

## 任务调度

```c
void taskScheduler(void)
{
    MEM32(NVIC_INT_CTRL) = NVIC_PENDSVSET;    // 向NVIC_INT_CTRL写NVIC_PENDSVSET，用于PendSV
}
```

其中 NVIC_INIT_CTRL、NVIC_PENDSVSET 的值在头文件中定义（下同）：

```c
#define NVIC_INT_CTRL       0xE000ED04      // 中断控制及状态寄存器
#define NVIC_PENDSVSET      0x10000000      // 触发软件中断的值
#define NVIC_SYSPRI2        0xE000ED22      // 系统优先级寄存器
#define NVIC_PENDSV_PRI     0x000000FF      // 配置优先级
```

该部分用于使能 PendSV 中断，即使能 NVIC 的 ICSR 寄存器的 PENDSVSET 位。在安全时，PendSV 将在中断优先级允许时被触发。

> PendSV（可挂起系统调用异常）是 ARM Cortex-M 提供的一个特殊异常，用于实现**任务切换**。 RTOS 在需要切换任务时，会通过写 `NVIC_INT_CTRL` 寄存器设置 `PENDSVSET` 位。 CPU 在所有中断处理完成后，会自动触发 `PendSV_Handler()` 执行任务切换。

## 运行第一个任务

```c
void taskFristRun(void) {
  /* 设置 PSP = MSP, 二者都指向同一个堆栈 */
  __set_PSP(__get_MSP());

  MEM8(NVIC_SYSPRI2) =
      NVIC_PENDSV_PRI;  // 向NVIC_SYSPRI2写NVIC_PENDSV_PRI，设置其为最低优先级

  MEM32(NVIC_INT_CTRL) =
      NVIC_PENDSVSET;  // 向NVIC_INT_CTRL写NVIC_PENDSVSET，用于PendSV
}
```

该部分将在系统上电时运行 PSP=MSP，将 PendSV 优先级设为最低，置位 NVIC_PENDSVSET 用于触发 PendSV 中断实现首次上下文切换。

ARM 有两个堆栈：

- MSP：主堆栈（用于异常模式）
- PSP：进程堆栈（用于任务模式）

任务启动时先把PSP设置为MSP的当前值，从系统主堆栈切换到任务栈。然后触发一次 PendSV，进入第一个任务。

## 临界区出/入

> 临界区（Critical Section）是指在并发编程中需要**独占**访问共享资源的程序片段。其可以确保内存池的数据结构在修改时的完整性。

> 实现中对于Enter/Exit 临界区的操作实现为禁用/启用中断（位于 port.c 中）：

```c
uint32_t uTaskEnterCritical(void)
{
    uint32_t primask = __get_PRIMASK();
    __disable_irq();
    return primask;
}

void vTaskExitCritical(uint32_t status)
{
    __set_PRIMASK(status);
}
```

`PRIMASK` 是 ARM 的中断屏蔽寄存器，bit0 = 1 表示屏蔽所有可屏蔽中断。

## 配置 SysTick 和节拍中断

SysTick 是 Cortex-M 内置的定时器，用于**产生周期性中断**。RTOS 利用其作为系统节拍定时器，用来维护任务延时与调度。

```c
void vTaskSetTickPeriod(uint32_t time)
{
    /* System Core Clock update function */
    SystemCoreClockUpdate();
    
    SysTick->LOAD  = time * SystemCoreClock / 1000 - 1; 
    NVIC_SetPriority (SysTick_IRQn, (1<<__NVIC_PRIO_BITS) - 1);
    SysTick->VAL   = 0;                           
    SysTick->CTRL  = SysTick_CTRL_CLKSOURCE_Msk |
                    SysTick_CTRL_TICKINT_Msk   |
                    SysTick_CTRL_ENABLE_Msk; 
}

/* SysTick中断服务函数 */
void SysTick_Handler () 
{
    vTaskSystemTickHandler();
}
```

> 对于 SysTick 的解释：该变量存在于 core_cm4.h 中，由 ARM 提供。其定义如下：

```c
#define SysTick             ((SysTick_Type   *)     SysTick_BASE  )   /*!< SysTick configuration struct */
```

其为一个 SysTick_Type 引用类型的 SysTick_BASE。

查看 SysTick_Type：

```c
typedef struct
{
  __IOM uint32_t CTRL;                   /*!< Offset: 0x000 (R/W)  SysTick Control and Status Register */
  __IOM uint32_t LOAD;                   /*!< Offset: 0x004 (R/W)  SysTick Reload Value Register */
  __IOM uint32_t VAL;                    /*!< Offset: 0x008 (R/W)  SysTick Current Value Register */
  __IM  uint32_t CALIB;                  /*!< Offset: 0x00C (R/ )  SysTick Calibration Register */
} SysTick_Type;
```

发现其定义了包括 CTRL、LOAD、VAL等 SysTick 相关变量。

查看 SysTick_BASE：

```c
#define SCS_BASE            (0xE000E000UL)                            /*!< System Control Space Base Address */
#define SysTick_BASE        (SCS_BASE +  0x0010UL)                    /*!< SysTick Base Address */
```

发现其依然为某地址偏移量。

下面的 Handler 函数提供了 RTOS 的时钟服务。

```c
void SysTick_Handler () 
{
    vTaskSystemTickHandler();
}
```

## 任务堆栈初始化

本部分采用宏定义分别设置 CM0/CM3/CM4 内核：

```c
#if defined(__TARGET_CPU_CORTEX_M0)
#elif defined(__TARGET_CPU_CORTEX_M3) || defined(__TARGET_CPU_CORTEX_M4)
#endif
```

现取 CM0 作说明。

```c
void hwStackInit(tTask * task, void (*entry)(void *), void *param, uint32_t * stack, uint32_t size)
{
    /* 定义栈顶 */
    uint32_t * stackTop;

    task->stackBase = stack;
    task->stackSize = stackSize;
    /* 初始化堆桟中的值 */

    memset(stack, 0, stackSize);

    stackTop = task->stackBase + task->stackSize / sizeof(tTaskStack);

    *(--stackTop) = (unsigned long)(1<<24);                        // XPSR, 设置了Thumb模式
    *(--stackTop) = (unsigned long)entry;                          // 程序的入口地址
    *(--stackTop) = (unsigned long)0x14;                           // R14(LR)
    *(--stackTop) = (unsigned long)0x12;                           // R12, 未用
    *(--stackTop) = (unsigned long)0x3;                            // R3, 未用
    *(--stackTop) = (unsigned long)0x2;                            // R2, 未用
    *(--stackTop) = (unsigned long)0x1;                            // R1, 未用
    *(--stackTop) = (unsigned long)param;                          // R0 = param, 传给任务的入口函数

    *(--stackTop) = (unsigned long)0x7;                            // R7, 未用
    *(--stackTop) = (unsigned long)0x6;                            // R6, 未用
    *(--stackTop) = (unsigned long)0x5;                            // R5, 未用
    *(--stackTop) = (unsigned long)0x4;                            // R4, 未用
    
    *(--stackTop) = (unsigned long)0x11;                           // R11, 未用
    *(--stackTop) = (unsigned long)0x10;                           // R10, 未用
    *(--stackTop) = (unsigned long)0x9;                            // R9, 未用
    *(--stackTop) = (unsigned long)0x8;                            // R8, 未用

    task->stack             = stackTop;                            // 保存最终的值    
}
```

在创建任务时，系统会分配一段内存作为堆栈。ARM 在任务切换时会自动从堆栈中恢复寄存器状态，所以需要构造一个假的任务现场，这样在 PendSV 恢复时，任务就能像从中断返回一样跳转到入口函数。

首先，该函数先将栈 stack 清零，然后计算出栈顶地址（stackTop）（由于 ARM 的堆栈是从高地址向低地址增长，所以需要从栈顶地址向下填充寄存器）。

然后依次向栈中压入假的异常堆栈帧：

| 相对地址    | 寄存器名 | 初始化值       | 作用         |
| ------- | ---- | ---------- | ---------- |
| SP+0x00 | R0   | param      | 传递任务参数     |
| SP+0x04 | R1   | 0x01       | 占位         |
| SP+0x08 | R2   | 0x02       | 占位         |
| SP+0x0C | R3   | 0x03       | 占位         |
| SP+0x10 | R12  | 0x12       | 占位         |
| SP+0x14 | LR   | 0x14       | 返回地址       |
| SP+0x18 | PC   | entry      | 任务入口地址     |
| SP+0x1C | xPSR | 0x01000000 | 设置 Thumb 位 |

当 PendSV 异常切换到这个任务并执行 BX LR 返回时，硬件会自动弹出这些值用于恢复寄存器，然后跳转到 entry()。

下一步构建软件保存寄存器：

对于 PendSV_Handler 手动保存的寄存器，在切换任务时，内核使用 STMIA 指令保存 R4-R11，在这里要预先构造这些寄存器的初始值。当任务第一次被恢复时， PendSV_Handler 会从这里恢复出寄存器。

```c
*(--stackTop) = 0x11;   // R11
*(--stackTop) = 0x10;   // R10
*(--stackTop) = 0x9;    // R9
*(--stackTop) = 0x8;    // R8
*(--stackTop) = 0x7;    // R7
*(--stackTop) = 0x6;    // R6
*(--stackTop) = 0x5;    // R5
*(--stackTop) = 0x4;    // R4
```

最后记录栈顶。

```c
task->stack             = stackTop;
```

此时 stackTop 指向完整的任务现场，包含伪造的中断帧。 RTOS 调度器恢复到 task→ stack 所指地址就可以重新启动任务。

## PendSV_Handler 任务切换异常

PendSV 是任务切换的核心异常，执行上下文切换：

1. 保存当前任务寄存器到堆栈；
2. 调用 `loadStackAddress()` 切换任务控制块；
3. 恢复下一个任务寄存器；
4. 从新任务的堆栈恢复运行。

```c
__asm void PendSV_Handler ()
{   
    IMPORT  loadStackAddress      
    
    /* 保存当前上下文 */
    MRS     R0, PSP                   // 获取当前任务的堆栈指针

    MOVS    R1, #32
    SUBS    R0, R1                    // 预先计算, R0此时得出的最后的堆栈地址,方便后面用stmia保存
                                      //     保存的地址是当前任务的PSP堆栈中,便于下次恢复
    STMIA   R1!, {R4-R7}              //     将除异常自动保存的寄存器这外的其它寄存器自动保存起来{R4, R11}
    MOV     R4, R8                    // 在cortex-m0不STMDB不支持访问R8~R11寄存器,所以下面通过R4~R7间接写入
    MOV     R5, R9
    MOV     R6, R10
    MOV     R7, R11
    STMIA   R1!, {R4-R7}

    BL      loadStackAddress        // 调用函数：参数通过R0传递，返回值也通过R0传递 
    
    LDMIA   R0!, {R4-R7}                // cortex-m0不支持LDMIA访问R8-R11,所以通过R4-R7间接取出
    MOV     R8, R4                      
    MOV     R9, R5
    MOV     R10, R6
    MOV     R11, R7
    LDMIA   R0!, {R4-R7}                // 取出R4-R7

    MSR     PSP, R0                     // 最后，恢复真正的堆栈指针到PSP

    MOVS    R0, #2                      // 生成0xFFFFFFFD
    MVNS    R0, R0
    BX      R0                          // 最后返回，此时任务就会从堆栈中取出LR值，恢复到上次运行的位置
   
}
```

其中 `BL loadStackAddress` 用于切换任务控制块。函数实现如下：

```c
uint32_t loadStackAddress(uint32_t *stackAddress)
{
    if(currentTask != (tTask*)0)
        currentTask->stack = stackAddress; // 保存当前任务栈指针

    currentTask = nextTask; // 切换任务控制块
    return (uint32_t)currentTask->stack; // 返回新任务的堆栈地址
}
```

综上，该 RTOS 在 CM0/3/4 内核上运行流程如下：

- 系统初始化 → 创建任务并调用 `hwStackInit()` 初始化栈；
- 调用 `taskFristRun()` → 启动第一个任务；
- 每次需要切换任务时：
    - `taskScheduler()` 触发 `PendSV`;
    - `PendSV_Handler()` 保存当前任务上下文；
    - 调用 `loadStackAddress()` 更新当前任务指针；
    - 恢复下一个任务上下文；
    - 返回新任务执行。