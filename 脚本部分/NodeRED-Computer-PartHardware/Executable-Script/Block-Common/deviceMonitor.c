#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/inotify.h>
#include <unistd.h>
#include <mosquitto.h>
#include <string.h>
#include <time.h>

#define EVENT_SIZE  ( sizeof (struct inotify_event) )
#define BUF_LEN     ( 1024 * ( EVENT_SIZE + 16 ) )
#define MQTT_HOST "localhost"
#define MQTT_PORT 1883

// MQTT初始化及连接服务器
void mqtt_init_connect(struct mosquitto **mosq) {
    char client_id[24];
    snprintf(client_id, sizeof(client_id), "mqtt_client_%ld", time(NULL));

    // 初始化mosquitto库
    mosquitto_lib_init();

    // 创建一个新的mosquitto客户端实例
    *mosq = mosquitto_new(client_id, true, NULL);
    if (!(*mosq)) {
        fprintf(stderr, "Can't initialize Mosquitto library\n");
        exit(EXIT_FAILURE);
    }

    // 连接到MQTT服务器
    if (mosquitto_connect(*mosq, MQTT_HOST, MQTT_PORT, 60) != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "Unable to connect to MQTT broker\n");
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }
    
    // 开始异步处理
    mosquitto_loop_start(*mosq);
}


// mqtt主题发布失败后有3次重发的机制
void mqtt_send_message(struct mosquitto *mosq, const char *topic, const char *message) {
    int ret = mosquitto_publish(mosq, NULL, topic, strlen(message), message, 0, false);
    if (ret != MOSQ_ERR_SUCCESS) {
        fprintf(stderr, "Failed to send message: %s\n", mosquitto_strerror(ret));
        // 发布失败后重新发布消息
        int retryCount = 3; // 设置重试次数
        int retryDelay = 500; // 设置重试延迟时间（毫秒）
        while (retryCount > 0) {
            usleep(retryDelay * 1000); // 等待重试延迟时间
            ret = mosquitto_publish(mosq, NULL, topic, strlen(message), message, 0, false);
            if (ret == MOSQ_ERR_SUCCESS) {
                fprintf(stderr, "Message sent successfully on retry\n");
                break;
            } else {
                fprintf(stderr, "Failed to send message on retry: %s\n", mosquitto_strerror(ret));
                retryCount--;
            }
        }
        
        if (retryCount == 0) {
            fprintf(stderr, "Failed to send message after multiple retries\n");
        }
    }
}


int main() {
    int fd;
    int wd;
    char buffer[BUF_LEN];
    struct mosquitto *mosq = NULL;

    // 初始化MQTT并连接服务器
    mqtt_init_connect(&mosq);

    fd = inotify_init();
    if (fd < 0) {
        perror("inotify_init");
        mosquitto_disconnect(mosq);
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        exit(EXIT_FAILURE);
    }

    wd = inotify_add_watch(fd, "/dev", IN_CREATE | IN_DELETE);
    if (wd == -1) {
        perror("inotify_add_watch");
        mosquitto_disconnect(mosq);
        mosquitto_destroy(mosq);
        mosquitto_lib_cleanup();
        close(fd);
        exit(EXIT_FAILURE);
    }

    printf("Watching /dev directory for changes.\n");

    while (1) {
        int length = read(fd, buffer, BUF_LEN);
        if (length < 0) {
            perror("read");
            break;
        }

        int i = 0;
        while (i < length) {
            struct inotify_event *event = (struct inotify_event *)&buffer[i];
            if (event->mask & IN_CREATE || event->mask & IN_DELETE) {
                printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                char path_name[256];
                snprintf(path_name, sizeof(path_name), "{\"action\":\"%s\",\"device_name\":\"/dev/%s\"}", (event->mask & IN_CREATE) ? "add" : "remove", event->name);
                mqtt_send_message(mosq, "device/monitor", path_name);
            }
            i += EVENT_SIZE + event->len;
        }
    }

    // Clean up
    inotify_rm_watch(fd, wd);
    close(fd);
    mosquitto_disconnect(mosq);
    mosquitto_loop_stop(mosq, false); // 停止mosquitto loop
    mosquitto_destroy(mosq);
    mosquitto_lib_cleanup();

    return 0;
}
