AUTOSAR - AUTOMOTIVE OPEN SYSTEM ARCHITECTURE

## 分类

AUTOSAR 分为 AUTPSAR CP (Classic Platform) 和 AUTOSAR AP (Adaptive Platform)。目前流行的是 AUTOSAR CP。

Classic Platform 是 AUTOSAR 针对具有**硬实时性**和**安全性**约束的嵌入式系统提供的解决方案，它包含大量应用程序接口，涵盖以下五个车辆领域：车身和舒适性、动力总成发动机、动力总成变速器、底盘控制以及乘员和行人安全。

Adaptive Platform 是 AUTOSAR 为高性能计算 ECU 提供的解决方案，用于构建故障运行系统，以应用于自动驾驶等场景。


## AUTOSAR CP 架构

AUTOSAR Classic 平台架构在最高抽象级别上区分了在微控制器上运行的三个软件层：应用程序 (Application, ASW)、运行时环境 (Runtime Environment, RTE) 和基础软件 (Basic Sowtware, BSW)。

- 应用软件层基本与硬件无关。
- 软件组件之间的通信以及通过 RTE 访问 BSW。
- RTE 代表应用程序的完整接口。
- BSW 分为三个主要层和复杂的驱动因素：
	- 服务、ECU（电子控制单元）抽象和微控制器抽象 (MCAL)。
	- 服务进一步细分为功能组，分别代表系统、内存和通信服务的基础设施。

![](attachments/Pasted%20image%2020260123154954.png)

## AUTOSAR 标准文件 结构（部分）

### General

| Name                                        | Description                   |
| ------------------------------------------- | ----------------------------- |
| AUTOSAR_EXP_LayeredSoftwareArchitecture.pdf | 描述 AUTOSAR 分层软件架构             |
| AUTOSAR_RS_Features.pdf                     | 描述 AUTOSAR 所有功能               |
| AUTOSAR_SWS_BulkNvDataManager.pdf           | 定义基础软件模块 BulkNvDataManager 规范 |
| AUTOSAR_EXP_VFB.pdf                         | 定义 AUTOSAR 虚拟功能总线（VFB）        |
### Methodology and Templates

| Name                                         | Description                  |
| -------------------------------------------- | ---------------------------- |
| AUTOSAR_TPS_BSWModuleDescriptionTemplate.pdf | 定义 BSWMDT（基础软件模块描述模板）        |
| AUTOSAR_CP_TPS_SoftwareComponentTemplate     | 定义 SWCDT                     |
| AUTOSAR_TPS_DiagnosticExtractTemplate.pdf    | 定义 DiagnosticExtract（诊断摘要）规范 |
| AUTOSAR_TR_FrancaIntegration.pdf             | 聚焦 AUTOSAR 与 GENIVI 体系的集成    |
| AUTOSAR_TR_Methodology.pdf                   | 定义 AUTOSAR 开发方法              |
| AUTOSAR_EXP_ModelingShowCases.zip            | 建模展示案例的补充材料                  |
| AUTOSAR_TR_ModelingShowCases.pdf             | 配套上述 zip 包的说明文档              |
| AUTOSAR_RS_BSWModuleDescriptionTemplate.pdf  | 收集 BSWMDT 的需求                |
| AUTOSAR_RS_DiagnosticExtractTemplate.pdf     | 收集 DiagnosticExtract 的需求     |
### IO

| Name                                  | Description        |
| ------------------------------------- | ------------------ |
| AUTOSAR_SRS_ADCDriver.pdf             | 规定 ADC 驱动需求        |
| AUTOSAR_SRS_DIODriver.pdf             | 规定 DIO 驱动需求        |
| AUTOSAR_SWS_PWMDriver.pdf             | 定义 PWM 驱动的 API 与配置 |
| AUTOSAR_SWS_IOHardwareAbstraction.pdf | 实现 IO 硬件抽象         |
| ...                                   | ...                |
### Libraries

| Name                                | Description  |
| ----------------------------------- | ------------ |
| AUTOSAR_SWS_BSWMulticoreLibrary.pdf | 提供原子操作例程     |
| AUTOSAR_SWS_CRCLibrary.pdf          | 支持多类型 CRC 计算 |
| AUTOSAR_SWS_E2ELibrary.pdf          | 安全数据传输保护     |
| AUTOSAR_SWS_MFXLibrary.pdf          | 定点算术运算       |
### Diagnostics 

| Name                                                   | Description        |
| ------------------------------------------------------ | ------------------ |
| AUTOSAR_SWS_DiagnosticCommunicationManager.pdf         | 诊断服务通用 API         |
| AUTOSAR_SWS_SAEJ1939DiagnosticCommunicationManager.pdf | 适配 SAE J1939-73 标准 |
| AUTOSAR_SWS_DiagnosticEventManager.pdf                 | 故障处理与存储            |
###  Safety

| Name                                     | Description |
| ---------------------------------------- | ----------- |
| AUTOSAR_SWS_WatchdogDriver.pdf           | 看门狗驱动       |
| AUTOSAR_SWS_WatchdogManager.pdf          | 看门狗管理       |
| AUTOSAR_TPS_SafetyExtensions.pdf         | 安全信息标准化交换   |
| AUTOSAR_EXP_FunctionalSafetyMeasures.pdf | 功能安全机制      |
### BSW General

| Name                                             | Description |
| ------------------------------------------------ | ----------- |
| AUTOSAR_SRS_BSWGeneral.pdf                       | BSW 通用需求    |
| AUTOSAR_SWS_CompilerAbstraction.pdf              | 封装编译器特定关键字  |
| AUTOSAR_SWS_PlatformTypes.pdf                    | 定义平台相关类型    |
| AUTOSAR_EXP_ErrorDescription.pdf                 | 描述 BSW 错误类型 |
| AUTOSAR_EXP_InterruptHandlingExplanation.pdf     | 中断配置与处理     |
| AUTOSAR_EXP_CDDDesignAndIntegrationGuideline.pdf | 复杂驱动（CDD）设计 |
### Release Documentation

| Name                                          | Description   |
| --------------------------------------------- | ------------- |
| AUTOSAR_TR_ClassicPlatformReleaseOverview.pdf | CP 文档的总览说明与逻辑 |
### Communication

| Name                                       | Description                    |
| ------------------------------------------ | ------------------------------ |
| AUTOSAR_SWS_CANDriver.pdf                  | CAN 驱动规范                       |
| AUTOSAR_SWS_SAEJ1939TransportLayer.pdf     | 适配 SAE J1939 标准的传输层模块（J1939Tp） |
| AUTOSAR_SWS_BusMirroring.pdf               | 内部总线流量复制到外部总线                  |
| AUTOSAR_SRS_NetworkManagement.pdf          | 定义网络管理需求                       |
| AUTOSAR_SRS_SecureOnboardCommunication.pdf | SecOC 安全车载通信                   |
| AUTOSAR_ASWS_TransformerGeneral.pdf        | Transformer 数据转换               |
### Memory

| Name                                 | Description      |
| ------------------------------------ | ---------------- |
| AUTOSAR_SWS_NVRAMManager.pdf         | NvM 模块：管理非易失性数据  |
| AUTOSAR_SWS_FlashDriver.pdf          | 内部 / 外部 Flash 驱动 |
| AUTOSAR_SWS_EEPROMAbstraction.pdf    | EEPROM 抽象        |
| AUTOSAR_SWS_FlashEEPROMEmulation.pdf | FEE 闪存仿真 EEPROM  |
| AUTOSAR_EXP_FirmwareOverTheAir.pdf   | 空中固件升级机制         |
| AUTOSAR_SWS_RAMTest.pdf              | RAM 内存测试模块       |

### System Services

| Name                                      | Description   |
| ----------------------------------------- | ------------- |
| AUTOSAR_SWS_OS.pdf                        | AUTOSAR OS 规范 |
| AUTOSAR_SWS_COMManager.pdf                | ComM 模块       |
| AUTOSAR_SWS_TimeService.pdf               | 时间服务模块        |
| AUTOSAR_SWS_DefaultErrorTracer.pdf        | DET 模块        |
| AUTOSAR_SWS_FunctionInhibitionManager.pdf | FIM 模块        |
### MCAL

| Name                        | Description        |
| --------------------------- | ------------------ |
| AUTOSAR_SWS_MCUDriver.pdf   | 微控制器初始化            |
| AUTOSAR_SWS_GPTDriver.pdf   | 通用定时器驱动            |
| AUTOSAR_SWS_CoreTest.pdf    | 微控制器核心测试           |
| AUTOSAR_SRS_SPALGeneral.pdf | 微控制器 / ECU 抽象层通用需求 |

更多的文件分类可以参考：[AUTOSAR_CP_TR_ReleaseOverview](AUTOSAR%20标准文档/AUTOSAR_CP_TR_ReleaseOverview.pdf)

## 目录

针对上图的架构，笔记目录为：

- Release Documentation
- Application Interfaces
- BSW General
- Communication
- Crypto
- Diagnostics
- General
- GlobalTime
- IO
- Libraries
- MCAL
- Memory
- Methodology and Templates
	- [BSW Module Description Template](Methodology%20and%20Templates/BSW%20Module%20Description%20Template.md)
	- [Software Component Template](Methodology%20and%20Templates/Software%20Component%20Template.md)
- Mode Management
- RTE
- SWArch
- Safety
- Security
- System Services
## 其他参考

https://blog.csdn.net/grey_csdn/category_10976751.html
https://blog.csdn.net/qq_350984705/article/details/138419822

## 文件结构

AUTOSAR 官方文档分为多种：RS (Requirements Specification) 、 SWS (Software Specification)、SRS(Software Requirements Specification)、TR(Technical Report)、TPS(Template Specification)、EXP(Explanation Document)。

- RS：描述系统级别的需求
- SRS：描述软件级别的详细需求
- SWS：提供 AUTOSAR 标准的详细实现细节
- TR：提供研究报告或经验总结，非强制性内容
- TPS：定义文档或配置模板
- EXP：提供对规范的详细解释和示例

以下使用 Mcu 模块为例，介绍其标准的文件结构。
### Requirements Specification

[AUTOSAR_CP_RS_MCUDriver](AUTOSAR%20标准文档/AUTOSAR_CP_RS_MCUDriver.pdf)

对于每个模块，本部分包括了对于标准用语的约定、缩略语的解释。这些内容是所有模块通用的。

![](attachments/Pasted%20image%2020260123154907.png)

文档还描述了该模块的功能概述（Functional Overview），包括模块驱动的功能概述。

此外，还描述了功能要求（Funcitonal Requirements）。

这些功能要求包含了对于配置项（Configuration）和初始化项（Initialization）的要求、对于正常运行状态（Normal Operation）的要求、对于故障（Fault）和停运（Shutdown）的要求等。不同的模块可能有所不同。

![](attachments/Pasted%20image%2020260123163506.png)

对于每一种要求，其均在 SRS 文档中进行了实现说明。

AUTOSAR 的实现厂商（如 Vector、ETAS），就会在这些系统要求的基础上编写软件，给出对应设置项的配置接口，并在这些设置的基础上生成符合 AUTOSAR 标准的代码。而对于这些代码的具体编写标准和实现细节，在 SWS 文档中有所描述。

### Software Specification

[AUTOSAR_CP_SWS_MCUDriver](AUTOSAR%20标准文档/AUTOSAR_CP_SWS_MCUDriver.pdf)

文档首先对模块本身的功能和工作原理进行概述，同时列举了其驱动编写需要实现的功能。

![](attachments/Pasted%20image%2020260123165331.png)

文档还提供了相关的标准规范，可以以此为节点发散了解。

![](attachments/Pasted%20image%2020260123165558.png)

文档还会包含该模块对于其他模块的依赖关系和相互作用。如 Mcu 模块，文档提供了其对于启动代码（Start-up Code）的依赖关系，并阐明 Mcu 与其的交互关系。比如当 Mcu 开启了某种设置后，在 Start-up Code 中应当做什么样的实现。

> SWS 中不应当提供对于文件结构的定义

接下来，文档对于模块的实现进行了规范。形如：

![](attachments/Pasted%20image%2020260123170217.png)

这些规范覆盖了该模块应当具有的所有功能，包括错误处理、错误应当返回的状态码等。

![](attachments/Pasted%20image%2020260123170418.png)

文档标注了 API 的规范，即对于模块的具体实现，应当有什么样的函数名、变量名等。

![类型定义](attachments/Pasted%20image%2020260123170616.png)
（类型定义）

文档描述了序列图（Sequence Diagram）。该部分演示了模块运行的过程。

![](attachments/Pasted%20image%2020260123170833.png)

文档提供了对于配置的标准限值（Configuration specification）。该部分内容提示了实现厂商应当提供什么样的接口，应当有如何的选项。

![](attachments/Pasted%20image%2020260123171418.png)

> 值得一提的是，该部分的解释与 EB tresos Studio 官方 User Manual 手册中关于配置的介绍是基本相同的，因为 EB tresos Studio 是符合 AUTOSAR 标准的配置软件。具体详见：[EB Tresos Mcal 最小系统搭建](../AUTOSAR%20PRAC/EB%20Tresos%20Mcal%20最小系统搭建.md)


### Template Specification

[AUTOSAR_CP_TPS_BSWModuleDescriptionTemplate](AUTOSAR%20标准文档/AUTOSAR_CP_TPS_BSWModuleDescriptionTemplate.pdf)

(这部分在 [BSW Module Description Template](Methodology%20and%20Templates/BSW%20Module%20Description%20Template.md) 中有所介绍)

[AUTOSAR_CP_TPS_SoftwareComponentTemplate](AUTOSAR%20标准文档/AUTOSAR_CP_TPS_SoftwareComponentTemplate.pdf)

(这部分在 [Software Component Template](Methodology%20and%20Templates/Software%20Component%20Template.md) 中有所介绍) 

这部分文件描述了一些元规范（Meta-Spec），用于规定文档结构、元素关系、参数属性等，比如 BSW 的模块描述、EcuC 配置模型、Arxml Schema 描述规范等。其决定了 AUTOSAR 配置工具配置语法的定义。