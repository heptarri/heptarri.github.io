# Mempool.h & Mempool.c

该组文件实现了一个固定大小块的内存池，用以在 RTOS 中高效分配/释放固定尺寸的内存块，并支持基于事件机制的阻塞等待、唤醒。

首先给出头文件中的数据结构 _tMemPool 和 _tMemPoolInfo：

```c
typedef struct _tMemPool {
  /* 事件控制块 */
  tEvent event;

  /* 存储块的起始地址 */
  void* memStartAddress;

  /* 每个存储块的大小 */
  uint32_t blockSize;

  /* 存储块的总数 */
  uint32_t blockTotalCount;

  /* 未使用的存数块数量 */
  uint32_t blockFreeCount;

  /* 存储块的列表 */
  tList blockList;

  /* 挂起的列表 */
  tList suspendList;

} tMemPool;

typedef struct _MemPoolInfo {
  /* 当前储存块计数 */
  uint32_t blockCount;

  /* 存储块总数 */
  uint32_t TalolCount;

  /* 未使用的存储块数量 */
  uint32_t freeCount;

  /* 每个存储块的大小 */
  uint32_t blockSize;

  /* 挂起的任务 */
  uint32_t suspendCount;
} tMemPoolInfo;
```

其中 tMemPool 是内存池的数据结构*，*_tMemPool 是对内存池的部分数据记录结构：

- tMemPool
    - tEvent event：用于管理等待分配块的任务队列（事件控制块）。
    - void *memStartAddress、uint32_t blockSize、blockTotalCount、blockFreeCount：记录内存区起始、块大小、总数与空闲数（注意实现中 blockFreeCount 未被维护）。
    - tList blockList：空闲块链表（每个块用 tNode 嵌入式节点）。
    - tList suspendList：挂起任务链表（未直接在实现中显式使用，事件里有挂起队列）。
- tMemPoolInfo：用于导出池的统计信息（注意有拼写/命名不一致 TalolCount 等）。

主要接口和行为

- vMemPoolInit(memPool, startAddress, blockSize, blockTotalCount)
    
    - 校验 blockSize >= sizeof(tNode)。
    - 初始化事件、块链表与挂起链表。
    - 把 startAddress 按 blockSize 切分，每个块作为 tNode 初始化并插入 blockList（作为空闲块集合）。
    
    ```c
    void vMemPoolInit(tMemPool* memPool, void* startAddress, uint32_t blockSize,
                      uint32_t blockTotalCount) {
      uint8_t* memBlockStart = (uint8_t*)startAddress;
      uint8_t* memBlockEnd = (uint8_t*)startAddress + blockSize * blockTotalCount;
    
      if (blockSize < sizeof(tNode)) {
        return;
      }
    
      /* 初始化事件控制块 */
      vEventInit(&memPool->event, eEventTypeMemPool);
    
      /* 初始化Block相关参数 */
      memPool->memStartAddress = startAddress;
      memPool->blockSize = blockSize;
      memPool->blockTotalCount = blockTotalCount;
    
      /* 初始化存储块链表 */
      vListInit(&memPool->blockList);
      while (memBlockStart < memBlockEnd) {
        /* 初始化每一个储存块节点 */
        vNodeInit((tNode*)memBlockStart);
        /* 将存储块节点加入到储存块链表中 */
        vListInsertLast(&memPool->blockList, (tNode*)memBlockStart);
        memBlockStart += blockSize;
      }
    ```
    
- vMemPoolGetInfo(memPool, info)
    
    - 在临界区读取并填充信息（blockCount、TalolCount、freeCount、blockSize、suspendCount）。注意实现把 blockList.nodeCount 当作 blockCount（实际是空闲块数）。
    
    ```c
    void vMemPoolGetInfo(tMemPool* memPool, tMemPoolInfo* info) {
      uint32_t status = uTaskEnterCritical();
    
      info->blockCount = memPool->blockList.nodeCount;
      info->TalolCount = memPool->blockTotalCount;
      info->freeCount = info->TalolCount - info->blockCount;
      info->blockSize = memPool->blockSize;
      info->suspendCount = memPool->suspendList.nodeCount;
    
      vTaskExitCritical(status);
    }
    ```
    
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
    
- uMemPoolWaitAlloc(memPool, &memBlock, timeout)
    
    - 在临界区：若 blockList 非空，直接移除一个块返回。
    - 否则：通过 vEventWait 把 currentTask 挂入等待队列并出临界区，调度（vTaskSched）。任务被唤醒后，从 currentTask 的等待消息中取到分配到的块和结果码返回。
    
    ```c
    uint32_t uMemPoolWaitAlloc(tMemPool* memPool, uint8_t** memBlock,
                               uint32_t timeout) {
      uint32_t status = uTaskEnterCritical();
    
      /* 如果内存是中还有空余的内存块，直接取出一块 */
      if (uGetListNodeCount(&memPool->blockList) > 0) {
        *memBlock = (uint8_t*)tListRemoveFirst(&memPool->blockList);
        vTaskExitCritical(status);
        return eErrorNoError;
      }
      /* 没有空余的内存块 */
      else {
        /* 将任务加入事件的队列中 */
        vEventWait(&memPool->event, currentTask, (void*)0, eEventTypeMemPool,
                   timeout);
        vTaskExitCritical(status);
    
        /* 发起任务调度 */
        vTaskSched();
    
        /* 当任务切换回来时获取任务的消息 */
        *memBlock = currentTask->waitEventMsg;
    
        /* 返回事件结果 */
        return currentTask->waitEventResult;
      }
    
      vTaskExitCritical(status);
    }
    ```
    
- uMemPoolNoWaitAlloc(memPool, &memBlock)
    
    - 非阻塞分配：若无空闲块返回资源不可用错误码。
    
    ```c
    uint32_t uMemPoolNoWaitAlloc(tMemPool* memPool, uint8_t** memBlock) {
      uint32_t status = uTaskEnterCritical();
    
      if (uGetListNodeCount(&memPool->blockList) > 0) {
        *memBlock = (uint8_t*)tListRemoveFirst(&memPool->blockList);
        vTaskExitCritical(status);
        return eErrorNoError;
      } else {
        vTaskExitCritical(status);
        return eErrorResourceUnavaliable;
      }
    }
    ```
    
- vMemPoolFree(memPool, memBlock)
    
    - 在临界区：如果有等待该事件的任务（uEventGetWaitCount>0），唤醒队头任务（tEventWakeUp），并把 memBlock 作为消息传给被唤醒任务；若唤醒任务优先级高于当前任务，会触发调度。
    - 否则把该块作为节点插回 blockList（空闲）。
    
    ```c
    void vMemPoolFree(tMemPool* memPool, void* memBlock) {
      uint32_t status = uTaskEnterCritical();
    
      /* 检查是否有等待请求储存块的任务 */
      if (uEventGetWaitCount(&memPool->event) > 0) {
        /* 如果有直接唤醒等待队列的第一个任务 */
        tTask* task = tEventWakeUp(&memPool->event, (void*)memBlock, eErrorNoError);
    
        /* 检查是或需要任务切换 */
        if (task->prio > currentTask->prio) {
          vTaskSched();
        }
      } else {
        /* 等待列表为空，则将存储块加入存储池中 */
        vListInsertLast(&memPool->blockList, (tNode*)memBlock);
      }
    
      vTaskExitCritical(status);
    }
    
    ```
    
- uMemPoolDelete(memPool)
    
    - 在临界区调用 uEventRemoveAll 唤醒所有等待任务并返回被唤醒的计数（返回后可能触发调度）。
    
    ```c
    uint32_t uMemPoolDelete(tMemPool* memPool) {
      uint32_t status = uTaskEnterCritical();
    
      /* 唤醒等待该内存块的所有任务 */
      uint32_t count = uEventRemoveAll(&memPool->event, (void*)0, eErrorDelete);
    
      vTaskExitCritical(status);
    
      if (count) {
        vTaskSched();
      }
      return count;
    }
    ```
    

并发与调度相关

- 关键区使用 uTaskEnterCritical / vTaskExitCritical 包裹对数据结构的访问。
- 当某次操作导致需要切换任务（例如唤醒高优先级任务、或等待释放后任务被阻塞再恢复），通过 vTaskSched 触发调度。
- 事件机制与 currentTask、tEvent 等全局内核结构配合实现阻塞/唤醒。