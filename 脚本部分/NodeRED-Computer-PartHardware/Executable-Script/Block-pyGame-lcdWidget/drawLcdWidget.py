import pygame
import sys
import redis
import json
import threading
import time

# -----------------------------------------------------------------------------全局变量
# 绘制命令列表
draw_cmd_list = []      # 全局列表
lock = threading.Lock() # 线程锁
index = 0



# -----------------------------------------------------------------------------函数合集
# 监听Redis消息并存储绘图命令
def redisListenDrawCmd(pubsub):
    for message in pubsub.listen():
        print(message)

        if message['type'] == 'message' and message['channel'] == b'redis_draw_cmd':
            try:
                data_str = message['data'].decode("utf-8")  # 将字节串转换为字符串
                dictionary = eval(data_str)                 # 将字典字符串转化为字典
                # draw_type = dictionary.get('draw_type')     # 获取绘制命令类型
                # print(draw_type)
                lock.acquire()
                draw_cmd_list.append(dictionary)
                lock.release()

                # CmdParser(draw_type)                        # 绘图命令解析器函数
            except:
                print('ERROR: function -> listen_for_commands()')



def draw_text(screen, cmd, font_cache):
    """
    绘制文本到屏幕上，并利用字体缓存来避免重复创建字体对象。
    """
    font_key = cmd["font_size"]  # 使用字体大小作为缓存的键
    if font_key not in font_cache:  # 如果缓存中没有这个字体大小的字体对象
        try:
            # 加载中文字体文件并创建字体对象
            font_cache[font_key] = pygame.font.Font("/root/NodeRED-Computer-PartHardware/Executable-Script/Block-pyGame-lcdWidget/font/MicrosoftYaHei.ttf", cmd["font_size"])    
        except IOError:
            print(f"Error loading font. Size: {cmd['font_size']}")
            return
    font = font_cache[font_key]
    text = font.render(cmd["text_content"], True, cmd["font_color"])
    screen.blit(text, (cmd["x"], cmd["y"]))

# 初始化字体缓存
font_cache = {}

# 根据命令绘图
def DrawFunc(screen):
    # print(draw_cmd_list)
    # print("-----------------")
    # 遍历绘制命令列表（根据优先级从低到高排序）
    # sorted_list = sorted(draw_cmd_list, key=lambda x: x['priority']) # 使用sorted函数对列表进行排序，key参数指定按照字典中的'priority'键进行排序
    draw_cmd_list.sort(key=lambda x: x['priority'])   # 在原列表上进行排序
    # print(draw_cmd_list)


    # 1、处理绘图命令
    for cmd in draw_cmd_list:   # 遍历列表
        print(cmd)
        if cmd["draw_type"] == "background_color":
            screen.fill(cmd["color"])  # 清屏并填充背景色
        if cmd["draw_type"] == "draw_line":
            pygame.draw.line(screen, cmd["color"], (cmd["x0"], cmd["y0"]), (cmd["x1"], cmd["y1"]), cmd["line_width"])
        # 注意：边框色应该向填充
        if cmd["draw_type"] == "draw_rect": # 绘制两个矩形,一大一小表示边框
            pygame.draw.rect(screen, cmd["border_color"], (cmd["x"], cmd["y"],  cmd["width"], cmd["height"]), border_radius=cmd["border_radius"])
            pygame.draw.rect(screen, cmd["fill_color"],  (cmd["x"]+cmd["line_width"], cmd["y"]+cmd["line_width"], cmd["width"]-2*cmd["line_width"], cmd["height"]-2*cmd["line_width"]), border_radius=cmd["border_radius"])
        if cmd["draw_type"] == "draw_circle":
            if cmd["fill_color"] != 'None':
                pygame.draw.circle(screen, cmd["fill_color"], (cmd["x"], cmd["y"]), cmd["radius"])
            pygame.draw.circle(screen, cmd["border_color"], (cmd["x"], cmd["y"]), cmd["radius"], cmd["line_width"])
        if cmd["draw_type"] == "draw_text":
            draw_text(screen, cmd, font_cache)
            # font = pygame.font.Font("/root/NodeRED-Computer-PartHardware/Executable-Script/Block-pyGame-lcdWidget/font/MicrosoftYaHei.ttf", cmd["font_size"])    # 加载中文字体文件并创建字体对象
            # text = font.render(cmd["text_content"], True, cmd["font_color"]) # 创建文本对象，并设置文本属性
            # text_pos = (cmd["x"], cmd["y"]) # 设置文本的位置
            # screen.blit(text, text_pos) # 渲染文本到屏幕
    
    # 2、更新屏幕显示
    pygame.display.flip()
    # 3、清空列表
    draw_cmd_list.clear()


# -----------------------------------------------------------------------------
# 主逻辑函数
# -----------------------------------------------------------------------------
def main():
    # init
    pygame.init()   # 初始化pygame
    info = pygame.display.Info()    # 获取屏幕信息(python版本与pyGame不兼容？)
    screen_width = info.current_w
    screen_height = info.current_h
    # screen_width = 400
    # screen_height = 300
    print("屏幕宽度：", screen_width)
    print("屏幕高度：", screen_height)

    screen = pygame.display.set_mode((screen_width, screen_height)) # 创建屏幕

    pygame.display.set_caption("Draw Shapes with Flask and Pygame") # 设置窗口标题

    
    BLACK = (0, 0, 0)       # 定义颜色
    WHITE = (255, 255, 255)

    
    screen.fill(BLACK)  # 清屏并填充背景色

    # 连接到Redis服务器
    redis_conn = redis.Redis()
    pubsub = redis_conn.pubsub()
    pubsub.subscribe('redis_draw_cmd')  # 订阅绘图命令频道


    # 启动监听Redis的线程
    threading.Thread(target=redisListenDrawCmd, args=(pubsub,), daemon=True).start()


    # 主循环
    running = True
    while running:
        # 1、处理事件
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                
        # 2、根据命令绘图
        lock.acquire()
        DrawFunc(screen)
        lock.release()
        time.sleep(0.5)

    # 退出pygame
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()

