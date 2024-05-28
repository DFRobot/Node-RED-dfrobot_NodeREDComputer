import requests
import json

# 定义要发送的数据
data = {
    "command": "lsusn"
}

# 将数据转换为JSON格式
json_data = json.dumps(data)

# 发送POST请求
url = "http://192.168.232.135:8080/linuxdev/internal/shell"
response = requests.post(url, data=json_data)

# 打印服务器返回的内容
print(response.text)

