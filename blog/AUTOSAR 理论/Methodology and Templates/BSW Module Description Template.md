# BSW Module Description Template

原文： [AUTOSAR_CP_TPS_BSWModuleDescriptionTemplate](../AUTOSAR%20标准文档/AUTOSAR_CP_TPS_BSWModuleDescriptionTemplate.pdf)
## 概述

BSW Module Template Specification 文件说明了定义 BSW 模块的 Module Description 写法（结构、章节、命名规则），明确厂商的配置工具需要将用户配置的参数通过何种方式描述出来。

BSWMDT 适用于 BSW 模块/集群和库。

库（Library）是一种特殊的模块。与 BSW 模块相同，其可以为基本软件和应用程序提供服务，而且可以通过 Function-Call 进行访问。与 BSW 模块不同的是，**库可以直接从 SWC 调用，而不是必须通过 RTE。**

BSWMDT 可以用于：
- 在代码实现之前根据接口和依赖指定 BSW 模块或集群
- 用作一致性检测，即检测是否符合 AUTOSAR 标准
- 可以用于描述交付生产的 BSW 模块。其包含内部行为、实现方式、约束等
- 供集成商使用以添加更多信息
- 添加来自上游的测量校准工具
- 实现 RTE（Runtime Environment）和 BSW Scheduler 代码实现的内容部分（如版本信息、内存段、数据结构）等。由 RTE 生成器完成。

这些功能会在下文中被详细阐述，并在 [Software Component Template](Software%20Component%20Template.md) 中有详细的说明。

## Three Layer Approach 三层模型

整个 BSWMDT 由三层架构实现。

![](/attachments/Pasted%20image%2020260123215232.png)

### BswModuleDescription

最上层包含了所有已提供和必须的接口规范，包括和其他模块的依赖关系。

### BswInternalBehavior

中间层包含了模块内部基本活动的模型。其定义了模块对于 OS 和 BSW Scheduler 的要求。对于相同的 BswModuleDescription，可能会有不同的中间层实例。

### BswImplementation

底层包含了关于具体代码的信息。同样，对于相同的 BswInternalBehavior，可能会有不同的底层实例。

这些层之间使用可分割聚合或引用的方式，为 XML 构建提供更大的灵活性。这就像 C 代码项目中包含头文件的方式：多个实现可以共享同一个头文件。即，通过可分割聚合或引用，各层可以被分割在不同的文件中，更低的层可以被很好的修改。

根据三层架构，三层之间的关系并非一一对应，而是有不同的实现方式。如果一个 BSW 模块的不同版本是针对不同 CPU 编译的，则其 BSWMD 可以视为独立的构建，可以共享中间层和上层。

如果是针对同一 CPU 编译的，即在同一个 ECU 中，则处于相同的地址空间（如针对多个 CAN 通道的 CAN Driver），则其 BSWMD 依然应该共享上层和中间层，但是必须有方法确保这两者派生的全局 C 符号是唯一的。一种实现方式是 BSWMDT 中的后缀。

某些 BSW 模块不仅与其他 BSW 模块具有接口，还通过 RTE 为 SWC 提供更加抽象的接口。这些模块可以是 AUTOSAR 服务、ECU 抽象的一部分，或者是复杂驱动程序。

这里提到的更加抽象的接口就是 AUTOSAR 接口。这些接口通过 SWCT （Software Component Template）描述，见：[Software Component Template](Software%20Component%20Template.md)。SWCT的根类是 ServiceSwComponentType、EcuAbstractionSwComponentType 和 ComplexDeviceDriverSwComponentType，均从 AtomicSwComponent 类派生而来。

此外，从 RTE 向 BSW 发送的函数调用被建模为可运行实体（RunnableEntity）。这些实体也在SWCT 中被定义。

因此，对于每个可以通过 AUTOSAR 接口访问的 BSW 模块和集群，除了 BSWMD 外，应该还有一个 XML 文件用于定义 AtomicSwComponent 和 SwcInternalBehavior。

这些额外的描述是为了生成 RTE。对于 AUTOSAR 服务而言，这些额外描述的内容因 ECU 不同可能会不同，因此需要针对每个 ECU 进行创建。

由于上述的模块描述采用了 BSWDMT、SWCT 两种不同的 Template，在描述调度上存在一定模糊性。即两者皆可。需要注意的是，SWC 风格的接口仅用于通过端口通信直接相关的功能调用。

## BSW Module Description 顶层 概览

![](/attachments/Pasted%20image%2020260123221855.png)

该图展示了针对顶层 BswModuleDescription 的连接关系。

本节其余内容对于上图的某些变量定义做了一定约束，再次不再赘述。仅举几例：

对于定义 BswModuleDescription，仅允许以下三种值：
- BSW_MODULE
- BSW_CLUSTER
- LIBRARY
不可以为空或者其他值。

如 BswModuleEntry：

![](/attachments/Pasted%20image%2020260123224703.png)

接下来用例子说明 BSWMDT 中该内容是如何落实的。

比如 SchM 周期调用 `Can_MainFunction_Write` 时：

```c
void Can_MainFunction_Write(void);
```

CAN 模块为 BswModuleEntry 的提供者。根据 [TPS_BSWMDT_04002]，其应该具有：

```xml
<BswModuleDescription>
  <SHORT-NAME>Can</SHORT-NAME>

  <!-- CAN 模块对外提供的接口 -->
  <IMPLEMENTED-ENTRY>
    <BSW-MODULE-ENTRY>
      <SHORT-NAME>Can_MainFunction_Write</SHORT-NAME>

      <!-- 函数签名描述 -->
      <SIGNATURE>
        <RETURN-TYPE/>
        <ARGUMENTS/>
      </SIGNATURE>
    </BSW-MODULE-ENTRY>
  </IMPLEMENTED-ENTRY>

</BswModuleDescription>
```

即提供 Can_MainFunction_Write 作为 implementedEntry - BswModuleEntry。

此时，CAN 模块通过 BSWMD 声明：实现了一个 `Can_MainFunction_Write(void)`。

SchM 模块作为使用者（Usage），根据 [TPS_BSWMDT_04513]，应当有：

```xml
<BswModuleDescription>
  <SHORT-NAME>SchM</SHORT-NAME>

  <!-- SchM 需要的接口 -->
  <EXPECTED-ENTRY>
    <BSW-MODULE-ENTRY>
      <SHORT-NAME>Can_MainFunction_Write</SHORT-NAME>

      <!-- SchM 期望的函数签名 -->
      <SIGNATURE>
        <RETURN-TYPE/>
        <ARGUMENTS/>
      </SIGNATURE>
    </BSW-MODULE-ENTRY>
  </EXPECTED-ENTRY>

</BswModuleDescription>
```

即接受（使用） Can_MainFunction_Write 作为 expectedEntry - BswModuleEntry。

对于标准 [TPS_BSWMDT_04310]，即当 BswModuleEntry 被引用或者 SHORT-NAME 相同时，可以认为是匹配（matching）的。其 SHORT-NAME 均为 Can_MainFunction_Write ，故匹配。

![](/attachments/Pasted%20image%2020260123225914.png)

对于 [constr_4093]，即签名一致性校验，可以认为是其匹配的类型约束：即当两者均为返回类型或返回类型（参数）相同或其 SwServiceArgs 返回的类型相同时，认为是匹配（matching）的。

通过该例，重新理解 Figure 3.1，可以发现其逻辑：

左侧的 BswModuleDescription，对于其属性 ModuleID，即代表了不同的 BSW 模块，如 Det、Can、NvM等。

与其余模块（如 BswModuleEntry、BswModuleDependency）等的连接关系表明引用关系。即表明模块和接口之间的调用关系。

## BSW Interface 接口

该部分描述了针对单一 BSW Module 的接口形态。

![](/attachments/Pasted%20image%2020260123231618.png)

上图体现了对于 BswModuleEntry 模块的接口形态设定。

![](/attachments/Pasted%20image%2020260123231833.png)

该表描述了上图中的部分属性及其类型、数量。BSW 上层厂商可以根据这些信息编写配置软件以使其能够生成符合 AUTOSAR 规范的 XML 文件。如：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<AUTOSAR xmlns="http://autosar.org/schema/r4.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <AR-PACKAGES>
    <AR-PACKAGE>
      <SHORT-NAME>BswModuleEntries</SHORT-NAME>
      <ELEMENTS>
        <!-- 定义一个 BswModuleEntry 实例，代表一个基础软件模块的 API 入口 -->
        <BSW-MODULE-ENTRY UUID="Entry_001">
          <SHORT-NAME>CanIf_Write</SHORT-NAME>
          <!-- 对应表格中的 bswEntryKind 属性 -->
          <BSW-ENTRY-KIND>CONCRETE</BSW-ENTRY-KIND>
          <!-- 对应表格中的 callType 属性 -->
          <CALL-TYPE>SYNCHRONOUS</CALL-TYPE>
          <!-- 对应表格中的 executionContext 属性 -->
          <EXECUTION-CONTEXT>INTERRUPT-1</EXECUTION-CONTEXT>
          <!-- 对应表格中的 functionPrototypeEmitter 属性 -->
          <FUNCTION-PROTOTYPE-EMITTER>RTE</FUNCTION-PROTOTYPE-EMITTER>
          <!-- 对应表格中的 isReentrant 属性 -->
          <IS-REENTRANT>true</IS-REENTRANT>
          <!-- 对应表格中的 argument (ordered) 属性，定义函数的输入输出参数 -->
          <ARGUMENTS>
            <SW-SERVICE-ARG UUID="Arg_001">
              <SHORT-NAME>CanId</SHORT-NAME>
              <SW-DATA-DEF-PROPS>
                <SW-DATA-DEF-PROPS-VARIANTS>
                  <SW-DATA-DEF-PROPS-VARIANT>
                    <SW-DATA-DEF-PROPS-CONDITIONAL>
                      <BASE-TYPE-REF DEST="SW-BASE-TYPE">/AUTOSAR_Platform/BaseTypes/uint32</BASE-TYPE-REF>
                    </SW-DATA-DEF-PROPS-CONDITIONAL>
                  </SW-DATA-DEF-PROPS-VARIANT>
                </SW-DATA-DEF-PROPS-VARIANTS>
              </SW-DATA-DEF-PROPS>
            </SW-SERVICE-ARG>
            <SW-SERVICE-ARG UUID="Arg_002">
              <SHORT-NAME>CanData</SHORT-NAME>
              <SW-DATA-DEF-PROPS>
                <SW-DATA-DEF-PROPS-VARIANTS>
                  <SW-DATA-DEF-PROPS-VARIANT>
                    <SW-DATA-DEF-PROPS-CONDITIONAL>
                      <BASE-TYPE-REF DEST="SW-BASE-TYPE">/AUTOSAR_Platform/BaseTypes/uint8</BASE-TYPE-REF>
                      <SW-ARRAY-SIZE>8</SW-ARRAY-SIZE>
                    </SW-DATA-DEF-PROPS-CONDITIONAL>
                  </SW-DATA-DEF-PROPS-VARIANT>
                </SW-DATA-DEF-PROPS-VARIANTS>
              </SW-DATA-DEF-PROPS>
            </SW-SERVICE-ARG>
          </ARGUMENTS>
        </BSW-MODULE-ENTRY>
      </ELEMENTS>
    </AR-PACKAGE>
  </AR-PACKAGES>
</AUTOSAR>
```

在这段实例 XML 中，容易发现其体现了部分在表中描述的属性：

- `<BSW-ENTRY-KIND>` → `bswEntryKind`
- `<CALL-TYPE>` → `callType`
- `<EXECUTION-CONTEXT>` → `executionContext`
- `<FUNCTION-PROTOTYPE-EMITTER>` → `functionPrototypeEmitter`
- `<IS-REENTRANT>` → `isReentrant`

而厂商会根据这样的接口 XML 描述，生成类似下面的 C 代码：

```c
#include "CanIf.h"
#include "CanDrv.h"  // CAN 驱动头文件

/* CanIf_Write 具体实现 */
void CanIf_Write(uint32 CanId, uint8 CanData[8])
{
    /* 中断上下文保护（对应 executionContext = INTERRUPT-1） */
    Irq_Lock(INTERRUPT_1);
    
    /* 调用 CAN 驱动发送数据（同步调用，对应 callType = SYNCHRONOUS） */
    CanDrv_Write(CanId, CanData, 8);
    
    /* 释放中断保护（保证可重入） */
    Irq_Unlock(INTERRUPT_1);
}
```

## BSW Internel Behavior 中间层 概览

与顶层相同，中间层也有类似的架构图：

![](/attachments/Pasted%20image%2020260123232611.png)

同样提供了某些属性：

![](/attachments/Pasted%20image%2020260123232634.png)

这些属性以同样的方式被生成于 XML 中，组成中间层的描述，即包含了模块内部基本活动的描述。

## BSW Implementation 底层 概览

该层描述了 BSW 软件的实现细节标准。

![](/attachments/Pasted%20image%2020260123233319.png)

## Three Layer Approach 举例说明


## ResourceConsumption

该部分内容定义了当 AUTOSAR 软件映射到 ECU 时，SWC 及 BSW 对资源消耗和系统限制的信息。

> 其他模块的实现方式和链接逻辑大同小异，故在此不再赘述。

## 总结

BSWMDT 提供了一套关于 BSW 上游厂商生成配置文件（XML）描述的具体标准。遵守 AUTOSAR 的厂商会通过这种标准编写符合标准的软件，供下游厂商或用户调用。这就是在汽车电子领域非常流行的 Arxml 文件格式及 XDM 文件格式的编写语法的由来。