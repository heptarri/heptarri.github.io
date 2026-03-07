> Event 是一种同步原语，用以协调多个任务的执行，管理任务的等待队列（区分于 Task）。

## 事件类型定义

首先给出头文件中关于 Event 类型（_eEventType）的定义：

```c
typedef enum _eEventType
{
    eEventTypeUnknown               = (0 << 16),    //未定义类型
    eEventTypeSem                 	= (1 << 16),    //信号量类型
    eEventTypeMbox                	= (2 << 16),    //邮箱类型
    eEventTypeMemPool              	= (3 << 16),    //存储块类型
    eEventTypeEventGroup           	= (4 << 16),    //事件标志组
    eEventTypeMutex                 = (5 << 16),    //互斥信号量类型
}eEventType;

typedef struct  _tEvent
{
    eEventType type;

    tList waitList; 
    
}tEvent;
```

其中每个事件（Event） 是一个由事件类型和事件等待链表组成的结构体，表明了事件类型和事件之间的次序关系。

## 初始化事件控制快

```c
void vEventInit(tEvent * event, eEventType type)
{
    event->type = type;
    vListInit(&event->waitList);
}
```

该部分将 event 设置为 type 中的参数。

## 初始化等待任务（使任务进入等待状态）

```c
void vEventWait(tEvent * event, tTask * task, void * msg, uint32_t state, uint32_t timeout)
{
    /* 进入临界区 */
    uint32_t status = uTaskEnterCritical();

    // task->state = state;
    
    /* 设置任务等待的事件结构 */
    task->waitEvent = event;
    /* 设置任务等待事件的消息存储位置  */
    task->waitEventMsg = msg;
    /* 清空事件的等待结果 */
    task->waitEventResult = eErrorNoError;

    /* 将任务从就绪队列中移除 */
    vTaskRdyListRemove(task);

    /* 将任务插入到等待队列中 */
    vListInsertLast(&event->waitList, &task->linkNode);

    if (timeout)
    {
        tTaskDelayWait(task, timeout);
    }

    /* 退出临界区 */
    vTaskExitCritical(status);
}
```

用于使当前任务进入等待状态。

首先在临界区中设置任务等待时间的信息，然后从就绪任务队列中删除，插入等待队列。

## 唤醒等待任务

```c
tTask * tEventWakeUp(tEvent * event, void * msg, uint32_t result)
{
    tTask * task  = (tTask *)0;
    tNode * node;

    uint32_t status = uTaskEnterCritical();

    /* 获取等待队列的第一个节点 */
    if((node = tListRemoveFirst(&event->waitList)) != (tNode *)0)
    {
        /* 获取该节点对应的任务控制块 */
        task = (tTask *)nodeParent(node, tTask, linkNode);

        /* 设置收到的消息、结构，清除相应的等待标志位 */
        task->waitEvent = (tEvent *)0;
        task->waitEventMsg = msg;
        task->waitEventResult = result;

        if(task->delayTicks != 0)
        {
            vTaskDelayWakeUp(task);
        }

        /* 将任务加入就绪队列 */
        vTaskSchedRdy(task);

    }

    vTaskExitCritical(status);

    return task;
}
```

唤醒等待队列中的第一个任务。

在临界区中获取等待队列的第一个节点，设置任务控制块，然后加入就绪队列。

## 唤醒指定等待任务

```c
void vEventWakeUpTask(tEvent * event, tTask * task, void *msg, uint32_t result);
```

## 从等待队列中删除任务

```c
void vEventRemoveTask(tTask * task, void * msg, uint32_t result)
{
 	 /* 进入临界区 */
    uint32_t status = uTaskEnterCritical();

	/* 将任务从所在的等待队列中移除 */
	vListRemoveNode(&task->waitEvent->waitList, &task->linkNode);

  	/* 设置收到的消息、结构，清除相应的等待标志位 */
    task->waitEvent = (tEvent *)0;
    task->waitEventMsg = msg;
   	task->waitEventResult = result;

	/* 退出临界区 */
    vTaskExitCritical(status);     
}
```

## 删除所有等待中的任务

```c
uint32_t uEventRemoveAll(tEvent * event, void * msg, uint32_t result)
{
    uint32_t  count;

    tNode * node ;

 	 /* 进入临界区 */
    uint32_t status = uTaskEnterCritical();    

    count = uGetListNodeCount(&event->waitList);

    while ((node = tListRemoveFirst(&event->waitList)) != (tNode * )0)
    {       
        tTask * task = (tTask *) nodeParent(node, tTask, linkNode);

        /* 设置收到的消息、结构，清除相应的等待标志位 */
        task->waitEvent = (tEvent *)0;
        task->waitEventMsg = msg;
        task->waitEventResult = result;

        if(task->delayTicks != 0)
        {
            vTaskDelayWakeUp(task);
        }

        /* 将任务加入就绪队列 */
        vTaskSchedRdy(task);
    }

	/* 退出临界区 */
    vTaskExitCritical(status);    

    return count; 
}
```

同时将事件发送给所有任务。

## 获取等待任务数量

```c
uint32_t uEventGetWaitCount(tEvent * event)
{
    uint32_t count = 0;

    uint32_t status = uTaskEnterCritical();

    count = uGetListNodeCount(&event->waitList);  

    vTaskExitCritical(status);     

    return count;    
}

```