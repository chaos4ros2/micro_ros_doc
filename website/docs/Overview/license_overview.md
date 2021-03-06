---
id: license_overview
title: ライセンスの概略
---


このページは大まかにmicro-ROSのライセンスの概略を見てみる。法律に関するアドバイスと同等ではないため、実際に自身のmicro-ROSベースのアプリとシステム(i.e. 製品)に使用されるすべてのコンポーネントのライセンス条文を確認しなければならない。

下の構造図はもっとも重要なリポジトリとそれぞれのライセンスをGitHubOrganization/RepositioryName [LicenseName]の形式で列挙した。

![Docusaurus](/img/micro-ROS_license_overview.png)

標準のROS 2から取ったすべてのパッケージはApache 2.0ライセンス。同様に、micro-ROSプロジェクト内で作ったすべてのミドルウェアとクライアントライブラリーパッケージもApache 2.0の元で提供されている。Micro XRCE-DDSと呼ばれるeProsimaが実装するDDS-XRCEも同じくApache 2.0である。

一つ例外になってるのがmicro-ROSベンチマークツールで、GPL v3ライセンス下のライブラリーを使用しているため、GPL v3の元で公開している。
開発中だけそのツールを使って公開の製品に含まれないであれば製品のライセンスに影響を及ぼさないはず。

RTOSに関わるとより一層ややこしくなる：micro-ROSビルドツールのmicro_ros_setupと外部ビルドシステム向けの様々のモジュールはApache 2.0に基づいている
けど、???が様々違うライセンス下のRTOSとボードをサポートするコンポーネントによって組み合わせられている。事実上、典型的な組込みツールチェーンはすべて
のソフトウェア（RTOS、micro-ROSとアプリケーション）を1つのバイナリーイメージにビルドすることが状況をより一層複雑にしている、独立構造を持つ典型的なデスクトップOS
よりも（cf. GPLを除くLinux syscall）。

以下micro-ROSにサポートするRTOSの重要なライセンスの詳細を把握している：

* NuttXライセンス整理：Apacheソフトウェア財団が開いた2019年12月のインキュベーションにおいて、重要なライセンスの整理作業が行われた。
　バージョン10.1のChangeLogでは数千のNuttXのファイルが（BSDから）Apache 2.0に変換されたことを示している。それにNuttXに使われている
　サードパーティのライセンスが強化された。   
* NuttXとuClibc++: NuttXのバージョン10以前の場合、NuttXでmicro-ROSを利用する場合はLGPLライセンスのuClibc++ライブラリーが必要。   
* FreeRTOS向けのST専用拡張機能：micro-ROS/freertos_appsリポジトリに様々なマイコン向けの拡張機能が含まれている。STMicroelectronics産マイ　クロコンピューター用のヘッダーファイルはいくつかST’s Ultimate Liberty licenseの下で配布している、それらはSTMicroelectronics産のマイク　ロコンピューターあるいはマイクロプロセッサーデバイス上で単独に実行しなければならない。   
* Arm® Mbed™ OS内のサードパーティーライセンス：リポジトリルートのLICENSE.mdにサードパーティーのライセンスがリスト化されている。   

… and in the corresponding tooling:
… そして通信関係ツールいおいては：

* ZepyhrのGPLライセンスビルドスクリプト：サードパーティーのライセンスは直接ソースツリーで示しているが、docs.zephyrproject.org/latest/LICENSING.html
　からいくつかのビルドスクリプトはGPL v2ライセンスの元で提供していると明言している。
* ESP-IDFのGPLライセンスビルドツール：ESP32用のEspressif IoT開発フレームワークにはGPL v2あるいはv3ライセンスのカーネルのコンフィグレーション(Kconfig)
　および複数のビルドツールファイルが含まれている。
* Arduino IDE向けの静的ライブラリー：libmicroros.aライブラリーはArduino IDEでmicro-ROSを使用する静的のライブラリーであるlibmicroros.aを
　提供している。このライブラリーは違うマイコンごとに適切のクロスコンパイル設定でビルドした複数のバージョンが存在している。ライブラリーのリポジトリのリストを該ライブラリーのリポジトリのルートにあるbuilt_packagesにある。