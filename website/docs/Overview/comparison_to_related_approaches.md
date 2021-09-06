---
id: comparison_to_related_approaches
title: Comparison to related approaches
---

Micro-ROSはマイクロコントローラの世界にでROS 2をももたらした。このセクションでは類似のアプローチの分析と比較テーブルを示す。

**ROSSerial**

ROSSerialはシリアルボードあるいはネットワークソケットを通じスタンダードのROSシリアライズメッセージのラップおよびマルチトピック、サービスを多重化するためのプロトコル。プロトコル定義を含め、ROSSerialに3種類のタイプのパッケージが含まれている。

* クライアントライブラリー：クライアントライブラリーは簡単のROSノードの立ち上げと多用なシステムで動作する機能をユーザーに提供する。これらのクライアントは汎用のANSI C++ rosserial_clientライブラリーのポートとなる。   
* ROSサイドインタフェース：これらのパッケージはホストマシンにrosserialプロトコールをより汎用的なROSネットワークにブリッジするためのノードを提供する。     
* 事例とユースケース。   

言及する必要があるのはこのアプローチをmicro-ROSと完全に比較することはできない、理由としてはこのアプローチはROS 1で動作するように作られていたが、micro-ROSはROS 2にフォーカスしているからだ。

リファレンス: [ROSserial Wiki](http://wiki.ros.org/rosserial) 
	