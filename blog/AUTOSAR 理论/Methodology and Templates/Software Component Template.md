# Software Component Template

原文：[AUTOSAR_CP_TPS_SoftwareComponentTemplate](../AUTOSAR%20标准文档/AUTOSAR_CP_TPS_SoftwareComponentTemplate.pdf)

## 总览

Software Component Template（SWCT）是 AUTOSAR 规范体系中的核心模板规范之一，用于定义软件组件（SWC）的建模方式、结构组成及其交互关系，为软件组件的设计与集成提供统一的描述规则。

本文档定义了关于 SWCT 的相关标准，规定了软件组件 Arxml 的编写格式，服务于 ECU Extract、System Description、RTE Generator。主要包括：
- 对于 SwComponentType 的描述。本文中，SWCT 被认为是一个可以通过 PortPrototype 定义的实体（Entity），即在 SWCT 的语义体系中，SwComponentType 的“外部可见行为”完全由 PortPrototype 定义。
- 对于 CompositionSwComponentType 的描述，即由相互具有链接关系的 SWC 组件组成的子系统。CompositionSwComponentType 本身不实现行为。SWC 可以通过层级结构进行定义，这种定义由更多的 SWC 构成。即树形结构（建模层级结构）：

```
SwComponent_Father
	SwComponent_Child_1
	SwComponent_Child_2
	...
```

- 对在[BSW Module Description Template](BSW%20Module%20Description%20Template.md) 中提到的 AtomicSwComponentType 的描述，其可以作为 SW 的一部分被映射到 ECU 中。如下图所示。

![](/attachments/Pasted%20image%2020260124111545.png)

> 绿色框体表示该部分在 SWCT 中得到了完整描述，蓝色框体表示该部分仅有接口（Interface）得到了完整描述。

## 概念阐释

本部分对于在 SWC 中可能出现的概念进行了阐释。现举几例。

### Runtime and Data Consistency Aspects

该部分提供了关于实现 RTE 与 Runnable Entity 之间高效通信的方案。
- 可以通过共享内存实现。但是其只能被集中在特定的处理单元上（由于需要共享内存）。
- 使用全局变量建立内部通信。由于通信的目的是为了建立 Data Flow，所以这样就会产生定义：状态消息（state-messages）。

> 共享内存实现有一个很严重的问题：Runnable Entity 之间的数据一致性（Data Consistency）。由于 Runnable Entity 相当于 RTOS 中的任务（Tasks），则根据任务的抢占规则，其会被同一个 AtomicSwComponentType 的其他 Runnable Entity 抢占。这样，数据可能会在运行期间被篡改。

以下是一系列解决内存一致性的方法：
- 通过信号量（Semaphore）实现互斥锁。
- 通过禁用中断（Interrupt）。
- 通过优先级封顶（Celling）策略。即通过设定优先级最高的策略，避免被抢占。
- 通过变量复制。即创建副本从而避免被改变，如图所示。

![](/attachments/Pasted%20image%2020260124131857.png)

在运行时内存一致性（Data Consistency at Runtime）上，也有一系列方案被提及。

比如复制进程（Copy routine）必须确保在复制过程中不能被其他进程打断以保证连续的复制操作（虽然这个复制进程运行时间是相对短暂的）。

其还提到了一系列更优的策略（optimization criteria）：比如将复制任务（Copy Task）作为最高优先级，以保证绝对的安全。

同时，为了保证应用代码不受任何代码生成过程的影响，对这些复制变量的访问会通过宏定义（MICRO) 进行保护，宏定义由代码生成器进行解析。这些宏定义的存在支持了源代码（source Code）层级的复用。只有当调度场景（如优先级）保持一致时，才支持目标代码（object Code）层级的复用。AtomicSwComponentType 必须将所有并发访问的变量对外公开。

### Variant Handling in the SWCT

SWCT 允许部分模型元素存在变体（Variant）（及存在与否、取值等），具体列表在附录J。这些变体即影响 Arxml，也影响 RTE 行为。

> 这是 AUTOSAR Methodology 的核心之一：模型不等价于最终系统。模型可以先定义其存在，之后通过 Variant 裁剪，在构建阶段决定是否生效。

比如：SwConnector 的 PostBuild 变体 [TPS_SWCT_01040]

SwConnector 的存在与否取决于 PostBuild 条件（如 Precompile/ Post-build）。SwConnector 会连接在某个 PortPrototype 上，如果其存在，则 RTE 通信行为正常，端口正确连接；若不存在，则 RTE API 也依然存在。 API 不会因为 SwConnector 不存在就消失，即其仍然会在 RTE 生成阶段被保留。

比如以下 Arxml：

```xml
<SW-CONNECTOR>
  <SHORT-NAME>C_Speed</SHORT-NAME>
  <VARIATION-POINT>
    <POST-BUILD-CONDITION>
      <BOOLEAN-VALUE>true</BOOLEAN-VALUE>
    </POST-BUILD-CONDITION>
  </VARIATION-POINT>

  <PROVIDER-IREF>
    <CONTEXT-COMPONENT-REF DEST="APPLICATION-SOFTWARE-COMPONENT-TYPE">
      /SWC/SWC_A
    </CONTEXT-COMPONENT-REF>
    <TARGET-P-PORT-REF DEST="P-PORT-PROTOTYPE">
      /SWC/SWC_A/P_Speed
    </TARGET-P-PORT-REF>
  </PROVIDER-IREF>

  <REQUIRER-IREF>
    <CONTEXT-COMPONENT-REF DEST="APPLICATION-SOFTWARE-COMPONENT-TYPE">
      /SWC/SWC_B
    </CONTEXT-COMPONENT-REF>
    <TARGET-R-PORT-REF DEST="R-PORT-PROTOTYPE">
      /SWC/SWC_B/R_Speed
    </TARGET-R-PORT-REF>
  </REQUIRER-IREF>
</SW-CONNECTOR>
```

其生成的 Rte API：
```c
Std_ReturnType Rte_Read_SWC_B_R_Speed(uint16* data);
Std_ReturnType Rte_Write_SWC_A_P_Speed(uint16 data);
```

是完全相同的。

就算 PostBuild Condition 为 False，也是会生成这两个 Rte API，只不过不发生动作。
### P/R Port Prototype

P/R Port Prototype 的引入是为了对于同一块数据的读写需求。

在 AUTOSAR Classic Platform 中，端口（PortPrototype）是软件组件之间进行数据交换的核心建模元素。传统模型中，端口被严格区分为：
- PPortPrototype（Provide Port）：仅具备 Write / Provide 语义，用于“生产”数据；
- RPortPrototype（Require Port）：仅具备 Read / Consume 语义，用于“消费”数据。
    
这种严格区分在“单向数据流”场景下是合理的，但在大量实际工程场景中，会出现同一块数据需要被反复读写的情况。如果仍然强制使用 RPort + PPort 的组合，就会引入一系列问题。

基于此，AUTOSAR 引入了 PRPortPrototype。其绑定了同一份数据元素，在 Runnable Entity 中既可以调用 Write API，也可以调用 Read API。

#### 举例分析

NvM / NvBlock 场景下，需要对同一块内存进行读写操作。当没有 PRPort 时，其必须定义一个 P-Port，一个 R-Port。这两个端口指向同一个数据块，其模型复杂，一致性约束多。作为自然语义，我们引入 PR Port，对外暴露相同的 P/R 端口，内部映射到同一个 RAM Block。


## Software Components 概述

Autosar概念的核心目标之一，就是支持应用软件层面的复用性。换言之：开发者应能通过复用现有构件来构建更多模型元素，而非被迫从零开始逐个创建建模细节。

这种设计理念的必然结果就是**类型原型模式**。该概念允许构建任意复杂度的软件组件层级结构，但需注意：层级结构的构建本身不会影响系统运行时的行为，实际运行逻辑完全由各个软件组件自主决定。

> 软件组件是基于所谓的虚拟功能总线（VFB）开发的，这是一种不直接依赖 ECU 和通信总线的抽象通信通道。 VFB 本身并不提供表达软件组件层级结构的手段。当然， VFB 的使用对软件组件的设计产生了进一步影响——这些组件不应直接调用操作系统或通信硬件。因此，软件组件往往要到开发流程的后期阶段才能部署到实际的ECU中。

AUTOSAR 的应用软件（Application Software）通过一些自包含（self-contained）的单元，即 AtomicSwComponentType 组成。这些 AtomicSwComponentType(s) 封装了其功能和行为的实现，仅向外部世界暴露明确定义的连接点（ 称为 PortPrototype(s) ），如图所示。

![](/attachments/Pasted%20image%2020260124151325.png)

首先有所有 SWC 的抽象基类（abstract）：SwComponentType。其具有子类：
- `AtomicSwComponentType`
- `CompositionSwComponentType`
- `ParameterSwComponentType`

其次有一系列属性：
- `consistencyNeeds` - 用于进行一致性约束规则校验。
- `port` - SWC 的通信端口，支持所有 R/P Port。核心属性之一。
- `portGroup` 对 Port 的逻辑分组。
- `swcMappingConstraint` - 对于 SWC 映射的相关约束，约束其到 ECU/OS/Core 的关系。
- `swComponentDocumentation` - 对 SWC 附加的文档说明
- `unitGroup` - 该 SWC 允许使用的单位集合（可选）

### PortPrototype

SwcComponentType 的 PortPrototype 一般被用于链接 SwConnector，从而在 SwComponentPrototype(s) 中建立连接。

软件组件（Software Components）通过 PortPrototype 进行交互，且具有可替换性。即只要功能一致、端口一致，就可以互换。

PortPrototype 必须依赖 PortInterface，用以描述完整的通信细节。

分为 P-Port、R-Port 和 P/R-Port。允许的连接关系如下：
- P - R
- P - PR
- PR - R
- PR - PR
![](/attachments/Pasted%20image%2020260124155848.png)

上图标明了 PortPrototype 的分层关系。即在 P/R/P-R Port 之上存在 Provided/Required 抽象，其共同属于 PortPrototype。
### AtomicSwComponentType

Atomic SwComponentType 与常规 SwComponentType 的区别是其可以聚合 SwInternalBehavior。这使得 AtomicSwC 成为真正可执行语义的组件类型。

一个 AtomicSwComponentType 对应一个 ECU 上的执行实体。

![](/attachments/Pasted%20image%2020260124155956.png)

上图为 SWCT 总览。在图中 AtomicSwComponentType 的子模块中：
- ApplicationSwComponentType 是 AtomicSwComponentType 的特化类型，用于表示与硬件无关的应用软件。
- ParameterSwComponentType 作为 SwComponentType 的特化类型，与 AtomicSwComponentType不同，它无法聚合 SwcInternalBehavior。
- 其他模块在文档后续章节有所介绍。

### ParameterSwComponentType

ParameterSwComponentType 是参数/标定专用的软件组件类型，用于承载标定参数定义与映射，不是可执行组件。其不聚合 SwcInternalBehavior，即没有 Runnable等，而只聚合 P-Port。其只对外提供参数，不执行。

![](/attachments/Pasted%20image%2020260124161117.png)

### CompositionSwComponentType

这是在 SwComponentType 子类中的架构层容器，用于聚合已有的软件组件（SwComponentType）。其只做结构组织和层次抽象，不引入功能。即，只是逻辑结构的文件结构，而非可执行组件。

![](/attachments/Pasted%20image%2020260124161521.png)

CompositionSwComponentType 不直接包含 SwComponentType，而是包含 SwComponentPrototype，其通过 `type` 指向某个 SwComponentType。这样，可以允许同一个 SwComponentType 具有不同的 SwComponentPrototype，实现不同的角色。

例如，可以通过指定 DoorControl 作为 SwComponentType，分化出 Left/Right DoorControl 两个 Prototype 角色。

CompositionSwComponentType 同样可以具有 PortPrototype，但是只能是 Delegation Port（委托端口）。其自身不实现通信，而是将内部组件端口暴露到外部。

Composition 内部通过 SwConnector 进行链接。以下是可能的 SwConnector 种类：

- AssemblySwConnector：实现内部组件之间的链接，P - R
- DelegationSwConnector：实现内部组件与外部端口之间的链接：P - DP
- PassThroughSwConnector：转发外部端口，不与内部组件交互。

![](/attachments/Pasted%20image%2020260124181707.png)

同一对 PortPrototype 只能有一个 SwConnector。ASWC 和 DSWC 都只能作用于当前的 CSWCT。 

## Software Components 详细描述

根据 AUTOSAR 标准 [AUTOSAR EXP Virtual Function Bus]，软件组件（SWC）间的主要通信模式为：
- 基于操作的 Client / Server
- 基于数据的 Sender / Receiver

这两者的性质和建模方式均有一定差异。

对于非 Service 类型的 PortInterfaces，其编码形式是固定的：
- 2C 补码
- IEEE754 浮点
- ISO-8859-1/2 or WINDOWS-1252 or UTF-8/16 or UCS-2

这些基础的数据可以被高效映射到 C 编码，保证 RTE 的可预测性和兼容性。

Service 类型的通信不受限制 [TPS_SWCT_01845]

### Sender / Receiver 通信

Sender / Receiver 结构使用了一种发送 / 接收的数据结构，即 SenderReceiverInterface。其定义了有哪些数据以及数据的语义。通信依然通过 PortPrototype。

dataElement 表示独立的数据项。Sender / Receiver 通信模型的模块间使用 dataElement 表示数据传输。

PRPort 不允许队列语义（queued），因为 PRPort 为同时读写，队列语义会破坏 Data Consistency。

Sender / Receiver 通信只允许：
- 1 - N
- N - 1
不允许：
- N - M

![](/attachments/Pasted%20image%2020260124164710.png)

该图描述了 SenderReceiverInterface 的连接关系。

#### InvalidationPolicy

数据失效机制允许 Sender 主动标记数据无效。其 handleInvalid 存在以下值：

- `dontInvalidate` - 关闭失效
- `keep` - RTE 错误由 Application Software 处理
- `replace` - 用 initValue 替换
- `externalReplacement` 用外部值替换

#### Meta-Data

元数据是一种仅有 SenderReceiverInterface 支持的类型。

用于传输非业务数据，比如：
- CAN ID
- J1939 Source Address
- Timestamp
- VLAN ID

其绑定到具体的 dataElement。

### Client / Server 通信

Client / Server 通信的本质是 Client 调用 Server 的函数，支持同步和异步调用。

一个 Client 不能链接多个 Server，避免调用函数冲突。

同样的，该种通信模式也定义了接口： ClientServerInterface。其可以调用 Operation 或者可能的 ApplicationError。

![](/attachments/Pasted%20image%2020260124170850.png)

ClientServerOperation 由多个 ArgumentDataPrototype 组成。参数的方向为：

- in
- out
- inout

这很接近 C 函数签名 / 调用逻辑的定义。

Client / Server 提供了一系列错误处理：
- `Infrastructure Error` - RTE / 通信故障
- `Application Error` - 接口语义 / PortInterface 定义

### External Trigger Event Communication

External Trigger Event 不能够传输数据，而是触发执行。在 Trigger Source 触发后，驱动连接的 Trigger sink 中的 Runnable Entity 执行。

TriggerInterface 是一种 PortInterface，用于声明 Trigger 集合，由 Source 端触发 Trigger，Sink 端接受并执行函数。

Trigger 是具体的触发事件，能够表达：
- swImplPolicy：处理方式。
	- `STANDARD` 触发即处理
	- `QUEUED` 使用队列，用 FIFO 处理
- triggerPeriod：触发周期

其还提供一种时间周期表示：MultidimensianalTime，用于表达时间/角度类周期。

TriggerInterface 和 Trigger 的表示关系如下：

![](/attachments/Pasted%20image%2020260124173228.png)

### Mode Communication

AUTOSAR 针对模式通信做了描述。模式通信主要有两种使用方式：

- 模式切换通知（Mode Switch）
	- 该方式是从 Mode Manager 到各组件，用以使某个组件进入特定模式。其使用 ModeSwitchInterface，接口中只包含 ModeDeclarationGroupPrototype，用以定义某些模式。
- 模式切换请求（Mode Request）
	- 该方式是从组件到 Mode Manager，即请求切换到某种模式。其使用 SenderReceiverInterface，通过数据通信请求模式。数据须为 AutosarDataType。

其中，ModeSwitchInterface 若在 CompositionSwComponent 中，CompositionSwComponentType 会自动继承内部 SWC 的模式需求，通过 DelegationSwConnector 对外暴露。

![](/attachments/Pasted%20image%2020260124174953.png)

虽然 Mode Request 是数据通信，但语义上仍然需要对应 ModeDeclarationGroupPrototype。所以，模式请求的数据类型映射是必要的，即 ModeRequestTypeMap。

![](/attachments/Pasted%20image%2020260124175113.png)

ModeRequestTypeMap 会映射到 ImplementationDataType，且其是一一对应关系。ModeRequestTypeMap 必须存在。

### PortInterface Mapping and Data Scaling

在早期的 AUTOSAR 标准中，要求 PortInterface 需要严格匹配，但是语义一致形式不同的接口则无法连接，故引入 PortInterface Mapping 用以显式声明其对应和转化关系。其适用于[TPS_SWCT_01158]：
- SHORT-NAME 不同，但语义一致
- 量纲/范围/分辨率不同
- invalidationPolicy 不同
- 可以通过 AUTOSAR Data Transformer 做复杂变换的其他情形

Mapping 独立于 SwConnector，且优先级最高，即可以覆盖其他兼容性规则。一个 PortInterfaceMapping 可以映射两个 PortInterface，未映射的元素不会被链接。

![](/attachments/Pasted%20image%2020260124181817.png)

#### Mapping of Sender Receiver Interface, Parameter Interface and Non-Volatile Data Interface Elements

使用类：VariableAndParameterInterfaceMapping 和 DataPrototypeMapping，映射不同接口中的 VariableDataPrototype 或者 ParameterDataPrototype。

![](/attachments/Pasted%20image%2020260124181847.png)

#### Mapping of Client Server Interface Elements

使用类：ClientServerInterfaceMapping、ClientServerOperationMapping、ClientServerApplicationErrorMapping，映射两个 ClientServerInterface 中的 Operation、Arguments、ApplicationError。

![](/attachments/Pasted%20image%2020260124181856.png)

#### Mapping of Mode Interface Elements

使用类：ModeInterfaceMapping、ModeDeclarationGroupPrototypeMapping、ModeDeclarationMappingSet / ModeDeclarationMapping 等，显式定义 ModeDeclaration 之间的对应关系。

![](/attachments/Pasted%20image%2020260124181906.png)

#### Mapping of Trigger Interface Elements

使用类：TriggerInterfaceMapping、TriggerMapping，映射不同 TriggerInterface 中的 Trigger。

![](/attachments/Pasted%20image%2020260124181915.png)

#### Mapping of Elements of a composite Data Type

使用类：SubElementMapping、SubElementRef，在 DataInterface 场景下进行元素映射。

![](/attachments/Pasted%20image%2020260124181927.png)

AUTOSAR 规定，可以通过以下 RTE 支持的类型进行数据转换：

- IDENTICAL 不转换
- LINEAR 线性
- SCALE_LINEAR_AND_TEXTTABLE 单个线性区间
- TEXTTABLE 枚举/表映射
- BITFIELD_TEXTTABLE 位域枚举映射
- RAT_FUNC

### Port Annotation

Port Annotation 不影响接口和调用签名，也不影响 RTE 生成，用于补充语义和工程信息，用于开发者理解和校验。基于 GeneralAnnotation 类。

### Communication Specification （ComSpec）

PortInterface 只定义了结构，但是没有定义通信行为。ComSpec 用于定义通信属性：可靠性、初始值、队列状态等。

ComSpec 绑定在 PortPrototype 上，而不是 PortInterface 上。

![](/attachments/Pasted%20image%2020260124183358.png)

ComSpec 具有 PPortComSpec、RPortComSpec、PRPortComSpec 三种。

下面以 Sender / Receiver 通信模型为例，说明 ComSpec 的主要内容。

![](/attachments/Pasted%20image%2020260124183436.png)

对于 RPortPrototype，其定义的类名为 ReceiverComSpec。
对于 PPortPrototype，其定义的类名为 SenderComSpec。

其定义了 QUEUED / NON-QUEUED 两种队列模式。对于 QUEUED，其需要使用 QueuedSenderComSpec / QueuedReceiverComSpec。反之同理。

对于 NonqueuedReceiverComSpec，定义了以下属性：

- initValue
- aliveTimeout
- handleTimeoutType
- enableUpdate
- handleNeverReceived
- filter
- ...

### Port Groups within Component Types

### End to End Protection

### Partial Networking

### Formal Definition of implicit Communication Behavior

其余内容参见标准文档。

## Data Description

AUTOSAR 为数据建立了三层抽象：
### Application Data Level

应用数据层，为 ApplicationSwComponentType 提供语义抽象，其用于 SWC 之间的数据语义一致。
### Implementation Data Level

实现数据层， 面向代码抽象，提供给 RTE、BSW 接口、数值库使用。其关注于 C 语言层面的类型抽象（typedef）以及指针、union、数组等内存相关结构，作为 RTE 生成的直接输入。依然是模型抽象，并非 CPU 表现。即：该数据在 C 中如何表示。
### Base Type Level

该类型平台相关，用于构建 ImplementationDataType。即数据在硬件上的存储方式。

### 举例

对于车辆速度 VehicleSpeed：

在Application Data Level，其名称为 VehicleSpeed，对于 SWC 来说只具有语义含义：`Vehicle Speed`。

在 Implementation Data Level，其在 C 中的实现类型为 `uint16`，体现为：

```c
typedef uint16 VehicleSpeed_ImpType;
```

这是一个**数值型接口类型**，供 RTE、BSW 使用。

在 Base Type Level 中，其类型为 `uint16`，即： 

```c
typedef uint16_t uint16;
```

综合起来即：

```c
/* 平台层（Base Type） */
typedef uint16_t uint16;

/* RTE 生成（Implementation Data） */
typedef uint16 VehicleSpeedType;

/* SWC 使用 */
VehicleSpeedType speed;

Rte_Write_VehicleSpeed(speed);
```

文档提供了全面的关于信号/变量类型的描述，包括对于三层信号抽象模型各层变量类型的描述。例如：

对于 ApplicationDataType，其对其定义子类：
- ApplicationRecordDataType
- ApplicationArrayDataType

通过 Category 决定语义形态，并向其添加物理约束：DataConstr / PhysConstrs / lowerLimit / upperLimit，并进行语义映射、单位和初始值等。

![](/attachments/Pasted%20image%2020260124195600.png)

> Data Catagories 用于约束可配置的数据属性，即定义为不同的数据类型用以区分。

同时，文档还提供了关于数据原型（Data Prototype）的说明。

Data Prototype 是数据类型在某个上下文中的“角色实例”。其通过 isOfType 指向某个 AutosarDataType，并被其他模型元素整合。即，定义该数据在某个场景的具体用途。具体子类和上下文关系如图。

![](/attachments/Pasted%20image%2020260124195802.png)

正如前文所述，数据类型定义及原型可附加多种属性与关联。这些特性由元类 SwDataDefProps 定义，该类全面涵盖特定数据对象在不同维度的属性。

通常，SwDataDefProps 中定义的属性可适用于软件组件模板（SWCT）及基础软件模块描述模板（BSWMDT）中声明的所有数据类型，例如组件本地数据、通信数据、测量数据以及校准数据。但属性约束会根据数据用途而有所不同。

即，对于在 SWCT 和 BSWMDT 中出现的数据对象，其所有关键属性被集中在 SwDataDefProps 中。

下表表示了 SwDataDefProps 中的属性，图片仅举几例。

![](/attachments/Pasted%20image%2020260124200207.png)

标准文件提到，初始值（Initial Value）是必要的，因为VariableDataPrototype / ParameterDataPrototype 可能在未被软件显式赋值前就被访问。为了避免未定义的行为（UB），AUTOSAR 标准允许定义初始值。

AUTOSAR 将初始值赋值定义了不同的层级：

- DataPrototype 层
- ComSpec 层
- CalibrationParameterValue 层

三层之间存在下层覆盖上层的关系。

## Compatibility

在链接不同的 SwComponentType 前，有必要验证其形式兼容性。从而避免语义不一致的问题。兼容性的判断方法一般为自底向上（bottom-up），即先定义 AutosarDataType 的兼容规则，然后定义各类 PortInterface 的规则，同时考虑映射关系。

文档给出了以下情况的兼容性规则：

- Data Types
- Variable Data Prototypes and Parameter Data Prototypes
- Sender / Receiver，Parameter interfaces and Non Volatile Data Interfaces
- Mode Switch Interfaces
- Mode Declaration Group Prototypes
- Mode Declaration Groups
- Argument Prototypes
- Application Errors
- Client / Server Operations
- Client Server Interfaces
- Trigger Interfaces
- Provided Port Prototype
- Case of a Flat ECU Extract

## Internal Behavior

这部分对 [BSW Module Description Template](BSW%20Module%20Description%20Template.md) 中描述的 BSWMDT Three Layer Approach 三层架构中的中间层 BswInternalBehavior(SwcInternalBehavior) 做了更为详细的说明，即形式化描述 AtomicSwComponentType 的内部行为，说明了组件内部的运行逻辑，支持了接口先行、行为后补的 AUTOSAR Methodology。

![](/attachments/Pasted%20image%2020260124201434.png)

## Implementation

这部分对 [BSW Module Description Template](BSW%20Module%20Description%20Template.md) 中描述的 BSWMDT Three Layer Approach 三层架构中的底层 BswImplementation(SwcImplementation) 做了更为详细的说明。这部分 SWCT 和 BSWMDT 是模板共享的。SwcImplementation 是 Implementation 的 SWC 特化，留在了 SWCT 文档中。

![](/attachments/Pasted%20image%2020260124202220.png)

## Mode Management

SWCT 为 Mode Management 提供了通用的建模机制，而不是具体的模式。具体的模式通常在 BSW 或者 Application SWC 中实现。

Mode Manager 与 Mode User (Modules) 间通过 ModeSwitchInterface 通信，且只允许 1:1 或者 1:n 的形式，即一个 `RPortPrototype(ModeSwitchInterface)` 只能连接一个 SwConnector。

Mode Management 利用 ModeDeclarationGroup 描述可用状态集合，用 ModeSwitchInterface + RTEEvent 链接模式变化和 Runnable Entity 行为。

> 此处 Runnable Entity 用于发起模式切换

## ECU Abstraction and Complex Drivers

该章节用于 解决硬件资源（ECU Resource Template）与软件组件（SWCT）之间的对接问题，明确传感器/执行器到应用软件的完整信号链及其在 AUTOSAR 分层中的映射。

该章中定义了一系列信号链，用以链接硬件和软件。AUTOSAR 将物理量到软件数据的过程拆分为多个明确的阶段，并在软件架构中一一对应：

- 物理量（Physical Value），如：温度、速度、光强
- 传感器（Sensor），将物理信号转化为电信号
- ECU Electronics ，对电信号进行处理
- $\mu C$ 外设（ADC/DIO/PWM 等），将电信号转化为数字量
- MCAL，将外设采样提供给上层软件
- ECU Abstraction，反向补偿 ECU Electronics 的电气转换，转换为电气量
- SensorActuator SWC，反向变换，将电气量转化为物理量的软件表示
- Application SWC，通过 RTE 使用物理量

> 每一次硬件侧的物理/电气转换，在软件侧都有一层对应的反向抽象

正如图所示：

![](/attachments/Pasted%20image%2020260124203801.png)

AUTOSAR 还提供了一种特殊的驱动：Complex Device Driver。

其定义了类 ComplexDeviceDriverSwComponentType，用以在某些需要严格实时性的场景允许受控地直接与硬件交互，不通过 ECU Abstraction 路径。同时，为非 AUTOSAR 控件提供功能封装。

## Services

## Software Component Documentation

## Service Dependencies and Service Use Cases

## Rapid Prototyping Scenarios

更多内容参阅标准原文。
