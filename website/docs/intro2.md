---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **Docusaurus in less than 5 minutes**.

## Getting Started

Get started by **creating a new site**.

Or **try Docusaurus immediately** with **[docusaurus.new](https://docusaurus.new)**.

## Generate a new site

Generate a new Docusaurus site using the **classic template**:

```shell
npx @docusaurus/init@latest init my-website classic
```

## Start your site

Run the development server:

```shell
cd my-website

npx docusaurus start
```

Your site starts at `http://localhost:3000`.

Open `docs/intro.md` and edit some lines: the site **reloads automatically** and display your changes.

---
title: Supported Hardware
permalink: /docs/overview/hardware/
---

Micro-ROS aims to **bring ROS 2 to a wide set of microcontrollers** to allow having first-class ROS 2 entities in the embedded world.

The main targets of micro-ROS are mid-range 32-bits microcontroller families. Usually, the minimum requirements for running micro-ROS in an embedded platform are memory constraints. Since memory usage in micro-ROS is a complex matter we provide a [complete article](/docs/concepts/benchmarking/benchmarking/) describing it and a tutorial on [how to tune the memory consuption](../../tutorials/advanced/microxrcedds_rmw_configuration/) in the micro-ROS middleware. 

In general micro-ROS will need MCUs that have tens of kilobytes of RAM memory and communication peripherals that enable the micro-ROS [Client to Agent communication](../features/).

The micro-ROS hardware support is divided into two categories: 
- Officially supported boards
- Community supported boards

*In order to check the most recent hardware support visit the [micro_ros_setup repo](https://github.com/micro-ROS/micro_ros_setup)*.

日本語テスト   
japanese test
## Officially supported boards

The officially supported boards are those which have been carried out or tested officially, and to which LTS is guaranteed.

<div class="hardwarecontainer">
  <div class="hardwareitem_description">
    <h3><b>Espressif ESP32</b></h3>
    <div>
        &#10004; <b>Key features:</b>
        <ul>
            <li>MCU: ultra-low power dual-core Xtensa LX6</li>
            <li>RAM: 520 kB</li>
            <li>Flash: 4 MB</li>
            <li>Peripherals: Ethernet MAC, Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR, BLE, SPI, I2C, I2S, UART, SDIO, CAN, GPIO, ADC/DAC, PWM  </li>
        </ul>  
        &#127758; <b>Resources:</b>
        <ul>
            <li><a href="https://www.espressif.com/en/products/socs/esp32">Official website</a></li>
            <li><a href="https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32e_esp32-wroom-32ue_datasheet_en.pdf">Datasheet</a></li>
        </ul>
        &#9881; <b>Supported platforms:</b>
        <ul>
            <li><b>RTOSes:</b> <a href="https://www.freertos.org/">FreeRTOS</a></li>
            <li><b>External tools:</b> <a href="https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/">ESP-IDF</a></li>
        </ul>
        &#128268; <b>Supported transports:</b>
        UART, WiFi UDP, Ethernet UDP
    </div>
  </div>

  <div class="hardwareitem_image">
    <img src="imgs/4.jpg" />
  </div>
</div>

