---
id: execution_management
title: Execution Management
---

## **緖言**

リアルタイム制約がある環境下の予測可能な実行は多くのロボティクスアプリケーションにおいて重要な要件になっている。ROSのサービスをベースにするパラダイムは様々な機能の統合に優れているが、実行マネジメントにおいて十分な制御方法を用意していない。たとえば、ノード内のコールバックを特定な順番で実行させる機能を備えていない。そして制御アプリケーションにおいてマルチノードの実行順番は移動ロボティクスにとっては必須となる。取得したセンサーデータで構成される因果連鎖、データの評価および起動制御はそのままの順番でROSノードにマッピングされるべきだが、しかしそれを実行する明示的な機構は存在しない。さらに、フィードテスト用にインプットデータを集め、ROS-bagsに保存しリプレイしたら、非決定的なプロセススケジューリングのせいでいつも違う結果になるでしょう。

手動でコールバック内で特定の購読と配信の実行順序を設定することあるいは対応のLinuxプロセスの優先順位を微調整することは可能だが、
この方法でエラーを起こしやすくて拡張しにくい上に、システム内のROS 2パッケージの構成に深い知識が必要とされる。

そのためにリアルタイムエグゼキューターのゴールは以下のようなソリューションを提供する実用的で使いやすいリアルタイム機構を備えるロボティクスをサポートすることだ：

* 決定論的実行
* リアルタイム保証
* リアルタイムと非リアルタイム機能を１つのプラットフォームに統合する
* 特定のRTOSとマイクロコントローラーへのサポート

ROS 1ではネットワークスレッドはすべてのメッセージを受け取り、FIFOキュー（roscpp内）に入れることを担っている。それはつまり、すべてのコールバックはFIFO方式で実行され、実行管理を行うことはできない。DDS(data distribution service)の導入によって、ROS2ではメッセージがDDSにバッファーされるようになった。ROS2のエグゼキューターは優先順位度付けのように実行管理をサポートできるようになった。rclレイヤーにおいて、wait-setがハンドルにより設定され、次の後ハンドルがDDSキューから取り出される。ハンドルの実態はrclレイアにあるタイマー、購読者、クライアントとサービスなどの要約となる。

スタンダードROS 2 C++ API (rclcpp)のエグゼキューターの実装はいくつか尋常ではない特徴を持っている、たとえば他のすべてのDDSハンドルより優先順位は高いタイマー、ノンプリエンプティブでラウンドロビンスケジューリング仕様のノンタイマーハンドル、そしてハンドルごとに1個の入力データしか設けられない。（たとえマルチモードでも）これらの要素のせいで、特定の環境下ではスタンダードrclcppのエグゼキューターは決定論的ではなくなり、リアルタイム性の保証は難しくなる。私たちは通常CあるいはC++が動くマイクロコントローラープラットフォームを想定しているためPython API (rclpy)の実装を確認していない。 

リアルタイムエグゼキューターのゴールとROS 2スタンダードrclcppエグゼキューターの制限を総合的に考えると、挑むべき課題は：

* ROS 2フレームワークとリアルタイムシステム（RTOS）のために適切で明確に定義されたスケジューリング機構の開発
* ROS開発者向けの使いやすいインタフェースの設計
* 要件のモジュール化 (たとえばレイテンシ、サブシステム内の決定論)
* ROSフレームワークとOSスケジュラーのマッピング（半自動と最適的マッピングおよび汎用性を持つ、理解しやいフレームワーク機構を持つことが望まれる）

１つのアプローチはセクション「Introduction to Client Library」で言及したように２つのレイヤー上にリアルタイムエグゼキューターを提供する。１つはC言語で書かれたrclレイヤーでもう１つはC++で書かれたrclcppをベースにする。

最初のステップとして、Cでの論理的実行時間セマンティック付きの静的順序スケジューリングポリシーの実装を持つLETエグゼキューターを計画している。このスケジューリングポリシーの中で、すべてのコールバックが事前に定義した順番で実行される。LETのコンセプトとは、まずタスクが実行される前に入力データを読み込む。次に開発済みのコールバックグループレベルエグゼキューターでコールバックの優先順位を付けられるようになる。これらのアプローチはエグゼキューターに基づいていて、ROS 2に導入され済みである。

将来は的には、rclとrclcppレイヤに別のリアルタイムグゼキューターを提供するつもりだ。

## **rclcppスタンダードエグゼキューターの分析**

ROS2は１つのプロセスにマルチノードを使うことができる。プロセス内ノードのコールバックを調整するために、エグゼキューターのコンセプトをrclcpp（rclpyも）に実装した。　

ROS 2のデザインではプロセスごとに１つのエグゼキューター（rclcpp::executor::Executorのインスタンス）と定義している、それは通常カスタムメイン関数あるいはランチシステムに作成することは多い。エグゼキューターはDDSキュー内のすべての実行可能状態（タイマー、サービス、メッセージ、購読、etc.）をチェックすることでノードに登録されるコールバックの実行調整を行い、SingleThreadedExecutorとMultiThreadedExecutorに定義されている１つあるいは複数のスレッドに渡す。

ディスパッチング機構はROS 1のスピンスレッドの挙動と似ている：エグゼキューターは待機集合を確認し、DDSキュー内の保留中コールバックを通知してくれる。もし保留中のコールバックは複数ある場合はROS 2エグゼキューターは登録順で実行する。

## **アーキテクチャー**

下図はスタンダードROS 2エグゼキューター実装の関連クラスを描いている：

(diagram)

注意する必要あるのはエグゼキューターのインスタンスはNodeBaseInterfacesの弱参照を保持しているだけなので、エグゼキューターに通知せずとも
ノードを安全に削除することをできる。

また、エグゼキューターは明示的なコールバックキューを保持しないが、下図で示したように裏のDDS実装によるキュー機構に依存している：

(diagram)

つまり、エグゼキューターのコンセプトはコールバックに対する優先順位付けあるいは仕分けの方法を提供しない。
さらに、OSスケジュラーのリアルタイムの特性を使わず、より細かい実行順序のコントロールはできない。これによる全体への影響はタイムクリティカルなコールバックはタイムリミットに間に合わない、そしてタイムクリティカルなコールバックよりも遅く実行されることでパフォーマンスの劣化を招く。さらに、FIFO機構のため、すべてのコールバック実行に発生しうる最大待ち時間の境目を決めにくくなる。

## **スケジューリング セマンティクス**

CB2019のある論文では、rclcppエグゼキューターが細部まで分析済みで因果連鎖の応答時間に関する分析も行われる予定となる。エグゼキューターは
４つの違うコールバックを識別できる：システムタイマーがトリガーのタイマー、購読トピックにおける新しいメッセージがトリガーの購読者、サービスリクエストがトリガーのサービスとサービスレスポンスがトリガーのクライアント。エグゼキューターはDDSレイアのインプットキューからのメッセージの受信と対応のコールバックの実行を管理する。コールバックを実行すると、ノンプリエンプティブスケジュラーですべての実行可能タスクを考慮しないが、readySetと呼ばれる１つのスナップショットだけがエグゼキューターはアイドル状態になる時に更新され、このステップでDDSレイアと通信し実行可能タスクをアップデートする。すべてのタイプのタスクに専用のキューが用意ていて（タイマー、購読者、サービス、クライアント）順番に実行される。以下の不具合は要注意：

* タイマーが最高の優先度を持つ。エグゼキューターのタイマープロセスはいつも最初に実行される。これによる影響は、過負荷状態下ではDDSキューが実行されない。
* ノンタイマーハンドルではノンプリエンプティブでラウンドロビンスケジューリング形式を採用している。プロセス進行中受信したメッセージが残ったコールバックはすべて実行されるまでに考慮されない。これによる影響としては優先順位の反転がある、低優先順位のコールバックは暗黙のうちに高優先順位のコールバックをブロックするかもしれない。
* 毎回のハンドルで扱えるメッセージは１つだけ。レディセットには１つのタスクインスタンスしか含まれてなく、例えば、同じトピックにマルチメッセージが届いても、エグゼキューターは再びアイドル状態になり、レディセットがDDSレイアで更新されるまで１つのインスタンスしかそれらを処理できない。これは優先順位逆転を悪化させる。未完了のコールバックはスケジューリングが検討されるまでレディセットのマルチプロセスを待たさないといけない。つまり非タイムコールバックのインスタンスが、同じ優先度の低いコールバックのマルチインスタンスによってブロックされてしまう可能性がある。

参照：[レディセット](https://drops.dagstuhl.de/opus/volltexte/2019/10743/pdf/LIPIcs-ECRTS-2019-6.pdf)

これらの発見により、著者らは、決定論を提供するための代替アプローチを提示し、ROS 2システムによく知られたスケジューラビリティー分析を適用するための代替手法を提案する。予約ベースのスケジューリングでの応答時間に対する解析である。

## **RCLCエグゼキューター**

ここではC言語で書かれたアプリケーションのためのrclcエグゼキューターを紹介する、rclcエグゼキューターはrcl APIに基づいて実装され、rcl API
のためのROS 2 Executorである。組込みアプリケーションでは、エンド・ツー・エンドのレイテンシーを保証するためにリアルタイム性が要求されたり、テストデータを正しく再検証するために決定性のあるランタイム動作が必要になることがある。しかし、デフォルトのROS 2エグゼキューターは前のセクションで説明したように、その複雑なセマンティクスのせいでそれを達成するのは困難である。

まず、そのようなアプリケーションの要件を分析し、次に、決定論的かつリアルタイムな動作を可能にするためのエクゼキュータの簡単な機能を導き出す。

## **依存関係分析**

最初に、組み込み分野での使用例を説明する。この分野では、決定性とリアルタイム性を保証するために、タイムトリガーのパラダイムがよく使われる。次に、決定性のある動作を可能にする移動ロボットのソフトウェアデザインパターンを分析する。

リアルタイムの組込みアプリケーションのユースケース

組込みシステムでは、リアルタイム性を追求するために、定期的にプロセスをアクティブにするタイムトリガー方式を採用している。
プロセスには優先順位をつけて、プリエンプションを可能にすることができる。図1はその一例で、一定の周期を持つ3つのプロセスを示している。
中段と下段のプロセスは、空の破線で示されたように、複数回プリエンプションされている。

(Figure 1)

図1 : 固定周期のプリエンプティブ・スケジューリング

各プロセスには、図2に示すように、1つまたは複数のタスクを割り当てることができる。これらのタスクは順次実行されていき、協調型スケジューリングと呼ばれている。

(Figure 2)

図2 : 順次実行されるタスクを持つプロセス

与えられた数のプロセスに優先度を割り当てる方法はさまざまですが、プロセッサの使用率が低い場合には、周期が短いプロセスほど優先度が高くなるレートモノトニックスケジューリング方式のスケジューリング割り当てが最適であることがわかっていて、プロセッサの使用率が69%以下の場合に最適であることが示されている LL1973。

ここ数十年たくさんのスケジューリング方法が開発されてきたが、固定周期のプリエンプティブスケジューリングは以前組込みリアルタイムシステム内で広く使われている KZH2015。リアルタイムシステムの特徴を見るとその理由は明らかになる。Linuxと同様、NuttX, Zephyr, FreeRTOS, QNXなどリアルタイムシステムも固定周期のプリエンプティブスケジューリングをサポートし、そして優先度を割り当てることができる。(つまりタイムトリガーパラダイムが内包される設計となる。)この分野ではタイムトリガーのパラダイムが主流の設計原理となっている。

しかし、プリエンプティブスケジューリングが使用され、しかもデータがグローバル変数を通じてマルチプロセス間で共有される場合はデータの一貫性はいつも問題となる。スケジューリング効果およびプロセスの実行時間の変化によってこれらの変数の書き込みと読み取りのタイミングはたまに前後してしまう。これによってアップデート時の遅延は発生してしまう（ある変数は他のプロセスの変数になるタイミング）。マルチプロセスで同じタイミングで変数にアクセスする時に競合を発生してしまう。この問題を解決するために、理論実行時間（LET）がHHK2001で紹介され、事前に定義した周期のタイムインスタンスでのみデータの通信が行われる：読み取りは周期の始めのみで書き込みは周期の終わりのみとなる。遅延時間の増加によるコストと引き換えに、データの一貫性の保持とジッターの軽減が持たされている。このコンセプトは、最近では自動車のアプリケーションにも使われている NSP2018。

図3にLETコンセプトの例を示している。二つのプロセスは１つのグローバル変数を通じてデータのやり取りをすると仮定する。このデータが書き込まれるタイムポイントはプロセスの最後になる。一般のケースでは（左側）、プロセスp3とP4はアップデートを受け取る。図の右側では同じシナリオでLETセマンティック付きのケースとなる。データは周期の境界線にのみ通信を行う。このケースの場合、下のプロセスと周期の終端と通信をしているため、いつまでもプロセスp3とp5が新しいデータを受信する。

組込みでのユースケースは以下のコンセプトに基づいている：
* プロセスの定期的な実行
* プロセスへの固定的な優先順位の割り当て
* プロセスのプリエンプティブ・スケジューリング
* プロセス内のタスクを協調してスケジューリングすること（逐次実行）
* LETセマンティクスによるデータ同期

ROS2ではタイマーを使った周期的な起動が可能である同時にOSではプリエンプティブなスケジューリングがサポートされていて、ROSのノードに対応するスレッド/プロセスの粒度で優先度を割り当てることができる。データに依存しないコールバックを順次に実行することはできない。さらに、データがコールバックが実行される前にDDSキューから読み取られ、アプリケーション実行中のあるタイミングで書き込まれる。rclcppエグゼキューターの
スピン周期関数は固定の周期でデータをチェックし、データが使用可能状態になるとコールバックを実行させることができる。しかしスピン周期関数はすべてのコールバック関数を実行するわけではないため、定期的にコールバックを実行することに役に立たない（別名：プロセス付きタスク）。そのためタイマーをベースにするマルチコールバック（別名：タスク）の実装をトリガーできる機構が必要だ。データ転送はDDSによって提供されてLETセマンティクスの実装はできない。要約して以下の要件を導き出した：

派生した要件：
* 複数コールバック実行をトリガーする
* コールバックの順次処理
* LETセマンティクスによるデータ同期

ロボティクスにおける認知・判断・操作パイプライン

ここでは、決定性のある動作を実現するために、移動ロボティクスで使用される一般的なソフトウェアデザインパターンについて説明する。個々の
デザインパータンのコンセプトおよび決定性のあるエグゼキューター向けの派生要件を述べる。コンセプト：

移動ロボティクスにおける一般的なデザインパラダイムは制御ループでいくつかのフェーズに構成されている：センサーからデータを取得する認知フェーズ、位置推定や経路計画の判断フェーズおよび移動ロボットを操縦する操作フェーズ。もちろんフェーズを追加することも可能だが例としてこれら三つのフェーズのみ使用する。そのような時のパイプラインは図4に示す。

(Figure 4)

図4：マルチセンサーが認知・判断・操作パイプラインを動かす。

通常マルチセンサーは環境を認識するために使われる。たとえばIMUとレーザースキャンナー。自己位置推定のアルゴリズムの精度は処理時のセンサーデータのリアルタイム性に大きく依存する。理想なのはすべてのセンサーの最新のデータがすべて処理されることである。それを達成する方法の１つは認知フェーズですべてのセンサードライバーを実行し、判断フェーズですべてのアルゴリズムを実行させる。

現在、デフォルトのROS2エグゼキューターではプロセスの順番を定義することはできない。原則上データドリブンパイプラインをデザインすることは
できるが、しかし、例えばレーザースキャン中の認知フェーズでも判断フェーズと同じくコールバックが必要な時があるしょう。それら購読者のプロセス順番は任意になってしまう。

この認知・判断・操作パータンに対応するために、個々のフェーズのためにエグゼキューターを定義する。判断フェーズは認知フェーズのすべての
コールバック処理が終了後にトリガーされる。

派生した要件：
* コールバックのトリガー実行

## **複数のレートの同期**

コンセプト：

通常マルチセンサーは移動ロボットは環境を認知するために使用される。IMUは高いレート（e.g., 500 Hz）でデータサンプルを提供すているに
もかかわらず、レーザースキャンは回転速度の制限ではるかに遅いレート (e.g. 10Hz) で動いている。そこで生じるチャレンジは、いかに違う
レートのセンサーデータを融合させることだ。この問題は図5で示す。

(Figure 5)

図5：マルチレートのセンサーデータを決定論的に処理する方法。

スケジュールの関係で、レーザースキャンを評価するコールバックが、IMUのデータを受信する直前または直後に呼び出されることがある。この問題に対する取り組みの一つは、アプリケーション内に追加の同期コードを記述することでである。でも明らかに面倒なやり方で賢くない解決法だ。

もう一つの方法は、IMUのサンプルとレーザースキャンの周波数を同期させて評価すること。たとえば常に50回のIMUサンプルと1回のレーザースキャン
と同時に処理する。図6でこのアプローチを示す。前処理コールバックはIMUサンプルを統合して10Hzのレートで50個サンプルの集約メッセージを送る。これでどのメッセージも同じ周期を持つこととなる。両方のメッセージが利用可能になったときに発火するトリガー条件により、センサー統合
アルゴリズムは常に同期した入力データを期待できる。

(Figure 6)

ROS2では、ROS2エグゼキューターにトリガーの概念がないため、現状ではモデル化することができません。メッセージフィルターを利用することで
ヘッダーのタイムスタンプに基づいてインプットデータを同期させることができるが、rclppでしか実現できない（rclでは無理）。そして、
エグゼキューターにトリガーを追加するのは遥かに効率だ。

また、レーザースキャンを受信したときのみ、IMUデータをアクティブに要求するというアイデアもある。図7ではこれを示す。レーザースキャンデータは届いたらまずずIMUのサンプルを集約したメッセージが要求される。その後、レーザースキャンが処理されて最後センサー統合アルゴリズムは走らせる。コールバックの逐次実行をサポートするエグゼキューターはこのアイデアを実現することができます。


派生した共通要件：
・トリガー実行
・コールバックの逐次実行

優先順位の高い処理パス

モチベーション：

しばしばロボットは同時に複数の行動をこなさなければならない。たとえば経路に沿って障害物を避ける。経路追跡は永続的にアクティブであるのに対して、障害物回避は環境によってトリガーされ、即座に反応しなければならない。そのために行動に優先順位に付ける必要があるでしょう。このコンセプトを図8で示す：

(Figure 8)

図8：順番で優先度高い経路を管理する

認知・判断・操作フェーズ付きの簡略化された制御ループを想定すると、ロボットを一時的に停止させる可能性のある障害物回避は、判断フェーズの前に処理する必要がある。これ例ではこれらの動きは1つのスレッドで処理されると仮定する。

派生した要件：
・コールバックの順次処理

特徴

モバイル・ロボティクスにおけるソフトウェア・アーキテクチャ・パターンとリアルタイム・エンベデッド・ユースケースに基づいて、
以下の特徴を持つエクゼキューターを提案する：
・ユーザー定義によるコールバックの逐次実行
・処理を起動するためのトリガー条件
・データの同期化：LETセマンティクスまたはrclcppエグゼキューターセマンティクス

前述の通り、このエクゼキューターはRCLライブラリをベースにC言語で書かれており、C言語で書かれたマイコンアプリケーションをネイティブにサポートする。ここでは、これらの特徴をより詳しく説明する。

rclcエクゼキューターはROS 2 rclcエクゼキューターと同じくすべてのイベントタイプをサポートする：
・サブスクリプション
・タイマー
・サービス
・クライアント
・ガードコンディション

## **逐次実行**
* 設定段階でユーザーはハンドルの順番を定義する。
* 設定段階でユーザーは新規データを得られたときのみハンドルを呼び出すか（ON_NEW_DATA）、あるいは常にコールバックを呼び出すか（ALWAYS）
　を定義する。
* ランタイム時にすべてのハンドルがユーザー定義順番で実行される。
  * ハンドルの設定は「ON_NEW_DATA」の場合、新しいデータを得た時のみ対応のコールバックを呼び出す。
  * ハンドルの設定は「ALWAYS」の場合、対応のコールバックが常に呼び出される。もしデータはなければデータなしの状態でコールバックが実行される。（e.g. NULLポインター）

## **トリガー条件**
* 一連のハンドルが与えられた場合、これらのハンドルの入力データに基づくトリガー条件によって、処理を開始するタイミングを決定する。
* 設定可能なオプション:
  * ALL operation：すべてのハンドルで入力データが利用可能な状態時に発火する
  * ANY operation：すくなくとも一つのハンドルで入力データが利用可能な状態時に発火する
  * ONE：ユーザーが指定したハンドルの入力データが利用可能になったときに起動する
  * User-defined関数：ユーザーはより高度なロジックを実装することができる

## **LETセマンティック**
* 予測：タイムトリガシステム、エクゼキューターは定期的にアクティブになる
* トリガーが発火したらすべての入力データを読み込み、ロジックコピーを作る
* すべてのコールバックをシーケンシャルに実行する
* エクゼキューターの最後の周期に出力でデータを書き込む（Note: 未実装）

その他、現有のrclcppエクゼキューターセマンティックに以下の内容を実装した（"RCLCPP"）:
* すべてのハンドルの新しいデータを待つ (rcl_wait)
* トリガー条件ANYを使用する
* トリガーは発火したらあらかじめ設定された順序でハンドルの処理を開始する
* DDSからのリクエストが来て、ハンドルが実行される直前に新しいデータをキューに入れる

エクゼキューターセマンティックの選択はオプションであり、デフォルトのセマンティックは"RCLCPP"。

## **エクゼキューターAPI**

RCLCエクゼキューターは二つのフェーズに分けられる：設定と実行

設定フェーズ

設定段階では、ユーザーは以下を定義する必要がある：
* コールバックの総数
* コールバックの順序
* トリガー条件（任意、デフォルト：ANY）
* データ通信セマンティクス（任意、デフォルト：ROS2）

組込みコントローラー向けのエクゼキューターはダイナミック・メモリー・マネージメントが重要である。そのためエクゼキューターの初期化段階ではユーザーはコールバックの合計数を定義する。必要な動的メモリは、この段階でのみ割り当てられ、実行フェーズではそれ以上のメモリは割り当てられない。この性質により、エクゼキューター実行時にはコールバックの追加ができないという意味合いで静的となる。

次に、ユーザーはハンドルと対応するコールバック（e.g. サブスクリプションやタイマー）をエクゼキュータに追加する。この順序は後でランタイム
中の逐次処理順序を定義。

各ハンドルに対して、新しいデータが得られたときにのみコールバックを実行するか（ON_NEW_DATA）、常にコールバックを実行するか（ALWAYS）を
指定できる。2番目のオプションは、コールバックが一定の割合で呼び出されることが予想される場合に便利。

トリガー条件は、これらのコールバックの処理がいつ開始されるかを定義する。便宜上、いくつかのデフォルト条件が定義されている。
* trigger_any(default) : コールバックに新しいデータがあると実行開始
* trigger_all : すべてのコールバックに新しいデータがある場合に実行開始
* trigger_one(&data) : データを受け取ると実行開始
* user_defined_function: より複雑なロジックを持つ独自の関数を定義することもできる

「trigger_any」はデフォルトのため、rclcppエクゼキューターの現有のセマンティックが選択される。

データ通信セマンティック
* ROS2 (デフォルト)
* LET

ROS2のrclcpp Executorと互換性を持たせるために、既存のrclcppのセマンティクスを「ROS2」として実装している。つまり、スピン機能により
DDS-queueは常に新しいデータを監視する（rcl_wait）。新しいデータが利用可能になった場合はコールバックが実行される直前にDDSから取得される
(rcl_take)。すべてのコールバックは、ユーザーが定義した順序で処理される。これは順序を指定できないrclcpp Executorとの唯一の違いである。

次に、LETのセマンティクスは、処理の開始時にすべての利用可能なデータを取得し（rcl_take）バッファリングする、コールバックはバッファリングされたコピーに対してあらかじめ定義された操作で処理される。

実行フェーズ

主な機能として、エクゼキューターは、ROS2のrclcppエクゼキューターのようにDDS-queueに新しいデータがあるかどうかを常にチェックするスピン
機能を持っている。トリガー条件が満たされた場合、DDSキューからのすべての利用可能なデータは、ユーザーが定義した順序で指定されたセマンティクス（ROSまたはLET）に従って処理される。すべてのコールバックが実行された後新しいデータないかとDDSは再度チェックされるようになる。

使用可能なスピン機能：
* spin_some - 一回のみスピンする
* spin_period - ある周期でスピンする
* spin - 永久にスピンする

例

以下組込みおよび前述の移動ロボティクスアプリケーションデザインパータン向けのRCLCエクゼキューターのコード例を紹介する。

組込みユースケース

シーケンシャル実行では、プロセス内のタスクの協調的なスケジューリングをモデル化することができる。トリガー条件はプロセスを定期的に起動するために使用され、プロセスはその後すべてのコールバックが事前に定義された順序で実行される。データの通信はLETセマンティクスを用いる。すべてのエクゼキュータはそれぞれのトレッドで実行され、適切な優先順位を割り当てることができる。

下の例では、エクゼキューターは4つのハンドルが設定されている。あるプロセスには3つの購読者sub1、sub2、sub3を持つことを仮定する。順次処理
の順番は、エクゼクティブに追加された順番で与えられいる。タイマーが周期を定義する。パラメーターのタイマーを持つtrigger_oneが使用されているため、タイマーが準備できたときに、すべてのコールバックが処理される。最後、データ通信セマンティクスLETが定義される。   
誤字？： A timer timer defines 

```
#include "rcl_executor/let_executor.h"

// define subscription callback
void my_sub_cb1(const void * msgin)
{
  // ...
}
// define subscription callback
void my_sub_cb2(const void * msgin)
{
  // ...
}
// define subscription callback
void my_sub_cb3(const void * msgin)
{
  // ...
}

// define timer callback
void my_timer_cb(rcl_timer_t * timer, int64_t last_call_time)
{
  // ...
}

// necessary ROS 2 objects
rcl_context_t context;   
rcl_node_t node;
rcl_subscription_t sub1, sub2, sub3;
rcl_timer_t timer;
rcle_let_executor_t exe;

// define ROS context
context = rcl_get_zero_initialized_context();
// initialize ROS node
rcl_node_init(&node, &context,...);
// create subscriptions
rcl_subscription_init(&sub1, &node, ...);
rcl_subscription_init(&sub2, &node, ...);
rcl_subscription_init(&sub3, &node, ...);
// create a timer
rcl_timer_init(&timer, &my_timer_cb, ... );
// initialize executor with four handles
rclc_executor_init(&exe, &context, 4, ...);
// define static execution order of handles
rclc_executor_add_subscription(&exe, &sub1, &my_sub_cb1, ALWAYS);
rclc_executor_add_subscription(&exe, &sub2, &my_sub_cb2, ALWAYS);
rclc_executor_add_subscription(&exe, &sub3, &my_sub_cb3, ALWAYS);
rclc_executor_add_timer(&exe, &timer);
// trigger when handle 'timer' is ready
rclc_executor_set_trigger(&exe, rclc_executor_trigger_one, &timer);
// select LET-semantics
rclc_executor_data_comm_semantics(&exe, LET);
// spin forever
rclc_executor_spin(&exe);
```

認知・判断・操作パイプライン

この例では、sense-plan-actのパイプラインをシングルスレッドで実現したい。レーザーとIMU両方のデータを得ると認知フェーズが起動されると
トリガー条件は発動する。exe_sense、exe_planとexe_actという3つのエクゼキューターが必要である。2つのセンサー取得コールバックsense_Laser
とsense_IMUはexe_senseエクゼキューターに登録されている。トリガー条件ALLは、これら2つのコールバックのすべてのデータが利用可能な場合に
のみ、センスフェーズを起動する機能を担う。最後に、whileループとspin_some関数を使って、3つのエクゼキューターを回転させる。

コールバックの定義は省略する。

```
...
rcl_subscription_t sense_Laser, sense_IMU, plan, act;
rcle_let_executor_t exe_sense, exe_plan, exe_act;
// initialize executors
rclc_executor_init(&exe_sense, &context, 2, ...);
rclc_executor_init(&exe_plan, &context, 1, ...);
rclc_executor_init(&exe_act, &context, 1, ...);
// executor for sense-phase
rclc_executor_add_subscription(&exe_sense, &sense_Laser, &my_sub_cb1, ON_NEW_DATA);
rclc_executor_add_subscription(&exe_sense, &sense_IMU, &my_sub_cb2, ON_NEW_DATA);
rclc_let_executor_set_trigger(&exe_sense, rclc_executor_trigger_all, NULL);
// executor for plan-phase
rclc_executor_add_subscription(&exe_plan, &plan, &my_sub_cb3, ON_NEW_DATA);
// executor for act-phase
rclc_executor_add_subscription(&exe_act, &act, &my_sub_cb4, ON_NEW_DATA);

// spin all executors
while (true) {
  rclc_executor_spin_some(&exe_sense);
  rclc_executor_spin_some(&exe_plan);
  rclc_executor_spin_some(&exe_act);
}
```

センサー統合

複数のレートをトリガーで同期させるセンサー統合の例を以下のコードで示す。

```
...
rcl_subscription_t aggr_IMU, sense_Laser, sense_IMU;
rcle_let_executor_t exe_aggr, exe_sense;
// initialize executors
rclc_executor_init(&exe_aggr, &context, 1, ...);
rclc_executor_init(&exe_sense, &context, 2, ...);
// executor for aggregate IMU data
rclc_executor_add_subscription(&exe_aggr, &aggr_IMU, &my_sub_cb1, ON_NEW_DATA);
// executor for sense-phase
rclc_executor_add_subscription(&exe_sense, &sense_Laser, &my_sub_cb2, ON_NEW_DATA);
rclc_executor_add_subscription(&exe_sense, &sense_IMU, &my_sub_cb3, ON_NEW_DATA);
rclc_executor_set_trigger(&exe_sense, rclc_executor_trigger_all, NULL);

// spin all executors
while (true) {
  rclc_executor_spin_some(&exe_aggr);
  rclc_executor_spin_some(&exe_sense);
}
```

逐次実行によるセンサー統合の例を以下のコードで示す。注意するのは先にsense_IMUが実行され、IMUメッセージの集約を要求する。次にsense_Laser
が実行される。レーザーメッセージを受信したときにトリガーは発火する。

```
...
rcl_subscription_t sense_Laser, sense_IMU;
rcle_let_executor_t exe_sense;
// initialize executor
rclc_executor_init(&exe_sense, &context, 2, ...);
// executor for sense-phase
rclc_executor_add_subscription(&exe_sense, &sense_IMU, &my_sub_cb1, ALWAYS);
rclc_executor_add_subscription(&exe_sense, &sense_Laser, &my_sub_cb2, ON_NEW_DATA);
rclc_executor_set_trigger(&exe_sense, rclc_executor_trigger_one, &sense_Laser);
// spin
rclc_executor_spin(&exe_sense);
```

優先度の高い順路

この例では認知フェーズコールバックの後、判断フェーズのコールバック「plan」の前に障害物回避の処理obst_avoidを実行するための処理順序を示す。レーザーメッセージを受信すると、制御ループが開始される。次に、上記の例のように、集約されたIMUメッセージが要求される。その後、他のすべてのコールバックが常に実行されるようになる。これは、これらのコールバックがグローバルデータ構造を介して通信していることを前提としている。コールバックはすべて1つのスレッドで実行されるため、競合状態は発生しない。

```
...
rcl_subscription_t sense_Laser, sense_IMU, plan, act, obst_avoid;
rcle_let_executor_t exe;
// initialize executors
rclc_executor_init(&exe, &context, 5, ...);
// define processing order
rclc_executor_add_subscription(&exe, &sense_IMU, &my_sub_cb1, ALWAYS);
rclc_executor_add_subscription(&exe, &sense_Laser, &my_sub_cb2, ON_NEW_DATA);
rclc_executor_add_subscription(&exe, &obst_avoid, &my_sub_cb3, ALWAYS);
rclc_executor_add_subscription(&exe, &plan, &my_sub_cb4, ALWAYS);
rclc_executor_add_subscription(&exe, &act, &my_sub_cb5, ALWAYS);
rclc_executor_set_trigger(&exe, rclc_executor_trigger_one, &sense_Laser);
// spin
rclc_executor_spin(&exe);
```

まとめ

RCLCエクゼキューターはCアプリケーション向けのエクゼキューターであり、デフォルトのrclcppエクゼキューターセマンティクスとして利用できる。
もし追加の決定性のある動きを追加する必要な場合にユーザーは事前に定義された逐次実行、トリガー実行およびデータ同期のためのLETセマンティクスなどに頼ることができる。rclcエクゼキューターのコンセプトは[SLL2020](https://micro.ros.org/docs/concepts/client_library/execution_management/#SLL2020)に掲載されている。

今後のタスク

* フルLETセマンティクス（周期の最後にデータを書き込む）
  * 周期的に配信する配信者
  * エクゼキューターはマルチスレッドで動作する場合、配信はアトミックに行う必要がある

ダウンロード

RCLCエクゼキューターはmicro-ROSのrclcリポジトリーからダウンロードすることができる。このリポジトリー内では、rclcパッケージはRCLCエクゼキューター、そしてrclc_examplesパッケージはいくつかデモを提供する。その他、ros2/rclcリポジトリーからもrclcエクゼキューターを入手できる。 

コールバックグループレベルのエクゼキューター

コールバックグループレベルのエクゼキューターはmicro-ROSで開発された洗練されたrclcppエクゼキューターAPIのプロトタイプである。これは
デフォルトのrclcppエクゼキューターから派生したもので、上述の欠点のいくつか対応している。もっとも重要なのは基底のレイア (rcl、rmw、
rmw_adapter、DDS)はマルチエクゼキューターに問題なくサポートすることの検証用に使われている。 

デフォルトでrclcppエクゼキューターはノードレベルの粒度で動く、これは違うリアルタイム保証が必要とする複数のコールバックを有するノードにとってはネックになる部分である。私たちは、コールバックグループの粒度でコールバックのスケジューリングをより細かく制御するために、APIを改良することにした。個々のコールバックは特定のリアルタイム保証が必要で、生成された後、専用のコールバックグループに関連付けられる。これを受けて、私たちはエクゼキュータと依存するクラス（e.g.メモリ割り当て用）を強化し、より細かいコールバックグループの粒度で動作するようにした。これにより、１つのノード内で違うエクゼキューターインスタンスに割り当てられた違うリアルタイムプロフィールのコールバックを持つことができるようになる。

このように、エクゼキューターのインスタンスは、特定のコールバックグループ専用とすることができ、エクゼキュータのスレッドは、これらのグループのリアルタイム要求に応じて優先順位をつけることができる。例えば、タイムクリティカルなコールバックはすべて最高のスケジューラ優先度で実行されている"RT-CRITICAL"エクゼキューターインスタンスにハンドルされている。

下図は一つのプロセスで二つのノードが三つのコールバックグループレベルエクゼキューターを有する時のアプローチを示す。

(figure)

操縦ベースノードの個々のコールバックは違うエクゼキューターに分配される（赤、黄と緑の部分）。たとえばonCmdVelとpublishWheelTicksコールバックは同じ（黄色の）エクゼキューターによってスケジューリングされる。また、違うノードのコールバックは同じエクゼキューターに登録することができる。

APIの改変

このセッションではエクゼキューターAPIの必要な改変について論じる：

* [include/rclcpp/callback_group.hpp](https://github.com/boschresearch/ros2_rclcpp/blob/cbg-executor-foxy/rclcpp/include/rclcpp/callback_group.hpp):
  * ノードごとに3つのリアルタイムクラス（要件）を区別するために列挙型を導入する（RealTimeCritical, SoftRealTime, BestEffort）
  * エクゼキューターインスタンスとの関連をノードからコールバックグループに変更した。

* [include/rclcpp/executor.hpp](https://github.com/boschresearch/ros2_rclcpp/tree/cbg-executor-foxy/rclcpp/include/rclcpp/executor.hpp)
  * ノード全体に加え、個別のコールバックグループを追加および削除する機能を追加した。
  * ノードのプライベートベクターを、コールバックグループからノードへのマップに置き換えた。

* [include/rclcpp/memory_strategy.hpp](https://github.com/boschresearch/ros2_rclcpp/tree/cbg-executor-foxy/rclcpp/include/rclcpp/memory_strategy.hpp)
  * ノードのベクトルを用するすべての関数を前述のマップに変更した。

* [include/rclcpp/node.hpp](https://github.com/boschresearch/ros2_rclcpp/tree/cbg-executor-foxy/rclcpp/include/rclcpp/node.hpp) and [include/rclcpp/node_interfaces/node_base.hpp](https://github.com/boschresearch/ros2_rclcpp/tree/cbg-executor-foxy/rclcpp/include/rclcpp/node_interfaces/node_base.hpp)
  * リアルタイムクラスのcreate_callback_group関数の拡張引数。
  * get_associated_with_executor_atomic関数の削除。

コールバックグループレベルのエクゼキューターは[PR1218](https://github.com/ros2/rclcpp/pull/1218/commits)でROS 2 rclcppにマージンされた。
※ リンク切れ、修正済み

テストベンチ

概念実証のためにパッケージcbg-executor_ping-pong_cppに小さなテストベンチを実装した。このテストベンチにはリアルタイムとベストエフェクト
のメッセージをお互いに同時に交換するPingノードとPongノードを含む。下図で示したように、メッセージの各クラスは専用のエクゼキューターで
処理される。

(figure)

テストベンチを通じてこのアプローチの機能を検証した。

(figure)

この例のPongノードでは優先度の高いタスク（赤線）のコールバックは10ms、優先度の低いタスク（青線）では40msは掛かる。pingレイトは20Hzに
達する時にCPUは飽和状態となる（10ms*20+40ms*20=1000ms）。より高い周波数では優先度の高いタスクはpongメッセージを送り続けることができるが、優先度の低いpongタスクは劣化していくことになる。周波数100Hzの場合優先度の高いタスクは100%のCPU使用率を必要となる。より高いPingレートでは100HzでPongメッセージを送信し続けられる。一方、優先度の低いタスクはCPUリソースを得られず、メッセージを送ることができない。

テストベンチはcbg_executor_demoに提供されている。
※ リンク切れ、見つからない

関連取り組み

このセクションでは関連するアプローチの概要を説明し、対応するAPIのリンクを提示する。

Fawkesフレームワーク

[Fawkes](https://github.com/fawkesrobotics/fawkes)は認知・判断・操作フェーズ向けの同期ポイントをサポートするロボティクスソフトウェアフレームワークである。2006年からRWTH Aachenによって開発されて来た。[github.com/fawkesrobotics](https://github.com/fawkesrobotics)でソースコードを閲覧することができる。

同期

Fawkesは開発者に様々な同期ポイントを提供し、それらは典型的な認知・判断・操作フェーズを有するアプリケーションの実行順序を定義するには
とても役に立つ。これら10個の同期ポイント (wake-up hooks)は以下の通り(cf. [libs/aspect/blocked_timing.h](https://github.com/fawkesrobotics/fawkes/blob/master/src/libs/aspect/blocked_timing.h)):

* WAKEUP_HOOK_PRE_LOOP
* WAKEUP_HOOK_SENSOR_ACQUIRE
* WAKEUP_HOOK_SENSOR_PREPARE
* WAKEUP_HOOK_SENSOR_PROCESS
* WAKEUP_HOOK_WORLDSTATE
* WAKEUP_HOOK_THINK
* WAKEUP_HOOK_SKILL
* WAKEUP_HOOK_ACT
* WAKEUP_HOOK_ACT_EXEC
* WAKEUP_HOOK_POST_LOOP

コンパイル時の設定

コンパイル時に必要な同期ポイントはモジュールのコンストラクターパラメーターとして定義される。たとえば、SENSOR_ACQUIRE時にmapLaserGenThread
を実行する必要があると仮定すれば、実行は以下のようになる：

```
MapLaserGenThread::MapLaserGenThread()
  :: Thread("MapLaserGenThread", Thread::OPMODE_WAITFORWAKEUP),
     BlockedTimingAspect(BlockedTimingAspect::WAKEUP_HOOK_SENSOR_ACQUIRE),
     TransformAspect(TransformAspect::BOTH_DEFER_PUBLISHER, "Map Laser Odometry")
```

同等に、もしNaoQiButtonThreadはSENSOR_PROCESSフックに実行する必要があれば、コンストラクターは以下となる：

```
NaoQiButtonThread::NaoQiButtonThread()
  :: Thread("NaoQiButtonThread", Thread::OPMODE_WAITFORWAKEUP),
     BlockedTimingAspect(BlockedTimingAspect::WAKEUP_HOOK_SENSOR_PROCESS)
```

ランタイム実行

ランタイム時にエクゼキューターは同期ポイントのリストを再帰的に実行し、登録されたすべてのスレッドを完了するまで実行する。その後、
次の同期ポイントのスレッドが呼び出される。

モジュール（スレッド）は、これらの認知・判断・操作の同期ポイントに独立して構成することができる。これはスレッドを並行実行させる効果
がある。

次の図は、Fawkesフレームワークのハイレベルな概要を示す。コンパイル時に認知・判断・操作のwakeupフックの設定が行われ（上の部分）、
ランタイム時にスケジュラーはwakeupフックリストを再帰的に実行する（下の部分）：

(figure)

従って、ランタイム時にフックはプリエンプションなしの固定静的スケジュールとして実行される。同じフックに登録された複数のスレッドが並行して実行される。

認知・判断・操作フェーズを持つアプリケーションの逐次実行とは別に、バリアによって、実行順序にさらなる制約を設けることができる。バリアは、いくつかのスレッドを定義し、メインスレッドはスタートする前にバリアに属するスレッドを終了させる必要がある。

これらのコンセプトは以下のメインクラスによって実装されている：
* SyncPointとSyncPointManagerにあるWakeupフック、同期ポイントのリストを管理する。
* FawkesMainThreadクラスによるエクゼキューター、スケジュラーであってユーザースレッドを呼び出すことを担当する。
* BlockedTimingExecutorから派生したThreadManagerは、Wakeupフックへのスレッドの追加と削除、およびウェイクアップフックの逐次実行に必要なAPIを提供する。
* BarrierはC++に類似するオブジェクトである。

ディスカッション

すべてのスレッドは同じ優先順位で実行される。複数の認知・判断・操作チェーンが異なる優先順位で実行されたいケースには不向きである
e.g. 通常の操作よりも緊急停止の実行を優先させたい場合

また、この認知・判断・操作チェーンのシングルインスタンスでは異なる実行頻度をモデル化することはできない。しかし ロボット工学では、
最速のセンサーがチェーンを駆動させ、他のすべてのフックは同じ頻度で実行される。

参考
・[L2020] Ralph Lange: Advanced Execution Management with ROS 2, ROS-Industrial Conference, Dec 2020 [Slides]
・[SLL2020] J. Staschulat, I. Lütkebohle and R. Lange, “The rclc Executor: Domain-specific deterministic scheduling mechanisms for ROS applications on microcontrollers: work-in-progress,” 2020 International Conference on Embedded Software (EMSOFT), Singapore, Singapore, 2020, pp. 18-19. [Paper] [Video]
・[L2018] Ralph Lange: Callback-group-level Executor for ROS 2. Lightning talk at ROSCon 2018. Madrid, Spain. Sep 2018. [Slides] [Video]
・[CB2019] D. Casini, T. Blaß, I. Lütkebohle, B. Brandenburg: Response-Time Analysis of ROS 2 Processing Chains under Reservation-Based Scheduling, in Euromicro-Conference on Real-Time Systems 2019. [Paper] [slides]
・[EK2018] R. Ernst, S. Kuntz, S. Quinton, M. Simons: The Logical Execution Time Paradigm: New Perspectives for Multicore Systems, February 25-28 2018 (Dagstuhl Seminar 18092). [Paper]
・[BP2017] A. Biondi, P. Pazzaglia, A. Balsini, M. D. Natale: Logical Execution Time Implementation and Memory Optimization Issues in AUTOSAR Applications for Multicores, International Worshop on Analysis Tools and Methodologies for Embedded and Real-Time Systems (WATERS2017), Dubrovnik, Croatia.[Paper]
・[LL1973] Liu, C. L.; Layland, J.:Scheduling algorithms for multiprogramming in a hard real-time environment, Journal of the ACM, 20 (1): 46–61, 1973.
・[HHK2001] Henzinger T.A., Horowitz B., Kirsch C.M. (2001) Giotto: A Time-Triggered Language for Embedded Programming. In: Henzinger T.A., Kirsch C.M. (eds) Embedded Software. EMSOFT 2001. Lecture Notes in Computer Science, vol 2211. Springer, Berlin, Heidelberg
・[NSP2018] A. Naderlinger, S. Resmerita, and W. Pree: LET for Legacy and Model-based Applications, Proceedings of The Logical Execution Time Paradigm: New Perspectives for Multicore Systems (Dagstuhl Seminar 18092), Wadern, Germany, February 2018.
・[KZH2015] S. Kramer, D. Ziegenbein, and A. Hamann: Real World Automotive Benchmarks For Free, International Workshop on Analysis Tools and Methodologies for Embedded adn Real-Time Sysems (WATERS), 2015.[Paper]

謝辞

この活動は、欧州連合のHorizon 2020のリサーチおよびイノベーションプログラム下の欧州研究評議会（ERC）から資金提供を受けている。
（助成金契約　n° 780785）