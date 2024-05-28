
Config.ini.ok
	为dtu烧录的配置文件备份
	但如果要烧录dtuBoot.bin就得使用Config.ini.boot/Config.ini文件
Config.ini.boot
	这里的Config.ini.boot中的dataflash文件烧录配置在Linux下不会被实现，因此直接用Config.ini，不在配置文件中配置dataflash的烧录，自己修改IspCmdTool.cpp实现向datafalsh中烧录dtuBoot.bin
Config.ini
	为dtu烧录的配置文件


dtuBoot.hex
	为要往dataflash中烧录的boot程序的hex文件
dtuBoot.bin（可用）
	这里的dtuBoot.bin是通过在Windows下Hex2Bin工具用ShellPower命令行——>.\hex2bin.exe -b .\dtuBoot.hex转换出来的bin文件


dtu-core.hex
	为节点固件，固件已经更新了很多版本，请前往辉哥的共享文件夹寻找最新的dtu固件
dtuCore-v0.6.0(LOG).hex
	共享文件夹中截至24.1.4前的最新dtuCore固件

