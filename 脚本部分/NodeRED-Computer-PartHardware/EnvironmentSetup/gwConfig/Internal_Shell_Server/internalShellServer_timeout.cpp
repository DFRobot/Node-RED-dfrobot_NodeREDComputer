
#include <iostream>
#include <string>
#include <cstdlib>
#include <future>
#include <chrono>
#include <memory>
#include "httplib.h"
#include "json/json.h"


std::string execute_command(const std::string& cmd, int timeout) {
    std::string data;
    std::array<char, 128> buffer;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd.c_str(), "r"), pclose);
    if (!pipe) {
        return "Failed to run command";
    }

    auto start = std::chrono::high_resolution_clock::now();
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        data += buffer.data();
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> elapsed = end - start;
        if (elapsed.count() > timeout) {
            // Timeout, kill the process
            std::string killCmd = "killall " + cmd.substr(0, cmd.find(' ')); // Be very careful with killall
            system(killCmd.c_str());
            return "Command timeout";
        }
    }
    return data;
}

void handle_shell(const httplib::Request& req, httplib::Response& res) {
    if (req.method == "POST") {
        Json::Value root;
        Json::Reader reader;
        bool parsingSuccessful = reader.parse(req.body, root);
        if (parsingSuccessful) {

            std::string command = root["command"].asString();
            std::string identity = root["identity"].asString();

            if(identity == "BOM"){
                // Execute command with timeout
                auto future = std::async(std::launch::async, execute_command, command, 10);
                std::future_status status = future.wait_for(std::chrono::seconds(10));

                if (status == std::future_status::timeout) {
                    // Handle timeout
                    res.set_content("Command execution timeout", "text/plain");
                } else {
                    // Command executed within timeout
                    std::string result = future.get();
                    res.set_content(result, "text/plain");
                }
            }else{
                res.set_content("Authentication failed", "text/plain");
            }

        } else {
            res.set_content("Failed to parse JSON", "text/plain");
            std::cout << "Failed to parse JSON" << std::endl;
            res.status = 400;
        }
    } else {
        res.status = 405;
    }
}

int main() {
    httplib::Server svr;

    svr.Post("/linuxdev/internal/shell", handle_shell);

    svr.listen("0.0.0.0", 18080); // Listen on all interfaces for demonstration purposes

    return 0;
}
