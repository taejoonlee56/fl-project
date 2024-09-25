
import json
import sys
from time import sleep
import socketio
################## JSON 관련 문법 ##########################

# JSON 읽기
# with open("./ServerAccuracy/data.json",'r', ) as json_file:
#     json_data = json.load(json_file)

# JSON 저장
# def save_file(results):
#     with open("./ServerAccuracy/data.json", "w") as c:
#         json.dump(results, c)
        

############################################################


class fl_carla_listner:
    def __init__(self):
        self.sio = socketio.Client()
        self.sio.connect('http://localhost:8080')
        self.sio.emit(f'fl-carla-listener',  "hello")
        
        self.server_results = []
        self.server_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
        self.client_results = []
        self.client_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
        self.save_file("./ServerAccuracy/data.json", self.server_results)
        self.save_file("./ClientAccuracy/data.json", self.client_results)


        @self.sio.on('get_server_acc')
        def get_server_acc(fl_server_data:dict):
            self.server_results = []
            self.server_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
            for accuracys in fl_server_data.values():
                for index, accuracy in enumerate(accuracys, 1):
                    self.server_results.append([index, 0,0, accuracy, "Server"])
                    self.save_file("./ServerAccuracy/data.json", self.server_results)
                
        @self.sio.on('get_client_acc')
        def get_client_acc(fl_client_data:dict):
            self.client_results = []
            self.client_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
            for client_id in fl_client_data.keys():
                for index, accuracy in enumerate(fl_client_data[client_id], 1):
                    self.client_results.append([index, 0, 0, accuracy, client_id])
                    self.save_file("./ClientAccuracy/data.json", self.client_results)

        @self.sio.on('initialize_fl')
        def initialize(message:str):
            self.server_results = []
            self.server_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
            self.client_results = []
            self.client_results.append(["Year", "Life Expectancy", "Population", "Income", "Country"])
            self.save_file("./ServerAccuracy/data.json", self.server_results)
            self.save_file("./ClientAccuracy/data.json", self.client_results)

    def save_file(self, path, results):
        with open(path, "w") as c:
            json.dump(results, c)

    def disconnect(self):
        self.sio.disconnect()
        self.save_file("./ServerAccuracy/data_backup.json", self.server_results)
        self.save_file("./ClientAccuracy/data_backup.json", self.client_results)
        print("Done")


listner = fl_carla_listner()

try:
    print("Listening..")
except KeyboardInterrupt:
    listner.disconnect()
    print("Bye")
    