#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/inotify.h>
#include <unistd.h>
#include <mosquitto.h>
#include <string.h>
#include <time.h>

#include <signal.h>

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

    int ret = mosquitto_publish(mosq, NULL, topic, strlen(message), message, 2, false);
    printf("\n\nret = %d  %s  %d  %s\n\n",ret,topic,strlen(message),message);
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


// SIGCHLD信号处理函数
void sigchld_handler(int sig) {
    // 循环调用waitpid，直到没有更多终止的子进程
    while (waitpid(-1, NULL, WNOHANG) > 0);
}



void on_connect(struct mosquitto *mosq, void *userdata, int result)
{
    if (result == 0) {
        printf("Connected to MQTT Broker\\n");
    } else {
        printf("Connection to MQTT Broker failed\\n");
    }
}




// Function to handle device events
// 在子进程中重新建立mqtt连接，并回收资源
void handle_device_event(const struct inotify_event *event, const char* argv1, const char* argv2) {

    char *broker = "mqtt.eclipse.org";
    int port = 1883;
    int keepalive = 60;
    struct mosquitto *mosq_sub = NULL;
    int ret;
    // mosquitto_lib_init();

    char message[512];
    snprintf(message, sizeof(message), "{\"action\":\"%s\",\"device_name\":\"/dev/%s\"}", (event->mask & IN_CREATE) ? "add" : "remove", event->name);

    char command[1000];
    pid_t pid;
    int status;
    if(strcmp(argv1, "-esp32c6_shakeHands") == 0) {
        sprintf(command, "esptool.py --chip esp32c6 --port /dev/%s --baud 921600 --before default_reset --after hard_reset chip_id", event->name);
    }else if(strcmp(argv1, "-esp32s3_shakeHands") == 0) {
        sprintf(command, "esptool.py --chip esp32s3 --port /dev/%s --baud 921600 --before default_reset --after hard_reset chip_id", event->name);
    }else if(strcmp(argv1, "-esp32c3_shakeHands") == 0) {
        sprintf(command, "esptool.py --chip esp32c3 --port /dev/%s --baud 921600 --before default_reset --after hard_reset chip_id", event->name);
    }


    pid = fork();


    if (pid == -1) {    // 出错处理
        perror("fork failed");  
        exit(EXIT_FAILURE);
    } else if (pid == 0) {  // 子进程-执行命令并发布mqtt主题
        // 1、初始化Mosquitto库
        mosq_sub = mosquitto_new(NULL, true, NULL);
        if (!mosq_sub) {
            printf("Failed to initialize Mosquitto library\\n");
            exit(1);
        }
        // 2、设置连接回调函数
        mosquitto_connect_callback_set(mosq_sub, on_connect);
        // 3、连接到MQTT Broker
        ret = mosquitto_connect(mosq_sub, MQTT_HOST, port, keepalive);
        if (ret != MOSQ_ERR_SUCCESS) {
            printf("Failed to connect to MQTT Broker\\n");
            exit(1);
        }

        // 4、执行外部脚本
        status = system(command);
        if (status != 0) {
            printf("Command execution failed\\n");
        }else{
            // 5、发布MQTT消息
            char topic_str[512];
            sprintf(topic_str, "device/special_events/%s/%s", argv1, argv2);
            ret = mosquitto_publish(mosq_sub, NULL, topic_str, strlen(message), message, 0, false);
            if (ret != MOSQ_ERR_SUCCESS) {
                printf("Failed to publish MQTT message\\n");
                exit(1);
            }
        }

        // 6、断开与MQTT Broker的连接 并 清理Mosquitto库资源
        mosquitto_disconnect(mosq_sub);
        mosquitto_destroy(mosq_sub);
        // mosquitto_lib_cleanup();
        exit(0);
    } else {

    }
}


int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Usage: %s <argument>\\n", argv[0]);
        return 1;
    }

    printf("Received argument: %s\n", argv[1]);
    printf("Received argument: %s\n", argv[2]);

    // 注册SIGCHLD信号处理函数
    struct sigaction sa;
    memset(&sa, 0, sizeof(sa));
    sa.sa_handler = sigchld_handler;
    sigemptyset(&sa.sa_mask);
    sa.sa_flags = SA_RESTART; // 使被信号中断的系统调用自动重新启动
    if (sigaction(SIGCHLD, &sa, NULL) == -1) {
        perror("sigaction");
        exit(EXIT_FAILURE);
    }


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

            // 特殊事件1：esp32c6白片烧录的特殊事件
            if (strcmp(argv[1], "-esp32c6_shakeHands") == 0 && strstr(event->name, "ACM") != NULL) {
                if (event->mask & IN_CREATE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    handle_device_event(event, argv[1], argv[2]);
                }
                if (event->mask & IN_DELETE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    char path_name[512];
                    snprintf(path_name, sizeof(path_name), "{\"action\":\"%s\",\"device_name\":\"/dev/%s\"}", (event->mask & IN_CREATE) ? "add" : "remove", event->name);
                    char topic_str[512];
                    sprintf(topic_str, "device/special_events/%s/%s", argv[1], argv[2]);
                    mqtt_send_message(mosq, topic_str, path_name);
                }
            }

            // 特殊事件2：esp32s3白片烧录的特殊事件
            else if (strcmp(argv[1], "-esp32s3_shakeHands") == 0 && strstr(event->name, "ACM") != NULL) {
                if (event->mask & IN_CREATE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    handle_device_event(event, argv[1], argv[2]);
                }
                if (event->mask & IN_DELETE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    char path_name[512];
                    snprintf(path_name, sizeof(path_name), "{\"action\":\"%s\",\"device_name\":\"/dev/%s\"}", (event->mask & IN_CREATE) ? "add" : "remove", event->name);
                    char topic_str[512];
                    sprintf(topic_str, "device/special_events/%s/%s", argv[1], argv[2]);
                    mqtt_send_message(mosq, topic_str, path_name);
                }
            }

            // 特殊事件3：esp32c3白片烧录的特殊事件
            else if (strcmp(argv[1], "-esp32c3_shakeHands") == 0 && strstr(event->name, "ACM") != NULL) {
                if (event->mask & IN_CREATE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    handle_device_event(event, argv[1], argv[2]);
                }
                if (event->mask & IN_DELETE) {
                    printf("%s: %s\n", (event->mask & IN_CREATE) ? "Created" : "Deleted", event->name);
                    char path_name[512];
                    snprintf(path_name, sizeof(path_name), "{\"action\":\"%s\",\"device_name\":\"/dev/%s\"}", (event->mask & IN_CREATE) ? "add" : "remove", event->name);
                    char topic_str[512];
                    sprintf(topic_str, "device/special_events/%s/%s", argv[1], argv[2]);
                    mqtt_send_message(mosq, topic_str, path_name);
                }
            }

            // 特殊事件4：待定
            // ......

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
