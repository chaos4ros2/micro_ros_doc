---
id: ros2_feature_comparison
title: ROS 2 Feature Comparison
---

このセクションはmicro-ROSとROS 2の特徴の比較となる。下に示すリストが[https://index.ros.org/doc/ros2/Features/](https://index.ros.org/doc/ros2/Features/)と[https://index.ros.org/doc/ros2/Roadmap/](https://index.ros.org/doc/ros2/Roadmap/)からまとめられた、そして「Features and Architecture」で述べたカテゴリに沿って特徴をテーブル形式に整理した。

## **Microcontroller-optimized client API supporting all major ROS concepts**

| ROS2特徴  | | micro-ROSでの可用性 |
| ---- | ---- | ---- |
| 特定の言語ライブラリーでラップした共通のコアクライアントライブラリー  | ✓∘ | ROS 2のクライアントサポートライブラリーrclをそのまま使用している。rclcパッケージがrcl+rclcを利用してC言語で利用できる便利な機能とエグゼキューターを提供してくれる。ロードマップ: すべての機能をrclcに移行し、rclの上に位置する独立した抽象化レイヤーにしてユーザーAPIのように機能する。|
| コンパイル、リンク、動的リンク時のノードコンポーネントのコンポジション | ✓ | コンパイルタイムでのコンポジションだけになる。ランタイムでのコンポジションはRTOSに依存する要素は大きいから。 |
| ライフサイクル付きノード | ✓ | rclc_lifecycleパッケージはrclc_lifecycle_nodeタイプを提供している、このタイプは1つのrclノードにライフサイクルステートマシンをバンドルさせてライフサイクル管理の機能を提供する。 |
| タイプおよびトピックのメモリを静的あるいは動的にハンドルするユーティリティー | ✓ | micro_ros_utilitiesはmicro-ROSアロケーターあるいは静的メモリプールを通じてタイプメモリのハンドル用APIを提供する。|


