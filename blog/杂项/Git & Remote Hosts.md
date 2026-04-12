# Git & Remote Hosts

## 概述

Git 是一种版本管理系统，提供**本地存档**和**远程协作**等功能。
基于 Git，可以提供一系列托管服务，如 GitHub、Gitlab、Gitee 等。

> 接下来将利用物理编辑的比喻，描述 Git 及 Git 托管服务器的工作逻辑。

如果要写一本书，则需要先建立存放内容的文件夹，并告诉 Git，其需要对这个文件夹的修改进行监控。在这个过程中，可能的操作有：

1. `git init` - 初始化，告诉 Git，其需要监控这个文件夹。
2. `git add <file_name>` - 把修改放入“暂存区”，相当于把写好的草稿放入待发出的信封。
3. `git commit <some parameters>` - 正式提交，相当于把信封封口，并贴上标签。

如：
```bash
git init                                      # 初始化
echo "Hello, Git" > README.txt                # 新建 README.txt，并写入内容
git add README.txt                            # 把文件放入暂存区
git commit -m "Fist commit: README file."     # 提交存档
```

这个过程可以体现 Git 工作的基本原理。

> 在进行提交等操作之前，需要通过 `git config` 来配置自己的个人身份，即姓名和邮箱。现以笔者为例：

```bash
$ git config --global user.name "Heptari"
$ git config --global user.email "heptari@outlook.com"
```

## 工作区与暂存区

![img](assets/Pasted%20image%2020260125164614.png)

Git 将经 Git 托管的本地文件分为工作区和版本库。其中工作区即在文件目录中看到的经托管的主体内容，版本库则是主要存在于 `.git` 文件夹的部分。

我们通过 `git add <file_name>` 命令，将在工作区的部分添加到版本库中，即将其添加到版本库的 `stage` 区中，即暂存区。

在上图中，我们通过 `git commit` 命令可以正式提交存档。在图上所示的提交中，我们将其称为 master，这便是 master 分支。这是 Git 在初始化时自动创建的默认分支，同时被自动创建的还有 HEAD 指针。

> 由于西方国家的极端平等运动，Git 现在新建的默认分支名为 `main`。这是由于 `master` 一词还具有“主人”的意思，这在黑人历史中是不友好的。

这里提到一些新的概念：分支、HEAD 指针。在后面我们将解释这些概念。现在可以理解为，我们将其作为正式的代码“快照”提交存档，即把“信封”封口，并贴上标签。

Git 提供了一系列工具用于查看当前工作区和版本库的状态。比如 `git status`。

```bash
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   readme.txt

Untracked files:
  (use "git add <file>..." to include in what will be committed)

	LICENSE

no changes added to commit (use "git add" and/or "git commit -a")
```

这是执行 `git status` 指令后的输出。其提示了我们在 `readme.txt` 中仍然存在没有被添加到暂存区（stash）的修改，可以通过 `git add <file>` 来添加。同时，其提示我们有一个文件 `LICENSE` 没有被 git 包含。

以及使用 `git diff` 命令查看当前版本库和工作区的区别：

```bash
$ git diff HEAD -- readme.txt 
diff --git a/readme.txt b/readme.txt
index 76d770f..a9c5755 100644
--- a/readme.txt
+++ b/readme.txt
@@ -1,4 +1,4 @@
 Git is a distributed version control system.
 Git is free software distributed under the GPL.
 Git has a mutable index called stage.
-Git tracks changes.
+Git tracks changes of files.

```

该命令会详细列出指定文件的具体更改。

当然，Git 还提供了一种方式用于忽视我们不想被 Git 记录的文件：`.gitignore` 文件。

`.gitignore` 文件中，我们可以列出要忽略的文件名，Git 就会自动忽略他们。GitHub 官方提供了一些可能的 `.gitignore` 文件模板：[GitHub/gitignore](https://github.com/github/gitignore) 

## 管理修改

Git 对于文件夹的监控和跟踪不是管理的文件本身，而是修改。

> 所以，当修改没有被通过 `git add <file>` 添加到版本库（暂存区）时，`git commit` 并不会识别到更改。

Git 提供了一系列功能用以回退更改，即回到原先的版本。

命令 `git checkout` 可以用以丢弃工作区的修改。即，当我们的修改没有提交到版本库（暂存区）时，可以通过 `git checkout` 命令来让项目回到提交到暂存区的状态。如：

```bash
git checkout -- readme.txt
```

此时，如果 `readme.txt` 自修改后还没有被放到暂存区，现在，撤销修改就回到和版本库一模一样的状态；若其经添加到暂存区后，又作了修改，现在，撤销修改就回到添加到暂存区后的状态。

> 注意在 `git checkout` 命令后的连接符 `--` 。

Git 同样对已经添加到暂存区 (`add`)，但是没有被提交 (`commit`) 的内容提供了撤销功能。我们可以通过 `git reset HEAD <file>` 的方式将提交到暂存区的修改撤销，**重新放到工作区**：

```bash
$ git reset HEAD readme.txt
Unstaged changes after reset:
M	readme.txt
```

在此之后查看状态：

```bash
$ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   readme.txt
```

发现其暂存区没有内容，但是工作区中有修改。接着，通过 `git checkout -- readme.txt` 即可丢弃工作区的修改。

这个操作一般称为 `unstash`。

同时，Git 提供从版本库中删除文件的功能：

```bash
$ git rm test.txt
rm 'test.txt'

$ git commit -m "remove test.txt"
[master d46f35e] remove test.txt
 1 file changed, 1 deletion(-)
 delete mode 100644 test.txt
```

## 远程库

我们提到过，基于 Git，可以提供一系列托管服务，如 GitHub、Gitlab、Gitee 等。远程库相当于本地 Git 仓库的远程备份，同时提供协作功能。下面以 GitHub 为例说明。

新建远程库并将当前项目添加到远程库有多种方式。主要有以下两种：

1. 登录 Gitee，从网站新建 Repository，然后使用 `git clone` 克隆到本地，即将远程库的内容下载到本地，其中包括版本库的数据。此时，Git 会自动的为该版本库添加远程库。
2. 在本地仓库添加，运行 `git remote add` 命令，添加远程库。如：
   
	```bash
	$ git remote add origin https://gitee.com/heptari/git-test.git
	```

> 上面这两种方式在 Github 或者 Gitee 页面新建 Repository 之后，会有对应的指南。

接下来在本地进行更改。更改完毕并 `git commit` 提交后，就可以使用 `git push` 命令推送到远程库上，也就是“上传”：

```bash
$ git push -u origin master
Counting objects: 20, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (15/15), done.
Writing objects: 100% (20/20), 1.64 KiB | 560.00 KiB/s, done.
Total 20 (delta 5), reused 0 (delta 0)
remote: Resolving deltas: 100% (5/5), done.
To github.com:michaelliao/learngit.git
 * [new branch]      master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

对于已经连接好的数据库，Git 同样提供将远程库的内容“下载/更新同步”到本地的拉取命令：

```bash
git pull
```

同时，Git 提供对远程库的信息查询和删除操作：

```bash
$ git remote -v
origin  git@github.com:michaelliao/learn-git.git (fetch)
origin  git@github.com:michaelliao/learn-git.git (push)

$ git remote rm origin
```

## 分支管理

我们在前文中了解到，对于每次提交，Git 将其串联成一条时间线，这就是一条分支，即 `master` 分支。而前文中提到的 `HEAD` 指针，则是指向 `master` 的。

> 此处指针可以理解为，其像一个箭头，指向当前所在的分支。

一开始的时候，`master` 分支是一条线，Git用 `master` 指向最新的提交，再用 `HEAD` 指向 `master`，就能确定当前分支，以及当前分支的提交点。如图所示。

![](assets/Pasted%20image%2020260125182342.png)

每次提交，`master` 分支都会向前移动一步，这样，随着你不断提交，`master` 分支的线也越来越长。

当我们创建新的分支，例如 `dev` 时，Git新建了一个指针叫 `dev`，指向 `master` 相同的提交，再把 `HEAD` 指向 `dev`，就表示当前分支在 `dev` 上：

![](assets/Pasted%20image%2020260125182424.png)

由于当前 `HEAD` 指针指向 `dev` 分支，所以当前对工作区的所有修改和提交就是针对 `dev` 分支。比如新提交一次后，`dev` 指针往前移动一步，而 `master` 指针不变：

![](assets/Pasted%20image%2020260125182558.png)

当我们想将 `dev` 分支合并到 `master` 分支，就相当于把 `master` 指向 `dev` 的当前提交。

下面阐释 Git 对上述功能的实现。

首先创建 `dev` 分支，并切换到该分支：

```bash
$ git checkout -b dev
Switched to a new branch 'dev'
```

`git checkout -b` 命令，表示创建并切换，形式上相当于以下两条命令：

- `git branch dev` 创建分支 `dev`
- `git checkout dev` 切换到分支 `dev`

然后，用 `git branch` 命令查看当前分支：

```bash
$ git branch
* dev
  master
```

其会列出所有分支，并在当前分支前标一个 `*` 号。

> 新版本的 Git 提供了更为科学的 API 用于切换分支：`git switch`。我们可以使用 `git switch -c dev` 来创建并切换到新的 `dev` 分支，用 `git switch master` 切换回 `master` 分支。

进行修改后并提交到工作区后，用 `git merge` 命令合并分支：

```bash
$ git merge dev
Updating d46f35e..b17d20e
Fast-forward
 readme.txt | 1 +
 1 file changed, 1 insertion(+)
```

但是如果两个分支对于同一个文件同时进行修改时，就会出现冲突。即，当 Git 进行合并时，其不能确定那个版本的该文件是开发者想要的。

当我们切换回 `master` 分支时，Git 会提示我们超前一个提交（即别的分支要多一个提交）：

```bash
$ git switch master
Switched to branch 'master'
Your branch is ahead of 'origin/master' by 1 commit.
  (use "git push" to publish your local commits)
```

当在 `master` 进行别的修改并 `git commit` 后，其结构变成了：

![](assets/Pasted%20image%2020260125183623.png)

这种情况下，Git无法执行“快速合并”，只能试图把各自的修改合并起来，但这种合并就会产生冲突：

```bash
$ git merge feature1
Auto-merging readme.txt
CONFLICT (content): Merge conflict in readme.txt
Automatic merge failed; fix conflicts and then commit the result.
```

此时，`git status` 也可以告诉我们冲突的文件：

```bash
$ git status
On branch master
Your branch is ahead of 'origin/master' by 2 commits.
  (use "git push" to publish your local commits)

You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)

	both modified:   readme.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

Git 会使用 `<<<<<<<`、`=======` 和 `>>>>>>>` 标识不同分支的内容：

```plant
Git is a distributed version control system.
Git is free software distributed under the GPL.
Git has a mutable index called stage.
Git tracks changes of files.
<<<<<<< HEAD
Creating a new branch is quick & simple.
=======
Creating a new branch is quick AND simple.
>>>>>>> feature1
```

这时，我们就需要选择一种留下，然后再次提交：

```bash
$ git add readme.txt 
$ git commit -m "conflict fixed"
[master cf810e4] conflict fixed
```

现在，分支结构变成了：
![](assets/Pasted%20image%2020260125183857.png)

Git 提供了 `git log` 工具揭示这种结构：

```bash
$ git log --graph --pretty=oneline --abbrev-commit
*   cf810e4 (HEAD -> master) conflict fixed
|\  
| * 14096d0 (feature1) AND simple
* | 5dc6824 & simple
|/  
* b17d20e branch test
* d46f35e (origin/master) remove test.txt
* b84166e add test.txt
* 519219b git tracks changes
* e43a48b understand how stage works
* 1094adb append GPL
* e475afc add distributed
* eaadf4e wrote a readme file
```

其中 `--graph --pretty=oneline --abbrev-commit` 是参数，用以设置输出格式。

Git 在合并时默认采用 `Fast forward` 模式。这种模式当我们删除分支后，其合并的信息不能被显示出来。为此，我们可以利用参数 `--no-ff` 禁用这种模式。此时，Git 就会在 merge 时生成一个新的 commit，这样，从分支历史上就可以看出分支信息。即：

```bash
$ git merge --no-ff -m "merge with no-ff" dev
Merge made by the 'recursive' strategy.
 readme.txt | 1 +
 1 file changed, 1 insertion(+)
```

在分支管理上，还存在适用于其他场景的管理策略。比如，我们可以通过 `git stash` 保存现场后切换分支，切回后恢复现场：

```bash
$ git stash
Saved working directory and index state WIP on dev: f52c633 add merge

$ git stash list
stash@{0}: WIP on dev: f52c633 add merge

$ git stash pop
On branch dev
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

	new file:   hello.py

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   readme.txt

Dropped refs/stash@{0} (5d677e2ee266f39ea296182fb2354265b91b3b2a)
```

自此，我们可以通过上面提出的概念引入 Git 及其远程存储库的多人协作流程。

## 多人协作流程

当你从远程仓库克隆时，实际上Git自动把本地的 `master` 分支和远程的 `master` 分支对应起来了，并且，远程仓库的默认名称是 `origin`。可以使用 `git remote -v` 命令查看详细信息：

```bash
$ git remote -v
origin  git@github.com:michaelliao/learngit.git (fetch)
origin  git@github.com:michaelliao/learngit.git (push)
```

推送分支，就是把该分支上的所有本地提交推送到远程库。推送时，要指定本地分支，这样，Git就会把该分支推送到远程库对应的远程分支上：

```
$ git push origin master
$ git push origin master
```

多人协作时，大家都会往 `master` 和 `dev` 分支上推送各自的修改。

如前面所说，若协作者 A 在另一台电脑（注意要把SSH Key添加到GitHub）或者同一台电脑的另一个目录下克隆：

```bash
$ git clone git@github.com:michaelliao/learngit.git
Cloning into 'learngit'...
remote: Counting objects: 40, done.
remote: Compressing objects: 100% (21/21), done.
remote: Total 40 (delta 14), reused 40 (delta 14), pack-reused 0
Receiving objects: 100% (40/40), done.
Resolving deltas: 100% (14/14), done.
```

下面，该协作者新建分支并进行一些修改：

```bash
$ git checkout -b dev origin/dev
```

```bash
$ git add env.txt

$ git commit -m "add env"
[dev 7a5e5dd] add env
 1 file changed, 1 insertion(+)
 create mode 100644 env.txt

$ git push origin dev
Counting objects: 3, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (2/2), done.
Writing objects: 100% (3/3), 308 bytes | 308.00 KiB/s, done.
Total 3 (delta 0), reused 0 (delta 0)
To github.com:michaelliao/learngit.git
   f52c633..7a5e5dd  dev -> dev
```

其已经向 `origin/dev` 分支推送了他的提交，而碰巧协作者 B 也对同样的文件作了修改，并试图推送：

```bash
$ cat env.txt
env

$ git add env.txt

$ git commit -m "add new env"
[dev 7bd91f1] add new env
 1 file changed, 1 insertion(+)
 create mode 100644 env.txt

$ git push origin dev
To github.com:michaelliao/learngit.git
 ! [rejected]        dev -> dev (non-fast-forward)
error: failed to push some refs to 'git@github.com:michaelliao/learngit.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

其提示我们推送失败，原因是协作者 B 的最新提交和 A 试图推送的提交有冲突。Git 提示了一种解决方案，即 `git pull`。

```bash
$ git pull
There is no tracking information for the current branch.
Please specify which branch you want to merge with.
See git-pull(1) for details.

    git pull <remote> <branch>

If you wish to set tracking information for this branch you can do so with:

    git branch --set-upstream-to=origin/<branch> dev
```

但是依然失败了，原因是没有指定本地 `dev` 分支与远程 `origin/dev` 分支的链接。根据提示，设置 `dev` 和 `origin/dev` 的链接：

```bash
$ git branch --set-upstream-to=origin/dev dev
Branch 'dev' set up to track remote branch 'dev' from 'origin'.
```

此时重新运行 `git pull` ：

```bash
$ git pull
Auto-merging env.txt
CONFLICT (add/add): Merge conflict in env.txt
Automatic merge failed; fix conflicts and then commit the result.
```

后面的解决方案同分支冲突。

在多人协作中，由于个人爱好不同和项目的繁杂性，我们需要通过一定的方式去约束各类命名、Commit 信息等表明语义的量，用以更好的表示。

## 命名规范

目前，Git 并未给出某一钦定的规范，但是开源社区逐渐自发的形成了一系列明明规范，现举几例：

### Commit 信息格式规范

对于提交时需要填写的 commit 信息，请遵守以下几点基本要求：

1. commit 摘要请简要描述这一次 commit 改动的内容．注意 commit 摘要的长度不要超过 50 字符，超出的部分会自动置于正文中．
2. 如果需要进一步描述本次 commit 内容，请在正文中详细说明．

对于 commit 摘要，推荐按照如下格式书写：

```bash
<修改类型>(<文件名>): <修改的内容>
```

修改类型分为如下几类：

- `feat`：用于添加内容的情况．
- `fix`：用于修正现有内容错误的情况．
- `refactor`：用于对一个页面进行重构（较大规模的更改）的情况．
- `revert`：用于回退之前更改的情况．

示例：

- `fix(ds/persistent-seg): 修改代码注释使描述更清晰`
- `fix: tools/judger/index 不在目录中 (#3709)`
- `feat(math/poly/fft): better proof`
- `refactor(ds/stack): 整理页面内容`

### 分支命名规范

我们对于开发分支的默认命名方式为：

```bash
private_<姓名小写全拼>_development
```

## 外部工具

https://www.gitkraken.com/

https://github.com/apps/desktop