---
id: comparison_to_related_approaches
title: Comparison to related approaches
---

Micro-ROSはマイクロコントローラの世界にでROS 2をももたらした。このセクションでは類似のアプローチの分析と比較テーブルを示す。

## **ROSSerial**

ROSSerialはシリアルボードあるいはネットワークソケットを通じスタンダードのROSシリアライズメッセージのラップおよびマルチトピック、サービスを多重化するためのプロトコル。プロトコル定義を含め、ROSSerialに3種類のタイプのパッケージが含まれている。

* クライアントライブラリー：クライアントライブラリーは簡単のROSノードの立ち上げと多用なシステムで動作する機能をユーザーに提供する。これらのクライアントは汎用のANSI C++ rosserial_clientライブラリーのポートとなる。   
* ROSサイドインタフェース：これらのパッケージはホストマシンにrosserialプロトコールをより汎用的なROSネットワークにブリッジするためのノードを提供する。     
* 事例とユースケース。   

言及する必要があるのはこのアプローチをmicro-ROSと完全に比較することはできない、理由としてはこのアプローチはROS 1で動作するように作られていたが、micro-ROSはROS 2にフォーカスしているからだ。

リファレンス: [ROSserial Wiki](http://wiki.ros.org/rosserial) 
	
## **RIOT-ROS2**

RIOT-ROS2はメインROS 2スタックをベースに変更したパッケージで、RIOTオペレーティングシステムのおかげでそれをマイクロコントローラー上で動かすことができるようになった。

ROS 2は複数のレイヤから構成される。いくつかはすでにマイクロコントローラー上で動作可能に変更を加えられた、RIOS-ROS2プロジェクトで利用可能なレイヤのリストを示す：

* ROS Client Library bindings: RCLC
* ROS Client Library: RCL
* ROS MiddleWare: rmw_ndn
* ROS IDL Generators: generator_c
* ROS IDL Type Support: CBOR
* ROS IDL Interfaces:
    * common_interfaces
    * rcl_interfaces

最後に言うべきなのは開発は止まってるらしい。そう思う理由は最終コミットは[2018年7月](https://github.com/astralien3000/riot-ros2/commits/master) となってるからだ。

Reference:[RIOT-ROS2](https://github.com/astralien3000/riot-ros2/wiki) 

## **Comparation table**

|      | rosserial | RIOT-ROS2 | micro-ROS |
| ---- | ---- | ---- | ---- |
| OS | bare-metal | RIOT | NuttX, FreeRTOSとZephyr |
| 中継アーキテクチャー | ブリッジ | N/A | ブリッジ |
| メッセージフォーマット | ROS1 | N/A | CDR (DDSから) |
| 通信リンク | UART | UART | UART, SPI, IP (UDP), 6LowPAN, … |
| 通信プロトコール | カスタム | NDN | XRCE-DDS (あるいはrmw) |
| コードベース | 独立した実装 | スタンダードROS 2のRCL | スタンダードROS 2のRCL (まもなくRCLCPPに) |
| ノードAPI | カスタムrosserial API | RCL,RCLC | RCL (まもなくRCLCPPに) |
| コールバック実行 | シーケンシャル, メッセージ順 | N/A | ROS 2 executorsあるいはMCU optimized executors |
| タイマー | 含まない | 含まない | 標準ROS 2タイマー |
| ホストとの同期 | カスタム | N/A | NTP/PTP |
| ライフサイクル | 未対応 | 部分的 | 部分的、まもなく完全対応 |

rmwの参考資料：https://tech.tier4.jp/entry/2020/12/23/160000