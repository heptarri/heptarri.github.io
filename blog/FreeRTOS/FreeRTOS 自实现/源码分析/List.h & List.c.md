本组文件主要实现了一个循环双向链表的数据结构，用于进行内核任务和对象管理。

首先给出头文件中对于 tNode、tList 的结构定义：

```c
typedef struct  _tNode
{
    struct _tNode * preNode;
    struct _tNode * nextNode;
}tNode;

typedef struct _tList
{
    tNode   headNode;
    uint32_t nodeCount;
    
}tList;
```

其中 _tNode 是链表中的节点数据结构，包含该节点的前后连接关系，而 _tList 是整个链表的数据结构，包含链表头节点和节点计数。

主要函数：

- 初始化
    
    - vNodeInit(tNode *node)：把单个节点设为自指（孤立节点）。
    
    ```c
    void vNodeInit(tNode *node)
    {
        node->nextNode = node;
        node->preNode  = node;
    }
    ```
    
    - vListInit(tList *list)：把链表设为空，head 指向自身，nodeCount=0。
    
    ```c
    void vListInit(tList * list)
    {
        list->headNode.nextNode  = &(list->headNode);
        list->headNode.preNode  = &(list->headNode);
        list->nodeCount = 0;
    }
    ```
    
- 读取/查询
    
    - uGetListNodeCount、tGetFirstNode、tGetLastNode：返回节点个数、首/尾节点（空时返回 NULL）。
    
    ```c
    uint32_t uGetListNodeCount(tList *list)
    {
        return list->nodeCount;
    }
    
    tNode * tGetFirstNode(tList * list)
    {
        tNode * node = (tNode *)0;
    
        if (list->nodeCount != 0)
        {
            node = list->headNode.nextNode;
        }
        return node;
    }
    // ...
    ```
    
    - tGetListPre、tGetListNext：返回指定节点的前/后节点（节点孤立时返回 NULL）。
    
    ```c
    tNode * tGetListPre(tList * list, tNode * node)
    {
        if(node->preNode == node)
        {
            return (tNode *)0;
        }
        else
        {
            return node->preNode;
        }
    }
    // ...
    ```
    
- 插入（均为 O(1)）
    
    - vListInsertHead：把新节点插入到 head 之后（成为第一个节点）。
    
    ```c
    void vListInsertHead(tList * list, tNode * node)
    {
        node->nextNode = list->headNode.nextNode;   
        node->preNode = list->headNode.nextNode->preNode;             
        
        list->headNode.nextNode->preNode = node;    
        list->headNode.nextNode = node;             
    
        list->nodeCount++;
    }
    ```
    
    - vListInsertLast：把新节点插入到尾部（成为最后一个节点）。
    - vListInsertNodeAfter：在指定节点之后插入新节点。
    
    ```c
    void vListInsertNodeAfter(tList * list, tNode * newNode, tNode * toNode)
    {
        newNode->nextNode = toNode->nextNode;
        newNode->preNode = toNode->nextNode->preNode;
    
        toNode->nextNode->preNode = newNode;
        toNode->nextNode = newNode;
    
        list->nodeCount++;
    }
    ```
    
- 删除（均为 O(1)）
    
    - tListRemoveFirst、tListRemoveLast：**移除并返回首/尾节点**（空时返回 NULL）。
    - vListRemoveNode：从链表中移除指定节点（不会重置该节点的指针，相关代码被注释掉）。
    
    ```c
    void vListRemoveNode(tList * list, tNode * node)
    {
        node->nextNode->preNode = node->preNode;    
        node->preNode->nextNode = node->nextNode;   
    
        // node->preNode = node;       
        // node->nextNode = node;      
    
        list->nodeCount--;
    }
    ```
    
    - vListRemoveAll：遍历并把所有节点重置为孤立状态，同时清空链表计数。
    
    ```c
    void vListRemoveAll(tList * list)
    {
        uint32_t count;
        tNode * nextNode;
            
        /* 遍历所有的结点 */
    	  nextNode = list->headNode.nextNode;
        for (count = list->nodeCount; count != 0; count-- )
        {
        	/* 先纪录下当前结点，和下一个结点,必须纪录下一结点位置，因为在后面的代码中当前结点的next会被重置 */
            tNode * currentNode = nextNode;
            nextNode = nextNode->nextNode;
            
            /* 重置结点自己的信息 */
            currentNode->nextNode = currentNode;
            currentNode->preNode = currentNode;
        }
        
        list->headNode.nextNode = &(list->headNode);
        list->headNode.preNode = &(list->headNode);
        list->nodeCount = 0;
    }
    
    ```