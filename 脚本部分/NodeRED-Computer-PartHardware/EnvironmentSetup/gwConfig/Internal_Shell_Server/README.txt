internalShellServer内部执行本地脚本服务器的可执行文件

internalShellServer.service
	1）开机自启动LoRa发送数据包的程序
	2）将internalShellServer.service放入 /etc/systemd/system/
	3）sudo systemctl daemon-reload载入服务
	4）sudo systemctl enable internalShellServer
	5）sudo systemctl start internalShellServer
	6）sudo journalctl -fu internalShellServer查看服务的实时打印信息
	


