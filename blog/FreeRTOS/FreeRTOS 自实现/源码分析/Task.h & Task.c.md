该部分是 RTOS 任务切换的核心逻辑。

## 总体结构

|模块|功能概述|
|---|---|
|任务控制与状态管理|保存和切换任务状态（就绪、阻塞、挂起、删除等）|
|调度器 (Scheduler)|决定哪个任务获得 CPU 执行权|
|延时与节拍处理|处理任务延时与系统心跳 (Tick)|
|挂起与恢复|支持任务临时挂起和恢复|
|删除与清理机制|支持任务删除与清理回调|
|空闲任务与CPU统计|空闲任务用于系统空转与CPU利用率计算|

## 全局变量说明

|变量名|含义|
|---|---|
|`currentTask`|当前正在运行的任务|
|`nextTask`|下一个将要切换到的任务|
|`idleTask`|空闲任务（系统最后运行的任务）|
|`taskPrioTable[]`|不同优先级的任务队列表|
|`schedLockCount`|调度锁计数（防止中断时调度）|
|`taskDelayList`|延时队列（存放处于延时状态的任务）|
|`LinOSBitmap`|优先级位图（快速找到最高优先级任务）|
|`systemTicks`|系统时钟节拍计数（类似 SysTick）|
|`cpuUsage`|CPU使用率|
|`idleCount`, `idleMaxCount`|用于 CPU 利用率计算|

对于 _Task 任务结构，头文件中给出如下声明：

```c
typedef struct _tTask {

	/* stack保存了最后保存环境参数的地址位置，用于后续恢复 */
    tTaskStack * stack;

    /* 堆桟的起始地址 */
    uint32_t *stackBase;
    /* 堆桟大小 */
    uint32_t stackSize;

    /* 连接节点 */
    tNode linkNode;

    /* 任务延时计数器 */  
    uint32_t delayTicks;

    /* 任务优先级 */
    uint32_t prio;

    /* 延时节点 */
    tNode delayNode;

    /* 当前任务状态 */
    uint32_t state;

    /* 当前剩余的时间片 */
    uint32_t slice;

    /* 挂起次数 */
    uint32_t supendCount;

    /* 任务删除时的清理函数 */
    void (*clean) (void * param);
    /* 传递给清理函数的参数 */
    void * cleanParam;
    /* 请求删除得标志 */
    uint8_t requestsDeleteFlag;

    /* 任务正在等待的事件类型 */
    struct _tEvent * waitEvent;
    /* 等待事件的消息存储位置 */
    void * waitEventMsg;
    /* 等待事件的结果 */
    uint32_t waitEventResult;

    /* 等待是件结果 */
    uint32_t waitEventGroupType;
    /* 等待事件标志 */
    uint32_t waitEventGroupFlag;
}tTask;

typedef struct  _tTaskInfo
{
    /* 任务延时计时器 */
    uint32_t delayTicks;
    /* 任务优先级 */
    uint32_t prio;
    /* 任务当前状态 */
    uint32_t state;
    /* 任务剩余时间片 */
    uint32_t slice;
    /* 任务挂起次数 */
    uint32_t supendCount;

    /* 堆桟总容量 */
    uint32_t stackSize;
    /* 堆桟剩余量 */
    uint32_t stackFree;
}tTaskInfo;

```