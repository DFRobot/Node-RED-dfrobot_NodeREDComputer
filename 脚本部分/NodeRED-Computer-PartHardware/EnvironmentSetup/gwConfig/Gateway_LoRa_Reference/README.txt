
test_loragw_hal_tx_DF是在官方测试的发送例程中进行了修改: 在发送的数据包中加入了DFRobot字段44 46 52 6F 62 6F 74

执行网关发送命令
每隔1s发送1条数据，总共发送100条数据
./test_loragw_hal_tx_DF -d /dev/spidev2.0 -k0 -c0 -r1250 -f868.1 -mLORA --pa 1 -l12 --pwid 14 -s5 -b125 -z16 -n100 -t1000


每隔1s发送一次数据，一直发送
./test_loragw_hal_tx_DF -d /dev/spidev2.0 -k0 -c0 -r1250 -f868.1 -mLORA --pa 1 -l12 --pwid 14 -s5 -b125 -z16 -t 1000



GWLoraTX内部执行本地脚本服务器的可执行文件

GWLoraTX.service
	1）开机自启动LoRa发送数据包的程序
	2）将GWLoraTX.service放入 /etc/systemd/system/
	3）sudo systemctl daemon-reload载入服务
	4）sudo systemctl enable GWLoraTX
	5）sudo systemctl start GWLoraTX
	6）sudo journalctl -fu GWLoraTX查看服务的实时打印信息
	

