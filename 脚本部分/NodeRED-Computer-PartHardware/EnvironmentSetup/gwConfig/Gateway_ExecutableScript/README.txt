1、burnOTP使用说明：
    1）./burnOTP -band 868 -hardware 1.0 -mac 112233445566 -md5 0123456789abcd  （这里的mac来自网络数据库，md5是通过get_gwSN.sh脚本获取的cpuid进行转换为32位md5截取的前14字符<14bytes>）

        1> 表示之前已经烧录成功了，本次不可重复烧录（只能在网关中固化一次，所以用测试文件先进行模拟，也可能直接用这个测试文件出厂?）
            band has already been burned
            hardware has already been burned
            mac has already been burned
            md5 has already been burned
        2> 首次烧录otp成功
            band_version burnning sucess: [868 1.0]
            md5_mac burnning sucess: [112233445566 0123456789abcd]


    2）./burnOTP -all   
        1> 没有烧录otp时
            Burning OTP with the following configuration:
        2> 成功烧录otp后
            Burning OTP with the following configuration:
            Band: 868
            Hardware version: 1.0
            MAC address: 112233445566
            md5: 0123456789abcd

    3）通过dd if=/dev/zero of=test bs=1 seek=0 count=64命令用于清理otp烧录的模拟测试文件



2、get_gwSN.sh脚本获取的cpuid

