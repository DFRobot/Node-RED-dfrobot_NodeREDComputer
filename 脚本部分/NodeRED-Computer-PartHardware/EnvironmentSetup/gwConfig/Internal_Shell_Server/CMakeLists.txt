cmake_minimum_required(VERSION 3.10)
project(internalServer)

set(CMAKE_CXX_STANDARD 11)

# 包含头文件目录
include_directories(${CMAKE_CURRENT_SOURCE_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/json)

# 添加可执行文件
add_executable(internalServer internalServer.cpp json/jsoncpp.cpp)

target_link_libraries(internalServer pthread)
target_include_directories(internalServer PRIVATE ${CMAKE_SOURCE_DIR})
