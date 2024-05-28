test_loragw_hal_rx_DF
	1）修改了源码，将CRC校验给取消了，根据状态码0x01匹配LoRa发送过来的数据包
	
执行命令为：/opt/Gateway_LoRa_Test/test_loragw_hal_rx_DF -d /dev/spidev2.0 -k0 -r1250 -z16 -n2